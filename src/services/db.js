import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';

// ── UTILIDAD: Validación de Seguridad 🛡️ ─────────────────────────────────────
const isValidId = (id) => id && typeof id === 'string' && id.trim() !== '';

// ── Schools (Instituciones) ───────────────────────────────────────────────────
export const getSchool = async (id) => {
  if (!isValidId(id)) return null;
  try {
    const s = await getDoc(doc(db, 'schools', id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch (e) { return null; }
};

export const createSchool = (data) => 
  addDoc(collection(db, 'schools'), { ...data, createdAt: serverTimestamp() }).then(r => r.id);

// ── Users (Alumnos y Profesores) ──────────────────────────────────────────────
export const getUser = async (uid) => {
  if (!isValidId(uid)) return null;
  try {
    const s = await getDoc(doc(db, 'users', uid));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch (e) { return null; }
};

export const getUsersBySchool = async (schoolId, role = null) => {
  if (!isValidId(schoolId)) return [];
  try {
    let q = query(collection(db, 'users'), where('schoolId', '==', schoolId));
    if (role) q = query(q, where('role', '==', role));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const updateUser = (uid, d) => 
  updateDoc(doc(db, 'users', uid), { ...d, updatedAt: serverTimestamp() });

export const deleteUser = (uid) => deleteDoc(doc(db, 'users', uid));

// ── ClassGroups (Aulas / Cursos Base) 🏫 ──────────────────────────────────────
export const getClassGroupsBySchool = async (schoolId) => {
  if (!isValidId(schoolId)) return [];
  try {
    const q = query(collection(db, 'classGroups'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

// ── Courses (Materias / Asignaturas) 📚 ───────────────────────────────────────
export const getCourse = async (id) => {
  if (!isValidId(id)) return null;
  try {
    const s = await getDoc(doc(db, 'courses', id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch (e) { return null; }
};

export const getCoursesBySchool = async (schoolId) => {
  if (!isValidId(schoolId)) return [];
  try {
    const q = query(collection(db, 'courses'), where('schoolId', '==', schoolId));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const getCoursesByTeacher = async (teacherId) => {
  if (!isValidId(teacherId)) return [];
  try {
    const q = query(collection(db, 'courses'), where('teacherId', '==', teacherId));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const createCourse = (data) => 
  addDoc(collection(db, 'courses'), { ...data, createdAt: serverTimestamp() }).then(r => r.id);

export const deleteCourse = (id) => deleteDoc(doc(db, 'courses', id));

// ── Classes (Contenido de las Lecciones) 📄 ───────────────────────────────────

// 🔥 AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA 🔥
export const getClass = async (id) => {
  if (!isValidId(id)) return null;
  try {
    const s = await getDoc(doc(db, 'classes', id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch (e) { 
    console.error("Error en getClass:", e);
    return null; 
  }
};

export const getClassesByCourse = async (courseId) => {
  if (!isValidId(courseId)) return [];
  try {
    const q = query(collection(db, 'classes'), where('courseId', '==', courseId));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const createClass = (data) => 
  addDoc(collection(db, 'classes'), { ...data, createdAt: serverTimestamp() }).then(r => r.id);

export const deleteClass = (id) => deleteDoc(doc(db, 'classes', id));

export const listenClasses = (courseId, cb) => {
  if (!isValidId(courseId)) return () => {}; 
  const q = query(collection(db, 'classes'), where('courseId', '==', courseId));
  return onSnapshot(q, s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ── Progress & Analytics (Métricas Reales) 📊 ─────────────────────────────────
export const saveProgress = async (data) => {
  const id = `${data.studentId}_${data.classId}_${data.styleId}`;
  await setDoc(doc(db, 'progress', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const getProgressByStudent = async (studentId, schoolId) => {
  if (!isValidId(studentId)) return [];
  try {
    const q = query(collection(db, 'progress'), where('studentId', '==', studentId), where('schoolId', '==', schoolId));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const getProgressByCourse = async (courseId) => {
  if (!isValidId(courseId)) return [];
  try {
    const q = query(collection(db, 'progress'), where('courseId', '==', courseId));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const getProgressBySchool = async (schoolId) => {
  if (!isValidId(schoolId)) return [];
  try {
    const q = query(collection(db, 'progress'), where('schoolId', '==', schoolId), limit(1000));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};

// ── File Upload (Firebase Storage) 📁 ──────────────────────────────────────────
export const uploadFile = async (file, path) => {
  try {
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  } catch (e) {
    console.error("Error subiendo archivo:", e);
    return null;
  }
};