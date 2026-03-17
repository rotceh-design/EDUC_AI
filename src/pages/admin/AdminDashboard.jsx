// src/pages/admin/AdminDashboard.jsx — educ_AI v4.0 CYBERPUNK
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { C } from '@/theme';
import { Card, Btn, Modal, Input, Select, StatCard, SectionHeader, Alert, EmptyState, Spinner, Tabs, Badge } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getStudentMetrics } from '@/services/analyticsService';
import { exportAdminReport } from '@/services/reportService';

// ── ICONOS ────────────────────────────────────────────────────────────────────
const I = {
  Teacher:  ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Student:  ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Book:     ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Users:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chart:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>,
  Download: ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye:      ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Plus:     ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:     ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Mail:     ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Activity: ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Shield:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Rocket:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const initialUser   = { role:'student', rut:'', name:'', email:'', phone:'', guardian:'', specialty:'', classGroupId:'' };
const initialGroup  = { name:'', level:'', year: new Date().getFullYear().toString() };
const initialMat    = { name:'', teacherId:'' };

const onlineStatus = (ts) => {
  if (!ts) return { color:C.muted, text:'Sin ingreso', dot:C.muted };
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const m = Math.floor((Date.now()-d)/60000);
  if (m < 15)   return { color:C.green, text:'Online ahora',         dot:C.green };
  if (m < 1440) return { color:C.amber, text:`Hace ${Math.floor(m/60)||1}h`, dot:C.amber };
  return { color:C.textSub, text:`Hace ${Math.floor(m/1440)}d`, dot:C.textSub };
};

const timeAgo = (d) => {
  if (!d) return '—';
  const m = Math.floor((Date.now()-new Date(d))/60000);
  if (m < 60)   return `${m||1} min`;
  if (m < 1440) return `${Math.floor(m/60)}h`;
  return `${Math.floor(m/1440)}d`;
};

// ── COMPONENTE BADGE DE ESTADO ONLINE ─────────────────────────────────────────
function OnlineDot({ ts }) {
  const s = onlineStatus(ts);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:s.dot,
        boxShadow:`0 0 8px ${s.dot}`, flexShrink:0 }} />
      <span style={{ fontSize:'12px', color:s.color, fontWeight:600 }}>{s.text}</span>
    </div>
  );
}

// ── KPI CARD INMERSIVA ─────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, sub, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:C.card, border:`1px solid ${hovered?color:C.border}`,
        borderRadius:'16px', padding:'20px', cursor:onClick?'pointer':'default',
        transition:'all .25s cubic-bezier(.16,1,.3,1)',
        transform:hovered&&onClick?'translateY(-3px)':'none',
        boxShadow:hovered&&onClick?`0 10px 30px ${color}25`:'none',
        position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px',
        background:`radial-gradient(circle at 100% 0%, ${color}20 0%, transparent 70%)`,
        pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ width:40, height:40, borderRadius:'10px', background:`${color}15`,
          border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center',
          color }}>
          {icon}
        </div>
        {onClick && <span style={{ fontSize:'12px', color:color, fontWeight:700 }}>Ver →</span>}
      </div>
      <div style={{ fontFamily:"'Press Start 2P', cursive", fontSize:'22px', fontWeight:700,
        color, marginBottom:'6px' }}>{value}</div>
      <div style={{ fontSize:'12px', color:C.textSub, fontWeight:600, textTransform:'uppercase',
        letterSpacing:'.04em' }}>{label}</div>
      {sub && <div style={{ fontSize:'11px', color:C.muted, marginTop:'3px' }}>{sub}</div>}
    </div>
  );
}

// ── CHIP DE ACCIÓN RÁPIDA ─────────────────────────────────────────────────────
function ActionChip({ icon, label, color, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'flex', alignItems:'center', gap:'10px', background:h?color:`${color}15`,
        border:`1px solid ${h?color:`${color}40`}`, borderRadius:'12px',
        padding:'12px 18px', cursor:'pointer', color:h?'#000':color,
        fontSize:'13px', fontWeight:700, transition:'all .2s', width:'100%',
        boxShadow:h?`0 4px 15px ${color}40`:'none' }}>
      <span style={{ display:'flex', alignItems:'center', color:h?'#000':color }}>{icon}</span>
      {label}
    </button>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const schoolId    = profile?.schoolId;

  const [tab,         setTab]         = useState('Resumen');
  const [school,      setSchool]      = useState(null);
  const [teachers,    setTeachers]    = useState([]);
  const [students,    setStudents]    = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Modales
  const [userModal,        setUserModal]        = useState(false);
  const [groupModal,       setGroupModal]       = useState(false);
  const [materiaModal,     setMateriaModal]     = useState(null);
  const [studentModal,     setStudentModal]     = useState(null);
  const [teacherModal,     setTeacherModal]     = useState(null);
  const [editMateriaModal, setEditMateriaModal] = useState(null);

  // Stats en modal
  const [statsLoading, setStatsLoading] = useState(false);
  const [teacherStats, setTeacherStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);

  // Forms
  const [newUser,   setNewUser]   = useState(initialUser);
  const [newGroup,  setNewGroup]  = useState(initialGroup);
  const [newMat,    setNewMat]    = useState(initialMat);
  const [selAula,   setSelAula]   = useState('');
  const [selMat4T,  setSelMat4T]  = useState('');
  const [selMat4S,  setSelMat4S]  = useState('');

  const [saving,      setSaving]      = useState(false);
  const [modalErr,    setModalErr]    = useState('');
  const [success,     setSuccess]     = useState('');
  const [reportBusy,  setReportBusy]  = useState(false);

  // ── CARGA ──────────────────────────────────────────────────────────────────
  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      let schData = { name: schoolId };
      try { const sd = await getDoc(doc(db,'schools',schoolId)); if(sd.exists()) schData=sd.data(); } catch{}
      const uSnap = await getDocs(query(collection(db,'users'), where('schoolId','==',schoolId)));
      const all   = uSnap.docs.map(d=>({id:d.id,...d.data()}));
      setTeachers(all.filter(u=>u.role==='teacher').sort((a,b)=>a.name.localeCompare(b.name)));
      setStudents(all.filter(u=>u.role==='student').sort((a,b)=>a.name.localeCompare(b.name)));
      const cgSnap = await getDocs(query(collection(db,'classGroups'), where('schoolId','==',schoolId)));
      setClassGroups(cgSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name)));
      const cSnap  = await getDocs(query(collection(db,'courses'), where('schoolId','==',schoolId)));
      setCourses(cSnap.docs.map(d=>({id:d.id,...d.data()})));
      setSchool(schData);
    } catch(e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { if (schoolId) load(); }, [schoolId]);

  // ── ABRIR MODALES CON ANALYTICS ────────────────────────────────────────────
  const openTeacherModal = async (t) => {
    setTeacherModal(t); setTeacherStats(null); setStatsLoading(true);
    try {
      const tCourses  = courses.filter(c=>c.teacherId===t.id).map(c=>c.id);
      const tStudents = students.filter(s=>s.enrolledCourses?.some(id=>tCourses.includes(id)));
      const clSnap    = await getDocs(query(collection(db,'classes'),where('teacherId','==',t.id)));
      setTeacherStats({ courses:tCourses.length, students:tStudents.length, classes:clSnap.size });
    } catch(e){console.error(e);}
    setStatsLoading(false);
  };

  const openStudentModal = async (s) => {
    setStudentModal(s); setStudentStats(null); setStatsLoading(true);
    try { const m = await getStudentMetrics(s.uid||s.id, schoolId); setStudentStats(m); }
    catch(e){console.error(e);}
    setStatsLoading(false);
  };

  // ── CRUD HANDLERS ──────────────────────────────────────────────────────────
  const ok = (msg) => { setSuccess(msg); load(); setTimeout(()=>setSuccess(''),3000); };
  const fail = (e) => { setModalErr(e?.message||'Error'); };

  const handleCreateGroup = async () => {
    if (!newGroup.name||!newGroup.level) { setModalErr('Completa nombre y nivel'); return; }
    setSaving(true); setModalErr('');
    try {
      await addDoc(collection(db,'classGroups'),{...newGroup,schoolId,createdAt:serverTimestamp()});
      setGroupModal(false); setNewGroup(initialGroup); ok('✓ Aula creada');
    } catch(e){fail(e);}
    setSaving(false);
  };

  const handleCreateMateria = async () => {
    if (!newMat.name||!newMat.teacherId){setModalErr('Falta nombre o profesor');return;}
    setSaving(true); setModalErr('');
    try {
      const parentAula = classGroups.find(cg=>cg.id===materiaModal);
      const ref = await addDoc(collection(db,'courses'),{
        name:newMat.name, subject:newMat.name, grade:parentAula?.name||'',
        classGroupId:materiaModal, teacherId:newMat.teacherId,
        schoolId, createdAt:serverTimestamp()
      });
      for(const st of students.filter(s=>s.classGroupId===materiaModal)){
        await updateDoc(doc(db,'users',st.id),{enrolledCourses:[...(st.enrolledCourses||[]),ref.id]});
      }
      setMateriaModal(null); setNewMat(initialMat); ok('✓ Materia añadida');
    } catch(e){fail(e);}
    setSaving(false);
  };

  const handleUpdateMateria = async () => {
    if(!editMateriaModal?.name||!editMateriaModal?.teacherId){setModalErr('Faltan datos');return;}
    setSaving(true); setModalErr('');
    try {
      await updateDoc(doc(db,'courses',editMateriaModal.id),{
        name:editMateriaModal.name,subject:editMateriaModal.name,teacherId:editMateriaModal.teacherId
      });
      setEditMateriaModal(null); ok('✓ Materia actualizada');
    } catch(e){fail(e);}
    setSaving(false);
  };

  const handleCreateUser = async () => {
    if(!newUser.name||!newUser.rut){setModalErr('Nombre y RUT obligatorios');return;}
    setSaving(true); setModalErr('');
    try {
      const enrolled = newUser.role==='student'&&newUser.classGroupId
        ? courses.filter(c=>c.classGroupId===newUser.classGroupId).map(c=>c.id) : [];
      await addDoc(collection(db,'users'),{
        ...newUser, enrolledCourses:enrolled, schoolId, uid:null, xp:0, createdAt:serverTimestamp()
      });
      setUserModal(false); setNewUser(initialUser); ok('✓ Perfil registrado');
    } catch(e){fail(e);}
    setSaving(false);
  };

  const handleChangeAula = async () => {
    if(!selAula||!studentModal)return;
    setSaving(true); setModalErr('');
    try {
      const newIds = courses.filter(c=>c.classGroupId===selAula).map(c=>c.id);
      const merged = [...new Set([...(studentModal.enrolledCourses||[]),...newIds])];
      await updateDoc(doc(db,'users',studentModal.id),{classGroupId:selAula,enrolledCourses:merged});
      setStudentModal({...studentModal,classGroupId:selAula,enrolledCourses:merged});
      setSelAula(''); ok('✓ Aula actualizada');
    } catch(e){setModalErr('Error al cambiar aula');}
    setSaving(false);
  };

  const handleAddCourse2Student = async () => {
    if(!selMat4S||!studentModal)return;
    setSaving(true); setModalErr('');
    try {
      const merged=[...new Set([...(studentModal.enrolledCourses||[]),selMat4S])];
      await updateDoc(doc(db,'users',studentModal.id),{enrolledCourses:merged});
      setStudentModal({...studentModal,enrolledCourses:merged});
      setSelMat4S(''); ok('✓ Materia vinculada');
    } catch(e){setModalErr('Error');}
    setSaving(false);
  };

  const handleRemoveCourse2Student = async (cid) => {
    if(!studentModal||!window.confirm('¿Desvincular?'))return;
    try {
      const nw=studentModal.enrolledCourses.filter(id=>id!==cid);
      await updateDoc(doc(db,'users',studentModal.id),{enrolledCourses:nw});
      setStudentModal({...studentModal,enrolledCourses:nw}); load();
    } catch(e){console.error(e);}
  };

  const handleAddMat2Teacher = async () => {
    if(!selMat4T||!teacherModal)return;
    setSaving(true);
    try {
      await updateDoc(doc(db,'courses',selMat4T),{teacherId:teacherModal.id});
      setSelMat4T(''); ok('✓ Materia asignada'); openTeacherModal(teacherModal);
    } catch(e){}
    setSaving(false);
  };

  const handleRemoveMat4Teacher = async (cid) => {
    if(!window.confirm('¿Quitar materia al profesor?'))return;
    try { await updateDoc(doc(db,'courses',cid),{teacherId:''}); openTeacherModal(teacherModal); load(); }
    catch(e){console.error(e);}
  };

  const handleDeleteCourse = async (cid) => {
    if(window.confirm('¿Eliminar esta materia?'))
      try { await deleteDoc(doc(db,'courses',cid)); load(); } catch(e){console.error(e);}
  };

  // ── REPORT ─────────────────────────────────────────────────────────────────
  const handleReport = async () => {
    setReportBusy(true);
    try {
      const enriched = await Promise.all(students.map(async s=>{
        try { const m=await getStudentMetrics(s.uid||s.id,schoolId); return{...s,riskScore:m.riskScore??100,metrics:m}; }
        catch{ return{...s,riskScore:100,metrics:{}}; }
      }));
      await exportAdminReport({
        school, students:enriched, teachers,
        classGroups, courses, classes:[], alerts:[],
      });
    } catch(e){ alert('Error: '+e.message); }
    setReportBusy(false);
  };

  // ── TIMELINE ───────────────────────────────────────────────────────────────
  const timeline = [...students.map(s=>({...s,_t:'student'})),...courses.map(c=>({...c,_t:'course'}))]
    .filter(x=>x.createdAt).sort((a,b)=>b.createdAt.toMillis()-a.createdAt.toMillis()).slice(0,8);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
      {/* Aura de fondo */}
      <div style={{ position:'fixed', top:'-15%', left:'-10%', width:'60%', height:'60%', background:`radial-gradient(circle, ${C.accent}10 0%, transparent 65%)`, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'50%', height:'50%', background:`radial-gradient(circle, ${C.pink}08 0%, transparent 65%)`, pointerEvents:'none', zIndex:0 }} />

      <Navbar />
      <main style={{ maxWidth:'1120px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 className="glow-text" style={{ marginBottom:'6px' }}>CENTRO DE COMANDO</h1>
            <p style={{ color:C.accent, fontSize:'13px', fontWeight:600, letterSpacing:'.02em' }}>
              {school?.name || schoolId} · Panel Administrativo
            </p>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <Btn outline color={C.accent} onClick={()=>navigate('/admin/analytics')} icon={<I.Chart s={15}/>}>
              Analítica IA
            </Btn>
          </div>
        </div>

        {success && <div className="anim-fade-up" style={{ marginBottom:'16px' }}><Alert type="success">{success}</Alert></div>}

        {/* ── KPIs INMERSIVOS ─────────────────────────────────────────────── */}
        <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px', marginBottom:'32px' }}>
          <KpiCard label="Docentes"      value={teachers.length}    icon={<I.Teacher s={18}/>}  color={C.accent}  onClick={()=>setTab('Profesores')} />
          <KpiCard label="Alumnos"       value={students.length}    icon={<I.Student s={18}/>}  color={C.green}   onClick={()=>setTab('Alumnos')} />
          <KpiCard label="Aulas"         value={classGroups.length} icon={<I.Users s={18}/>}    color={C.amber}   onClick={()=>setTab('Estructura')} />
          <KpiCard label="Materias"      value={courses.length}     icon={<I.Book s={18}/>}     color={C.violet}  onClick={()=>setTab('Estructura')} />
        </div>

        <Tabs tabs={['Resumen','Estructura','Profesores','Alumnos','Reportes']} active={tab} onChange={setTab} />

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'70px' }}>
            <Spinner size={40} />
          </div>
        ) : (
          <>
            {/* ══ RESUMEN ══════════════════════════════════════════════════ */}
            {tab === 'Resumen' && (
              <div className="anim-fade-up" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'20px' }}>

                {/* Acciones rápidas */}
                <Card style={{ padding:'22px', background:`${C.accent}06`, borderColor:`${C.accent}20` }}>
                  <div style={{ fontWeight:700, fontSize:'14px', color:C.accent, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <I.Rocket s={16} c={C.accent}/> Acciones Rápidas
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    <ActionChip icon={<I.Plus s={16}/>}    label="Crear Aula Escolar"   color={C.amber}  onClick={()=>setGroupModal(true)}/>
                    <ActionChip icon={<I.Teacher s={16}/>} label="Registrar Docente"    color={C.accent} onClick={()=>{setNewUser({...initialUser,role:'teacher'});setUserModal(true);}}/>
                    <ActionChip icon={<I.Student s={16}/>} label="Matricular Alumno"    color={C.green}  onClick={()=>{setNewUser({...initialUser,role:'student'});setUserModal(true);}}/>
                  </div>
                </Card>

                {/* Bitácora */}
                <Card style={{ padding:'0', overflow:'hidden', gridColumn:'span 1' }}>
                  <div style={{ padding:'16px 20px', background:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'8px' }}>
                    <I.Activity s={15} c={C.accent}/>
                    <span style={{ fontWeight:700, fontSize:'13px' }}>Bitácora del Sistema</span>
                    <Badge color={C.accent} style={{ marginLeft:'auto' }}>Live</Badge>
                  </div>
                  <div style={{ maxHeight:'280px', overflowY:'auto' }}>
                    {timeline.length === 0 ? (
                      <div style={{ padding:'30px', textAlign:'center', color:C.muted, fontSize:'13px' }}>Sin actividad reciente</div>
                    ) : timeline.map((item,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 20px',
                        borderBottom:i<timeline.length-1?`1px solid ${C.border}40`:'none',
                        transition:'background .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                          background:item._t==='student'?C.green:C.violet,
                          boxShadow:`0 0 8px ${item._t==='student'?C.green:C.violet}` }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'13px', color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {item._t==='student'?`Alta: ${item.name}`:`Nueva materia: ${item.name}`}
                          </div>
                          <div style={{ fontSize:'11px', color:C.muted }}>
                            {item._t==='student'?item.rut:classGroups.find(cg=>cg.id===item.classGroupId)?.name||'—'}
                          </div>
                        </div>
                        <span style={{ fontSize:'11px', color:C.muted, flexShrink:0 }}>
                          {timeAgo(item.createdAt?.toDate?.())}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══ ESTRUCTURA ═══════════════════════════════════════════════ */}
            {tab === 'Estructura' && (
              <div className="anim-fade-up">
                <SectionHeader title="Mapa Estructural del Colegio" sub="Aulas, materias y profesores asignados" action={<Btn small color={C.amber} onClick={()=>setGroupModal(true)} icon={<I.Plus s={13}/>}>Nueva Aula</Btn>} />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'16px' }}>
                  {classGroups.length===0 && <EmptyState emoji="🏫" title="Sin aulas creadas" desc="Crea la primera aula para comenzar a estructurar el colegio." />}
                  {classGroups.map(cg => {
                    const mats   = courses.filter(c=>c.classGroupId===cg.id);
                    const nAlum  = students.filter(s=>s.classGroupId===cg.id).length;
                    return (
                      <Card key={cg.id} style={{ padding:0, overflow:'hidden',
                        border:`1px solid ${C.border}`, transition:'border-color .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.amber}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        {/* Header del aula */}
                        <div style={{ background:`linear-gradient(135deg, ${C.amber}20, transparent)`,
                          padding:'16px 20px', borderBottom:`1px solid ${C.border}`,
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:'17px', color:C.text }}>{cg.name}</div>
                            <div style={{ fontSize:'12px', color:C.muted, marginTop:'2px' }}>
                              Nivel {cg.level} · {cg.year}
                            </div>
                          </div>
                          <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}30`,
                            borderRadius:'10px', padding:'8px 14px', textAlign:'center' }}>
                            <div style={{ fontWeight:800, fontSize:'18px', color:C.green }}>{nAlum}</div>
                            <div style={{ fontSize:'9px', color:C.muted, textTransform:'uppercase', fontWeight:700 }}>Alumnos</div>
                          </div>
                        </div>
                        {/* Materias */}
                        <div style={{ padding:'16px 20px', background:C.card }}>
                          <div style={{ fontSize:'10px', fontWeight:700, color:C.textSub,
                            textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'10px' }}>
                            Materias ({mats.length})
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px' }}>
                            {mats.length===0 && (
                              <div style={{ color:C.muted, fontSize:'12px', textAlign:'center', padding:'10px',
                                border:`1px dashed ${C.border}`, borderRadius:'8px' }}>
                                Sin materias aún
                              </div>
                            )}
                            {mats.map(m => {
                              const profe = teachers.find(t=>t.id===m.teacherId);
                              return (
                                <div key={m.id} onClick={()=>setEditMateriaModal(m)}
                                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                                    background:C.surface, padding:'9px 13px', borderRadius:'9px',
                                    cursor:'pointer', border:`1px solid ${C.border}`, transition:'all .18s' }}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.boxShadow=`0 0 10px ${C.accent}15`}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none'}}>
                                  <div>
                                    <div style={{ fontWeight:600, fontSize:'13px', color:C.text,
                                      display:'flex', alignItems:'center', gap:'6px' }}>
                                      {m.name}
                                      <I.Edit s={11} c={C.muted}/>
                                    </div>
                                    <div style={{ fontSize:'11px', marginTop:'2px',
                                      color:profe?C.textSub:C.red,
                                      display:'flex', alignItems:'center', gap:'4px' }}>
                                      <I.Teacher s={9} c={profe?C.textSub:C.red}/>
                                      {profe?profe.name:'Sin asignar'}
                                    </div>
                                  </div>
                                  <button onClick={e=>{e.stopPropagation();handleDeleteCourse(m.id);}}
                                    style={{ background:`${C.red}15`, border:'none', color:C.red,
                                      cursor:'pointer', padding:'6px', borderRadius:'6px',
                                      display:'flex', alignItems:'center' }}>
                                    <I.Trash s={13}/>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <Btn full outline color={C.accent} onClick={()=>setMateriaModal(cg.id)} icon={<I.Plus s={13}/>}>
                            Añadir Materia
                          </Btn>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ PROFESORES ═══════════════════════════════════════════════ */}
            {tab === 'Profesores' && (
              <div className="anim-fade-up">
                <SectionHeader title="Plantilla Docente" sub={`${teachers.length} profesores registrados`}
                  action={<Btn small onClick={()=>{setNewUser({...initialUser,role:'teacher'});setUserModal(true);}} icon={<I.Plus s={13}/>}>Nuevo Docente</Btn>} />
                {teachers.length===0 && <EmptyState emoji="👩‍🏫" title="Sin docentes" desc="Registra el primer profesor para comenzar." />}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'14px' }}>
                  {teachers.map((t,i) => {
                    const nMats = courses.filter(c=>c.teacherId===t.id).length;
                    return (
                      <div key={t.id} className={`anim-fade-up anim-d${Math.min(i+1,5)}`}
                        style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'16px',
                          padding:'18px', opacity:t.uid?1:0.75, transition:'border-color .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=`${C.accent}60`}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                          <div style={{ width:44,height:44,borderRadius:'50%',
                            background:`linear-gradient(135deg,${C.accent}30,${C.accent}10)`,
                            border:`1.5px solid ${C.accent}40`,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontWeight:800,color:C.accent,fontSize:'18px',flexShrink:0 }}>
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:'15px', color:C.text,
                              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {t.name}
                            </div>
                            <div style={{ color:C.muted, fontSize:'12px' }}>RUT: {t.rut}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          background:C.surface, borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>
                          <OnlineDot ts={t.lastActive} />
                          <span style={{ fontSize:'12px', color:C.accent, fontWeight:700,
                            background:`${C.accent}15`, padding:'3px 9px', borderRadius:'20px' }}>
                            {nMats} materias
                          </span>
                        </div>
                        <button onClick={()=>openTeacherModal(t)}
                          style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center',
                            gap:'6px', background:`${C.accent}12`, color:C.accent,
                            border:`1px solid ${C.accent}30`, padding:'10px', borderRadius:'10px',
                            cursor:'pointer', fontSize:'13px', fontWeight:700, transition:'all .2s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background=`${C.accent}25`;e.currentTarget.style.boxShadow=`0 4px 14px ${C.accent}20`;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=`${C.accent}12`;e.currentTarget.style.boxShadow='none';}}>
                          <I.Eye s={15}/> Ver Expediente
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ ALUMNOS ═══════════════════════════════════════════════════ */}
            {tab === 'Alumnos' && (
              <div className="anim-fade-up">
                <SectionHeader title="Directorio de Alumnos" sub={`${students.length} matriculados`}
                  action={<Btn small onClick={()=>{setNewUser({...initialUser,role:'student'});setUserModal(true);}} icon={<I.Plus s={13}/>}>Matricular</Btn>} />
                {students.length===0 && <EmptyState emoji="🎒" title="Sin alumnos" desc="Matricula el primer alumno para comenzar." />}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'14px' }}>
                  {students.map((s,i) => {
                    const aula = classGroups.find(cg=>cg.id===s.classGroupId);
                    const hasAula = !!aula;
                    return (
                      <div key={s.id} className={`anim-fade-up anim-d${Math.min(i+1,5)}`}
                        style={{ background:C.card,
                          borderLeft:`3px solid ${hasAula?C.green:C.amber}`,
                          border:`1px solid ${C.border}`,
                          borderRadius:'16px', padding:'18px', opacity:s.uid?1:0.8, transition:'border-color .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=`${C.green}60`}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                          <div style={{ width:44,height:44,borderRadius:'50%',
                            background:`linear-gradient(135deg,${C.green}30,${C.green}10)`,
                            border:`1.5px solid ${C.green}40`,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontWeight:800,color:C.green,fontSize:'18px',flexShrink:0 }}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:'15px', color:C.text }}>{s.name}</div>
                            <div style={{ fontSize:'12px', color:C.muted, display:'flex', gap:'8px', alignItems:'center', marginTop:'2px' }}>
                              <span>{aula?aula.name:'Sin aula'}</span>
                              <span style={{ color:C.amber, fontWeight:700, fontFamily:"'Press Start 2P',cursive", fontSize:'10px' }}>
                                {s.xp||0} XP
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={()=>openStudentModal(s)}
                          style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center',
                            gap:'6px', background:`${C.green}12`, color:C.green,
                            border:`1px solid ${C.green}30`, padding:'10px', borderRadius:'10px',
                            cursor:'pointer', fontSize:'13px', fontWeight:700, transition:'all .2s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background=`${C.green}25`;e.currentTarget.style.boxShadow=`0 4px 14px ${C.green}20`;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=`${C.green}12`;e.currentTarget.style.boxShadow='none';}}>
                          <I.Eye s={15}/> Analizar Perfil
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ REPORTES ══════════════════════════════════════════════════ */}
            {tab === 'Reportes' && (
              <div className="anim-fade-up">
                {/* Hero del reporte */}
                <div style={{ background:`linear-gradient(135deg, ${C.accent}15, ${C.violet}15)`,
                  border:`1px solid ${C.accent}25`, borderRadius:'20px',
                  padding:'28px 32px', marginBottom:'28px',
                  display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap' }}>
                  <div style={{ width:60,height:60, borderRadius:'16px',
                    background:`linear-gradient(135deg,${C.accent},${C.violet})`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <I.Download s={28} c="#fff"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:'18px', marginBottom:'5px' }}>
                      Reporte Integral de Gestión
                    </div>
                    <div style={{ color:C.textSub, fontSize:'13px', lineHeight:1.65 }}>
                      Excel profesional con <strong style={{color:C.accent}}>7 hojas</strong>: Portada, Estadísticas, Matrícula, Docentes, Bitácora, Acta de Riesgo e Informe por Aula.
                    </div>
                    <div style={{ fontSize:'12px', color:C.amber, marginTop:'8px' }}>
                      ⚠️ Requiere <code style={{background:C.surface,padding:'2px 6px',borderRadius:'4px'}}>npm install xlsx</code>
                    </div>
                  </div>
                  <Btn color={C.accent} size="lg" loading={reportBusy} onClick={handleReport}
                    icon={<I.Download s={16}/>} style={{ flexShrink:0 }}>
                    Descargar Reporte
                  </Btn>
                </div>

                {/* 3 reportes CSV rápidos */}
                <SectionHeader title="Exportaciones Rápidas" sub="Bases de datos individuales en formato .xlsx" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px', marginBottom:'32px' }}>
                  {[
                    { label:'Data Estudiantil',   color:C.green,  icon:<I.Student s={22}/>,
                      desc:'Directorio de alumnos con aulas, materias, apoderado y XP.',
                      type:'academic' },
                    { label:'Plantilla Docente',  color:C.accent, icon:<I.Teacher s={22}/>,
                      desc:'Ficha completa de profesores con especialidades y carga.',
                      type:'teachers' },
                    { label:'Estructura Académica',color:C.amber, icon:<I.Book s={22}/>,
                      desc:'Distribución de aulas, materias y alumnos por curso.',
                      type:'courses' },
                  ].map(r => (
                    <Card key={r.type} style={{ padding:'22px', borderTop:`3px solid ${r.color}`, transition:'all .2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 8px 25px ${r.color}20`;e.currentTarget.style.transform='translateY(-2px)';}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
                      <div style={{ display:'flex', gap:'14px', marginBottom:'16px', alignItems:'flex-start' }}>
                        <div style={{ width:46,height:46,borderRadius:'12px',
                          background:`${r.color}15`,color:r.color,
                          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          {r.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'4px' }}>{r.label}</div>
                          <div style={{ fontSize:'12px', color:C.muted, lineHeight:1.55 }}>{r.desc}</div>
                        </div>
                      </div>
                      <Btn full outline color={r.color} onClick={async()=>{
                        setReportBusy(true);
                        try {
                          let XLSX = await import('xlsx'); XLSX=XLSX.default||XLSX;
                          const wb = XLSX.utils.book_new();
                          const date = new Date().toLocaleDateString('es-CL').replace(/\//g,'-');
                          let rows=[],headers=[],name='';
                          if(r.type==='academic'){
                            headers=['RUT','Nombre','Email','Aula','Materias','XP','Apoderado'];
                            rows=students.map(s=>[s.rut,s.name,s.email||'—',classGroups.find(cg=>cg.id===s.classGroupId)?.name||'Sin Aula',s.enrolledCourses?.length||0,s.xp||0,s.guardian||'—']);
                            name=`Alumnos_${date}`;
                          } else if(r.type==='teachers'){
                            headers=['RUT','Nombre','Email','Especialidad','Materias','Teléfono'];
                            rows=teachers.map(t=>[t.rut,t.name,t.email||'—',t.specialty||'—',courses.filter(c=>c.teacherId===t.id).length,t.phone||'—']);
                            name=`Docentes_${date}`;
                          } else {
                            headers=['Aula','Nivel','Materia','Profesor','Alumnos'];
                            rows=courses.map(c=>{const a=classGroups.find(cg=>cg.id===c.classGroupId);const p=teachers.find(t=>t.id===c.teacherId);return[a?.name||'—',a?.level||'—',c.name,p?.name||'Sin asignar',students.filter(s=>s.enrolledCourses?.includes(c.id)).length];});
                            name=`Estructura_${date}`;
                          }
                          const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
                          XLSX.utils.book_append_sheet(wb,ws,'Datos');
                          XLSX.writeFile(wb,`${name}.xlsx`);
                        } catch(e){alert('Error: '+e.message);}
                        setReportBusy(false);
                      }} loading={reportBusy} icon={<I.Download s={14}/>}>
                        Descargar
                      </Btn>
                    </Card>
                  ))}
                </div>

                {/* Bitácora en reportes */}
                <SectionHeader title="Bitácora del Sistema" sub="Últimos registros en la plataforma" />
                <Card style={{ padding:0, overflow:'hidden' }}>
                  <div style={{ padding:'14px 22px', background:C.surface, borderBottom:`1px solid ${C.border}`,
                    display:'flex', alignItems:'center', gap:'8px' }}>
                    <I.Activity s={15} c={C.accent}/>
                    <span style={{ fontWeight:700, fontSize:'13px' }}>Cronología en tiempo real</span>
                    <div style={{ marginLeft:'auto', width:8,height:8,borderRadius:'50%',background:C.green,boxShadow:`0 0 8px ${C.green}` }} />
                  </div>
                  {timeline.map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px',
                      padding:'13px 22px', borderBottom:i<timeline.length-1?`1px solid ${C.border}40`:'none',
                      transition:'background .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{ width:9,height:9,borderRadius:'50%',flexShrink:0,
                        background:item._t==='student'?C.green:C.violet,
                        boxShadow:`0 0 8px ${item._t==='student'?C.green:C.violet}` }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:'13px', color:C.text }}>
                          {item._t==='student'?`Matriculado: ${item.name}`:  `Materia habilitada: ${item.name}`}
                        </div>
                        <div style={{ fontSize:'11px', color:C.muted, marginTop:'2px' }}>
                          {item._t==='student'?`RUT ${item.rut}`:classGroups.find(cg=>cg.id===item.classGroupId)?.name||'—'}
                        </div>
                      </div>
                      <span style={{ fontSize:'11px', color:C.muted, fontWeight:600, flexShrink:0 }}>
                        {timeAgo(item.createdAt?.toDate?.())} atrás
                      </span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ MODALES ═══════════════════════════════════════════════════════════ */}

      {/* MODAL: EDITAR MATERIA */}
      <Modal open={!!editMateriaModal} onClose={()=>{setEditMateriaModal(null);setModalErr('');}} title="Editar Materia">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ background:`${C.violet}10`, border:`1px solid ${C.violet}25`, borderRadius:'12px', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'11px', color:C.violet, textTransform:'uppercase', fontWeight:700, marginBottom:'4px' }}>Alumnos cursando</div>
              <div style={{ fontWeight:800, fontSize:'24px', color:C.text }}>{students.filter(s=>s.enrolledCourses?.includes(editMateriaModal?.id)).length}</div>
            </div>
            <I.Users s={32} c={C.violet}/>
          </div>
          <Input label="Nombre de la Materia" value={editMateriaModal?.name||''} onChange={e=>setEditMateriaModal({...editMateriaModal,name:e.target.value})} />
          <Select label="Profesor a cargo" value={editMateriaModal?.teacherId||''} onChange={e=>setEditMateriaModal({...editMateriaModal,teacherId:e.target.value})} options={[{value:'',label:'Sin profesor'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.accent} onClick={handleUpdateMateria}>Actualizar Materia</Btn>
        </div>
      </Modal>

      {/* MODAL: EXPEDIENTE DOCENTE */}
      <Modal open={!!teacherModal} onClose={()=>{setTeacherModal(null);setSelMat4T('');}} title="Expediente Docente">
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px', background:`linear-gradient(135deg,${C.accent}15,transparent)`, border:`1px solid ${C.accent}25`, padding:'18px', borderRadius:'14px' }}>
            <div style={{ width:54,height:54,borderRadius:'50%',background:`linear-gradient(135deg,${C.accent},${C.violet})`, color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'22px',boxShadow:`0 4px 15px ${C.accent}40` }}>
              {teacherModal?.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'17px' }}>{teacherModal?.name}</div>
              <div style={{ color:C.textSub, fontSize:'13px', marginTop:'3px' }}>RUT: {teacherModal?.rut} · {teacherModal?.specialty||'Docente'}</div>
              {teacherModal?.email && <div style={{ color:C.muted, fontSize:'12px', marginTop:'2px', display:'flex', alignItems:'center', gap:'5px' }}><I.Mail s={11}/>{teacherModal.email}</div>}
            </div>
          </div>

          {/* Stats */}
          {statsLoading ? <div style={{ textAlign:'center', padding:'20px' }}><Spinner size={24}/></div> : teacherStats && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              {[{v:teacherStats.courses,l:'Materias',c:C.accent},{v:teacherStats.students,l:'Alumnos',c:C.green},{v:teacherStats.classes,l:'Clases',c:C.amber}].map(k=>(
                <div key={k.l} style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}`, textAlign:'center' }}>
                  <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'20px', fontWeight:700, color:k.c }}>{k.v}</div>
                  <div style={{ fontSize:'10px', color:C.muted, textTransform:'uppercase', marginTop:'5px', fontWeight:700 }}>{k.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Vincular materia */}
          <div style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:'11px', color:C.textSub, fontWeight:700, textTransform:'uppercase', marginBottom:'10px' }}>Vincular nueva materia</div>
            <div style={{ display:'flex', gap:'8px' }}>
              <div style={{ flex:1 }}><Select value={selMat4T} onChange={e=>setSelMat4T(e.target.value)} options={[{value:'',label:'Selecciona una materia...'},...courses.filter(c=>c.teacherId!==teacherModal?.id).map(c=>({value:c.id,label:`${c.name} (${classGroups.find(cg=>cg.id===c.classGroupId)?.name||'—'})`}))]} /></div>
              <Btn color={C.accent} disabled={!selMat4T} loading={saving} onClick={handleAddMat2Teacher}>Asignar</Btn>
            </div>
          </div>

          {/* Materias actuales */}
          <div>
            <div style={{ fontSize:'11px', color:C.textSub, fontWeight:700, textTransform:'uppercase', marginBottom:'10px' }}>
              Materias impartidas ({courses.filter(c=>c.teacherId===teacherModal?.id).length})
            </div>
            {courses.filter(c=>c.teacherId===teacherModal?.id).length===0 && (
              <div style={{ color:C.muted, fontSize:'13px', textAlign:'center', padding:'14px', border:`1px dashed ${C.border}`, borderRadius:'8px' }}>Sin materias asignadas</div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
              {courses.filter(c=>c.teacherId===teacherModal?.id).map(c=>{
                const aula=classGroups.find(cg=>cg.id===c.classGroupId);
                return (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:C.card, border:`1px solid ${C.border}`, padding:'11px 14px', borderRadius:'9px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <I.Book s={14} c={C.accent}/>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'13px' }}>{c.name}</div>
                        <div style={{ color:C.muted, fontSize:'11px' }}>{aula?aula.name:'Independiente'}</div>
                      </div>
                    </div>
                    <button onClick={()=>handleRemoveMat4Teacher(c.id)} style={{ background:`${C.red}15`, border:'none', color:C.red, cursor:'pointer', padding:'7px', borderRadius:'7px', display:'flex' }}><I.Trash s={13}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: ANÁLISIS ALUMNO */}
      <Modal open={!!studentModal} onClose={()=>{setStudentModal(null);setModalErr('');setSelAula('');setSelMat4S('');}} title="Análisis del Estudiante">
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Header alumno */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px', background:`linear-gradient(135deg,${C.green}15,transparent)`, border:`1px solid ${C.green}25`, padding:'18px', borderRadius:'14px' }}>
            <div style={{ width:54,height:54,borderRadius:'50%',background:`linear-gradient(135deg,${C.green},#00d4aa)`,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'22px',boxShadow:`0 4px 15px ${C.green}40` }}>
              {studentModal?.name.charAt(0)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:'17px' }}>{studentModal?.name}</div>
              <div style={{ color:C.textSub, fontSize:'13px', marginTop:'3px' }}>RUT: {studentModal?.rut}</div>
              {studentModal?.guardian && <div style={{ color:C.muted, fontSize:'12px', marginTop:'2px', display:'flex', alignItems:'center', gap:'5px' }}><I.Users s={11}/>Apoderado: {studentModal.guardian}</div>}
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'18px', fontWeight:700, color:C.amber }}>{studentModal?.xp||0}</div>
              <div style={{ fontSize:'10px', color:C.amber, textTransform:'uppercase', fontWeight:700, marginTop:'4px' }}>XP</div>
            </div>
          </div>

          {/* Métricas IA */}
          {statsLoading ? <div style={{ textAlign:'center', padding:'16px' }}><Spinner size={24}/></div> : studentStats && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase', fontWeight:700, marginBottom:'6px' }}>Estado de Riesgo</div>
                <div style={{ fontWeight:800, fontSize:'15px', color:studentStats.riskScore<=39?C.red:studentStats.riskScore<=69?C.amber:C.green }}>
                  {studentStats.riskScore<=39?'🔴 Crítico':studentStats.riskScore<=69?'🟡 Observación':'🟢 Óptimo'}
                </div>
              </div>
              <div style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase', fontWeight:700, marginBottom:'6px' }}>Quiz Promedio</div>
                <div style={{ fontWeight:800, fontSize:'15px', color:C.text }}>🎯 {studentStats.avgQuizScore!=null?`${studentStats.avgQuizScore}%`:'—'}</div>
              </div>
              <div style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase', fontWeight:700, marginBottom:'6px' }}>Sesiones Totales</div>
                <div style={{ fontWeight:800, fontSize:'15px', color:C.text }}>📚 {studentStats.totalSessions||0}</div>
              </div>
              <div style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase', fontWeight:700, marginBottom:'6px' }}>Último Acceso</div>
                <div style={{ fontWeight:700, fontSize:'14px', color:studentStats.daysSinceLastActivity>7?C.red:C.text }}>
                  📅 {studentStats.daysSinceLastActivity===999?'Nunca':`Hace ${studentStats.daysSinceLastActivity}d`}
                </div>
              </div>
            </div>
          )}

          {/* Cambiar aula */}
          <div style={{ background:C.surface, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:'11px', color:C.textSub, fontWeight:700, textTransform:'uppercase', marginBottom:'10px' }}>Aula Escolar Base</div>
            <div style={{ display:'flex', gap:'8px' }}>
              <div style={{ flex:1 }}><Select value={selAula||studentModal?.classGroupId||''} onChange={e=>setSelAula(e.target.value)} options={[{value:'',label:'Selecciona el aula...'},...classGroups.map(cg=>({value:cg.id,label:`${cg.name} (${cg.year})`}))]} /></div>
              <Btn color={C.green} disabled={!selAula||selAula===studentModal?.classGroupId} loading={saving} onClick={handleChangeAula}>Cambiar</Btn>
            </div>
          </div>

          {/* Materias */}
          <div>
            <div style={{ fontSize:'11px', color:C.textSub, fontWeight:700, textTransform:'uppercase', marginBottom:'10px', display:'flex', justifyContent:'space-between' }}>
              <span>Materias vinculadas ({studentModal?.enrolledCourses?.length||0})</span>
            </div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
              <div style={{ flex:1 }}><Select value={selMat4S} onChange={e=>setSelMat4S(e.target.value)} options={[{value:'',label:'Añadir materia...'},...courses.filter(c=>!(studentModal?.enrolledCourses||[]).includes(c.id)).map(c=>({value:c.id,label:c.name}))]} /></div>
              <Btn color={C.accent} disabled={!selMat4S} loading={saving} onClick={handleAddCourse2Student}>Vincular</Btn>
            </div>
            {(!studentModal?.enrolledCourses||studentModal.enrolledCourses.length===0) ? (
              <div style={{ color:C.muted, fontSize:'12px', textAlign:'center', padding:'12px', border:`1px dashed ${C.border}`, borderRadius:'8px' }}>Sin materias asignadas</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                {studentModal.enrolledCourses.map(cid=>{
                  const ci=courses.find(c=>c.id===cid);
                  return (
                    <div key={cid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.card, padding:'9px 12px', borderRadius:'8px', border:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:600, color:C.text, minWidth:0 }}>
                        <I.Book s={12} c={C.accent}/><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ci?ci.name:'Eliminada'}</span>
                      </div>
                      <button onClick={()=>handleRemoveCourse2Student(cid)} style={{ background:`${C.red}15`, border:'none', color:C.red, cursor:'pointer', padding:'5px', borderRadius:'6px', flexShrink:0, display:'flex' }}><I.Trash s={11}/></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {modalErr && <Alert type="error">{modalErr}</Alert>}
        </div>
      </Modal>

      {/* MODAL: CREAR AULA */}
      <Modal open={groupModal} onClose={()=>{setGroupModal(false);setModalErr('');}} title="Nueva Aula Escolar">
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <Input label="Nombre (Ej: 8° Básico A)" placeholder="8° Básico A" value={newGroup.name} onChange={e=>setNewGroup(g=>({...g,name:e.target.value}))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Input label="Nivel" placeholder="8° Básico" value={newGroup.level} onChange={e=>setNewGroup(g=>({...g,level:e.target.value}))} />
            <Input label="Año" placeholder="2026" value={newGroup.year} onChange={e=>setNewGroup(g=>({...g,year:e.target.value}))} />
          </div>
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.amber} onClick={handleCreateGroup} icon={<I.Plus s={15}/>}>Crear Aula</Btn>
        </div>
      </Modal>

      {/* MODAL: CREAR MATERIA */}
      <Modal open={!!materiaModal} onClose={()=>{setMateriaModal(null);setModalErr('');}} title="Añadir Materia al Aula">
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}25`, borderRadius:'10px', padding:'12px 14px', fontSize:'13px', color:C.accent }}>
            Aula: <strong>{classGroups.find(cg=>cg.id===materiaModal)?.name}</strong>
          </div>
          <Input label="Nombre de la Materia" placeholder="Ej: Ciencias Naturales" value={newMat.name} onChange={e=>setNewMat(m=>({...m,name:e.target.value}))} />
          <Select label="Profesor asignado" value={newMat.teacherId} onChange={e=>setNewMat(m=>({...m,teacherId:e.target.value}))} options={[{value:'',label:'Selecciona un profesor...'},...teachers.map(t=>({value:t.id,label:t.name}))]} />
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} color={C.accent} onClick={handleCreateMateria}>Crear Materia</Btn>
        </div>
      </Modal>

      {/* MODAL: CREAR USUARIO */}
      <Modal open={userModal} onClose={()=>{setUserModal(false);setModalErr('');}} title={newUser.role==='teacher'?'Registrar Docente':'Matricular Alumno'}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Input label="RUT" placeholder="12345678-9" value={newUser.rut} onChange={e=>setNewUser(u=>({...u,rut:e.target.value}))} />
            <Input label="Nombre completo" placeholder="Juan Pérez" value={newUser.name} onChange={e=>setNewUser(u=>({...u,name:e.target.value}))} />
          </div>
          <Input label="Correo electrónico (opcional)" placeholder="correo@colegio.cl" value={newUser.email} onChange={e=>setNewUser(u=>({...u,email:e.target.value}))} />
          {newUser.role==='student' ? (
            <>
              <Select label="Aula Base" value={newUser.classGroupId} onChange={e=>setNewUser(u=>({...u,classGroupId:e.target.value}))} options={[{value:'',label:'Selecciona un aula...'},...classGroups.map(cg=>({value:cg.id,label:`${cg.name} (${cg.year})`}))]} />
              <Input label="Apoderado (opcional)" placeholder="María Soto" value={newUser.guardian} onChange={e=>setNewUser(u=>({...u,guardian:e.target.value}))} />
            </>
          ) : (
            <Input label="Especialidad" placeholder="Ej: Matemáticas" value={newUser.specialty} onChange={e=>setNewUser(u=>({...u,specialty:e.target.value}))} />
          )}
          {modalErr && <Alert type="error">{modalErr}</Alert>}
          <Btn full loading={saving} onClick={handleCreateUser}>
            {newUser.role==='student'?'Matricular Alumno':'Registrar Docente'}
          </Btn>
        </div>
      </Modal>

    </div>
  );
}