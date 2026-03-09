import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, StatCard, SectionHeader, EmptyState, Spinner, Badge, Btn } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getCoursesByTeacher, getClassesByCourse } from '@/services/db';

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses]  = useState([]);
  const [counts,  setCounts]   = useState({});
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCoursesByTeacher(user.uid);
        setCourses(c);
        const cc = {};
        await Promise.all(c.map(async co => {
          const cls = await getClassesByCourse(co.id);
          cc[co.id] = cls.length;
        }));
        setCounts(cc);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const totalClasses = Object.values(counts).reduce((a,b)=>a+b,0);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'980px', margin:'0 auto', padding:'30px 20px' }}>
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700 }}>
            Hola, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:C.muted, fontSize:'13px', marginTop:'4px' }}>Tus cursos y clases publicadas</p>
        </div>

        <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'28px' }}>
          <StatCard label="Cursos"          value={courses.length}  icon="📚" color={C.accent} />
          <StatCard label="Clases subidas"  value={totalClasses}    icon="📄" color={C.green}  />
        </div>

        <SectionHeader title="Mis Cursos" sub="Selecciona un curso para subir clases y ver alumnos" />

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}><Spinner size={36} /></div>
        ) : courses.length === 0 ? (
          <EmptyState emoji="📚" title="Sin cursos asignados" desc="El administrador debe asignarte cursos para que puedas comenzar." />
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'14px' }}>
            {courses.map((c, i) => (
              <Card key={c.id} onClick={()=>navigate(`/teacher/course/${c.id}`)} className={`anim-fade-up anim-d${Math.min(i+1,5)}`} accent={C.accent}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                  <div style={{ width:44,height:44,borderRadius:'12px',background:`${C.accent}18`,border:`1.5px solid ${C.accent}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px' }}>🏫</div>
                  <Badge color={C.accent}>{counts[c.id]||0} clases</Badge>
                </div>
                <div style={{ fontWeight:700, fontSize:'16px', marginBottom:'4px' }}>{c.name}</div>
                <div style={{ color:C.muted, fontSize:'13px', marginBottom:'12px' }}>{c.subject} · {c.grade}</div>
                <div style={{ color:C.accent, fontSize:'13px', fontWeight:600 }}>Ver curso →</div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}