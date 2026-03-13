import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, Icons, getSubjectColor } from '@/theme';
import { Card, SectionHeader, EmptyState, Spinner } from '@/components/ui';
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

  // 🎨 DETECTAMOS EL COLOR DE LA MATERIA
  const themeColor = getSubjectColor(course?.subject || course?.name);

  // 🎮 CÁLCULO DE PROGRESO GLOBAL DEL CURSO
  const totalMissions = classes.length;
  const completedMissions = classes.filter(cls => {
    const cp = getClassProgress(cls.id);
    const quizP = cp.find(p => p.styleId === 'quiz');
    return quizP && (quizP.score / quizP.totalQ) >= 0.7; // Aprobado si > 70%
  }).length;
  
  const courseProgressPct = totalMissions === 0 ? 0 : Math.round((completedMissions / totalMissions) * 100);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
      
      {/* 🌌 AURA AMBIENTAL DE LA MATERIA */}
      <div style={{ position:'fixed', inset:0, background:`radial-gradient(circle at 50% 0%, ${themeColor}15 0%, transparent 70%)`, pointerEvents:'none', zIndex:0 }} />
      
      <Navbar customColor={themeColor} />
      
      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>
        
        {/* 🚀 CABECERA INMERSIVA DEL CURSO (SÓLIDA Y CON LETRAS BLANCAS) */}
        <div className="anim-fade-up" style={{ position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', gap:'20px', marginBottom:'40px', padding:'30px', borderRadius:'24px', background: themeColor, boxShadow:`0 15px 40px -10px ${themeColor}80` }}>
          
          {/* Luces decorativas translúcidas de fondo */}
          <div style={{ position:'absolute', top:'-20%', right:'-10%', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-30%', left:'-10%', width:'250px', height:'250px', background:'radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none' }} />
          
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', zIndex:1, flexWrap:'wrap', gap:'20px' }}>
            <div>
              <button 
                onClick={()=>navigate('/student')} 
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:'10px', padding:'8px 14px', cursor:'pointer', color:'#fff', fontSize:'13px', fontWeight:700, marginBottom:'20px', transition:'.2s', backdropFilter:'blur(5px)' }} 
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.3)'} 
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
              >
                ← Panel Principal
              </button>
              
              <h1 style={{ fontSize:'32px', marginBottom:'8px', color:'#fff', fontWeight:800, letterSpacing:'-0.02em', textShadow:'0 2px 10px rgba(0,0,0,0.2)' }}>
                {course?.name}
              </h1>
              
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ color:'rgba(255,255,255,0.9)', fontSize:'15px', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 }}>{course?.subject}</span>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.6)' }}></span>
                <span style={{ color:'#fff', fontSize:'15px', fontWeight:800 }}>{course?.grade}</span>
              </div>
            </div>
            
            {/* Caja de Rendimiento */}
            <div style={{ background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'16px', padding:'15px 24px', textAlign:'center', minWidth:'150px', backdropFilter:'blur(10px)', boxShadow:'0 10px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', textTransform:'uppercase', fontWeight:800, marginBottom:'8px', letterSpacing:'0.05em' }}>Rendimiento</div>
              <div style={{ fontSize:'32px', fontWeight:800, color: '#fff', fontFamily:"'Press Start 2P', cursive", textShadow:'0 2px 10px rgba(0,0,0,0.3)' }}>
                {courseProgressPct}%
              </div>
            </div>
          </div>

          <div style={{ zIndex:1, marginTop:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:'10px' }}>
              <span>Progreso del Nivel</span>
              <span>{completedMissions} de {totalMissions} Misiones</span>
            </div>
            <div style={{ height:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'5px', overflow:'hidden', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
              <div style={{ height:'100%', width:`${courseProgressPct}%`, background: '#fff', transition:'width 1s ease-in-out', borderRadius:'5px', boxShadow:'0 0 10px rgba(255,255,255,0.8)' }} />
            </div>
          </div>
        </div>

        <SectionHeader title="Mapa de Misiones" sub="Selecciona tu próximo desafío de aprendizaje" />

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} color={themeColor} /></div> :
        classes.length === 0 ? <EmptyState emoji="🛰️" title="Sector inexplorado" desc="Tu profesor aún no ha liberado misiones en este cuadrante." /> : (
          <div style={{ display:'grid', gap:'20px' }}>
            {classes.map((cls, i) => {
              const cp     = getClassProgress(cls.id);
              const done   = new Set(cp.map(p=>p.styleId));
              const quizP  = cp.find(p=>p.styleId==='quiz');
              const quizPct= quizP ? Math.round((quizP.score/quizP.totalQ)*100) : null;
              
              // 🔥 LÓGICA DE COLOR DE LAS TARJETAS 🔥
              const isMissionComplete = quizPct !== null && quizPct >= 70;
              const activeColor = isMissionComplete ? C.green : themeColor;
              const bgColorGlass = isMissionComplete ? `${C.green}08` : `${themeColor}08`; // Fondo translúcido tintado
              
              return (
                <Card 
                  key={cls.id} 
                  onClick={()=>navigate(`/student/class/${cls.id}`)} 
                  className={`anim-fade-up anim-d${Math.min(i+1,5)} glass`} 
                  style={{ 
                    cursor:'pointer', 
                    border:`1.5px solid ${activeColor}50`, // Borde visible del color de la materia
                    background: bgColorGlass, 
                    transition:'all .3s ease', 
                    position:'relative', 
                    overflow:'hidden' 
                  }} 
                  onMouseEnter={e=>{
                    e.currentTarget.style.transform='translateY(-4px)'; 
                    e.currentTarget.style.boxShadow=`0 10px 30px ${activeColor}30`; 
                    e.currentTarget.style.borderColor = activeColor; 
                  }} 
                  onMouseLeave={e=>{
                    e.currentTarget.style.transform='translateY(0)'; 
                    e.currentTarget.style.boxShadow='none'; 
                    e.currentTarget.style.borderColor = `${activeColor}50`; 
                  }}
                >
                  {/* Número Gigante de Fondo */}
                  <div style={{ position:'absolute', right:'-10px', bottom:'-20px', fontSize:'100px', fontWeight:900, color:activeColor, zIndex:0, opacity:0.05, pointerEvents:'none', fontFamily:"'Press Start 2P', cursive" }}>
                    {(i+1).toString().padStart(2, '0')}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap', zIndex:1, position:'relative' }}>
                    <div style={{ flex:1, minWidth:'250px' }}>
                      
                      {/* ETIQUETA "MISIÓN" */}
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                        <div style={{ background: activeColor, color: isMissionComplete ? '#000' : '#fff', padding:'6px 12px', borderRadius:'8px', fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', boxShadow:`0 0 10px ${activeColor}40` }}>
                          Misión {(i+1).toString().padStart(2, '0')}
                        </div>
                        {isMissionComplete && <span style={{ color:C.green, fontSize:'12px', fontWeight:800 }}>✓ Superada</span>}
                      </div>

                      {/* TÍTULO DE LA CLASE */}
                      <div style={{ fontWeight:700, fontSize:'18px', marginBottom:'10px', color:C.text }}>{cls.content?.titulo||'Misión Clasificada'}</div>
                      
                      {/* ESTADÍSTICAS */}
                      <div style={{ color:C.textSub, fontSize:'13px', marginBottom:'16px', display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Icons.Activity s={14}/> {cls.createdAt?.toDate?.().toLocaleDateString('es-CL')}</span>
                        {quizPct!=null && (
                          <span style={{ padding:'4px 10px', borderRadius:'8px', background:`${quizPct>=70?C.green:quizPct>=50?C.amber:C.red}15`, color:quizPct>=70?C.green:quizPct>=50?C.amber:C.red, fontWeight:800, border:`1px solid ${quizPct>=70?C.green:quizPct>=50?C.amber:C.red}40` }}>
                            🎯 Score: {quizPct}%
                          </span>
                        )}
                      </div>
                      
                      {/* INSIGNIAS DE PROGRESO DE ESTILOS */}
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {STYLES.map(s => {
                          if (!cls.content?.[s.id]) return null;
                          const isDone = done.has(s.id);
                          return (
                            <span key={s.id} style={{ display:'flex', alignItems:'center', gap:'6px', background:isDone?s.soft:`rgba(255,255,255,0.03)`, color:isDone?s.color:C.muted, border:`1px solid ${isDone?s.color:C.borderHover}`, borderRadius:'8px', padding:'6px 12px', fontSize:'11px', fontWeight:700, transition:'all .2s' }}>
                              <div style={{ width:14, height:14 }}>{s.icon}</div>
                              {s.label} {isDone && '✓'}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* BOTÓN DE ACCIÓN (SE TIÑE DEL COLOR DE LA MATERIA) */}
                    <div style={{ 
                      background: isMissionComplete ? 'transparent' : activeColor, 
                      border: isMissionComplete ? `2px solid ${C.green}` : `1px solid ${activeColor}`, 
                      color: isMissionComplete ? C.green : '#fff', 
                      padding:'14px 26px', 
                      borderRadius:'12px', 
                      fontSize:'14px', 
                      fontWeight:800, 
                      whiteSpace:'nowrap', 
                      display:'flex', 
                      alignItems:'center', 
                      gap:'8px', 
                      boxShadow: isMissionComplete ? 'none' : `0 4px 15px ${activeColor}60`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
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
