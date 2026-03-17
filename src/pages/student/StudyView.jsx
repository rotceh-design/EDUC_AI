// src/pages/student/StudyView.jsx — educ_AI v4.0 CYBERPUNK NEUROEDUCATIVO
// Módulos: Lectura (párrafos+dudas), Visual (constelación viva), Audio (karaoke glow),
//          Quiz (warm-up + motivador), Práctica (terminal RPG), Memoria (zen partículas)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, Icons } from '@/theme';
import { Card, Btn, Spinner, ProgressBar } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getClass, saveProgress, getProgressByStudent } from '@/services/db';

// ── KEYFRAMES GLOBALES ────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('sv-styles')) return;
  const s = document.createElement('style');
  s.id = 'sv-styles';
  s.textContent = `
    @keyframes svPulse {0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.6)} 50%{box-shadow:0 0 0 14px rgba(16,185,129,0)}}
    @keyframes svGlow  {0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)}}
    @keyframes svBoom  {0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1}}
    @keyframes svType  {from{width:0} to{width:100%}}
    @keyframes svBlink {0%,100%{border-color:transparent} 50%{border-color:var(--sv-cursor,#38bdf8)}}
    @keyframes svFloat {0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)}}
    @keyframes svParticle {0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
    @keyframes svSlideIn {from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}}
    @keyframes svSentence{0%{background-size:0% 100%} 100%{background-size:100% 100%}}
    .sv-node:hover .sv-node-detail{opacity:1;transform:translateY(0) scale(1)}
    .sv-node-detail{opacity:0;transform:translateY(8px) scale(0.95);transition:all .25s cubic-bezier(.16,1,.3,1)}
    .sv-constellation-pulse{animation:svGlow 2.5s ease-in-out infinite}
    .sv-slide-in{animation:svSlideIn .35s cubic-bezier(.16,1,.3,1) both}
  `;
  document.head.appendChild(s);
};

function SecHeader({ label, color, icon }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', fontWeight:700,
      fontSize:'11px', color, textTransform:'uppercase', letterSpacing:'.08em',
      marginBottom:'16px', paddingBottom:'8px', borderBottom:`1px solid ${color}30` }}>
      {icon && <span style={{ fontSize:'14px' }}>{icon}</span>}{label}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function StudyView() {
  const { classId } = useParams();
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [styleId, setStyleId] = useState('lector');
  const [progress, setProgress] = useState({});

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([
          getClass(classId), getProgressByStudent(user.uid, schoolId),
        ]);
        setCls(c);
        const map = {};
        (p || []).filter(x => x.classId === classId).forEach(x => { map[x.styleId] = x; });
        setProgress(map);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [classId]);

  const recordView = useCallback(async (sid) => {
    if (!cls || progress[sid]) return;
    const entry = { studentId:user.uid, classId, courseId:cls.courseId, schoolId, styleId:sid, score:null, totalQ:null };
    await saveProgress(entry);
    setProgress(p => ({ ...p, [sid]: entry }));
  }, [cls, progress, classId, schoolId, user.uid]);

  const handleStyleChange = (sid) => { setStyleId(sid); recordView(sid); };
  useEffect(() => { if (cls) recordView('lector'); }, [cls]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner size={44} />
    </div>
  );
  if (!cls?.content) return (
    <div style={{ padding:'60px', textAlign:'center', color:C.muted }}>Misión no disponible</div>
  );

  const content   = cls.content;
  const doneCount = Object.keys(progress).length;
  const total     = STYLES.length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'940px', margin:'0 auto', padding:'28px 20px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom:'24px' }}>
          <button onClick={() => navigate(-1)} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${C.green}15`, border:`1px solid ${C.green}30`, borderRadius:'8px', padding:'7px 14px', cursor:'pointer', color:C.green, fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>
            ← Volver al curso
          </button>
          <h2 style={{ fontSize:'22px', fontWeight:800, marginBottom:'6px', letterSpacing:'-0.01em' }}>
            {content.titulo}
          </h2>
          <p style={{ color:C.textSub, fontSize:'13px', lineHeight:1.6, maxWidth:'640px' }}>
            {content.resumenBreve}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'14px' }}>
            <span style={{ color:C.muted, fontSize:'12px' }}>{doneCount}/{total} mundos</span>
            <div style={{ flex:1, maxWidth:'220px' }}>
              <ProgressBar value={doneCount} max={total} color={C.green} />
            </div>
            {doneCount === total && (
              <span style={{ background:`${C.green}20`, border:`1px solid ${C.green}40`, borderRadius:'20px', padding:'4px 12px', color:C.green, fontSize:'11px', fontWeight:800 }}>
                🏆 COMPLETADO
              </span>
            )}
          </div>
        </div>

        {/* ── Selector de módulos ─────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${total}, 1fr)`, gap:'8px', marginBottom:'28px' }}>
          {STYLES.map(s => {
            const active = styleId === s.id;
            return (
              <button key={s.id} onClick={() => handleStyleChange(s.id)} style={{
                background: active ? s.soft : C.card,
                border: `1.5px solid ${active ? s.color : C.border}`,
                borderRadius:'12px', padding:'10px 6px', cursor:'pointer',
                color: active ? s.color : C.muted, fontSize:'11px', fontWeight: active ? 700 : 400,
                transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
                boxShadow: active ? `0 0 16px ${s.color}30` : 'none',
              }}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', color: active ? s.color : C.muted }}>{s.icon}</span>
                <span>{s.label}</span>
                {progress[s.id] && <span style={{ color:s.color, fontSize:'9px', fontWeight:800 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* ── Vista activa ───────────────────────────────────────────────── */}
        <div className="sv-slide-in" key={styleId}>
          {styleId === 'lector'   && <LectorView   data={content.lector} />}
          {styleId === 'visual'   && <VisualView    data={content.visual} />}
          {styleId === 'auditivo' && <AudioView     data={content.auditivo} />}
          {styleId === 'quiz'     && (
            <QuizView data={content.quiz} onScore={(sc, tot) => {
              const e = { studentId:user.uid, classId, courseId:cls.courseId, schoolId, styleId:'quiz', score:sc, totalQ:tot };
              saveProgress(e);
              setProgress(p => ({ ...p, quiz:e }));
            }} />
          )}
          {styleId === 'practica' && <PracticaView  data={content.practica} />}
          {styleId === 'memoria'  && <MemoriaView   data={content.memoria} />}
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. LECTOR — Tarjetas de párrafo + DudaInteractiva
// ══════════════════════════════════════════════════════════════════════════════
function DudaInteractiva({ duda }) {
  const [open, setOpen] = useState(false);
  if (!duda?.pregunta) return null;
  return (
    <div style={{ marginTop:'14px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display:'inline-flex', alignItems:'center', gap:'7px',
          background: open ? `${C.amber}20` : `${C.amber}10`,
          border: `1px solid ${C.amber}${open?'60':'30'}`,
          borderRadius:'20px', padding:'7px 14px', cursor:'pointer',
          color:C.amber, fontSize:'12px', fontWeight:700, transition:'all .2s' }}>
        <span style={{ fontSize:'14px' }}>🤔</span>
        {open ? 'Cerrar explicación' : duda.pregunta}
      </button>
      {open && (
        <div className="sv-slide-in" style={{ marginTop:'10px', padding:'16px 18px',
          background:`${C.amber}08`, border:`1px solid ${C.amber}25`, borderRadius:'14px',
          borderLeft:`3px solid ${C.amber}` }}>
          <div style={{ fontWeight:700, color:C.amber, fontSize:'12px', marginBottom:'8px' }}>
            💬 Explicación amigable
          </div>
          <p style={{ color:C.text, fontSize:'13px', lineHeight:1.75 }}>{duda.respuesta}</p>
        </div>
      )}
    </div>
  );
}

function ParagraphCard({ parrafo, index }) {
  const [revealed, setRevealed] = useState(index === 0);
  if (!parrafo?.texto) return null;
  return (
    <div style={{ marginBottom:'12px' }}>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          style={{ width:'100%', background:C.surface, border:`1.5px dashed ${C.border}`,
            borderRadius:'12px', padding:'16px 20px', cursor:'pointer', color:C.muted,
            fontSize:'13px', textAlign:'left', transition:'all .2s',
            display:'flex', alignItems:'center', gap:'10px' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <span style={{ fontSize:'18px' }}>▶</span>
          <span>Descubrir siguiente sección...</span>
        </button>
      ) : (
        <div className="sv-slide-in" style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:'14px', padding:'20px 22px' }}>
          <p style={{ color:C.text, lineHeight:1.85, fontSize:'14px', marginBottom:0 }}>
            {parrafo.texto}
          </p>
          <DudaInteractiva duda={parrafo.duda} />
        </div>
      )}
    </div>
  );
}

function LectorView({ data }) {
  if (!data) return null;
  const catColors = { concepto:C.accent, proceso:C.green, persona:C.amber, fecha:C.coral, ley:C.violet, formula:C.pink };
  const parrafos = Array.isArray(data.parrafos) && data.parrafos.length > 0
    ? data.parrafos
    : (data.desarrollo ? data.desarrollo.split('\n\n').map(t => ({ texto:t, duda:null })) : []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      {/* Intro */}
      <Card style={{ padding:'24px', background:`${C.accent}06`, borderColor:`${C.accent}25` }}>
        <SecHeader label="Introducción" color={C.accent} icon="📌" />
        <p style={{ color:C.text, lineHeight:1.85, fontSize:'14px' }}>{data.introduccion}</p>
      </Card>

      {/* Párrafos revelables */}
      <Card style={{ padding:'24px' }}>
        <SecHeader label="Desarrollo — descubre a tu ritmo" color={C.accent} icon="📖" />
        {parrafos.map((p, i) => <ParagraphCard key={i} parrafo={p} index={i} />)}
      </Card>

      {/* Conceptos clave */}
      {Array.isArray(data.conceptosClave) && data.conceptosClave.length > 0 && (
        <Card style={{ padding:'24px' }}>
          <SecHeader label="Conceptos Clave" color={C.accent} icon="🔑" />
          <div style={{ display:'grid', gap:'10px' }}>
            {data.conceptosClave.map((c, i) => (
              <div key={i} style={{ background:C.accentSoft, borderRadius:'12px',
                padding:'14px 18px', borderLeft:`3px solid ${C.accent}` }}>
                <div style={{ fontWeight:700, color:C.accent, marginBottom:'6px', fontSize:'14px' }}>
                  {c.termino}
                </div>
                <div style={{ color:C.text, fontSize:'13px', lineHeight:1.65 }}>{c.definicion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Conclusión */}
      <Card style={{ padding:'24px' }}>
        <SecHeader label="Conclusión" color={C.accent} icon="🎯" />
        <p style={{ color:C.text, lineHeight:1.85, fontSize:'14px' }}>{data.conclusion}</p>
      </Card>

      {/* ¿Sabías que? */}
      {data.paraSaber && (
        <Card style={{ background:`${C.amber}08`, borderColor:`${C.amber}30`, padding:'18px 24px' }}>
          <div style={{ fontWeight:700, color:C.amber, marginBottom:'8px' }}>💡 ¿Sabías que...?</div>
          <p style={{ color:C.text, fontSize:'13px', lineHeight:1.65 }}>{data.paraSaber}</p>
        </Card>
      )}

      {/* Vocabulario */}
      {Array.isArray(data.palabrasClave) && data.palabrasClave.length > 0 && (
        <Card style={{ padding:'20px 24px' }}>
          <SecHeader label="Vocabulario del tema" color={C.textSub} icon="🏷️" />
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {data.palabrasClave.map((kw, i) => {
              const col = catColors[kw.categoria] || C.accent;
              return (
                <span key={i} style={{ background:`${col}15`, border:`1px solid ${col}35`,
                  borderRadius:'20px', padding:'5px 12px', fontSize:'12px', color:col, fontWeight:600 }}>
                  {kw.palabra}
                  <span style={{ color:C.muted, fontWeight:400, marginLeft:'5px', fontSize:'10px' }}>{kw.categoria}</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. VISUAL — Constelación viva + tabla blindada + línea de tiempo
// ══════════════════════════════════════════════════════════════════════════════
function VisualView({ data }) {
  if (!data) return null;
  
  // Blindaje general de Arrays para el módulo visual
  const ramasData = Array.isArray(data.mapaConceptual?.ramas) ? data.mapaConceptual.ramas : [];
  const columnasTabla = Array.isArray(data.tablaComparativa?.columnas) ? data.tablaComparativa.columnas : [];
  const filasTabla = Array.isArray(data.tablaComparativa?.filas) ? data.tablaComparativa.filas : [];
  const lineaTiempo = Array.isArray(data.lineaTiempo) ? data.lineaTiempo : [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      {/* Mapa Constelación */}
      {data.mapaConceptual && (
        <Card style={{ padding:'28px' }}>
          <SecHeader label="Mapa Constelación" color={C.green} icon="🌌" />

          {/* Nodo central */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'28px' }}>
            <div className="sv-constellation-pulse" style={{ background:`linear-gradient(135deg, ${C.green}, #00ff7f)`,
              borderRadius:'16px', padding:'16px 28px', fontWeight:800, fontSize:'16px',
              color:'#000', boxShadow:`0 0 30px ${C.green}60`, letterSpacing:'.02em' }}>
              {data.mapaConceptual.raiz || 'Tema Central'}
            </div>
          </div>

          {/* Ramas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:'16px' }}>
            {ramasData.map((rama, ri) => {
              const subNodos = Array.isArray(rama.nodos) ? rama.nodos : [];
              return (
                <div key={ri} className="sv-node" style={{ border:`1.5px solid ${rama.color || C.green}50`,
                  borderRadius:'14px', overflow:'visible', position:'relative',
                  transition:'all .25s', cursor:'default' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = `0 0 20px ${rama.color || C.green}40`;
                    e.currentTarget.style.borderColor = rama.color || C.green;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = `${rama.color || C.green}50`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                  <div style={{ background:`${rama.color || C.green}25`, padding:'12px 16px',
                    fontWeight:700, fontSize:'13px', color:rama.color || C.green,
                    display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:rama.color || C.green,
                      boxShadow:`0 0 8px ${rama.color || C.green}`, flexShrink:0, animation:'svGlow 2s ease-in-out infinite' }} />
                    {rama.titulo}
                  </div>
                  <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    {subNodos.map((nodo, ni) => (
                      <div key={ni} style={{ display:'flex', alignItems:'flex-start', gap:'8px',
                        padding:'7px 10px', background:C.surface, borderRadius:'8px',
                        border:`1px solid ${C.border}`, transition:'all .2s' }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0,
                          background:rama.color || C.green, marginTop:'5px' }} />
                        <span style={{ color:C.text, fontSize:'12px', lineHeight:1.5 }}>{String(nodo)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Línea conector al centro */}
                  <div style={{ position:'absolute', top:'-14px', left:'50%', width:'2px', height:'14px',
                    background:`linear-gradient(to top, ${rama.color || C.green}60, transparent)`, transform:'translateX(-50%)' }} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabla comparativa blindada contra errores de IA */}
      {data.tablaComparativa && filasTabla.length > 0 && (
        <Card style={{ padding:'24px' }}>
          <SecHeader label={data.tablaComparativa.titulo || 'Tabla Comparativa'} color={C.green} icon="📊" />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr>
                  {columnasTabla.map((col, i) => (
                    <th key={i} style={{ background:`${C.green}20`, color:C.green, fontWeight:700,
                      padding:'10px 16px', textAlign:'left', border:`1px solid ${C.border}`,
                      fontSize:'12px', textTransform:'uppercase', letterSpacing:'.04em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasTabla.map((fila, i) => {
                  // BLINDAJE: Si la IA envía un objeto en vez de array, extraemos los valores.
                  const celdas = Array.isArray(fila) ? fila : (typeof fila === 'object' && fila !== null ? Object.values(fila) : [fila]);
                  return (
                    <tr key={i}>
                      {celdas.map((celda, j) => (
                        <td key={j} style={{ padding:'10px 16px', color:j===0?C.text:C.textSub,
                          background: i%2===0 ? C.surface : C.card,
                          border:`1px solid ${C.border}`, lineHeight:1.55,
                          fontWeight: j===0 ? 600 : 400 }}>
                          {String(celda)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Línea de tiempo */}
      {lineaTiempo.length > 0 && (
        <Card style={{ padding:'24px' }}>
          <SecHeader label="Línea de Tiempo" color={C.green} icon="⏳" />
          <div style={{ position:'relative', paddingLeft:'28px' }}>
            <div style={{ position:'absolute', left:'12px', top:0, bottom:0, width:'2px',
              background:`linear-gradient(to bottom, ${C.green}, ${C.green}20)` }} />
            {lineaTiempo.map((item, i) => (
              <div key={i} style={{ position:'relative', marginBottom:'22px', paddingLeft:'20px' }}>
                <div style={{ position:'absolute', left:'-28px', width:'16px', height:'16px',
                  borderRadius:'50%', background:C.green, border:`3px solid ${C.bg}`,
                  top:'3px', zIndex:1, boxShadow:`0 0 10px ${C.green}60` }} />
                <div style={{ fontWeight:800, color:C.green, fontSize:'13px', marginBottom:'5px' }}>
                  {item.año}
                </div>
                <div style={{ color:C.text, fontSize:'13px', lineHeight:1.65,
                  background:C.surface, borderRadius:'10px', padding:'10px 14px',
                  border:`1px solid ${C.border}` }}>
                  {item.evento}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. AUDITIVO — Karaoke con oración glow + velocidad + controles
// ══════════════════════════════════════════════════════════════════════════════
function AudioView({ data }) {
  const [playing,    setPlaying]    = useState(false);
  const [paused,     setPaused]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [speed,      setSpeed]      = useState(1.0);
  const [activeSent, setActiveSent] = useState(-1);
  const utterRef = useRef(null);
  if (!data?.narracion) return null;

  const sentences = data.narracion
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 5)
    .map(s => s.trim());

  const speak = () => {
    if (!('speechSynthesis' in window)) { alert('Tu navegador no soporta síntesis de voz.'); return; }
    window.speechSynthesis.cancel();
    setActiveSent(0); setDone(false); setPaused(false);

    sentences.forEach((sent, idx) => {
      const u = new SpeechSynthesisUtterance(sent);
      u.lang = 'es-CL'; u.rate = speed; u.pitch = 1.05;
      u.onstart = () => setActiveSent(idx);
      u.onend   = () => { if (idx === sentences.length - 1) { setPlaying(false); setDone(true); setActiveSent(-1); } };
      window.speechSynthesis.speak(u);
    });
    setPlaying(true);
  };

  const pause = () => { window.speechSynthesis.pause(); setPlaying(false); setPaused(true); };
  const resume = () => { window.speechSynthesis.resume(); setPlaying(true); setPaused(false); };
  const stop = () => { window.speechSynthesis.cancel(); setPlaying(false); setPaused(false); setDone(false); setActiveSent(-1); };

  const paragraphs = data.narracion.split('\n\n').filter(Boolean);
  let sentIdx = 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      {/* Player */}
      <Card style={{ padding:'24px', background:`${C.amber}06`, borderColor:`${C.amber}25` }}>
        <SecHeader label="Podcast Narrado — Karaoke Guiado" color={C.amber} icon="🎙️" />

        <div style={{ background:C.surface, borderRadius:'16px', padding:'18px 22px', marginBottom:'16px' }}>
          {/* Controles principales */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'14px' }}>
            {!playing && !paused && (
              <Btn small color={C.amber} onClick={speak}>▶ {done?'Reiniciar':'Reproducir'}</Btn>
            )}
            {playing && <Btn small color={C.amber} onClick={pause}>⏸ Pausar</Btn>}
            {paused  && <Btn small color={C.amber} onClick={resume}>▶ Continuar</Btn>}
            {(playing || paused || done) && (
              <Btn small outline color={C.muted} onClick={stop}>⏹ Detener</Btn>
            )}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'11px', color:C.muted }}>Velocidad:</span>
              {[{ v:0.75, label:'🐢 Lento' }, { v:1.0, label:'▶ Normal' }, { v:1.25, label:'⚡ Rápido' }].map(opt => (
                <button key={opt.v} onClick={() => setSpeed(opt.v)} style={{
                  background: speed===opt.v ? `${C.amber}25` : C.card,
                  border:`1px solid ${speed===opt.v ? C.amber : C.border}`,
                  borderRadius:'8px', padding:'5px 10px', cursor:'pointer',
                  color:speed===opt.v?C.amber:C.muted, fontSize:'11px', fontWeight:speed===opt.v?700:400 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          {playing && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', color:C.amber, fontSize:'12px' }}>
              <div className="spinner" style={{ width:14, height:14, borderTopColor:C.amber }} />
              Reproduciendo a {speed}× velocidad...
            </div>
          )}
          {paused && <div style={{ color:C.muted, fontSize:'12px' }}>⏸ Pausado — presiona Continuar para seguir</div>}
          {done   && <div style={{ color:C.green, fontSize:'12px', fontWeight:700 }}>✓ ¡Narración completada!</div>}
        </div>
      </Card>

      {/* Texto con karaoke glow por oración */}
      <Card style={{ padding:'24px' }}>
        <SecHeader label="Texto de la narración" color={C.amber} icon="📜" />
        {paragraphs.map((para, pi) => {
          const paraWords = para.trim();
          return (
            <p key={pi} style={{ lineHeight:1.9, fontSize:'14px', marginBottom:'20px', fontFamily:"'Lora',serif" }}>
              {sentences
                .filter(s => paraWords.includes(s.substring(0, Math.min(30, s.length))))
                .map((sent, si) => {
                  const isActive = activeSent === sentIdx;
                  const key = `${pi}-${si}-${sentIdx}`;
                  sentIdx++;
                  return (
                    <span key={key} style={{
                      transition: 'all .4s ease',
                      background: isActive ? `${C.amber}30` : 'transparent',
                      boxShadow:  isActive ? `0 0 0 3px ${C.amber}20` : 'none',
                      borderRadius: isActive ? '6px' : '0',
                      color: isActive ? C.amber : C.text,
                      fontWeight: isActive ? 700 : 400,
                      padding: isActive ? '0 4px' : '0',
                      marginRight:'3px',
                    }}>
                      {sent}{' '}
                    </span>
                  );
                })}
              {/* fallback si la segmentación falla */}
              {sentences.filter(s => paraWords.includes(s.substring(0, Math.min(30, s.length)))).length === 0 && (
                <span style={{ color:C.text }}>{paraWords}</span>
              )}
            </p>
          );
        })}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. QUIZ — Warm-up screen + cartas de trivia + motivador en fallo
// ══════════════════════════════════════════════════════════════════════════════
const TIPO_LABELS = {
  escenario:   { emoji:'🎬', label:'Escenario',    color:'#38bdf8' },
  analogia:    { emoji:'🔀', label:'Analogía',     color:'#a78bfa' },
  concepto:    { emoji:'📚', label:'Concepto',     color:'#10b981' },
  aplicacion:  { emoji:'⚙️', label:'Aplicación',  color:'#f97316' },
  causa_efecto:{ emoji:'🔗', label:'Causa-Efecto', color:'#fbbf24' },
  critico:     { emoji:'🧠', label:'Crítico',      color:'#d946ef' },
};

function QuizView({ data, onScore }) {
  const [phase,     setPhase]     = useState('warmup'); // 'warmup' | 'playing' | 'results'
  const [answers,   setAnswers]   = useState({});
  const [score,     setScore]     = useState(0);
  const [failHints, setFailHints] = useState({});

  if (!data?.preguntas || !Array.isArray(data.preguntas)) return null;
  const preguntas = data.preguntas;
  const warmup    = data.warmup || {};

  const handleSubmit = () => {
    let c = 0;
    const hints = {};
    preguntas.forEach(q => {
      if (answers[q.id] === q.correcta) { c++; }
      else { hints[q.id] = true; }
    });
    setScore(c); setFailHints(hints); setPhase('results');
    if (onScore) onScore(c, preguntas.length);
  };

  const pct = phase === 'results' ? Math.round(score / preguntas.length * 100) : 0;

  // ── WARM-UP ──
  if (phase === 'warmup') return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <Card style={{ padding:'32px', textAlign:'center', background:`${C.coral}08`, borderColor:`${C.coral}30` }}>
        <div style={{ fontSize:'56px', marginBottom:'16px', animation:'svFloat 3s ease-in-out infinite' }}>🎯</div>
        <h3 style={{ fontFamily:"'Lora',serif", fontSize:'22px', fontWeight:700, color:C.coral, marginBottom:'12px' }}>
          {warmup.titulo || '¡Prepara tu mente!'}
        </h3>
        {warmup.acertijo && (
          <div style={{ background:`${C.violet}10`, border:`1px solid ${C.violet}30`, borderRadius:'14px',
            padding:'18px 24px', marginBottom:'16px', textAlign:'left', maxWidth:'560px', margin:'0 auto 16px' }}>
            <div style={{ fontWeight:700, color:C.violet, fontSize:'12px', textTransform:'uppercase', marginBottom:'8px' }}>
              🔮 Acertijo
            </div>
            <p style={{ color:C.text, fontSize:'14px', lineHeight:1.75 }}>{warmup.acertijo}</p>
          </div>
        )}
        {warmup.datoFun && (
          <div style={{ background:`${C.amber}10`, border:`1px solid ${C.amber}25`, borderRadius:'12px',
            padding:'14px 20px', marginBottom:'20px', maxWidth:'560px', margin:'0 auto 20px' }}>
            <span style={{ fontWeight:700, color:C.amber }}>💥 </span>
            <span style={{ color:C.text, fontSize:'13px', lineHeight:1.65 }}>{warmup.datoFun}</span>
          </div>
        )}
        <p style={{ color:C.textSub, fontSize:'14px', marginBottom:'24px', maxWidth:'440px', margin:'0 auto 24px' }}>
          {warmup.desafio || 'Ahora demuestra todo lo que has aprendido.'}
        </p>
        <Btn color={C.coral} size="lg" onClick={() => setPhase('playing')}
          style={{ fontSize:'14px', padding:'14px 32px' }}>
          🚀 Comenzar el Quiz ({preguntas.length} preguntas)
        </Btn>
      </Card>
    </div>
  );

  // ── RESULTS ──
  const ResultsView = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <Card style={{ textAlign:'center', padding:'28px',
        background:`${pct>=70?C.green:pct>=50?C.amber:C.coral}10`,
        borderColor:`${pct>=70?C.green:pct>=50?C.amber:C.coral}40` }}>
        <div style={{ fontSize:'52px', marginBottom:'12px', animation:'svBoom .5s ease' }}>
          {pct>=90?'🏆':pct>=70?'🌟':pct>=50?'👍':'💪'}
        </div>
        <div style={{ fontFamily:"'Lora',serif", fontSize:'40px', fontWeight:700,
          color:pct>=70?C.green:pct>=50?C.amber:C.coral }}>{pct}%</div>
        <div style={{ color:C.muted, fontSize:'14px', marginTop:'6px' }}>{score} de {preguntas.length} correctas</div>
        <div style={{ color:C.textSub, fontSize:'13px', marginTop:'10px', maxWidth:'380px', margin:'10px auto 0' }}>
          {pct>=90?'¡Dominio absoluto! Eres un experto en este tema.'
          :pct>=70?'¡Excelente comprensión del tema!'
          :pct>=50?'¡Buen intento! Repasa los conceptos que te fallaron.'
          :'No te rindas. Cada intento te hace más fuerte.'}
        </div>
        <Btn small outline color={C.coral} style={{ marginTop:'18px' }}
          onClick={() => { setAnswers({}); setFailHints({}); setPhase('warmup'); }}>
          Reintentar
        </Btn>
      </Card>

      {preguntas.map(q => {
        const sel       = answers[q.id];
        const isCorrect = sel === q.correcta;
        const tipo      = TIPO_LABELS[q.tipo] || TIPO_LABELS.concepto;
        return (
          <Card key={q.id} style={{ padding:'20px',
            borderColor: isCorrect ? `${C.green}50` : `${C.coral}40` }}>
            <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'10px', flexWrap:'wrap' }}>
              <span style={{ background:`${tipo.color}20`, border:`1px solid ${tipo.color}40`,
                borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700, color:tipo.color }}>
                {tipo.emoji} {tipo.label}
              </span>
              <span style={{ marginLeft:'auto', fontSize:'12px', fontWeight:800,
                color:isCorrect?C.green:C.coral }}>
                {isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
              </span>
            </div>
            {q.contexto && (
              <div style={{ background:C.surface, borderRadius:'8px', padding:'10px 14px',
                marginBottom:'10px', color:C.textSub, fontSize:'12px', lineHeight:1.65,
                fontStyle:'italic', borderLeft:`3px solid ${tipo.color}` }}>
                {q.contexto}
              </div>
            )}
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'12px' }}>{q.pregunta}</div>
            {(q.opciones || []).map((op, j) => {
              const isRight = j === q.correcta;
              const isSel   = j === sel;
              let bg='transparent', brd=C.border, col=C.muted;
              if (isRight) { bg=`${C.green}18`; brd=C.green; col=C.green; }
              else if (isSel) { bg=`${C.coral}12`; brd=C.coral; col=C.coral; }
              return (
                <div key={j} style={{ padding:'8px 14px', borderRadius:'8px', marginBottom:'5px',
                  background:bg, color:col, fontWeight:isRight||isSel?600:400,
                  border:`1px solid ${brd}`, fontSize:'13px' }}>
                  {isRight?'✓ ':isSel&&!isRight?'✗ ':''}{op}
                </div>
              );
            })}
            {/* Motivador en fallo */}
            {!isCorrect && q.mensajeMotivador && (
              <div style={{ marginTop:'12px', padding:'12px 16px',
                background:`${C.amber}10`, borderRadius:'10px', color:C.amber,
                fontSize:'13px', fontWeight:600, borderLeft:`3px solid ${C.amber}` }}>
                ⚡ {q.mensajeMotivador}
              </div>
            )}
            {/* Pista visible en fallo */}
            {!isCorrect && q.pista && (
              <div style={{ marginTop:'8px', padding:'10px 14px', background:C.accentSoft,
                borderRadius:'8px', color:C.accent, fontSize:'12px' }}>
                💡 {q.pista}
              </div>
            )}
            {/* Explicación */}
            <div style={{ marginTop:'8px', padding:'10px 14px', background:`${tipo.color}10`,
              borderRadius:'8px', color:C.text, fontSize:'12px', lineHeight:1.7,
              borderLeft:`3px solid ${tipo.color}` }}>
              <strong style={{ color:tipo.color }}>Explicación: </strong>{q.explicacion}
            </div>
          </Card>
        );
      })}
    </div>
  );

  if (phase === 'results') return <ResultsView />;

  // ── PLAYING ──
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <Card style={{ background:`${C.coral}08`, borderColor:`${C.coral}25`, padding:'16px 22px',
        display:'flex', alignItems:'center', gap:'14px' }}>
        <span style={{ fontSize:'26px' }}>🎮</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, color:C.coral }}>
            {data.instrucciones || '¡Responde con cuidado!'}
          </div>
          <div style={{ color:C.muted, fontSize:'12px' }}>{preguntas.length} preguntas de tipos variados</div>
        </div>
        <div style={{ color:C.muted, fontSize:'13px', fontWeight:700 }}>
          {Object.keys(answers).length}/{preguntas.length}
        </div>
      </Card>

      {preguntas.map((q, qi) => {
        const tipo  = TIPO_LABELS[q.tipo] || TIPO_LABELS.concepto;
        const difC  = q.dificultad==='facil'?C.green:q.dificultad==='dificil'?C.coral:C.amber;
        const sel   = answers[q.id];
        return (
          <Card key={q.id} style={{ padding:'20px' }}>
            {/* Badge tipo + dificultad */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <span style={{ background:`${tipo.color}20`, border:`1px solid ${tipo.color}40`,
                borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700,
                color:tipo.color }}>{tipo.emoji} {tipo.label}</span>
              <span style={{ background:`${difC}15`, borderRadius:'20px', padding:'3px 9px',
                fontSize:'10px', fontWeight:600, color:difC }}>{q.dificultad}</span>
              <span style={{ marginLeft:'auto', color:C.muted, fontSize:'12px', fontWeight:700 }}>
                {qi+1}/{preguntas.length}
              </span>
            </div>

            {/* Contexto */}
            {q.contexto && (
              <div style={{ background:C.surface, borderRadius:'10px', padding:'12px 14px',
                marginBottom:'14px', borderLeft:`3px solid ${tipo.color}`,
                color:C.textSub, fontSize:'13px', lineHeight:1.65, fontStyle:'italic' }}>
                {q.contexto}
              </div>
            )}

            <div style={{ fontWeight:700, fontSize:'14px', lineHeight:1.65, marginBottom:'14px' }}>
              {q.id}. {q.pregunta}
            </div>

            {/* Opciones como cartas */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {(q.opciones || []).map((op, j) => {
                const isSel = sel === j;
                return (
                  <button key={j}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]:j }))}
                    style={{ background: isSel?`${C.coral}20`:C.surface,
                      border:`1.5px solid ${isSel?C.coral:C.border}`,
                      borderRadius:'12px', padding:'12px 14px', textAlign:'left',
                      cursor:'pointer', color:isSel?C.coral:C.text,
                      fontSize:'13px', fontWeight:isSel?700:400, transition:'all .15s',
                      display:'flex', alignItems:'flex-start', gap:'10px',
                      boxShadow: isSel?`0 0 10px ${C.coral}20`:'none' }}>
                    <span style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
                      background:isSel?C.coral:C.surface,
                      border:`1.5px solid ${isSel?C.coral:C.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'10px', fontWeight:800, color:isSel?C.bg:C.muted }}>
                      {String.fromCharCode(65+j)}
                    </span>
                    {op}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      <Btn full color={C.coral} onClick={handleSubmit}
        disabled={Object.keys(answers).length < preguntas.length}>
        Corregir ({Object.keys(answers).length}/{preguntas.length} respondidas)
      </Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. PRÁCTICA — Terminal RPG con transmisión cifrada + typewriter
// ══════════════════════════════════════════════════════════════════════════════
function TypewriterText({ lines, color, onDone }) {
  const [displayed, setDisplayed] = useState([]);
  const [lineIdx,   setLineIdx]   = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);

  useEffect(() => {
    if (!lines || lines.length === 0) { onDone?.(); return; }
    if (lineIdx >= lines.length) { onDone?.(); return; }
    const line = lines[lineIdx] || '';
    if (charIdx >= line.length) {
      const timer = setTimeout(() => { setLineIdx(l => l+1); setCharIdx(0); }, 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setDisplayed(d => {
        const copy = [...d];
        if (!copy[lineIdx]) copy[lineIdx] = '';
        copy[lineIdx] = line.slice(0, charIdx+1);
        return copy;
      });
      setCharIdx(c => c+1);
    }, 22);
    return () => clearTimeout(timer);
  }, [lineIdx, charIdx, lines]);

  return (
    <div style={{ fontFamily:"'Courier New', monospace", fontSize:'13px', lineHeight:2 }}>
      {displayed.map((line, i) => (
        <div key={i} style={{ color: i === displayed.length-1 ? color : `${color}90`, marginBottom:'2px' }}>
          <span style={{ color:`${color}60`, marginRight:'10px' }}>{'>'}</span>
          {line}
          {i === lineIdx && charIdx < (lines[i]||'').length && (
            <span style={{ borderRight:`2px solid ${color}`, animation:'svBlink 0.7s infinite',
              marginLeft:'2px', display:'inline-block' }}>&nbsp;</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MisionTerminal({ mision, idx }) {
  const [phase,   setPhase]   = useState('locked'); // locked|transmit|ready|solving|done
  const [pasosOk, setPasosOk] = useState({});
  const [mostrar, setMostrar] = useState({});

  const transmisionLines = Array.isArray(mision.transmision)
    ? mision.transmision
    : [mision.narrativa || 'Iniciando transmisión...'];

  const allPasos = Array.isArray(mision.proceso) ? mision.proceso : [];
  const doneCount = Object.values(pasosOk).filter(Boolean).length;
  const allDone   = doneCount === allPasos.length && allPasos.length > 0;

  const colores   = [C.accent, C.green, C.violet];
  const col       = colores[idx % colores.length];

  return (
    <div style={{ border:`1px solid ${col}30`, borderRadius:'16px', overflow:'hidden', marginBottom:'12px' }}>
      {/* Cabecera */}
      <div style={{ background:`${col}15`, borderBottom:`1px solid ${col}30`,
        padding:'14px 20px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
        <span style={{ fontSize:'24px' }}>{mision.badge}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'3px' }}>
            <span style={{ background:`${col}25`, borderRadius:'20px', padding:'2px 10px',
              fontSize:'11px', fontWeight:700, color:col }}>{mision.dificultad}</span>
            <span style={{ background:`${C.amber}15`, borderRadius:'20px', padding:'2px 10px',
              fontSize:'11px', fontWeight:700, color:C.amber }}>⭐ {mision.xp} XP</span>
            {allDone && <span style={{ color:C.green, fontWeight:800, fontSize:'12px' }}>✓ COMPLETADA</span>}
          </div>
          <div style={{ fontWeight:800, fontSize:'15px' }}>{mision.titulo}</div>
        </div>
        {phase === 'locked' && (
          <Btn small color={col} onClick={() => setPhase('transmit')}>
            📡 Iniciar transmisión
          </Btn>
        )}
      </div>

      {/* Terminal */}
      {phase !== 'locked' && (
        <div style={{ background:'#020814', padding:'20px 22px',
          borderBottom:`1px solid ${col}20` }}>
          {/* Barra de terminal */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
            {['#ef4444','#fbbf24','#10b981'].map(c => (
              <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }} />
            ))}
            <span style={{ marginLeft:'8px', fontSize:'11px', color:'#4a5568', fontFamily:'monospace' }}>
              TERMINAL — MISIÓN_{String(idx+1).padStart(2,'0')}.exe
            </span>
          </div>

          {phase === 'transmit' && (
            <TypewriterText lines={transmisionLines} color={col}
              onDone={() => setTimeout(() => setPhase('ready'), 600)} />
          )}
          {(phase === 'ready' || phase === 'solving' || phase === 'done') && (
            <div>
              {transmisionLines.map((line, i) => (
                <div key={i} style={{ color:`${col}70`, fontSize:'12px', fontFamily:'monospace',
                  lineHeight:1.9, marginBottom:'1px' }}>
                  <span style={{ color:`${col}40`, marginRight:'10px' }}>{'>'}</span>{line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido de la misión */}
      {(phase === 'ready' || phase === 'solving' || phase === 'done') && (
        <div style={{ padding:'22px' }}>
          {/* Objetivo */}
          <div style={{ marginBottom:'18px' }}>
            <div style={{ fontWeight:700, fontSize:'12px', color:col, textTransform:'uppercase',
              letterSpacing:'.06em', marginBottom:'10px' }}>🎯 OBJETIVO TÁCTICO</div>
            <p style={{ color:C.text, fontSize:'14px', lineHeight:1.75,
              background:`${col}06`, borderRadius:'10px', padding:'14px 16px',
              border:`1px solid ${col}20` }}>
              {mision.objetivo || mision.enunciado}
            </p>
          </div>

          {/* Datos */}
          {Array.isArray(mision.datos) && mision.datos.length > 0 && (
            <div style={{ background:C.surface, borderRadius:'10px', padding:'14px 16px',
              marginBottom:'18px' }}>
              <div style={{ fontWeight:700, fontSize:'12px', color:C.textSub, marginBottom:'8px',
                textTransform:'uppercase' }}>📋 DATOS DEL OPERATIVO</div>
              {mision.datos.map((d, j) => (
                <div key={j} style={{ display:'flex', alignItems:'center', gap:'8px',
                  padding:'5px 0', borderBottom:j<mision.datos.length-1?`1px solid ${C.border}`:'none' }}>
                  <span style={{ color:col, fontSize:'12px' }}>»</span>
                  <span style={{ color:C.text, fontSize:'13px' }}>{d}</span>
                </div>
              ))}
            </div>
          )}

          {/* Proceso con checkboxes */}
          <div style={{ marginBottom:'18px' }}>
            <div style={{ fontWeight:700, fontSize:'12px', color:C.textSub, textTransform:'uppercase',
              marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>🗺️ PROTOCOLO DE EJECUCIÓN</span>
              <span style={{ color:col }}>{doneCount}/{allPasos.length}</span>
            </div>
            {allPasos.map((paso, pi) => {
              const done = !!pasosOk[pi];
              return (
                <div key={pi} style={{ display:'flex', gap:'12px', alignItems:'flex-start',
                  padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                  <button onClick={() => {
                    setPasosOk(p => ({ ...p, [pi]:!p[pi] }));
                    if (phase === 'ready') setPhase('solving');
                  }} style={{ width:24, height:24, borderRadius:'6px', flexShrink:0,
                    background:done?col:C.surface, border:`2px solid ${done?col:C.border}`,
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'12px', marginTop:'1px', transition:'all .18s', color:C.bg, fontWeight:800 }}>
                    {done && '✓'}
                  </button>
                  <div style={{ flex:1 }}>
                    <div style={{ color:done?C.muted:C.text, fontSize:'13px', lineHeight:1.65,
                      textDecoration:done?'line-through':'none' }}>
                      <strong style={{ color:done?C.muted:col }}>Paso {paso.paso}:</strong>{' '}
                      {paso.instruccion}
                    </div>
                    <button
                      onClick={() => setMostrar(m => ({...m,[`h-${pi}`]:!m[`h-${pi}`]}))}
                      style={{ background:'none', border:'none', color:C.amber, cursor:'pointer',
                        fontSize:'11px', fontWeight:700, marginTop:'5px', padding:0,
                        display:'flex', alignItems:'center', gap:'4px' }}>
                      {mostrar[`h-${pi}`]?'▾ Ocultar pista':'▸ Pedir reporte al escuadrón'}
                    </button>
                    {mostrar[`h-${pi}`] && (
                      <div className="sv-slide-in" style={{ marginTop:'7px', padding:'9px 13px',
                        background:`${C.amber}10`, borderRadius:'8px', color:C.amber,
                        fontSize:'12px', border:`1px solid ${C.amber}25` }}>
                        📡 {paso.pista}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón ejecutar protocolo (solución) */}
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <button
              onClick={() => setMostrar(m => ({...m,'sol':!m['sol']}))}
              style={{ display:'flex', alignItems:'center', gap:'8px',
                background: mostrar['sol'] ? `${col}20` : C.surface,
                border:`1.5px solid ${mostrar['sol']?col:C.border}`,
                borderRadius:'10px', padding:'10px 16px', cursor:'pointer',
                color:mostrar['sol']?col:C.muted, fontSize:'13px', fontWeight:700, transition:'all .18s' }}>
              {mostrar['sol'] ? '🔒 Clasificar solución' : '🔓 Ejecutar protocolo de solución'}
            </button>
          </div>

          {mostrar['sol'] && (
            <div className="sv-slide-in" style={{ marginTop:'14px', padding:'18px 20px',
              background:`${col}08`, borderRadius:'14px', borderLeft:`3px solid ${col}` }}>
              <div style={{ fontWeight:700, color:col, marginBottom:'12px', fontSize:'13px',
                display:'flex', alignItems:'center', gap:'8px' }}>
                ✅ SOLUCIÓN COMPLETA
              </div>
              <p style={{ color:C.text, fontSize:'13px', lineHeight:1.85 }}>
                {mision.solucion}
              </p>
              {mision.reflexion && (
                <div style={{ marginTop:'14px', padding:'12px 14px', background:`${C.green}10`,
                  borderRadius:'10px', color:C.green, fontSize:'12px', lineHeight:1.65,
                  border:`1px solid ${C.green}25` }}>
                  🌱 <strong>Reflexión táctica:</strong> {mision.reflexion}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PracticaView({ data }) {
  const [xpTotal, setXpTotal] = useState(0);
  if (!data?.misiones || !Array.isArray(data.misiones)) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      {/* Centro de operaciones */}
      <Card style={{ background:`${C.violet}08`, borderColor:`${C.violet}25`, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <div style={{ fontWeight:800, color:C.violet, fontSize:'16px', marginBottom:'4px' }}>
              🖥️ {data.introduccion || 'Centro de Operaciones Tácticas'}
            </div>
            <div style={{ color:C.muted, fontSize:'12px' }}>
              {data.misiones.length} misiones disponibles · Completa cada paso para ganar XP
            </div>
          </div>
          <div style={{ background:`${C.violet}20`, border:`1px solid ${C.violet}40`,
            borderRadius:'12px', padding:'10px 18px', textAlign:'center' }}>
            <div style={{ fontWeight:800, fontSize:'22px', color:C.violet, fontFamily:"'Press Start 2P', cursive" }}>
              {data.misiones.reduce((a, m) => a + (m.xp||0), 0)}
            </div>
            <div style={{ fontSize:'10px', color:C.muted, textTransform:'uppercase', marginTop:'2px' }}>XP disponibles</div>
          </div>
        </div>
      </Card>
      {data.misiones.map((m, i) => <MisionTerminal key={i} mision={m} idx={i} />)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. MEMORIA — Zen con partículas al hacer match
// ══════════════════════════════════════════════════════════════════════════════
function ParticleBurst({ color, active }) {
  if (!active) return null;
  const particles = Array.from({ length: 8 });
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:'inherit', zIndex:10 }}>
      {particles.map((_, i) => {
        const angle  = (i / particles.length) * 360;
        const dist   = 30 + Math.random() * 20;
        const dx     = Math.cos(angle * Math.PI/180) * dist;
        const dy     = Math.sin(angle * Math.PI/180) * dist;
        return (
          <div key={i} style={{
            position:'absolute', top:'50%', left:'50%',
            width: 6 + Math.random()*4, height: 6 + Math.random()*4,
            borderRadius:'50%', background:color,
            '--dx': `${dx}px`, '--dy': `${dy}px`,
            animation:'svParticle .6s ease-out forwards',
            boxShadow:`0 0 6px ${color}`,
          }} />
        );
      })}
    </div>
  );
}

function MemoriaView({ data }) {
  const [tab, setTab] = useState('flash');
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ background:`${C.pink}08`, borderColor:`${C.pink}25`, padding:'18px 24px' }}>
        <SecHeader label="Zona de Paz Cognitiva" color={C.pink} icon="🧠" />
        <p style={{ color:C.muted, fontSize:'13px' }}>
          Consolida el conocimiento con juegos relajantes. Tu mente aprende mejor cuando está tranquila.
        </p>
      </Card>

      <div style={{ display:'flex', gap:'10px' }}>
        {[{id:'flash',label:'🃏 Flashcards'},{id:'parejas',label:'🔗 Conectar'},{id:'completar',label:'✍️ Completar'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, background:tab===t.id?`${C.pink}20`:C.card,
            border:`1.5px solid ${tab===t.id?C.pink:C.border}`,
            borderRadius:'14px', padding:'12px 8px', cursor:'pointer',
            color:tab===t.id?C.pink:C.muted, fontSize:'12px', fontWeight:tab===t.id?700:400,
            transition:'all .2s cubic-bezier(.16,1,.3,1)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'flash'     && <ZenFlashCards    cards={data.flashCards} />}
      {tab === 'parejas'   && <ZenParejas        pairs={data.parejas} />}
      {tab === 'completar' && <ZenCompletar   sentences={data.completar} />}
    </div>
  );
}

function ZenFlashCards({ cards }) {
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done,    setDone]    = useState({});
  const [burst,   setBurst]   = useState(false);
  if (!Array.isArray(cards) || cards.length === 0) return (
    <Card style={{ padding:'30px', textAlign:'center', color:C.muted }}>No hay flashcards disponibles.</Card>
  );
  const card = cards[idx] || {};

  const markDone = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    setDone(d => ({ ...d, [idx]:true }));
    setFlipped(false);
    if (idx < cards.length-1) setTimeout(() => setIdx(i => i+1), 300);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px', alignItems:'center' }}>
      <div style={{ fontSize:'13px', color:C.muted, display:'flex', gap:'12px', alignItems:'center' }}>
        <span>{idx+1} / {cards.length}</span>
        <div style={{ display:'flex', gap:'4px' }}>
          {cards.map((_,i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%',
              background:done[i]?C.green:i===idx?C.pink:C.border,
              transition:'background .3s', boxShadow:done[i]?`0 0 6px ${C.green}`:'none' }} />
          ))}
        </div>
      </div>

      {/* Carta con flip */}
      <div onClick={() => setFlipped(f => !f)}
        style={{ width:'100%', maxWidth:'500px', height:'230px', cursor:'pointer', perspective:'1000px' }}>
        <div style={{ width:'100%', height:'100%', position:'relative',
          transition:'transform .55s cubic-bezier(.16,1,.3,1)',
          transformStyle:'preserve-3d',
          transform:flipped?'rotateY(180deg)':'rotateY(0deg)' }}>

          {/* Frente */}
          <div style={{ position:'absolute', width:'100%', height:'100%',
            backfaceVisibility:'hidden', background:C.card,
            border:`2px solid ${C.pink}40`, borderRadius:'20px',
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', padding:'28px', textAlign:'center',
            boxShadow:`0 8px 30px ${C.pink}15` }}>
            <span style={{ fontSize:'38px', marginBottom:'14px' }}>{card.emoji || '📌'}</span>
            <div style={{ fontFamily:"'Lora',serif", fontSize:'17px', fontWeight:700, lineHeight:1.55 }}>
              {card.frente}
            </div>
            <div style={{ marginTop:'16px', fontSize:'11px', color:C.muted }}>Toca para revelar →</div>
          </div>

          {/* Reverso */}
          <div style={{ position:'absolute', width:'100%', height:'100%',
            backfaceVisibility:'hidden', background:`${C.pink}10`,
            border:`2px solid ${C.pink}60`, borderRadius:'20px',
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', padding:'28px', textAlign:'center',
            transform:'rotateY(180deg)',
            boxShadow:`0 0 25px ${C.pink}30` }}>
            <ParticleBurst color={C.green} active={burst} />
            <div style={{ fontSize:'13px', color:C.pink, fontWeight:700, textTransform:'uppercase',
              marginBottom:'12px', letterSpacing:'.06em' }}>Respuesta</div>
            <div style={{ color:C.text, fontSize:'14px', lineHeight:1.7 }}>{card.reverso}</div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
        <Btn small outline color={C.muted} disabled={idx===0}
          onClick={() => { setFlipped(false); setTimeout(()=>setIdx(i=>i-1),150); }}>← Anterior</Btn>
        {flipped && (
          <>
            <Btn small color={C.green} onClick={markDone}>✓ La sabía</Btn>
            <Btn small outline color={C.coral}
              onClick={() => { setFlipped(false); if(idx<cards.length-1)setTimeout(()=>setIdx(i=>i+1),150); }}>
              ✗ Repasar
            </Btn>
          </>
        )}
        <Btn small outline color={C.muted} disabled={idx===cards.length-1}
          onClick={() => { setFlipped(false); setTimeout(()=>setIdx(i=>i+1),150); }}>Siguiente →</Btn>
      </div>

      {Object.keys(done).length === cards.length && (
        <div className="sv-slide-in" style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`,
          borderRadius:'14px', padding:'16px 24px', color:C.green, fontWeight:800, textAlign:'center',
          animation:'svPulse 1s ease', boxShadow:`0 0 20px ${C.green}30`,
          width:'100%', maxWidth:'500px' }}>
          🌟 Tu mente ha asimilado esta información con éxito. Estás listo.
        </div>
      )}
    </div>
  );
}

function ZenParejas({ pairs }) {
  const [matched,  setMatched]  = useState({});
  const [selected, setSelected] = useState(null);
  const [wrong,    setWrong]    = useState(null);
  const [bursts,   setBursts]   = useState({});

  if (!Array.isArray(pairs) || pairs.length === 0) return (
    <Card style={{ padding:'30px', textAlign:'center', color:C.muted }}>No hay pares disponibles.</Card>
  );

  const [leftItems]  = useState(() => [...pairs].sort(()=>Math.random()-.5).map((p,i)=>({...p,id:`l${i}`,side:'left'})));
  const [rightItems] = useState(() => [...pairs].sort(()=>Math.random()-.5).map((p,i)=>({...p,id:`r${i}`,side:'right'})));

  const handleClick = (item) => {
    if (matched[item.id]) return;
    if (!selected) { setSelected(item); return; }
    if (selected.id === item.id) { setSelected(null); return; }
    const a = selected, b = item;
    const left  = a.side==='left'?a:b;
    const right = a.side==='right'?a:b;
    const isMatch = pairs.some(p => p.izquierda===left.izquierda && p.derecha===right.derecha);
    if (isMatch) {
      setBursts(bx => ({ ...bx, [a.id]:true, [b.id]:true }));
      setTimeout(() => setBursts(bx => { const n={...bx}; delete n[a.id]; delete n[b.id]; return n; }), 700);
      setMatched(m => ({ ...m, [a.id]:true, [b.id]:true }));
      setSelected(null);
    } else {
      setWrong({a,b});
      setTimeout(() => { setWrong(null); setSelected(null); }, 700);
    }
  };

  const matchCount = Object.keys(matched).length / 2;
  const getStyle = (item) => {
    if (matched[item.id]) return { bg:`${C.green}20`, brd:C.green, col:C.green };
    if (wrong&&(wrong.a.id===item.id||wrong.b.id===item.id)) return { bg:`${C.coral}15`, brd:C.coral, col:C.coral };
    if (selected?.id===item.id) return { bg:`${C.pink}20`, brd:C.pink, col:C.pink };
    return { bg:C.surface, brd:C.border, col:C.text };
  };

  return (
    <Card style={{ padding:'24px' }}>
      <SecHeader label={`Conectar — ${matchCount}/${pairs.length} parejas`} color={C.pink} icon="🔗" />
      <p style={{ color:C.muted, fontSize:'12px', marginBottom:'18px' }}>
        Selecciona un elemento de cada columna para conectarlos.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        {[{ items:leftItems, title:'Términos' }, { items:rightItems, title:'Definiciones' }].map(col => (
          <div key={col.title} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <div style={{ fontWeight:700, fontSize:'11px', color:C.muted, textTransform:'uppercase',
              textAlign:'center', marginBottom:'4px' }}>{col.title}</div>
            {col.items.map(item => {
              const { bg, brd, col:c } = getStyle(item);
              return (
                <div key={item.id} style={{ position:'relative' }}>
                  <ParticleBurst color={C.green} active={!!bursts[item.id]} />
                  <button onClick={() => handleClick(item)} style={{
                    width:'100%', background:bg, border:`1.5px solid ${brd}`, borderRadius:'12px',
                    padding:'11px 14px', cursor:matched[item.id]?'default':'pointer',
                    color:c, fontSize:'12px', fontWeight:600, lineHeight:1.5, textAlign:'center',
                    transition:'all .25s cubic-bezier(.16,1,.3,1)',
                    boxShadow:matched[item.id]?`0 0 14px ${C.green}30`:'none',
                    animation:matched[item.id]?'svPulse 0.6s ease':'none' }}>
                    {item.side==='left'?item.izquierda:item.derecha}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {matchCount === pairs.length && (
        <div className="sv-slide-in" style={{ marginTop:'18px', background:`${C.green}15`,
          border:`1px solid ${C.green}40`, borderRadius:'14px', padding:'16px 20px',
          color:C.green, fontWeight:800, textAlign:'center',
          boxShadow:`0 0 20px ${C.green}20` }}>
          🌿 Perfecto. Tu mente ha tejido todas las conexiones.
        </div>
      )}
    </Card>
  );
}

function ZenCompletar({ sentences }) {
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState({});
  if (!Array.isArray(sentences) || sentences.length === 0) return (
    <Card style={{ padding:'30px', textAlign:'center', color:C.muted }}>No hay oraciones disponibles.</Card>
  );
  const doneAll = sentences.every((_, i) => submitted[i]);
  return (
    <Card style={{ padding:'22px' }}>
      <SecHeader label="Completar la oración" color={C.pink} icon="✍️" />
      <p style={{ color:C.muted, fontSize:'12px', marginBottom:'18px' }}>
        Elige la opción correcta para completar cada oración.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'22px' }}>
        {sentences.map((s, i) => {
          const sel    = answers[i];
          const ok     = submitted[i] && sel === s.respuesta;
          const bad    = submitted[i] && sel !== s.respuesta;
          const parts  = (s.oracion || '').split('[hueco]');
          return (
            <div key={i} style={{ background:ok?`${C.green}08`:bad?`${C.coral}06`:C.surface,
              border:`1px solid ${ok?C.green:bad?C.coral:C.border}`,
              borderRadius:'14px', padding:'18px 20px',
              transition:'all .4s cubic-bezier(.16,1,.3,1)',
              boxShadow:ok?`0 0 16px ${C.green}20`:'none' }}>
              <div style={{ fontSize:'15px', color:C.text, lineHeight:2.1, marginBottom:'14px',
                fontFamily:"'Lora',serif" }}>
                {parts[0]}
                <span style={{ display:'inline-block',
                  background:ok?`${C.green}20`:bad?`${C.coral}15`:`${C.pink}15`,
                  border:`1.5px dashed ${ok?C.green:bad?C.coral:C.pink}`,
                  borderRadius:'6px', padding:'2px 12px', margin:'0 4px',
                  fontWeight:700, color:ok?C.green:bad?C.coral:C.pink,
                  transition:'all .3s',
                  boxShadow:ok?`0 0 10px ${C.green}30`:'none' }}>
                  {sel || '___'}
                </span>
                {parts[1]}
              </div>
              {!submitted[i] && (
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
                  {(s.opciones || []).map((op, j) => (
                    <button key={j} onClick={() => setAnswers(a => ({...a,[i]:op}))} style={{
                      background:answers[i]===op?`${C.pink}20`:C.card,
                      border:`1px solid ${answers[i]===op?C.pink:C.border}`,
                      borderRadius:'20px', padding:'6px 16px', cursor:'pointer',
                      color:answers[i]===op?C.pink:C.muted,
                      fontSize:'12px', fontWeight:answers[i]===op?700:400,
                      transition:'all .2s cubic-bezier(.16,1,.3,1)',
                      boxShadow:answers[i]===op?`0 0 10px ${C.pink}20`:'none' }}>
                      {op}
                    </button>
                  ))}
                </div>
              )}
              {!submitted[i] && sel && (
                <Btn small color={C.pink}
                  onClick={() => setSubmitted(st => ({...st,[i]:true}))}>
                  Verificar
                </Btn>
              )}
              {submitted[i] && (
                <div style={{ padding:'10px 14px', borderRadius:'10px', fontSize:'13px', fontWeight:700,
                  background:ok?`${C.green}15`:`${C.coral}10`,
                  color:ok?C.green:C.coral, transition:'all .4s' }}>
                  {ok ? '✓ ¡Correcto! Tu mente lo ha registrado.' : `✗ La respuesta era: "${s.respuesta}"`}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {doneAll && (
        <div className="sv-slide-in" style={{ marginTop:'20px', background:`${C.green}12`,
          border:`1px solid ${C.green}40`, borderRadius:'14px', padding:'18px 24px',
          color:C.green, fontWeight:800, textAlign:'center', fontSize:'14px',
          boxShadow:`0 0 20px ${C.green}25`, lineHeight:1.7 }}>
          ✨ Tu mente ha asimilado esta información con éxito. Estás listo.
        </div>
      )}
    </Card>
  );
}