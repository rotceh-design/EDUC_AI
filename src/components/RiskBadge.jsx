import { C, getRiskLevel } from '@/theme';

export default function RiskBadge({ score, showScore=true, size='sm' }) {
  const lvl  = getRiskLevel(score);
  const big  = size === 'lg';

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            '5px',
      background:     lvl.bg,
      color:          lvl.color,
      border:         `1px solid ${lvl.color}40`,
      borderRadius:   '20px',
      padding:        big ? '6px 14px' : '3px 10px',
      fontSize:       big ? '13px' : '11px',
      fontWeight:     700,
      whiteSpace:     'nowrap',
    }}>
      <span>{lvl.emoji}</span>
      <span>{lvl.label}</span>
      {showScore && <span style={{ opacity:.7 }}>({score})</span>}
    </span>
  );
}
