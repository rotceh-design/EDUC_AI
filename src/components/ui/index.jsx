import { C } from '@/theme';

export function Btn({ children, onClick, type='button', color=C.accent, outline=false, small=false, full=false, disabled=false, loading=false, icon }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'7px',
      background: outline?'transparent':color, color: outline?color:'#fff',
      border:`1.5px solid ${color}`, borderRadius:'10px',
      padding: small?'7px 14px':'11px 22px', fontSize: small?'13px':'14px',
      fontWeight:600, cursor: disabled||loading?'not-allowed':'pointer',
      opacity: disabled?.5:1, transition:'all .18s', width: full?'100%':'auto',
      whiteSpace:'nowrap', letterSpacing:'0.02em',
    }}
      onMouseEnter={e=>{ if(!disabled&&!loading) e.currentTarget.style.filter='brightness(1.12)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.filter=''; }}
    >
      {loading && <span className="spinner" style={{width:15,height:15}} />}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
}

export function Card({ children, style={}, onClick, accent, className='' }) {
  const clickable = !!onClick;
  return (
    <div onClick={onClick} className={className} style={{
      background:C.card, border:`1.5px solid ${accent||C.border}`,
      borderRadius:'16px', padding:'20px', cursor:clickable?'pointer':'default',
      transition:'all .2s', ...style,
    }}
      onMouseEnter={e=>{ if(clickable){ e.currentTarget.style.borderColor=accent||C.accent; e.currentTarget.style.background=C.cardHover; e.currentTarget.style.transform='translateY(-2px)'; } }}
      onMouseLeave={e=>{ if(clickable){ e.currentTarget.style.borderColor=accent||C.border; e.currentTarget.style.background=C.card; e.currentTarget.style.transform=''; } }}
    >{children}</div>
  );
}

export function Badge({ children, color=C.accent }) {
  return <span style={{ background:`${color}18`, color, border:`1px solid ${color}35`, borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700, letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{children}</span>;
}

export function Input({ label, id, error, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      {label && <label htmlFor={id} style={{ fontSize:'13px', fontWeight:600, color:C.textSub }}>{label}</label>}
      <input id={id} {...props} style={{ background:C.surface, border:`1.5px solid ${error?'#f87171':C.border}`, borderRadius:'10px', padding:'10px 13px', color:C.text, fontSize:'14px', outline:'none', transition:'border-color .2s', width:'100%', ...props.style }}
        onFocus={e=>{ e.target.style.borderColor=error?'#f87171':C.accent; }}
        onBlur={e=>{ e.target.style.borderColor=error?'#f87171':C.border; }}
      />
      {error && <span style={{color:'#f87171',fontSize:'12px'}}>{error}</span>}
    </div>
  );
}

export function Textarea({ label, id, accent=C.accent, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      {label && <label htmlFor={id} style={{ fontSize:'13px', fontWeight:600, color:C.textSub }}>{label}</label>}
      <textarea id={id} {...props} style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:'10px', padding:'11px 13px', color:C.text, fontSize:'14px', outline:'none', transition:'border-color .2s', resize:'vertical', width:'100%', lineHeight:1.65, ...props.style }}
        onFocus={e=>{ e.target.style.borderColor=accent; }}
        onBlur={e=>{ e.target.style.borderColor=C.border; }}
      />
    </div>
  );
}

export function Select({ label, id, options=[], ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      {label && <label htmlFor={id} style={{ fontSize:'13px', fontWeight:600, color:C.textSub }}>{label}</label>}
      <select id={id} {...props} style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:'10px', padding:'10px 13px', color:C.text, fontSize:'14px', outline:'none', cursor:'pointer', width:'100%', ...props.style }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width='480px' }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:'20px', padding:'26px', width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', animation:'fadeUp .22s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
          <h2 style={{ fontFamily:"'Lora',serif", fontSize:'19px', fontWeight:700 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:'22px', lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ size=28, color=C.accent }) {
  return <div style={{ width:size, height:size, border:`3px solid ${C.border}`, borderTopColor:color, borderRadius:'50%', animation:'spin .65s linear infinite', flexShrink:0 }} />;
}

export function LoadingScreen({ message='Cargando...' }) {
  return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px' }}><Spinner size={40} /><span style={{color:C.muted,fontSize:'14px'}}>{message}</span></div>;
}

export function Alert({ type='error', children }) {
  const s = { error:{bg:'rgba(239,68,68,.1)',border:'#ef4444',text:'#fca5a5'}, success:{bg:C.greenSoft,border:C.green,text:'#6ee7b7'}, info:{bg:C.accentSoft,border:C.accent,text:'#93c5fd'}, warning:{bg:C.amberSoft,border:C.amber,text:'#fcd34d'} }[type];
  return <div style={{ background:s.bg, border:`1px solid ${s.border}40`, borderRadius:'10px', padding:'11px 15px', fontSize:'13px', color:s.text, lineHeight:1.6 }}>{children}</div>;
}

export function EmptyState({ emoji='📭', title, desc, action }) {
  return <div style={{ textAlign:'center', padding:'56px 24px' }}><div style={{fontSize:'50px',marginBottom:'14px'}}>{emoji}</div><div style={{fontWeight:700,fontSize:'17px',marginBottom:'6px'}}>{title}</div>{desc&&<div style={{color:C.muted,fontSize:'13px',marginBottom:'18px',maxWidth:'280px',margin:'0 auto 18px'}}>{desc}</div>}{action}</div>;
}

export function StatCard({ label, value, icon, color=C.accent, sub, trend }) {
  return (
    <Card style={{ padding:'18px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
        <span style={{ color:C.muted, fontSize:'12px', fontWeight:500, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</span>
        <span style={{ fontSize:'18px' }}>{icon}</span>
      </div>
      <div style={{ fontFamily:"'Lora',serif", fontSize:'28px', fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ color:C.muted, fontSize:'12px', marginTop:'4px' }}>{sub}</div>}
      {trend && <div style={{ fontSize:'12px', marginTop:'4px', color: trend>0?C.green:C.coral }}>{trend>0?'↑':'↓'} {Math.abs(trend)}% vs semana anterior</div>}
    </Card>
  );
}

export function ProgressBar({ value=0, max=100, color=C.accent, height=6 }) {
  const pct = Math.min(100, Math.round((value/max)*100));
  return <div style={{ height, background:C.surface, borderRadius:height, overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:height, transition:'width .4s ease' }} /></div>;
}

export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'18px' }}>
      <div>
        <h2 style={{ fontFamily:"'Lora',serif", fontSize:'19px', fontWeight:700 }}>{title}</h2>
        {sub && <p style={{ color:C.muted, fontSize:'12px', marginTop:'3px' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:'3px', background:C.surface, borderRadius:'11px', padding:'3px', width:'fit-content', marginBottom:'22px' }}>
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)} style={{
          background: active===t?C.card:'transparent', border: active===t?`1px solid ${C.border}`:'1px solid transparent',
          borderRadius:'8px', padding:'7px 16px', cursor:'pointer', color: active===t?C.text:C.muted,
          fontSize:'13px', fontWeight: active===t?600:400, transition:'all .18s', fontFamily:"'Sora',sans-serif",
        }}>{t}</button>
      ))}
    </div>
  );
}
