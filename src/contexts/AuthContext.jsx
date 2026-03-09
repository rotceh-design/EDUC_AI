import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword, signInWithPopup,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setUser(null); setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // Modificado para aceptar el rol y los datos extra (RUT, teacherId) si es usuario nuevo
  const loginWithGoogle = async (role = 'pending', extraData = {}) => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    
    // Si el usuario no existe en Firestore, lo creamos con sus datos
    if (!snap.exists()) {
      const p = {
        uid: fbUser.uid, email: fbUser.email,
        name: fbUser.displayName || fbUser.email,
        photo: fbUser.photoURL || null,
        role: role, 
        schoolId: extraData.schoolId || null,
        rut: extraData.rut || null,
        teacherId: extraData.teacherId || null,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', fbUser.uid), p);
      setProfile(p);
    } else { 
      setProfile(snap.data()); 
    }
    return result;
  };

  const logout = () => signOut(auth);

  // Modificado para incluir el RUT y el teacherId al crear la cuenta con correo
  const registerUser = async ({ email, password, name, role, schoolId, rut, teacherId }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const p = {
      uid: cred.user.uid, email, 
      name: name || email.split('@')[0], // Asigna un nombre por defecto si no lo envían
      role: role || 'pending', 
      schoolId: schoolId || null,
      rut: rut || null,
      teacherId: teacherId || null,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), p);
    setProfile(p); // Actualizamos el perfil inmediatamente para evitar recargas
    return cred.user;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    setProfile(snap.exists() ? snap.data() : null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      role: profile?.role ?? null,
      schoolId: profile?.schoolId ?? null,
      isAdmin:   profile?.role === 'admin',
      isTeacher: profile?.role === 'teacher',
      isStudent: profile?.role === 'student',
      isPending: profile?.role === 'pending',
      login, loginWithGoogle, logout, registerUser, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};