import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES } from '@/theme';
import { Card, Btn, Spinner, ProgressBar } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getClass, saveProgress, getProgressByStudent } from '@/services/db';

export default function StudyView() {
  const { classId }        = useParams();
  const { user, schoolId } = useAuth();
  const navigate           = useNavigate();
  const [cls,      setCls]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [styleId,  setStyleId]  = useState('lector');
  const [progress, setProgress] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([getClass(classId), getProgressByStudent(user.uid, schoolId)]);
        setCls(c);
        const map = {};
        p.filter(x=>x.classId===classId).forEach(x=>{ map[x.styleId]=x; });
        setProgress(map);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [classId, user.uid, schoolId]);

  const recordView = async (sid) => {
    if (progress[sid]) return;
    const entry = { studentId:user.uid, classId, courseId:cls.courseId, schoolId, styleId:sid, score:null, totalQ:null };
    await saveProgress(entry);
    setProgress(p=>({ ...p, [sid]: entry }));
  };

  const handleStyleChange = (sid) => {
    setStyleId(sid);
    recordView(sid);
  };

  useEffect(() => { if (cls) recordView('lector'); }, [cls]);

  if (loading) return <div style={{ minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center' }}><Spinner size={40} /></div>;
  if (!cls?.content) return <div style={{ padding:'60px',textAlign:'center',color:C.muted }}>Clase no disponible</div>;

  const content = cls.content;
  const doneCount = Object.keys(progress).length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'24px 20px' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom:'22px' }}>
          <button onClick={()=>navigate(-1)} style={{ background:`${C.green}15`,border:`1px solid ${C.green}30`,borderRadius:'8px',padding:'6px 12px',cursor:'pointer',color:C.green,fontSize:'13px',fontWeight:600,marginBottom:'14px' }}>← Volver</button>
          <h1 style={{ fontFamily:"'Lora',serif", fontSize:'22px', fontWeight:700, marginBottom:'4px' }}>{content.titulo}</h1>
          <p style={{ color:C.muted, fontSize:'13px' }}>{content.resumenBreve}</p>
          <div style={{ marginTop:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ color:C.muted, fontSize:'12px' }}>Progreso: {doneCount}/5 estilos</span>
            <div style={{ flex:1, maxWidth:'180px' }}><ProgressBar value={doneCount} max={5} color={C.green} /></div>
          </div>
        </div>

        {/* Selector de estilos */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'22px' }}>
          {STYLES.map(s => (
            <button key={s.id} onClick={()=>handleStyleChange(s.id)} style={{
              background: styleId===s.id?s.soft:'transparent', border:`1.5px solid ${styleId===s.id?s.color:C.border}`,
              borderRadius:'10px', padding:'8px 14px', cursor:'pointer', color: styleId===s.id?s.color:C.muted,
              fontSize:'13px', fontWeight: styleId===s.id?700:400, transition:'all .18s', display:'flex', alignItems:'center', gap:'6px', fontFamily:"'Sora',sans-serif",
            }}>
              {s.emoji} {s.label}
              {progress[s.id] && <span style={{ color:s.color, fontSize:'11px' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Contenido dinámico */}
        <div className="anim-fade-up">
          {styleId === 'lector'   && <LectorView   data={content.lector}   />}
          {styleId === 'visual'   && <VisualView    data={content.visual}   />}
          {styleId === 'auditivo' && <AudioView     data={content.auditivo} />}
          {styleId === 'quiz'     && <QuizView      data={content.quiz}     classId={classId} courseId={cls.courseId} schoolId={schoolId} userId={user.uid} onScore={(s,t)=>{ const e={studentId:user.uid,classId,courseId:cls.courseId,schoolId,styleId:'quiz',score:s,totalQ:t}; saveProgress(e); setProgress(p=>({...p,quiz:e})); }} />}
          {styleId === 'practica' && <PracticaView  data={content.practica} />}
        </div>
      </main>
    </div>
  );
}

// ── VISTAS INDIVIDUALES ────────────────────────────────────────────────────────

function LectorView({ data }) {
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ padding:'22px' }}>
        <Section label="Introducción" color={C.accent} />
        <p style={{ color:C.text, lineHeight:1.75, fontSize:'14px' }}>{data.introduccion}</p>
      </Card>
      <Card style={{ padding:'22px' }}>
        <Section label="Desarrollo" color={C.accent} />
        {data.desarrollo?.split('\n\n').map((p,i) => <p key={i} style={{ color:C.text, lineHeight:1.75, fontSize:'14px', marginBottom:'12px' }}>{p}</p>)}
      </Card>
      {data.conceptosClave?.length > 0 && (
        <Card style={{ padding:'22px' }}>
          <Section label="Conceptos Clave" color={C.accent} />
          <div style={{ display:'grid', gap:'10px' }}>
            {data.conceptosClave.map((c,i) => (
              <div key={i} style={{ background:C.accentSoft, borderRadius:'10px', padding:'13px 16px' }}>
                <div style={{ fontWeight:700, color:C.accent, marginBottom:'4px', fontSize:'14px' }}>{c.termino}</div>
                <div style={{ color:C.text, fontSize:'13px', lineHeight:1.6 }}>{c.definicion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card style={{ padding:'22px' }}>
        <Section label="Conclusión" color={C.accent} />
        <p style={{ color:C.text, lineHeight:1.75, fontSize:'14px' }}>{data.conclusion}</p>
      </Card>
      {data.paraSaber && (
        <Card style={{ background:`${C.amber}08`, borderColor:`${C.amber}25`, padding:'18px 22px' }}>
          <div style={{ fontWeight:700, color:C.amber, marginBottom:'6px' }}>💡 ¿Sabías que...?</div>
          <p style={{ color:C.text, fontSize:'13px', lineHeight:1.6 }}>{data.paraSaber}</p>
        </Card>
      )}
    </div>
  );
}

function VisualView({ data }) {
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      {data.mapaConceptual && (
        <Card style={{ padding:'22px' }}>
          <Section label="Mapa Conceptual" color={C.green} />
          <div style={{ textAlign:'center', marginBottom:'18px' }}>
            <div style={{ display:'inline-block', background:C.green, color:'#fff', borderRadius:'12px', padding:'10px 22px', fontWeight:700, fontSize:'15px' }}>{data.mapaConceptual.raiz}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' }}>
            {data.mapaConceptual.ramas?.map((rama,i) => (
              <div key={i} style={{ border:`2px solid ${rama.color}`, borderRadius:'12px', padding:'14px', background:`${rama.color}08` }}>
                <div style={{ fontWeight:700, color:rama.color, marginBottom:'10px', fontSize:'14px' }}>{rama.titulo}</div>
                {rama.nodos?.map((n,j) => <div key={j} style={{ background:C.surface,borderRadius:'8px',padding:'6px 10px',marginBottom:'6px',fontSize:'13px',color:C.text }}>{n}</div>)}
              </div>
            ))}
          </div>
        </Card>
      )}
      {data.tablaComparativa && (
        <Card style={{ padding:'22px', overflowX:'auto' }}>
          <Section label={data.tablaComparativa.titulo||'Tabla Resumen'} color={C.green} />
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>{data.tablaComparativa.columnas?.map((h,i)=><th key={i} style={{ background:C.green,color:'#fff',padding:'10px 14px',textAlign:'left',fontWeight:700 }}>{h}</th>)}</tr>
            </thead>
          <tbody>
              {data.tablaComparativa.filas?.map((row,i)=>(
                <tr key={i} style={{ background:i%2===0?C.surface:C.card }}>
                  {/* Agregamos row.celdas para leer el nuevo formato que le pedimos a Gemini */}
                  {(row.celdas || []).map((cell,j)=><td key={j} style={{ padding:'9px 14px',color:C.text,borderBottom:`1px solid ${C.border}` }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data.pasosProceso?.length > 0 && (
        <Card style={{ padding:'22px' }}>
          <Section label="Pasos del Proceso" color={C.green} />
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {data.pasosProceso.map((paso,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:30,height:30,borderRadius:'50%',background:C.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'13px',flexShrink:0 }}>{i+1}</div>
                <div style={{ color:C.text, fontSize:'14px', lineHeight:1.5 }}>{paso}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AudioView({ data }) {
  const [playing, setPlaying] = useState(false);
  const [done,    setDone]    = useState(false);
  const uttRef = useRef(null);

  const speak = () => {
    if (!window.speechSynthesis||!data?.narracion) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(data.narracion);
    utter.lang = 'es-CL'; utter.rate = 0.88; utter.pitch = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const es = voices.find(v=>v.lang.startsWith('es')&&v.name.includes('Google'))||voices.find(v=>v.lang.startsWith('es'));
    if (es) utter.voice = es;
    utter.onend = ()=>{ setPlaying(false); setDone(true); };
    uttRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true); setDone(false);
  };

  const pause = () => { window.speechSynthesis.pause(); setPlaying(false); };
  const resume = () => { window.speechSynthesis.resume(); setPlaying(true); };
  const stop  = () => { window.speechSynthesis.cancel(); setPlaying(false); };

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ padding:'28px', textAlign:'center', background:`${C.amber}08`, borderColor:`${C.amber}25` }}>
        <div style={{ fontSize:'52px', marginBottom:'16px' }}>🎧</div>
        <h3 style={{ fontFamily:"'Lora',serif", fontSize:'18px', marginBottom:'8px' }}>Modo Auditivo</h3>
        <p style={{ color:C.muted, fontSize:'13px', marginBottom:'22px' }}>Escucha la narración del tema. Cierra los ojos y concéntrate.</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'12px' }}>
          {!playing ? (
            <Btn onClick={speak} color={C.amber} icon="▶️">{done?'Repetir':'Escuchar'}</Btn>
          ) : (
            <>
              <Btn onClick={pause} color={C.amber} outline>⏸ Pausar</Btn>
              <Btn onClick={stop}  color={C.amber} outline>⏹ Parar</Btn>
            </>
          )}
        </div>
        {playing && <div style={{ marginTop:'16px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', color:C.amber, fontSize:'13px' }}><span className="spinner" style={{ width:14,height:14 }} /> Reproduciendo...</div>}
        {done    && <div style={{ marginTop:'16px', color:C.green, fontSize:'13px', fontWeight:600 }}>✓ ¡Narración completada!</div>}
      </Card>
      <Card style={{ padding:'22px' }}>
        <Section label="Texto de la narración" color={C.amber} />
        {data.narracion?.split('\n\n').map((p,i) => (
          <p key={i} style={{ color:C.text, lineHeight:1.8, fontSize:'14px', marginBottom:'14px', fontFamily:"'Lora',serif" }}>{p}</p>
        ))}
      </Card>
    </div>
  );
}

function QuizView({ data, onScore }) {
  const [answers,  setAnswers]  = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  if (!data?.preguntas) return null;

  const handleSubmit = () => {
    let correct = 0;
    data.preguntas.forEach(q => { if (answers[q.id] === q.correcta) correct++; });
    setScore(correct); setSubmitted(true);
    if (onScore) onScore(correct, data.preguntas.length);
  };

  const pct = Math.round(score/data.preguntas.length*100);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      {!submitted ? (
        <>
          <Card style={{ background:`${C.coral}08`, borderColor:`${C.coral}25`, padding:'18px 22px' }}>
            <div style={{ fontWeight:700, color:C.coral, marginBottom:'4px' }}>🎮 {data.instrucciones}</div>
            <div style={{ color:C.muted, fontSize:'12px' }}>{data.preguntas.length} preguntas · Selecciona una respuesta por pregunta</div>
          </Card>
          {data.preguntas.map(q => (
            <Card key={q.id} style={{ padding:'20px' }}>
              <div style={{ fontWeight:700, marginBottom:'14px', fontSize:'14px' }}>{q.id}. {q.pregunta}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {q.opciones.map((op,j) => (
                  <button key={j} onClick={()=>setAnswers(a=>({...a,[q.id]:j}))} style={{
                    background: answers[q.id]===j?`${C.coral}18`:C.surface,
                    border: `1.5px solid ${answers[q.id]===j?C.coral:C.border}`,
                    borderRadius:'10px', padding:'11px 15px', textAlign:'left', cursor:'pointer',
                    color: answers[q.id]===j?C.coral:C.text, fontSize:'13px', fontWeight: answers[q.id]===j?600:400,
                    transition:'all .18s', fontFamily:"'Sora',sans-serif",
                  }}>{op}</button>
                ))}
              </div>
            </Card>
          ))}
          <Btn full color={C.coral} onClick={handleSubmit} disabled={Object.keys(answers).length < data.preguntas.length}>Ver resultados ({Object.keys(answers).length}/{data.preguntas.length})</Btn>
        </>
      ) : (
        <>
          <Card style={{ textAlign:'center', padding:'28px', background:`${pct>=70?C.green:pct>=50?C.amber:C.red}10`, borderColor:`${pct>=70?C.green:pct>=50?C.amber:C.red}30` }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>{pct>=70?'🏆':pct>=50?'👍':'💪'}</div>
            <div style={{ fontFamily:"'Lora',serif", fontSize:'36px', fontWeight:700, color:pct>=70?C.green:pct>=50?C.amber:C.red }}>{pct}%</div>
            <div style={{ color:C.muted, fontSize:'14px', marginTop:'4px' }}>{score} de {data.preguntas.length} correctas</div>
            <div style={{ color:C.muted, fontSize:'13px', marginTop:'8px' }}>
              {pct>=70?'¡Excelente! Dominaste el tema.':pct>=50?'¡Bien! Repasa los conceptos que fallaste.':'Sigue estudiando, ¡puedes mejorar!'}
            </div>
            <Btn small outline color={C.coral} style={{marginTop:'16px'}} onClick={()=>{ setAnswers({}); setSubmitted(false); }}>Intentar de nuevo</Btn>
          </Card>
          {data.preguntas.map(q => {
            const user_ans = answers[q.id];
            const correct  = user_ans === q.correcta;
            return (
              <Card key={q.id} style={{ padding:'18px', borderColor:correct?`${C.green}40`:`${C.red}40` }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'10px' }}>
                  <span style={{ fontSize:'16px' }}>{correct?'✅':'❌'}</span>
                  <div style={{ fontWeight:600, fontSize:'14px' }}>{q.pregunta}</div>
                </div>
                {q.opciones.map((op,j) => (
                  <div key={j} style={{ padding:'7px 12px', borderRadius:'8px', marginBottom:'4px', fontSize:'13px',
                    background: j===q.correcta?`${C.green}18`:j===user_ans&&!correct?`${C.red}12`:'transparent',
                    color:      j===q.correcta?C.green:j===user_ans&&!correct?C.red:C.muted,
                    fontWeight: j===q.correcta||j===user_ans?600:400,
                  }}>{op} {j===q.correcta?'✓':j===user_ans&&!correct?'✗':''}</div>
                ))}
                <div style={{ marginTop:'10px', padding:'10px 13px', background:C.accentSoft, borderRadius:'8px', color:C.accent, fontSize:'12px' }}>💡 {q.explicacion}</div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

function PracticaView({ data }) {
  const [revealed, setRevealed] = useState({});
  if (!data?.ejercicios) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ background:`${C.violet}08`, borderColor:`${C.violet}25`, padding:'16px 20px' }}>
        <div style={{ fontWeight:700, color:C.violet, marginBottom:'4px' }}>✏️ Práctica</div>
        <div style={{ color:C.muted, fontSize:'13px' }}>{data.introduccion}</div>
      </Card>
      {data.ejercicios?.map((ej,i) => (
        <Card key={i} style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
            <div style={{ width:30,height:30,borderRadius:'50%',background:C.violet,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'13px' }}>{ej.numero}</div>
            <div><div style={{ fontWeight:700, fontSize:'14px' }}>{ej.titulo}</div><div style={{ color:C.muted,fontSize:'11px',textTransform:'uppercase' }}>{ej.tipo}</div></div>
          </div>
          <p style={{ color:C.text, fontSize:'14px', lineHeight:1.65, marginBottom:'14px' }}>{ej.enunciado}</p>
          {ej.datos?.length > 0 && (
            <div style={{ background:C.surface, borderRadius:'10px', padding:'12px 15px', marginBottom:'14px' }}>
              <div style={{ fontWeight:600, fontSize:'12px', color:C.textSub, marginBottom:'6px', textTransform:'uppercase' }}>Datos</div>
              {ej.datos.map((d,j) => <div key={j} style={{ color:C.text,fontSize:'13px',marginBottom:'3px' }}>• {d}</div>)}
            </div>
          )}
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontWeight:600, fontSize:'12px', color:C.textSub, marginBottom:'8px', textTransform:'uppercase' }}>Pasos</div>
            {ej.pasos?.map((p,j) => (
              <div key={j} style={{ display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'8px' }}>
                <div style={{ width:22,height:22,borderRadius:'50%',background:`${C.violet}20`,color:C.violet,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,flexShrink:0,marginTop:'1px' }}>{j+1}</div>
                <div style={{ color:C.text,fontSize:'13px',lineHeight:1.6 }}>{p}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <Btn small outline color={C.amber} onClick={()=>setRevealed(r=>({...r,[`h${i}`]:!r[`h${i}`]}))}>
              {revealed[`h${i}`]?'Ocultar pista':'💡 Ver pista'}
            </Btn>
            <Btn small outline color={C.violet} onClick={()=>setRevealed(r=>({...r,[`r${i}`]:!r[`r${i}`]}))}>
              {revealed[`r${i}`]?'Ocultar respuesta':'✓ Ver respuesta'}
            </Btn>
          </div>
          {revealed[`h${i}`] && <div style={{ marginTop:'10px', padding:'10px 13px', background:C.amberSoft, borderRadius:'8px', color:C.amber, fontSize:'13px' }}>💡 Pista: {ej.pista}</div>}
          {revealed[`r${i}`] && <div style={{ marginTop:'8px', padding:'10px 13px', background:`${C.violet}10`, borderRadius:'8px', color:C.violet, fontSize:'13px' }}>✓ {ej.respuesta}</div>}
        </Card>
      ))}
    </div>
  );
}

function Section({ label, color }) {
  return <div style={{ fontWeight:700, fontSize:'13px', color, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'12px', paddingBottom:'6px', borderBottom:`1px solid ${color}25` }}>{label}</div>;
}