import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, Btn, Badge, Modal, Input, Select, StatCard, SectionHeader, Alert, EmptyState, Spinner, Tabs } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getUsersBySchool, getSchool, getCoursesBySchool, createCourse, deleteCourse } from '@/services/db';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// ── LIBRERÍA DE ICONOS SVG PROFESIONALES ─────────────────────────────────────
const Ico = {
  Teacher: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Student: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Book: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Chart: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>,
  Download: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Alert: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Settings: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
};
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, profile, schoolId } = useAuth();
  const [tab, setTab]       = useState('Resumen');
  const [school, setSchool] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  
  // Modales de Creación y Edición
  const [userModal, setUserModal]     = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null); 
  const [selectedCourseId, setSelectedCourseId] = useState(''); 
  
  // Modales de Visor de Detalles (Deep Dive)
  const [viewTeacher, setViewTeacher] = useState(null);
  const [viewCourse, setViewCourse]   = useState(null);

  const [newUser, setNewUser]   = useState({ name:'', rut:'', role:'teacher', course:'' });
  const [newCourse, setNewCourse] = useState({ name:'', subject:'', grade:'', teacherId:'' });
  
  const [saving, setSaving]   = useState(false);
  const [modalErr, setModalErr] = useState('');
  const [success, setSuccess]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [sch,t,s,c] = await Promise.all([
        getSchool(schoolId), getUsersBySchool(schoolId,'teacher'), 
        getUsersBySchool(schoolId,'student'), getCoursesBySchool(schoolId)
      ]);
      setSchool(sch); setTeachers(t); setStudents(s); setCourses(c);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.rut) { setModalErr('Completa el nombre y el RUT'); return; }
    if (newUser.role === 'student' && !newUser.course) { setModalErr('Debes asignar un curso base al alumno'); return; }
    
    setSaving(true); setModalErr('');
    try {
      await addDoc(collection(db, 'users'), {
        name: newUser.name, rut: newUser.rut, role: newUser.role,
        course: newUser.role === 'student' ? newUser.course : null,
        enrolledCourses: [], schoolId: schoolId, uid: null, createdAt: serverTimestamp()
      });
      setUserModal(false); setNewUser({ name:'', rut:'', role:'teacher', course:'' });
      setSuccess(`✓ ${newUser.role==='teacher'?'Profesor':'Alumno'} pre-registrado`); 
      load(); setTimeout(()=>setSuccess(''), 3000);
    } catch(e) { setModalErr(e.message); }
    setSaving(false);
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name||!newCourse.subject||!newCourse.grade) { setModalErr('Completa todos los campos'); return; }
    setSaving(true); setModalErr('');
    try {
      await createCourse({ ...newCourse, schoolId, createdBy: user.uid });
      setCourseModal(false); setNewCourse({ name:'', subject:'', grade:'', teacherId:'' });
      setSuccess('✓ Curso creado'); load(); setTimeout(()=>setSuccess(''), 3000);
    } catch(e) { setModalErr(e.message); }
    setSaving(false);
  };

  const handleAssignCourse = async () => {
    if (!selectedCourseId || !assignModal) return;
    try {
      const studentRef = doc(db, 'users', assignModal.id);
      const newCoursesList = [...(assignModal.enrolledCourses || []), selectedCourseId];
      await updateDoc(studentRef, { enrolledCourses: newCoursesList });
      
      const updatedStudent = { ...assignModal, enrolledCourses: newCoursesList };
      setStudents(s => s.map(x => x.id === assignModal.id ? updatedStudent : x));
      setAssignModal(updatedStudent); setSelectedCourseId('');
      setSuccess('✓ Curso vinculado'); setTimeout(()=>setSuccess(''), 2000);
    } catch (e) { setModalErr('Error al asignar el curso'); }
  };

  const handleRemoveCourse = async (courseIdToRemove) => {
    try {
      const studentRef = doc(db, 'users', assignModal.id);
      const newCoursesList = (assignModal.enrolledCourses || []).filter(id => id !== courseIdToRemove);
      await updateDoc(studentRef, { enrolledCourses: newCoursesList });
      
      const updatedStudent = { ...assignModal, enrolledCourses: newCoursesList };
      setStudents(s => s.map(x => x.id === assignModal.id ? updatedStudent : x));
      setAssignModal(updatedStudent);
    } catch (e) { console.error("Error removiendo:", e); }
  };

  const generateProfessionalReport = (type) => {
    let headers = [], rows = [], filename = '';
    const currentDate = new Date().toLocaleDateString('es-CL');

    if (type === 'academic') {
      filename = `Reporte_Academico_${currentDate}`;
      headers = ['RUT', 'Nombre Alumno', 'Curso Base', 'Materias Inscritas', 'Estado Plataforma'];
      rows = students.map(s => [s.rut, s.name, s.course || 'Sin asignar', s.enrolledCourses?.length || 0, s.uid ? 'Activo' : 'Pendiente']);
    } else if (type === 'teachers') {
      filename = `Reporte_Docente_${currentDate}`;
      headers = ['RUT', 'Nombre Profesor', 'Cursos Asignados', 'Estado Plataforma'];
      rows = teachers.map(t => [t.rut, t.name, courses.filter(c => c.teacherId === t.id).length, t.uid ? 'Activo' : 'Pendiente']);
    } else if (type === 'courses') {
      filename = `Reporte_Cursos_${currentDate}`;
      headers = ['Nombre del Curso', 'Materia', 'Nivel', 'Profesor Titular', 'Alumnos Matriculados'];
      rows = courses.map(c => [c.name, c.subject, c.grade, teachers.find(t => t.id === c.teacherId)?.name || 'Sin profesor', students.filter(s => (s.enrolledCourses || []).includes(c.id)).length]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const studentsWithoutCourses = students.filter(s => !s.enrolledCourses || s.enrolledCourses.length === 0);
  const coursesWithoutTeachers = courses.filter(c => !c.teacherId);
  const inactiveUsers = [...students, ...teachers].filter(u => !u.uid);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom:'28px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, marginBottom:'4px' }}>Centro de Comando</h1>
            <p style={{ color:C.muted, fontSize:'13px' }}>{school?.name || 'Institución'} · Administración Global</p>
          </div>
          <div style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}40`, padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems:'center', gap: '8px' }}>
            <Ico.Check s={18} c={C.accent} />
            <div>
              <span style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing:'0.05em' }}>Estado del sistema</span>
              <strong style={{ color: C.accent, fontSize: '13px' }}>Operativo y Sincronizado</strong>
            </div>
          </div>
        </div>

        {success && <div className="anim-fade-up" style={{ marginBottom:'14px' }}><Alert type="success">{success}</Alert></div>}

        <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'12px', marginBottom:'28px' }}>
          <StatCard label="Profesores"  value={teachers.length} icon={<Ico.Teacher s={24} c={C.accent}/>} color={C.accent} />
          <StatCard label="Alumnos"     value={students.length} icon={<Ico.Student s={24} c={C.green}/>}   color={C.green}  />
          <StatCard label="Cursos Activos" value={courses.length} icon={<Ico.Book s={24} c={C.amber}/>}   color={C.amber}  />
          <StatCard label="Usuarios Inactivos" value={inactiveUsers.length} icon={<Ico.Alert s={24} c={inactiveUsers.length > 0 ? C.red : C.violet}/>} color={inactiveUsers.length > 0 ? C.red : C.violet} sub="Falta activar cuenta" />
        </div>

        <Tabs tabs={['Resumen','Profesores','Alumnos','Cursos', 'Reportes']} active={tab} onChange={setTab} />

        {loading && <div style={{ display:'flex', justifyContent:'center', padding:'50px' }}><Spinner size={36} /></div>}

        {/* --- PESTAÑA 1: RESUMEN EJECUTIVO E INTELIGENTE --- */}
        {!loading && tab === 'Resumen' && (
          <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <Card style={{ background:`${C.accent}08`, borderColor:`${C.accent}25` }}>
              <h3 style={{ fontWeight:700, marginBottom:'12px', color:C.accent, display:'flex', alignItems:'center', gap:'8px' }}>
                <Ico.Settings s={20} c={C.accent} /> Acceso Rápido
              </h3>
              <p style={{ color:C.text, fontSize:'14px', lineHeight:1.6, marginBottom: '20px' }}>
                Utiliza las herramientas principales para expandir tu base de datos educativa.
              </p>
              <div style={{ display:'flex', flexDirection: 'column', gap:'10px' }}>
                <button onClick={()=>{ setNewUser(u=>({...u,role:'teacher'})); setUserModal(true); }} style={{ display:'flex', alignItems:'center', gap:'8px', background:C.accent, color:'#fff', padding:'10px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'13px' }}><Ico.Plus s={16} /> Nuevo Profesor</button>
                <button onClick={()=>{ setNewUser(u=>({...u,role:'student'})); setUserModal(true); }} style={{ display:'flex', alignItems:'center', gap:'8px', background:C.green, color:'#fff', padding:'10px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'13px' }}><Ico.Plus s={16} /> Nuevo Alumno</button>
                <button onClick={()=>setCourseModal(true)} style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', color:C.amber, border:`1px solid ${C.amber}`, padding:'10px 14px', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'13px' }}><Ico.Plus s={16} /> Crear Curso / Materia</button>
              </div>
            </Card>

            <Card style={{ background: C.surface }}>
              <h3 style={{ fontWeight:700, marginBottom:'15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ico.Chart s={20} c={C.text} /> Diagnóstico del Sistema
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {studentsWithoutCourses.length > 0 ? (
                  <div style={{ padding: '12px', background: `${C.amber}15`, borderRadius: '8px', borderLeft: `4px solid ${C.amber}` }}>
                    <div style={{ fontWeight: 600, color: C.amber, fontSize: '13px' }}>Atención requerida</div>
                    <div style={{ fontSize: '12px', color: C.text, marginTop: '4px' }}>Hay <strong>{studentsWithoutCourses.length} alumnos</strong> pre-registrados que no tienen materias asignadas. Ve a la pestaña "Alumnos" para vincularlos.</div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: `${C.green}10`, borderRadius: '8px', color: C.green, fontSize: '13px', fontWeight: 600, display:'flex', alignItems:'center', gap:'8px' }}><Ico.Check s={16}/> Todos los alumnos tienen materias asignadas.</div>
                )}
                {coursesWithoutTeachers.length > 0 && (
                  <div style={{ padding: '12px', background: `${C.red}15`, borderRadius: '8px', borderLeft: `4px solid ${C.red}` }}>
                    <div style={{ fontWeight: 600, color: C.red, fontSize: '13px' }}>Aviso de Organización</div>
                    <div style={{ fontSize: '12px', color: C.text, marginTop: '4px' }}>Tienes <strong>{coursesWithoutTeachers.length} cursos</strong> creados que no tienen un profesor titular asignado.</div>
                  </div>
                )}
                {inactiveUsers.length > 0 && (
                  <div style={{ padding: '12px', background: C.card, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '13px', color: C.textSub }}>Tienes <strong>{inactiveUsers.length} usuarios</strong> que aún no han ingresado a la plataforma por primera vez.</div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* --- PESTAÑA PROFESORES --- */}
        {!loading && tab === 'Profesores' && (
          <div className="anim-fade-up">
            <SectionHeader title="Gestión Docente" sub={`${teachers.length} registrados`} action={ <div style={{ display:'flex', gap:'8px' }}> <Btn small outline onClick={()=>exportToExcel(teachers, 'Lista_Profesores')}>📊 Exportar</Btn> <Btn small onClick={()=>{ setNewUser(u=>({...u,role:'teacher'})); setUserModal(true); }}>+ Agregar</Btn> </div> } />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'11px' }}>
              {teachers.map(t=>(
                <Card key={t.id} style={{ padding:'14px 18px', opacity: t.uid ? 1 : 0.7 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:42,height:42,borderRadius:'50%',background:`${C.accent}20`,border:`2px solid ${C.accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.accent }}><Ico.Teacher s={20} /></div>
                      <div> <div style={{ fontWeight:600, fontSize: '15px' }}>{t.name}</div> <div style={{ color:C.muted,fontSize:'12px' }}>RUT: {t.rut}</div> </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: C.textSub }}>Cursos a cargo: <strong>{courses.filter(c => c.teacherId === t.id).length}</strong></span>
                    <button onClick={()=>setViewTeacher(t)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'transparent', border:'none', color:C.accent, cursor:'pointer', fontSize:'13px', fontWeight:600 }}><Ico.Eye s={16}/> Detalle</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- PESTAÑA ALUMNOS --- */}
        {!loading && tab === 'Alumnos' && (
          <div className="anim-fade-up">
            <SectionHeader title="Matrícula de Alumnos" sub={`${students.length} registrados`} action={ <div style={{ display:'flex', gap:'8px' }}> <Btn small outline onClick={()=>exportToExcel(students, 'Lista_Alumnos')}>📊 Exportar</Btn> <Btn small onClick={()=>{ setNewUser(u=>({...u,role:'student'})); setUserModal(true); }}>+ Agregar</Btn> </div> } />
            {students.length===0 ? <EmptyState emoji="🎒" title="Sin alumnos" desc="Pre-registra a los alumnos con su RUT" />
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'11px' }}>
                {students.map(s=>(
                  <Card key={s.id} style={{ padding:'14px 18px', opacity: s.uid ? 1 : 0.8 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'11px' }}>
                        <div style={{ width:36,height:36,borderRadius:'50%',background:`${C.green}20`,border:`2px solid ${C.green}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.green }}><Ico.Student s={18} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight:600,fontSize:'14px' }}>{s.name}</div>
                          <div style={{ color:C.muted,fontSize:'11px' }}>RUT: {s.rut} · Clase base: {s.course}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${C.border}`, paddingTop:'10px' }}>
                        <span style={{ fontSize:'11px', color: s.enrolledCourses?.length > 0 ? C.green : C.red, fontWeight: 600 }}>{s.enrolledCourses?.length || 0} materias vinculadas</span>
                        <button onClick={()=>setAssignModal(s)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'transparent', border:'none', color:C.green, cursor:'pointer', fontSize:'13px', fontWeight:600 }}><Ico.Eye s={16}/> Perfil y Matrícula</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>}
          </div>
        )}

        {/* --- PESTAÑA CURSOS --- */}
        {!loading && tab === 'Cursos' && (
          <div className="anim-fade-up">
            <SectionHeader title="Estructura Académica" sub={`${courses.length} materias activas`} action={<Btn small onClick={()=>setCourseModal(true)}>+ Crear Materia</Btn>} />
            <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap:'14px' }}>
              {courses.map(c=>{
                const teacher = teachers.find(t=>t.id===c.teacherId);
                const alumnosMatriculados = students.filter(s => (s.enrolledCourses || []).includes(c.id)).length;
                return (
                  <Card key={c.id} style={{ padding:'18px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontWeight:700,fontSize:'16px', color: C.text }}>{c.name}</div>
                        <div style={{ color:C.muted,fontSize:'12px',marginTop:'4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.subject} · {c.grade}</div>
                      </div>
                      <button onClick={()=>deleteCourse(c.id).then(load)} style={{ background:'none',border:'none',color:C.red,cursor:'pointer',opacity:0.6 }}><Ico.Trash s={18}/></button>
                    </div>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.textSub }}>
                          <Ico.Teacher s={14} c={C.muted}/> {teacher ? teacher.name : <span style={{color: C.red}}>Sin asignar</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.textSub }}>
                          <Ico.Student s={14} c={C.muted}/> {alumnosMatriculados} alumnos
                        </div>
                      </div>
                      <button onClick={()=>setViewCourse(c)} style={{ display:'flex', alignItems:'center', gap:'6px', background:`${C.amber}20`, border:`1px solid ${C.amber}50`, color:C.amber, padding:'6px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:600 }}><Ico.Eye s={14}/> Ver Detalle</button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* --- PESTAÑA REPORTES --- */}
        {!loading && tab === 'Reportes' && (
          <div className="anim-fade-up">
            <SectionHeader title="Centro de Reportes" sub="Descarga informes estructurados en formato Excel" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
              <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Ico.Chart s={32} c={C.green} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Reporte Académico de Alumnos</h3>
                  <p style={{ fontSize: '13px', color: C.muted, marginTop: '5px', lineHeight: 1.5 }}>Listado de estudiantes, RUT, curso base y estado de activación.</p>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => generateProfessionalReport('academic')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'transparent', border:`1.5px solid ${C.green}`, color:C.green, padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:600 }}><Ico.Download s={18}/> Descargar Excel</button>
                </div>
              </Card>

              <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Ico.Teacher s={32} c={C.accent} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Reporte de Estado Docente</h3>
                  <p style={{ fontSize: '13px', color: C.muted, marginTop: '5px', lineHeight: 1.5 }}>Planta docente registrada, número de cursos asignados y estado.</p>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => generateProfessionalReport('teachers')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'transparent', border:`1.5px solid ${C.accent}`, color:C.accent, padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:600 }}><Ico.Download s={18}/> Descargar Excel</button>
                </div>
              </Card>

              <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Ico.Book s={32} c={C.amber} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Auditoría de Cursos y Materias</h3>
                  <p style={{ fontSize: '13px', color: C.muted, marginTop: '5px', lineHeight: 1.5 }}>Estructura de cursos, profesor titular y volumen de alumnos.</p>
                </div>
                <div style={{ marginTop: 'auto' }}>
                   <button onClick={() => generateProfessionalReport('courses')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'transparent', border:`1.5px solid ${C.amber}`, color:C.amber, padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:600 }}><Ico.Download s={18}/> Descargar Excel</button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ── MODALES DE INMERSIÓN PROFUNDA (DEEP DIVE) ─────────────────────────── */}
      
      {/* 1. Modal Detalle Docente */}
      <Modal open={!!viewTeacher} onClose={() => setViewTeacher(null)} title={`Perfil Docente`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', background:C.surface, padding:'14px', borderRadius:'10px' }}>
            <div style={{ width:48,height:48,borderRadius:'50%',background:`${C.accent}20`,color:C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'18px' }}><Ico.Teacher s={24}/></div>
            <div>
              <div style={{ fontWeight:700, fontSize:'16px' }}>{viewTeacher?.name}</div>
              <div style={{ color:C.muted, fontSize:'12px' }}>RUT: {viewTeacher?.rut} · {viewTeacher?.uid ? 'Cuenta Activa' : 'Pendiente'}</div>
            </div>
          </div>
          <div style={{ fontWeight:600, fontSize:'13px', color:C.textSub, textTransform:'uppercase' }}>Materias a su cargo</div>
          {courses.filter(c => c.teacherId === viewTeacher?.id).length === 0 ? (
            <div style={{ background:C.surface, padding:'15px', borderRadius:'8px', color:C.muted, fontSize:'13px', textAlign:'center' }}>No tiene cursos asignados.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {courses.filter(c => c.teacherId === viewTeacher?.id).map(c => {
                const count = students.filter(s => (s.enrolledCourses||[]).includes(c.id)).length;
                return (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:C.card, border:`1px solid ${C.border}`, padding:'12px 14px', borderRadius:'8px' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'14px' }}>{c.name}</div>
                      <div style={{ color:C.muted, fontSize:'11px' }}>{c.subject} · {c.grade}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', background:`${C.green}15`, color:C.green, padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
                      <Ico.Student s={14}/> {count} alumnos
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* 2. Modal Detalle Curso */}
      <Modal open={!!viewCourse} onClose={() => setViewCourse(null)} title={`Ficha del Curso`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
          <div style={{ background:`${C.amber}15`, border:`1px solid ${C.amber}30`, padding:'14px', borderRadius:'10px' }}>
            <div style={{ fontWeight:700, fontSize:'16px', color:C.amber, marginBottom:'4px' }}>{viewCourse?.name}</div>
            <div style={{ color:C.text, fontSize:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
              <Ico.Teacher s={14} c={C.amber}/> Profesor: <strong>{teachers.find(t=>t.id===viewCourse?.teacherId)?.name || 'Sin Asignar'}</strong>
            </div>
          </div>
          <div style={{ fontWeight:600, fontSize:'13px', color:C.textSub, textTransform:'uppercase', display:'flex', justifyContent:'space-between' }}>
            <span>Nómina de Alumnos</span>
            <span>{students.filter(s => (s.enrolledCourses||[]).includes(viewCourse?.id)).length} inscritos</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'300px', overflowY:'auto', paddingRight:'5px' }}>
            {students.filter(s => (s.enrolledCourses||[]).includes(viewCourse?.id)).length === 0 ? (
              <div style={{ background:C.surface, padding:'15px', borderRadius:'8px', color:C.muted, fontSize:'13px', textAlign:'center' }}>No hay alumnos matriculados en este curso.</div>
            ) : (
              students.filter(s => (s.enrolledCourses||[]).includes(viewCourse?.id)).map((s, idx) => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'10px', background:C.card, border:`1px solid ${C.border}`, padding:'10px 14px', borderRadius:'8px' }}>
                  <div style={{ color:C.muted, fontSize:'12px', width:'15px' }}>{idx+1}.</div>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:`${C.green}20`,color:C.green,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'11px' }}>{s.name[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'13px' }}>{s.name}</div>
                    <div style={{ color:C.muted, fontSize:'11px' }}>RUT: {s.rut}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Modal Detalle Alumno (Asignación) */}
      <Modal open={!!assignModal} onClose={() => { setAssignModal(null); setModalErr(''); setSelectedCourseId(''); }} title={`Perfil del Alumno`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', background:C.surface, padding:'14px', borderRadius:'10px' }}>
            <div style={{ width:48,height:48,borderRadius:'50%',background:`${C.green}20`,color:C.green,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'18px' }}><Ico.Student s={24}/></div>
            <div>
              <div style={{ fontWeight:700, fontSize:'16px' }}>{assignModal?.name}</div>
              <div style={{ color:C.muted, fontSize:'12px' }}>RUT: {assignModal?.rut} · Curso Base: {assignModal?.course}</div>
            </div>
          </div>
          
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: C.textSub, marginBottom: '8px', textTransform: 'uppercase' }}>Materias Inscritas</div>
            {(!assignModal?.enrolledCourses || assignModal.enrolledCourses.length === 0) ? (
              <div style={{ background: C.surface, padding: '12px', borderRadius: '8px', color: C.muted, fontSize: '13px', textAlign: 'center' }}>No está cursando materias.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assignModal.enrolledCourses.map(courseId => {
                   const cInfo = courses.find(c => c.id === courseId);
                   const tInfo = teachers.find(t => t.id === cInfo?.teacherId);
                   return (
                     <div key={courseId} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', background: C.card, padding: '12px 14px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                       <div>
                         <div style={{ fontSize: '14px', fontWeight: 600, display:'flex', alignItems:'center', gap:'6px' }}><Ico.Book s={14} c={C.accent}/> {cInfo ? cInfo.name : 'Curso eliminado'}</div>
                         <div style={{ fontSize: '12px', color: C.muted, marginTop:'4px', display:'flex', alignItems:'center', gap:'4px' }}><Ico.Teacher s={12}/> Prof. {tInfo ? tInfo.name : 'Sin asignar'}</div>
                       </div>
                       <button onClick={() => handleRemoveCourse(courseId)} style={{ color: C.red, background: 'none', border: `1px solid ${C.red}40`, borderRadius:'6px', padding:'4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight:600 }}>Quitar</button>
                     </div>
                   )
                })}
              </div>
            )}
          </div>
          <div style={{ height: '1px', background: C.border }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: C.textSub, marginBottom: '8px', textTransform: 'uppercase' }}>Matricular en nueva materia</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  options={[
                    { value: '', label: 'Selecciona una materia...' },
                    ...courses.filter(c => !(assignModal?.enrolledCourses || []).includes(c.id)).map(c => {
                        const t = teachers.find(x => x.id === c.teacherId);
                        return { value: c.id, label: `${c.name} (Prof. ${t?.name || 'Sin asignar'})` };
                      })
                  ]}
                />
              </div>
              <Btn onClick={handleAssignCourse} disabled={!selectedCourseId}>Inscribir</Btn>
            </div>
          </div>
          {modalErr && <Alert type="error">{modalErr}</Alert>}
        </div>
      </Modal>

      {/* --- MODALES DE CREACIÓN BÁSICOS --- */}
      <Modal open={userModal} onClose={()=>{ setUserModal(false); setModalErr(''); }} title={`Pre-registrar ${newUser.role==='teacher'?'Profesor':'Alumno'}`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
          <Select label="Rol" value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))} options={[{value:'teacher',label:'Profesor'},{value:'student',label:'Alumno'}]} />
          <Input label="RUT (Sin puntos y con guion)" placeholder="12345678-9" value={newUser.rut} onChange={e=>setNewUser(u=>({...u,rut:e.target.value}))} />
          <Input label="Nombre completo" placeholder="Ej: Juan Pérez" value={newUser.name} onChange={e=>setNewUser(u=>({...u,name:e.target.value}))} />
          {newUser.role === 'student' && ( <Input label="Curso Base (Ej: 8vo B)" placeholder="Ej: 8vo B" value={newUser.course} onChange={e=>setNewUser(u=>({...u,course:e.target.value}))} /> )}
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} onClick={handleCreateUser}>Registrar en el sistema</Btn>
        </div>
      </Modal>

      <Modal open={courseModal} onClose={()=>{ setCourseModal(false); setModalErr(''); }} title="Configurar Nueva Materia">
        <div style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
          <Input label="Nombre Interno (Ej: 8vo A - Ciencias)" placeholder="8° A - Ciencias" value={newCourse.name} onChange={e=>setNewCourse(c=>({...c,name:e.target.value}))} />
          <Input label="Materia" placeholder="Ciencias Naturales" value={newCourse.subject} onChange={e=>setNewCourse(c=>({...c,subject:e.target.value}))} />
          <Input label="Nivel Educativo" placeholder="8° Básico" value={newCourse.grade} onChange={e=>setNewCourse(c=>({...c,grade:e.target.value}))} />
          <Select label="Profesor Titular" value={newCourse.teacherId} onChange={e=>setNewCourse(c=>({...c,teacherId:e.target.value}))} options={[{value:'',label:'Dejar pendiente (Sin asignar)'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} onClick={handleCreateCourse}>Crear Materia</Btn>
        </div>
      </Modal>

    </div>
  );
}