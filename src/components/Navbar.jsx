import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C, LOGO_URL } from '@/theme';

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Función para volver al inicio dependiendo del rol
  const goHome = () => {
    if (!profile) return;
    if (profile.role === 'admin') navigate('/admin');
    else if (profile.role === 'teacher') navigate('/teacher');
    else navigate('/student');
  };

  return (
    <>
      {/* 🎮 IMPORTACIÓN DE FUENTE RETRO ARCADE 32-BITS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          .retro-logo-text {
            font-family: 'Press Start 2P', cursive;
            letter-spacing: 1px;
            background: linear-gradient(90deg, ${C.accent}, ${C.pink});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.6));
            transition: all 0.3s ease;
          }
          
          .nav-container:hover .retro-logo-text {
            filter: drop-shadow(0px 0px 15px rgba(217, 70, 239, 0.8));
          }
        `}
      </style>

      <nav style={{
        background: 'rgba(11, 19, 36, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        
        {/* LOGO Y TEXTO RETRO */}
        <div 
          className="nav-container"
          onClick={goHome} 
          style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        >
          <img 
            src={LOGO_URL} 
            alt="EDUC_AI Logo" 
            style={{ 
              height: '38px', 
              imageRendering: 'pixelated', /* 👾 Forza el aspecto de píxeles retro */
              filter: `drop-shadow(0 0 10px ${C.accentSoft})` 
            }} 
          />
          <span className="retro-logo-text" style={{ fontSize: '14px', marginTop: '4px' }}>
            EDUC_AI
          </span>
        </div>

        {/* INFO DEL USUARIO Y BOTÓN DE SALIDA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right', display: window.innerWidth < 600 ? 'none' : 'block' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{profile.name}</div>
                <div style={{ fontSize: '11px', color: C.green, textTransform: 'uppercase', letterSpacing:'0.05em', fontWeight: 800 }}>
                  {profile.role === 'student' ? 'Estudiante' : profile.role === 'teacher' ? 'Docente' : 'Admin'}
                </div>
              </div>
              <div style={{ 
                width: '38px', height: '38px', borderRadius: '10px', 
                background: C.surface, border: `1.5px solid ${C.borderHover}`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: C.text, fontWeight: 800, fontSize: '16px' 
              }}>
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'transparent', border: `1px solid ${C.borderHover}`, 
              color: C.textSub, padding: '8px 14px', borderRadius: '8px', 
              cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: '.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = C.red; e.currentTarget.style.background = C.redSoft; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.background = 'transparent'; }}
          >
            SALIR
          </button>
        </div>
      </nav>
    </>
  );
}