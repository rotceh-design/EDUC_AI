// src/services/analyticsService.js
// Motor de métricas, predicción de deserción y análisis de rendimiento

import { getProgressByStudent, getProgressBySchool, getProgressByCourse,
         getUsersBySchool, getClassesByCourse, getCoursesBySchool } from './db';

// ── Calcular score de riesgo de deserción (0-100, menor = más riesgo) ─────────
export function calculateRiskScore(metrics) {
  let score = 100;
  const reasons = [];

  // Factor 1: Días sin actividad (máx penalización: -45)
  const days = metrics.daysSinceLastActivity ?? 999;
  if (days >= 14)      { score -= 45; reasons.push(`Sin actividad hace ${days} días`); }
  else if (days >= 7)  { score -= 30; reasons.push(`${days} días sin estudiar`); }
  else if (days >= 4)  { score -= 15; reasons.push(`${days} días sin actividad`); }

  // Factor 2: Promedio quiz (máx penalización: -25)
  const avg = metrics.avgQuizScore ?? null;
  if (avg !== null) {
    if (avg < 40)       { score -= 25; reasons.push(`Promedio quiz muy bajo: ${avg}%`); }
    else if (avg < 60)  { score -= 15; reasons.push(`Promedio quiz bajo: ${avg}%`); }
    else if (avg < 75)  { score -= 8;  }
  }

  // Factor 3: Diversidad de estilos usados (máx penalización: -15)
  const styles = metrics.stylesUsed ?? 0;
  if (styles === 0)     { score -= 15; reasons.push('Nunca ha estudiado'); }
  else if (styles === 1){ score -= 8;  reasons.push('Solo usa 1 estilo de aprendizaje'); }

  // Factor 4: Sesiones en últimos 7 días (máx penalización: -15)
  const sessions7 = metrics.sessionsLast7Days ?? 0;
  if (sessions7 === 0 && days < 14) { score -= 15; }
  else if (sessions7 <= 1)          { score -= 8; }

  // Factor 5: Tendencia (comparar últimas 3 sesiones vs anteriores)
  if (metrics.trend === 'declining') { score -= 10; reasons.push('Rendimiento en declive'); }
  if (metrics.trend === 'improving') { score += 5; }

  // Factor 6: Completitud de clases (cuántas clases ha visto)
  const completion = metrics.completionRate ?? 0;
  if (completion < 0.3) { score -= 10; reasons.push(`Solo ha visto el ${Math.round(completion*100)}% de clases`); }

  return {
    score:   Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.slice(0, 3),
  };
}

// ── Métricas de un alumno ─────────────────────────────────────────────────────
export async function getStudentMetrics(studentId, schoolId) {
  const progress = await getProgressByStudent(studentId, schoolId);
  if (progress.length === 0) {
    return {
      totalSessions: 0, avgQuizScore: null, stylesUsed: 0,
      daysSinceLastActivity: 999, sessionsLast7Days: 0,
      trend: 'none', completionRate: 0,
      styleBreakdown: {}, quizHistory: [], riskScore: 15, riskReasons: ['Nunca ha accedido a la plataforma'],
    };
  }

  // Ordenar por fecha
  const sorted = [...progress].sort((a,b) => {
    const ta = a.updatedAt?.toDate?.()?.getTime() ?? 0;
    const tb = b.updatedAt?.toDate?.()?.getTime() ?? 0;
    return tb - ta;
  });

  const now       = Date.now();
  const lastDate  = sorted[0]?.updatedAt?.toDate?.()?.getTime() ?? 0;
  const daysSince = lastDate ? Math.floor((now - lastDate) / 86400000) : 999;

  const sessions7 = sorted.filter(p => {
    const t = p.updatedAt?.toDate?.()?.getTime() ?? 0;
    return (now - t) < 7 * 86400000;
  }).length;

  // Promedio quiz
  const quizSessions = sorted.filter(p => p.score != null && p.totalQ > 0);
  const avgQuiz = quizSessions.length
    ? Math.round(quizSessions.reduce((a,p) => a + (p.score/p.totalQ*100), 0) / quizSessions.length)
    : null;

  // Estilos usados
  const stylesSet  = new Set(sorted.map(p => p.styleId));
  const styleBreak = {};
  sorted.forEach(p => { styleBreak[p.styleId] = (styleBreak[p.styleId]||0)+1; });

  // Tendencia (últimas 3 vs anteriores 3 sesiones quiz)
  const qh = quizSessions.map(p => Math.round(p.score/p.totalQ*100));
  let trend = 'stable';
  if (qh.length >= 6) {
    const recent = qh.slice(0,3).reduce((a,b)=>a+b,0)/3;
    const older  = qh.slice(3,6).reduce((a,b)=>a+b,0)/3;
    if (recent - older > 8) trend = 'improving';
    else if (older - recent > 8) trend = 'declining';
  }

  const metrics = {
    totalSessions: sorted.length,
    avgQuizScore: avgQuiz,
    stylesUsed: stylesSet.size,
    daysSinceLastActivity: daysSince,
    sessionsLast7Days: sessions7,
    trend,
    completionRate: 0, // se calcula si se pasa courseId
    styleBreakdown: styleBreak,
    quizHistory: qh,
  };

  const { score, reasons } = calculateRiskScore(metrics);
  return { ...metrics, riskScore: score, riskReasons: reasons };
}

// ── Alumnos en riesgo de un curso ─────────────────────────────────────────────
export async function getAtRiskStudents(courseId, schoolId) {
  const [progressList, classes, students] = await Promise.all([
    getProgressByCourse(courseId),
    getClassesByCourse(courseId),
    getUsersBySchool(schoolId, 'student'),
  ]);

  const results = await Promise.all(students.map(async (student) => {
    const sp = progressList.filter(p => p.studentId === student.id);
    const totalClasses = classes.length;

    const sorted = [...sp].sort((a,b) => {
      const ta = a.updatedAt?.toDate?.()?.getTime() ?? 0;
      const tb = b.updatedAt?.toDate?.()?.getTime() ?? 0;
      return tb - ta;
    });

    const now        = Date.now();
    const lastDate   = sorted[0]?.updatedAt?.toDate?.()?.getTime() ?? 0;
    const daysSince  = lastDate ? Math.floor((now - lastDate) / 86400000) : 999;
    const sessions7  = sorted.filter(p => (now - (p.updatedAt?.toDate?.()?.getTime()??0)) < 7*86400000).length;
    const quizS      = sorted.filter(p => p.score!=null && p.totalQ>0);
    const avgQuiz    = quizS.length ? Math.round(quizS.reduce((a,p)=>a+(p.score/p.totalQ*100),0)/quizS.length) : null;
    const stylesSet  = new Set(sorted.map(p=>p.styleId));

    const classesVisited = new Set(sorted.map(p=>p.classId)).size;
    const completionRate = totalClasses > 0 ? classesVisited / totalClasses : 0;

    const qh   = quizS.map(p=>Math.round(p.score/p.totalQ*100));
    let trend  = 'stable';
    if (qh.length >= 6) {
      const r = qh.slice(0,3).reduce((a,b)=>a+b,0)/3;
      const o = qh.slice(3,6).reduce((a,b)=>a+b,0)/3;
      if (r-o>8) trend='improving'; else if (o-r>8) trend='declining';
    }

    const metrics = {
      totalSessions: sorted.length, avgQuizScore: avgQuiz,
      stylesUsed: stylesSet.size, daysSinceLastActivity: daysSince,
      sessionsLast7Days: sessions7, trend, completionRate,
    };

    const { score, reasons } = calculateRiskScore(metrics);

    return {
      ...student,
      metrics: { ...metrics, riskScore: score, riskReasons: reasons, quizHistory: qh },
    };
  }));

  return results.sort((a,b) => a.metrics.riskScore - b.metrics.riskScore);
}

// ── Métricas globales de la institución ───────────────────────────────────────
export async function getSchoolMetrics(schoolId) {
  const [allProgress, students, teachers, courses] = await Promise.all([
    getProgressBySchool(schoolId),
    getUsersBySchool(schoolId, 'student'),
    getUsersBySchool(schoolId, 'teacher'),
    getCoursesBySchool(schoolId),
  ]);

  const totalSessions = allProgress.length;
  const activeStudents = new Set(allProgress.map(p=>p.studentId)).size;
  const quizP          = allProgress.filter(p=>p.score!=null&&p.totalQ>0);
  const avgSchoolScore = quizP.length
    ? Math.round(quizP.reduce((a,p)=>a+(p.score/p.totalQ*100),0)/quizP.length)
    : 0;

  // Estilos más usados
  const styleCount = {};
  allProgress.forEach(p => { styleCount[p.styleId]=(styleCount[p.styleId]||0)+1; });
  const topStyle = Object.entries(styleCount).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null;

  // Actividad últimos 7 días
  const now = Date.now();
  const sessionsThisWeek = allProgress.filter(p => {
    const t = p.updatedAt?.toDate?.()?.getTime() ?? 0;
    return (now - t) < 7*86400000;
  }).length;

  // Actividad por día (últimos 14 días)
  const dailyActivity = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = now - (i+1)*86400000;
    const dayEnd   = now - i*86400000;
    const count    = allProgress.filter(p => {
      const t = p.updatedAt?.toDate?.()?.getTime() ?? 0;
      return t >= dayStart && t < dayEnd;
    }).length;
    const d = new Date(dayEnd);
    dailyActivity.push({
      fecha: `${d.getDate()}/${d.getMonth()+1}`,
      sesiones: count,
    });
  }

  // Distribución de riesgo aproximada (sin llamar individualmente por performance)
  const studentActivity = {};
  allProgress.forEach(p => {
    if (!studentActivity[p.studentId]) studentActivity[p.studentId] = { sessions:0, lastDate:0, quizScores:[] };
    studentActivity[p.studentId].sessions++;
    const t = p.updatedAt?.toDate?.()?.getTime()??0;
    if (t > studentActivity[p.studentId].lastDate) studentActivity[p.studentId].lastDate = t;
    if (p.score!=null&&p.totalQ>0) studentActivity[p.studentId].quizScores.push(p.score/p.totalQ*100);
  });

  let atRisk=0, watching=0, good=0, inactive=0;
  students.forEach(s => {
    const sa = studentActivity[s.id];
    if (!sa) { inactive++; return; }
    const days = Math.floor((now - sa.lastDate)/86400000);
    const avg  = sa.quizScores.length ? sa.quizScores.reduce((a,b)=>a+b,0)/sa.quizScores.length : null;
    const m    = { daysSinceLastActivity:days, avgQuizScore:avg, stylesUsed:1, sessionsLast7Days:sa.sessions, trend:'stable', completionRate:0.5 };
    const {score} = calculateRiskScore(m);
    if (score<=39) atRisk++; else if (score<=69) watching++; else good++;
  });

  return {
    totalStudents:    students.length,
    totalTeachers:    teachers.length,
    totalCourses:     courses.length,
    totalSessions,
    activeStudents,
    avgSchoolScore,
    topStyle,
    sessionsThisWeek,
    styleDistribution: styleCount,
    dailyActivity,
    riskDistribution: {
      atRisk,
      watching,
      good,
      inactive,
    },
  };
}

// ── Ranking de alumnos por rendimiento ────────────────────────────────────────
export async function getStudentRanking(courseId, schoolId) {
  const students = await getAtRiskStudents(courseId, schoolId);
  return students
    .filter(s => s.metrics.totalSessions > 0)
    .sort((a,b) => b.metrics.riskScore - a.metrics.riskScore);
}
