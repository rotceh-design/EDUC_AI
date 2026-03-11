// src/pages/teacher/TeacherDashboard.jsx
// FIX: usa profile.id (Firestore doc ID) en vez de user.uid para buscar cursos.
// Los cursos fueron creados con teacherId = profile.id (doc ID aleatorio del admin).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, StatCard, SectionHeader, EmptyState, Spinner, Badge, Btn, Alert } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

// ── Iconos ────────────────────────────────────────────────────────────────────
const Ico = {
  Book:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Users:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Alert:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Chart:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>,
  Clock:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Arrow:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const getRiskColor = (score) => score <= 39 ? C.red : score <= 69 ? C.amber : C.green;
const getRiskLabel = (score) => score <= 39 ? '🔴 En riesgo' : score <= 69 ? '🟡 Observación' : '🟢 Bien';

export default function TeacherDashboard() {
  const { user, profile, schoolId } = useAuth();
  const navigate = useNavigate();

  const [courses,     setCourses]     = useState([]);
  const [classCounts, setClassCounts] = useState({});
  const [students,    setStudents]    = useState({});  // { courseId: [students] }
  const [loading,     setLoading]     = useState(true);
  const [loadErr,     setLoadErr]     = useState('');

  // FIX CRÍTICO: usa profile.id (Firestore doc ID) para buscar cursos.
  // Los cursos del admin fueron guardados con teacherId = profile.id, NO user.uid.
  const teacherId = profile?.id || user?.uid;

  useEffect(() => {
    if (!teacherId || !schoolId) return;
    loadData();
  }, [teacherId, schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Buscar cursos por teacherId = Firestore doc ID del profesor
      const cSnap = await getDocs(
        query(collection(db, 'courses'), where('teacherId', '==', teacherId))
      );
      const myCoursess = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(myCoursess);

      // 2. Para cada curso, contar clases publicadas
      const counts = {};
      for (const course of myCoursess) {
        const clSnap = await getDocs(
          query(collection(db, 'classes'), where('courseId', '==', course.id))
        );
        counts[course.id] = clSnap.size;
      }
      setClassCounts(counts);

      // 3. Para cada curso, contar alumnos matriculados en esa aula
      const studs = {};
      for (const course of myCoursess) {
        if (!course.classGroupId) { studs[course.id] = []; continue; }
        const sSnap = await getDocs(
          query(
            collection(db, 'users'),
            where('classGroupId', '==', course.classGroupId),
            where('role', '==', 'student')
          )
        );
        studs[course.id] = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      setStudents(studs);

    } catch (e) {
      console.error('TeacherDashboard load error:', e);
      setLoadErr(e.message);
    }
    setLoading(false);
  };

  const totalClasses  = Object.values(classCounts).reduce((a, b) => a + b, 0);
  const totalStudents = Object.values(students).reduce((a, arr) => a + arr.length, 0);

  // Hora del día → saludo
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1000px', margin:'0 auto', padding:'30px 20px' }}>

        {/* ── BIENVENIDA ─────────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <div style={{ fontSize:'13px', color:C.muted, marginBottom:'4px' }}>{greeting} 👋</div>
              <h1 style={{ fontFamily:"'Lora',serif", fontSize:'28px', fontWeight:700, marginBottom:'4px' }}>
                {profile?.name?.split(' ')[0] || 'Profesor'}
              </h1>
              <p style={{ color:C.muted, fontSize:'13px' }}>
                {profile?.specialty || 'Docente'} · {new Date().toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' })}
              </p>
            </div>
            <Btn color={C.amber} onClick={() => navigate('/teacher/alerts')} icon={<Ico.Alert s={15}/>}>
              Ver alertas activas
            </Btn>
          </div>
        </div>

        {loadErr && <Alert type="error" style={{ marginBottom:'16px' }}>{loadErr}</Alert>}

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px', marginBottom:'32px' }}>
          <StatCard label="Mis Materias"     value={courses.length}  icon={<Ico.Book  s={22} c={C.accent}/>} color={C.accent} />
          <StatCard label="Clases publicadas" value={totalClasses}   icon={<Ico.Chart s={22} c={C.green}/>}  color={C.green}  />
          <StatCard label="Total alumnos"     value={totalStudents}  icon={<Ico.Users s={22} c={C.violet}/>} color={C.violet} />
        </div>

        {/* ── MATERIAS ─────────────────────────────────────────────────────── */}
        <SectionHeader
          title="Mis Materias"
          sub={courses.length > 0 ? 'Selecciona una materia para gestionar clases y alumnos' : ''}
        />

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'70px' }}><Spinner size={36} /></div>
        ) : courses.length === 0 ? (
          <div>
            <EmptyState emoji="📚" title="Sin materias asignadas" desc="El administrador debe asignarte materias para que puedas comenzar a publicar clases." />
            {!profile?.id && (
              <Alert type="warning" style={{ marginTop:'16px' }}>
                Tu cuenta aún no está vinculada al sistema. Asegúrate de que el administrador haya creado tu perfil con el mismo correo que usas para iniciar sesión.
              </Alert>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'16px' }}>
            {courses.map((c, i) => {
              const nClasses  = classCounts[c.id] || 0;
              const nStudents = students[c.id]?.length || 0;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/teacher/course/${c.id}`)}
                  className={`anim-fade-up anim-d${Math.min(i+1,5)}`}
                  style={{ all:'unset', cursor:'pointer', display:'block' }}
                >
                  <Card style={{ padding:0, overflow:'hidden', transition:'transform .18s, box-shadow .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 30px ${C.accent}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>

                    {/* Color top bar */}
                    <div style={{ height:'5px', background:`linear-gradient(90deg, ${C.accent}, ${C.violet})` }} />

                    <div style={{ padding:'22px' }}>
                      {/* Header */}
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'18px' }}>
                        <div style={{ width:48,height:48,borderRadius:'14px',background:`${C.accent}15`,border:`2px solid ${C.accent}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px' }}>
                          📖
                        </div>
                        <Badge color={nClasses>0?C.green:C.muted}>{nClasses} clase{nClasses!==1?'s':''}</Badge>
                      </div>

                      {/* Info */}
                      <div style={{ fontWeight:700, fontSize:'17px', marginBottom:'4px', color:C.text }}>{c.name}</div>
                      <div style={{ color:C.muted, fontSize:'13px', marginBottom:'18px' }}>
                        {c.subject || c.name} · {c.grade || 'Sin nivel'}
                      </div>

                      {/* Stats row */}
                      <div style={{ display:'flex', gap:'12px', marginBottom:'18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:C.textSub }}>
                          <Ico.Users s={13} c={C.textSub}/> {nStudents} alumno{nStudents!==1?'s':''}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:C.textSub }}>
                          <Ico.Clock s={13} c={C.textSub}/> {nClasses===0?'Sin clases aún':`${nClasses} publicada${nClasses!==1?'s':''}`}
                        </div>
                      </div>

                      {/* CTA */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'14px', borderTop:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:'13px', color:C.accent, fontWeight:600 }}>Gestionar materia</span>
                        <Ico.Arrow s={16} c={C.accent}/>
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* ── GUÍA RÁPIDA (si no hay clases) ──────────────────────────────── */}
        {!loading && courses.length > 0 && totalClasses === 0 && (
          <Card className="anim-fade-up" style={{ marginTop:'28px', background:`${C.accent}07`, borderColor:`${C.accent}25`, padding:'22px' }}>
            <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'14px', color:C.accent }}>
              🚀 ¿Por dónde empezar?
            </div>
            {[
              { n:'1', text:'Selecciona una materia arriba', done: courses.length>0 },
              { n:'2', text:'Publica tu primera clase con IA (PDF o texto)', done: totalClasses>0 },
              { n:'3', text:'Los alumnos recibirán el contenido en 5 estilos de aprendizaje', done: false },
            ].map(step => (
              <div key={step.n} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:step.done?C.green:`${C.accent}20`,color:step.done?'#fff':C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'13px',flexShrink:0 }}>
                  {step.done ? '✓' : step.n}
                </div>
                <div style={{ fontSize:'13px', color:step.done?C.muted:C.text, textDecoration:step.done?'line-through':'none' }}>{step.text}</div>
              </div>
            ))}
          </Card>
        )}

      </main>
    </div>
  );
}