import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useMemo } from "react";
import { Download } from "lucide-react";
import type { ZoneKind } from "../../mocks/technologies.types";
import { buildGapReport, canon } from "../../rules/security-rules";

type RGB = [number, number, number];

const ZONES: ZoneKind[] = ["cloud", "dmz", "lan", "datacenter", "ot"];
const ZONE_LABEL: Record<ZoneKind, string> = {
  cloud: "Cloud",
  dmz: "DMZ",
  lan: "LAN",
  datacenter: "Data Center",
  ot: "OT (Tecnología Operacional)",
};

// Paleta
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

export default function ExportGapPdfButton({ nodes }: { nodes: any[] }) {
  // Reporte por zona
  const reportByZone = useMemo<Record<ZoneKind, GapEntry[]>>(() => {
    const m = {} as Record<ZoneKind, GapEntry[]>;
    ZONES.forEach((z) => (m[z] = buildGapReport(nodes, z) as GapEntry[]));
    return m;
  }, [nodes]);

  // Resumen con “salud” por zona
  const resume = useMemo(() => {
    return ZONES.map((z) => {
      const list = reportByZone[z] || [];
      const ok = list.filter(
        (r) =>
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
        subzones: list.length,
        ok,
        alerts,
        score,
        statusColor,
      };
    });
  }, [reportByZone]);

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - M * 2;

    // Header
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

    // Footer (lo aplicamos al final)
    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 20,
          {
            align: "center",
          }
        );
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
      "Este reporte proporciona un análisis detallado del estado de seguridad en las diferentes zonas de su infraestructura.",
      "Para cada zona y subzona, se identifican las tecnologías implementadas y aquellas que requieren atención.",
      "El objetivo es facilitar la planificación de mejoras y priorizar las acciones de seguridad.",
    ];
    let yPosition = 210;
    introText.forEach((line) => {
      doc.text(line, M, yPosition, { maxWidth: contentWidth });
      yPosition += 20;
    });

    // Resumen ejecutivo
    yPosition += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text("Resumen Ejecutivo", M, yPosition);

    yPosition += 25;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);

    const totalSubzones = resume.reduce((acc, curr) => acc + curr.subzones, 0);
    const totalOk = resume.reduce((acc, curr) => acc + curr.ok, 0);
    const totalScore =
      totalSubzones > 0 ? Math.round((totalOk / totalSubzones) * 100) : 0;

    doc.text(`Estado general de seguridad: ${totalScore}%`, M, yPosition);
    yPosition += 15;
    doc.text(`Total de subzonas evaluadas: ${totalSubzones}`, M, yPosition);
    yPosition += 15;
    doc.text(`Subzonas con configuración óptima: ${totalOk}`, M, yPosition);
    yPosition += 15;
    doc.text(
      `Subzonas que requieren atención: ${Math.max(
        totalSubzones - totalOk,
        0
      )}`,
      M,
      yPosition
    );

    // Tabla resumen
    yPosition += 30;
    autoTable(doc, {
      startY: yPosition,
      head: [
        ["Zona", "Subzonas", "Óptimas", "Por Mejorar", "Nivel de Seguridad"],
      ],
      body: resume.map((r) => [
        ZONE_LABEL[r.zone],
        String(r.subzones),
        String(r.ok),
        String(r.alerts),
        { content: `${r.score}%`, styles: { fillColor: r.statusColor } },
      ]),
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 6,
        overflow: "linebreak",
        lineColor: COLORS.border,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: "bold" },
        1: { cellWidth: 70, halign: "center" },
        2: { cellWidth: 70, halign: "center" },
        3: { cellWidth: 80, halign: "center" },
        4: { cellWidth: 90, halign: "center", fontStyle: "bold" },
      },
      margin: { left: M, right: M },
      didDrawPage: (data) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.primary);
        doc.text("Resumen por Zona", data.settings.margin.left, yPosition - 10);
      },
    });

    // Detalle por zona
    ZONES.forEach((zone, zoneIndex) => {
      doc.addPage();
      addHeader(ZONE_LABEL[zone]);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...COLORS.primary);
      doc.text(`Zona: ${ZONE_LABEL[zone]}`, M, 70);

      const zoneData = resume.find((r) => r.zone === zone);
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      if (zoneData) {
        doc.text(`Nivel de seguridad: ${zoneData.score}%`, pageWidth - M, 70, {
          align: "right",
        });
        doc.text(
          `Subzonas: ${zoneData.ok} óptimas de ${zoneData.subzones}`,
          pageWidth - M,
          85,
          { align: "right" }
        );
      }

      const rows = (reportByZone[zone] || []).map((r) => {
        const have = [
          ...(r.presentTechs || []).map(canon),
          ...((r.presentChecks || []).map(canon) ?? []),
        ];
        const missing = [
          ...(r.missingTechs || []).map(canon),
          ...((r.missingChecks || []).map(canon) ?? []),
        ];

        let status: string;
        let statusColor: RGB;
        if (missing.length === 0) {
          status = "Óptimo";
          statusColor = COLORS.success;
        } else if (zone === "ot") {
          status = "Faltan verificaciones";
          statusColor = COLORS.warning;
        } else {
          status = "Faltan tecnologías";
          statusColor = COLORS.danger;
        }

        return {
          subzone: r.subzoneName,
          have: have.length ? have : ["N/A"],
          missing: missing.length ? missing : ["Ninguno"],
          status,
          statusColor,
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
          { content: r.have.map((item) => `• ${item}`).join("\n") },
          { content: r.missing.map((item) => `• ${item}`).join("\n") },
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
        bodyStyles: {
          textColor: COLORS.text,
        },
        alternateRowStyles: {
          fillColor: COLORS.light,
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: "bold" },
          1: { cellWidth: 90, halign: "center" },
          2: { cellWidth: 160 },
          3: { cellWidth: 160 },
        },
        margin: { left: M, right: M },
        // Manejo robusto de multilínea + resaltado de recomendaciones
        didParseCell: (data) => {
          if (data.section !== "body") return;

          // Normaliza el contenido (soporta string u objeto { content })
          const raw = data.cell.raw as any;
          const content =
            raw && typeof raw === "object" && "content" in raw
              ? String(raw.content ?? "")
              : String(raw ?? "");

          // Convierte bullets en líneas separadas
          if (data.column.index === 2 || data.column.index === 3) {
            data.cell.text =
              typeof content === "string" ? content.split("\n") : content;
          }

          // Resalta la col. de recomendaciones si hay pendientes
          if (data.column.index === 3) {
            const hasPending =
              content &&
              content.trim() !== "" &&
              content.indexOf("• Ninguno") === -1;
            if (hasPending) {
              data.cell.styles.fillColor = [255, 245, 230];
            }
          }
        },
      });

      // Recomendaciones generales (solo si es la última zona)
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
          const recommendations = [
            "1. Priorice la implementación de tecnologías en las zonas con menor puntaje de seguridad.",
            "2. Considere soluciones integradas que cubran múltiples subzonas.",
            "3. Establezca un plan de acción con fechas específicas para cerrar brechas.",
            "4. Realice evaluaciones periódicas para medir el progreso.",
            "5. Capacite al personal en las nuevas tecnologías implementadas.",
          ];

          let recY = lastY + spacer + 20;
          recommendations.forEach((rec) => {
            doc.text(rec, M + 10, recY, { maxWidth: contentWidth - 20 });
            recY += 20;
          });
        }
      }
    });

    addFooter();
    doc.save(`reporte-seguridad-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <button
      onClick={exportPdf}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 transition-colors duration-200"
      title="Exportar reporte de seguridad en PDF"
    >
      <Download size={18} />
      <span className="font-medium">Exportar Reporte</span>
    </button>
  );
}
