import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, Btn, Modal, Input, Select, StatCard, SectionHeader, Alert, EmptyState, Spinner, Tabs } from '@/components/ui';
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
  Settings: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Robot: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Edit: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
  const [materiaModal, setMateriaModal]       = useState(null); // ID del Aula para agregar materia
  const [assignModal, setAssignModal]         = useState(null); // Alumno
  const [viewTeacher, setViewTeacher]         = useState(null); // Profesor
  const [editMateria, setEditMateria]         = useState(null); // Materia a editar

  // IA
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiInsight, setAiInsight]       = useState(null);

  // Forms
  const [newUser, setNewUser]             = useState(initialUserState);
  const [newClassGroup, setNewClassGroup] = useState(initialClassGroupState);
  const [newMateria, setNewMateria]       = useState(initialMateriaState);
  
  const [selectedAulaId, setSelectedAulaId] = useState('');
  const [assignMateriaToTeacherId, setAssignMateriaToTeacherId] = useState('');

  const [saving, setSaving]     = useState(false);
  const [modalErr, setModalErr] = useState('');
  const [success, setSuccess]   = useState('');

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

  // ── ACCIONES ──
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

      // Auto-matricular alumnos del aula
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
    if (newUser.role === 'student' && !newUser.classGroupId) { setModalErr('Asigna un aula.'); return; }
    setSaving(true); setModalErr('');
    try {
      const enrolled = newUser.role === 'student' && newUser.classGroupId 
        ? courses.filter(c => c.classGroupId === newUser.classGroupId).map(c => c.id) : [];

      await addDoc(collection(db, 'users'), {
        name: newUser.name, rut: newUser.rut, role: newUser.role, email: newUser.email || null, phone: newUser.phone || null,
        classGroupId: newUser.role === 'student' ? newUser.classGroupId : null,
        guardian: newUser.role === 'student' ? newUser.guardian : null,
        specialty: newUser.role === 'teacher' ? newUser.specialty : null,
        enrolledCourses: enrolled, schoolId: actualSchoolId, uid: null, createdAt: serverTimestamp()
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
      const newEnrolled = courses.filter(c => c.classGroupId === selectedAulaId).map(c => c.id);
      await updateDoc(doc(db, 'users', assignModal.id), { classGroupId: selectedAulaId, enrolledCourses: newEnrolled });
      setAssignModal({ ...assignModal, classGroupId: selectedAulaId, enrolledCourses: newEnrolled });
      setSelectedAulaId(''); setSuccess('✓ Traslado de Aula exitoso.'); setTimeout(()=>setSuccess(''), 3000); load();
    } catch (e) { setModalErr('Error'); }
    setSaving(false);
  };

  const handleAssignMateriaToTeacher = async () => {
    if (!assignMateriaToTeacherId || !viewTeacher) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'courses', assignMateriaToTeacherId), { teacherId: viewTeacher.id });
      setAssignMateriaToTeacherId(''); setSuccess('✓ Curso asignado al profesor'); setTimeout(()=>setSuccess(''), 3000); load();
    } catch(e) {}
    setSaving(false);
  };

  const handleDeleteCourse = async (courseId) => {
    if(confirm('¿Eliminar esta materia?')){
      try { await deleteDoc(doc(db, 'courses', courseId)); load(); } catch (e) { console.error(e); }
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom:'28px' }}>
          <div>
            <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, marginBottom:'4px' }}>Centro de Comando</h1>
            <p style={{ color:C.accent, fontSize:'13px', fontWeight: 600 }}>{school?.name || actualSchoolId} · Administración</p>
          </div>
        </div>

        {success && <div className="anim-fade-up" style={{ marginBottom:'14px' }}><Alert type="success">{success}</Alert></div>}

        {/* STAT CARDS INTERACTIVAS */}
        <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'12px', marginBottom:'28px' }}>
          <div onClick={()=>setTab('Profesores')} style={{ cursor:'pointer' }}><StatCard label="Docentes" value={teachers.length} icon={<Ico.Teacher s={24} c={C.accent}/>} color={C.accent} /></div>
          <div onClick={()=>setTab('Alumnos')} style={{ cursor:'pointer' }}><StatCard label="Alumnos" value={students.length} icon={<Ico.Student s={24} c={C.green}/>} color={C.green} /></div>
          <div onClick={()=>setTab('Cursos y Materias')} style={{ cursor:'pointer' }}><StatCard label="Aulas Creadas" value={classGroups.length} icon={<Ico.Users s={24} c={C.amber}/>} color={C.amber} /></div>
          <div onClick={()=>setTab('Cursos y Materias')} style={{ cursor:'pointer' }}><StatCard label="Materias Totales" value={courses.length} icon={<Ico.Book s={24} c={C.violet}/>} color={C.violet} /></div>
        </div>

        <Tabs tabs={['Resumen', 'Cursos y Materias', 'Profesores', 'Alumnos', 'Reportes']} active={tab} onChange={setTab} />

        {loading ? <div style={{ display:'flex', justifyContent:'center', padding:'50px' }}><Spinner size={36} /></div> : (
          <>
            {/* --- PESTAÑA: RESUMEN --- */}
            {tab === 'Resumen' && (
              <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <Card style={{ background:`${C.accent}08`, borderColor:`${C.accent}25` }}>
                  <h3 style={{ fontWeight:700, marginBottom:'12px', color:C.accent, display:'flex', alignItems:'center', gap:'8px' }}><Ico.Settings s={20} c={C.accent} /> Accesos Rápidos</h3>
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
                      <Card key={cg.id} style={{ padding:0, overflow:'hidden', border:`1px solid ${C.border}` }}>
                        <div style={{ background:C.surface, padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div><div style={{ fontWeight:700, fontSize:'18px' }}>{cg.name}</div><div style={{ fontSize:'12px', color:C.muted }}>Nivel: {cg.level} · {cg.year}</div></div>
                          <div style={{ textAlign:'center', background:C.card, padding:'6px 12px', borderRadius:'8px', border:`1px solid ${C.border}` }}>
                            <div style={{ fontWeight:700, fontSize:'16px', color:C.green }}>{aulasAlumnos}</div><div style={{ fontSize:'10px', color:C.muted }}>ALUMNOS</div>
                          </div>
                        </div>
                        <div style={{ padding:'16px 20px', background:C.card }}>
                          <div style={{ fontSize:'11px', fontWeight:600, color:C.textSub, textTransform:'uppercase', marginBottom:'10px' }}>Materias ({aulasMaterias.length})</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
                            {aulasMaterias.map(mat => {
                              const profe = teachers.find(t => t.id === mat.teacherId);
                              return (
                                <div key={mat.id} onClick={()=>setEditMateria(mat)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.surface, padding:'8px 12px', borderRadius:'8px', cursor:'pointer', border:`1px solid transparent`, transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor='transparent'}>
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
                      <Card key={t.id} style={{ padding:'18px', opacity: t.uid ? 1 : 0.7 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                          <div style={{ width:42,height:42,borderRadius:'50%',background:`${C.accent}20`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.accent }}><Ico.Teacher s={20} /></div>
                          <div> <div style={{ fontWeight:700, fontSize: '15px' }}>{t.name}</div> <div style={{ color:C.muted,fontSize:'12px' }}>RUT: {t.rut}</div> </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surface, padding: '10px 12px', borderRadius: '8px', marginBottom: '14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:status.color }}><span style={{ width:8, height:8, borderRadius:'50%', background:status.dot }}></span> {status.text}</div>
                          <span style={{ fontSize: '12px', color: C.textSub, fontWeight: 600 }}>{courses.filter(c => c.teacherId === t.id).length} Materias</span>
                        </div>
                        <button onClick={()=>setViewTeacher(t)} style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', background:`${C.accent}15`, color:C.accent, border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600 }}><Ico.Eye s={16}/> Gestionar Docente</button>
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
                      <Card key={s.id} style={{ padding:'18px', opacity: s.uid ? 1 : 0.8, borderLeft: aula ? `4px solid ${C.green}` : `4px solid ${C.amber}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:40,height:40,borderRadius:'50%',background:`${C.green}20`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.green, flexShrink:0 }}><Ico.Student s={20} /></div>
                          <div><div style={{ fontWeight:700,fontSize:'15px' }}>{s.name}</div><div style={{ color:C.textSub,fontSize:'12px' }}>{aula ? aula.name : 'Sin Aula'}</div></div>
                        </div>
                        <button onClick={()=>handleOpenStudentModal(s)} style={{ marginTop:'14px', width:'100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', background:`${C.green}15`, color:C.green, border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600, padding:'10px' }}><Ico.Eye s={16}/> Ver Expediente</button>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODALES ───────────────────────────────────────────────────────────── */}
      
      {/* MODAL: EDITAR MATERIA */}
      <Modal open={!!editMateria} onClose={()=>{setEditMateria(null); setModalErr('');}} title="Editar Materia">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <Input label="Nombre de la Materia" value={editMateria?.name || ''} onChange={e=>setEditMateria({...editMateria, name:e.target.value})} />
          <Select label="Profesor a cargo" value={editMateria?.teacherId || ''} onChange={e=>setEditMateria({...editMateria, teacherId:e.target.value})} options={[{value:'',label:'Sin profesor'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.accent} onClick={handleUpdateMateria}>Actualizar Materia</Btn>
        </div>
      </Modal>

      {/* MODAL: GESTIONAR PROFESOR */}
      <Modal open={!!viewTeacher} onClose={() => {setViewTeacher(null); setAssignMateriaToTeacherId('');}} title={`Expediente Docente`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', background:`${C.accent}08`, border:`1px solid ${C.accent}20`, padding:'18px', borderRadius:'12px' }}>
            <div style={{ width:50,height:50,borderRadius:'50%',background:C.accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'22px' }}><Ico.Teacher s={24}/></div>
            <div><div style={{ fontWeight:700, fontSize:'18px' }}>{viewTeacher?.name}</div><div style={{ color:C.textSub, fontSize:'13px' }}>RUT: {viewTeacher?.rut}</div></div>
          </div>
          
          <div style={{ background:C.surface, padding:'16px', borderRadius:'10px', border:`1px solid ${C.border}` }}>
            <div style={{ fontWeight:600, fontSize:'12px', color:C.textSub, textTransform:'uppercase', marginBottom:'10px' }}>Asignar materia existente</div>
            <div style={{ display:'flex', gap:'10px' }}>
              <div style={{ flex:1 }}>
                <Select value={assignMateriaToTeacherId} onChange={e=>setAssignMateriaToTeacherId(e.target.value)} options={[{value:'',label:'Selecciona una materia del colegio...'},...courses.filter(c=>c.teacherId!==viewTeacher?.id).map(c=>({value:c.id,label:`${c.name} (${classGroups.find(cg=>cg.id===c.classGroupId)?.name||''})`}))]} />
              </div>
              <Btn color={C.accent} disabled={!assignMateriaToTeacherId} loading={saving} onClick={handleAssignMateriaToTeacher}>Asignar</Btn>
            </div>
          </div>

          <div>
            <div style={{ fontWeight:600, fontSize:'13px', color:C.textSub, textTransform:'uppercase', marginBottom: '10px' }}>Materias Impartidas ({courses.filter(c => c.teacherId === viewTeacher?.id).length})</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {courses.filter(c => c.teacherId === viewTeacher?.id).map(c => {
                const aula = classGroups.find(cg => cg.id === c.classGroupId);
                return (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:C.card, border:`1px solid ${C.border}`, padding:'12px 14px', borderRadius:'8px' }}>
                    <div><div style={{ fontWeight:600, fontSize:'14px' }}>{c.name}</div><div style={{ color:C.muted, fontSize:'11px' }}>Aula: {aula ? aula.name : 'Independiente'}</div></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* RESTO DE MODALES EXISTENTES */}
      {/* ... (Mantén aquí el modal de Alumno, Aula, Crear Materia y Crear Usuario igual que antes) ... */}
      
      {/* MODAL: FICHA ALUMNO & MATRICULACIÓN */}
      <Modal open={!!assignModal} onClose={() => { setAssignModal(null); setModalErr(''); setSelectedAulaId(''); setAiInsight(null); setGeneratingAI(false); }} title={`Perfil del Alumno`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', background:`${C.green}08`, border:`1px solid ${C.green}20`, padding:'18px', borderRadius:'12px' }}>
            <div style={{ width:56,height:56,borderRadius:'50%',background:C.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'22px' }}><Ico.Student s={28}/></div>
            <div>
              <div style={{ fontWeight:700, fontSize:'18px', color:C.text }}>{assignModal?.name}</div>
              <div style={{ color:C.textSub, fontSize:'13px', marginTop:'4px' }}>RUT: {assignModal?.rut}</div>
            </div>
          </div>

          <div style={{ background: C.surface, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: C.textSub, marginBottom: '10px', textTransform: 'uppercase' }}>Aula Escolar Asignada</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Select value={selectedAulaId || assignModal?.classGroupId || ''} onChange={(e) => setSelectedAulaId(e.target.value)} options={[
                    { value: '', label: 'Selecciona el Aula a la que pertenece...' },
                    ...classGroups.map(cg => ({ value: cg.id, label: `${cg.name} (${cg.year})` }))
                  ]} />
              </div>
              <Btn onClick={handleChangeStudentAula} disabled={!selectedAulaId || selectedAulaId === assignModal?.classGroupId} color={C.green}>Actualizar Aula</Btn>
            </div>
          </div>
          
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: C.textSub, marginBottom: '8px', textTransform: 'uppercase' }}>Materias Actuales</div>
            {(!assignModal?.enrolledCourses || assignModal.enrolledCourses.length === 0) ? (
              <div style={{ background: C.surface, padding: '12px', borderRadius: '8px', color: C.muted, fontSize: '13px', textAlign: 'center' }}>Sin materias. Asigna un Aula arriba.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns:'1fr 1fr', gap: '8px' }}>
                {assignModal.enrolledCourses.map(courseId => {
                   const cInfo = courses.find(c => c.id === courseId);
                   return <div key={courseId} style={{ display: 'flex', alignItems:'center', background: C.card, padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', fontWeight: 600 }}><Ico.Book s={14} c={C.accent}/> &nbsp;{cInfo ? cInfo.name : 'Desconocido'}</div>
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL 1: CREAR AULA BASE */}
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

      {/* MODAL 2: CREAR MATERIA PARA UN AULA */}
      <Modal open={!!materiaModal} onClose={()=>{ setMateriaModal(null); setModalErr(''); }} title={`Añadir Materia al Aula`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <Input label="Nombre de la Materia" placeholder="Ej: Ciencias Naturales" value={newMateria.name} onChange={e=>setNewMateria(c=>({...c,name:e.target.value}))} />
          <Select label="Profesor que dictará la clase" value={newMateria.teacherId} onChange={e=>setNewMateria(c=>({...c,teacherId:e.target.value}))} options={[{value:'',label:'Selecciona un profesor...'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.accent} onClick={handleCreateMateria}>Crear y Notificar Alumnos</Btn>
        </div>
      </Modal>

      {/* MODAL 3: CREAR USUARIOS (Profesor / Alumno) */}
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