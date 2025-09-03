// components/gap/exportGapPdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ZoneKind } from "../../mocks/technologies.types";
import {
  buildGapReport,
  canon,
  getZoneKindsPresent,
  type RequirementsMap,
} from "../../rules/security-rules";

type RGB = [number, number, number];

const ZONES: ZoneKind[] = ["cloud", "dmz", "lan", "datacenter", "ot"];
const ZONE_LABEL: Record<ZoneKind, string> = {
  cloud: "Cloud",
  dmz: "DMZ",
  lan: "LAN",
  datacenter: "Data Center",
  ot: "OT (Tecnología Operacional)",
};

const COLORS = {
  primary: [35, 35, 42] as RGB,
  secondary: [59, 130, 246] as RGB,
  success: [34, 197, 94] as RGB,
  warning: [234, 179, 8] as RGB,
  danger: [239, 68, 68] as RGB,
  light: [248, 250, 252] as RGB,
  dark: [15, 23, 42] as RGB,
  text: [30, 41, 59] as RGB,
  border: [226, 232, 240] as RGB,
};

type GapEntry = ReturnType<typeof buildGapReport>[number];

export function exportGapPdf(nodes: any[], requirements: RequirementsMap) {
  // Presencia de zonas en el tablero
  const kindsPresent = getZoneKindsPresent(nodes);

  // Reporte por zona (trae presencia por subzona)
  const reportByZone = ZONES.reduce((acc, z) => {
    acc[z] = buildGapReport(nodes, z, requirements) as GapEntry[];
    return acc;
  }, {} as Record<ZoneKind, GapEntry[]>);

  // Resumen con presencia y score
  const resume = ZONES.map((z) => {
    const list = reportByZone[z] || [];
    const presentSubzones = list.filter((r) => r.subzonePresent).length;

    // Óptima SOLO si la subzona está presente Y no falta nada
    const ok = list.filter(
      (r) =>
        r.subzonePresent &&
        (r.missingTechs?.length ?? 0) + (r.missingChecks?.length ?? 0) === 0
    ).length;

    const alerts = list.length - ok;
    const score = list.length ? Math.round((ok / list.length) * 100) : 0;

    let statusColor: RGB;
    if (score >= 80) statusColor = COLORS.success;
    else if (score >= 50) statusColor = COLORS.warning;
    else statusColor = COLORS.danger;

    return {
      zone: z,
      zonePresent: kindsPresent.has(z),
      subzones: list.length,
      presentSubzones,
      ok,
      alerts,
      score,
      statusColor,
    };
  });

  // PDF
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - M * 2;

  const addHeader = (title?: string) => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Reporte de Seguridad", M, 25);
    if (title) {
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(title, pageWidth - M, 25, { align: "right" });
    }
    doc.setTextColor(...COLORS.text);
  };

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 20, {
        align: "center",
      });
      doc.text(
        `Generado el ${new Date().toLocaleDateString()}`,
        pageWidth - M,
        pageHeight - 20,
        { align: "right" }
      );
    }
  };

  // Portada
  addHeader();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text("Análisis de Seguridad", pageWidth / 2, 120, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  doc.text("Reporte de Brechas y Recomendaciones", pageWidth / 2, 150, {
    align: "center",
  });

  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(2);
  doc.line(M, 180, pageWidth - M, 180);

  // Intro
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  const introText = [
    "Se detectan zonas y subzonas presentes en el tablero.",
    "Las subzonas ausentes se marcan como “Posible implementación”.",
    "Una subzona es Óptima solo si está presente y cumple todos los requisitos.",
  ];
  let y = 210;
  introText.forEach((line) => {
    doc.text(line, M, y, { maxWidth: contentWidth });
    y += 20;
  });

  // Resumen Ejecutivo
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text("Resumen Ejecutivo", M, y);

  y += 25;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);

  const totalSubzones = resume.reduce((acc, r) => acc + r.subzones, 0);
  const totalOk = resume.reduce((acc, r) => acc + r.ok, 0);
  const totalScore =
    totalSubzones > 0 ? Math.round((totalOk / totalSubzones) * 100) : 0;

  doc.text(`Estado general de seguridad: ${totalScore}%`, M, y);
  y += 15;
  doc.text(
    `Subzonas presentes: ${resume.reduce(
      (a, r) => a + r.presentSubzones,
      0
    )} de ${totalSubzones}`,
    M,
    y
  );
  y += 15;
  doc.text(`Subzonas óptimas: ${totalOk}`, M, y);
  y += 15;
  doc.text(
    `Subzonas por mejorar o no implementadas: ${Math.max(
      totalSubzones - totalOk,
      0
    )}`,
    M,
    y
  );

  // Tabla Resumen
  y += 30;
  autoTable(doc, {
    startY: y,
    head: [
      ["Zona", "Subzonas", "Presentes", "Óptimas", "Por Mejorar", "Nivel"],
    ],
    body: resume.map((r) => [
      `${ZONE_LABEL[r.zone]}${r.zonePresent ? "" : " (no presente)"}`,
      String(r.subzones),
      String(r.presentSubzones),
      String(r.ok),
      String(r.alerts),
      { content: `${r.score}%`, styles: { fillColor: r.statusColor } },
    ]),
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 6,
      lineColor: COLORS.border,
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: COLORS.light },
    columnStyles: {
      0: { cellWidth: 170, fontStyle: "bold" },
      1: { cellWidth: 70, halign: "center" },
      2: { cellWidth: 80, halign: "center" },
      3: { cellWidth: 70, halign: "center" },
      4: { cellWidth: 90, halign: "center" },
      5: { cellWidth: 70, halign: "center", fontStyle: "bold" },
    },
    margin: { left: M, right: M },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.text("Resumen por Zona", data.settings.margin.left, y - 10);
    },
  });

  // Detalle por zona
  ZONES.forEach((zone, zoneIndex) => {
    doc.addPage();
    addHeader(ZONE_LABEL[zone]);

    const zoneRows = reportByZone[zone] || [];
    const zonePresent = kindsPresent.has(zone);

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Zona: ${ZONE_LABEL[zone]}`, M, 70);

    const z = resume.find((r) => r.zone === zone);
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    if (!zonePresent) {
      doc.text(
        "⚠ Zona no presente en el tablero. Recomendación: crear subzonas base.",
        pageWidth - M,
        70,
        { align: "right" }
      );
    } else if (z) {
      doc.text(`Nivel de seguridad: ${z.score}%`, pageWidth - M, 70, {
        align: "right",
      });
      doc.text(
        `Subzonas: ${z.ok} óptimas de ${z.subzones}`,
        pageWidth - M,
        85,
        { align: "right" }
      );
    }

    // Filas
    const rows = zoneRows.map((r) => {
      const have = [
        ...(r.presentTechs || []).map(canon),
        ...((r.presentChecks || []).map(canon) ?? []),
      ];
      const missing = [
        ...(r.missingTechs || []).map(canon),
        ...((r.missingChecks || []).map(canon) ?? []),
      ];

      let status: string;
      let color: RGB;

      if (!r.subzonePresent) {
        status = "Posible implementación (no presente)";
        color = COLORS.warning;
      } else if (missing.length === 0) {
        status = "Óptimo";
        color = COLORS.success;
      } else if (zone === "ot") {
        status = "Faltan verificaciones";
        color = COLORS.warning;
      } else {
        status = "Faltan tecnologías";
        color = COLORS.danger;
      }

      // Si no está presente, las “recomendaciones” son TODOS los requisitos
      const recs =
        !r.subzonePresent && Array.isArray(requirements[r.subzoneId])
          ? requirements[r.subzoneId]
          : missing;

      return {
        subzone: r.subzoneName,
        status,
        statusColor: color,
        have: have.length ? have : ["-"],
        missing: (recs?.length ? recs : ["Ninguno"]).map(canon),
      };
    });

    autoTable(doc, {
      startY: 100,
      head: [
        ["Subzona", "Estado", "Tecnologías Implementadas", "Recomendaciones"],
      ],
      body: rows.map((r) => [
        r.subzone,
        {
          content: r.status,
          styles: { fillColor: r.statusColor, textColor: 255 },
        },
        { content: r.have.map((it) => `• ${it}`).join("\n") },
        { content: r.missing.map((it) => `• ${it}`).join("\n") },
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 6,
        lineColor: COLORS.border,
        lineWidth: 0.5,
        textColor: COLORS.text,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: COLORS.light },
      columnStyles: {
        0: { cellWidth: 140, fontStyle: "bold" },
        1: { cellWidth: 140, halign: "center" },
        2: { cellWidth: 150 },
        3: { cellWidth: 150 },
      },
      margin: { left: M, right: M },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const raw = data.cell.raw as any;
        const content =
          raw && typeof raw === "object" && "content" in raw
            ? String(raw.content ?? "")
            : String(raw ?? "");
        if (data.column.index === 2 || data.column.index === 3) {
          data.cell.text =
            typeof content === "string" ? content.split("\n") : content;
        }
        if (data.column.index === 3) {
          const hasPending = content && content.indexOf("• Ninguno") === -1;
          if (hasPending) data.cell.styles.fillColor = [255, 245, 230];
        }
      },
    });

    // Recomendaciones generales al final del último capítulo
    if (zoneIndex === ZONES.length - 1) {
      const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
      const spacer = 20;
      if (lastY + spacer < pageHeight - 100) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.primary);
        doc.text("Recomendaciones Generales", M, lastY + spacer);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const recs = [
          "1. Crear las zonas no presentes e implementar las subzonas críticas.",
          "2. Priorizar subzonas con más requisitos faltantes.",
          "3. Definir plan de remediación con tiempos y responsables.",
          "4. Medir avances con evaluaciones periódicas.",
          "5. Capacitar al personal sobre las nuevas tecnologías.",
        ];
        let recY = lastY + spacer + 20;
        recs.forEach((rec) => {
          doc.text(rec, M + 10, recY, { maxWidth: contentWidth - 20 });
          recY += 20;
        });
      }
    }
  });

  addFooter();
  doc.save(`reporte-seguridad-${new Date().toISOString().split("T")[0]}.pdf`);
}
