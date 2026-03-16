// src/pages/student/StudyView.jsx — educ_AI v3.0
// 6 vistas: Lectura+tags, Visual+timeline, Audio+velocidad, Quiz tipado, Misiones XP, Memoria juegos

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import { useAuth }                      from '@/contexts/AuthContext';
import { C, STYLES }                    from '@/theme';
import { Card, Btn, Spinner, ProgressBar } from '@/components/ui';
import Navbar                           from '@/components/Navbar';
import { getClass, saveProgress, getProgressByStudent } from '@/services/db';

function Section({ label, color, icon }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'7px', fontWeight:700, fontSize:'12px',
      color, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px',
      paddingBottom:'8px', borderBottom:`1px solid ${color}25` }}>
      {icon && <span>{icon}</span>}{label}
    </div>
  );
}

export default function StudyView() {
  const { classId } = useParams();
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [styleId, setStyleId] = useState('lector');
  const [progress, setProgress] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([getClass(classId), getProgressByStudent(user.uid, schoolId)]);
        setCls(c);
        const map = {};
        p.filter(x => x.classId === classId).forEach(x => { map[x.styleId] = x; });
        setProgress(map);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [classId]);

  const recordView = async (sid) => {
    if (progress[sid]) return;
    const entry = { studentId:user.uid, classId, courseId:cls.courseId, schoolId, styleId:sid, score:null, totalQ:null };
    await saveProgress(entry);
    setProgress(p => ({ ...p, [sid]: entry }));
  };

  const handleStyleChange = (sid) => { setStyleId(sid); recordView(sid); };
  useEffect(() => { if (cls) recordView('lector'); }, [cls]);

  if (loading) return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={40} /></div>;
  if (!cls?.content) return <div style={{ padding:'60px', textAlign:'center', color:C.muted }}>Clase no disponible</div>;

  const content = cls.content;
  const doneCount = Object.keys(progress).length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'920px', margin:'0 auto', padding:'24px 20px' }}>
        <div className="anim-fade-up" style={{ marginBottom:'22px' }}>
          <button onClick={() => navigate(-1)} style={{ background:`${C.green}15`, border:`1px solid ${C.green}30`, borderRadius:'8px', padding:'6px 12px', cursor:'pointer', color:C.green, fontSize:'13px', fontWeight:600, marginBottom:'14px' }}>← Volver</button>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'24px', fontWeight:700, marginBottom:'6px' }}>{content.titulo}</h1>
          <p style={{ color:C.muted, fontSize:'13px', lineHeight:1.6 }}>{content.resumenBreve}</p>
          <div style={{ marginTop:'12px', display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ color:C.muted, fontSize:'12px' }}>{doneCount}/{STYLES.length} mundos explorados</span>
            <div style={{ flex:1, maxWidth:'200px' }}><ProgressBar value={doneCount} max={STYLES.length} color={C.green} /></div>
            {doneCount === STYLES.length && <span style={{ background:`${C.green}20`, border:`1px solid ${C.green}40`, borderRadius:'20px', padding:'3px 10px', color:C.green, fontSize:'11px', fontWeight:700 }}>🏆 Completado</span>}
          </div>
        </div>

        {/* Selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'8px', marginBottom:'26px' }}>
          {STYLES.map(s => (
            <button key={s.id} onClick={() => handleStyleChange(s.id)} style={{ background:styleId===s.id?s.soft:C.card, border:`1.5px solid ${styleId===s.id?s.color:C.border}`, borderRadius:'12px', padding:'10px 12px', cursor:'pointer', color:styleId===s.id?s.color:C.muted, fontSize:'12px', fontWeight:styleId===s.id?700:400, transition:'all .18s', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
              <span style={{ fontSize:'18px' }}>{s.emoji}</span>
              <span>{s.label}</span>
              {progress[s.id] && <span style={{ color:s.color, fontSize:'10px', fontWeight:800 }}>✓ Visto</span>}
            </button>
          ))}
        </div>

        <div className="anim-fade-up" key={styleId}>
          {styleId === 'lector'   && <LectorView   data={content.lector} />}
          {styleId === 'visual'   && <VisualView    data={content.visual} />}
          {styleId === 'auditivo' && <AudioView     data={content.auditivo} />}
          {styleId === 'quiz'     && <QuizView data={content.quiz} onScore={(s,t) => { const e={studentId:user.uid,classId,courseId:cls.courseId,schoolId,styleId:'quiz',score:s,totalQ:t}; saveProgress(e); setProgress(p=>({...p,quiz:e})); }} />}
          {styleId === 'practica' && <MisionesView  data={content.practica} />}
          {styleId === 'memoria'  && <MemoriaView   data={content.memoria} />}
        </div>
      </main>
    </div>
  );
}

// ── LECTURA ──────────────────────────────────────────────────────────────────
function LectorView({ data }) {
  if (!data) return null;
  const catColors = { concepto:C.accent, proceso:C.green, persona:C.amber, fecha:C.coral, ley:C.violet, formula:C.rose };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ padding:'24px' }}>
        <Section label="Introducción" color={C.accent} icon="📌" />
        <p style={{ color:C.text, lineHeight:1.8, fontSize:'14px' }}>{data.introduccion}</p>
      </Card>
      <Card style={{ padding:'24px' }}>
        <Section label="Desarrollo" color={C.accent} icon="📝" />
        {data.desarrollo?.split('\n\n').map((p,i) => <p key={i} style={{ color:C.text, lineHeight:1.85, fontSize:'14px', marginBottom:'16px' }}>{p}</p>)}
      </Card>
      {data.conceptosClave?.length > 0 && (
        <Card style={{ padding:'24px' }}>
          <Section label="Conceptos Clave" color={C.accent} icon="🔑" />
          <div style={{ display:'grid', gap:'12px' }}>
            {data.conceptosClave.map((c,i) => (
              <div key={i} style={{ background:C.accentSoft, borderRadius:'12px', padding:'15px 18px', borderLeft:`3px solid ${C.accent}` }}>
                <div style={{ fontWeight:700, color:C.accent, marginBottom:'6px', fontSize:'14px' }}>{c.termino}</div>
                <div style={{ color:C.text, fontSize:'13px', lineHeight:1.65 }}>{c.definicion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card style={{ padding:'24px' }}>
        <Section label="Conclusión" color={C.accent} icon="🎯" />
        <p style={{ color:C.text, lineHeight:1.8, fontSize:'14px' }}>{data.conclusion}</p>
      </Card>
      {data.paraSaber && (
        <Card style={{ background:`${C.amber}08`, borderColor:`${C.amber}30`, padding:'18px 24px' }}>
          <div style={{ fontWeight:700, color:C.amber, marginBottom:'8px' }}>💡 ¿Sabías que...?</div>
          <p style={{ color:C.text, fontSize:'13px', lineHeight:1.65 }}>{data.paraSaber}</p>
        </Card>
      )}
      {data.palabrasClave?.length > 0 && (
        <Card style={{ padding:'20px 24px' }}>
          <Section label="Vocabulario del tema" color={C.textSub} icon="🏷️" />
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {data.palabrasClave.map((kw,i) => {
              const col = catColors[kw.categoria] || C.accent;
              return (
                <span key={i} style={{ background:`${col}15`, border:`1px solid ${col}35`, borderRadius:'20px', padding:'5px 12px', fontSize:'12px', color:col, fontWeight:600 }}>
                  {kw.palabra}<span style={{ color:C.muted, fontWeight:400, marginLeft:'5px', fontSize:'10px' }}>{kw.categoria}</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}
      {data.temasRelacionados?.length > 0 && (
        <Card style={{ padding:'20px 24px', background:`${C.green}06`, borderColor:`${C.green}25` }}>
          <Section label="Temas relacionados" color={C.green} icon="🔗" />
          {data.temasRelacionados.map((t,i) => (
            <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'10px' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:C.green, flexShrink:0, marginTop:'5px' }} />
              <div><span style={{ fontWeight:700, color:C.green, fontSize:'13px' }}>{t.tema}</span><span style={{ color:C.muted, fontSize:'12px' }}> — {t.conexion}</span></div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── VISUAL ────────────────────────────────────────────────────────────────────
function VisualView({ data }) {
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      {data.mapaConceptual && (
        <Card style={{ padding:'24px' }}>
          <Section label="Mapa Conceptual" color={C.green} icon="🗺️" />
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{ display:'inline-block', background:`${C.green}20`, border:`2px solid ${C.green}50`, borderRadius:'14px', padding:'12px 24px', fontWeight:800, fontSize:'16px', color:C.green }}>{data.mapaConceptual.raiz}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'14px' }}>
            {data.mapaConceptual.ramas?.map((rama,i) => (
              <div key={i} style={{ border:`1.5px solid ${rama.color}40`, borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ background:`${rama.color}20`, padding:'10px 14px', fontWeight:700, fontSize:'13px', color:rama.color }}>{rama.titulo}</div>
                <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'7px' }}>
                  {rama.nodos?.map((nodo,j) => (
                    <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:rama.color, marginTop:'5px' }} />
                      <span style={{ color:C.text, fontSize:'12px', lineHeight:1.5 }}>{nodo}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {data.tablaComparativa && (
        <Card style={{ padding:'24px' }}>
          <Section label={data.tablaComparativa.titulo || 'Tabla Comparativa'} color={C.green} icon="📊" />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead><tr>{data.tablaComparativa.columnas?.map((col,i) => <th key={i} style={{ background:`${C.green}20`, color:C.green, fontWeight:700, padding:'10px 14px', textAlign:'left', border:`1px solid ${C.border}`, fontSize:'12px', textTransform:'uppercase' }}>{col}</th>)}</tr></thead>
              <tbody>{data.tablaComparativa.filas?.map((fila,i) => <tr key={i}>{fila.map((celda,j) => <td key={j} style={{ padding:'9px 14px', color:C.text, background:i%2===0?C.surface:C.card, border:`1px solid ${C.border}`, lineHeight:1.5 }}>{celda}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}
      {data.lineaTiempo?.length > 0 && (
        <Card style={{ padding:'24px' }}>
          <Section label="Línea de Tiempo" color={C.green} icon="⏳" />
          <div style={{ position:'relative', paddingLeft:'24px' }}>
            <div style={{ position:'absolute', left:'11px', top:0, bottom:0, width:'2px', background:`${C.green}30` }} />
            {data.lineaTiempo.map((item,i) => (
              <div key={i} style={{ position:'relative', marginBottom:'18px', paddingLeft:'20px' }}>
                <div style={{ position:'absolute', left:'-24px', width:'14px', height:'14px', borderRadius:'50%', background:C.green, border:`3px solid ${C.bg}`, top:'3px', zIndex:1 }} />
                <div style={{ fontWeight:700, color:C.green, fontSize:'13px', marginBottom:'4px' }}>{item.año}</div>
                <div style={{ color:C.text, fontSize:'13px', lineHeight:1.6 }}>{item.evento}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── AUDITIVO ──────────────────────────────────────────────────────────────────
function AudioView({ data }) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(1);
  const utterRef = useRef(null);
  if (!data) return null;

  const speak = () => {
    if (!('speechSynthesis' in window)) { alert('Tu navegador no soporta voz.'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(data.narracion);
    u.lang = 'es-CL'; u.rate = speed; u.pitch = 1.05;
    u.onend = () => { setPlaying(false); setDone(true); };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true); setDone(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ padding:'24px', background:`${C.amber}06`, borderColor:`${C.amber}25` }}>
        <Section label="Podcast del tema" color={C.amber} icon="🎙️" />
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', background:C.surface, borderRadius:'14px', padding:'16px 20px', marginBottom:'16px' }}>
          <div style={{ display:'flex', gap:'8px' }}>
            {!playing ? <Btn small color={C.amber} onClick={speak}>▶ {done?'Reiniciar':'Reproducir'}</Btn>
              : <Btn small color={C.amber} onClick={()=>{window.speechSynthesis.pause();setPlaying(false);}}>⏸ Pausar</Btn>}
            {playing && <Btn small outline color={C.muted} onClick={()=>{window.speechSynthesis.cancel();setPlaying(false);setDone(false);}}>⏹</Btn>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto' }}>
            <span style={{ fontSize:'12px', color:C.muted }}>Velocidad:</span>
            {[0.8,1,1.25,1.5].map(s => <button key={s} onClick={()=>setSpeed(s)} style={{ background:speed===s?`${C.amber}25`:C.surface, border:`1px solid ${speed===s?C.amber:C.border}`, borderRadius:'6px', padding:'4px 9px', cursor:'pointer', color:speed===s?C.amber:C.muted, fontSize:'12px', fontWeight:speed===s?700:400 }}>{s}×</button>)}
          </div>
        </div>
        {playing && <div style={{ display:'flex', alignItems:'center', gap:'8px', color:C.amber, fontSize:'13px' }}><div className="spinner" style={{ width:16, height:16, borderTopColor:C.amber }} />Reproduciendo...</div>}
        {done && <div style={{ color:C.green, fontSize:'13px', fontWeight:600 }}>✓ ¡Podcast completado!</div>}
      </Card>
      <Card style={{ padding:'24px' }}>
        <Section label="Guion completo" color={C.amber} icon="📜" />
        {data.narracion?.split('\n\n').map((p,i) => <p key={i} style={{ color:C.text, lineHeight:1.9, fontSize:'14px', marginBottom:'18px', fontFamily:"'Lora',serif" }}>{p}</p>)}
      </Card>
    </div>
  );
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
const TIPO_LABELS = {
  escenario:   { emoji:'🎬', label:'Escenario',   color:'#4f8ef7' },
  analogia:    { emoji:'🔀', label:'Analogía',    color:'#a78bfa' },
  concepto:    { emoji:'📚', label:'Concepto',    color:'#34d399' },
  aplicacion:  { emoji:'⚙️', label:'Aplicación', color:'#f97316' },
  causa_efecto:{ emoji:'🔗', label:'Causa-Efecto',color:'#fbbf24' },
  critico:     { emoji:'🧠', label:'Crítico',     color:'#fb7185' },
};
const DIFICULTAD_COLORS = { facil:'#34d399', media:'#fbbf24', dificil:'#ef4444' };

function QuizView({ data, onScore }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  if (!data?.preguntas) return null;
  const preguntas = data.preguntas;

  const handleSubmit = () => {
    let c = 0;
    preguntas.forEach(q => { if (answers[q.id] === q.correcta) c++; });
    setScore(c); setSubmitted(true);
    if (onScore) onScore(c, preguntas.length);
  };

  const pct = submitted ? Math.round(score/preguntas.length*100) : 0;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <Card style={{ background:`${C.coral}08`, borderColor:`${C.coral}25`, padding:'18px 22px', display:'flex', alignItems:'center', gap:'14px' }}>
        <span style={{ fontSize:'28px' }}>🎮</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, color:C.coral, marginBottom:'4px' }}>{data.instrucciones || '¡Demuestra lo que sabes!'}</div>
          <div style={{ color:C.muted, fontSize:'12px' }}>{preguntas.length} preguntas de tipos variados · Lee el contexto antes de responder</div>
        </div>
        {submitted && <div style={{ textAlign:'center' }}><div style={{ fontFamily:"'Lora',serif", fontSize:'28px', fontWeight:800, color:pct>=70?C.green:pct>=50?C.amber:C.red }}>{pct}%</div><div style={{ fontSize:'11px', color:C.muted }}>{score}/{preguntas.length}</div></div>}
      </Card>

      {submitted && (
        <Card style={{ textAlign:'center', padding:'24px', background:`${pct>=70?C.green:pct>=50?C.amber:C.red}10`, borderColor:`${pct>=70?C.green:pct>=50?C.amber:C.red}30` }}>
          <div style={{ fontSize:'44px', marginBottom:'10px' }}>{pct>=90?'🏆':pct>=70?'🌟':pct>=50?'👍':'💪'}</div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:'32px', fontWeight:700, color:pct>=70?C.green:pct>=50?C.amber:C.red }}>{pct}%</div>
          <div style={{ color:C.muted, fontSize:'14px', marginTop:'4px' }}>{score} de {preguntas.length} correctas</div>
          <div style={{ color:C.textSub, fontSize:'13px', marginTop:'8px' }}>{pct>=90?'¡Dominio absoluto!':pct>=70?'¡Excelente comprensión!':pct>=50?'¡Bien! Repasa lo que fallaste.':'Sigue estudiando, ¡tú puedes!'}</div>
          <Btn small outline color={C.coral} style={{ marginTop:'16px' }} onClick={() => { setAnswers({}); setSubmitted(false); }}>Intentar de nuevo</Btn>
        </Card>
      )}

      {preguntas.map((q, qi) => {
        const tipo = TIPO_LABELS[q.tipo] || TIPO_LABELS.concepto;
        const difColor = DIFICULTAD_COLORS[q.dificultad] || C.amber;
        const sel = answers[q.id];
        return (
          <Card key={q.id} style={{ padding:'20px', borderColor:submitted?(sel===q.correcta?`${C.green}50`:`${C.red}40`):C.border }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <span style={{ background:`${tipo.color}20`, border:`1px solid ${tipo.color}40`, borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700, color:tipo.color }}>{tipo.emoji} {tipo.label}</span>
              <span style={{ background:`${difColor}15`, borderRadius:'20px', padding:'3px 9px', fontSize:'10px', fontWeight:600, color:difColor }}>{q.dificultad}</span>
              <span style={{ marginLeft:'auto', color:C.muted, fontSize:'12px', fontWeight:700 }}>{qi+1}/{preguntas.length}</span>
            </div>
            {q.contexto && <div style={{ background:C.surface, borderRadius:'10px', padding:'12px 14px', marginBottom:'14px', borderLeft:`3px solid ${tipo.color}`, color:C.textSub, fontSize:'13px', lineHeight:1.65, fontStyle:'italic' }}>{q.contexto}</div>}
            <div style={{ fontWeight:700, fontSize:'14px', lineHeight:1.6, marginBottom:'14px' }}>{q.id}. {q.pregunta}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {q.opciones.map((op, j) => {
                const isSel = sel===j;
                const isCorrect = j===q.correcta;
                let bg=C.surface, border=C.border, color=C.text;
                if (!submitted) { if(isSel){bg=`${C.coral}18`;border=C.coral;color=C.coral;} }
                else { if(isCorrect){bg=`${C.green}18`;border=C.green;color=C.green;} else if(isSel){bg=`${C.red}12`;border=C.red;color=C.red;} else{bg='transparent';border=C.border;color=C.muted;} }
                return (
                  <button key={j} onClick={() => !submitted && setAnswers(a=>({...a,[q.id]:j}))} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:'10px', padding:'11px 15px', textAlign:'left', cursor:submitted?'default':'pointer', color, fontSize:'13px', fontWeight:isSel||isCorrect?600:400, transition:'all .15s', display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background:isCorrect&&submitted?C.green:isSel&&submitted&&!isCorrect?C.red:C.surface, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:C.bg }}>
                      {submitted?(isCorrect?'✓':isSel?'✗':String.fromCharCode(65+j)):String.fromCharCode(65+j)}
                    </span>
                    {op}
                  </button>
                );
              })}
            </div>
            {submitted && q.explicacion && <div style={{ marginTop:'14px', padding:'12px 15px', background:`${tipo.color}10`, borderRadius:'10px', color:C.text, fontSize:'13px', lineHeight:1.7, borderLeft:`3px solid ${tipo.color}` }}><strong style={{ color:tipo.color }}>💡 </strong>{q.explicacion}</div>}
          </Card>
        );
      })}
      {!submitted && <Btn full color={C.coral} onClick={handleSubmit} disabled={Object.keys(answers).length < preguntas.length}>Corregir ({Object.keys(answers).length}/{preguntas.length} respondidas)</Btn>}
    </div>
  );
}

// ── MISIONES ──────────────────────────────────────────────────────────────────
function MisionesView({ data }) {
  const [misionIdx, setMisionIdx] = useState(0);
  const [pasosCheck, setPasosCheck] = useState({});
  const [mostrar, setMostrar] = useState({});
  const [misionesOk, setMisionesOk] = useState({});
  const [xpTotal, setXpTotal] = useState(0);
  if (!data?.misiones) return null;
  const misiones = data.misiones;
  const m = misiones[misionIdx];

  const togglePaso = (mi, pi) => {
    const key = `${mi}-${pi}`;
    const next = { ...pasosCheck, [key]: !pasosCheck[key] };
    setPasosCheck(next);
    const total = misiones[mi].proceso?.length || 0;
    const done = misiones[mi].proceso?.filter((_, pj) => next[`${mi}-${pj}`]).length || 0;
    if (done === total && !misionesOk[mi]) {
      setMisionesOk(o => ({ ...o, [mi]: true }));
      setXpTotal(xp => xp + (misiones[mi].xp || 0));
    }
  };

  const completadas = Object.values(misionesOk).filter(Boolean).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ background:`${C.violet}08`, borderColor:`${C.violet}25`, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <div style={{ fontWeight:700, color:C.violet, fontSize:'16px', marginBottom:'4px' }}>🚀 {data.introduccion || 'Centro de Misiones'}</div>
            <div style={{ color:C.muted, fontSize:'12px' }}>{completadas}/{misiones.length} misiones completadas</div>
          </div>
          <div style={{ background:`${C.violet}20`, border:`1px solid ${C.violet}40`, borderRadius:'12px', padding:'10px 18px', textAlign:'center' }}>
            <div style={{ fontWeight:800, fontSize:'22px', color:C.violet }}>{xpTotal}</div>
            <div style={{ fontSize:'10px', color:C.muted, textTransform:'uppercase' }}>XP ganados</div>
          </div>
        </div>
      </Card>

      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
        {misiones.map((mis, i) => (
          <button key={i} onClick={() => setMisionIdx(i)} style={{ flex:1, minWidth:'140px', background:misionIdx===i?`${C.violet}20`:C.card, border:`1.5px solid ${misionIdx===i?C.violet:misionesOk[i]?C.green:C.border}`, borderRadius:'12px', padding:'12px', cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
            <div style={{ fontSize:'22px', marginBottom:'4px' }}>{mis.badge}</div>
            <div style={{ fontWeight:700, fontSize:'12px', color:misionIdx===i?C.violet:misionesOk[i]?C.green:C.text }}>{mis.dificultad}</div>
            <div style={{ fontSize:'11px', color:C.muted }}>{mis.xp} XP</div>
            {misionesOk[i] && <div style={{ marginTop:'4px', fontSize:'10px', color:C.green, fontWeight:700 }}>✓ COMPLETADA</div>}
          </button>
        ))}
      </div>

      <Card style={{ padding:'24px', borderColor:misionesOk[misionIdx]?`${C.green}50`:C.border }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'18px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <span style={{ fontSize:'24px' }}>{m.badge}</span>
              <span style={{ background:`${C.violet}20`, borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700, color:C.violet }}>{m.dificultad}</span>
              <span style={{ background:`${C.amber}15`, borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700, color:C.amber }}>⭐ {m.xp} XP</span>
            </div>
            <h3 style={{ fontFamily:"'Lora',serif", fontSize:'18px', fontWeight:700 }}>{m.titulo}</h3>
          </div>
          {misionesOk[misionIdx] && <div style={{ background:`${C.green}20`, border:`1px solid ${C.green}40`, borderRadius:'10px', padding:'8px 14px', color:C.green, fontWeight:700, fontSize:'13px' }}>✓ Completada</div>}
        </div>

        <div style={{ background:`${C.violet}08`, borderRadius:'12px', padding:'16px 18px', marginBottom:'18px', borderLeft:`3px solid ${C.violet}` }}>
          <div style={{ fontWeight:700, color:C.violet, fontSize:'12px', marginBottom:'6px', textTransform:'uppercase' }}>📖 Contexto de la misión</div>
          <p style={{ color:C.text, fontSize:'13px', lineHeight:1.75, fontStyle:'italic' }}>{m.narrativa}</p>
        </div>

        <div style={{ marginBottom:'18px' }}>
          <div style={{ fontWeight:700, color:C.text, fontSize:'13px', textTransform:'uppercase', marginBottom:'10px' }}>🎯 Tu misión:</div>
          <p style={{ color:C.text, fontSize:'14px', lineHeight:1.75 }}>{m.enunciado}</p>
        </div>

        {m.datos?.length > 0 && (
          <div style={{ background:C.surface, borderRadius:'10px', padding:'14px 16px', marginBottom:'18px' }}>
            <div style={{ fontWeight:700, fontSize:'12px', color:C.textSub, marginBottom:'8px', textTransform:'uppercase' }}>📋 Datos</div>
            {m.datos.map((d,j) => <div key={j} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 0', borderBottom:j<m.datos.length-1?`1px solid ${C.border}`:'none' }}><span style={{ color:C.accent }}>→</span><span style={{ color:C.text, fontSize:'13px' }}>{d}</span></div>)}
          </div>
        )}

        <div style={{ marginBottom:'20px' }}>
          <div style={{ fontWeight:700, fontSize:'13px', color:C.textSub, textTransform:'uppercase', marginBottom:'12px' }}>🗺️ Proceso</div>
          {m.proceso?.map((paso, pi) => {
            const checked = !!pasosCheck[`${misionIdx}-${pi}`];
            return (
              <div key={pi} style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                <button onClick={() => togglePaso(misionIdx, pi)} style={{ width:24, height:24, borderRadius:'6px', flexShrink:0, background:checked?C.green:C.surface, border:`2px solid ${checked?C.green:C.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', marginTop:'1px', transition:'all .15s', color:C.bg }}>
                  {checked && '✓'}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ color:checked?C.muted:C.text, fontSize:'13px', lineHeight:1.65, textDecoration:checked?'line-through':'none' }}><strong style={{ color:checked?C.muted:C.violet }}>Paso {paso.paso}:</strong> {paso.instruccion}</div>
                  <button onClick={() => setMostrar(s=>({...s,[`h${misionIdx}-${pi}`]:!s[`h${misionIdx}-${pi}`]}))} style={{ background:'none', border:'none', color:C.amber, cursor:'pointer', fontSize:'11px', fontWeight:600, marginTop:'5px', padding:0 }}>
                    {mostrar[`h${misionIdx}-${pi}`]?'▾ Ocultar pista':'▸ Ver pista'}
                  </button>
                  {mostrar[`h${misionIdx}-${pi}`] && <div style={{ marginTop:'6px', padding:'8px 12px', background:C.amberSoft, borderRadius:'8px', color:C.amber, fontSize:'12px' }}>💡 {paso.pista}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <Btn small outline color={C.violet} onClick={() => setMostrar(s=>({...s,[`sol${misionIdx}`]:!s[`sol${misionIdx}`]}))}>
          {mostrar[`sol${misionIdx}`]?'🔒 Ocultar solución':'🔓 Ver solución completa'}
        </Btn>
        {mostrar[`sol${misionIdx}`] && (
          <div style={{ marginTop:'14px', padding:'16px 18px', background:`${C.violet}10`, borderRadius:'12px', borderLeft:`3px solid ${C.violet}` }}>
            <div style={{ fontWeight:700, color:C.violet, marginBottom:'10px', fontSize:'13px' }}>✅ Solución:</div>
            <p style={{ color:C.text, fontSize:'13px', lineHeight:1.8 }}>{m.solucion}</p>
            {m.reflexion && <div style={{ marginTop:'12px', padding:'10px 14px', background:`${C.green}10`, borderRadius:'8px', color:C.green, fontSize:'12px' }}>🌱 <strong>Reflexión:</strong> {m.reflexion}</div>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── MEMORIA ───────────────────────────────────────────────────────────────────
function MemoriaView({ data }) {
  const [tab, setTab] = useState('flash');
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ background:`${C.rose}08`, borderColor:`${C.rose}25`, padding:'18px 22px' }}>
        <Section label="Juegos de Memoria" color={C.rose} icon="🧠" />
        <p style={{ color:C.muted, fontSize:'13px' }}>Tres formas de afianzar el conocimiento jugando.</p>
      </Card>
      <div style={{ display:'flex', gap:'8px' }}>
        {[{id:'flash',label:'🃏 Flashcards'},{id:'parejas',label:'🔗 Conectar'},{id:'completar',label:'✍️ Completar'}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:tab===t.id?`${C.rose}20`:C.card, border:`1.5px solid ${tab===t.id?C.rose:C.border}`, borderRadius:'12px', padding:'10px 8px', cursor:'pointer', color:tab===t.id?C.rose:C.muted, fontSize:'12px', fontWeight:tab===t.id?700:400 }}>{t.label}</button>
        ))}
      </div>
      {tab==='flash'    && <FlashCards    cards={data.flashCards} />}
      {tab==='parejas'  && <ParejaGame    pairs={data.parejas} />}
      {tab==='completar'&& <CompletarGame sentences={data.completar} />}
    </div>
  );
}

function FlashCards({ cards }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState({});
  if (!cards?.length) return null;
  const card = cards[idx];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px', alignItems:'center' }}>
      <div style={{ fontSize:'13px', color:C.muted }}>{idx+1}/{cards.length} — {Object.keys(done).length} dominadas</div>
      <div onClick={()=>setFlipped(f=>!f)} style={{ width:'100%', maxWidth:'480px', height:'220px', cursor:'pointer', perspective:'1000px' }}>
        <div style={{ width:'100%', height:'100%', position:'relative', transition:'transform .5s', transformStyle:'preserve-3d', transform:flipped?'rotateY(180deg)':'rotateY(0deg)' }}>
          <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden', background:C.card, border:`2px solid ${C.rose}40`, borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', textAlign:'center' }}>
            <span style={{ fontSize:'36px', marginBottom:'14px' }}>{card.emoji}</span>
            <div style={{ fontFamily:"'Lora',serif", fontSize:'17px', fontWeight:700, lineHeight:1.5 }}>{card.frente}</div>
            <div style={{ marginTop:'14px', fontSize:'11px', color:C.muted }}>Toca para revelar →</div>
          </div>
          <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden', background:`${C.rose}12`, border:`2px solid ${C.rose}60`, borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', textAlign:'center', transform:'rotateY(180deg)' }}>
            <div style={{ fontSize:'13px', color:C.rose, fontWeight:700, textTransform:'uppercase', marginBottom:'12px' }}>Respuesta</div>
            <div style={{ color:C.text, fontSize:'14px', lineHeight:1.7 }}>{card.reverso}</div>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
        <Btn small outline color={C.muted} disabled={idx===0} onClick={()=>{setFlipped(false);setIdx(i=>i-1);}}>← Anterior</Btn>
        {flipped && <>
          <Btn small color={C.green} onClick={()=>{setDone(d=>({...d,[idx]:true}));setFlipped(false);if(idx<cards.length-1)setIdx(i=>i+1);}}>✓ La sabía</Btn>
          <Btn small outline color={C.red} onClick={()=>{setFlipped(false);if(idx<cards.length-1)setIdx(i=>i+1);}}>✗ Repasar</Btn>
        </>}
        <Btn small outline color={C.muted} disabled={idx===cards.length-1} onClick={()=>{setFlipped(false);setIdx(i=>i+1);}}>Siguiente →</Btn>
      </div>
      {Object.keys(done).length===cards.length && <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:'12px', padding:'14px 20px', color:C.green, fontWeight:700, textAlign:'center' }}>🏆 ¡Dominaste todas las flashcards!</div>}
    </div>
  );
}

function ParejaGame({ pairs }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [leftItems] = useState(() => [...(pairs||[])].sort(()=>Math.random()-.5).map((p,i)=>({...p,id:`l${i}`,side:'left'})));
  const [rightItems] = useState(() => [...(pairs||[])].sort(()=>Math.random()-.5).map((p,i)=>({...p,id:`r${i}`,side:'right'})));
  if (!pairs?.length) return null;

  const handleClick = (item) => {
    if (matched[item.id]) return;
    if (!selected) { setSelected(item); return; }
    if (selected.id === item.id) { setSelected(null); return; }
    const a = selected, b = item;
    const isMatch = pairs.some(p => (p.izquierda===a.izquierda&&p.derecha===b.derecha)||(p.izquierda===b.izquierda&&p.derecha===a.derecha)||(p.izquierda===a.derecha&&p.derecha===b.izquierda)||(p.derecha===a.izquierda&&p.izquierda===b.derecha));
    const checkMatch = () => {
      const left = a.side==='left'?a:b; const right = a.side==='right'?a:b;
      return pairs.some(p => p.izquierda===left.izquierda && p.derecha===right.derecha);
    };
    if (checkMatch()) {
      setMatched(m=>({...m,[a.id]:true,[b.id]:true}));
      setSelected(null);
    } else {
      setWrong({a,b});
      setTimeout(()=>{setWrong(null);setSelected(null);},700);
    }
  };

  const matchedCount = Object.keys(matched).length/2;
  const getStyle = (item) => {
    if (matched[item.id]) return {bg:`${C.green}20`,border:C.green,color:C.green};
    if (wrong&&(wrong.a.id===item.id||wrong.b.id===item.id)) return {bg:`${C.red}15`,border:C.red,color:C.red};
    if (selected?.id===item.id) return {bg:`${C.rose}20`,border:C.rose,color:C.rose};
    return {bg:C.surface,border:C.border,color:C.text};
  };

  return (
    <Card style={{ padding:'22px' }}>
      <Section label={`Conectar — ${matchedCount}/${pairs.length} parejas`} color={C.rose} icon="🔗" />
      <p style={{ color:C.muted, fontSize:'12px', marginBottom:'16px' }}>Selecciona un elemento de cada columna para conectarlos.</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ fontWeight:700, fontSize:'11px', color:C.muted, textTransform:'uppercase', textAlign:'center', marginBottom:'4px' }}>Términos</div>
          {leftItems.map(item => { const {bg,border,color} = getStyle(item); return <button key={item.id} onClick={()=>handleClick(item)} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:'10px', padding:'10px 14px', cursor:'pointer', color, fontSize:'12px', fontWeight:600, lineHeight:1.5, textAlign:'center', transition:'all .15s', width:'100%' }}>{item.izquierda}</button>; })}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ fontWeight:700, fontSize:'11px', color:C.muted, textTransform:'uppercase', textAlign:'center', marginBottom:'4px' }}>Definiciones</div>
          {rightItems.map(item => { const {bg,border,color} = getStyle(item); return <button key={item.id} onClick={()=>handleClick(item)} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:'10px', padding:'10px 14px', cursor:'pointer', color, fontSize:'12px', fontWeight:600, lineHeight:1.5, textAlign:'center', transition:'all .15s', width:'100%' }}>{item.derecha}</button>; })}
        </div>
      </div>
      {matchedCount===pairs.length && <div style={{ marginTop:'16px', background:`${C.green}15`, borderRadius:'12px', padding:'14px', color:C.green, fontWeight:700, textAlign:'center' }}>🎉 ¡Perfecto! Conectaste todos los pares.</div>}
    </Card>
  );
}

function CompletarGame({ sentences }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  if (!sentences?.length) return null;
  return (
    <Card style={{ padding:'22px' }}>
      <Section label="Completar la oración" color={C.rose} icon="✍️" />
      <p style={{ color:C.muted, fontSize:'12px', marginBottom:'16px' }}>Elige la opción correcta para completar cada oración.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
        {sentences.map((s,i) => {
          const sel = answers[i];
          const ok = submitted[i] && sel===s.respuesta;
          const wrong = submitted[i] && sel!==s.respuesta;
          const parts = (s.oracion||'').split('[hueco]');
          return (
            <div key={i} style={{ background:C.surface, borderRadius:'12px', padding:'16px 18px', border:`1px solid ${ok?C.green:wrong?C.red:C.border}` }}>
              <div style={{ fontSize:'14px', color:C.text, lineHeight:2, marginBottom:'14px', fontFamily:"'Lora',serif" }}>
                {parts[0]}<span style={{ display:'inline-block', background:ok?`${C.green}20`:wrong?`${C.red}15`:`${C.rose}15`, border:`1.5px dashed ${ok?C.green:wrong?C.red:C.rose}`, borderRadius:'6px', padding:'2px 10px', margin:'0 4px', fontWeight:700, color:ok?C.green:wrong?C.red:C.rose }}>{sel||'___'}</span>{parts[1]}
              </div>
              {!submitted[i] && (
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
                  {s.opciones?.map((op,j) => <button key={j} onClick={()=>setAnswers(a=>({...a,[i]:op}))} style={{ background:answers[i]===op?`${C.rose}20`:C.card, border:`1px solid ${answers[i]===op?C.rose:C.border}`, borderRadius:'20px', padding:'5px 14px', cursor:'pointer', color:answers[i]===op?C.rose:C.muted, fontSize:'12px', fontWeight:answers[i]===op?700:400 }}>{op}</button>)}
                </div>
              )}
              {!submitted[i]&&sel&&<Btn small color={C.rose} onClick={()=>setSubmitted(s=>({...s,[i]:true}))}>Verificar</Btn>}
              {submitted[i]&&<div style={{ marginTop:'8px', padding:'8px 12px', borderRadius:'8px', background:ok?`${C.green}15`:`${C.red}10`, color:ok?C.green:C.red, fontSize:'12px', fontWeight:600 }}>{ok?'✓ ¡Correcto!': `✗ Era: "${s.respuesta}"`}</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}