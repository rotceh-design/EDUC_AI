import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/theme';
import { Badge } from '@/components/ui';

const ROLE_COLOR = { admin: C.rose, teacher: C.accent, student: C.green };
const ROLE_LABEL = { admin: 'Admin', teacher: 'Profesor', student: 'Alumno' };

const NAV_LINKS = {
  admin:   [{ label:'Dashboard', path:'/admin' }, { label:'Analíticas', path:'/admin/analytics' }],
  teacher: [{ label:'Mis Cursos', path:'/teacher' }, { label:'Alertas', path:'/teacher/alerts' }],
  student: [{ label:'Inicio', path:'/student' }],
};

export default function Navbar() {
  const { profile, role, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const color = ROLE_COLOR[role] || C.accent;
  const links = NAV_LINKS[role] || [];

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <nav style={{ position:'sticky', top:0, zIndex:100, background:`${C.surface}ee`, backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.border}`, padding:'0 24px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'28px' }}>
        <button onClick={()=>navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'20px' }}>🎓</span>
          <span style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:'17px', color:C.text }}>educ<span style={{color}}>_AI</span></span>
        </button>
        <div style={{ display:'flex', gap:'4px' }}>
          {links.map(l => (
            <button key={l.path} onClick={()=>navigate(l.path)} style={{
              background: location.pathname===l.path?`${color}18`:'none',
              border: 'none', borderRadius:'8px', padding:'6px 12px',
              cursor:'pointer', color: location.pathname===l.path?color:C.muted,
              fontSize:'13px', fontWeight: location.pathname===l.path?600:400,
              transition:'all .18s', fontFamily:"'Sora',sans-serif",
            }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position:'relative' }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ background:open?C.cardHover:'none', border:`1px solid ${open?C.border:'transparent'}`, borderRadius:'10px', padding:'5px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', color:C.text, transition:'all .2s' }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:`${color}20`, border:`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color, fontSize:'13px' }}>
            {profile?.name?.[0]?.toUpperCase()||'?'}
          </div>
          <span style={{ fontSize:'13px', fontWeight:500, maxWidth:'110px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.name||'Usuario'}</span>
          <span style={{ color:C.muted, fontSize:'10px', transform:open?'rotate(180deg)':'', transition:'transform .2s' }}>▼</span>
        </button>

        {open && (
          <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:C.card, border:`1.5px solid ${C.border}`, borderRadius:'14px', padding:'8px', minWidth:'180px', animation:'fadeUp .18s ease', boxShadow:'0 8px 28px rgba(0,0,0,.4)' }}>
            <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:'6px' }}>
              <div style={{ fontWeight:600, fontSize:'13px' }}>{profile?.name}</div>
              <div style={{ color:C.muted, fontSize:'11px', marginTop:'2px' }}>{profile?.email}</div>
              <div style={{ marginTop:'4px' }}><Badge color={color}>{ROLE_LABEL[role]}</Badge></div>
            </div>
            <button onClick={handleLogout} style={{ display:'block', width:'100%', textAlign:'left', background:'none', border:'none', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', color:'#f87171', fontSize:'13px', transition:'background .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}
            >🚪 Cerrar sesión</button>
          </div>
        )}
      </div>
    </nav>
  );
}
