// src/pages/teacher/TeacherDashboard.jsx — educ_AI v4.0 CYBERPUNK
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, getSubjectColor } from '@/theme';
import { Card, SectionHeader, EmptyState, Spinner, Btn, Alert, Badge } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

const Ico = {
  Book:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Users:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Alert:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Chart:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>,
  Clock:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Arrow:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Rocket:  ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
};

// ── KPI Card inmersiva ─────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'16px',
      padding:'20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px',
        background:`radial-gradient(circle at 100% 0%, ${color}20 0%, transparent 70%)`,
        pointerEvents:'none' }} />
      <div style={{ color, marginBottom:'10px', display:'flex', alignItems:'center' }}>{icon}</div>
      <div style={{ fontFamily:"'Press Start 2P', cursive", fontSize:'22px', fontWeight:700,
        color, marginBottom:'6px' }}>{value}</div>
      <div style={{ fontSize:'11px', color:C.textSub, textTransform:'uppercase',
        letterSpacing:'.05em', fontWeight:600 }}>{label}</div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user, profile, schoolId } = useAuth();
  const navigate = useNavigate();

  const [courses,     setCourses]     = useState([]);
  const [classCounts, setClassCounts] = useState({});
  const [students,    setStudents]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [loadErr,     setLoadErr]     = useState('');
  const [hoverColor,  setHoverColor]  = useState(null);

  const teacherId = profile?.id || user?.uid;

  useEffect(() => { if (teacherId && schoolId) loadData(); }, [teacherId, schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cSnap = await getDocs(query(collection(db,'courses'), where('teacherId','==',teacherId)));
      const myCourses = cSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      setCourses(myCourses);

      const counts = {};
      for (const course of myCourses) {
        const clSnap = await getDocs(query(collection(db,'classes'), where('courseId','==',course.id)));
        counts[course.id] = clSnap.size;
      }
      setClassCounts(counts);

      const studs = {};
      for (const course of myCourses) {
        if (!course.classGroupId) { studs[course.id]=[]; continue; }
        const sSnap = await getDocs(query(collection(db,'users'),
          where('classGroupId','==',course.classGroupId), where('role','==','student')));
        studs[course.id] = sSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      }
      setStudents(studs);
    } catch(e) { setLoadErr(e.message); }
    setLoading(false);
  };

  const totalClasses  = Object.values(classCounts).reduce((a,b) => a+b, 0);
  const totalStudents = Object.values(students).reduce((a,arr) => a+arr.length, 0);
  const hour = new Date().getHours();
  const greeting = hour<12?'Buenos días':hour<18?'Buenas tardes':'Buenas noches';

  const auraTop    = hoverColor || C.accent;
  const auraBottom = hoverColor || C.violet;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>

      {/* Aura ambiental reactiva */}
      <div style={{ position:'fixed', top:'-10%', left:'-10%', width:'60%', height:'60%',
        background:`radial-gradient(circle, ${auraTop}12 0%, transparent 60%)`,
        pointerEvents:'none', zIndex:0, transition:'background .7s ease' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'50%', height:'50%',
        background:`radial-gradient(circle, ${auraBottom}10 0%, transparent 60%)`,
        pointerEvents:'none', zIndex:0, transition:'background .7s ease' }} />

      <Navbar customColor={hoverColor || C.accent} />

      <main style={{ maxWidth:'1000px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>

        {/* ── BIENVENIDA ─────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
            flexWrap:'wrap', gap:'14px' }}>
            <div>
              <div style={{ fontSize:'12px', color:C.muted, marginBottom:'5px',
                textTransform:'uppercase', letterSpacing:'.06em' }}>
                {greeting} 👋
              </div>
              <h1 className="glow-text" style={{ marginBottom:'5px' }}>
                {profile?.name?.split(' ')[0] || 'Profesor'}
              </h1>
              <p style={{ color:C.textSub, fontSize:'12px', textTransform:'uppercase',
                letterSpacing:'.05em', fontWeight:600 }}>
                {profile?.specialty || 'Docente'} · {new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}
              </p>
            </div>
            <Btn color={C.amber} onClick={()=>navigate('/teacher/alerts')} icon={<Ico.Alert s={15}/>}>
              Ver Alertas de Riesgo
            </Btn>
          </div>
        </div>

        {loadErr && <Alert type="error" style={{ marginBottom:'16px' }}>{loadErr}</Alert>}

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="anim-fade-up anim-d1" style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'14px', marginBottom:'32px' }}>
          <KpiCard label="Mis Materias"     value={courses.length}  color={C.accent} icon={<Ico.Book s={20} c={C.accent}/>} />
          <KpiCard label="Clases publicadas" value={totalClasses}   color={C.green}  icon={<Ico.Chart s={20} c={C.green}/>} />
          <KpiCard label="Total alumnos"     value={totalStudents}  color={C.violet} icon={<Ico.Users s={20} c={C.violet}/>} />
        </div>

        {/* ── GRID DE MATERIAS ─────────────────────────────────────────── */}
        <SectionHeader title="Mis Materias"
          sub={courses.length > 0 ? 'Selecciona una materia para gestionar clases y alumnos' : ''} />

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'70px' }}>
            <Spinner size={40} />
          </div>
        ) : courses.length === 0 ? (
          <div>
            <EmptyState emoji="📚" title="Sin materias asignadas"
              desc="El administrador debe asignarte materias para comenzar a publicar clases." />
            {!profile?.id && (
              <Alert type="warning" style={{ marginTop:'16px' }}>
                Tu cuenta aún no está vinculada. Pídele al administrador que cree tu perfil con
                el mismo correo que usas para iniciar sesión.
              </Alert>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:'16px' }}>
            {courses.map((c, i) => {
              const nClasses  = classCounts[c.id] || 0;
              const nStudents = students[c.id]?.length || 0;
              const subjColor = getSubjectColor(c.subject || c.name);

              return (
                <button key={c.id} onClick={()=>navigate(`/teacher/course/${c.id}`)}
                  className={`anim-fade-up anim-d${Math.min(i+1,5)}`}
                  style={{ all:'unset', cursor:'pointer', display:'block' }}>
                  <div
                    onMouseEnter={e=>{
                      setHoverColor(subjColor);
                      e.currentTarget.style.transform='translateY(-5px) scale(1.02)';
                      e.currentTarget.style.boxShadow=`0 15px 40px ${subjColor}30`;
                      e.currentTarget.style.borderColor=subjColor;
                    }}
                    onMouseLeave={e=>{
                      setHoverColor(null);
                      e.currentTarget.style.transform='translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow='none';
                      e.currentTarget.style.borderColor=C.border;
                    }}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'18px',
                      overflow:'hidden', transition:'all .3s cubic-bezier(.16,1,.3,1)',
                      position:'relative' }}>

                    {/* Barra superior del color */}
                    <div style={{ height:'4px', background:`linear-gradient(90deg, ${subjColor}, ${subjColor}60)` }} />

                    {/* Número grande decorativo */}
                    <div style={{ position:'absolute', right:'-5px', bottom:'-10px', fontSize:'90px',
                      fontWeight:900, color:subjColor, opacity:.05, fontFamily:"'Press Start 2P',cursive",
                      pointerEvents:'none', lineHeight:1 }}>
                      {(i+1).toString().padStart(2,'0')}
                    </div>

                    <div style={{ padding:'22px', position:'relative', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                        marginBottom:'18px' }}>
                        <div style={{ width:50,height:50,borderRadius:'14px',
                          background:`${subjColor}15`, border:`1.5px solid ${subjColor}35`,
                          color:subjColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Ico.Book s={24}/>
                        </div>
                        <span style={{ background:nClasses>0?`${C.green}20`:C.surface,
                          color:nClasses>0?C.green:C.muted,
                          border:`1px solid ${nClasses>0?C.green:C.border}`,
                          borderRadius:'20px', padding:'4px 12px', fontSize:'11px', fontWeight:700 }}>
                          {nClasses} clase{nClasses!==1?'s':''}
                        </span>
                      </div>

                      <div style={{ fontWeight:800, fontSize:'17px', marginBottom:'4px', color:C.text }}>
                        {c.name}
                      </div>
                      <div style={{ color:C.muted, fontSize:'13px', marginBottom:'18px' }}>
                        {c.subject||c.name} · {c.grade||'Sin nivel'}
                      </div>

                      <div style={{ display:'flex', gap:'14px', marginBottom:'18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px',
                          fontSize:'12px', color:C.textSub, fontWeight:600 }}>
                          <Ico.Users s={13} c={C.violet}/>
                          {nStudents} alumno{nStudents!==1?'s':''}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px',
                          fontSize:'12px', color:C.textSub, fontWeight:600 }}>
                          <Ico.Clock s={13} c={C.green}/>
                          {nClasses===0?'Sin clases aún':`${nClasses} publicada${nClasses!==1?'s':''}`}
                        </div>
                      </div>

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        paddingTop:'14px', borderTop:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:'13px', color:subjColor, fontWeight:700 }}>
                          Gestionar materia
                        </span>
                        <Ico.Arrow s={16} c={subjColor}/>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── GUÍA DE INICIO ──────────────────────────────────────────── */}
        {!loading && courses.length > 0 && totalClasses === 0 && (
          <div className="anim-fade-up" style={{ marginTop:'28px', background:`${C.accent}07`,
            border:`1px solid ${C.accent}25`, borderRadius:'16px', padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', fontWeight:700,
              fontSize:'14px', color:C.accent, marginBottom:'16px' }}>
              <Ico.Rocket s={18} c={C.accent}/> ¿Por dónde empezar?
            </div>
            {[
              { n:'1', text:'Selecciona una materia arriba',                       done:true },
              { n:'2', text:'Publica tu primera clase con IA (PDF o texto)',        done:false },
              { n:'3', text:'Los alumnos recibirán el contenido en 6 mundos de aprendizaje', done:false },
            ].map(step => (
              <div key={step.n} style={{ display:'flex', alignItems:'center', gap:'12px',
                padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,
                  background:step.done?C.green:`${C.accent}20`,
                  color:step.done?C.bg:C.accent,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontWeight:700,fontSize:'12px' }}>
                  {step.done?'✓':step.n}
                </div>
                <div style={{ fontSize:'13px', color:step.done?C.muted:C.text,
                  textDecoration:step.done?'line-through':'none', fontWeight:600 }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}