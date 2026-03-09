import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, StatCard, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getCoursesBySchool, getProgressByStudent } from '@/services/db';
import { getStudentMetrics } from '@/services/analyticsService';

export default function StudentHome() {
  const { user, profile, schoolId } = useAuth();
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [metrics,  setMetrics]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [allSchoolCourses, m] = await Promise.all([
          getCoursesBySchool(schoolId), 
          getStudentMetrics(user.uid, schoolId)
        ]);

        // 🔥 AQUÍ ESTÁ LA MAGIA: 
        // Filtramos la lista para mostrar SOLAMENTE los cursos donde el admin matriculó al alumno
        const enrolledIds = profile?.enrolledCourses || [];
        const myCourses = allSchoolCourses.filter(course => enrolledIds.includes(course.id));

        setCourses(myCourses);
        setMetrics(m);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [schoolId, user.uid, profile]); // Escucha cambios en el perfil por si le asignan nuevos cursos en tiempo real

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'960px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700 }}>
            Hola, {profile?.name?.split(' ')[0]} 🦎
          </h1>
          <p style={{ color:C.muted, fontSize:'13px', marginTop:'4px' }}>¿Qué vamos a aprender hoy?</p>
        </div>

        {loading ? <div style={{ display:'flex',justifyContent:'center',padding:'60px' }}><Spinner size={36} /></div> : (
          <>
            <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'12px', marginBottom:'28px' }}>
              <StatCard label="Materias asignadas" value={courses.length}                   icon="🎒" color={C.accent} />
              <StatCard label="Sesiones totales"   value={metrics?.totalSessions||0}       icon="📖" color={C.green}  />
              <StatCard label="Promedio Quiz"      value={metrics?.avgQuizScore!=null?`${metrics?.avgQuizScore}%`:'—'} icon="🎯" color={metrics?.avgQuizScore>=70?C.green:metrics?.avgQuizScore>=50?C.amber:C.muted} />
              <StatCard label="Esta semana"        value={metrics?.sessionsLast7Days||0}   icon="🔥" color={C.amber}  sub="sesiones" />
            </div>

            {metrics?.trend === 'improving' && (
              <div className="anim-fade-up" style={{ marginBottom:'18px', padding:'13px 16px', background:C.greenSoft, border:`1px solid ${C.green}30`, borderRadius:'12px', fontSize:'13px', color:C.green, fontWeight:600 }}>
                🚀 ¡Vas excelente! Tu rendimiento está subiendo esta semana. Sigue así.
              </div>
            )}

            <SectionHeader title="Tus materias asignadas" />

            {/* Mensaje mucho más claro si el Admin aún no vincula cursos */}
            {courses.length === 0 ? (
              <EmptyState emoji="📚" title="Aún no tienes clases" desc="Tu administrador todavía no te ha vinculado a ningún curso o profesor." />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
                {courses.map((c, i) => (
                  <Card key={c.id} onClick={()=>navigate(`/student/course/${c.id}`)} className={`anim-fade-up anim-d${Math.min(i+1,5)}`} accent={C.green}>
                    <div style={{ fontSize:'24px', marginBottom:'12px' }}>
                      {['📐','🔬','📜','🌍','🎨','💻','📖','🎵'][i % 8]}
                    </div>
                    <div style={{ fontWeight:700, fontSize:'16px', marginBottom:'4px' }}>{c.name}</div>
                    <div style={{ color:C.muted, fontSize:'13px', marginBottom:'12px' }}>{c.subject} · {c.grade}</div>
                    <div style={{ color:C.green, fontSize:'13px', fontWeight:600 }}>Empezar a estudiar →</div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}