import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES } from '@/theme';
import { Btn, Textarea, Alert, Spinner, Card, Badge, SectionHeader, EmptyState, Tabs } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getCourse, listenClasses, createClass, deleteClass } from '@/services/db';
import { getAtRiskStudents } from '@/services/analyticsService';
import { generateLearningStyles, extractTextFromPDF, analyzeDropoutRisk } from '@/services/aiService';

export default function TeacherCourse() {
  const { courseId }    = useParams();
  const { user, schoolId } = useAuth();
  const navigate        = useNavigate();
  const [course, setCourse]   = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab]   = useState('Clases');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [pageLoad, setPageLoad] = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [analyzing, setAnalyzing] = useState(null); 
  const [aiInsight, setAiInsight] = useState(null); 

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf':[], 'image/*':[] },
    maxFiles: 1,
    onDrop: useCallback(([f]) => { setFile(f); setError(''); }, []),
  });

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([getCourse(courseId), getAtRiskStudents(courseId, schoolId)]);
      setCourse(c); setStudents(s); setPageLoad(false);
    })();
    const unsub = listenClasses(courseId, setClasses);
    return unsub;
  }, [courseId]);

  const handlePublish = async () => {
    setError(''); setSuccess('');
    let rawContent = text.trim();
    if (file) {
      setLoading(true);
      try {
        if (file.type === 'application/pdf') rawContent = await extractTextFromPDF(file);
        else rawContent = `[Imagen de clase: ${file.name}]`;
      } catch { setError('Error procesando el archivo.'); setLoading(false); return; }
    }
    if (!rawContent) { setError('Escribe el contenido o sube un archivo.'); setLoading(false); return; }
    setLoading(true);
    try {
      const content = await generateLearningStyles(rawContent, course.subject, course.grade);
      await createClass({ courseId, schoolId, teacherId: user.uid, rawContent, content, subject: course.subject, grade: course.grade });
      setText(''); setFile(null);
      setSuccess('✓ Clase publicada con 5 estilos de aprendizaje');
      setTimeout(() => setSuccess(''), 4000);
    } catch(e) { setError(e.message || 'Error generando contenido. Intenta de nuevo.'); }
    setLoading(false);
  };

  const handleAnalyzeStudent = async (student) => {
    setAnalyzing(student.id); setAiInsight(null);
    try {
      const data = await analyzeDropoutRisk({ nombre: student.name, ...student.metrics });
      setAiInsight({ studentId: student.id, data });
    } catch(e) { console.error(e); }
    setAnalyzing(null);
  };

  // Función para exportar los alumnos a Excel
  const exportStudentsToExcel = () => {
    const headers = ['Nombre', 'Nivel de Riesgo', 'Score IA', 'Sesiones Totales', 'Promedio Quiz', 'Último Acceso'];
    const rows = students.map(s => [
      s.name,
      s.metrics.riskScore <= 39 ? 'Riesgo Alto' : s.metrics.riskScore <= 69 ? 'Observación' : 'Bien',
      s.metrics.riskScore,
      s.metrics.totalSessions || 0,
      s.metrics.avgQuizScore ? `${s.metrics.avgQuizScore}%` : 'N/A',
      s.metrics.daysSinceLastActivity === 999 ? 'Nunca' : `Hace ${s.metrics.daysSinceLastActivity} días`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Alumnos_${course?.name?.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (pageLoad) return <div style={{ minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center' }}><Spinner size={40} /></div>;

  const atRiskCount    = students.filter(s=>s.metrics.riskScore<=39).length;
  const watchingCount  = students.filter(s=>s.metrics.riskScore>39&&s.metrics.riskScore<=69).length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Navbar />
      <main style={{ maxWidth:'1000px', margin:'0 auto', padding:'30px 20px' }}>

        <div className="anim-fade-up" style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'26px' }}>
          <button onClick={()=>navigate('/teacher')} style={{ background:`${C.accent}15`,border:`1px solid ${C.accent}30`,borderRadius:'8px',padding:'6px 12px',cursor:'pointer',color:C.accent,fontSize:'13px',fontWeight:600 }}>← Volver</button>
          <div>
            <h1 style={{ fontFamily:"'Lora',serif", fontSize:'22px', fontWeight:700 }}>{course?.name}</h1>
            <p style={{ color:C.muted, fontSize:'12px' }}>{course?.subject} · {course?.grade}</p>
          </div>
          {atRiskCount > 0 && <span style={{ background:C.redSoft,color:C.red,border:`1px solid ${C.red}40`,borderRadius:'20px',padding:'4px 12px',fontSize:'12px',fontWeight:700,marginLeft:'auto' }}>🔴 {atRiskCount} en riesgo</span>}
        </div>

        <Tabs tabs={['Clases','Alumnos']} active={tab} onChange={setTab} />

        {/* ── TAB CLASES ── */}
        {tab === 'Clases' && (
          <div className="anim-fade-up">
            <Card style={{ marginBottom:'24px', padding:'22px' }}>
              <SectionHeader title="📤 Publicar nueva clase" sub="El contenido se convierte en 5 estilos de aprendizaje con IA" />

              <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive?C.accent:C.border}`, borderRadius:'12px', padding:'22px', textAlign:'center', cursor:'pointer', transition:'all .2s', background:isDragActive?`${C.accent}08`:'transparent', marginBottom:'14px' }}>
                <input {...getInputProps()} />
                {file ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                    <span style={{ fontSize:'22px' }}>{file.type==='application/pdf'?'📄':'🖼️'}</span>
                    <span style={{ fontWeight:600, color:C.text }}>{file.name}</span>
                    <button onClick={e=>{e.stopPropagation();setFile(null);}} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'18px' }}>×</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>📁</div>
                    <div style={{ color:C.muted, fontSize:'13px' }}>{isDragActive?'Suelta el archivo aquí':'Arrastra un PDF o imagen de la pizarra'}</div>
                  </>
                )}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                <div style={{ flex:1,height:'1px',background:C.border }} />
                <span style={{ color:C.muted,fontSize:'12px' }}>o escribe / pega el contenido</span>
                <div style={{ flex:1,height:'1px',background:C.border }} />
              </div>

              <Textarea
                id="content"
                placeholder="Pega o escribe el contenido de la clase aquí..."
                value={text} onChange={e=>setText(e.target.value)}
                style={{ minHeight:'110px', marginBottom:'14px' }}
              />

              {error   && <div style={{ marginBottom:'12px' }}><Alert type="error">{error}</Alert></div>}
              {success && <div style={{ marginBottom:'12px' }}><Alert type="success">{success}</Alert></div>}

              {loading ? (
                <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px', background:C.accentSoft, borderRadius:'12px' }}>
                  <Spinner size={22} />
                  <div>
                    <div style={{ fontWeight:600, fontSize:'14px' }}>Gemini está generando los 5 estilos...</div>
                    <div style={{ color:C.muted, fontSize:'12px', marginTop:'2px' }}>Esto tarda unos segundos</div>
                  </div>
                </div>
              ) : (
                <Btn full onClick={handlePublish} icon="✨">Publicar clase con IA</Btn>
              )}
            </Card>

            <SectionHeader title="Clases publicadas" sub={`${classes.length} en este curso`} />
            {classes.length === 0 ? (
              <EmptyState emoji="📭" title="Sin clases aún" desc="Publica la primera clase arriba" />
            ) : (
              <div style={{ display:'grid', gap:'11px' }}>
                {classes.map((cls, i) => (
                  <Card key={cls.id} className={`anim-fade-up anim-d${Math.min(i+1,5)}`} style={{ padding:'16px 18px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'5px' }}>
                          {cls.content?.titulo || 'Clase sin título'}
                        </div>
                        <div style={{ color:C.muted, fontSize:'12px', marginBottom:'8px' }}>
                          {cls.createdAt?.toDate?.().toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' }) || '—'}
                        </div>
                        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                          {STYLES.map(s => <span key={s.id} style={{ background:s.soft,color:s.color,borderRadius:'20px',padding:'2px 9px',fontSize:'11px',fontWeight:600 }}>{s.emoji}</span>)}
                        </div>
                      </div>
                      <button onClick={()=>deleteClass(cls.id)} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'16px',flexShrink:0 }} title="Eliminar">🗑️</button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB ALUMNOS ── */}
        {tab === 'Alumnos' && (
          <div className="anim-fade-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <span style={{ background:C.redSoft,color:C.red,borderRadius:'20px',padding:'5px 14px',fontSize:'12px',fontWeight:700 }}>🔴 En riesgo: {atRiskCount}</span>
                <span style={{ background:C.amberSoft,color:C.amber,borderRadius:'20px',padding:'5px 14px',fontSize:'12px',fontWeight:700 }}>🟡 En observación: {watchingCount}</span>
                <span style={{ background:C.greenSoft,color:C.green,borderRadius:'20px',padding:'5px 14px',fontSize:'12px',fontWeight:700 }}>🟢 Bien: {students.filter(s=>s.metrics.riskScore>69).length}</span>
              </div>
              <Btn small outline onClick={exportStudentsToExcel}>📊 Exportar Excel</Btn>
            </div>

            {students.length === 0 ? (
              <EmptyState emoji="🎒" title="Sin alumnos" desc="No hay alumnos en este curso aún" />
            ) : (
              <div style={{ display:'grid', gap:'12px' }}>
                {students.map((s, i) => {
                  const m        = s.metrics;
                  const isMyInsight = aiInsight?.studentId === s.id;
                  return (
                    <Card key={s.id} className={`anim-fade-up anim-d${Math.min(i+1,5)}`}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                        <div style={{ display:'flex', gap:'12px', flex:1 }}>
                          <div style={{ width:42,height:42,borderRadius:'50%',background:`${C.accent}15`,border:`2px solid ${C.accent}30`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.accent,flexShrink:0 }}>{s.name?.[0]?.toUpperCase()}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, marginBottom:'4px' }}>{s.name}</div>
                            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                              <span style={{ color:C.muted,fontSize:'12px' }}>📚 {m.totalSessions} sesiones</span>
                              {m.avgQuizScore!=null && <span style={{ color:C.muted,fontSize:'12px' }}>🎯 {m.avgQuizScore}%</span>}
                              <span style={{ color:m.daysSinceLastActivity>7?C.red:C.muted,fontSize:'12px' }}>
                                📅 {m.daysSinceLastActivity===999?'Nunca conectado':`hace ${m.daysSinceLastActivity}d`}
                              </span>
                              {m.trend==='declining' && <span style={{ color:C.red,fontSize:'12px',fontWeight:600 }}>↓ Bajando</span>}
                              {m.trend==='improving' && <span style={{ color:C.green,fontSize:'12px',fontWeight:600 }}>↑ Mejorando</span>}
                            </div>
                            {m.riskReasons?.length > 0 && (
                              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'6px' }}>
                                {m.riskReasons.map((r,j) => <span key={j} style={{ background:C.surface,color:C.muted,borderRadius:'20px',padding:'2px 8px',fontSize:'11px' }}>{r}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0 }}>
                          <RiskBadge score={m.riskScore} size="lg" />
                          <Btn small outline color={C.violet} loading={analyzing===s.id} onClick={()=>handleAnalyzeStudent(s)} icon="🤖">Análisis IA</Btn>
                        </div>
                      </div>

                      {isMyInsight && aiInsight.data && (
                        <div style={{ marginTop:'16px', padding:'16px', background:`${C.violet}08`, border:`1px solid ${C.violet}25`, borderRadius:'12px' }}>
                          <div style={{ fontWeight:700, color:C.violet, marginBottom:'10px' }}>🤖 Análisis de Gemini</div>
                          <p style={{ color:C.text, fontSize:'13px', lineHeight:1.65, marginBottom:'12px' }}>{aiInsight.data.resumen}</p>
                          <div style={{ marginBottom:'10px' }}>
                            <div style={{ fontWeight:600, fontSize:'12px', color:C.textSub, marginBottom:'5px', textTransform:'uppercase', letterSpacing:'.05em' }}>Factores de riesgo</div>
                            {aiInsight.data.factores?.map((f,j) => <div key={j} style={{ color:C.red,fontSize:'12px',marginBottom:'3px' }}>• {f}</div>)}
                          </div>
                          <div style={{ marginBottom:'10px' }}>
                            <div style={{ fontWeight:600, fontSize:'12px', color:C.textSub, marginBottom:'5px', textTransform:'uppercase', letterSpacing:'.05em' }}>Recomendaciones para ti</div>
                            {aiInsight.data.recomendaciones?.map((r,j) => <div key={j} style={{ color:C.green,fontSize:'12px',marginBottom:'3px' }}>✓ {r}</div>)}
                          </div>
                          {aiInsight.data.mensajeAlumno && (
                            <div style={{ background:C.accentSoft, borderRadius:'8px', padding:'10px 13px', marginTop:'8px' }}>
                              <div style={{ fontWeight:600, fontSize:'11px', color:C.accent, marginBottom:'4px', textTransform:'uppercase' }}>Mensaje sugerido para el alumno</div>
                              <p style={{ color:C.text, fontSize:'13px', fontStyle:'italic' }}>"{aiInsight.data.mensajeAlumno}"</p>
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
    </div>
  );
}