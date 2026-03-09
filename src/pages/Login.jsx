import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { C } from '@/theme';
import { Btn, Input, Alert, Spinner } from '@/components/ui';

const PATHS = { admin: '/admin', teacher: '/teacher', student: '/student' };

export default function Login() {
  const { login, loginWithGoogle, registerUser, profile, loading: al } = useAuth();
  const navigate = useNavigate();
  
  // Estados del flujo
  // 1: Pedir RUT, 2: Autenticar, 3: Clave Institución, 4: Registro Institución
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [gLoad, setGLoad]     = useState(false);
  const [error, setError]     = useState('');

  // Datos del flujo normal (Alumno/Profesor)
  const [rut, setRut] = useState('');
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');

  // Datos del flujo de Creación de Institución (Admin)
  const [secretKey, setSecretKey] = useState('');
  const [instName, setInstName]   = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminRut, setAdminRut]   = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  if (!al && profile && PATHS[profile.role]) navigate(PATHS[profile.role], { replace: true });

  // --- PASO 1: VALIDAR EL RUT ---
  const handleCheckRut = async (e) => {
    e.preventDefault();
    if (!rut) { setError('Por favor ingresa tu RUT'); return; }
    
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'users'), where('rut', '==', rut));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('RUT no encontrado. Por favor, contacta al administrador del colegio.');
      } else {
        const docData = querySnapshot.docs[0].data();
        setUserData(docData);
        setStep(2);
      }
    } catch (e) {
      setError('Error al conectar con la base de datos.');
      console.error(e);
    }
    setLoading(false);
  };

  // --- PASO 2: AUTENTICAR (Google o Correo) ---
  const handleGoogle = async () => {
    setGLoad(true); setError('');
    try {
      await loginWithGoogle(userData.role, { 
        rut: userData.rut, 
        course: userData.course || null,
        schoolId: userData.schoolId || 'Colegio Germán Riesco Errázuriz'
      });
    } catch(e) {
      if (e.code === 'auth/popup-closed-by-user') setError('Cerraste la ventana.');
      else setError('Error con Google. Intenta de nuevo.');
    }
    setGLoad(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pass) { setError('Completa correo y contraseña'); return; }
    
    setLoading(true); setError('');
    try {
      if (userData.uid) {
        await login(email, pass);
      } else {
        await registerUser({ 
          email, 
          password: pass, 
          name: userData.name, 
          role: userData.role, 
          rut: userData.rut,
          course: userData.course || null,
          schoolId: userData.schoolId || 'Colegio Germán Riesco Errázuriz'
        });
      }
    } catch(e) {
      const m = { 
        'auth/user-not-found': 'Correo no registrado', 
        'auth/wrong-password': 'Contraseña incorrecta', 
        'auth/email-already-in-use': 'Este correo ya está registrado',
      };
      setError(m[e.code] || 'Error al iniciar sesión.');
    }
    setLoading(false);
  };

  // --- PASO 3: VALIDAR CLAVE SECRETA DE INSTITUCIÓN ---
  const handleSecretKeySubmit = (e) => {
    e.preventDefault();
    if (secretKey === '1234') {
      setStep(4);
      setError('');
      setSecretKey('');
    } else {
      setError('Clave de autorización incorrecta.');
    }
  };

  // --- PASO 4: REGISTRAR INSTITUCIÓN Y ADMINISTRADOR ---
  const handleRegisterInstitution = async (e) => {
    e.preventDefault();
    if (!instName || !adminName || !adminRut || !adminEmail || !adminPass) {
      setError('Completa todos los campos'); return;
    }

    setLoading(true); setError('');
    try {
      await registerUser({ 
        email: adminEmail, 
        password: adminPass, 
        name: adminName, 
        role: 'admin', 
        rut: adminRut,
        schoolId: instName // Guardamos el nombre de la institución en el perfil del admin
      });
      // El AuthContext detectará el login y redirigirá a /admin automáticamente
    } catch(e) {
      if (e.code === 'auth/email-already-in-use') setError('El correo ya está en uso.');
      else setError('Error al crear la institución.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      
      {/* Botón oculto/sutil para crear institución */}
      <button 
        onClick={() => { setStep(3); setError(''); }} 
        style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer', zIndex: 10 }}
      >
        ⚙️ Crear Institución
      </button>

      {/* Círculos decorativos de fondo */}
      <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle,${C.accent}12 0%,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-150px', left: '-150px', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle,${C.green}08 0%,transparent 70%)`, pointerEvents: 'none' }} />

      <div className="anim-fade-up" style={{ width: '100%', maxWidth: '400px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎓</div>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: '32px', fontWeight: 700 }}>
            educ<span style={{color: C.accent}}>_AI</span>
          </h1>
          <p style={{ color: C.muted, fontSize: '13px', marginTop: '6px' }}>Plataforma Educativa Inteligente</p>
        </div>

        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: '20px', padding: '28px' }}>
          
          {/* --- VISTA 1: INGRESAR RUT NORMAL --- */}
          {step === 1 && (
            <form onSubmit={handleCheckRut} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '19px', fontWeight: 700, textAlign: 'center', marginBottom: '10px' }}>Validar Identidad</h2>
              <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', marginBottom: '10px' }}>
                Ingresa tu RUT para verificar si estás habilitado para entrar a la plataforma.
              </p>
              <Input label="RUT (Sin puntos y con guion)" id="rut" type="text" placeholder="12345678-9" value={rut} onChange={e=>setRut(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" loading={loading} full color={C.accent}>Verificar RUT</Btn>
            </form>
          )}

          {/* --- VISTA 2: ACTIVAR CUENTA / INGRESAR --- */}
          {step === 2 && (
            <div className="anim-fade-up">
              <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', background: `${C.accent}15`, borderRadius: '10px' }}>
                <p style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>Identidad confirmada</p>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f1f1f', margin: 0 }}>Hola, {userData?.name?.split(' ')[0]}</h3>
                <p style={{ fontSize: '13px', color: C.accent, fontWeight: 600, marginTop: '4px', textTransform: 'capitalize' }}>
                  {userData?.role === 'teacher' ? 'Profesor(a)' : userData?.role === 'student' ? `Alumno(a) - ${userData.course}` : 'Administrador'}
                </p>
              </div>

              <button onClick={handleGoogle} disabled={gLoad} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fff', color: '#1f1f1f', border: '1.5px solid #dadce0', borderRadius: '10px', padding: '11px 18px', fontSize: '14px', fontWeight: 600, cursor: gLoad ? 'not-allowed' : 'pointer', opacity: gLoad ? 0.7 : 1, marginBottom: '18px' }}>
                {gLoad ? <Spinner size={18} color="#4285f4" /> : "G"} 
                {gLoad ? 'Conectando...' : 'Entrar con Google'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1, height: '1px', background: C.border }} />
                <span style={{ color: C.muted, fontSize: '12px' }}>o usa tu correo</span>
                <div style={{ flex: 1, height: '1px', background: C.border }} />
              </div>

              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                <Input label="Correo electrónico" id="email" type="email" placeholder="tu@correo.com" value={email} onChange={e=>setEmail(e.target.value)} />
                <Input label="Contraseña" id="pass" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} />
                {error && <Alert type="error">{error}</Alert>}
                <Btn type="submit" loading={loading} full color={C.accent}>
                  {userData?.uid ? 'Iniciar Sesión' : 'Activar mi cuenta'}
                </Btn>
              </form>
              
              <button onClick={() => { setStep(1); setError(''); }} style={{ width: '100%', background: 'none', border: 'none', color: C.muted, fontSize: '12px', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }}>
                Volver atrás
              </button>
            </div>
          )}

          {/* --- VISTA 3: CLAVE DE INSTITUCIÓN --- */}
          {step === 3 && (
            <form onSubmit={handleSecretKeySubmit} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '19px', fontWeight: 700, textAlign: 'center', marginBottom: '10px' }}>Acceso Restringido</h2>
              <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', marginBottom: '10px' }}>
                Ingrese la clave de autorización para registrar una nueva institución educativa.
              </p>
              <Input label="Clave de Autorización" id="secretKey" type="password" placeholder="••••" value={secretKey} onChange={e=>setSecretKey(e.target.value)} />
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" full color="#1f1f1f">Validar Clave</Btn>
              <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}>
                Cancelar
              </button>
            </form>
          )}

          {/* --- VISTA 4: FORMULARIO DE NUEVA INSTITUCIÓN --- */}
          {step === 4 && (
            <form onSubmit={handleRegisterInstitution} className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '19px', fontWeight: 700, textAlign: 'center', marginBottom: '5px' }}>Nueva Institución</h2>
              
              <Input label="Nombre de la Institución" id="instName" type="text" placeholder="Ej: Colegio Germán Riesco" value={instName} onChange={e=>setInstName(e.target.value)} />
              <div style={{ height: '1px', background: C.border, margin: '5px 0' }} />
              
              <Input label="Nombre del Administrador" id="adminName" type="text" placeholder="Juan Pérez" value={adminName} onChange={e=>setAdminName(e.target.value)} />
              <Input label="RUT Administrador" id="adminRut" type="text" placeholder="12345678-9" value={adminRut} onChange={e=>setAdminRut(e.target.value)} />
              <Input label="Correo del Administrador" id="adminEmail" type="email" placeholder="admin@colegio.cl" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} />
              <Input label="Crear Contraseña" id="adminPass" type="password" placeholder="••••••••" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
              
              {error && <Alert type="error">{error}</Alert>}
              <Btn type="submit" loading={loading} full color="#1f1f1f">Crear Institución y Admin</Btn>
              <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px' }}>
                Cancelar
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}