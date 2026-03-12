import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, Icons } from '@/theme';
import { Card, SectionHeader, EmptyState, Spinner, ProgressBar } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getCourse, listenClasses, getProgressByStudent } from '@/services/db';

export default function StudentCourse() {
  const { courseId }    = useParams();
  const { user, schoolId } = useAuth();
  const navigate        = useNavigate();
  
  const [course,   setCourse]   = useState(null);
  const [classes,  setClasses]  = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([
          getCourse(courseId), 
          getProgressByStudent(user.uid, schoolId)
        ]);
        setCourse(c); 
        setProgress(p);
      } catch(e) { console.error("Error:", e); }
      setLoading(false);
    })();

    const unsub = listenClasses(courseId, setClasses);
    return () => { if (unsub) unsub(); };
  }, [courseId, user.uid, schoolId]);

  const getClassProgress = (classId) => progress.filter(p => p.classId === classId);

  // 🎮 CÁLCULO DE PROGRESO GLOBAL DEL CURSO
  const totalMissions = classes.length;
  const completedMissions = classes.filter(cls => {
    const cp = getClassProgress(cls.id);
    const quizP = cp.find(p => p.styleId === 'quiz');
    // Consideramos la misión "Completada" si el quiz se pasó con más del 70%
    return quizP && (quizP.score / quizP.totalQ) >= 0.7;
  }).length;
  
  const courseProgressPct = totalMissions === 0 ? 0 : Math.round((completedMissions / totalMissions) * 100);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        
        {/* 🚀 CABECERA INMERSIVA DEL CURSO */}
        <div className="anim-fade-up glass" style={{ position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', gap:'16px', marginBottom:'40px', padding:'30px', borderRadius:'24px', border:`1px solid ${C.accent}40`, boxShadow:`0 10px 40px -10px ${C.accent}40` }}>
          {/* Fondo de decoración */}
          <div style={{ position:'absolute', top:'-50px', right:'-50px', width:'200px', height:'200px', background:`radial-gradient(circle, ${C.accent}20 0%, transparent 70%)`, filter:'blur(20px)', pointerEvents:'none' }} />
          
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', zIndex:1 }}>
            <div>
              <button onClick={()=>navigate('/student')} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${C.accent}15`, border:`1px solid ${C.accent}30`, borderRadius:'8px', padding:'8px 12px', cursor:'pointer', color:C.accent, fontSize:'12px', fontWeight:700, marginBottom:'16px', transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.background=`${C.accent}30`} onMouseLeave={e=>e.currentTarget.style.background=`${C.accent}15`}>
                ← Panel Principal
              </button>
              <h1 className="glow-text" style={{ fontSize:'28px', marginBottom:'8px' }}>{course?.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ color:C.textSub, fontSize:'14px', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{course?.subject}</span>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.accent }}></span>
                <span style={{ color:C.accent, fontSize:'14px', fontWeight:700 }}>{course?.grade}</span>
              </div>
            </div>
            
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'16px', padding:'15px 20px', textAlign:'center', minWidth:'140px' }}>
              <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase', fontWeight:800, marginBottom:'8px' }}>Rendimiento</div>
              <div style={{ fontSize:'28px', fontWeight:800, color: courseProgressPct >= 70 ? C.green : courseProgressPct >= 40 ? C.amber : C.accent, fontFamily:"'Press Start 2P', cursive" }}>
                {courseProgressPct}%
              </div>
            </div>
          </div>

          <div style={{ zIndex:1, marginTop:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:700, color:C.textSub, marginBottom:'8px' }}>
              <span>Progreso del Nivel</span>
              <span>{completedMissions} de {totalMissions} Misiones Completadas</span>
            </div>
            <div style={{ height:'8px', background:`${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${courseProgressPct}%`, background: courseProgressPct >= 100 ? C.green : `linear-gradient(90deg, ${C.accent}, ${C.pink})`, transition:'width 1s ease-in-out', boxShadow:`0 0 10px ${C.pink}` }} />
            </div>
          </div>
        </div>

        <SectionHeader title="Mapa de Misiones" sub="Selecciona tu próximo desafío de aprendizaje" />

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} color={C.accent} /></div> :
        classes.length === 0 ? <EmptyState emoji="🛰️" title="Sector inexplorado" desc="Tu profesor aún no ha liberado misiones en este cuadrante." /> : (
          <div style={{ display:'grid', gap:'20px' }}>
            {classes.map((cls, i) => {
              const cp     = getClassProgress(cls.id);
              const done   = new Set(cp.map(p=>p.styleId));
              const quizP  = cp.find(p=>p.styleId==='quiz');
              const quizPct= quizP ? Math.round((quizP.score/quizP.totalQ)*100) : null;
              
              // Lógica de gamificación para la tarjeta
              const isMissionComplete = quizPct !== null && quizPct >= 70;
              const cardColor = isMissionComplete ? C.green : C.border;
              const bgColor = isMissionComplete ? `${C.green}05` : C.card;
              
              return (
                <Card 
                  key={cls.id} 
                  onClick={()=>navigate(`/student/class/${cls.id}`)} 
                  className={`anim-fade-up anim-d${Math.min(i+1,5)} glass`} 
                  style={{ cursor:'pointer', border:`1.5px solid ${cardColor}`, background: bgColor, transition:'all .3s', position:'relative', overflow:'hidden' }} 
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 10px 20px ${isMissionComplete ? C.greenSoft : C.accentSoft}`; e.currentTarget.style.borderColor = isMissionComplete ? C.green : C.accent; }} 
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor = cardColor; }}
                >
                  
                  {/* Número de Nivel de Fondo */}
                  <div style={{ position:'absolute', right:'-10px', bottom:'-20px', fontSize:'100px', fontWeight:900, color:C.surface, zIndex:0, opacity:0.5, pointerEvents:'none', fontFamily:"'Press Start 2P', cursive" }}>
                    {(i+1).toString().padStart(2, '0')}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap', zIndex:1, position:'relative' }}>
                    
                    <div style={{ flex:1, minWidth:'250px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                        <div style={{ background: isMissionComplete ? C.green : C.accent, color: isMissionComplete ? '#000' : '#fff', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          Misión {(i+1).toString().padStart(2, '0')}
                        </div>
                        {isMissionComplete && <span style={{ color:C.green, fontSize:'12px', fontWeight:700 }}>✓ Completada</span>}
                      </div>

                      <div style={{ fontWeight:700, fontSize:'18px', marginBottom:'10px', color:C.text }}>{cls.content?.titulo||'Misión Clasificada'}</div>
                      
                      <div style={{ color:C.textSub, fontSize:'13px', marginBottom:'16px', display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Icons.Activity s={14}/> {cls.createdAt?.toDate?.().toLocaleDateString('es-CL')}</span>
                        {quizPct!=null && (
                          <span style={{ padding:'4px 10px', borderRadius:'8px', background:`${quizPct>=70?C.green:quizPct>=50?C.amber:C.red}15`, color:quizPct>=70?C.green:quizPct>=50?C.amber:C.red, fontWeight:800, border:`1px solid ${quizPct>=70?C.green:quizPct>=50?C.amber:C.red}40` }}>
                            🎯 Score: {quizPct}%
                          </span>
                        )}
                      </div>
                      
                      {/* Insignias de estilos explorados */}
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {STYLES.map(s => {
                          if (!cls.content?.[s.id]) return null;
                          const isDone = done.has(s.id);
                          return (
                            <span key={s.id} style={{ display:'flex', alignItems:'center', gap:'6px', background:isDone?s.soft:`${C.surface}80`, color:isDone?s.color:C.muted, border:`1px solid ${isDone?s.color:C.borderHover}`, borderRadius:'8px', padding:'6px 12px', fontSize:'11px', fontWeight:700, transition:'all .2s' }}>
                              <div style={{ width:14, height:14 }}>{s.icon}</div>
                              {s.label} {isDone && '✓'}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Botón de Acción Futurista */}
                    <div style={{ background: isMissionComplete ? 'transparent' : `linear-gradient(135deg, ${C.accent}, ${C.violet})`, border: isMissionComplete ? `2px solid ${C.green}` : 'none', color: isMissionComplete ? C.green : '#fff', padding:'12px 24px', borderRadius:'12px', fontSize:'14px', fontWeight:800, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'8px', boxShadow: isMissionComplete ? 'none' : `0 4px 15px ${C.violetSoft}` }}>
                      {isMissionComplete ? 'Repasar Misión' : 'Iniciar Simulación'} <Icons.Practice s={16}/>
                    </div>

                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}