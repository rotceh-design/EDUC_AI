import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';

// ── Schools ───────────────────────────────────────────────────────────────────
export const getSchool    = (id)   => getDoc(doc(db,'schools',id)).then(s=>s.data());
export const createSchool = (data) => addDoc(collection(db,'schools'),{...data,createdAt:serverTimestamp()}).then(r=>r.id);
export const updateSchool = (id,d) => updateDoc(doc(db,'schools',id),{...d,updatedAt:serverTimestamp()});

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUser = (uid) => getDoc(doc(db,'users',uid)).then(s=>({id:s.id,...s.data()}));

export const getUsersBySchool = async (schoolId, role=null) => {
  let q = query(collection(db,'users'), where('schoolId','==',schoolId));
  if (role) q = query(q, where('role','==',role));
  const snap = await getDocs(q);
  return snap.docs.map(d=>({id:d.id,...d.data()}));
};

export const updateUser = (uid,d) => updateDoc(doc(db,'users',uid),{...d,updatedAt:serverTimestamp()});
export const deleteUser = (uid)   => deleteDoc(doc(db,'users',uid));

// ── Courses ───────────────────────────────────────────────────────────────────
export const getCoursesBySchool  = async (schoolId)   => {
  const q = query(collection(db,'courses'),where('schoolId','==',schoolId),orderBy('createdAt','desc'));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};
export const getCoursesByTeacher = async (teacherId) => {
  const q = query(collection(db,'courses'),where('teacherId','==',teacherId),orderBy('createdAt','desc'));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};
export const createCourse = (data) => addDoc(collection(db,'courses'),{...data,createdAt:serverTimestamp()}).then(r=>r.id);
export const updateCourse = (id,d) => updateDoc(doc(db,'courses',id),{...d,updatedAt:serverTimestamp()});
export const deleteCourse = (id)   => deleteDoc(doc(db,'courses',id));
export const getCourse    = (id)   => getDoc(doc(db,'courses',id)).then(s=>({id:s.id,...s.data()}));

// ── Classes ───────────────────────────────────────────────────────────────────
export const getClassesByCourse = async (courseId) => {
  const q = query(collection(db,'classes'),where('courseId','==',courseId),orderBy('createdAt','desc'));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};
export const getClass    = (id)    => getDoc(doc(db,'classes',id)).then(s=>({id:s.id,...s.data()}));
export const createClass = (data)  => addDoc(collection(db,'classes'),{...data,createdAt:serverTimestamp()}).then(r=>r.id);
export const deleteClass = (id)    => deleteDoc(doc(db,'classes',id));
export const listenClasses = (courseId, cb) => {
  const q = query(collection(db,'classes'),where('courseId','==',courseId),orderBy('createdAt','desc'));
  return onSnapshot(q, s => cb(s.docs.map(d=>({id:d.id,...d.data()}))));
};

// ── Progress ──────────────────────────────────────────────────────────────────
export const saveProgress = async (data) => {
  const id = `${data.studentId}_${data.classId}_${data.styleId}`;
  await setDoc(doc(db,'progress',id),{...data,updatedAt:serverTimestamp()},{merge:true});
};

export const getProgressByStudent = async (studentId, schoolId) => {
  const q = query(collection(db,'progress'),where('studentId','==',studentId),where('schoolId','==',schoolId),orderBy('updatedAt','desc'),limit(100));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};

export const getProgressByCourse = async (courseId) => {
  const q = query(collection(db,'progress'),where('courseId','==',courseId));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};

export const getProgressBySchool = async (schoolId) => {
  const q = query(collection(db,'progress'),where('schoolId','==',schoolId),orderBy('updatedAt','desc'),limit(500));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const createAlert = (data) => addDoc(collection(db,'alerts'),{...data,createdAt:serverTimestamp(),read:false});
export const markAlertRead = (id)  => updateDoc(doc(db,'alerts',id),{read:true});
export const getAlertsBySchool = async (schoolId) => {
  const q = query(collection(db,'alerts'),where('schoolId','==',schoolId),orderBy('createdAt','desc'),limit(50));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};
export const getAlertsByTeacher = async (teacherId) => {
  const q = query(collection(db,'alerts'),where('teacherId','==',teacherId),where('read','==',false),orderBy('createdAt','desc'));
  const s = await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
};

// ── File Upload ───────────────────────────────────────────────────────────────
export const uploadFile = async (file, path) => {
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
};
