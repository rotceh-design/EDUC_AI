import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { C } from '@/theme';
import { Btn } from '@/components/ui';

export default function PendingRole() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div className="anim-fade-up" style={{ textAlign:'center', maxWidth:'440px' }}>
        <div style={{ fontSize:'56px', marginBottom:'18px' }}>⏳</div>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:'24px', fontWeight:700, marginBottom:'10px' }}>Cuenta en revisión</h1>
        <p style={{ color:C.muted, fontSize:'14px', lineHeight:1.7, marginBottom:'22px' }}>
          Tu cuenta <strong style={{ color:C.text }}>{profile?.email}</strong> está registrada pero aún no tiene un rol asignado.
          El administrador de tu institución debe asignarte el rol de <strong style={{ color:C.text }}>profesor</strong> o <strong style={{ color:C.text }}>alumno</strong> para que puedas acceder.
        </p>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', padding:'16px', marginBottom:'22px', fontSize:'13px', color:C.muted, lineHeight:1.65 }}>
          💡 Si ya fuiste registrado por el admin con correo y contraseña, cierra sesión y entra con esas credenciales, no con Google.
        </div>
        <Btn onClick={handleLogout} outline color={C.rose}>Cerrar sesión</Btn>
      </div>
    </div>
  );
}
