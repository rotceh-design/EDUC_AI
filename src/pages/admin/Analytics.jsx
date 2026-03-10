import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, getRiskLevel } from '@/theme';
import { Card, StatCard, SectionHeader, Spinner, Tabs, Badge, Alert } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getSchoolMetrics, getAtRiskStudents } from '@/services/analyticsService';
import { getCoursesBySchool } from '@/services/db';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STYLE_COLORS = { lector:C.accent, visual:C.green, auditivo:C.amber, quiz:C.coral, practica:C.violet };

export default function AdminAnalytics() {
  const { schoolId } = useAuth();
  const [metrics,   setMetrics]   = useState(null);
  const [atRisk,    setAtRisk]    = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [selCourse, setSelCourse] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [loadRisk,  setLoadRisk]  = useState(false);
  const [tab, setTab] = useState('General');

  // 🔥 MEJORA: Esperar a que schoolId exista antes de cargar
  useEffect(() => {
    if (!schoolId) return;

    (async () => {
      setLoading(true);
      try {
        const [m, c] = await Promise.all([getSchoolMetrics(schoolId), getCoursesBySchool(schoolId)]);
        setMetrics(m); 
        setCourses(c);
        if (c.length > 0) setSelCourse(c[0].id);
      } catch(e) { console.error("Error en Analytics:", e); }
      setLoading(false);
    })();
  }, [schoolId]);

  useEffect(() => {
    if (!selCourse || !schoolId) return;
    setLoadRisk(true);
    getAtRiskStudents(selCourse, schoolId)
      .then(setAtRisk)
      .catch(console.error)
      .finally(() => setLoadRisk(false));
  }, [selCourse, schoolId]);

  if (!schoolId) return <div style={{padding:'50px', textAlign:'center'}}><Spinner /></div>;

  const styleData = metrics ? Object.entries(metrics.styleDistribution||{}).map(([id, count]) => ({
    name: STYLES.find(s=>s.id===id)?.label || id,
    count,
    color: STYLE_COLORS[id] || C.accent,
  })).sort((a,b)=>b.count-a.count) : [];

  const riskPie = metrics ? [
    { name:'En riesgo',       value:metrics.riskDistribution?.atRisk || 0,   color:C.red   },
    { name:'En observación', value:metrics.riskDistribution?.watching || 0,  color:C.amber },
    { name:'Bien',            value:metrics.riskDistribution?.good || 0,      color:C.green },
    { name:'Inactivos',       value:metrics.riskDistribution?.inactive || 0,  color:C.muted },
  ].filter(d=>d.value>0) : [];

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>

        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, marginBottom:'4px' }}>📊 Inteligencia Institucional</h1>
          <p style={{ color:C.muted, fontSize:'13px' }}>Métricas de rendimiento y prevención de deserción con IA</p>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}><Spinner size={40} /></div>
        ) : !metrics ? (
          <EmptyState emoji="📈" title="Sin datos suficientes" desc="Aún no hay actividad de alumnos para generar analíticas." />
        ) : (
          <>
            <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'28px' }}>
              <StatCard label="Matrícula Total"    value={metrics.totalStudents}    icon="🎒"  color={C.green}  />
              <StatCard label="Tasa de Actividad"  value={metrics.activeStudents}   icon="✅"  color={C.accent} sub={`alumnos activos`} />
              <StatCard label="Total Sesiones"     value={metrics.totalSessions}    icon="📖"  color={C.violet} />
              <StatCard label="Promedio Quizzes"    value={metrics.avgSchoolScore ? `${metrics.avgSchoolScore}%` : '—'} icon="🎯" color={C.amber} />
            </div>

            <Tabs tabs={['General','Prevención de Deserción','Estilos']} active={tab} onChange={setTab} />

            {/* ── TAB GENERAL ── */}
            {tab === 'General' && (
              <div className="anim-fade-up">
                <SectionHeader title="Actividad de la Plataforma" sub="Frecuencia de estudio diaria" />
                <Card style={{ marginBottom:'24px', padding:'24px' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="fecha" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} />
                      <Tooltip contentStyle={{ background:C.card, borderRadius:'10px', border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="sesiones" stroke={C.accent} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Sesiones" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>
                  <Card style={{ padding:'20px' }}>
                    <div style={{ fontWeight:700, marginBottom:'20px', fontSize:'14px' }}>Estado General del Alumnado</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={5}>
                          {riskPie.map((e,i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card style={{ padding:'20px' }}>
                    <div style={{ fontWeight:700, marginBottom:'20px', fontSize:'14px' }}>Uso de Estilos IA</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={styleData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ fill:C.muted, fontSize:11 }} width={80} axisLine={false} />
                        <Bar dataKey="count" radius={[0,4,4,0]}>
                          {styleData.map((e,i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            )}

            {/* ── TAB DESERCIÓN ── */}
            {tab === 'Prevención de Deserción' && (
              <div className="anim-fade-up">
                <Alert type="info" style={{marginBottom:'20px'}}>
                  <strong>Motor Predictivo:</strong> El sistema identifica alumnos con baja actividad o rendimiento decreciente para prevenir el abandono escolar.
                </Alert>

                <div style={{ marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{fontSize:'13px', fontWeight:600, color:C.textSub}}>Filtrar por Aula/Materia:</span>
                  <select value={selCourse} onChange={e=>setSelCourse(e.target.value)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none' }}>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {loadRisk ? <div style={{ textAlign:'center', padding:'40px' }}><Spinner /></div> :
                atRisk.length === 0 ? <p style={{ color:C.muted, textAlign:'center', padding:'40px' }}>No se detectan alumnos en riesgo en esta materia.</p> : (
                  <div style={{ display:'grid', gap:'10px' }}>
                    {atRisk.map((student, i) => {
                      const m   = student.metrics;
                      const lvl = getRiskLevel(m.riskScore);
                      return (
                        <Card key={student.id} style={{ borderLeft:`4px solid ${lvl.color}` }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
                              <div style={{ width:40, height:40, borderRadius:'50%', background:lvl.soft, color:lvl.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                                {student.name[0]}
                              </div>
                              <div>
                                <div style={{ fontWeight:700 }}>{student.name}</div>
                                <div style={{ fontSize:'12px', color:C.muted }}>Última vez: {m.daysSinceLastActivity === 999 ? 'Nunca' : `hace ${m.daysSinceLastActivity} días`}</div>
                              </div>
                            </div>
                            <RiskBadge score={m.riskScore} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB ESTILOS ── */}
            {tab === 'Estilos' && (
              <div className="anim-fade-up">
                <SectionHeader title="Análisis de Preferencias" sub="Cómo aprenden tus estudiantes de forma real" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'15px' }}>
                  {STYLES.map(style => {
                    const count = metrics.styleDistribution[style.id] || 0;
                    return (
                      <Card key={style.id} accent={style.color}>
                        <div style={{ fontSize:'30px', marginBottom:'10px' }}>{style.emoji}</div>
                        <div style={{ fontWeight:700, fontSize:'15px' }}>{style.label}</div>
                        <div style={{ fontSize:'24px', fontWeight:700, marginTop:'10px', color:style.color }}>{count} <span style={{fontSize:'12px', color:C.muted}}>sesiones</span></div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Diag({ color, icon, title, desc }) {
  return (
    <div style={{ padding:'12px',background:`${color}10`,borderRadius:'8px',borderLeft:`4px solid ${color}` }}>
      <div style={{ fontWeight:600,fontSize:'13px',color,display:'flex',alignItems:'center',gap:'6px' }}>{icon} {title}</div>
      <div style={{ fontSize:'12px',color:C.textSub,marginTop:'4px' }}>{desc}</div>
    </div>
  );
}