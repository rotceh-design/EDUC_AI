import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, Icons } from '@/theme';
import { Card, Btn, Spinner, ProgressBar } from '@/components/ui';
import Navbar from '@/components/Navbar';
import { getClass, saveProgress, getProgressByStudent } from '@/services/db';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function StudyView() {
  const { classId }        = useParams();
  const { user, schoolId } = useAuth();
  const navigate           = useNavigate();
  const [cls,      setCls]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [styleId,  setStyleId]  = useState('lector');
  const [progress, setProgress] = useState({});
  
  // 🎮 SISTEMA DE RECOMPENSAS
  const [xpPopup, setXpPopup] = useState(null);

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

  // 🔥 FUNCIÓN PARA GANAR EXPERIENCIA (XP)
  const handleEarnXP = async (amount) => {
    // 1. Mostrar animación en pantalla
    setXpPopup(amount);
    setTimeout(() => setXpPopup(null), 2500);

    // 2. Guardar en Base de Datos sumando a lo que ya tiene
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { xp: increment(amount) });
    } catch (e) {
      console.error("Error guardando XP:", e);
    }
  };

  useEffect(() => { if (cls) recordView('lector'); }, [cls]);

  if (loading) return <div style={{ minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center' }}><Spinner size={40} /></div>;
  if (!cls?.content) return <div style={{ padding:'60px',textAlign:'center',color:C.muted }}>Clase no disponible</div>;

  const content = cls.content;
  const availableStyles = STYLES.filter(s => content[s.id]);
  const doneCount = availableStyles.filter(s => progress[s.id]).length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
      <Navbar />

      {/* ⚡ ANIMACIÓN FLOTANTE DE PUNTOS XP */}
      {xpPopup !== null && (
        <div style={{
          position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
          zIndex:9999, pointerEvents:'none', animation:'floatUp 2.5s ease-out forwards',
          background:`${C.amber}20`, border:`2px solid ${C.amber}`, padding:'15px 30px',
          borderRadius:'30px', color:C.amber, fontWeight:800, fontSize:'28px',
          fontFamily:"'Press Start 2P', cursive", textShadow:`0 0 20px ${C.amber}`,
          backdropFilter:'blur(10px)'
        }}>
          +{xpPopup} XP!
        </div>
      )}
      {/* Estilo para que el popup flote y desaparezca */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 0; transform: translate(-50%, -20px) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50px) scale(1.1); }
          80% { opacity: 1; transform: translate(-50%, -100px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -130px) scale(0.9); }
        }
      `}</style>

      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'24px 20px' }}>

        {/* --- HEADER FUTURISTA --- */}
        <div className="anim-fade-up glass" style={{ borderRadius:'20px', overflow:'hidden', marginBottom:'24px', border:`1px solid ${C.border}`, position:'relative' }}>
          {content.imagenSugerida && (
            <div style={{ width:'100%', height:'220px', position:'relative', backgroundColor: C.surface }}>
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(content.imagenSugerida)}?width=1000&height=400&nologo=true`} 
                alt="AI Generated Cover" 
                style={{ width:'100%', height:'100%', objectFit:'cover', opacity: 0.6 }} 
                loading="lazy"
              />
              <div style={{ position:'absolute', inset:0, background: `linear-gradient(to top, ${C.card}, transparent)` }}></div>
            </div>
          )}
          <div style={{ padding:'24px', position:'relative', zIndex:10, marginTop: content.imagenSugerida ? '-70px' : '0' }}>
            <button onClick={()=>navigate(-1)} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${C.accent}20`, border:`1px solid ${C.accent}40`, borderRadius:'8px', padding:'6px 12px', cursor:'pointer', color:C.text, fontSize:'12px', fontWeight:600, marginBottom:'16px', backdropFilter:'blur(5px)' }}>← Regresar</button>
            <h1 className="glow-text" style={{ fontFamily:"'Lora',serif", fontSize:'26px', fontWeight:700, marginBottom:'6px', color:'#fff', textShadow:'0 2px 10px rgba(0,0,0,0.8)' }}>{content.titulo}</h1>
            <p style={{ color:C.text, fontSize:'14px', lineHeight:1.5, textShadow:'0 1px 5px rgba(0,0,0,0.8)' }}>{content.resumenBreve}</p>
            
            <div style={{ marginTop:'20px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap', background:`${C.bg}90`, padding:'12px 16px', borderRadius:'12px', backdropFilter:'blur(10px)' }}>
              <span style={{ color:C.accent, fontSize:'13px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Progreso de la misión</span>
              <div style={{ flex:1, minWidth:'150px' }}><ProgressBar value={doneCount} max={availableStyles.length} color={C.accent} /></div>
              <span style={{ color:C.text, fontSize:'13px', fontWeight:600 }}>{doneCount} / {availableStyles.length}</span>
            </div>
          </div>
        </div>

        {/* --- SELECTOR NEÓN --- */}
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'26px', justifyContent:'center' }}>
          {availableStyles.map(s => (
            <button key={s.id} onClick={()=>handleStyleChange(s.id)} style={{
              background: styleId===s.id?s.soft:'rgba(17, 24, 39, 0.6)', 
              border:`1.5px solid ${styleId===s.id?s.color:C.border}`,
              borderRadius:'12px', padding:'10px 16px', cursor:'pointer', 
              color: styleId===s.id?s.color:C.textSub,
              fontSize:'13px', fontWeight: styleId===s.id?700:600, 
              transition:'all .2s ease-in-out', display:'flex', alignItems:'center', gap:'8px', 
              boxShadow: styleId===s.id ? `0 0 15px ${s.soft}` : 'none'
            }}>
              <div style={{ width:18, height:18 }}>{s.icon}</div>
              {s.label}
              {progress[s.id] && <span style={{ color:s.color, fontSize:'11px', marginLeft:'4px' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* --- VISTAS DINÁMICAS --- */}
        <div className="anim-fade-up">
          {styleId === 'lector'   && <LectorView   data={content.lector}   />}
          {styleId === 'visual'   && <VisualView    data={content.visual}   />}
          {styleId === 'auditivo' && <AudioView     data={content.auditivo} />}
          {styleId === 'quiz'     && <QuizView      data={content.quiz}     classId={classId} courseId={cls.courseId} schoolId={schoolId} userId={user.uid} 
             onScore={(s,t)=>{ 
               const e={studentId:user.uid,classId,courseId:cls.courseId,schoolId,styleId:'quiz',score:s,totalQ:t}; 
               saveProgress(e); 
               setProgress(p=>({...p,quiz:e})); 
               // 🎁 RECOMPENSA: 50 XP por respuesta correcta
               if (s > 0) handleEarnXP(s * 50); 
             }} 
          />}
          {styleId === 'practica' && <PracticaView  data={content.practica} />}
          {styleId === 'memoria'  && <MemoriaView   data={content.memoria}  onEarnXP={handleEarnXP} />}
        </div>
      </main>
    </div>
  );
}

// ── VISTAS INDIVIDUALES (Lector, Visual, Audio y Practica se mantienen iguales) ──
function Section({ label, color, icon }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', fontWeight:700, fontSize:'15px', color, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'16px', paddingBottom:'10px', borderBottom:`1px solid ${color}30` }}>
      {icon && <div style={{ width:20, height:20 }}>{icon}</div>}
      {label}
    </div>
  );
}

function LectorView({ data }) {
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card className="glass" style={{ padding:'26px' }}>
        <Section label="Introducción" color={C.accent} icon={<Icons.Read/>}/>
        <p style={{ color:C.text, lineHeight:1.8, fontSize:'15px' }}>{data.introduccion}</p>
      </Card>
      <Card className="glass" style={{ padding:'26px' }}>
        <Section label="Desarrollo del Tema" color={C.accent} />
        {data.desarrollo?.split('\n\n').map((p,i) => <p key={i} style={{ color:C.text, lineHeight:1.8, fontSize:'15px', marginBottom:'14px' }}>{p}</p>)}
      </Card>
      {data.conceptosClave?.length > 0 && (
        <Card className="glass" style={{ padding:'26px' }}>
          <Section label="Glosario / Conceptos Clave" color={C.accent} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'14px' }}>
            {data.conceptosClave.map((c,i) => (
              <div key={i} style={{ background:C.accentSoft, border:`1px solid ${C.accent}40`, borderRadius:'12px', padding:'16px' }}>
                <div style={{ fontWeight:800, color:C.accent, marginBottom:'6px', fontSize:'15px' }}>{c.termino}</div>
                <div style={{ color:C.text, fontSize:'14px', lineHeight:1.6 }}>{c.definicion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card className="glass" style={{ padding:'26px' }}>
        <Section label="Conclusión" color={C.accent} />
        <p style={{ color:C.text, lineHeight:1.8, fontSize:'15px' }}>{data.conclusion}</p>
      </Card>
    </div>
  );
}

function VisualView({ data }) {
  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      {data.mapaConceptual && (
        <Card className="glass" style={{ padding:'26px' }}>
          <Section label="Mapa Conceptual" color={C.green} icon={<Icons.Visual/>}/>
          <div style={{ textAlign:'center', marginBottom:'24px', marginTop:'10px' }}>
            <div style={{ display:'inline-block', background:`linear-gradient(90deg, ${C.green}, #059669)`, color:'#fff', borderRadius:'12px', padding:'12px 24px', fontWeight:800, fontSize:'16px', boxShadow:`0 4px 15px ${C.greenSoft}` }}>{data.mapaConceptual.raiz}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'16px' }}>
            {data.mapaConceptual.ramas?.map((rama,i) => (
              <div key={i} style={{ border:`1.5px solid ${rama.color}`, borderRadius:'14px', padding:'18px', background:`${rama.color}10`, position:'relative' }}>
                <div style={{ fontWeight:800, color:rama.color, marginBottom:'14px', fontSize:'15px', textAlign:'center' }}>{rama.titulo}</div>
                {rama.nodos?.map((n,j) => <div key={j} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'10px', padding:'10px 14px', marginBottom:'8px', fontSize:'14px', color:C.text, textAlign:'center' }}>{n}</div>)}
              </div>
            ))}
          </div>
        </Card>
      )}
      {data.tablaComparativa && (
        <Card className="glass" style={{ padding:'26px', overflowX:'auto' }}>
          <Section label={data.tablaComparativa.titulo||'Tabla Resumen'} color={C.green} />
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
            <thead>
              <tr>{data.tablaComparativa.columnas?.map((h,i)=><th key={i} style={{ background:`${C.green}20`, color:C.green, padding:'14px', textAlign:'left', fontWeight:800, borderBottom:`2px solid ${C.green}` }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.tablaComparativa.filas?.map((row,i)=>(
                <tr key={i} style={{ background:i%2===0?'transparent':C.surface }}>
                  {(row.celdas || []).map((cell,j)=><td key={j} style={{ padding:'14px',color:C.text,borderBottom:`1px solid ${C.borderHover}` }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
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
    utter.lang = 'es-CL'; utter.rate = 0.95; utter.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const es = voices.find(v=>v.lang.startsWith('es')&&v.name.includes('Google'))||voices.find(v=>v.lang.startsWith('es'));
    if (es) utter.voice = es;
    utter.onend = ()=>{ setPlaying(false); setDone(true); };
    uttRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true); setDone(false);
  };
  const pause = () => { window.speechSynthesis.pause(); setPlaying(false); };
  const stop  = () => { window.speechSynthesis.cancel(); setPlaying(false); };

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  if (!data) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <Card style={{ padding:'36px 20px', textAlign:'center', background:`linear-gradient(180deg, ${C.amber}10, transparent)`, border:`1px solid ${C.amber}40` }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:C.amber, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:`0 0 20px ${C.amber}60` }}>
          <Icons.Audio s={40} />
        </div>
        <h3 className="glow-text" style={{ fontFamily:"'Lora',serif", fontSize:'22px', marginBottom:'10px', color:C.amber }}>Podcast Generado por IA</h3>
        <p style={{ color:C.textSub, fontSize:'14px', marginBottom:'30px', maxWidth:'400px', margin:'0 auto 30px' }}>Escucha la narración inmersiva de la clase. Ponte los audífonos y concéntrate.</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'12px' }}>
          {!playing ? <Btn onClick={speak} color={C.amber} size="lg">{done?'Repetir Narración':'▶ Reproducir'}</Btn> : <><Btn onClick={pause} color={C.amber} outline>⏸ Pausar</Btn><Btn onClick={stop} color={C.red} outline>⏹ Detener</Btn></>}
        </div>
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
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      {!submitted ? (
        <>
          <Card style={{ background:`linear-gradient(90deg, ${C.coral}20, transparent)`, borderColor:`${C.coral}40`, padding:'20px 26px', display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:40, height:40, borderRadius:'10px', background:C.coral, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icons.Quiz s={24}/></div>
            <div>
              <div style={{ fontWeight:800, color:C.text, fontSize:'16px', marginBottom:'4px' }}>Evaluación Interactiva</div>
              <div style={{ color:C.textSub, fontSize:'13px' }}>¡Gana 50 XP por cada acierto!</div>
            </div>
          </Card>
          {data.preguntas.map(q => (
            <Card key={q.id} className="glass" style={{ padding:'24px' }}>
              <div style={{ fontWeight:700, marginBottom:'20px', fontSize:'16px', color:C.text }}>{q.id}. {q.pregunta}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {q.opciones.map((op,j) => (
                  <button key={j} onClick={()=>setAnswers(a=>({...a,[q.id]:j}))} style={{ background: answers[q.id]===j?`${C.coral}20`:C.surface, border: `1.5px solid ${answers[q.id]===j?C.coral:C.border}`, borderRadius:'12px', padding:'14px 18px', textAlign:'left', cursor:'pointer', color: answers[q.id]===j?C.coral:C.text, fontSize:'14px', fontWeight: answers[q.id]===j?700:400, transition:'all .2s ease' }}>
                    <span style={{ display:'inline-block', width:'24px', fontWeight:800, color:answers[q.id]===j?C.coral:C.muted }}>{['A','B','C','D'][j]}.</span> {op}
                  </button>
                ))}
              </div>
            </Card>
          ))}
          <Btn size="lg" full color={C.coral} onClick={handleSubmit} disabled={Object.keys(answers).length < data.preguntas.length}>
            Finalizar Evaluación
          </Btn>
        </>
      ) : (
        <Card style={{ textAlign:'center', padding:'40px 20px', background:`linear-gradient(180deg, ${pct>=70?C.green:pct>=50?C.amber:C.red}20, transparent)` }}>
          <div className="glow-text" style={{ fontFamily:"'Lora',serif", fontSize:'48px', fontWeight:800, color:pct>=70?C.green:pct>=50?C.amber:C.red }}>{pct}%</div>
          <div style={{ color:C.text, fontSize:'16px', marginTop:'8px', fontWeight:600 }}>Acertaste {score} de {data.preguntas.length} preguntas</div>
        </Card>
      )}
    </div>
  );
}

function PracticaView({ data }) {
  if (!data?.ejercicios) return null;
  return (
    <Card style={{ background:`linear-gradient(90deg, ${C.violet}20, transparent)`, borderColor:`${C.violet}40`, padding:'20px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}><Icons.Practice s={24} c={C.violet}/><span style={{ fontWeight:800, color:C.violet, fontSize:'16px' }}>Módulo Práctico</span></div>
      <div style={{ color:C.text, fontSize:'14px', lineHeight:1.5 }}>{data.introduccion}</div>
    </Card>
  );
}

// 🎮 EL JUEGO DE MEMORIA (Da Puntos XP)
function MemoriaView({ data, onEarnXP }) {
  const [flipped, setFlipped] = useState({});
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  // Evitar que ganen XP infinito por la misma respuesta
  const [awardedXP, setAwardedXP] = useState({});

  if (!data) return null;

  const flipCard = (index) => { setFlipped(prev => ({ ...prev, [index]: !prev[index] })); };

  const checkAnswer = (index, correcta) => {
    const userAns = (answers[index] || '').trim().toLowerCase();
    const rightAns = correcta.trim().toLowerCase();
    const isCorrect = userAns === rightAns;
    
    setResults(prev => ({ ...prev, [index]: isCorrect }));
    
    // 🎁 RECOMPENSA: 20 XP por rellenar correctamente (Solo la primera vez)
    if (isCorrect && !awardedXP[index]) {
      setAwardedXP(prev => ({ ...prev, [index]: true }));
      if (onEarnXP) onEarnXP(30); 
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      
      <Card style={{ background:`linear-gradient(90deg, ${C.pink}20, transparent)`, borderColor:`${C.pink}40`, padding:'20px 24px', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ width:48, height:48, borderRadius:'12px', background:C.pink, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icons.Memory s={28}/></div>
        <div>
          <div style={{ fontWeight:800, color:C.text, fontSize:'18px', marginBottom:'4px' }}>Módulo de Memoria</div>
          <div style={{ color:C.textSub, fontSize:'14px' }}>¡Gana 30 XP completando las oraciones!</div>
        </div>
      </Card>

      {data.tarjetasFlash?.length > 0 && (
        <div style={{ marginBottom:'20px' }}>
          <Section label="Tarjetas de Memoria" color={C.pink} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px', perspective:'1000px' }}>
            {data.tarjetasFlash.map((card, i) => (
              <div key={i} onClick={() => flipCard(i)} style={{ height:'160px', cursor:'pointer', position:'relative', transformStyle:'preserve-3d', transition:'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)', transform: flipped[i] ? 'rotateY(180deg)' : 'none' }}>
                <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden', background:C.card, border:`2px solid ${C.border}`, borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', textAlign:'center', boxShadow:`0 4px 20px ${C.bg}` }}>
                  <div style={{ color:C.pink, fontSize:'12px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px' }}>Toca para girar</div>
                  <div style={{ color:C.text, fontSize:'16px', fontWeight:700, lineHeight:1.4 }}>{card.anverso}</div>
                </div>
                <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden', background:`linear-gradient(135deg, ${C.pink}, #9d174d)`, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', textAlign:'center', transform:'rotateY(180deg)', boxShadow:`0 0 20px ${C.pink}40` }}>
                  <div style={{ color:'#fff', fontSize:'18px', fontWeight:800, lineHeight:1.4, textShadow:'0 2px 4px rgba(0,0,0,0.3)' }}>{card.reverso}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.completarOraciones?.length > 0 && (
        <div>
          <Section label="Desafío de Completar" color={C.accent} />
          <div style={{ display:'grid', gap:'16px' }}>
            {data.completarOraciones.map((ej, i) => {
              const parts = ej.oracion.split('___');
              const isCorrect = results[i] === true;
              const isWrong = results[i] === false;

              return (
                <Card key={i} className="glass" style={{ padding:'24px', borderLeft:`4px solid ${isCorrect?C.green:isWrong?C.red:C.accent}` }}>
                  <div style={{ fontSize:'16px', lineHeight:2, color:C.text }}>
                    {parts[0]}
                    <input 
                      type="text" 
                      value={answers[i] || ''}
                      onChange={(e) => {
                        setAnswers(prev => ({...prev, [i]: e.target.value}));
                        setResults(prev => ({...prev, [i]: null})); 
                      }}
                      placeholder="Escribe aquí..."
                      style={{ margin:'0 8px', background:C.surface, border:`2px dashed ${isCorrect?C.green:isWrong?C.red:C.borderHover}`, color: isCorrect?C.green:C.text, padding:'6px 12px', borderRadius:'8px', fontSize:'15px', fontWeight:700, outline:'none', width:'160px', textAlign:'center', transition:'all .2s' }}
                      disabled={isCorrect}
                    />
                    {parts[1]}
                  </div>
                  <div style={{ marginTop:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    {!isCorrect && <Btn small color={C.accent} onClick={() => checkAnswer(i, ej.respuesta)}>Comprobar</Btn>}
                    {isCorrect && <span style={{ color:C.green, fontWeight:700, fontSize:'14px' }}>¡Correcto! ✨ (+30 XP)</span>}
                    {isWrong && <span style={{ color:C.red, fontWeight:700, fontSize:'14px' }}>Intenta de nuevo ❌</span>}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}