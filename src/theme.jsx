// src/theme.js — educ_AI v3.0 (compatible JSX)
import React from 'react';

export const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/educai-cc1ac.firebasestorage.app/o/logo.png?alt=media&token=006a6ac6-dd45-4b1c-9790-f19ddb65e4ce";

export const C = {
  bg:          '#060b14',
  surface:     '#0b1324',
  card:        '#101a30',
  cardHover:   '#162442',
  border:      '#1c2a4a',
  borderHover: '#2a3f6d',

  accent:      '#38bdf8',
  accentSoft:  'rgba(56,189,248,0.12)',
  red:         '#ef4444',
  redSoft:     'rgba(239,68,68,0.12)',
  blue:        '#3b82f6',
  blueSoft:    'rgba(59,130,246,0.12)',
  green:       '#10b981',
  greenSoft:   'rgba(16,185,129,0.12)',
  brown:       '#b45309',
  brownSoft:   'rgba(180,83,9,0.12)',
  yellow:      '#eab308',
  yellowSoft:  'rgba(234,179,8,0.12)',

  amber:       '#f59e0b',
  amberSoft:   'rgba(245,158,11,0.12)',
  coral:       '#f43f5e',
  coralSoft:   'rgba(244,63,94,0.12)',
  violet:      '#8b5cf6',
  violetSoft:  'rgba(139,92,246,0.12)',
  pink:        '#d946ef',
  pinkSoft:    'rgba(217,70,239,0.12)',

  // Aliases para compatibilidad con código existente
  rose:        '#d946ef',
  roseSoft:    'rgba(217,70,239,0.12)',

  text:        '#f8fafc',
  textSub:     '#94a3b8',
  muted:       '#475569',
};

// ── ICONOS SVG ────────────────────────────────────────────────────────────────
export const Icons = {
  Read:     ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Visual:   ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  Audio:    ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>,
  Quiz:     ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Practice: ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>,
  Memory:   ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="12" height="14" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V7"/></svg>,
  CircleDot:({ s=14,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill={c}/></svg>,
  Book:     ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Activity: ({ s=20,c="currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

// ── ESTILOS DE APRENDIZAJE ────────────────────────────────────────────────────
export const STYLES = [
  { id:'lector',   icon:<Icons.Read s={18}/>,     label:'Lectura',  desc:'Resumen y conceptos clave',    color:C.accent, soft:C.accentSoft },
  { id:'visual',   icon:<Icons.Visual s={18}/>,   label:'Visual',   desc:'Mapas y esquemas analíticos',  color:C.green,  soft:C.greenSoft  },
  { id:'auditivo', icon:<Icons.Audio s={18}/>,    label:'Auditivo', desc:'Narración y podcast',          color:C.amber,  soft:C.amberSoft  },
  { id:'quiz',     icon:<Icons.Quiz s={18}/>,     label:'Quiz',     desc:'Preguntas interactivas',       color:C.coral,  soft:C.coralSoft  },
  { id:'practica', icon:<Icons.Practice s={18}/>, label:'Misiones', desc:'Resolución de problemas',      color:C.violet, soft:C.violetSoft },
  { id:'memoria',  icon:<Icons.Memory s={18}/>,   label:'Juegos',   desc:'Tarjetas y memoria activa',    color:C.pink,   soft:C.pinkSoft   },
];

// ── RIESGO ────────────────────────────────────────────────────────────────────
export const RISK_LEVELS = {
  high:   { label:'Riesgo Crítico',    color:C.red,   bg:C.redSoft,   icon:<Icons.CircleDot c={C.red}/>,   min:0,  max:39  },
  medium: { label:'En Observación',    color:C.amber, bg:C.amberSoft, icon:<Icons.CircleDot c={C.amber}/>, min:40, max:69  },
  low:    { label:'Rendimiento Óptimo',color:C.green, bg:C.greenSoft, icon:<Icons.CircleDot c={C.green}/>, min:70, max:100 },
};

export const getRiskLevel = (score) => {
  if (score <= 39) return RISK_LEVELS.high;
  if (score <= 69) return RISK_LEVELS.medium;
  return RISK_LEVELS.low;
};

// ── COLOR POR ASIGNATURA ──────────────────────────────────────────────────────
export const getSubjectColor = (name) => {
  if (!name) return C.accent;
  const s = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if (s.includes('lenguaje')||s.includes('literatura')||s.includes('filosofia')||s.includes('castellano')) return C.red;
  if (s.includes('matematica')||s.includes('calculo')||s.includes('algebra')||s.includes('geometria'))     return C.blue;
  if (s.includes('ciencia')||s.includes('biologia')||s.includes('quimica')||s.includes('fisica'))          return C.green;
  if (s.includes('historia')||s.includes('geografia')||s.includes('sociales')||s.includes('civica'))       return C.brown;
  if (s.includes('ingles')||s.includes('idioma'))                                                           return C.yellow;
  if (s.includes('arte')||s.includes('visuales'))                                                           return C.pink;
  if (s.includes('musica'))                                                                                  return C.violet;
  if (s.includes('tecnologia')||s.includes('programacion')||s.includes('computacion'))                     return C.accent;
  return C.accent;
};

// ── ESTILOS GLOBALES ──────────────────────────────────────────────────────────
export const injectGlobalStyles = () => {
  if (document.getElementById('educ-ai-global')) return;
  const s = document.createElement('style');
  s.id = 'educ-ai-global';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Sora:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body {
      background:${C.bg}; font-family:'Sora',sans-serif; color:${C.text};
      -webkit-font-smoothing:antialiased;
      background-image:
        linear-gradient(to right,rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(to bottom,rgba(255,255,255,0.015) 1px,transparent 1px);
      background-size:40px 40px;
    }
    ::selection { background:${C.pinkSoft}; color:${C.pink}; }
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:${C.bg}; }
    ::-webkit-scrollbar-thumb { background:${C.borderHover}; border-radius:4px; }
    ::-webkit-scrollbar-thumb:hover { background:${C.pink}; }
    a { color:inherit; text-decoration:none; }
    button,input,textarea,select { font-family:'Sora',sans-serif; outline:none; }
    h1 { font-family:'Press Start 2P',cursive !important; font-size:1.3rem !important; line-height:1.5; text-transform:uppercase; }
    .font-retro { font-family:'Press Start 2P',cursive !important; text-transform:uppercase; }
    .glow-text,.text-gradient {
      background:linear-gradient(90deg,${C.accent},${C.pink});
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      filter:drop-shadow(0px 0px 10px rgba(217,70,239,0.5));
      display:inline-block;
    }
    .glass { background:rgba(17,24,39,0.65); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.05); }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    .anim-fade-up { animation:fadeUp .4s cubic-bezier(0.16,1,0.3,1) both; }
    .anim-d1{animation-delay:.05s} .anim-d2{animation-delay:.1s}
    .anim-d3{animation-delay:.15s} .anim-d4{animation-delay:.2s} .anim-d5{animation-delay:.25s}
    .spinner { width:28px;height:28px;border:3px solid ${C.borderHover};border-top-color:${C.accent};border-radius:50%;animation:spin .65s linear infinite; }
  `;
  document.head.appendChild(s);
};