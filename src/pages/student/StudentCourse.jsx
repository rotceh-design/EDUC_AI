import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES } from '@/theme';
import { Card, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import Navbar from '@/components/Navbar';
// 🪄 CAMBIO CLAVE: Importamos listenClasses en lugar de getClassesByCourse
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
    // 1. Cargamos los datos del curso y el progreso del alumno
    (async () => {
      try {
        const [c, p] = await Promise.all([
          getCourse(courseId), 
          getProgressByStudent(user.uid, schoolId)
        ]);
        setCourse(c); 
        setProgress(p);
      } catch(e) { 
        console.error("Error cargando curso/progreso:", e); 
      }
      setLoading(false);
    })();

    // 2. 🪄 Escuchamos las clases EN TIEMPO REAL exactamente igual que el profesor
    const unsub = listenClasses(courseId, setClasses);
    
    // Limpiamos el listener cuando el alumno sale de la pantalla
    return () => {
      if (unsub) unsub();
    };
  }, [courseId, user.uid, schoolId]);

  const getClassProgress = (classId) => progress.filter(p=>p.classId===classId);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'26px' }}>
          <button onClick={()=>navigate('/student')} style={{ background:`${C.green}15`,border:`1px solid ${C.green}30`,borderRadius:'8px',padding:'6px 12px',cursor:'pointer',color:C.green,fontSize:'13px',fontWeight:600 }}>← Volver</button>
          <div>
            <h1 style={{ fontFamily:"'Lora',serif", fontSize:'22px', fontWeight:700 }}>{course?.name}</h1>
            <p style={{ color:C.muted, fontSize:'12px' }}>{course?.subject} · {course?.grade}</p>
          </div>
        </div>

        <SectionHeader title="Clases disponibles" sub="Elige una clase y selecciona tu estilo de aprendizaje" />

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} /></div> :
        classes.length === 0 ? <EmptyState emoji="📭" title="Sin clases aún" desc="Tu profesor aún no ha publicado clases en este curso." /> : (
          <div style={{ display:'grid', gap:'14px' }}>
            {classes.map((cls, i) => {
              const cp     = getClassProgress(cls.id);
              const done   = new Set(cp.map(p=>p.styleId));
              const quizP  = cp.find(p=>p.styleId==='quiz');
              const quizPct= quizP ? Math.round((quizP.score/quizP.totalQ)*100) : null;
              
              return (
                <Card key={cls.id} onClick={()=>navigate(`/student/class/${cls.id}`)} className={`anim-fade-up anim-d${Math.min(i+1,5)}`} accent={C.green}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'5px' }}>{cls.content?.titulo||'Clase'}</div>
                      <div style={{ color:C.muted, fontSize:'12px', marginBottom:'10px' }}>
                        {cls.createdAt?.toDate?.().toLocaleDateString('es-CL',{day:'2-digit',month:'short'})}
                        {quizPct!=null && <span style={{ marginLeft:'10px',color:quizPct>=70?C.green:quizPct>=50?C.amber:C.red,fontWeight:600 }}>🎯 Quiz: {quizPct}%</span>}
                      </div>
                      <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                        {STYLES.map(s => (
                          <span key={s.id} style={{ background:done.has(s.id)?s.soft:'transparent', color:done.has(s.id)?s.color:C.muted, border:`1px solid ${done.has(s.id)?s.color:C.border}`, borderRadius:'20px', padding:'2px 8px', fontSize:'11px', fontWeight:600, transition:'all .2s' }}>
                            {s.emoji} {done.has(s.id)?'✓':''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ color:C.green,fontWeight:600,fontSize:'13px',whiteSpace:'nowrap' }}>Estudiar →</span>
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