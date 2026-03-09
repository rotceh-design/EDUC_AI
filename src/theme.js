export const C = {
  bg:          '#09101f',
  surface:     '#111827',
  card:        '#141c2e',
  cardHover:   '#1a2440',
  border:      '#1e2d4a',
  borderHover: '#2a3d66',
  accent:      '#4f8ef7',
  accentSoft:  'rgba(79,142,247,0.12)',
  green:       '#34d399',
  greenSoft:   'rgba(52,211,153,0.12)',
  amber:       '#fbbf24',
  amberSoft:   'rgba(251,191,36,0.12)',
  coral:       '#f97316',
  coralSoft:   'rgba(249,115,22,0.12)',
  violet:      '#a78bfa',
  violetSoft:  'rgba(167,139,250,0.12)',
  rose:        '#fb7185',
  roseSoft:    'rgba(251,113,133,0.12)',
  red:         '#ef4444',
  redSoft:     'rgba(239,68,68,0.12)',
  text:        '#e8eaf0',
  textSub:     '#94a3b8',
  muted:       '#4b5a7a',
};

export const STYLES = [
  { id:'lector',   emoji:'📖', label:'Lectura',  desc:'Resumen y conceptos clave',    color:C.accent, soft:C.accentSoft  },
  { id:'visual',   emoji:'🗺️', label:'Visual',   desc:'Mapas y esquemas',             color:C.green,  soft:C.greenSoft   },
  { id:'auditivo', emoji:'🎧', label:'Auditivo', desc:'Narración para escuchar',      color:C.amber,  soft:C.amberSoft   },
  { id:'quiz',     emoji:'🎮', label:'Quiz',     desc:'Preguntas interactivas',       color:C.coral,  soft:C.coralSoft   },
  { id:'practica', emoji:'✏️', label:'Práctica', desc:'Ejercicios paso a paso',       color:C.violet, soft:C.violetSoft  },
];

export const RISK_LEVELS = {
  high:   { label:'En riesgo',       color:C.red,   bg:C.redSoft,   emoji:'🔴', min:0,  max:39  },
  medium: { label:'En observación',  color:C.amber, bg:C.amberSoft, emoji:'🟡', min:40, max:69  },
  low:    { label:'Bien',            color:C.green, bg:C.greenSoft, emoji:'🟢', min:70, max:100 },
};

export const getRiskLevel = (score) => {
  if (score <= 39) return RISK_LEVELS.high;
  if (score <= 69) return RISK_LEVELS.medium;
  return RISK_LEVELS.low;
};

export const injectGlobalStyles = () => {
  if (document.getElementById('educ-ai-global')) return;
  const s = document.createElement('style');
  s.id = 'educ-ai-global';
  s.textContent = `
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:${C.bg}; font-family:'Sora',sans-serif; color:${C.text}; -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:${C.bg}; }
    ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
    a { color:inherit; text-decoration:none; }
    button, input, textarea, select { font-family:'Sora',sans-serif; }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    .anim-fade-up { animation:fadeUp .4s ease both; }
    .anim-d1{animation-delay:.05s} .anim-d2{animation-delay:.1s}
    .anim-d3{animation-delay:.18s} .anim-d4{animation-delay:.26s} .anim-d5{animation-delay:.34s}
    .spinner { width:28px;height:28px;border:3px solid ${C.border};border-top-color:${C.accent};border-radius:50%;animation:spin .65s linear infinite; }
    .skeleton { background:linear-gradient(90deg,${C.card} 25%,${C.surface} 50%,${C.card} 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px; }
  `;
  document.head.appendChild(s);
};
