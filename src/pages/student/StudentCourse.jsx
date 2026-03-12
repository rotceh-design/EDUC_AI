import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, Icons } from '@/theme';
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

  const getClassProgress = (classId) => progress.filter(p=>p.classId===classId);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up glass" style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'30px', padding:'20px', borderRadius:'16px' }}>
          <button onClick={()=>navigate('/student')} style={{ background:`${C.accent}15`,border:`1px solid ${C.accent}30`,borderRadius:'8px',padding:'10px 14px',cursor:'pointer',color:C.accent,fontSize:'13px',fontWeight:600 }}>← Volver</button>
          <div>
            <h1 className="glow-text" style={{ fontFamily:"'Lora',serif", fontSize:'24px', fontWeight:700 }}>{course?.name}</h1>
            <p style={{ color:C.textSub, fontSize:'13px', marginTop:'4px' }}>{course?.subject} · {course?.grade}</p>
          </div>
        </div>

        <SectionHeader title="Bitácora de Clases" sub="Selecciona una clase para comenzar a estudiar" />

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} /></div> :
        classes.length === 0 ? <EmptyState emoji="📭" title="Módulo vacío" desc="Tu profesor aún no ha publicado contenido aquí." /> : (
          <div style={{ display:'grid', gap:'16px' }}>
            {classes.map((cls, i) => {
              const cp     = getClassProgress(cls.id);
              const done   = new Set(cp.map(p=>p.styleId));
              const quizP  = cp.find(p=>p.styleId==='quiz');
              const quizPct= quizP ? Math.round((quizP.score/quizP.totalQ)*100) : null;
              
              return (
                <Card key={cls.id} onClick={()=>navigate(`/student/class/${cls.id}`)} className={`anim-fade-up anim-d${Math.min(i+1,5)} glass`} style={{ cursor:'pointer', border:`1px solid ${C.border}`, transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'250px' }}>
                      <div style={{ fontWeight:700, fontSize:'16px', marginBottom:'6px', color:C.text }}>{cls.content?.titulo||'Clase sin título'}</div>
                      <div style={{ color:C.textSub, fontSize:'12px', marginBottom:'14px', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
                        <span>📅 {cls.createdAt?.toDate?.().toLocaleDateString('es-CL',{day:'2-digit',month:'short'})}</span>
                        {quizPct!=null && <span style={{ padding:'2px 8px', borderRadius:'10px', background:`${quizPct>=70?C.green:quizPct>=50?C.amber:C.red}15`, color:quizPct>=70?C.green:quizPct>=50?C.amber:C.red, fontWeight:700 }}>🎯 Score: {quizPct}%</span>}
                      </div>
                      
                      {/* Insignias de estilos con SVGs */}
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {STYLES.map(s => {
                          if (!cls.content?.[s.id]) return null;
                          const isDone = done.has(s.id);
                          return (
                            <span key={s.id} style={{ display:'flex', alignItems:'center', gap:'4px', background:isDone?s.soft:'transparent', color:isDone?s.color:C.muted, border:`1px solid ${isDone?s.color:C.border}`, borderRadius:'20px', padding:'4px 10px', fontSize:'11px', fontWeight:600, transition:'all .2s' }}>
                              <div style={{ width:14, height:14 }}>{s.icon}</div>
                              {s.label} {isDone?'✓':''}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ background:C.accent, color:'#fff', padding:'10px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:600, whiteSpace:'nowrap' }}>
                      Iniciar Módulo
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