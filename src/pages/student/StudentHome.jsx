import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, Icons, LOGO_URL } from '@/theme';
import { Card, StatCard, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getCoursesBySchool } from '@/services/db';
import { getStudentMetrics } from '@/services/analyticsService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function StudentHome() {
  const { user, profile, schoolId } = useAuth();
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [metrics,  setMetrics]  = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [allSchoolCourses, m] = await Promise.all([
          getCoursesBySchool(schoolId), 
          getStudentMetrics(user.uid, schoolId)
        ]);

        // Cargar cursos matriculados
        const enrolledIds = profile?.enrolledCourses || [];
        const myCourses = allSchoolCourses.filter(course => enrolledIds.includes(course.id));

        // 🔥 OBTENER EL RANKING GLOBAL DE LA ESCUELA (Gamificación)
        const usersSnap = await getDocs(query(collection(db, 'users'), where('schoolId', '==', schoolId), where('role', '==', 'student')));
        const allStudents = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Ordenamos por XP de mayor a menor y tomamos el Top 5
        const topStudents = allStudents.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 5);

        setCourses(myCourses);
        setMetrics(m);
        setLeaderboard(topStudents);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [schoolId, user.uid, profile]);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'960px', margin:'0 auto', padding:'30px 20px' }}>
        
        {/* CABECERA FUTURISTA CON LOGO */}
        <div className="anim-fade-up" style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:'40px', marginTop:'20px' }}>
          <img src={LOGO_URL} alt="EDUC_AI Logo" style={{ height:'70px', marginBottom:'16px', filter: 'drop-shadow(0px 0px 12px rgba(56, 189, 248, 0.4))' }} />
          <h1 className="glow-text" style={{ fontFamily:"'Lora',serif", fontSize:'28px', fontWeight:700, color:C.text }}>
            Bienvenido, {profile?.name?.split(' ')[0]}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'12px', background:`${C.amber}15`, padding:'8px 16px', borderRadius:'20px', border:`1px solid ${C.amber}40` }}>
            <span style={{ fontSize:'18px' }}>⚡</span>
            <span style={{ color:C.amber, fontWeight:800, fontSize:'15px', fontFamily:"'Press Start 2P', cursive" }}>{profile?.xp || 0} XP</span>
          </div>
        </div>

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} /></div> : (
          <>
            <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'12px', marginBottom:'28px' }}>
              <StatCard label="Materias asignadas" value={courses.length}                   icon={<Icons.Book s={24} c={C.accent}/>} color={C.accent} />
              <StatCard label="Sesiones totales"   value={metrics?.totalSessions||0}        icon={<Icons.Visual s={24} c={C.green}/>} color={C.green}  />
              <StatCard label="Promedio Quiz"      value={metrics?.avgQuizScore!=null?`${metrics?.avgQuizScore}%`:'—'} icon={<Icons.Quiz s={24} c={metrics?.avgQuizScore>=70?C.green:metrics?.avgQuizScore>=50?C.amber:C.muted}/>} color={metrics?.avgQuizScore>=70?C.green:metrics?.avgQuizScore>=50?C.amber:C.muted} />
              <StatCard label="Esta semana"        value={metrics?.sessionsLast7Days||0}    icon={<Icons.Practice s={24} c={C.pink}/>} color={C.pink}  sub="sesiones" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'30px', alignItems:'start' }}>
              
              {/* TUS MATERIAS */}
              <div>
                <SectionHeader title="Tus materias" />
                {courses.length === 0 ? (
                  <EmptyState emoji="🛰️" title="Aún no tienes clases" desc="Tu administrador todavía no te ha vinculado a ningún curso." />
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'16px' }}>
                    {courses.map((c, i) => (
                      <Card key={c.id} onClick={()=>navigate(`/student/course/${c.id}`)} className={`anim-fade-up anim-d${Math.min(i+1,5)} glass`} style={{ cursor:'pointer', transition:'.3s', border:`1px solid ${C.border}` }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <div style={{ width:48, height:48, borderRadius:'12px', background:C.accentSoft, color:C.accent, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
                          <Icons.Book s={24}/>
                        </div>
                        <div style={{ fontWeight:700, fontSize:'18px', marginBottom:'4px', color:C.text }}>{c.name}</div>
                        <div style={{ color:C.textSub, fontSize:'12px', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{c.subject} · {c.grade}</div>
                        <div style={{ color:C.accent, fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', gap:'6px' }}>Ingresar a la sala <Icons.Practice s={14}/></div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* RANKING GLOBAL (LEADERBOARD) */}
              <div className="anim-fade-up anim-d3">
                <SectionHeader title="Salón de la Fama 🏆" sub="¡Completa juegos y quizes para subir de nivel!" />
                <Card className="glass" style={{ padding:'0', overflow:'hidden', border:`1px solid ${C.amber}40` }}>
                  {leaderboard.map((student, index) => {
                    // Colores para el podio
                    const isMe = student.id === user.uid;
                    const isGold = index === 0;
                    const isSilver = index === 1;
                    const isBronze = index === 2;
                    const rankColor = isGold ? '#fbbf24' : isSilver ? '#94a3b8' : isBronze ? '#b45309' : C.textSub;

                    return (
                      <div key={student.id} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 24px', background: isMe ? `${C.accent}15` : 'transparent', borderBottom: index === leaderboard.length-1 ? 'none' : `1px solid ${C.border}` }}>
                        <div style={{ width:'30px', fontSize:'20px', fontWeight:800, color:rankColor, textAlign:'center', fontFamily:"'Press Start 2P', cursive" }}>
                          {index + 1}
                        </div>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:C.surface, border:`2px solid ${rankColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:C.text }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:'15px', color: isMe ? C.accent : C.text }}>
                            {student.name} {isMe && '(Tú)'}
                          </div>
                          <div style={{ color:C.muted, fontSize:'12px', textTransform:'uppercase' }}>{isGold?'👑 Leyenda':isSilver?'⭐ Veterano':isBronze?'🔥 Experto':'Estudiante'}</div>
                        </div>
                        <div style={{ fontWeight:800, color:C.amber, fontSize:'14px', fontFamily:"'Press Start 2P', cursive" }}>
                          {student.xp || 0} XP
                        </div>
                      </div>
                    )
                  })}
                </Card>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}