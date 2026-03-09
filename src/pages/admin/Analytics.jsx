import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, getRiskLevel } from '@/theme';
import { Card, StatCard, SectionHeader, Spinner, Tabs, Badge } from '@/components/ui';
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

  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([getSchoolMetrics(schoolId), getCoursesBySchool(schoolId)]);
        setMetrics(m); setCourses(c);
        if (c.length > 0) setSelCourse(c[0].id);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selCourse) return;
    setLoadRisk(true);
    getAtRiskStudents(selCourse, schoolId)
      .then(setAtRisk)
      .catch(console.error)
      .finally(() => setLoadRisk(false));
  }, [selCourse]);

  const styleData = metrics ? Object.entries(metrics.styleDistribution||{}).map(([id, count]) => ({
    name: STYLES.find(s=>s.id===id)?.label || id,
    count,
    color: STYLE_COLORS[id] || C.accent,
  })).sort((a,b)=>b.count-a.count) : [];

  const riskPie = metrics ? [
    { name:'En riesgo',      value:metrics.riskDistribution.atRisk,   color:C.red   },
    { name:'En observación', value:metrics.riskDistribution.watching,  color:C.amber },
    { name:'Bien',           value:metrics.riskDistribution.good,      color:C.green },
    { name:'Inactivos',      value:metrics.riskDistribution.inactive,  color:C.muted },
  ].filter(d=>d.value>0) : [];

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>

        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, marginBottom:'4px' }}>📊 Analíticas</h1>
          <p style={{ color:C.muted, fontSize:'13px' }}>Métricas en tiempo real · Prevención de deserción</p>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}><Spinner size={40} /></div>
        ) : (
          <>
            {/* Stats globales */}
            <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'28px' }}>
              <StatCard label="Total alumnos"    value={metrics.totalStudents}    icon="🎒"  color={C.green}  />
              <StatCard label="Alumnos activos"  value={metrics.activeStudents}   icon="✅"  color={C.accent} sub={`de ${metrics.totalStudents} total`} />
              <StatCard label="Sesiones totales" value={metrics.totalSessions}    icon="📖"  color={C.violet} />
              <StatCard label="Promedio quiz"    value={metrics.avgSchoolScore?`${metrics.avgSchoolScore}%`:'—'} icon="🎯" color={metrics.avgSchoolScore>=70?C.green:metrics.avgSchoolScore>=50?C.amber:C.red} />
              <StatCard label="Esta semana"      value={metrics.sessionsThisWeek} icon="📅"  color={C.amber}  sub="sesiones" />
              <StatCard label="En riesgo"        value={metrics.riskDistribution.atRisk} icon="🔴" color={C.red} sub="requieren atención" />
            </div>

            <Tabs tabs={['General','Deserción','Estilos']} active={tab} onChange={setTab} />

            {/* ── TAB GENERAL ── */}
            {tab === 'General' && (
              <div className="anim-fade-up">
                <SectionHeader title="Actividad diaria" sub="Sesiones de estudio — últimos 14 días" />
                <Card style={{ marginBottom:'24px', padding:'20px' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={metrics.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="fecha" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', color:C.text, fontSize:'13px' }} />
                      <Line type="monotone" dataKey="sesiones" stroke={C.accent} strokeWidth={2.5} dot={{ fill:C.accent, r:3 }} activeDot={{ r:5 }} name="Sesiones" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                  <Card style={{ padding:'20px' }}>
                    <div style={{ fontWeight:700, marginBottom:'16px', fontSize:'14px' }}>Distribución de riesgo</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{ fontSize:'11px' }}>
                          {riskPie.map((e,i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', color:C.text, fontSize:'12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card style={{ padding:'20px' }}>
                    <div style={{ fontWeight:700, marginBottom:'16px', fontSize:'14px' }}>Estilos más usados</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={styleData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                        <XAxis type="number" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} width={65} />
                        <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', color:C.text, fontSize:'12px' }} />
                        <Bar dataKey="count" name="Sesiones" radius={[0,6,6,0]}>
                          {styleData.map((e,i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            )}

            {/* ── TAB DESERCIÓN ── */}
            {tab === 'Deserción' && (
              <div className="anim-fade-up">
                <Card style={{ background:`${C.red}08`, borderColor:`${C.red}25`, marginBottom:'20px', padding:'18px 22px' }}>
                  <div style={{ fontWeight:700, color:C.red, marginBottom:'6px' }}>🔴 Predicción de deserción</div>
                  <p style={{ color:C.muted, fontSize:'13px', lineHeight:1.6 }}>
                    El algoritmo analiza: días sin actividad, promedio de quiz, estilos usados, tendencia de rendimiento y tasa de completitud de clases.
                    Alumnos con score &lt;40 requieren intervención inmediata.
                  </p>
                </Card>

                {courses.length > 0 && (
                  <div style={{ marginBottom:'20px' }}>
                    <label style={{ fontSize:'13px', fontWeight:600, color:C.textSub, display:'block', marginBottom:'6px' }}>Filtrar por curso:</label>
                    <select value={selCourse} onChange={e=>setSelCourse(e.target.value)} style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:'10px', padding:'9px 13px', color:C.text, fontSize:'13px', outline:'none', cursor:'pointer' }}>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {loadRisk ? <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}><Spinner /></div> :
                atRisk.length === 0 ? <p style={{ color:C.muted, fontSize:'14px', textAlign:'center', padding:'40px' }}>No hay datos de alumnos para este curso aún.</p> : (
                  <div style={{ display:'grid', gap:'12px' }}>
                    {atRisk.map((student, i) => {
                      const m   = student.metrics;
                      const lvl = getRiskLevel(m.riskScore);
                      return (
                        <Card key={student.id} accent={lvl.color} className={`anim-fade-up anim-d${Math.min(i+1,5)}`}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1 }}>
                              <div style={{ width:42,height:42,borderRadius:'50%',background:`${lvl.color}20`,border:`2px solid ${lvl.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:lvl.color,flexShrink:0 }}>{student.name?.[0]?.toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'4px' }}>{student.name}</div>
                                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                                  <span style={{ color:C.muted, fontSize:'12px' }}>📚 {m.totalSessions} sesiones</span>
                                  {m.avgQuizScore!=null && <span style={{ color:C.muted, fontSize:'12px' }}>🎯 Quiz: {m.avgQuizScore}%</span>}
                                  <span style={{ color:C.muted, fontSize:'12px' }}>📅 Último acceso: {m.daysSinceLastActivity===999?'Nunca':`hace ${m.daysSinceLastActivity} días`}</span>
                                  {m.trend==='declining' && <span style={{ color:C.red, fontSize:'12px', fontWeight:600 }}>↓ Rendimiento bajando</span>}
                                  {m.trend==='improving' && <span style={{ color:C.green, fontSize:'12px', fontWeight:600 }}>↑ Mejorando</span>}
                                </div>
                                {m.riskReasons?.length > 0 && (
                                  <div style={{ marginTop:'6px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                                    {m.riskReasons.map((r,j) => <span key={j} style={{ background:`${lvl.color}15`, color:lvl.color, borderRadius:'20px', padding:'2px 8px', fontSize:'11px' }}>{r}</span>)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <RiskBadge score={m.riskScore} size="lg" />
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
                <SectionHeader title="Distribución de estilos de aprendizaje" sub="Cómo estudian los alumnos de la institución" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px' }}>
                  {STYLES.map(style => {
                    const count = metrics.styleDistribution[style.id] || 0;
                    const total = Object.values(metrics.styleDistribution).reduce((a,b)=>a+b,0) || 1;
                    const pct   = Math.round(count/total*100);
                    return (
                      <Card key={style.id} accent={style.color} style={{ padding:'18px' }}>
                        <div style={{ fontSize:'28px', marginBottom:'10px' }}>{style.emoji}</div>
                        <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'4px' }}>{style.label}</div>
                        <div style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, color:style.color, marginBottom:'4px' }}>{pct}%</div>
                        <div style={{ color:C.muted, fontSize:'12px' }}>{count} sesiones</div>
                      </Card>
                    );
                  })}
                </div>
                {metrics.topStyle && (
                  <Card style={{ marginTop:'20px', background:`${C.accent}08`, borderColor:`${C.accent}25`, padding:'18px' }}>
                    <div style={{ fontWeight:700, color:C.accent, marginBottom:'6px' }}>
                      💡 Estilo más popular: {STYLES.find(s=>s.id===metrics.topStyle)?.emoji} {STYLES.find(s=>s.id===metrics.topStyle)?.label}
                    </div>
                    <p style={{ color:C.muted, fontSize:'13px' }}>
                      La mayoría de los alumnos prefieren este modo de estudio. Considera que los profesores refuercen este formato en sus clases.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
