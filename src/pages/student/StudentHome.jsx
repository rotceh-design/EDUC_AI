import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, Icons, LOGO_URL, getSubjectColor } from '@/theme';
import { Card, StatCard, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getCoursesBySchool } from '@/services/db';
import { getStudentMetrics } from '@/services/analyticsService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

// 🛠️ COMPONENTE AISLADO: Evita que el color se trabe al re-renderizar
function CourseCardItem({ c, index, navigate, setHoverColor }) {
  const [isHovered, setIsHovered] = useState(false);
  const subjColor = getSubjectColor(c.subject || c.name);

  return (
    <Card 
      onClick={() => navigate(`/student/course/${c.id}`)} 
      className={`anim-fade-up anim-d${Math.min(index + 1, 5)}`} 
      style={{ 
        cursor: 'pointer', 
        background: subjColor, // Color Neón sólido permanente
        color: '#050a10', 
        border: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        position: 'relative', 
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 15px 40px ${subjColor}80, 0 0 25px ${subjColor}, inset 0 0 20px rgba(255,255,255,0.4)` 
          : `0 4px 15px ${subjColor}40`,
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
      }} 
      onMouseEnter={() => {
        setIsHovered(true);
        setHoverColor(subjColor);
      }} 
      onMouseLeave={() => {
        setIsHovered(false);
        setHoverColor(null);
      }}
    >
      <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'120px', height:'120px', background:'rgba(255,255,255,0.1)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-30px', left:'-30px', width:'100px', height:'100px', background:'rgba(0,0,0,0.05)', borderRadius:'20px', transform:'rotate(45deg)', pointerEvents:'none' }} />
      
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative', zIndex:1 }}>
        <div style={{ width:48, height:48, borderRadius:'12px', background:'rgba(0,0,0,0.15)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
          <Icons.Book s={24}/>
        </div>
        <div style={{ background:'rgba(0,0,0,0.2)', padding:'4px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#000', letterSpacing:'0.05em' }}>
          Nivel {c.grade || 'Base'}
        </div>
      </div>

      <div style={{ fontWeight:900, fontSize:'22px', marginBottom:'4px', color:'#000', position:'relative', zIndex:1, letterSpacing:'-0.02em', lineHeight:'1.2' }}>
        {c.name}
      </div>
      
      <div style={{ color:'rgba(0,0,0,0.6)', fontSize:'13px', marginBottom:'20px', textTransform:'uppercase', letterSpacing:'0.05em', position:'relative', zIndex:1, fontWeight:800 }}>
        {c.subject}
      </div>
      
      <div style={{ background:'rgba(255,255,255,0.25)', color:'#000', fontSize:'13px', fontWeight:800, display:'inline-flex', alignItems:'center', gap:'8px', position:'relative', zIndex:1, padding:'10px 16px', borderRadius:'10px', backdropFilter:'blur(5px)' }}>
        Ingresar a la sala <Icons.Practice s={14}/>
      </div>
    </Card>
  );
}

export default function StudentHome() {
  const { user, profile, schoolId } = useAuth();
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [metrics,  setMetrics]  = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [hoverColor, setHoverColor] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [allSchoolCourses, m] = await Promise.all([
          getCoursesBySchool(schoolId), 
          getStudentMetrics(user.uid, schoolId)
        ]);

        const enrolledIds = profile?.enrolledCourses || [];
        const myCourses = allSchoolCourses.filter(course => enrolledIds.includes(course.id));

        const usersSnap = await getDocs(query(collection(db, 'users'), where('schoolId', '==', schoolId), where('role', '==', 'student')));
        const allStudents = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const topStudents = allStudents.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 5);

        setCourses(myCourses);
        setMetrics(m);
        setLeaderboard(topStudents);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [schoolId, user.uid, profile]);

  const auraTop = hoverColor || C.accent;
  const auraBottom = hoverColor || C.pink;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
      <div style={{ position:'fixed', top:'-10%', left:'-10%', width:'60%', height:'60%', background:`radial-gradient(circle, ${auraTop}15 0%, transparent 60%)`, pointerEvents:'none', zIndex:0, transition:'background 0.8s ease' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'50%', height:'50%', background:`radial-gradient(circle, ${auraBottom}12 0%, transparent 60%)`, pointerEvents:'none', zIndex:0, transition:'background 0.8s ease' }} />

      <Navbar customColor={hoverColor || C.accent} />

      <main style={{ maxWidth:'960px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>
        <div className="anim-fade-up" style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:'40px', marginTop:'20px' }}>
          <img src={LOGO_URL} alt="EDUC_AI Logo" style={{ height:'70px', marginBottom:'16px', filter: `drop-shadow(0px 0px 12px ${hoverColor ? hoverColor+'80' : C.accentSoft})`, transition:'filter 0.5s ease' }} />
          <h1 className="glow-text" style={{ fontSize:'28px', fontWeight:700, color:C.text }}>
            Bienvenido, {profile?.name?.split(' ')[0]}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'12px', background:`${C.amber}15`, padding:'8px 16px', borderRadius:'20px', border:`1px solid ${C.amber}40`, boxShadow:`0 0 15px ${C.amberSoft}` }}>
            <span style={{ fontSize:'18px' }}>⚡</span>
            <span style={{ color:C.amber, fontWeight:800, fontSize:'15px', fontFamily:"'Press Start 2P', cursive" }}>{profile?.xp || 0} XP</span>
          </div>
        </div>

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} color={C.accent} /></div> : (
          <>
            <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'12px', marginBottom:'35px' }}>
              <StatCard label="Materias asignadas" value={courses.length}                   icon={<Icons.Book s={24} c={C.accent}/>} color={C.accent} />
              <StatCard label="Sesiones totales"   value={metrics?.totalSessions||0}        icon={<Icons.Visual s={24} c={C.green}/>} color={C.green}  />
              <StatCard label="Promedio Quiz"      value={metrics?.avgQuizScore!=null?`${metrics?.avgQuizScore}%`:'—'} icon={<Icons.Quiz s={24} c={metrics?.avgQuizScore>=70?C.green:metrics?.avgQuizScore>=50?C.amber:C.muted}/>} color={metrics?.avgQuizScore>=70?C.green:metrics?.avgQuizScore>=50?C.amber:C.muted} />
              <StatCard label="Esta semana"        value={metrics?.sessionsLast7Days||0}    icon={<Icons.Practice s={24} c={C.pink}/>} color={C.pink}  sub="sesiones" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'30px', alignItems:'start' }}>
              <div>
                <SectionHeader title="Tus materias" />
                {courses.length === 0 ? (
                  <EmptyState emoji="🛰️" title="Aún no tienes clases" desc="Tu administrador todavía no te ha vinculado a ningún curso." />
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'16px' }}>
                    {courses.map((c, i) => (
                      <CourseCardItem key={c.id} c={c} index={i} navigate={navigate} setHoverColor={setHoverColor} />
                    ))}
                  </div>
                )}
              </div>

              <div className="anim-fade-up anim-d3">
                <SectionHeader title="Salón de la Fama 🏆" sub="¡Completa juegos y quizes para subir de nivel!" />
                <Card className="glass" style={{ padding:'0', overflow:'hidden', border:`1px solid ${C.amber}40`, boxShadow:`0 10px 40px ${C.amber}10` }}>
                  {leaderboard.map((student, index) => {
                    const isMe = student.id === user.uid;
                    const isGold = index === 0;
                    const isSilver = index === 1;
                    const isBronze = index === 2;
                    const rankColor = isGold ? '#fbbf24' : isSilver ? '#94a3b8' : isBronze ? '#b45309' : C.textSub;

                    return (
                      <div key={student.id} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 24px', background: isMe ? `${C.accent}15` : 'transparent', borderBottom: index === leaderboard.length-1 ? 'none' : `1px solid ${C.border}` }}>
                        <div style={{ width:'30px', fontSize:'20px', fontWeight:800, color:rankColor, textAlign:'center', fontFamily:"'Press Start 2P', cursive" }}>{index + 1}</div>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:C.surface, border:`2px solid ${rankColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:C.text, boxShadow: isGold ? `0 0 10px ${rankColor}` : 'none' }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:'15px', color: isMe ? C.accent : C.text }}>{student.name} {isMe && '(Tú)'}</div>
                          <div style={{ color:C.muted, fontSize:'12px', textTransform:'uppercase', fontWeight:600 }}>{isGold?'👑 Leyenda':isSilver?'⭐ Veterano':isBronze?'🔥 Experto':'Estudiante'}</div>
                        </div>
                        <div style={{ fontWeight:800, color:C.amber, fontSize:'14px', fontFamily:"'Press Start 2P', cursive" }}>{student.xp || 0} XP</div>
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