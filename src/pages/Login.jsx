import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { C, LOGO_URL } from '@/theme';
import { Btn, Input, Alert, Spinner } from '@/components/ui';

// ── ICONOS SVG FUTURISTAS ─────────────────────────────────────────────────────
const Ico = {
  Rut: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" ry="3"/>
      <circle cx="9" cy="10" r="2.5"/>
      <line x1="15" y1="9" x2="19" y2="9"/>
      <line x1="15" y1="13" x2="19" y2="13"/>
      <path d="M4.5 18c0-2.5 3-3.5 4.5-3.5s4.5 1 4.5 3.5"/>
    </svg>
  ),
  Login: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Settings: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Shield: ({ s = 20, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
};

const PATHS = { admin: '/admin', teacher: '/teacher', student: '/student' };

export default function Login() {
  const { login, registerUser, profile, loading: al } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rut, setRut]         = useState('');
  
  // Datos Admin
  const [adminPassLogin, setAdminPassLogin] = useState('');
  const [secretKey, setSecretKey]           = useState('');
  const [instName, setInstName]             = useState('');
  const [adminName, setAdminName]           = useState('');
  const [adminRut, setAdminRut]             = useState('');
  const [adminEmail, setAdminEmail]         = useState('');
  const [adminPass, setAdminPass]           = useState('');

  useEffect(() => {
    if (!al && profile && PATHS[profile.role]) {
      navigate(PATHS[profile.role], { replace: true });
    }
  }, [al, profile, navigate]);

  const handleMagicLogin = async (e) => {
    e.preventDefault();
    if (!rut) { setError('Por favor ingresa tu RUT para acceder.'); return; }
    
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const q = query(collection(db, 'users'), where('rut', '==', rut));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Este RUT no está registrado en la institución.');
        setLoading(false); return;
      }

      const activeDoc = snap.docs.find(d => d.data().uid != null);
      const ghostDoc  = snap.docs.find(d => d.data().uid == null);
      const targetDoc = activeDoc || ghostDoc;
      const data = targetDoc.data();

      if (data.role === 'admin') {
        setError('Acceso denegado. Ingresa por el Portal de Administración (Escudo Arriba).');
        setLoading(false); return;
      }

      const cleanRut = rut.replace(/[^0-9kK]/g, '').toLowerCase();
      const autoEmail = `${cleanRut}@sistema.educai.app`; 
      const autoPass  = `Edu_${cleanRut}_AI_2026`; 

      if (activeDoc) {
        await login(autoEmail, autoPass);
        if (ghostDoc) {
          const mergedCourses = [...new Set([...(data.enrolledCourses || []), ...(ghostDoc.data().enrolledCourses || [])])];
          await updateDoc(doc(db, 'users', activeDoc.data().uid), { enrolledCourses: mergedCourses });
          await deleteDoc(doc(db, 'users', ghostDoc.id));
        }
      } else if (ghostDoc) {
        try {
          const newUser = await registerUser({ 
            email: autoEmail, password: autoPass, name: data.name, role: data.role, 
            rut: data.rut, course: data.course || null, schoolId: data.schoolId
          });
          
          await updateDoc(doc(db, 'users', newUser.uid), { enrolledCourses: data.enrolledCourses || [] });

          if (data.role === 'teacher') {
            const coursesQ = query(collection(db, 'courses'), where('teacherId', '==', ghostDoc.id));
            const coursesSnap = await getDocs(coursesQ);
            for (const cDoc of coursesSnap.docs) {
              await updateDoc(doc(db, 'courses', cDoc.id), { teacherId: newUser.uid });
            }
          }
          await deleteDoc(doc(db, 'users', ghostDoc.id));

        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            const userCred = await login(autoEmail, autoPass);
            await updateDoc(doc(db, 'users', ghostDoc.id), { uid: userCred.user.uid });
          } else {
            throw authErr;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError('Error al iniciar sesión. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!rut || !adminPassLogin) { setError('Ingresa tu RUT y contraseña.'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const q = query(collection(db, 'users'), where('rut', '==', rut), where('role', '==', 'admin'));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('RUT no encontrado o no tiene permisos de Administrador.');
        setLoading(false); return;
      }
      const adminData = snap.docs[0].data();
      await login(adminData.email, adminPassLogin);
    } catch (e) { setError('Contraseña incorrecta.'); }
    setLoading(false);
  };

  const handleSecretKeySubmit = (e) => {
    e.preventDefault();
    if (secretKey === '1234') { setStep(4); setError(''); setSecretKey(''); } 
    else setError('Clave de autorización incorrecta.');
  };

  const handleRegisterInstitution = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    
    if (!instName || !adminName || !adminRut || !adminEmail || !adminPass) { 
      setError('Por favor completa todos los campos.'); 
      return; 
    }
    if (adminPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ email: adminEmail, password: adminPass, name: adminName, role: 'admin', rut: adminRut, schoolId: instName });
      try {
        await setDoc(doc(db, 'schools', instName), { name: instName, adminName: adminName, createdAt: new Date() });
      } catch (dbError) { console.warn("Advertencia bd", dbError); }

      setRut(adminRut);
      setAdminPassLogin(adminPass);
      setSuccessMsg('¡Institución creada con éxito! Ahora puedes ingresar.');
      setStep(5);

    } catch(e) { 
      console.error(e);
      if (e.code === 'auth/email-already-in-use') setError('Ese correo ya está siendo utilizado por otra cuenta.');
      else if (e.code === 'auth/invalid-email') setError('El formato del correo no es válido.');
      else setError(e.message || 'Ocurrió un error inesperado al crear la institución.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      
      {/* 🔮 ANIMACIONES GLOBALES INYECTADAS */}
      <style>{`
        @keyframes floatHero {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.03); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes heroGlow {
          0% { filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.4)); }
          50% { filter: drop-shadow(0 0 45px rgba(217, 70, 239, 0.8)) drop-shadow(0 0 15px rgba(56, 189, 248, 0.6)); }
          100% { filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.4)); }
        }
        @keyframes floorShadow {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(0.6); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes rotateAura {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

      {/* Botón Izquierdo: Acceso Admin */}
      <button onClick={() => { setStep(5); setError(''); setSuccessMsg(''); setRut(''); setAdminPassLogin(''); }} style={{ position: 'absolute', top: '24px', left: '24px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', cursor: 'pointer', zIndex: 10, display:'flex', alignItems:'center', gap:'6px', transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.color=C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
        <Ico.Shield s={16}/> Acceso Admin
      </button>

      {/* Botón Derecho: Crear Institución */}
      <button onClick={() => { setStep(3); setError(''); setSuccessMsg(''); }} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', cursor: 'pointer', zIndex: 10, display:'flex', alignItems:'center', gap:'6px', transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.color=C.pink} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
        <Ico.Settings s={16}/> Configurar Inst.
      </button>

      {/* Decoración Neón Ambiental */}
      <div style={{ position: 'fixed', top: '-150px', right: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle,${C.accent}15 0%,transparent 60%)`, pointerEvents: 'none', filter: 'blur(40px)' }} />
      <div style={{ position: 'fixed', bottom: '-200px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle,${C.pink}12 0%,transparent 60%)`, pointerEvents: 'none', filter: 'blur(50px)' }} />

      <div className="anim-fade-up" style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
        
        {/* 🚀 LOGO HOLOGRÁFICO GIGANTE */}
        <div style={{ textAlign: 'center', marginBottom: '45px', display:'flex', flexDirection:'column', alignItems:'center', position: 'relative' }}>
          
          <div style={{ position: 'relative', width: '100%', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
            
            {/* Aura trasera que rota lentamente */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '200px', height: '200px', background: `radial-gradient(circle, ${C.accent}30 0%, transparent 70%)`, filter: 'blur(30px)', animation: 'rotateAura 15s linear infinite', zIndex: 0 }}></div>
            
            {/* Imagen del Logo con Levitación y Brillo dinámico */}
            <img 
              src={LOGO_URL} 
              alt="EDUC_AI Logo" 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'contain', 
                imageRendering: 'pixelated', /* Mantiene el efecto Arcade */
                animation: 'floatHero 4s ease-in-out infinite, heroGlow 4s ease-in-out infinite',
                position: 'relative',
                zIndex: 2
              }} 
            />

            {/* Sombra 3D reactiva en el "Piso" */}
            <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', width: '110px', height: '12px', background: `radial-gradient(ellipse, ${C.accent}80 0%, transparent 70%)`, filter: 'blur(4px)', animation: 'floorShadow 4s ease-in-out infinite', zIndex: 1 }}></div>
          </div>

          <h1 className="glow-text retro-logo-text" style={{ fontSize: '32px', marginBottom: '12px' }}>
            EDUC_AI
          </h1>
          
          {/* Subtítulo estilo cinta neón */}
          <div style={{ background: `linear-gradient(90deg, transparent, ${C.accent}20, transparent)`, padding: '6px 30px', borderRadius: '12px' }}>
            <p style={{ color: C.accent, fontSize: '11px', fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' }}>
              Plataforma Inteligente
            </p>
          </div>
        </div>

        {/* CONTENEDOR DE FORMULARIOS */}
        <div className="glass" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', boxShadow:`0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)` }}>
          
          {step === 1 && (
            <form onSubmit={handleMagicLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: C.text, marginBottom: '6px' }}>Ingreso al portal</h2>
                <p style={{ fontSize: '13px', color: C.textSub }}>Ingresa tu RUT para acceder a tus clases.</p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: C.muted }}><Ico.Rut s={20} /></div>
                <input type="text" placeholder="12.345.678-9" value={rut} onChange={e=>setRut(e.target.value)} style={{ width: '100%', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: '12px', padding: '14px 14px 14px 44px', color: C.text, fontSize: '15px', outline: 'none', transition:'.2s' }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border} />
              </div>
              {error && <Alert type="error">{error}</Alert>}
              <button disabled={loading} type="submit" style={{ width: '100%', background: `linear-gradient(90deg, ${C.accent}, ${C.violet})`, color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition:'.2s', boxShadow:`0 4px 15px ${C.violetSoft}` }}>
                {loading ? <Spinner size={20} color="#fff" /> : <>Iniciar Sesión <Ico.Login s={18} /></>}
              </button>
            </form>
          )}

          {step === 5 && (
            <form onSubmit={handleAdminLogin} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', background: `${C.accent}15`, padding: '12px', borderRadius: '50%', color: C.accent, marginBottom: '12px', border:`1px solid ${C.accent}30` }}><Ico.Shield s={28} /></div>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Panel de Administración</h2>
              </div>
              {successMsg && <Alert type="success">{successMsg}</Alert>}
              <Input label="RUT Administrador" placeholder="12345678-9" value={rut} onChange={e=>setRut(e.target.value)} />
              <Input label="Contraseña" type="password" placeholder="••••••••" value={adminPassLogin} onChange={e=>setAdminPassLogin(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" loading={loading} full color={C.accent}>Ingresar al Panel</Btn>
              <button type="button" onClick={() => { setStep(1); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Volver al Portal Estudiantil</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSecretKeySubmit} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 700, textAlign: 'center', color:C.pink }}>Acceso Restringido</h2>
              <p style={{ fontSize: '12px', color: C.textSub, textAlign:'center', marginBottom:'10px' }}>Ingresa la clave maestra para instalar la plataforma.</p>
              <Input label="Clave de Autorización" type="password" placeholder="••••" value={secretKey} onChange={e=>setSecretKey(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" full color={C.pink}>Validar Clave</Btn>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleRegisterInstitution} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 700, textAlign: 'center', color:C.pink }}>Nueva Institución</h2>
              <Input label="Nombre Institución" placeholder="Ej: Colegio Hannover" value={instName} onChange={e=>setInstName(e.target.value)} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <Input label="Nombre Admin" placeholder="Juan Pérez" value={adminName} onChange={e=>setAdminName(e.target.value)} />
                <Input label="RUT Admin" placeholder="12345678-9" value={adminRut} onChange={e=>setAdminRut(e.target.value)} />
              </div>
              <Input label="Correo Admin" type="email" placeholder="admin@colegio.cl" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} />
              <Input label="Contraseña (Mín. 6 letras)" type="password" placeholder="••••••••" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" loading={loading} full color={C.pink}>Crear Institución</Btn>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}