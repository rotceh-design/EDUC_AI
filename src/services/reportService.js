// src/services/reportService.js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportAdminReport(data) {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'EDUC_AI Sistema Neuroeducativo';
    wb.created = new Date();
    const dateStr = wb.created.toLocaleDateString('es-CL');

    // 🎨 PALETA DE COLORES CYBERPUNK (Hexadecimal sin '#')
    const C_DARK = 'FF050A10';   // Azul marino muy oscuro
    const C_ACCENT = 'FF10B981'; // Verde Neón
    const C_WHITE = 'FFFFFFFF';
    const C_GRAY = 'FFF8FAFC';   // Gris súper claro para efecto cebra

    // 🛠️ FUNCIÓN CONSTRUCTORA DE TABLAS PROFESIONALES
    const buildSheet = (sheetName, title, headers, rows) => {
      // Ocultar las feas líneas grises de Excel
      const ws = wb.addWorksheet(sheetName, { views: [{ showGridLines: false }] });
      
      // Título de la Hoja
      ws.mergeCells('B2:F3');
      const titleCell = ws.getCell('B2');
      titleCell.value = title.toUpperCase();
      titleCell.font = { size: 16, bold: true, color: { argb: C_DARK }, name: 'Arial' };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Cabeceras de la tabla
      const headerRow = ws.getRow(5);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 2); // Empezamos en la columna B para dejar margen
        cell.value = header;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_DARK } };
        cell.font = { color: { argb: C_WHITE }, bold: true, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: {style:'medium', color:{argb:C_ACCENT}}, 
          bottom: {style:'medium', color:{argb:C_ACCENT}}
        };
      });

      // Filas de datos
      rows.forEach((rowData, rIndex) => {
        const row = ws.getRow(6 + rIndex);
        rowData.forEach((val, cIndex) => {
          const cell = row.getCell(cIndex + 2);
          cell.value = val;
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          cell.border = { bottom: {style:'thin', color:{argb:'FFCBD5E1'}} };
          
          // Efecto Cebra para legibilidad
          if (rIndex % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_GRAY } };
          }
        });
      });

      // Auto-ajustar el ancho de las columnas
      ws.columns = [
        { width: 4 }, // A (Margen izquierdo)
        ...headers.map(() => ({ width: 30 })) // Columnas dinámicas más anchas
      ];
    };

    // ── 1. PORTADA ESTILIZADA ───────────────────────────────────────────────
    const wsPortada = wb.addWorksheet('Portada', { views: [{ showGridLines: false }] });
    wsPortada.columns = [{ width: 5 }, { width: 35 }, { width: 50 }];
    
    wsPortada.mergeCells('B3:C6');
    const pTitle = wsPortada.getCell('B3');
    pTitle.value = 'EDUC_AI\nREPORTE INTEGRAL DE GESTIÓN';
    pTitle.font = { size: 26, bold: true, color: { argb: C_WHITE } };
    pTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_DARK } };
    pTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    pTitle.border = { bottom: {style:'thick', color:{argb:C_ACCENT}} };

    const meta = [
      { r: 9,  lbl: 'INSTITUCIÓN:', val: data.school?.name || 'Colegio no especificado' },
      { r: 10, lbl: 'FECHA DE GENERACIÓN:', val: dateStr },
      { r: 11, lbl: 'TOTAL ALUMNOS:', val: data.students?.length || 0 },
      { r: 12, lbl: 'TOTAL DOCENTES:', val: data.teachers?.length || 0 },
      { r: 13, lbl: 'AULAS ACTIVAS:', val: data.classGroups?.length || 0 }
    ];

    meta.forEach(m => {
      wsPortada.getCell(`B${m.r}`).value = m.lbl;
      wsPortada.getCell(`B${m.r}`).font = { bold: true, color: { argb: C_DARK } };
      wsPortada.getCell(`C${m.r}`).value = m.val;
      wsPortada.getCell(`C${m.r}`).font = { color: { argb: 'FF334155' }, size: 12 };
      wsPortada.getCell(`C${m.r}`).alignment = { horizontal: 'right' };
      wsPortada.getCell(`B${m.r}`).border = { bottom: {style:'hair'} };
      wsPortada.getCell(`C${m.r}`).border = { bottom: {style:'hair'} };
    });

    // ── 2. ESTADÍSTICAS ─────────────────────────────────────────────────────
    const hEst = ['Métrica del Sistema', 'Valor Cuantitativo'];
    const rEst = [
      ['Total Estudiantes', data.students?.length || 0],
      ['Total Profesores', data.teachers?.length || 0],
      ['Total Aulas', data.classGroups?.length || 0],
      ['Total Materias Creadas', data.courses?.length || 0]
    ];
    buildSheet('Estadísticas', 'Visión General del Colegio', hEst, rEst);

    // ── 3. MATRÍCULA ────────────────────────────────────────────────────────
    const hMat = ['RUT', 'Nombre Completo', 'Aula Asignada', 'Nivel', 'Puntos XP', 'Apoderado'];
    const rMat = (data.students || []).map(s => {
      const aula = (data.classGroups || []).find(cg => cg.id === s.classGroupId);
      return [s.rut||'—', s.name||'—', aula?.name||'Sin Aula', aula?.level||'—', s.xp||0, s.guardian||'—'];
    });
    buildSheet('Matrícula', 'Directorio Oficial de Estudiantes', hMat, rMat);

    // ── 4. DOCENTES ─────────────────────────────────────────────────────────
    const hDoc = ['RUT', 'Nombre Docente', 'Especialidad', 'Materias a Cargo', 'Email'];
    const rDoc = (data.teachers || []).map(t => [
      t.rut||'—', t.name||'—', t.specialty||'General', 
      (data.courses||[]).filter(c=>c.teacherId===t.id).length, t.email||'—'
    ]);
    buildSheet('Docentes', 'Plantilla Académica', hDoc, rDoc);

    // ── 5. ACTA DE RIESGO ───────────────────────────────────────────────────
    const hRsk = ['Nombre Alumno', 'Puntaje Riesgo', 'Estado Crítico', 'Promedio Evaluaciones', 'Actividad'];
    const rRsk = (data.students || []).map(s => {
      const rs = s.riskScore !== undefined ? s.riskScore : 100;
      let estado = rs <= 39 ? '🔴 RIESGO ALTO' : (rs <= 69 ? '🟡 MEDIO' : '🟢 ÓPTIMO');
      return [s.name||'—', rs, estado, s.metrics?.avgQuizScore ? `${s.metrics.avgQuizScore}%` : 'N/A', `${s.metrics?.totalSessions||0} Sesiones`];
    }).sort((a, b) => a[1] - b[1]);
    buildSheet('Acta de Riesgo', 'Monitoreo de Deserción Escolar', hRsk, rRsk);

    // ── 6. INFORME POR AULA ─────────────────────────────────────────────────
    const hAul = ['Nombre del Aula', 'Nivel', 'Año', 'Cant. Alumnos', 'Materias Impartidas'];
    const rAul = (data.classGroups || []).map(cg => [
      cg.name||'—', cg.level||'—', cg.year||'—',
      (data.students || []).filter(s => s.classGroupId === cg.id).length,
      (data.courses || []).filter(c => c.classGroupId === cg.id).length
    ]);
    buildSheet('Aulas', 'Distribución de Aulas', hAul, rAul);

    // ── 7. BITÁCORA ─────────────────────────────────────────────────────────
    const timeline = [
      ...(data.students || []).map(s => ({ f: s.createdAt, t: 'Alta Alumno', d: s.name })),
      ...(data.courses || []).map(c => ({ f: c.createdAt, t: 'Materia Creada', d: c.name }))
    ].filter(x => x.f).sort((a, b) => b.f.toMillis() - a.f.toMillis());

    const hBit = ['Fecha Registro', 'Tipo Evento', 'Detalle'];
    const rBit = timeline.map(t => {
      const date = t.f.toDate ? t.f.toDate().toLocaleDateString('es-CL') : '—';
      return [date, t.t, t.d];
    });
    buildSheet('Bitácora', 'Historial del Sistema', hBit, rBit);

    // ── DESCARGA DEL ARCHIVO ────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Premium_EDUCAI_${dateStr.replace(/\//g, '-')}.xlsx`);
    
  } catch (error) {
    console.error("Error generando Excel:", error);
    alert("Error al generar el documento profesional.");
  }
}