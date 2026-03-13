import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { C, STYLES, getSubjectColor } from '@/theme';
import { Btn, Textarea, Alert, Spinner, Card, Badge, SectionHeader, EmptyState, Tabs, Modal, Select } from '@/components/ui';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { getCourse, getCoursesByTeacher, listenClasses, createClass, deleteClass, getUsersBySchool } from '@/services/db';
import { getAtRiskStudents } from '@/services/analyticsService';
import { generateLearningStyles, extractTextFromPDF, analyzeDropoutRisk } from '@/services/aiService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// ── ICONOS SVG FUTURISTAS ───────────────────────────────────────────────────
const Ico = {
  Student: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Plus: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Upload: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Magic: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-2 2.5h3L12 7h3l-4 5h3l-2 3h2l-3 7"/><path d="M5 3 4 4"/><path d="M19 3l1 1"/><path d="M2 11h2"/><path d="M20 11h2"/><path d="m5 19-1 1"/><path d="m19 19 1 1"/></svg>,
  Book: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Eye: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash: ({ s = 20, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

export default function TeacherCourse() {
  const { courseId }    = useParams();
  const { user, profile, schoolId } = useAuth();
  const navigate        = useNavigate();
  
  const [course, setCourse]         = useState(null);
  const [myCourses, setMyCourses]   = useState([]); 
  const [classes, setClasses]       = useState([]);
  const [students, setStudents]     = useState([]);
  const [allSchoolStudents, setAllSchoolStudents] = useState([]);
  
  const [tab, setTab]   = useState('Clases');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [pageLoad, setPageLoad] = useState(true);
  
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  
  const [analyzing, setAnalyzing] = useState(null); 
  const [aiInsight, setAiInsight] = useState(null); 

  const [assignModal, setAssignModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [previewClass, setPreviewClass] = useState(null);

  const loadData = async () => {
    if (!courseId || !schoolId || !user?.uid) return;
    setPageLoad(true);
    try {
      const teacherIdToUse = profile?.id || user.uid;
      const [cData, teacherCourses, s, allS] = await Promise.all([
        getCourse(courseId),
        getCoursesByTeacher(teacherIdToUse), 
        getAtRiskStudents(courseId, schoolId),
        getUsersBySchool(schoolId, 'student')
      ]);

      if (!cData) { navigate('/teacher'); return; }
      
      setCourse(cData);
      setMyCourses(teacherCourses);
      setStudents(s); 
      setAllSchoolStudents(allS);
    } catch(e) {
      console.error("Error cargando materia:", e);
    } finally {
      setPageLoad(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = listenClasses(courseId, setClasses);
    return unsub;
  }, [courseId, schoolId, user?.uid]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf':[], 'image/*':[] },
    maxFiles: 1,
    onDrop: useCallback(([f]) => { 
      setFile(f); 
      setError(''); 
      setSuccess('');
    }, []),
  });

  const handlePublish = async () => {
    if (loading) return;
    setError(''); setSuccess('');

    if (!course) {
      setError('Aún estamos cargando los datos del curso. Espera un segundo y vuelve a intentar.');
      return;
    }
    
    let rawContent = text.trim();
    
    if (file) {
      setLoading(true);
      try {
        if (file.type === 'application/pdf') {
          rawContent = await extractTextFromPDF(file);
        } else {
          rawContent = `[Documento adjunto: ${file.name}]. ${text}`; 
        }
      } catch (err) { 
        console.warn("Advertencia al extraer PDF:", err);
        setError('No se pudo extraer el texto del PDF. Intenta copiar y pegar el texto manualmente.'); 
        setLoading(false); return; 
      }
    }

    if (!rawContent || rawContent.length < 5) { 
      setError('El contenido es demasiado corto. Sube un archivo válido o escribe un resumen.'); 
      setLoading(false); return; 
    }

    setLoading(true);
    try {
      const safeSubject = course?.subject || course?.name || 'Materia General';
      const safeGrade = course?.grade || 'Nivel Básico';
      const teacherIdToUse = profile?.id || user.uid;

      const content = await generateLearningStyles(rawContent, safeSubject, safeGrade);
      
      await createClass({ 
        courseId, 
        schoolId, 
        teacherId: teacherIdToUse, 
        rawContent, 
        content, 
        subject: safeSubject, 
        grade: safeGrade 
      });

      setText(''); setFile(null);
      setSuccess('✨ ¡Increíble! Gemini ha transformado tu material en 6 estilos de aprendizaje.');
      setTimeout(() => setSuccess(''), 6000);
    } catch(e) { 
      console.error("Error IA:", e);
      setError('Hubo un problema comunicándose con la IA de Gemini. Intenta nuevamente.'); 
    }
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

  const handleAssignStudent = async () => {
    if (!selectedStudentId) return;
    setAssigning(true); setError('');
    try {
      const studentToAssign = allSchoolStudents.find(s => s.id === selectedStudentId);
      const studentRef = doc(db, 'users', selectedStudentId);
      const newCoursesList = [...new Set([...(studentToAssign.enrolledCourses || []), courseId])];
      await updateDoc(studentRef, { enrolledCourses: newCoursesList });
      setSuccess(`✓ ${studentToAssign.name} vinculado correctamente.`);
      setAssignModal(false); setSelectedStudentId('');
      await loadData();
    } catch (e) { setError('Error al vincular.'); }
    setAssigning(false);
  };

  if (pageLoad) return <div style={{ minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center' }}><Spinner size={40} /></div>;

  // 🎨 DETECTOR INTELIGENTE DE COLOR PARA EL PROFESOR
  const themeColor = getSubjectColor(course?.subject || course?.name);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
      
      {/* 🌌 AURA AMBIENTAL DE LA MATERIA */}
      <div style={{ position:'fixed', top:'-10%', left:'-10%', width:'60%', height:'60%', background:`radial-gradient(circle, ${themeColor}15 0%, transparent 70%)`, pointerEvents:'none', zIndex:0, transition:'background 0.8s ease' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'50%', height:'50%', background:`radial-gradient(circle, ${themeColor}10 0%, transparent 60%)`, pointerEvents:'none', zIndex:0, transition:'background 0.8s ease' }} />

      {/* Navbar hereda el color del ramo */}
      <Navbar customColor={themeColor} />
      
      <main style={{ maxWidth:'1000px', margin:'0 auto', padding:'30px 20px', position:'relative', zIndex:1 }}>

        {/* CONTROLES SUPERIORES (Se tiñen del color del ramo) */}
        <div className="anim-fade-up glass" style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'30px', padding:'16px 20px', borderRadius:'16px', border:`1px solid ${themeColor}40`, boxShadow:`0 10px 30px -10px ${themeColor}20` }}>
          <div style={{ width:48, height:48, borderRadius:'12px', background:themeColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 15px ${themeColor}60` }}>
            <Ico.Book s={24}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:'11px', color:C.muted, textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em', marginBottom:'4px' }}>Materia Actual</div>
            <select 
              value={courseId}
              onChange={(e) => navigate(`/teacher/course/${e.target.value}`)}
              style={{ background:'transparent', border:'none', fontSize:'22px', fontWeight:700, color:C.text, outline:'none', cursor:'pointer', width:'100%', fontFamily:"'Lora',serif" }}
            >
              {myCourses.map(c => (
                <option key={c.id} value={c.id} style={{ fontSize:'16px', background: C.surface }}>
                  {c.name} — {c.grade || 'General'}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => navigate('/teacher')} 
            style={{ display:'flex', alignItems:'center', gap:'6px', background:`${themeColor}15`, border:`1px solid ${themeColor}30`, borderRadius:'8px', padding:'10px 14px', cursor:'pointer', color:themeColor, fontSize:'13px', fontWeight:600, transition:'.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = `${themeColor}30`}
            onMouseLeave={e => e.currentTarget.style.background = `${themeColor}15`}
          >
            ← Volver al Dashboard
          </button>
        </div>

        <Tabs tabs={['Clases', 'Directorio de Alumnos']} active={tab} onChange={setTab} />

        {/* ── SECCIÓN: GESTIÓN DE CLASES ── */}
        {tab === 'Clases' && (
          <div className="anim-fade-up">
            
            {/* LABORATORIO DE CONTENIDO (Teñido) */}
            <Card className="glass" style={{ marginBottom:'28px', padding:'24px', border:`1px solid ${themeColor}40` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
                <div style={{ padding:'10px', background:`${themeColor}20`, borderRadius:'10px', color:themeColor }}><Ico.Magic s={24}/></div>
                <SectionHeader title="Laboratorio de Contenido IA" sub="Sube un archivo o escribe el tema para que Gemini genere la clase en 6 formatos interactivos." />
              </div>

              <div {...getRootProps()} style={{ 
                border:`2px dashed ${isDragActive ? themeColor : C.borderHover}`, 
                borderRadius:'16px', padding:'30px', textAlign:'center', cursor:'pointer', 
                transition:'all 0.3s ease', background:isDragActive ? `${themeColor}10` : C.surface,
                marginBottom:'20px', position:'relative', overflow:'hidden'
              }}>
                <input {...getInputProps()} />
                {file ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                    <div style={{ width:48, height:48, background:themeColor, color:'#fff', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', boxShadow:`0 0 15px ${themeColor}60` }}>
                      {file.type==='application/pdf'?'📄':'🖼️'}
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontWeight:700, color:C.text }}>{file.name}</div>
                      <div style={{ fontSize:'12px', color:C.muted }}>{(file.size/1024).toFixed(1)} KB • Listo para procesar</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setFile(null);}} style={{ marginLeft:'15px', background:C.redSoft, border:'none', color:C.red, borderRadius:'50%', width:24, height:24, cursor:'pointer', fontWeight:700 }}>×</button>
                  </div>
                ) : (
                  <>
                    <div style={{ color:themeColor, marginBottom:'12px' }}><Ico.Upload s={34}/></div>
                    <div style={{ fontWeight:700, color:C.text, fontSize:'15px' }}>{isDragActive ? '¡Suéltalo ahora!' : 'Arrastra un PDF o Imagen de la pizarra'}</div>
                    <div style={{ color:C.muted, fontSize:'12px', marginTop:'6px' }}>Gemini leerá el archivo y creará el contenido por ti.</div>
                  </>
                )}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                <div style={{ flex:1, height:'1px', background:C.border }} />
                <span style={{ color:C.muted, fontSize:'11px', textTransform:'uppercase', fontWeight:700 }}>o redacta manualmente</span>
                <div style={{ flex:1, height:'1px', background:C.border }} />
              </div>

              <Textarea
                placeholder="Escribe los puntos clave de tu clase o pega un texto largo aquí..."
                value={text} onChange={e=>setText(e.target.value)}
                style={{ minHeight:'140px', marginBottom:'20px', fontSize:'14px', lineHeight:'1.6' }}
              />

              {error   && <div style={{ marginBottom:'15px' }}><Alert type="error">{error}</Alert></div>}
              {success && <div style={{ marginBottom:'15px' }}><Alert type="success">{success}</Alert></div>}

              {loading ? (
                <div style={{ display:'flex', alignItems:'center', gap:'18px', padding:'20px', background:`${themeColor}10`, borderRadius:'14px', border:`1px solid ${themeColor}30` }}>
                  <Spinner size={24} color={themeColor} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'14px', color:themeColor }}>Gemini está analizando y transformando el material...</div>
                    <div style={{ height:'6px', background:`${themeColor}20`, borderRadius:'3px', marginTop:'8px', overflow:'hidden' }}>
                      <div className="progress-bar-ind" style={{ height:'100%', background:themeColor, width:'40%' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={handlePublish} style={{ width:'100%', padding:'16px', background:themeColor, color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:`0 4px 15px ${themeColor}60` }}>
                  <Ico.Magic s={18}/> Generar Clase con IA
                </button>
              )}
            </Card>

            <SectionHeader title="Bitácora de Clases" sub={`${classes.length} lecciones publicadas en esta materia.`} />
            <div style={{ display:'grid', gap:'12px' }}>
              {classes.length === 0 ? <EmptyState emoji="📭" title="Curso sin contenido" desc="Sube tu primer archivo arriba para comenzar." /> :
                classes.map((cls, i) => (
                  <Card 
                    key={cls.id} 
                    className={`anim-fade-up anim-d${Math.min(i+1,5)} glass`} 
                    style={{ padding:'18px 22px', cursor:'pointer', transition:'.2s', border:`1px solid ${C.borderHover}` }}
                    onClick={() => setPreviewClass(cls)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.boxShadow = `0 0 15px ${themeColor}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'16px', color:C.text, display:'flex', alignItems:'center', gap:'8px' }}>
                          {cls.content?.titulo || 'Lección sin título'}
                        </div>
                        <div style={{ color:C.muted, fontSize:'12px', marginTop:'4px' }}>Publicado el {cls.createdAt?.toDate?.().toLocaleDateString('es-CL')}</div>
                        
                        <div style={{ display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap' }}>
                          {STYLES.map(s => {
                            if (!cls.content?.[s.id]) return null;
                            return (
                              <span key={s.id} title={s.label} style={{ display:'flex', alignItems:'center', gap:'4px', background:s.soft, color:s.color, borderRadius:'6px', padding:'4px 8px', fontSize:'12px', fontWeight:600 }}>
                                {s.icon} {s.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={(e)=>{ e.stopPropagation(); setPreviewClass(cls); }} style={{ background:`${themeColor}15`, border:'none', color:themeColor, cursor:'pointer', padding:'10px', borderRadius:'10px' }} title="Previsualizar"><Ico.Eye s={16}/></button>
                        <button onClick={(e)=>{ e.stopPropagation(); if(window.confirm('¿Eliminar clase?')) deleteClass(cls.id); }} style={{ background:`${C.red}15`, border:'none', color:C.red, cursor:'pointer', padding:'10px', borderRadius:'10px' }} title="Eliminar"><Ico.Trash s={16}/></button>
                      </div>
                    </div>
                  </Card>
                ))
              }
            </div>
          </div>
        )}

        {/* ── SECCIÓN: ALUMNOS Y MONITOREO ── */}
        {tab === 'Directorio de Alumnos' && (
          <div className="anim-fade-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
              <div style={{ display:'flex', gap:'8px' }}>
                <Badge color={C.red}>{students.filter(s=>s.metrics?.riskScore<=39).length} en riesgo</Badge>
                <Badge color={C.green}>{students.length} matriculados</Badge>
              </div>
              <Btn small color={themeColor} onClick={() => setAssignModal(true)} icon={<Ico.Plus s={14}/>}>Vincular Alumno</Btn>
            </div>

            <div style={{ display:'grid', gap:'12px' }}>
              {students.length === 0 ? <EmptyState emoji="🎒" title="Lista vacía" desc="Aún no hay alumnos vinculados a esta materia." /> :
                students.map((s, i) => {
                  const m = s.metrics || { riskScore: 100, totalSessions: 0, daysSinceLastActivity: 999 };
                  return (
                    <Card key={s.id} className="glass">
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'15px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
                          <div style={{ width:44, height:44, borderRadius:'50%', background:`${themeColor}15`, color:themeColor, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{s.name[0]}</div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'15px' }}>{s.name}</div>
                            <div style={{ fontSize:'12px', color:C.muted, marginTop:'2px' }}>{m.totalSessions} sesiones • Quiz: {m.avgQuizScore || 0}%</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <RiskBadge score={m.riskScore} />
                          <Btn small outline color={C.violet} loading={analyzing===s.id} onClick={()=>handleAnalyzeStudent(s)}>Analizar con IA</Btn>
                        </div>
                      </div>
                      {aiInsight?.studentId === s.id && (
                        <div className="anim-fade-up" style={{ marginTop:'15px', padding:'15px', background:`${C.violet}05`, border:`1px solid ${C.violet}20`, borderRadius:'12px', fontSize:'13px', lineHeight:'1.6' }}>
                          <strong>Reporte Gemini:</strong> {aiInsight.data.resumen}
                          <div style={{ color:C.green, fontWeight:600, marginTop:'8px' }}>✓ {aiInsight.data.recomendaciones?.[0]}</div>
                        </div>
                      )}
                    </Card>
                  );
                })
              }
            </div>
          </div>
        )}

      </main>

      {/* ── MODALES ───────────────────────────────────────────────────────────── */}
      
      {/* MODAL: VINCULAR ALUMNO */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Añadir Alumno al Curso">
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          <Select
            label="Buscar estudiante"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={[
              { value: '', label: 'Selecciona un alumno de la institución...' },
              ...allSchoolStudents
                .filter(s => !(s.enrolledCourses || []).includes(courseId))
                .map(s => ({ value: s.id, label: `${s.name} (${s.rut})` }))
            ]}
          />
          <Btn full color={themeColor} onClick={handleAssignStudent} loading={assigning} disabled={!selectedStudentId}>Confirmar Matrícula</Btn>
        </div>
      </Modal>

      {/* MODAL: PREVISUALIZACIÓN DE LA CLASE CREADA */}
      <Modal open={!!previewClass} onClose={() => setPreviewClass(null)} title="Previsualización de la Clase">
        {previewClass && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px', maxHeight:'70vh', overflowY:'auto', paddingRight:'5px' }}>
            
            <div style={{ background:C.surface, padding:'20px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
              <h2 style={{ fontWeight:700, fontSize:'20px', color:C.text, marginBottom:'10px' }}>{previewClass.content?.titulo}</h2>
              <p style={{ color:C.textSub, fontSize:'14px', lineHeight:'1.6' }}>{previewClass.content?.resumenBreve}</p>
            </div>

            {previewClass.content?.imagenSugerida && (
              <div style={{ background:`${themeColor}08`, padding:'15px', borderRadius:'12px', border:`1px solid ${themeColor}20` }}>
                <div style={{ fontSize:'11px', color:themeColor, textTransform:'uppercase', fontWeight:700, marginBottom:'6px' }}>Prompt de Imagen Generado</div>
                <div style={{ fontSize:'13px', color:C.text, fontStyle:'italic' }}>"{previewClass.content.imagenSugerida}"</div>
              </div>
            )}

            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:'15px' }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:C.muted, textTransform:'uppercase', marginBottom:'12px' }}>Módulos de Aprendizaje Creados:</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {STYLES.map(s => {
                  const hasContent = !!previewClass.content?.[s.id];
                  if (!hasContent) return null;
                  return (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'12px', background:C.card, padding:'12px 16px', borderRadius:'8px', border:`1px solid ${C.border}` }}>
                      <div style={{ width:32, height:32, borderRadius:'8px', background:s.soft, color:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'14px', color:C.text }}>{s.label}</div>
                        <div style={{ color:C.textSub, fontSize:'12px' }}>{s.desc}</div>
                      </div>
                      <div style={{ marginLeft:'auto' }}>
                        <Badge color={C.green}>Generado ✓</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}