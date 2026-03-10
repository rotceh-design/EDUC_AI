import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { C } from '@/theme';
import { Btn, Input, Alert, Spinner } from '@/components/ui';

// ── ICONOS SVG FUTURISTAS ─────────────────────────────────────────────────────
const Ico = {
  Rut: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" ry="3"/>
      <circle cx="9" cy="10" r="2.5"/>
      <line x1="15" y1="9" x2="19" y2="9"/>
      <line x1="15" y1="13" x2="19" y2="13"/>
      <path d="M4.5 18c0-2.5 3-3.5 4.5-3.5s4.5 1 4.5 3.5"/>
    </svg>
  ),
  Login: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Settings: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Shield: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
};

const PATHS = { admin: '/admin', teacher: '/teacher', student: '/student' };

export default function Login() {
  const { login, registerUser, profile, loading: al } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [rut, setRut]         = useState('');
  
  // Datos Admin
  const [adminPassLogin, setAdminPassLogin] = useState('');
  const [secretKey, setSecretKey]           = useState('');
  const [instName, setInstName]             = useState('');
  const [adminName, setAdminName]           = useState('');
  const [adminRut, setAdminRut]             = useState('');
  const [adminEmail, setAdminEmail]         = useState('');
  const [adminPass, setAdminPass]           = useState('');

  // 🪄 FIX: Redirección segura fuera del renderizado
  useEffect(() => {
    if (!al && profile && PATHS[profile.role]) {
      navigate(PATHS[profile.role], { replace: true });
    }
  }, [al, profile, navigate]);

  // --- LÓGICA DE LOGIN MÁGICO Y AUTO-SANACIÓN ---
  const handleMagicLogin = async (e) => {
    e.preventDefault();
    if (!rut) { setError('Por favor ingresa tu RUT para acceder.'); return; }
    
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'users'), where('rut', '==', rut));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Este RUT no está registrado en el colegio.');
        setLoading(false); return;
      }

      const activeDoc = snap.docs.find(d => d.data().uid != null);
      const ghostDoc  = snap.docs.find(d => d.data().uid == null);
      const targetDoc = activeDoc || ghostDoc;
      const data = targetDoc.data();

      if (data.role === 'admin') {
        setError('Acceso denegado. Ingresa por el Portal de Administración (Escudo Arriba).');
        setLoading(false); return;
      }

      const cleanRut = rut.replace(/[^0-9kK]/g, '').toLowerCase();
      const autoEmail = `${cleanRut}@sistema.educai.app`; 
      const autoPass  = `Edu_${cleanRut}_AI_2026`; 

      if (activeDoc) {
        await login(autoEmail, autoPass);
        if (ghostDoc) {
          const mergedCourses = [...new Set([...(data.enrolledCourses || []), ...(ghostDoc.data().enrolledCourses || [])])];
          await updateDoc(doc(db, 'users', activeDoc.data().uid), { enrolledCourses: mergedCourses });
          await deleteDoc(doc(db, 'users', ghostDoc.id));
        }
      } else if (ghostDoc) {
        try {
          const newUser = await registerUser({ 
            email: autoEmail, password: autoPass, name: data.name, role: data.role, 
            rut: data.rut, course: data.course || null, schoolId: data.schoolId
          });
          
          await updateDoc(doc(db, 'users', newUser.uid), { enrolledCourses: data.enrolledCourses || [] });

          // 🔥 LA MAGIA: Si es profesor, vinculamos sus cursos creados por el Admin
          if (data.role === 'teacher') {
            const coursesQ = query(collection(db, 'courses'), where('teacherId', '==', ghostDoc.id));
            const coursesSnap = await getDocs(coursesQ);
            for (const cDoc of coursesSnap.docs) {
              await updateDoc(doc(db, 'courses', cDoc.id), { teacherId: newUser.uid });
            }
          }
          await deleteDoc(doc(db, 'users', ghostDoc.id));

        } catch (authErr) {
          // 🛠️ AUTO-SANACIÓN (Corrige el error 400 Bad Request)
          if (authErr.code === 'auth/email-already-in-use') {
            const userCred = await login(autoEmail, autoPass);
            await updateDoc(doc(db, 'users', ghostDoc.id), { uid: userCred.user.uid });
          } else {
            throw authErr;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError('Error al iniciar sesión. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!rut || !adminPassLogin) { setError('Ingresa tu RUT y contraseña.'); return; }
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'users'), where('rut', '==', rut), where('role', '==', 'admin'));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('RUT no encontrado o no tiene permisos de Administrador.');
        setLoading(false); return;
      }
      const adminData = snap.docs[0].data();
      await login(adminData.email, adminPassLogin);
    } catch (e) { setError('Contraseña incorrecta.'); }
    setLoading(false);
  };

  const handleSecretKeySubmit = (e) => {
    e.preventDefault();
    if (secretKey === '1234') { setStep(4); setError(''); setSecretKey(''); } 
    else setError('Clave de autorización incorrecta.');
  };

  const handleRegisterInstitution = async (e) => {
    e.preventDefault();
    if (!instName || !adminName || !adminRut || !adminEmail || !adminPass) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await registerUser({ email: adminEmail, password: adminPass, name: adminName, role: 'admin', rut: adminRut, schoolId: instName });
    } catch(e) { setError('Error al crear la institución.'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Botón Izquierdo: Acceso Admin */}
      <button onClick={() => { setStep(5); setError(''); setRut(''); setAdminPassLogin(''); }} style={{ position: 'absolute', top: '24px', left: '24px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', cursor: 'pointer', zIndex: 10, display:'flex', alignItems:'center', gap:'6px' }}>
        <Ico.Shield s={16}/> Acceso Admin
      </button>

      {/* Botón Derecho: Crear Institución */}
      <button onClick={() => { setStep(3); setError(''); }} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', cursor: 'pointer', zIndex: 10, display:'flex', alignItems:'center', gap:'6px' }}>
        <Ico.Settings s={16}/> Configurar Inst.
      </button>

      {/* Decoración Neón */}
      <div style={{ position: 'fixed', top: '-150px', right: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle,${C.accent}15 0%,transparent 60%)`, pointerEvents: 'none', filter: 'blur(40px)' }} />
      <div style={{ position: 'fixed', bottom: '-200px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle,${C.green}12 0%,transparent 60%)`, pointerEvents: 'none', filter: 'blur(50px)' }} />

      <div className="anim-fade-up" style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ width:'86px', height:'86px', borderRadius:'22px', background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px', boxShadow:`0 10px 30px -10px ${C.accent}30` }}>
            <img src="/src/assets/logo.png" alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: '34px', fontWeight: 700 }}>
            educ<span style={{color: C.accent}}>_AI</span>
          </h1>
          <p style={{ color: C.muted, fontSize: '14px', marginTop: '6px' }}>Plataforma Educativa Inteligente</p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }}>
          
          {step === 1 && (
            <form onSubmit={handleMagicLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: C.text, marginBottom: '6px' }}>Ingreso al portal</h2>
                <p style={{ fontSize: '13px', color: C.muted }}>Ingresa tu RUT para acceder directamente.</p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: C.muted }}><Ico.Rut s={20} /></div>
                <input type="text" placeholder="12.345.678-9" value={rut} onChange={e=>setRut(e.target.value)} style={{ width: '100%', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: '12px', padding: '14px 14px 14px 44px', color: C.text, fontSize: '15px', outline: 'none' }} />
              </div>
              {error && <Alert type="error">{error}</Alert>}
              <button disabled={loading} type="submit" style={{ width: '100%', background: C.accent, color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <Spinner size={20} color="#fff" /> : <>Acceder <Ico.Login s={18} /></>}
              </button>
            </form>
          )}

          {step === 5 && (
            <form onSubmit={handleAdminLogin} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', background: `${C.accent}15`, padding: '12px', borderRadius: '50%', color: C.accent, marginBottom: '12px' }}><Ico.Shield s={28} /></div>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Panel de Administración</h2>
              </div>
              <Input label="RUT Administrador" placeholder="12345678-9" value={rut} onChange={e=>setRut(e.target.value)} />
              <Input label="Contraseña" type="password" placeholder="••••••••" value={adminPassLogin} onChange={e=>setAdminPassLogin(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" loading={loading} full color={C.accent}>Ingresar al Panel</Btn>
              <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSecretKeySubmit} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>Acceso Restringido</h2>
              <Input label="Clave de Autorización" type="password" placeholder="••••" value={secretKey} onChange={e=>setSecretKey(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" full color="#1f1f1f">Validar Clave</Btn>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleRegisterInstitution} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>Nueva Institución</h2>
              <Input label="Nombre Institución" placeholder="Ej: Colegio Hannover" value={instName} onChange={e=>setInstName(e.target.value)} />
              <Input label="Nombre Admin" placeholder="Juan Pérez" value={adminName} onChange={e=>setAdminName(e.target.value)} />
              <Input label="RUT Admin" placeholder="12345678-9" value={adminRut} onChange={e=>setAdminRut(e.target.value)} />
              <Input label="Correo Admin" type="email" placeholder="admin@colegio.cl" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} />
              <Input label="Contraseña" type="password" placeholder="••••••••" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" loading={loading} full color="#1f1f1f">Crear Institución</Btn>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}