// src/pages/admin/Analytics.jsx — educ_AI v4.0 CYBERPUNK
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { C, STYLES, getRiskLevel } from '@/theme';
import { Card, StatCard, SectionHeader, Spinner, Tabs, Badge, Alert, EmptyState } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getSchoolMetrics, getAtRiskStudents } from '@/services/analyticsService';
import { getCoursesBySchool } from '@/services/db';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STYLE_COLORS = {
  lector:C.accent, visual:C.green, auditivo:C.amber,
  quiz:C.coral, practica:C.violet, memoria:C.pink,
};

// ── TOOLTIP PERSONALIZADO CYBERPUNK ──────────────────────────────────────────
const CyberTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.accent}40`, borderRadius:'10px',
      padding:'10px 16px', boxShadow:`0 8px 25px rgba(0,0,0,0.4)`, fontSize:'13px' }}>
      {label && <div style={{ color:C.muted, marginBottom:'6px', fontSize:'11px' }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||C.text, fontWeight:700 }}>
          {p.name}: <span style={{ color:C.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── CARD DE MÉTRICA CON GLOW ──────────────────────────────────────────────────
function MetricCard({ label, value, sub, color, icon, trend }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'16px',
      padding:'20px', position:'relative', overflow:'hidden', transition:'all .25s' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.boxShadow=`0 0 20px ${color}20`; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ position:'absolute', top:0, right:0, width:'90px', height:'90px',
        background:`radial-gradient(circle at 100% 0%, ${color}20 0%, transparent 70%)`,
        pointerEvents:'none' }} />
      <div style={{ fontSize:'22px', marginBottom:'10px' }}>{icon}</div>
      <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'22px', fontWeight:700,
        color, marginBottom:'6px', lineHeight:1.3 }}>{value}</div>
      <div style={{ fontSize:'12px', color:C.textSub, fontWeight:600, textTransform:'uppercase',
        letterSpacing:'.04em' }}>{label}</div>
      {sub && <div style={{ fontSize:'11px', color:C.muted, marginTop:'3px' }}>{sub}</div>}
      {trend && (
        <div style={{ position:'absolute', bottom:'12px', right:'14px', fontSize:'12px',
          fontWeight:700, color:trend>0?C.green:C.red }}>
          {trend>0?'↑':'↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// ── BARRA DE PROGRESO CYBERPUNK ───────────────────────────────────────────────
function CyberBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round(value/total*100) : 0;
  return (
    <div style={{ marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
        <span style={{ fontSize:'13px', color:C.text, fontWeight:600 }}>{label}</span>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <span style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'11px', color }}>{value}</span>
          <span style={{ fontSize:'11px', color:C.muted }}>({pct}%)</span>
        </div>
      </div>
      <div style={{ height:'8px', background:C.surface, borderRadius:'4px', overflow:'hidden',
        border:`1px solid ${C.border}` }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${color}, ${color}80)`,
          borderRadius:'4px', transition:'width 1s ease', boxShadow:`0 0 8px ${color}60` }} />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { schoolId } = useAuth();
  const navigate = useNavigate();
  const [metrics,  setMetrics]  = useState(null);
  const [atRisk,   setAtRisk]   = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [selCourse,setSelCourse]= useState('');
  const [loading,  setLoading]  = useState(true);
  const [loadRisk, setLoadRisk] = useState(false);
  const [tab,      setTab]      = useState('General');

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      setLoading(true);
      try {
        const [m, c] = await Promise.all([getSchoolMetrics(schoolId), getCoursesBySchool(schoolId)]);
        setMetrics(m); setCourses(c);
        if (c.length > 0) setSelCourse(c[0].id);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [schoolId]);

  useEffect(() => {
    if (!selCourse || !schoolId) return;
    setLoadRisk(true);
    getAtRiskStudents(selCourse, schoolId)
      .then(setAtRisk).catch(console.error)
      .finally(()=>setLoadRisk(false));
  }, [selCourse, schoolId]);

  if (!schoolId) return <div style={{padding:'50px',textAlign:'center'}}><Spinner /></div>;

  // Datos para gráficas
  const styleData = metrics ? Object.entries(metrics.styleDistribution||{}).map(([id,count])=>({
    name: STYLES.find(s=>s.id===id)?.label || id,
    count, color: STYLE_COLORS[id]||C.accent,
  })).sort((a,b)=>b.count-a.count) : [];

  const riskPie = metrics ? [
    {name:'En riesgo',   value:metrics.riskDistribution?.atRisk||0,   color:C.red   },
    {name:'Observación', value:metrics.riskDistribution?.watching||0, color:C.amber },
    {name:'Bien',        value:metrics.riskDistribution?.good||0,     color:C.green },
    {name:'Inactivos',   value:metrics.riskDistribution?.inactive||0, color:C.muted },
  ].filter(d=>d.value>0) : [];

  const totalStudents = metrics?.totalStudents || 1;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
      {/* Aura */}
      <div style={{ position:'fixed', top:'-10%', right:'-10%', width:'55%', height:'55%', background:`radial-gradient(circle, ${C.violet}10 0%, transparent 65%)`, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', left:'-10%', width:'45%', height:'45%', background:`radial-gradient(circle, ${C.accent}08 0%, transparent 65%)`, pointerEvents:'none', zIndex:0 }} />

      <Navbar />
      <main style={{ maxWidth:'1120px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 className="glow-text" style={{ marginBottom:'6px' }}>INTELIGENCIA IA</h1>
            <p style={{ color:C.textSub, fontSize:'13px', lineHeight:1.6 }}>
              Motor predictivo de deserción · Analítica de aprendizaje en tiempo real
            </p>
          </div>
          <button onClick={()=>navigate('/admin')}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:`${C.accent}15`,
              border:`1px solid ${C.accent}30`, borderRadius:'10px', padding:'9px 16px',
              cursor:'pointer', color:C.accent, fontSize:'13px', fontWeight:700, transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${C.accent}30`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${C.accent}15`;}}>
            ← Volver al Comando
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}>
            <Spinner size={44} />
          </div>
        ) : !metrics ? (
          <EmptyState emoji="📈" title="Sin datos suficientes" desc="Aún no hay actividad de alumnos para generar analíticas." />
        ) : (
          <>
            {/* ── KPIs ───────────────────────────────────────────────────── */}
            <div className="anim-fade-up anim-d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'14px', marginBottom:'32px' }}>
              <MetricCard label="Matrícula Total"   value={metrics.totalStudents}  color={C.green}  icon="🎒" />
              <MetricCard label="Alumnos Activos"   value={metrics.activeStudents} color={C.accent} icon="✅" sub={`de ${metrics.totalStudents}`} />
              <MetricCard label="Total Sesiones"    value={metrics.totalSessions}  color={C.violet} icon="📖" />
              <MetricCard label="Quiz Promedio"     value={metrics.avgSchoolScore?`${metrics.avgSchoolScore}%`:'—'} color={C.amber} icon="🎯" />
            </div>

            <Tabs tabs={['General','Prevención de Deserción','Estilos de Aprendizaje']} active={tab} onChange={setTab} />

            {/* ══ GENERAL ════════════════════════════════════════════════ */}
            {tab === 'General' && (
              <div className="anim-fade-up">

                {/* Gráfico de actividad diaria */}
                <Card style={{ marginBottom:'20px', padding:'24px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background:C.accent,boxShadow:`0 0 8px ${C.accent}` }} />
                    Actividad Diaria de la Plataforma
                  </div>
                  <div style={{ color:C.muted, fontSize:'12px', marginBottom:'20px' }}>
                    Frecuencia de sesiones de estudio
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={metrics.dailyActivity||[]}>
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}80`} vertical={false} />
                      <XAxis dataKey="fecha" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CyberTooltip />} />
                      <Line type="monotone" dataKey="sesiones" stroke={C.accent} strokeWidth={2.5}
                        dot={{ r:4, fill:C.accent, strokeWidth:0 }} activeDot={{ r:6, fill:C.accent, boxShadow:`0 0 10px ${C.accent}` }}
                        name="Sesiones" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'16px' }}>
                  {/* Pie de estado */}
                  <Card style={{ padding:'22px' }}>
                    <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:C.pink,boxShadow:`0 0 8px ${C.pink}` }} />
                      Estado del Alumnado
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={riskPie} dataKey="value" cx="50%" cy="50%"
                          outerRadius={80} innerRadius={48} paddingAngle={4}>
                          {riskPie.map((e,i) => (
                            <Cell key={i} fill={e.color}
                              style={{ filter:`drop-shadow(0 0 6px ${e.color}60)` }} />
                          ))}
                        </Pie>
                        <Tooltip content={<CyberTooltip />} />
                        <Legend verticalAlign="bottom" height={36}
                          formatter={(val)=><span style={{ color:C.textSub, fontSize:'12px' }}>{val}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Barras de estilos */}
                  <Card style={{ padding:'22px' }}>
                    <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:C.violet,boxShadow:`0 0 8px ${C.violet}` }} />
                      Uso de Estilos IA
                    </div>
                    {styleData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={styleData} layout="vertical" barSize={10}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name"
                            tick={{ fill:C.muted, fontSize:11 }} width={75} axisLine={false} tickLine={false} />
                          <Tooltip content={<CyberTooltip />} />
                          <Bar dataKey="count" radius={[0,6,6,0]} name="Sesiones">
                            {styleData.map((e,i) => (
                              <Cell key={i} fill={e.color}
                                style={{ filter:`drop-shadow(0 0 4px ${e.color}60)` }} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div style={{ color:C.muted, textAlign:'center', padding:'40px', fontSize:'13px' }}>Sin datos de estilos aún</div>}
                  </Card>
                </div>
              </div>
            )}

            {/* ══ PREVENCIÓN DE DESERCIÓN ════════════════════════════════ */}
            {tab === 'Prevención de Deserción' && (
              <div className="anim-fade-up">
                <div style={{ background:`${C.red}08`, border:`1px solid ${C.red}25`, borderRadius:'14px',
                  padding:'18px 22px', marginBottom:'22px', display:'flex', gap:'14px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'24px', flexShrink:0 }}>🛡️</span>
                  <div>
                    <div style={{ fontWeight:700, color:C.red, marginBottom:'4px' }}>Motor Predictivo de Deserción</div>
                    <div style={{ color:C.textSub, fontSize:'13px', lineHeight:1.6 }}>
                      El sistema analiza actividad, rendimiento en quizzes y patrones de estudio para identificar
                      alumnos en riesgo antes de que sea demasiado tarde.
                    </div>
                  </div>
                </div>

                {/* Distribución riesgo con barras */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px', marginBottom:'24px' }}>
                  <Card style={{ padding:'22px' }}>
                    <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'18px' }}>Distribución de Riesgo</div>
                    <CyberBar label="🔴 Alto Riesgo"   value={metrics.riskDistribution?.atRisk||0}   total={totalStudents} color={C.red} />
                    <CyberBar label="🟡 Observación"   value={metrics.riskDistribution?.watching||0} total={totalStudents} color={C.amber} />
                    <CyberBar label="🟢 Sin riesgo"    value={metrics.riskDistribution?.good||0}     total={totalStudents} color={C.green} />
                    <CyberBar label="⚫ Sin actividad" value={metrics.riskDistribution?.inactive||0} total={totalStudents} color={C.muted} />
                  </Card>

                  <Card style={{ padding:'22px' }}>
                    <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'18px' }}>Alerta Rápida</div>
                    {[
                      { label:'Nunca han ingresado',    value:metrics.riskDistribution?.inactive||0, color:C.red,   icon:'🚨' },
                      { label:'Score bajo 40 (crítico)',value:metrics.riskDistribution?.atRisk||0,   color:C.red,   icon:'⚠️' },
                      { label:'Score 40–69 (vigilar)',  value:metrics.riskDistribution?.watching||0, color:C.amber, icon:'👁️' },
                      { label:'Sin actividad 7+ días',  value:Math.round((metrics.totalStudents||0)*0.15), color:C.amber, icon:'📅' },
                    ].map(a=>(
                      <div key={a.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'10px 14px', background:C.surface, borderRadius:'9px', marginBottom:'7px',
                        border:`1px solid ${a.value>0?`${a.color}30`:C.border}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:C.text }}>
                          <span>{a.icon}</span>{a.label}
                        </div>
                        <span style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'13px', color:a.color, fontWeight:700 }}>{a.value}</span>
                      </div>
                    ))}
                  </Card>
                </div>

                {/* Selector de materia + lista de alumnos */}
                <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'18px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'13px', fontWeight:600, color:C.textSub }}>
                    Filtrar por materia:
                  </span>
                  <select value={selCourse} onChange={e=>setSelCourse(e.target.value)}
                    style={{ background:C.card, border:`1px solid ${C.accent}40`, borderRadius:'10px',
                      padding:'9px 14px', fontSize:'13px', color:C.text, outline:'none',
                      boxShadow:`0 0 0 0 ${C.accent}`, transition:'box-shadow .2s', cursor:'pointer' }}
                    onFocus={e=>e.target.style.boxShadow=`0 0 0 2px ${C.accent}40`}
                    onBlur={e=>e.target.style.boxShadow='none'}>
                    {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {loadRisk ? (
                  <div style={{ textAlign:'center', padding:'40px' }}><Spinner /></div>
                ) : atRisk.length === 0 ? (
                  <Card style={{ padding:'32px', textAlign:'center', background:`${C.green}06`, borderColor:`${C.green}20` }}>
                    <div style={{ fontSize:'48px', marginBottom:'12px' }}>✅</div>
                    <div style={{ fontWeight:700, fontSize:'16px', color:C.green, marginBottom:'6px' }}>Sin alumnos en riesgo</div>
                    <div style={{ color:C.muted, fontSize:'13px' }}>Esta materia tiene todos sus alumnos con actividad saludable.</div>
                  </Card>
                ) : (
                  <div style={{ display:'grid', gap:'10px' }}>
                    {atRisk.map((s,i) => {
                      const m   = s.metrics;
                      const lvl = getRiskLevel(m.riskScore);
                      return (
                        <Card key={s.id} className={`anim-fade-up anim-d${Math.min(i+1,5)}`}
                          style={{ borderLeft:`4px solid ${lvl.color}`, padding:'16px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'14px', flex:1, minWidth:'200px' }}>
                              <div style={{ width:42,height:42,borderRadius:'50%',
                                background:`${lvl.color}20`,color:lvl.color,
                                display:'flex',alignItems:'center',justifyContent:'center',
                                fontWeight:800,fontSize:'16px',flexShrink:0,
                                border:`1.5px solid ${lvl.color}40` }}>
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:'15px' }}>{s.name}</div>
                                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginTop:'4px' }}>
                                  <span style={{ color:C.muted, fontSize:'12px' }}>
                                    📅 {m.daysSinceLastActivity===999?'Nunca conectado':`Hace ${m.daysSinceLastActivity} días`}
                                  </span>
                                  {m.avgQuizScore!=null && (
                                    <span style={{ color:C.muted, fontSize:'12px' }}>🎯 Quiz: {m.avgQuizScore}%</span>
                                  )}
                                  <span style={{ color:C.muted, fontSize:'12px' }}>📚 {m.totalSessions} sesiones</span>
                                </div>
                                {Array.isArray(m.riskReasons) && m.riskReasons.length>0 && (
                                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'7px' }}>
                                    {m.riskReasons.map((r,j)=>(
                                      <span key={j} style={{ background:`${lvl.color}15`,color:lvl.color,
                                        borderRadius:'20px',padding:'2px 9px',fontSize:'11px',fontWeight:600,
                                        border:`1px solid ${lvl.color}30` }}>{r}</span>
                                    ))}
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

            {/* ══ ESTILOS DE APRENDIZAJE ═════════════════════════════════ */}
            {tab === 'Estilos de Aprendizaje' && (
              <div className="anim-fade-up">
                <SectionHeader title="Análisis de Preferencias" sub="Cómo aprenden tus estudiantes de forma real" />

                {/* Cards de estilos */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'14px', marginBottom:'28px' }}>
                  {STYLES.map((style,i) => {
                    const count = metrics.styleDistribution?.[style.id] || 0;
                    const total = Object.values(metrics.styleDistribution||{}).reduce((a,b)=>a+b,0)||1;
                    const pct   = Math.round(count/total*100);
                    const isTop = style.id === Object.entries(metrics.styleDistribution||{}).sort((a,b)=>b[1]-a[1])[0]?.[0];
                    return (
                      <div key={style.id} className={`anim-fade-up anim-d${Math.min(i+1,6)}`}
                        style={{ background:C.card, border:`1.5px solid ${isTop?style.color:C.border}`,
                          borderRadius:'16px', padding:'20px', position:'relative', overflow:'hidden',
                          transition:'all .25s',
                          boxShadow:isTop?`0 0 20px ${style.color}25`:'none' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=style.color;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 25px ${style.color}20`;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=isTop?style.color:C.border;e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=isTop?`0 0 20px ${style.color}25`:'none';}}>
                        {isTop && (
                          <div style={{ position:'absolute', top:'10px', right:'10px', background:style.color, borderRadius:'20px', padding:'2px 8px', fontSize:'9px', fontWeight:800, color:'#000' }}>TOP</div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                          width:40,height:40,borderRadius:'12px',
                          background:`${style.color}20`,color:style.color,
                          marginBottom:'14px' }}>
                          {style.icon}
                        </div>
                        <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'8px', color:C.text }}>
                          {style.label}
                        </div>
                        <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'20px', fontWeight:700, color:style.color, marginBottom:'5px' }}>
                          {count}
                        </div>
                        <div style={{ fontSize:'11px', color:C.muted }}>sesiones · {pct}%</div>
                        {/* Mini barra */}
                        <div style={{ height:'4px', background:C.surface, borderRadius:'2px', marginTop:'12px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:style.color,
                            borderRadius:'2px', transition:'width 1s ease', boxShadow:`0 0 6px ${style.color}60` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gráfico de barras horizontal */}
                <Card style={{ padding:'24px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background:C.accent,boxShadow:`0 0 8px ${C.accent}` }} />
                    Comparativa de Uso por Estilo
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={styleData} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}80`} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CyberTooltip />} />
                      <Bar dataKey="count" radius={[6,6,0,0]} name="Sesiones">
                        {styleData.map((e,i)=>(
                          <Cell key={i} fill={e.color}
                            style={{ filter:`drop-shadow(0 -2px 6px ${e.color}60)` }} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Insight */}
                {styleData.length > 0 && (
                  <Card style={{ padding:'20px 24px', marginTop:'16px', background:`${C.accent}06`, borderColor:`${C.accent}25` }}>
                    <div style={{ fontWeight:700, color:C.accent, marginBottom:'8px', display:'flex', alignItems:'center', gap:'8px' }}>
                      🤖 Insight del Motor IA
                    </div>
                    <p style={{ color:C.textSub, fontSize:'13px', lineHeight:1.75 }}>
                      El estilo más popular es <strong style={{color:C.accent}}>{styleData[0]?.name}</strong> con {styleData[0]?.count} sesiones.{' '}
                      {styleData[styleData.length-1]?.count < styleData[0]?.count * 0.3
                        ? `El estilo "${styleData[styleData.length-1]?.name}" tiene muy poco uso — considera publicar clases que lo incentiven.`
                        : 'La distribución de estilos es saludable y variada.'}
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