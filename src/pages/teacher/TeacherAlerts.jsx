import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, SectionHeader, EmptyState, Spinner, Btn } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getCoursesByTeacher } from '@/services/db';
import { getAtRiskStudents } from '@/services/analyticsService';

export default function TeacherAlerts() {
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const courses = await getCoursesByTeacher(user.uid);
        const all     = [];
        await Promise.all(courses.map(async c => {
          const students = await getAtRiskStudents(c.id, schoolId);
          students.filter(s => s.metrics.riskScore <= 69).forEach(s => {
            all.push({ ...s, courseName: c.name, courseId: c.id });
          });
        }));
        all.sort((a,b) => a.metrics.riskScore - b.metrics.riskScore);
        setAlerts(all);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const high    = alerts.filter(a=>a.metrics.riskScore<=39);
  const medium  = alerts.filter(a=>a.metrics.riskScore>39&&a.metrics.riskScore<=69);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'860px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700 }}>🔔 Alertas de riesgo</h1>
          <p style={{ color:C.muted, fontSize:'13px', marginTop:'4px' }}>Alumnos que necesitan tu atención hoy</p>
        </div>

        {loading ? (
          <div style={{ display:'flex',justifyContent:'center',padding:'80px' }}><Spinner size={38} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState emoji="🎉" title="¡Todo bien!" desc="No hay alumnos en riesgo en este momento. Sigue publicando clases para mantener el seguimiento." />
        ) : (
          <>
            {high.length > 0 && (
              <div style={{ marginBottom:'26px' }}>
                <SectionHeader title={`🔴 Requieren intervención urgente (${high.length})`} sub="Más de 14 días sin actividad o promedio muy bajo" />
                <div style={{ display:'grid', gap:'12px' }}>
                  {high.map((s,i) => <AlertCard key={`${s.id}-${s.courseId}`} student={s} idx={i} navigate={navigate} />)}
                </div>
              </div>
            )}
            {medium.length > 0 && (
              <div>
                <SectionHeader title={`🟡 En observación (${medium.length})`} sub="Actividad reducida o rendimiento bajo" />
                <div style={{ display:'grid', gap:'12px' }}>
                  {medium.map((s,i) => <AlertCard key={`${s.id}-${s.courseId}`} student={s} idx={i} navigate={navigate} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AlertCard({ student, idx, navigate }) {
  const m = student.metrics;
  return (
    <Card key={student.id} className={`anim-fade-up anim-d${Math.min(idx+1,5)}`}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
            <div style={{ fontWeight:700, fontSize:'15px' }}>{student.name}</div>
            <span style={{ color:C.muted,fontSize:'12px',background:C.surface,borderRadius:'20px',padding:'2px 8px' }}>{student.courseName}</span>
          </div>
          <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', marginBottom:'8px' }}>
            <span style={{ color:C.muted,fontSize:'12px' }}>
              📅 Último acceso: <strong style={{ color:m.daysSinceLastActivity>7?C.red:C.text }}>{m.daysSinceLastActivity===999?'Nunca':`hace ${m.daysSinceLastActivity} días`}</strong>
            </span>
            {m.avgQuizScore!=null && <span style={{ color:C.muted,fontSize:'12px' }}>🎯 Quiz: <strong style={{ color:m.avgQuizScore<50?C.red:C.text }}>{m.avgQuizScore}%</strong></span>}
            <span style={{ color:C.muted,fontSize:'12px' }}>📚 {m.totalSessions} sesiones totales</span>
          </div>
          {m.riskReasons?.length > 0 && (
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
              {m.riskReasons.map((r,j) => <span key={j} style={{ background:C.redSoft,color:C.red,borderRadius:'20px',padding:'2px 8px',fontSize:'11px' }}>{r}</span>)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
          <RiskBadge score={m.riskScore} size="lg" />
          <Btn small onClick={()=>navigate(`/teacher/course/${student.courseId}`)}>Ver curso</Btn>
        </div>
      </div>
    </Card>
  );
}