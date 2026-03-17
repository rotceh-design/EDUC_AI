// src/pages/teacher/TeacherAlerts.jsx — educ_AI v4.0 CYBERPUNK
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Card, SectionHeader, EmptyState, Spinner, Btn } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getCoursesByTeacher } from '@/services/db';
import { getAtRiskStudents } from '@/services/analyticsService';

const Ico = {
  Back:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Clock:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Quiz:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Session: ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Arrow:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Shield:  ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

// ── BADGE DE URGENCIA ─────────────────────────────────────────────────────────
function UrgencyBadge({ score }) {
  if (score <= 39) return (
    <span style={{ background:`${C.red}20`, border:`1px solid ${C.red}50`,
      color:C.red, borderRadius:'20px', padding:'4px 12px', fontSize:'11px', fontWeight:800,
      display:'flex', alignItems:'center', gap:'5px' }}>
      <span style={{ width:7,height:7,borderRadius:'50%',background:C.red,
        boxShadow:`0 0 8px ${C.red}`,display:'inline-block' }}/>
      URGENTE
    </span>
  );
  return (
    <span style={{ background:`${C.amber}15`, border:`1px solid ${C.amber}40`,
      color:C.amber, borderRadius:'20px', padding:'4px 12px', fontSize:'11px', fontWeight:800,
      display:'flex', alignItems:'center', gap:'5px' }}>
      <span style={{ width:7,height:7,borderRadius:'50%',background:C.amber,display:'inline-block' }}/>
      ATENCIÓN
    </span>
  );
}

// ── TARJETA DE ALERTA ─────────────────────────────────────────────────────────
function AlertCard({ student, idx, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const m = student.metrics;
  const isHigh = m.riskScore <= 39;
  const accentColor = isHigh ? C.red : C.amber;

  return (
    <div
      className={`anim-fade-up anim-d${Math.min(idx+1,5)}`}
      onClick={() => setExpanded(e => !e)}
      style={{ background:C.card,
        borderLeft:`4px solid ${accentColor}`,
        border:`1px solid ${C.border}`,
        borderRadius:'16px', padding:'18px 20px',
        cursor:'pointer', transition:'all .2s cubic-bezier(.16,1,.3,1)',
        position:'relative', overflow:'hidden',
        boxShadow: isHigh ? `0 0 20px ${C.red}08` : 'none' }}
      onMouseEnter={e=>{
        e.currentTarget.style.borderColor=accentColor;
        e.currentTarget.style.boxShadow=`0 8px 25px ${accentColor}15`;
        e.currentTarget.style.transform='translateY(-2px)';
      }}
      onMouseLeave={e=>{
        e.currentTarget.style.borderColor=C.border;
        e.currentTarget.style.boxShadow=isHigh?`0 0 20px ${C.red}08`:'none';
        e.currentTarget.style.transform='translateY(0)';
      }}>

      {/* Número de posición decorativo */}
      <div style={{ position:'absolute', right:'-5px', bottom:'-8px',
        fontSize:'70px', fontWeight:900, fontFamily:"'Press Start 2P',cursive",
        color:accentColor, opacity:.04, pointerEvents:'none', lineHeight:1 }}>
        {(idx+1).toString().padStart(2,'0')}
      </div>

      {/* Fila principal */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        gap:'14px', flexWrap:'wrap', position:'relative', zIndex:1 }}>

        {/* Avatar + nombre */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', flex:1, minWidth:'200px' }}>
          <div style={{ width:46,height:46,borderRadius:'50%',flexShrink:0,
            background:`${accentColor}15`, border:`2px solid ${accentColor}40`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontWeight:800,color:accentColor,fontSize:'17px' }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:'15px', color:C.text, marginBottom:'4px' }}>
              {student.name}
            </div>
            <span style={{ background:C.surface, borderRadius:'20px',
              padding:'3px 10px', fontSize:'11px', color:C.muted, fontWeight:600 }}>
              {student.courseName}
            </span>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            {[
              { icon:<Ico.Clock s={13}/>, val: m.daysSinceLastActivity===999?'Nunca':`${m.daysSinceLastActivity}d`,
                color: m.daysSinceLastActivity>7 ? C.red : C.muted },
              { icon:<Ico.Quiz s={13}/>, val: m.avgQuizScore!=null?`${m.avgQuizScore}%`:'—',
                color: (m.avgQuizScore||0)<50 ? C.red : C.muted },
              { icon:<Ico.Session s={13}/>, val: `${m.totalSessions} ses.`,
                color: C.muted },
            ].map((stat,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px',
                background:C.surface, borderRadius:'8px', padding:'5px 9px',
                fontSize:'12px', color:stat.color, fontWeight:600, border:`1px solid ${C.border}` }}>
                <span style={{ color:stat.color }}>{stat.icon}</span> {stat.val}
              </div>
            ))}
          </div>
          <RiskBadge score={m.riskScore} size="lg" />
        </div>
      </div>

      {/* Factores de riesgo */}
      {m.riskReasons?.length > 0 && (
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'12px',
          paddingTop:'12px', borderTop:`1px solid ${C.border}` }}>
          {m.riskReasons.map((r,j) => (
            <span key={j} style={{ background:`${accentColor}12`, color:accentColor,
              borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:600,
              border:`1px solid ${accentColor}30` }}>
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Panel expandido */}
      {expanded && (
        <div className="anim-fade-up" style={{ marginTop:'14px', padding:'16px',
          background:C.surface, borderRadius:'12px', border:`1px solid ${C.border}` }}
          onClick={e=>e.stopPropagation()}>
          <div style={{ fontWeight:700, fontSize:'12px', color:C.textSub,
            textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
            📋 Detalle del alumno
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px',
            marginBottom:'14px' }}>
            {[
              { l:'Días sin actividad', v:m.daysSinceLastActivity===999?'Nunca conectado':`${m.daysSinceLastActivity} días`, c:m.daysSinceLastActivity>14?C.red:m.daysSinceLastActivity>7?C.amber:C.green },
              { l:'Quiz promedio', v:m.avgQuizScore!=null?`${m.avgQuizScore}%`:'Sin datos', c:(m.avgQuizScore||0)<50?C.red:C.green },
              { l:'Sesiones totales', v:m.totalSessions, c:m.totalSessions<5?C.amber:C.green },
              { l:'Tendencia', v:m.trend==='declining'?'↓ Bajando':m.trend==='improving'?'↑ Mejorando':'→ Estable', c:m.trend==='declining'?C.red:m.trend==='improving'?C.green:C.muted },
            ].map(({l,v,c})=>(
              <div key={l} style={{ background:C.card, borderRadius:'10px', padding:'12px 14px',
                border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'11px', color:C.muted, marginBottom:'5px',
                  textTransform:'uppercase', letterSpacing:'.04em' }}>{l}</div>
                <div style={{ fontWeight:700, fontSize:'14px', color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <Btn full color={accentColor}
            onClick={()=>navigate(`/teacher/course/${student.courseId}`)}
            icon={<Ico.Arrow s={14}/>}>
            Ir a la materia
          </Btn>
        </div>
      )}
    </div>
  );
}

// ── PANEL DE RESUMEN STATS ────────────────────────────────────────────────────
function AlertStat({ label, value, color, sub }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${color}30`, borderRadius:'14px',
      padding:'18px', textAlign:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0,
        background:`radial-gradient(circle at 50% 0%, ${color}12 0%, transparent 70%)`,
        pointerEvents:'none' }} />
      <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'24px', fontWeight:700,
        color, marginBottom:'6px' }}>{value}</div>
      <div style={{ fontSize:'11px', color:C.textSub, textTransform:'uppercase',
        letterSpacing:'.05em', fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:'10px', color:C.muted, marginTop:'3px' }}>{sub}</div>}
    </div>
  );
}

export default function TeacherAlerts() {
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const courses = await getCoursesByTeacher(user.uid);
        const all = [];
        await Promise.all(courses.map(async c => {
          const students = await getAtRiskStudents(c.id, schoolId);
          students.filter(s => s.metrics.riskScore <= 69).forEach(s => {
            all.push({ ...s, courseName:c.name, courseId:c.id });
          });
        }));
        all.sort((a,b) => a.metrics.riskScore - b.metrics.riskScore);
        setAlerts(all);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const high   = alerts.filter(a => a.metrics.riskScore <= 39);
  const medium = alerts.filter(a => a.metrics.riskScore > 39 && a.metrics.riskScore <= 69);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>

      {/* Aura de alerta */}
      <div style={{ position:'fixed', top:'-10%', left:'-10%', width:'55%', height:'55%',
        background:`radial-gradient(circle, ${C.red}08 0%, transparent 65%)`,
        pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'45%', height:'45%',
        background:`radial-gradient(circle, ${C.amber}08 0%, transparent 65%)`,
        pointerEvents:'none', zIndex:0 }} />

      <Navbar />
      <main style={{ maxWidth:'880px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <button onClick={()=>navigate('/teacher')}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px',
              background:`${C.accent}12`, border:`1px solid ${C.accent}30`, borderRadius:'8px',
              padding:'7px 14px', cursor:'pointer', color:C.accent, fontSize:'13px', fontWeight:700,
              marginBottom:'16px', transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${C.accent}25`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${C.accent}12`;}}>
            <Ico.Back s={14} c={C.accent}/> Volver al Dashboard
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ width:50,height:50,borderRadius:'14px',
              background:`${C.red}15`, border:`1.5px solid ${C.red}40`,
              color:C.red, display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 0 20px ${C.red}20` }}>
              <Ico.Shield s={24}/>
            </div>
            <div>
              <h1 className="font-retro" style={{ fontSize:'1rem', color:C.text, marginBottom:'4px' }}>
                ALERTAS DE RIESGO
              </h1>
              <p style={{ color:C.muted, fontSize:'13px' }}>
                Alumnos que necesitan tu atención ahora
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}>
            <Spinner size={40} />
          </div>
        ) : alerts.length === 0 ? (
          <div>
            {/* Stats vacías */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'28px' }}>
              <AlertStat label="Urgentes"    value={0} color={C.red}   sub="sin alertas" />
              <AlertStat label="Observación" value={0} color={C.amber} sub="sin alertas" />
              <AlertStat label="Total"       value={0} color={C.green} sub="todos bien" />
            </div>
            <Card style={{ padding:'40px', textAlign:'center',
              background:`${C.green}06`, borderColor:`${C.green}20` }}>
              <div style={{ fontSize:'52px', marginBottom:'14px' }}>🎉</div>
              <div style={{ fontWeight:700, fontSize:'18px', color:C.green, marginBottom:'8px' }}>
                ¡Todos tus alumnos están bien!
              </div>
              <div style={{ color:C.muted, fontSize:'13px', lineHeight:1.7, maxWidth:'380px', margin:'0 auto' }}>
                No hay alumnos en riesgo en este momento. Sigue publicando clases para mantener
                el seguimiento activo.
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* ── STATS RESUMEN ─────────────────────────────────────── */}
            <div className="anim-fade-up anim-d1" style={{ display:'grid',
              gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'14px', marginBottom:'28px' }}>
              <AlertStat label="Intervención urgente" value={high.length}   color={C.red}   sub="riesgo alto" />
              <AlertStat label="En observación"       value={medium.length} color={C.amber} sub="riesgo medio" />
              <AlertStat label="Total alertas"        value={alerts.length} color={C.text}  />
            </div>

            {/* ── URGENTES ─────────────────────────────────────────── */}
            {high.length > 0 && (
              <div style={{ marginBottom:'28px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:C.red,
                    boxShadow:`0 0 10px ${C.red}`, animation:'svPulse 1.5s ease infinite' }} />
                  <div style={{ fontWeight:700, fontSize:'14px', color:C.red, textTransform:'uppercase',
                    letterSpacing:'.05em' }}>
                    Intervención Urgente — {high.length} alumno{high.length!==1?'s':''}
                  </div>
                  <div style={{ height:'1px', flex:1, background:`${C.red}30` }} />
                  <UrgencyBadge score={10} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {high.map((s,i) => <AlertCard key={`${s.id}-${s.courseId}`} student={s} idx={i} navigate={navigate} />)}
                </div>
              </div>
            )}

            {/* ── EN OBSERVACIÓN ───────────────────────────────────── */}
            {medium.length > 0 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:C.amber }} />
                  <div style={{ fontWeight:700, fontSize:'14px', color:C.amber, textTransform:'uppercase',
                    letterSpacing:'.05em' }}>
                    En Observación — {medium.length} alumno{medium.length!==1?'s':''}
                  </div>
                  <div style={{ height:'1px', flex:1, background:`${C.amber}30` }} />
                  <UrgencyBadge score={50} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {medium.map((s,i) => <AlertCard key={`${s.id}-${s.courseId}`} student={s} idx={high.length+i} navigate={navigate} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}