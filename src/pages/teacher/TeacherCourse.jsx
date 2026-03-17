// src/pages/teacher/TeacherCourse.jsx — educ_AI v4.0 CYBERPUNK
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, getSubjectColor } from '@/theme';
import { Btn, Textarea, Alert, Spinner, Card, Badge, SectionHeader, EmptyState, Modal, Select } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getCourse, getCoursesByTeacher, listenClasses, createClass, deleteClass, getUsersBySchool } from '@/services/db';
import { getAtRiskStudents } from '@/services/analyticsService';
import { generateLearningStyles, extractTextFromPDF, analyzeDropoutRisk } from '@/services/aiService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const Ico = {
  Upload:  ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Magic:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-2 2.5h3L12 7h3l-4 5h3l-2 3h2l-3 7"/></svg>,
  Book:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Eye:     ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Plus:    ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Robot:   ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Student: ({s=20,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
};

// Tabs
function TabBtn({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:'10px 18px', borderRadius:'10px', border:'none',
      background:active?`${color}20`:C.surface, color:active?color:C.muted,
      cursor:'pointer', fontWeight:active?700:400, fontSize:'13px',
      border:`1.5px solid ${active?color:C.border}`,
      transition:'all .18s', fontFamily:"'Sora',sans-serif" }}>
      {label}
    </button>
  );
}

export default function TeacherCourse() {
  const { courseId }           = useParams();
  const { user, profile, schoolId } = useAuth();
  const navigate               = useNavigate();

  const [course,    setCourse]    = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [students,  setStudents]  = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const [tab,      setTab]      = useState('Panel');
  const [text,     setText]     = useState('');
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [pageLoad, setPageLoad] = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [analyzing, setAnalyzing] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [selStudent,  setSelStudent]  = useState('');
  const [assigning,   setAssigning]   = useState(false);
  const [previewClass, setPreviewClass] = useState(null);

  const loadData = async () => {
    if (!courseId||!schoolId||!user?.uid) return;
    setPageLoad(true);
    try {
      const tid = profile?.id || user.uid;
      const [cData, myCrs, sts, allSts] = await Promise.all([
        getCourse(courseId),
        getCoursesByTeacher(tid),
        getAtRiskStudents(courseId, schoolId),
        getUsersBySchool(schoolId, 'student'),
      ]);
      if (!cData) { navigate('/teacher'); return; }
      setCourse(cData); setMyCourses(myCrs);
      setStudents(sts); setAllStudents(allSts);
    } catch(e) { console.error(e); }
    setPageLoad(false);
  };

  useEffect(() => {
    loadData();
    const unsub = listenClasses(courseId, setClasses);
    return unsub;
  }, [courseId, schoolId, user?.uid]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept:{ 'application/pdf':[], 'image/*':[] },
    maxFiles:1,
    onDrop: useCallback(([f])=>{ setFile(f); setError(''); setSuccess(''); },[]),
  });

  const handlePublish = async () => {
    if (loading) return;
    setError(''); setSuccess('');
    if (!course) { setError('El curso aún está cargando. Espera un momento.'); return; }

    let rawContent = text.trim();
    if (file) {
      setLoading(true);
      try { rawContent = await extractTextFromPDF(file); }
      catch { setError('No se pudo leer el archivo. Intenta pegar el texto manualmente.'); setLoading(false); return; }
    }
    if (!rawContent||rawContent.length<5) { setError('El contenido es demasiado corto.'); setLoading(false); return; }

    setLoading(true);
    try {
      const subject = course.subject||course.name||'Materia';
      const grade   = course.grade||'';
      const tid     = profile?.id||user.uid;
      const content = await generateLearningStyles(rawContent, subject, grade);
      await createClass({ courseId, schoolId, teacherId:tid, rawContent, content, subject, grade });
      setText(''); setFile(null);
      setSuccess('✨ ¡Gemini generó la clase en 6 formatos de aprendizaje!');
      setTab('Panel');
      setTimeout(()=>setSuccess(''), 6000);
    } catch(e) { setError('Error comunicándose con Gemini. Intenta nuevamente.'); }
    setLoading(false);
  };

  const handleAnalyze = async (student) => {
    setAnalyzing(student.id); setAiInsight(null);
    try {
      const data = await analyzeDropoutRisk({ nombre:student.name, ...student.metrics });
      setAiInsight({ studentId:student.id, data });
    } catch(e) { console.error(e); }
    setAnalyzing(null);
  };

  const handleAssign = async () => {
    if (!selStudent) return;
    setAssigning(true); setError('');
    try {
      const st = allStudents.find(s=>s.id===selStudent);
      const newList = [...new Set([...(st.enrolledCourses||[]), courseId])];
      await updateDoc(doc(db,'users',selStudent), { enrolledCourses:newList });
      setSuccess(`✓ ${st.name} vinculado correctamente.`);
      setAssignModal(false); setSelStudent('');
      await loadData();
    } catch(e) { setError('Error al vincular el alumno.'); }
    setAssigning(false);
  };

  if (pageLoad) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <Spinner size={44}/>
    </div>
  );

  const themeColor = getSubjectColor(course?.subject||course?.name);
  const atRisk     = students.filter(s=>s.metrics?.riskScore<=39).length;
  const TABS = ['Panel','Nueva Clase','Alumnos'];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>

      {/* Aura ambiental de la materia */}
      <div style={{ position:'fixed', top:'-10%', left:'-10%', width:'60%', height:'60%',
        background:`radial-gradient(circle, ${themeColor}12 0%, transparent 65%)`,
        pointerEvents:'none', zIndex:0, transition:'background .6s' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'50%', height:'50%',
        background:`radial-gradient(circle, ${themeColor}08 0%, transparent 60%)`,
        pointerEvents:'none', zIndex:0 }} />

      <Navbar customColor={themeColor} />
      <main style={{ maxWidth:'1000px', margin:'0 auto', padding:'28px 20px', position:'relative', zIndex:1 }}>

        {/* ── HEADER INMERSIVO ─────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'20px 24px',
            borderRadius:'18px', background:themeColor,
            boxShadow:`0 12px 35px -8px ${themeColor}60`,
            position:'relative', overflow:'hidden' }}>

            {/* Glow decorativo */}
            <div style={{ position:'absolute', top:'-30%', right:'-5%', width:'180px', height:'180px',
              background:'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
              filter:'blur(15px)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', right:'-5px', bottom:'-10px', fontSize:'80px',
              fontFamily:"'Press Start 2P',cursive", fontWeight:900,
              color:'rgba(0,0,0,0.08)', pointerEvents:'none', lineHeight:1 }}>
              {(myCourses.findIndex(c=>c.id===courseId)+1).toString().padStart(2,'0')}
            </div>

            <div style={{ width:52,height:52,borderRadius:'14px',
              background:'rgba(0,0,0,0.12)', color:'#000',
              display:'flex',alignItems:'center',justifyContent:'center', zIndex:1 }}>
              <Ico.Book s={26}/>
            </div>

            <div style={{ flex:1, zIndex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', color:'rgba(0,0,0,0.5)', textTransform:'uppercase',
                fontWeight:900, letterSpacing:'.08em', marginBottom:'3px' }}>Materia Actual</div>
              <select value={courseId} onChange={e=>navigate(`/teacher/course/${e.target.value}`)}
                style={{ background:'transparent', border:'none', fontSize:'22px', fontWeight:900,
                  color:'#000', outline:'none', cursor:'pointer', width:'100%',
                  fontFamily:"'Lora',serif" }}>
                {myCourses.map(c=>(
                  <option key={c.id} value={c.id}
                    style={{ background:C.surface, color:C.text, fontSize:'15px' }}>
                    {c.name} — {c.grade||'General'}
                  </option>
                ))}
              </select>
            </div>

            {atRisk > 0 && (
              <span style={{ background:'rgba(239,68,68,0.9)', color:'#fff',
                borderRadius:'20px', padding:'5px 12px', fontSize:'12px', fontWeight:800,
                zIndex:1, flexShrink:0 }}>
                🔴 {atRisk} en riesgo
              </span>
            )}

            <button onClick={()=>navigate('/teacher')}
              style={{ background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.2)',
                borderRadius:'10px', padding:'10px 16px', cursor:'pointer', color:'#000',
                fontSize:'13px', fontWeight:800, zIndex:1, flexShrink:0, transition:'.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.22)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.12)'}>
              ← Volver
            </button>
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
          {TABS.map(t => <TabBtn key={t} label={t} active={tab===t} color={themeColor} onClick={()=>setTab(t)} />)}
        </div>

        {success && <div style={{ marginBottom:'16px' }}><Alert type="success">{success}</Alert></div>}

        {/* ════════════════════════════════════════════════════════════════
            TAB: PANEL
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'Panel' && (
          <div className="anim-fade-up">
            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',
              gap:'12px', marginBottom:'26px' }}>
              {[
                { l:'Clases publicadas', v:classes.length, c:themeColor },
                { l:'Alumnos',          v:students.length, c:C.green },
                { l:'En riesgo',        v:atRisk,          c:C.red   },
                { l:'Observación',      v:students.filter(s=>s.metrics?.riskScore>39&&s.metrics?.riskScore<=69).length, c:C.amber },
              ].map(k=>(
                <div key={k.l} style={{ background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:'14px', padding:'16px', textAlign:'center',
                  position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0,
                    background:`radial-gradient(circle at 50% 0%, ${k.c}15 0%, transparent 70%)`,
                    pointerEvents:'none' }} />
                  <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:'22px',
                    color:k.c, marginBottom:'5px', fontWeight:700 }}>{k.v}</div>
                  <div style={{ fontSize:'10px', color:C.muted, textTransform:'uppercase',
                    letterSpacing:'.04em', fontWeight:600 }}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Accesos rápidos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'26px' }}>
              <button onClick={()=>setTab('Nueva Clase')} style={{ all:'unset', cursor:'pointer' }}>
                <div style={{ background:`linear-gradient(135deg, ${themeColor}, ${themeColor}80)`,
                  borderRadius:'14px', padding:'20px', display:'flex', alignItems:'center', gap:'14px',
                  transition:'filter .2s' }}
                  onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
                  onMouseLeave={e=>e.currentTarget.style.filter='none'}>
                  <Ico.Upload s={26} c="#000"/>
                  <div>
                    <div style={{ fontWeight:800, color:'#000', fontSize:'14px' }}>Publicar nueva clase</div>
                    <div style={{ color:'rgba(0,0,0,0.55)', fontSize:'12px', marginTop:'2px' }}>
                      Genera 6 mundos con IA
                    </div>
                  </div>
                </div>
              </button>
              <button onClick={()=>setTab('Alumnos')} style={{ all:'unset', cursor:'pointer' }}>
                <div style={{ background:C.surface, border:`2px solid ${C.border}`,
                  borderRadius:'14px', padding:'20px', display:'flex', alignItems:'center', gap:'14px',
                  transition:'all .2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.violet;e.currentTarget.style.boxShadow=`0 4px 15px ${C.violet}15`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none';}}>
                  <Ico.Student s={26} c={C.violet}/>
                  <div>
                    <div style={{ fontWeight:700, color:C.text, fontSize:'14px' }}>Ver alumnos</div>
                    <div style={{ color:C.muted, fontSize:'12px', marginTop:'2px' }}>Analítica de riesgo</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Bitácora de clases */}
            <SectionHeader title="Clases publicadas"
              sub={`${classes.length} en esta materia`}
              action={<Btn small color={themeColor} onClick={()=>setTab('Nueva Clase')}
                icon={<Ico.Plus s={13}/>}>Nueva Clase</Btn>} />

            {classes.length === 0 ? (
              <EmptyState emoji="📭" title="Sin clases aún"
                desc="Publica la primera clase en la pestaña 'Nueva Clase'"
                action={<Btn small onClick={()=>setTab('Nueva Clase')}>+ Publicar ahora</Btn>} />
            ) : (
              <div style={{ display:'grid', gap:'14px' }}>
                {classes.map((cls,i) => (
                  <div key={cls.id}
                    className={`anim-fade-up anim-d${Math.min(i+1,5)}`}
                    onClick={()=>setPreviewClass(cls)}
                    style={{ background:`linear-gradient(145deg, #050a10 0%, ${themeColor}30 100%)`,
                      border:`1px solid ${themeColor}45`, borderRadius:'16px',
                      padding:'18px 22px', cursor:'pointer', transition:'all .25s',
                      position:'relative', overflow:'hidden',
                      boxShadow:`inset 0 0 18px rgba(0,0,0,0.7)` }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 10px 28px ${themeColor}35, inset 0 0 18px rgba(0,0,0,0.7)`;e.currentTarget.style.borderColor=themeColor;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`inset 0 0 18px rgba(0,0,0,0.7)`;e.currentTarget.style.borderColor=`${themeColor}45`;}}>

                    <div style={{ position:'absolute', right:'-5px', bottom:'-12px', fontSize:'90px',
                      fontFamily:"'Press Start 2P',cursive", color:themeColor, opacity:.05,
                      pointerEvents:'none', lineHeight:1 }}>
                      {(i+1).toString().padStart(2,'0')}
                    </div>

                    <div style={{ display:'flex', alignItems:'flex-start',
                      justifyContent:'space-between', gap:'14px', position:'relative', zIndex:1 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                          <span style={{ background:themeColor, color:'#000', borderRadius:'8px',
                            padding:'4px 10px', fontSize:'10px', fontWeight:900,
                            textTransform:'uppercase', letterSpacing:'.06em',
                            boxShadow:`0 0 10px ${themeColor}50` }}>
                            MISIÓN {(i+1).toString().padStart(2,'0')}
                          </span>
                          <span style={{ color:C.muted, fontSize:'11px' }}>
                            {cls.createdAt?.toDate?.().toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:'17px', color:C.text, marginBottom:'12px' }}>
                          {cls.content?.titulo || 'Clase sin título'}
                        </div>
                        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                          {STYLES.map(s => {
                            if (!cls.content?.[s.id]) return null;
                            return (
                              <span key={s.id} style={{ display:'flex', alignItems:'center', gap:'5px',
                                background:`rgba(0,0,0,0.35)`, color:C.muted,
                                border:`1px solid ${C.borderHover}`, borderRadius:'8px',
                                padding:'4px 10px', fontSize:'11px', fontWeight:600 }}>
                                <span style={{ color:s.color, display:'flex' }}>{s.icon}</span>
                                {s.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                        <button onClick={e=>{e.stopPropagation();setPreviewClass(cls);}}
                          style={{ display:'flex', alignItems:'center', gap:'5px',
                            background:`${themeColor}15`, border:`1px solid ${themeColor}40`,
                            color:themeColor, borderRadius:'10px', padding:'9px 13px',
                            cursor:'pointer', fontSize:'12px', fontWeight:700, transition:'.18s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=`${themeColor}28`}
                          onMouseLeave={e=>e.currentTarget.style.background=`${themeColor}15`}>
                          <Ico.Eye s={13}/> Ver
                        </button>
                        <button onClick={e=>{e.stopPropagation();if(window.confirm('¿Eliminar esta misión?'))deleteClass(cls.id);}}
                          style={{ display:'flex', alignItems:'center', gap:'5px',
                            background:`${C.red}12`, border:`1px solid ${C.red}35`,
                            color:C.red, borderRadius:'10px', padding:'9px 13px',
                            cursor:'pointer', fontSize:'12px', fontWeight:700, transition:'.18s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=`${C.red}25`}
                          onMouseLeave={e=>e.currentTarget.style.background=`${C.red}12`}>
                          <Ico.Trash s={13}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: NUEVA CLASE
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'Nueva Clase' && (
          <div className="anim-fade-up">
            <Card style={{ padding:'26px', border:`1px solid ${themeColor}30` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px' }}>
                <div style={{ padding:'10px', background:`${themeColor}15`, borderRadius:'12px',
                  color:themeColor }}>
                  <Ico.Magic s={24}/>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'16px', marginBottom:'3px' }}>
                    Laboratorio de Contenido IA
                  </div>
                  <div style={{ color:C.muted, fontSize:'13px' }}>
                    Sube un PDF o escribe el tema → Gemini genera 6 mundos de aprendizaje
                  </div>
                </div>
              </div>

              {/* Dropzone */}
              <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive?themeColor:C.borderHover}`,
                borderRadius:'16px', padding:'30px', textAlign:'center', cursor:'pointer',
                transition:'all .25s', background:isDragActive?`${themeColor}10`:C.surface,
                marginBottom:'18px' }}>
                <input {...getInputProps()}/>
                {file ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                    <div style={{ width:48,height:48,background:themeColor,color:'#000',
                      borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:'22px', boxShadow:`0 0 15px ${themeColor}60` }}>
                      {file.type==='application/pdf'?'📄':'🖼️'}
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontWeight:700, color:C.text }}>{file.name}</div>
                      <div style={{ fontSize:'12px', color:C.muted }}>
                        {(file.size/1024).toFixed(1)} KB · Listo para procesar
                      </div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setFile(null);}}
                      style={{ background:`${C.red}15`, border:`1px solid ${C.red}30`,
                        color:C.red, borderRadius:'20px', padding:'4px 10px',
                        cursor:'pointer', fontWeight:700, fontSize:'12px' }}>
                      Quitar
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ color:themeColor, marginBottom:'12px' }}><Ico.Upload s={36}/></div>
                    <div style={{ fontWeight:700, color:C.text, fontSize:'14px' }}>
                      {isDragActive?'¡Suéltalo aquí!':'Arrastra un PDF o imagen de la pizarra'}
                    </div>
                    <div style={{ color:C.muted, fontSize:'12px', marginTop:'5px' }}>
                      Gemini lee el archivo y crea el contenido automáticamente
                    </div>
                  </>
                )}
              </div>

              {/* Separador */}
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'18px' }}>
                <div style={{ flex:1, height:'1px', background:C.border }}/>
                <span style={{ color:C.muted, fontSize:'11px', textTransform:'uppercase', fontWeight:700 }}>
                  o escribe manualmente
                </span>
                <div style={{ flex:1, height:'1px', background:C.border }}/>
              </div>

              <Textarea placeholder="Escribe los puntos clave de tu clase o pega el texto aquí..."
                value={text} onChange={e=>setText(e.target.value)}
                style={{ minHeight:'140px', marginBottom:'18px', fontSize:'14px', lineHeight:'1.6' }} />

              {error && <div style={{ marginBottom:'14px' }}><Alert type="error">{error}</Alert></div>}

              {loading ? (
                <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'18px 22px',
                  background:`${themeColor}10`, borderRadius:'14px', border:`1px solid ${themeColor}30` }}>
                  <Spinner size={24} color={themeColor}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'14px', color:themeColor }}>
                      Gemini está generando los 6 mundos de aprendizaje...
                    </div>
                    <div style={{ height:'5px', background:`${themeColor}20`, borderRadius:'3px',
                      marginTop:'8px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:'40%', background:themeColor,
                        borderRadius:'3px', animation:'shimmer 1.5s infinite' }}/>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={handlePublish} style={{ width:'100%', padding:'16px',
                  background:themeColor, color:'#000', border:'none', borderRadius:'12px',
                  fontSize:'15px', fontWeight:900, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                  boxShadow:`0 4px 18px ${themeColor}50`, transition:'.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
                  onMouseLeave={e=>e.currentTarget.style.filter='none'}>
                  <Ico.Magic s={18}/> Generar Clase con IA
                </button>
              )}
            </Card>

            {/* Mini preview de estilos */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
              gap:'10px', marginTop:'18px' }}>
              {STYLES.map(s=>(
                <div key={s.id} style={{ background:s.soft, border:`1px solid ${s.color}25`,
                  borderRadius:'10px', padding:'12px 14px',
                  display:'flex', alignItems:'center', gap:'9px' }}>
                  <span style={{ display:'flex', alignItems:'center', color:s.color }}>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'12px', color:s.color }}>{s.label}</div>
                    <div style={{ color:C.muted, fontSize:'11px', marginTop:'1px' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: ALUMNOS
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'Alumnos' && (
          <div className="anim-fade-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {[
                  { c:C.red,   l:`🔴 En riesgo: ${students.filter(s=>s.metrics?.riskScore<=39).length}` },
                  { c:C.amber, l:`🟡 Observación: ${students.filter(s=>{const x=s.metrics?.riskScore??100;return x>39&&x<=69;}).length}` },
                  { c:C.green, l:`🟢 Bien: ${students.filter(s=>(s.metrics?.riskScore??100)>69).length}` },
                ].map(p=>(
                  <span key={p.l} style={{ background:`${p.c}12`, color:p.c,
                    border:`1px solid ${p.c}30`, borderRadius:'20px',
                    padding:'5px 13px', fontSize:'12px', fontWeight:700 }}>{p.l}</span>
                ))}
              </div>
              <Btn small color={themeColor} onClick={()=>setAssignModal(true)}
                icon={<Ico.Plus s={13}/>}>
                Vincular Alumno
              </Btn>
            </div>

            {students.length === 0 ? (
              <EmptyState emoji="🎒" title="Sin alumnos"
                desc="No hay alumnos vinculados a esta materia." />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[...students].sort((a,b)=>(a.metrics?.riskScore??100)-(b.metrics?.riskScore??100))
                  .map((s,i) => {
                    const m  = s.metrics||{riskScore:100,totalSessions:0,daysSinceLastActivity:999};
                    const rc = m.riskScore<=39?C.red:m.riskScore<=69?C.amber:C.green;
                    const isMyInsight = aiInsight?.studentId===s.id;
                    return (
                      <Card key={s.id} style={{ borderLeft:`3px solid ${rc}`, padding:'18px 20px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start',
                          justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                          <div style={{ display:'flex', gap:'12px', flex:1, minWidth:'200px' }}>
                            <div style={{ width:44,height:44,borderRadius:'50%',flexShrink:0,
                              background:`${rc}15`, border:`2px solid ${rc}30`,
                              display:'flex',alignItems:'center',justifyContent:'center',
                              fontWeight:800,color:rc,fontSize:'16px' }}>
                              {s.name.charAt(0)}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'5px' }}>
                                {s.name}
                              </div>
                              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                                {[
                                  { v:`📚 ${m.totalSessions} ses.` },
                                  m.avgQuizScore!=null&&{ v:`🎯 ${m.avgQuizScore}%` },
                                  { v:`📅 ${m.daysSinceLastActivity===999?'Nunca':`Hace ${m.daysSinceLastActivity}d`}`,
                                    bold:m.daysSinceLastActivity>7, red:m.daysSinceLastActivity>14 },
                                  m.trend==='declining'&&{ v:'↓ Bajando', red:true },
                                  m.trend==='improving'&&{ v:'↑ Mejorando', green:true },
                                ].filter(Boolean).map((stat,j)=>(
                                  <span key={j} style={{ color:stat.red?C.red:stat.green?C.green:C.muted,
                                    fontSize:'12px', fontWeight:stat.bold||stat.red||stat.green?700:400 }}>
                                    {stat.v}
                                  </span>
                                ))}
                              </div>
                              {m.riskReasons?.length>0&&(
                                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'7px' }}>
                                  {m.riskReasons.map((r,j)=>(
                                    <span key={j} style={{ background:C.surface, color:C.muted,
                                      borderRadius:'20px', padding:'2px 8px',
                                      fontSize:'11px', border:`1px solid ${C.border}` }}>{r}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
                            <RiskBadge score={m.riskScore} size="lg"/>
                            <Btn small outline color={C.violet}
                              loading={analyzing===s.id}
                              onClick={()=>handleAnalyze(s)}
                              icon={<Ico.Robot s={13}/>}>
                              Análisis IA
                            </Btn>
                          </div>
                        </div>

                        {/* Panel de análisis IA */}
                        {isMyInsight && aiInsight.data && (
                          <div className="anim-fade-up" style={{ marginTop:'16px', padding:'16px 18px',
                            background:`${C.violet}08`, border:`1px solid ${C.violet}25`,
                            borderRadius:'12px' }}>
                            <div style={{ fontWeight:700, color:C.violet, marginBottom:'10px',
                              display:'flex', alignItems:'center', gap:'7px' }}>
                              <Ico.Robot s={15} c={C.violet}/> Análisis Gemini
                            </div>
                            <p style={{ color:C.text, fontSize:'13px', lineHeight:1.75,
                              marginBottom:'14px' }}>{aiInsight.data.resumen}</p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                              {aiInsight.data.factores?.length>0&&(
                                <div>
                                  <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase',
                                    marginBottom:'6px', fontWeight:600 }}>Factores de riesgo</div>
                                  {aiInsight.data.factores.map((f,j)=>(
                                    <div key={j} style={{ color:C.red, fontSize:'12px', marginBottom:'4px' }}>
                                      • {f}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {aiInsight.data.recomendaciones?.length>0&&(
                                <div>
                                  <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase',
                                    marginBottom:'6px', fontWeight:600 }}>Recomendaciones</div>
                                  {aiInsight.data.recomendaciones.map((r,j)=>(
                                    <div key={j} style={{ color:C.green, fontSize:'12px', marginBottom:'4px' }}>
                                      ✓ {r}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {aiInsight.data.mensajeAlumno&&(
                              <div style={{ marginTop:'12px', padding:'11px 14px',
                                background:C.surface, borderRadius:'9px',
                                border:`1px solid ${C.border}` }}>
                                <div style={{ fontSize:'11px', color:C.accent,
                                  fontWeight:700, textTransform:'uppercase', marginBottom:'5px' }}>
                                  💬 Mensaje sugerido para el alumno
                                </div>
                                <p style={{ color:C.text, fontSize:'13px', fontStyle:'italic',
                                  lineHeight:1.65 }}>"{aiInsight.data.mensajeAlumno}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MODAL: VINCULAR ALUMNO ─────────────────────────────────────── */}
      <Modal open={assignModal} onClose={()=>{setAssignModal(false);setError('');}} title="Vincular Alumno al Curso">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ background:`${themeColor}10`, border:`1px solid ${themeColor}25`,
            borderRadius:'10px', padding:'12px 16px',
            display:'flex', alignItems:'center', gap:'12px' }}>
            <Ico.Student s={20} c={themeColor}/>
            <div style={{ fontSize:'13px', color:C.textSub }}>
              Selecciona un estudiante del colegio para vincularlo a esta materia.
            </div>
          </div>
          <Select label="Estudiante"
            value={selStudent}
            onChange={e=>setSelStudent(e.target.value)}
            options={[
              {value:'',label:'Selecciona un alumno...'},
              ...allStudents
                .filter(s=>!(s.enrolledCourses||[]).includes(courseId))
                .sort((a,b)=>a.name.localeCompare(b.name))
                .map(s=>({value:s.id,label:`${s.name} (${s.rut})`}))
            ]} />
          {error && <Alert type="error">{error}</Alert>}
          <Btn full color={themeColor} onClick={handleAssign}
            loading={assigning} disabled={!selStudent}>
            Confirmar Matrícula
          </Btn>
        </div>
      </Modal>

      {/* ── MODAL: PREVISUALIZAR CLASE ────────────────────────────────── */}
      <Modal open={!!previewClass} onClose={()=>setPreviewClass(null)} title="Vista Previa de la Misión">
        {previewClass && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px',
            maxHeight:'70vh', overflowY:'auto', paddingRight:'4px' }}>
            <div style={{ background:C.surface, padding:'18px', borderRadius:'12px',
              borderLeft:`4px solid ${themeColor}` }}>
              <div style={{ fontWeight:800, fontSize:'18px', color:C.text, marginBottom:'8px' }}>
                {previewClass.content?.titulo}
              </div>
              <p style={{ color:C.textSub, fontSize:'13px', lineHeight:1.65 }}>
                {previewClass.content?.resumenBreve}
              </p>
            </div>
            {previewClass.content?.imagenSugerida && (
              <div style={{ background:`${themeColor}08`, padding:'14px',
                borderRadius:'10px', border:`1px solid ${themeColor}20` }}>
                <div style={{ fontSize:'10px', color:themeColor, fontWeight:800,
                  textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'5px' }}>
                  🎨 Prompt de imagen IA
                </div>
                <div style={{ color:C.text, fontSize:'13px', fontStyle:'italic' }}>
                  "{previewClass.content.imagenSugerida}"
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize:'12px', fontWeight:700, color:C.muted,
                textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'10px' }}>
                Módulos de aprendizaje generados:
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {STYLES.map(s=>{
                  if (!previewClass.content?.[s.id]) return null;
                  return (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'12px',
                      background:C.card, padding:'11px 14px', borderRadius:'10px',
                      border:`1px solid ${C.border}` }}>
                      <div style={{ width:32,height:32,borderRadius:'8px',
                        background:s.soft, color:s.color,
                        display:'flex',alignItems:'center',justifyContent:'center' }}>
                        {s.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'13px', color:C.text }}>{s.label}</div>
                        <div style={{ color:C.muted, fontSize:'11px' }}>{s.desc}</div>
                      </div>
                      <span style={{ background:`${C.green}15`, color:C.green, fontSize:'11px',
                        fontWeight:700, borderRadius:'20px', padding:'3px 10px',
                        border:`1px solid ${C.green}30` }}>
                        ✓ Listo
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}