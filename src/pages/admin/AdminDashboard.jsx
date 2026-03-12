import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, Btn, Modal, Input, Select, StatCard, SectionHeader, Alert, EmptyState, Spinner, Tabs, Badge } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

import { getStudentMetrics } from '@/services/analyticsService';
import { analyzeDropoutRisk } from '@/services/aiService';

// ── LIBRERÍA DE ICONOS SVG PROFESIONALES ─────────────────────────────────────
const Ico = {
  Teacher: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Student: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Book: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Users: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chart: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>,
  Download: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Check: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Settings: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Activity: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Mail: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
};

const initialUserState = { role: 'student', rut: '', name: '', email: '', phone: '', guardian: '', specialty: '', classGroupId: '' };
const initialClassGroupState = { name: '', level: '', year: new Date().getFullYear().toString() };
const initialMateriaState = { name: '', teacherId: '' };

const getRealOnlineStatus = (lastActiveTimestamp) => {
  if (!lastActiveTimestamp) return { color: C.muted, text: 'Sin ingreso', dot: '#64748b' };
  const d = lastActiveTimestamp.toDate ? lastActiveTimestamp.toDate() : new Date(lastActiveTimestamp);
  const diffMins = Math.floor((Date.now() - d) / 60000);
  if (diffMins < 15) return { color: C.green, text: 'Online ahora', dot: '#10b981' };
  if (diffMins < 1440) return { color: C.amber, text: `Hace ${Math.floor(diffMins/60)||1} hrs`, dot: '#f59e0b' };
  return { color: C.textSub, text: `Hace ${Math.floor(diffMins/1440)} días`, dot: '#94a3b8' };
};

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recientemente';
  const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
  if (diff < 60) return `Hace ${diff || 1} min`;
  if (diff < 1440) return `Hace ${Math.floor(diff/60)} hrs`;
  return `Hace ${Math.floor(diff/1440)} días`;
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const actualSchoolId = profile?.schoolId;

  const [tab, setTab]       = useState('Resumen');
  const [school, setSchool] = useState(null);
  
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classGroups, setClassGroups] = useState([]); 
  const [courses,  setCourses]  = useState([]);      
  const [loading,  setLoading]  = useState(true);
  
  // Modales
  const [userModal, setUserModal]             = useState(false);
  const [classGroupModal, setClassGroupModal] = useState(false);
  const [materiaModal, setMateriaModal]       = useState(null); 
  const [assignModal, setAssignModal]         = useState(null); 
  const [viewTeacher, setViewTeacher]         = useState(null); 
  const [editMateria, setEditMateria]         = useState(null); 

  // IA y Analytics
  const [analyzingStats, setAnalyzingStats] = useState(false);
  const [teacherStats, setTeacherStats]     = useState(null);
  const [studentStats, setStudentStats]     = useState(null);

  // Forms
  const [newUser, setNewUser]             = useState(initialUserState);
  const [newClassGroup, setNewClassGroup] = useState(initialClassGroupState);
  const [newMateria, setNewMateria]       = useState(initialMateriaState);
  
  const [selectedAulaId, setSelectedAulaId] = useState('');
  const [assignMateriaToTeacherId, setAssignMateriaToTeacherId] = useState('');
  const [assignCourseIdToStudent, setAssignCourseIdToStudent] = useState('');

  const [saving, setSaving]     = useState(false);
  const [modalErr, setModalErr] = useState('');
  const [success, setSuccess]   = useState('');
  const [reportBusy, setReportBusy] = useState(false);

  // ── MOTOR DE CARGA ──
  const load = async () => {
    if (!actualSchoolId) return;
    setLoading(true);
    try {
      let schData = { name: actualSchoolId };
      try {
        const schDoc = await getDoc(doc(db, 'schools', actualSchoolId));
        if (schDoc.exists()) schData = schDoc.data();
      } catch (err) {}
      
      const usersSnap = await getDocs(query(collection(db, 'users'), where('schoolId', '==', actualSchoolId)));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachers(allUsers.filter(u => u.role === 'teacher').sort((a,b) => a.name.localeCompare(b.name)));
      setStudents(allUsers.filter(u => u.role === 'student').sort((a,b) => a.name.localeCompare(b.name)));

      const cgSnap = await getDocs(query(collection(db, 'classGroups'), where('schoolId', '==', actualSchoolId)));
      setClassGroups(cgSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.name.localeCompare(b.name)));

      const cSnap = await getDocs(query(collection(db, 'courses'), where('schoolId', '==', actualSchoolId)));
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSchool(schData);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (actualSchoolId) load(); }, [actualSchoolId]);

  // ── ANALÍTICA PROFUNDA EN MODALES ──
  const handleOpenTeacherModal = async (teacher) => {
    setViewTeacher(teacher);
    setAnalyzingStats(true);
    try {
      // 1. Cursos que imparte
      const tCourses = courses.filter(c => c.teacherId === teacher.id).map(c => c.id);
      // 2. Alumnos matriculados en sus cursos
      const tStudents = students.filter(s => s.enrolledCourses?.some(cId => tCourses.includes(cId)));
      // 3. Clases publicadas por él
      const classesSnap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', teacher.id)));
      
      setTeacherStats({
        totalCourses: tCourses.length,
        totalStudents: tStudents.length,
        totalClassesUploaded: classesSnap.size
      });
    } catch (e) { console.error(e); }
    setAnalyzingStats(false);
  };

  const handleOpenStudentModal = async (student) => {
    setAssignModal(student);
    setAnalyzingStats(true);
    try {
      const metrics = await getStudentMetrics(student.uid || student.id, actualSchoolId);
      setStudentStats(metrics);
    } catch (e) { console.error(e); }
    setAnalyzingStats(false);
  };

  // ── ACCIONES PRINCIPALES ──
  const handleCreateClassGroup = async () => {
    if (!newClassGroup.name || !newClassGroup.level) { setModalErr('Completa nombre y nivel'); return; }
    setSaving(true); setModalErr('');
    try {
      await addDoc(collection(db, 'classGroups'), {
        name: newClassGroup.name, level: newClassGroup.level, year: newClassGroup.year,
        schoolId: actualSchoolId, createdAt: serverTimestamp()
      });
      setClassGroupModal(false); setNewClassGroup(initialClassGroupState);
      setSuccess('✓ Aula creada'); load(); setTimeout(()=>setSuccess(''), 3000);
    } catch(e) { setModalErr(e.message); }
    setSaving(false);
  };

  const handleCreateMateria = async () => {
    if (!newMateria.name || !newMateria.teacherId) { setModalErr('Falta nombre o profesor'); return; }
    setSaving(true); setModalErr('');
    try {
      const parentAula = classGroups.find(cg => cg.id === materiaModal);
      const docRef = await addDoc(collection(db, 'courses'), {
        name: newMateria.name, subject: newMateria.name, grade: parentAula?.name || '',
        classGroupId: materiaModal, teacherId: newMateria.teacherId, schoolId: actualSchoolId, createdAt: serverTimestamp()
      });

      const studentsInAula = students.filter(s => s.classGroupId === materiaModal);
      for(const st of studentsInAula) {
        await updateDoc(doc(db, 'users', st.id), { enrolledCourses: [...(st.enrolledCourses || []), docRef.id] });
      }
      setMateriaModal(null); setNewMateria(initialMateriaState);
      setSuccess(`✓ Materia añadida`); load(); setTimeout(()=>setSuccess(''), 3000);
    } catch(e) { setModalErr(e.message); }
    setSaving(false);
  };

  const handleUpdateMateria = async () => {
    if (!editMateria.name || !editMateria.teacherId) { setModalErr('Faltan datos'); return; }
    setSaving(true); setModalErr('');
    try {
      await updateDoc(doc(db, 'courses', editMateria.id), {
        name: editMateria.name, subject: editMateria.name, teacherId: editMateria.teacherId
      });
      setEditMateria(null); setSuccess('✓ Materia actualizada'); load(); setTimeout(()=>setSuccess(''), 3000);
    } catch(e) { setModalErr(e.message); }
    setSaving(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.rut) { setModalErr('Nombre y RUT obligatorios.'); return; }
    setSaving(true); setModalErr('');
    try {
      const enrolled = newUser.role === 'student' && newUser.classGroupId 
        ? courses.filter(c => c.classGroupId === newUser.classGroupId).map(c => c.id) : [];

      await addDoc(collection(db, 'users'), {
        name: newUser.name, rut: newUser.rut, role: newUser.role, email: newUser.email || null, phone: newUser.phone || null,
        classGroupId: newUser.role === 'student' ? newUser.classGroupId : null,
        guardian: newUser.role === 'student' ? newUser.guardian : null,
        specialty: newUser.role === 'teacher' ? newUser.specialty : null,
        enrolledCourses: enrolled, schoolId: actualSchoolId, uid: null, xp: 0, createdAt: serverTimestamp()
      });
      setUserModal(false); setNewUser(initialUserState);
      setSuccess(`✓ Perfil registrado.`); load(); setTimeout(()=>setSuccess(''), 3000);
    } catch(e) { setModalErr(e.message); }
    setSaving(false);
  };

  const handleChangeStudentAula = async () => {
    if (!selectedAulaId || !assignModal) return;
    setSaving(true); setModalErr('');
    try {
      const newAulaMateriasIds = courses.filter(c => c.classGroupId === selectedAulaId).map(c => c.id);
      const mergedCourses = [...new Set([...(assignModal.enrolledCourses || []), ...newAulaMateriasIds])];
      
      await updateDoc(doc(db, 'users', assignModal.id), { classGroupId: selectedAulaId, enrolledCourses: mergedCourses });
      setAssignModal({ ...assignModal, classGroupId: selectedAulaId, enrolledCourses: mergedCourses });
      setSelectedAulaId(''); setSuccess('✓ Aula actualizada y materias vinculadas.'); setTimeout(()=>setSuccess(''), 3000); load();
    } catch (e) { setModalErr('Error al cambiar de aula'); }
    setSaving(false);
  };

  const handleAssignCourseToStudent = async () => {
    if (!assignCourseIdToStudent || !assignModal) return;
    setSaving(true); setModalErr('');
    try {
      const newEnrolled = [...new Set([...(assignModal.enrolledCourses || []), assignCourseIdToStudent])];
      await updateDoc(doc(db, 'users', assignModal.id), { enrolledCourses: newEnrolled });
      setAssignModal({ ...assignModal, enrolledCourses: newEnrolled });
      setAssignCourseIdToStudent(''); setSuccess('✓ Materia asignada al alumno'); setTimeout(()=>setSuccess(''), 3000); load();
    } catch (e) { setModalErr('Error al asignar materia'); }
    setSaving(false);
  };

  const handleRemoveCourseFromStudent = async (courseIdToRemove) => {
    if (!assignModal || !window.confirm('¿Desvincular esta materia del alumno?')) return;
    try {
      const newEnrolled = assignModal.enrolledCourses.filter(id => id !== courseIdToRemove);
      await updateDoc(doc(db, 'users', assignModal.id), { enrolledCourses: newEnrolled });
      setAssignModal({ ...assignModal, enrolledCourses: newEnrolled });
      load();
    } catch (e) { console.error(e); }
  };

  const handleAssignMateriaToTeacher = async () => {
    if (!assignMateriaToTeacherId || !viewTeacher) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'courses', assignMateriaToTeacherId), { teacherId: viewTeacher.id });
      setAssignMateriaToTeacherId(''); setSuccess('✓ Curso asignado al profesor'); setTimeout(()=>setSuccess(''), 3000); 
      handleOpenTeacherModal(viewTeacher); // Recarga las estadísticas del profe
      load();
    } catch(e) {}
    setSaving(false);
  };

  const handleRemoveCourseFromTeacher = async (courseId) => {
    if (!window.confirm('¿Quitarle esta materia al profesor?')) return;
    try {
      await updateDoc(doc(db, 'courses', courseId), { teacherId: '' });
      handleOpenTeacherModal(viewTeacher); // Recarga estadísticas
      load();
    } catch (e) { console.error(e); }
  };

  const handleDeleteCourse = async (courseId) => {
    if(window.confirm('¿Eliminar esta materia del sistema?')){
      try { await deleteDoc(doc(db, 'courses', courseId)); load(); } catch (e) { console.error(e); }
    }
  };

  const generateProfessionalReport = async (type) => {
    setReportBusy(true);
    let XLSX;
    try { XLSX = await import('xlsx'); }
    catch { alert('Por favor, instala la librería xlsx corriendo: npm install xlsx'); setReportBusy(false); return; }

    let sheets = [];
    const dateStr = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    let filename = `Reporte_${type}_${dateStr}`;

    if (type === 'academic') {
      filename = `Base_Datos_Alumnos_${dateStr}`;
      const rows = students.map(s => [
        s.rut, s.name, s.email || 'N/A', classGroups.find(cg => cg.id === s.classGroupId)?.name || 'Sin Aula',
        s.enrolledCourses?.length || 0, s.xp || 0, s.guardian || 'N/A', s.phone || 'N/A'
      ]);
      sheets.push({ name: 'Matrícula', headers: ['RUT', 'Nombre Completo', 'Email Institucional', 'Aula Base', 'Materias', 'Puntos XP', 'Apoderado', 'Teléfono'], rows, colWidths: [15, 35, 30, 20, 15, 15, 25, 15] });
    } else if (type === 'teachers') {
      filename = `Plantilla_Docente_${dateStr}`;
      const rows = teachers.map(t => [
        t.rut, t.name, t.email || 'N/A', t.specialty || 'General', courses.filter(c => c.teacherId === t.id).length, t.phone || 'N/A'
      ]);
      sheets.push({ name: 'Docentes Activos', headers: ['RUT', 'Nombre Profesor', 'Correo Electrónico', 'Especialidad', 'Materias Impartidas', 'Teléfono'], rows, colWidths: [15, 35, 30, 20, 25, 15] });
    } else if (type === 'courses') {
      filename = `Estructura_Institucional_${dateStr}`;
      const rows = courses.map(c => {
        const aula = classGroups.find(cg => cg.id === c.classGroupId);
        const profe = teachers.find(t => t.id === c.teacherId);
        return [aula?.name || 'Independiente', aula?.level || 'N/A', c.name, profe?.name || 'Sin Profesor Asignado', students.filter(s => s.enrolledCourses?.includes(c.id)).length];
      });
      sheets.push({ name: 'Desglose Materias', headers: ['Aula Perteneciente', 'Nivel', 'Nombre de la Materia', 'Profesor a Cargo', 'Alumnos Cursando'], rows, colWidths: [20, 15, 30, 30, 20] });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([sheets[0].headers, ...sheets[0].rows]);
    ws['!cols'] = sheets[0].colWidths.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, sheets[0].name);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setReportBusy(false);
  };

  const timelineData = [...students.map(s => ({...s, _type:'student'})), ...courses.map(c => ({...c, _type:'course'}))]
    .filter(item => item.createdAt)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, 7);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom:'28px' }}>
          <div>
            <h1 className="glow-text" style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, marginBottom:'4px' }}>Centro de Comando</h1>
            <p style={{ color:C.accent, fontSize:'13px', fontWeight: 600 }}>{school?.name || actualSchoolId} · Administración Central</p>
          </div>
        </div>

        {success && <div className="anim-fade-up" style={{ marginBottom:'14px' }}><Alert type="success">{success}</Alert></div>}

        <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'12px', marginBottom:'28px' }}>
          <div onClick={()=>setTab('Profesores')} style={{ cursor:'pointer', transition:'.2s' }}><StatCard label="Docentes" value={teachers.length} icon={<Ico.Teacher s={24} c={C.accent}/>} color={C.accent} /></div>
          <div onClick={()=>setTab('Alumnos')} style={{ cursor:'pointer', transition:'.2s' }}><StatCard label="Alumnos" value={students.length} icon={<Ico.Student s={24} c={C.green}/>} color={C.green} /></div>
          <div onClick={()=>setTab('Cursos y Materias')} style={{ cursor:'pointer', transition:'.2s' }}><StatCard label="Aulas Creadas" value={classGroups.length} icon={<Ico.Users s={24} c={C.amber}/>} color={C.amber} /></div>
          <div onClick={()=>setTab('Cursos y Materias')} style={{ cursor:'pointer', transition:'.2s' }}><StatCard label="Materias Totales" value={courses.length} icon={<Ico.Book s={24} c={C.violet}/>} color={C.violet} /></div>
        </div>

        <Tabs tabs={['Resumen', 'Cursos y Materias', 'Profesores', 'Alumnos', 'Reportes']} active={tab} onChange={setTab} />

        {loading ? <div style={{ display:'flex', justifyContent:'center', padding:'50px' }}><Spinner size={36} color={C.accent} /></div> : (
          <>
            {/* --- PESTAÑA: RESUMEN --- */}
            {tab === 'Resumen' && (
              <div className="anim-fade-up glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding:'20px', borderRadius:'16px' }}>
                <Card style={{ background:`${C.accent}08`, borderColor:`${C.accent}25` }}>
                  <h3 style={{ fontWeight:700, marginBottom:'12px', color:C.accent, display:'flex', alignItems:'center', gap:'8px' }}><Ico.Settings s={20} /> Accesos Rápidos</h3>
                  <div style={{ display:'flex', flexDirection: 'column', gap:'10px' }}>
                    <button onClick={()=>setClassGroupModal(true)} style={{ display:'flex', alignItems:'center', gap:'8px', background:C.amber, color:'#111', padding:'10px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'13px' }}><Ico.Plus s={16} /> Crear Aula Escolar</button>
                    <button onClick={()=>{ setNewUser({...initialUserState, role:'teacher'}); setUserModal(true); }} style={{ display:'flex', alignItems:'center', gap:'8px', background:C.accent, color:'#fff', padding:'10px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'13px' }}><Ico.Plus s={16} /> Registrar Profesor</button>
                    <button onClick={()=>{ setNewUser({...initialUserState, role:'student'}); setUserModal(true); }} style={{ display:'flex', alignItems:'center', gap:'8px', background:C.green, color:'#fff', padding:'10px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'13px' }}><Ico.Plus s={16} /> Matricular Alumno</button>
                  </div>
                </Card>
              </div>
            )}

            {/* --- PESTAÑA: ESTRUCTURA DE AULAS Y MATERIAS --- */}
            {tab === 'Cursos y Materias' && (
              <div className="anim-fade-up">
                <SectionHeader title="Gestión de Aulas" sub="Administra las aulas y sus materias asignadas." action={<Btn small color={C.amber} onClick={()=>setClassGroupModal(true)}>+ Crear Aula</Btn>} />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'16px' }}>
                  {classGroups.map(cg => {
                    const aulasMaterias = courses.filter(c => c.classGroupId === cg.id);
                    const aulasAlumnos = students.filter(s => s.classGroupId === cg.id).length;
                    return (
                      <Card key={cg.id} className="glass" style={{ padding:0, overflow:'hidden', border:`1px solid ${C.border}` }}>
                        <div style={{ background:C.surface, padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div><div style={{ fontWeight:700, fontSize:'18px', color:C.text }}>{cg.name}</div><div style={{ fontSize:'12px', color:C.muted }}>Nivel: {cg.level} · {cg.year}</div></div>
                          <div style={{ textAlign:'center', background:C.card, padding:'6px 12px', borderRadius:'8px', border:`1px solid ${C.borderHover}` }}>
                            <div style={{ fontWeight:700, fontSize:'16px', color:C.green }}>{aulasAlumnos}</div><div style={{ fontSize:'10px', color:C.muted }}>ALUMNOS</div>
                          </div>
                        </div>
                        <div style={{ padding:'16px 20px', background:C.card }}>
                          <div style={{ fontSize:'11px', fontWeight:600, color:C.textSub, textTransform:'uppercase', marginBottom:'10px' }}>Materias ({aulasMaterias.length})</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
                            {aulasMaterias.map(mat => {
                              const profe = teachers.find(t => t.id === mat.teacherId);
                              return (
                                <div key={mat.id} onClick={()=>setEditMateria(mat)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.surface, padding:'8px 12px', borderRadius:'8px', cursor:'pointer', border:`1px solid ${C.borderHover}`, transition:'.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.boxShadow=`0 0 10px ${C.accentSoft}`}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderHover; e.currentTarget.style.boxShadow='none'}}>
                                  <div>
                                    <div style={{ fontWeight:600, fontSize:'13px', color:C.text, display:'flex', alignItems:'center', gap:'6px' }}>{mat.name} <Ico.Edit s={12} c={C.muted}/></div>
                                    <div style={{ fontSize:'11px', color:C.muted, display:'flex', alignItems:'center', gap:'4px' }}><Ico.Teacher s={10}/> {profe ? profe.name : <span style={{color:C.red}}>Sin Asignar</span>}</div>
                                  </div>
                                  <button onClick={(e)=>{e.stopPropagation(); handleDeleteCourse(mat.id);}} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', opacity:0.6 }}><Ico.Trash s={14}/></button>
                                </div>
                              )
                            })}
                          </div>
                          <Btn full outline color={C.accent} onClick={() => setMateriaModal(cg.id)}>+ Añadir Materia</Btn>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- PESTAÑA PROFESORES --- */}
            {tab === 'Profesores' && (
              <div className="anim-fade-up">
                <SectionHeader title="Plantilla Docente" action={ <Btn small onClick={()=>{ setNewUser({...initialUserState, role:'teacher'}); setUserModal(true); }}>+ Nuevo Profesor</Btn> } />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'12px' }}>
                  {teachers.map(t=>{
                    const status = getRealOnlineStatus(t.lastActive);
                    return (
                      <Card key={t.id} className="glass" style={{ padding:'18px', opacity: t.uid ? 1 : 0.7, border:`1px solid ${C.borderHover}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                          <div style={{ width:42,height:42,borderRadius:'50%',background:`${C.accent}20`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.accent, border:`1px solid ${C.accent}40` }}><Ico.Teacher s={20} /></div>
                          <div> <div style={{ fontWeight:700, fontSize: '15px', color:C.text }}>{t.name}</div> <div style={{ color:C.muted,fontSize:'12px' }}>RUT: {t.rut}</div> </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surface, padding: '10px 12px', borderRadius: '8px', marginBottom: '14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:status.color }}><span style={{ width:8, height:8, borderRadius:'50%', background:status.dot, boxShadow:`0 0 8px ${status.dot}` }}></span> {status.text}</div>
                          <span style={{ fontSize: '12px', color: C.textSub, fontWeight: 600 }}>{courses.filter(c => c.teacherId === t.id).length} Materias</span>
                        </div>
                        <button onClick={()=>handleOpenTeacherModal(t)} style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', background:`${C.accent}15`, color:C.accent, border:`1px solid ${C.accent}30`, padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600, transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.background=`${C.accent}30`} onMouseLeave={e=>e.currentTarget.style.background=`${C.accent}15`}><Ico.Eye s={16}/> Ver Expediente</button>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* --- PESTAÑA ALUMNOS --- */}
            {tab === 'Alumnos' && (
              <div className="anim-fade-up">
                <SectionHeader title="Directorio de Alumnos" action={ <Btn small onClick={()=>{ setNewUser({...initialUserState, role:'student'}); setUserModal(true); }}>+ Inscribir Alumno</Btn> } />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'12px' }}>
                  {students.map(s=>{
                    const aula = classGroups.find(cg => cg.id === s.classGroupId);
                    return (
                      <Card key={s.id} className="glass" style={{ padding:'18px', opacity: s.uid ? 1 : 0.8, borderLeft: aula ? `4px solid ${C.green}` : `4px solid ${C.amber}`, borderRight:`1px solid ${C.border}`, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:40,height:40,borderRadius:'50%',background:`${C.green}20`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.green, flexShrink:0, border:`1px solid ${C.green}40` }}><Ico.Student s={20} /></div>
                          <div>
                            <div style={{ fontWeight:700,fontSize:'15px', color:C.text }}>{s.name}</div>
                            <div style={{ color:C.textSub,fontSize:'12px', display:'flex', gap:'8px', alignItems:'center' }}>
                              <span>{aula ? aula.name : 'Sin Aula Base'}</span>
                              <span style={{ color:C.amber, fontWeight:800 }}>⚡ {s.xp || 0} XP</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={()=>handleOpenStudentModal(s)} style={{ marginTop:'14px', width:'100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', background:`${C.green}15`, color:C.green, border:`1px solid ${C.green}30`, borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600, padding:'10px', transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.background=`${C.green}30`} onMouseLeave={e=>e.currentTarget.style.background=`${C.green}15`}><Ico.Eye s={16}/> Analizar Perfil</button>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* --- PESTAÑA REPORTES --- */}
            {tab === 'Reportes' && (
              <div className="anim-fade-up">
                <SectionHeader title="Inteligencia Institucional" sub="Exportación de bases de datos y bitácora de actividad general en formato Excel (.xlsx)." />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '35px' }}>
                  <Card className="glass" style={{ padding: '24px', borderTop: `4px solid ${C.green}` }}>
                    <div style={{ display:'flex', gap:'15px', marginBottom:'20px' }}>
                      <div style={{ width:48, height:48, borderRadius:'12px', background:`${C.green}15`, color:C.green, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Ico.Student s={24}/></div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'16px', color:C.text }}>Data Estudiantil</div>
                        <div style={{ fontSize:'12px', color:C.muted, marginTop:'4px', lineHeight:1.5 }}>Directorio completo de alumnos, apoderados, medios de contacto, aulas base y XP.</div>
                      </div>
                    </div>
                    <Btn full outline color={C.green} onClick={() => generateProfessionalReport('academic')} loading={reportBusy} icon={<Ico.Download s={16}/>}>Descargar Base de Alumnos</Btn>
                  </Card>

                  <Card className="glass" style={{ padding: '24px', borderTop: `4px solid ${C.accent}` }}>
                    <div style={{ display:'flex', gap:'15px', marginBottom:'20px' }}>
                      <div style={{ width:48, height:48, borderRadius:'12px', background:`${C.accent}15`, color:C.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Ico.Teacher s={24}/></div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'16px', color:C.text }}>Rendimiento Docente</div>
                        <div style={{ fontSize:'12px', color:C.muted, marginTop:'4px', lineHeight:1.5 }}>Análisis de la plantilla de profesores, especialidades y carga académica actual.</div>
                      </div>
                    </div>
                    <Btn full outline color={C.accent} onClick={() => generateProfessionalReport('teachers')} loading={reportBusy} icon={<Ico.Download s={16}/>}>Descargar Ficha Docente</Btn>
                  </Card>

                  <Card className="glass" style={{ padding: '24px', borderTop: `4px solid ${C.amber}` }}>
                    <div style={{ display:'flex', gap:'15px', marginBottom:'20px' }}>
                      <div style={{ width:48, height:48, borderRadius:'12px', background:`${C.amber}15`, color:C.amber, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Ico.Book s={24}/></div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'16px', color:C.text }}>Estructura Académica</div>
                        <div style={{ fontSize:'12px', color:C.muted, marginTop:'4px', lineHeight:1.5 }}>Distribución de Aulas, materias que se imparten y la saturación de alumnos.</div>
                      </div>
                    </div>
                    <Btn full outline color={C.amber} onClick={() => generateProfessionalReport('courses')} loading={reportBusy} icon={<Ico.Download s={16}/>}>Descargar Mapa de Materias</Btn>
                  </Card>
                </div>

                <SectionHeader title="Bitácora del Sistema" sub="Últimos registros en la plataforma" />
                <Card className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                   <div style={{ padding: '16px 24px', background: C.surface, borderBottom: `1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', display:'flex', alignItems:'center', gap:'8px', color:C.text }}><Ico.Activity s={16} c={C.accent}/> Cronología de Actualizaciones</span>
                      <Badge color={C.accent}>En tiempo real</Badge>
                   </div>
                   <div style={{ padding: '12px 24px' }}>
                     {timelineData.length === 0 ? <EmptyState emoji="⏳" title="Sin actividad reciente" /> : 
                     timelineData.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 0', borderBottom: idx === timelineData.length - 1 ? 'none' : `1px solid ${C.border}60` }}>
                           <div style={{ width:10, height:10, borderRadius:'50%', background: item._type === 'student' ? C.green : C.amber, boxShadow:`0 0 10px ${item._type === 'student' ? C.green : C.amber}` }}></div>
                           <div style={{ flex:1 }}>
                              <div style={{ fontSize:'14px', fontWeight:600, color:C.text }}>
                                {item._type === 'student' ? 'Nueva Matrícula Estudiantil' : 'Nueva Materia Registrada'}
                              </div>
                              <div style={{ fontSize:'13px', color:C.textSub, marginTop:'2px' }}>
                                {item._type === 'student' ? `Se ingresó a ${item.name} (${item.rut}) al sistema.` : `Se habilitó la materia "${item.name}".`}
                              </div>
                           </div>
                           <div style={{ fontSize:'12px', color:C.muted, fontWeight:600 }}>{timeAgo(item.createdAt?.toDate())}</div>
                        </div>
                     ))}
                   </div>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODALES ───────────────────────────────────────────────────────────── */}
      
      {/* MODAL: EDITAR MATERIA (AHORA MUESTRA ESTADÍSTICAS) */}
      <Modal open={!!editMateria} onClose={()=>{setEditMateria(null); setModalErr('');}} title="Detalle de la Materia">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ background:`${C.violet}10`, border:`1px solid ${C.violet}30`, padding:'16px', borderRadius:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ color:C.violet, fontSize:'11px', fontWeight:800, textTransform:'uppercase' }}>Alumnos Cursando</div>
              <div style={{ color:C.text, fontSize:'22px', fontWeight:700 }}>{students.filter(s => s.enrolledCourses?.includes(editMateria?.id)).length}</div>
            </div>
            <Ico.Users s={30} c={C.violet} />
          </div>
          
          <div style={{ height:'1px', background:C.border, margin:'10px 0' }} />
          <div style={{ fontSize:'12px', color:C.muted, fontWeight:700, textTransform:'uppercase' }}>Configuración de la Materia</div>

          <Input label="Nombre de la Materia" value={editMateria?.name || ''} onChange={e=>setEditMateria({...editMateria, name:e.target.value})} />
          <Select label="Profesor a cargo" value={editMateria?.teacherId || ''} onChange={e=>setEditMateria({...editMateria, teacherId:e.target.value})} options={[{value:'',label:'Sin profesor'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.accent} onClick={handleUpdateMateria}>Actualizar Datos</Btn>
        </div>
      </Modal>

      {/* MODAL: EXPEDIENTE DOCENTE (SÚPER DETALLADO) */}
      <Modal open={!!viewTeacher} onClose={() => {setViewTeacher(null); setAssignMateriaToTeacherId('');}} title={`Expediente Analítico Docente`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          
          {/* Ficha Superior */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px', background:`linear-gradient(135deg, ${C.accent}15, transparent)`, border:`1px solid ${C.accent}30`, padding:'18px', borderRadius:'12px' }}>
            <div style={{ width:56,height:56,borderRadius:'50%',background:C.accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'22px', boxShadow:`0 0 15px ${C.accentSoft}` }}><Ico.Teacher s={28}/></div>
            <div>
              <div style={{ fontWeight:700, fontSize:'18px', color:C.text }}>{viewTeacher?.name}</div>
              <div style={{ color:C.textSub, fontSize:'13px', display:'flex', gap:'8px', marginTop:'4px' }}>
                <span>RUT: {viewTeacher?.rut}</span> | <span>{viewTeacher?.specialty || 'Docente General'}</span>
              </div>
            </div>
          </div>

          {/* Tarjetas Analíticas del Profesor */}
          {analyzingStats ? (
            <div style={{ padding:'20px', textAlign:'center', color:C.accent }}><Spinner size={24} color={C.accent} /> Calculando métricas...</div>
          ) : teacherStats && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: C.accent }}>{teacherStats.totalCourses}</div>
                <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', marginTop: '4px', fontWeight:700 }}>Cursos</div>
              </div>
              <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: C.green }}>{teacherStats.totalStudents}</div>
                <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', marginTop: '4px', fontWeight:700 }}>Alumnos</div>
              </div>
              <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: C.amber }}>{teacherStats.totalClassesUploaded}</div>
                <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', marginTop: '4px', fontWeight:700 }}>Clases Creadas</div>
              </div>
            </div>
          )}
          
          <div style={{ height:'1px', background:C.border }} />

          <div style={{ background:C.surface, padding:'16px', borderRadius:'10px', border:`1px solid ${C.border}` }}>
            <div style={{ fontWeight:600, fontSize:'12px', color:C.textSub, textTransform:'uppercase', marginBottom:'10px' }}>Vincular nueva materia al docente</div>
            <div style={{ display:'flex', gap:'10px' }}>
              <div style={{ flex:1 }}>
                <Select value={assignMateriaToTeacherId} onChange={e=>setAssignMateriaToTeacherId(e.target.value)} options={[{value:'',label:'Selecciona una materia...'},...courses.filter(c=>c.teacherId!==viewTeacher?.id).map(c=>({value:c.id,label:`${c.name} (${classGroups.find(cg=>cg.id===c.classGroupId)?.name||''})`}))]} />
              </div>
              <Btn color={C.accent} disabled={!assignMateriaToTeacherId} loading={saving} onClick={handleAssignMateriaToTeacher}>Asignar</Btn>
            </div>
          </div>

          <div>
            <div style={{ fontWeight:600, fontSize:'13px', color:C.textSub, textTransform:'uppercase', marginBottom: '10px' }}>Malla de Materias Impartidas</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {courses.filter(c => c.teacherId === viewTeacher?.id).length === 0 && <div style={{ color:C.muted, fontSize:'13px', textAlign:'center', padding:'15px', background:C.surface, borderRadius:'8px', border:`1px dashed ${C.border}` }}>Sin materias asignadas.</div>}
              {courses.filter(c => c.teacherId === viewTeacher?.id).map(c => {
                const aula = classGroups.find(cg => cg.id === c.classGroupId);
                return (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:C.card, border:`1px solid ${C.borderHover}`, padding:'12px 16px', borderRadius:'8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <Ico.Book s={16} c={C.accent}/>
                      <div><div style={{ fontWeight:700, fontSize:'14px', color:C.text }}>{c.name}</div><div style={{ color:C.muted, fontSize:'11px' }}>Aula Base: {aula ? aula.name : 'Independiente'}</div></div>
                    </div>
                    <button onClick={()=>handleRemoveCourseFromTeacher(c.id)} style={{ background:`${C.red}15`, border:'none', color:C.red, cursor:'pointer', padding:'8px', borderRadius:'8px', transition:'.2s' }}><Ico.Trash s={14}/></button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Modal>
      
      {/* MODAL: EXPEDIENTE ALUMNO (SÚPER DETALLADO CON GAMIFICACIÓN) */}
      <Modal open={!!assignModal} onClose={() => { setAssignModal(null); setModalErr(''); setSelectedAulaId(''); setAssignCourseIdToStudent(''); }} title={`Análisis del Estudiante`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          
          <div style={{ display:'flex', alignItems:'center', gap:'16px', background:`linear-gradient(135deg, ${C.green}15, transparent)`, border:`1px solid ${C.green}30`, padding:'18px', borderRadius:'12px' }}>
            <div style={{ width:56,height:56,borderRadius:'50%',background:C.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'22px', boxShadow:`0 0 15px ${C.greenSoft}` }}><Ico.Student s={28}/></div>
            <div>
              <div style={{ fontWeight:700, fontSize:'18px', color:C.text }}>{assignModal?.name}</div>
              <div style={{ color:C.textSub, fontSize:'13px', marginTop:'4px' }}>RUT: {assignModal?.rut}</div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:'20px', fontWeight:800, color:C.amber, fontFamily:"'Press Start 2P', cursive" }}>{assignModal?.xp || 0}</div>
              <div style={{ fontSize:'10px', color:C.amber, textTransform:'uppercase', fontWeight:700, letterSpacing:'0.1em' }}>Puntos XP</div>
            </div>
          </div>

          {/* Analíticas del Estudiante */}
          {analyzingStats ? (
            <div style={{ padding:'20px', textAlign:'center', color:C.green }}><Spinner size={24} color={C.green} /> Procesando métricas...</div>
          ) : studentStats && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '6px', fontWeight:700 }}>Estado de Riesgo</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontWeight: 800, color: studentStats.riskScore <= 39 ? C.red : studentStats.riskScore <= 69 ? C.amber : C.green, fontSize:'16px' }}>
                  {studentStats.riskScore <= 39 ? '🔴 Crítico' : studentStats.riskScore <= 69 ? '🟡 En Observación' : '🟢 Óptimo'}
                </div>
              </div>
              <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', marginBottom: '6px', fontWeight:700 }}>Promedio Quizes</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontWeight: 800, color: C.text, fontSize:'18px' }}>
                  🎯 {studentStats.avgQuizScore != null ? `${studentStats.avgQuizScore}%` : 'S/N'}
                </div>
              </div>
            </div>
          )}

          <div style={{ height:'1px', background:C.border }} />

          <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: C.textSub, marginBottom: '10px', textTransform: 'uppercase' }}>Aula Escolar Base</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Select value={selectedAulaId || assignModal?.classGroupId || ''} onChange={(e) => setSelectedAulaId(e.target.value)} options={[
                    { value: '', label: 'Selecciona el Aula a la que pertenece...' },
                    ...classGroups.map(cg => ({ value: cg.id, label: `${cg.name} (${cg.year})` }))
                  ]} />
              </div>
              <Btn onClick={handleChangeStudentAula} disabled={!selectedAulaId || selectedAulaId === assignModal?.classGroupId} color={C.green}>Actualizar</Btn>
            </div>
          </div>
          
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: C.textSub, marginBottom: '10px', textTransform: 'uppercase', display:'flex', justifyContent:'space-between' }}>
              <span>Malla de Materias Individuales ({assignModal?.enrolledCourses?.length || 0})</span>
            </div>

            <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
              <div style={{ flex:1 }}>
                <Select 
                  value={assignCourseIdToStudent} 
                  onChange={e=>setAssignCourseIdToStudent(e.target.value)} 
                  options={[
                    {value:'', label:'+ Añadir materia adicional suelta...'}, 
                    ...courses.filter(c => !(assignModal?.enrolledCourses || []).includes(c.id)).map(c => ({value: c.id, label: c.name}))
                  ]} 
                />
              </div>
              <Btn color={C.accent} disabled={!assignCourseIdToStudent} loading={saving} onClick={handleAssignCourseToStudent}>Vincular</Btn>
            </div>

            {(!assignModal?.enrolledCourses || assignModal.enrolledCourses.length === 0) ? (
              <div style={{ background: C.surface, padding: '12px', borderRadius: '8px', color: C.muted, fontSize: '13px', textAlign: 'center', border:`1px dashed ${C.border}` }}>El alumno no cursa ninguna materia aún.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns:'1fr 1fr', gap: '8px' }}>
                {assignModal.enrolledCourses.map(courseId => {
                   const cInfo = courses.find(c => c.id === courseId);
                   return (
                    <div key={courseId} style={{ display: 'flex', alignItems:'center', justifyContent:'space-between', background: C.card, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.borderHover}` }}>
                      <div style={{ display:'flex', alignItems:'center', fontSize: '12px', fontWeight: 600, color:C.text }}><Ico.Book s={14} c={C.accent}/> &nbsp;{cInfo ? cInfo.name : 'Materia Borrada'}</div>
                      <button onClick={()=>handleRemoveCourseFromStudent(courseId)} style={{ background:`${C.red}15`, border:'none', color:C.red, cursor:'pointer', padding:'6px', borderRadius:'6px' }}><Ico.Trash s={12}/></button>
                    </div>
                   )
                })}
              </div>
            )}
          </div>
          {modalErr && <Alert type="error">{modalErr}</Alert>}
        </div>
      </Modal>

      {/* MODALES DE CREACIÓN BÁSICA */}
      <Modal open={classGroupModal} onClose={()=>{ setClassGroupModal(false); setModalErr(''); }} title="Crear Nueva Aula Escolar">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <Input label="Nombre del Aula (Ej: 8vo Básico A)" placeholder="8vo Básico A" value={newClassGroup.name} onChange={e=>setNewClassGroup(c=>({...c,name:e.target.value}))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Input label="Nivel Educativo" placeholder="8vo Básico" value={newClassGroup.level} onChange={e=>setNewClassGroup(c=>({...c,level:e.target.value}))} />
            <Input label="Año Académico" placeholder="2026" value={newClassGroup.year} onChange={e=>setNewClassGroup(c=>({...c,year:e.target.value}))} />
          </div>
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.amber} onClick={handleCreateClassGroup}><strong style={{color:'#111'}}>Guardar Aula</strong></Btn>
        </div>
      </Modal>

      <Modal open={!!materiaModal} onClose={()=>{ setMateriaModal(null); setModalErr(''); }} title={`Añadir Materia al Aula`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <Input label="Nombre de la Materia" placeholder="Ej: Ciencias Naturales" value={newMateria.name} onChange={e=>setNewMateria(c=>({...c,name:e.target.value}))} />
          <Select label="Profesor que dictará la clase" value={newMateria.teacherId} onChange={e=>setNewMateria(c=>({...c,teacherId:e.target.value}))} options={[{value:'',label:'Selecciona un profesor...'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.accent} onClick={handleCreateMateria}>Crear y Notificar Alumnos</Btn>
        </div>
      </Modal>

      <Modal open={userModal} onClose={()=>{ setUserModal(false); setModalErr(''); }} title={newUser.role==='teacher' ? 'Registrar Docente' : 'Matricular Alumno'}>
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Input label="RUT (Login ID)" placeholder="12345678-9" value={newUser.rut} onChange={e=>setNewUser(u=>({...u,rut:e.target.value}))} />
            <Input label="Nombre completo" placeholder="Ej: Juan Pérez" value={newUser.name} onChange={e=>setNewUser(u=>({...u,name:e.target.value}))} />
          </div>
          {newUser.role === 'student' ? (
            <Select label="Aula / Curso Base (Matrícula)" value={newUser.classGroupId} onChange={e=>setNewUser(u=>({...u,classGroupId:e.target.value}))} options={[{value:'',label:'Asignar a un aula...'},...classGroups.map(cg=>({value:cg.id,label:`${cg.name} (${cg.year})`}))]} />
          ) : (
            <Input label="Especialidad Docente (Opcional)" placeholder="Ej: Matemáticas" value={newUser.specialty} onChange={e=>setNewUser(u=>({...u,specialty:e.target.value}))} />
          )}
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} onClick={handleCreateUser}>{newUser.role === 'student' ? 'Crear y Matricular' : 'Guardar Docente'}</Btn>
        </div>
      </Modal>

    </div>
  );
}