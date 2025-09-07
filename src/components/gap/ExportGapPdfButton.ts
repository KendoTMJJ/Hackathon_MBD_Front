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
  background: [250, 250, 250] as RGB,
};

type GapEntry = ReturnType<typeof buildGapReport>[number];

interface CompanyInfo {
  name: string;
  logo?: string; // URL o base64 string
}

export function exportGapPdf(
  nodes: any[],
  requirements: RequirementsMap,
  companyInfo?: CompanyInfo
) {
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
    let statusText: string;
    if (score >= 80) {
      statusColor = COLORS.success;
      statusText = "Alto";
    } else if (score >= 50) {
      statusColor = COLORS.warning;
      statusText = "Medio";
    } else {
      statusColor = COLORS.danger;
      statusText = "Bajo";
    }

    return {
      zone: z,
      zonePresent: kindsPresent.has(z),
      subzones: list.length,
      presentSubzones,
      ok,
      alerts,
      score,
      statusColor,
      statusText,
    };
  });

  // PDF
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 40; // Margen
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - M * 2;

  // Función para añadir logo y nombre de empresa
  const addCompanyHeader = (yPosition: number = 40) => {
    if (companyInfo) {
      // Logo (si está disponible)
      if (companyInfo.logo) {
        try {
          doc.addImage(companyInfo.logo, "PNG", M, yPosition - 30, 60, 30);
        } catch (e) {
          console.warn("No se pudo cargar el logo:", e);
        }
      }

      // Nombre de la empresa
      if (companyInfo.name) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...COLORS.primary);
        const nameX = companyInfo.logo ? M + 70 : M;
        doc.text(companyInfo.name, nameX, yPosition - 10);
      }
    }
  };

  const addHeader = (title?: string) => {
    // Fondo de encabezado
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 60, "F");

    // Añadir información de la empresa
    addCompanyHeader(45);

    // Título del reporte
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Reporte de Seguridad Cibernética", pageWidth / 2, 45, {
      align: "center",
    });

    if (title) {
      doc.setFontSize(12);
      doc.setTextColor(200, 200, 200);
      doc.text(title, pageWidth - M, 45, { align: "right" });
    }

    doc.setTextColor(...COLORS.text);
  };

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      // Línea separadora
      doc.setDrawColor(...COLORS.border);
      doc.line(M, pageHeight - 40, pageWidth - M, pageHeight - 40);

      // Información de pie de página
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 25, {
        align: "center",
      });
      doc.text(
        `Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`,
        pageWidth - M,
        pageHeight - 25,
        { align: "right" }
      );

      // Texto de confidencialidad
      doc.setFont("helvetica", "italic");
      doc.text("Confidencial - Uso interno exclusivo", M, pageHeight - 25);
    }
  };

  // Portada
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Logo y nombre de empresa en portada
  addCompanyHeader(120);

  // Título principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.primary);
  doc.text("Análisis de Seguridad", pageWidth / 2, 180, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.secondary);
  doc.text("Reporte de Brechas y Recomendaciones", pageWidth / 2, 210, {
    align: "center",
  });

  // Línea decorativa
  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(2);
  doc.line(M, 240, pageWidth - M, 240);

  // Resumen ejecutivo en portada
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);

  const totalSubzones = resume.reduce((acc, r) => acc + r.subzones, 0);
  const totalOk = resume.reduce((acc, r) => acc + r.ok, 0);
  const totalScore =
    totalSubzones > 0 ? Math.round((totalOk / totalSubzones) * 100) : 0;

  let y = 270;
  doc.setFont("helvetica", "bold");
  doc.text("Resumen Ejecutivo", pageWidth / 2, y, { align: "center" });

  y += 25;
  doc.setFont("helvetica", "normal");

  // Calificación general con ícono visual
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  if (totalScore >= 80) {
    doc.setTextColor(...COLORS.success);
  } else if (totalScore >= 50) {
    doc.setTextColor(...COLORS.warning);
  } else {
    doc.setTextColor(...COLORS.danger);
  }
  doc.text(`Calificación General: ${totalScore}%`, pageWidth / 2, y, {
    align: "center",
  });

  y += 25;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);

  const summaryText = [
    `Este reporte analiza el estado de seguridad de ${resume.reduce(
      (a, r) => a + r.presentSubzones,
      0
    )} subzonas presentes`,
    `en su infraestructura, distribuidas en ${
      resume.filter((r) => r.zonePresent).length
    } zonas.`,
    ``,
    `• Subzonas óptimas: ${totalOk} de ${totalSubzones}`,
    `• Subzonas por mejorar: ${Math.max(totalSubzones - totalOk, 0)}`,
    ``,
    `El documento contiene recomendaciones específicas para cada área,`,
    `priorizadas según su impacto en la postura de seguridad general.`,
  ];

  summaryText.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 18;
  });

  // Fecha de generación
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el ${new Date().toLocaleDateString()}`, pageWidth / 2, y, {
    align: "center",
  });

  // Tabla de Contenidos (para facilitar navegación)
  doc.addPage();
  addHeader("Tabla de Contenidos");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text("Tabla de Contenidos", M, 80);

  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(1);
  doc.line(M, 90, M + 150, 90);

  let tocY = 110;
  const tocItems = [
    { title: "Resumen Ejecutivo", page: 2 },
    ...ZONES.filter((z) => resume.find((r) => r.zone === z)?.zonePresent).map(
      (z, i) => ({ title: `Zona ${ZONE_LABEL[z]}`, page: i + 3 })
    ),
    {
      title: "Recomendaciones Generales",
      page:
        ZONES.filter((z) => resume.find((r) => r.zone === z)?.zonePresent)
          .length + 3,
    },
  ];

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);

  tocItems.forEach((item) => {
    doc.text(item.title, M, tocY);
    // Línea de puntos
    const dotLength =
      pageWidth -
      M * 2 -
      doc.getTextWidth(item.title) -
      doc.getTextWidth(` ${item.page}`) -
      10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);

    let dotX = M + doc.getTextWidth(item.title) + 5;
    while (dotX < M + doc.getTextWidth(item.title) + dotLength) {
      doc.line(dotX, tocY - 3, dotX + 2, tocY - 3);
      dotX += 5;
    }

    doc.text(`${item.page}`, pageWidth - M, tocY, { align: "right" });
    tocY += 25;
  });

  // Resumen Ejecutivo detallado
  doc.addPage();
  addHeader("Resumen Ejecutivo");

  let yPos = 80;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text("Resumen Ejecutivo", M, yPos);

  yPos += 30;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);

  const introText = [
    "Este reporte proporciona un análisis detallado del estado de seguridad de su infraestructura,",
    "identificando brechas y proporcionando recomendaciones accionables. Los hallazgos se basan en",
    "la evaluación de las tecnologías implementadas versus los requisitos de seguridad esperados",
    "para cada subzona de su entorno.",
    "",
    "Clasificación de estados:",
    "• Óptimo: Subzona presente y cumple todos los requisitos de seguridad",
    "• Por mejorar: Subzona presente pero con requisitos faltantes",
    "• Posible implementación: Subzona no presente (oportunidad de mejora)",
  ];

  introText.forEach((line) => {
    doc.text(line, M, yPos, { maxWidth: contentWidth });
    yPos += 18;
  });

  // Tabla Resumen con mejoras visuales
  yPos += 20;
  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Zona",
        "Subzonas Totales",
        "Subzonas Presentes",
        "Óptimas",
        "Por Mejorar",
        "Nivel de Seguridad",
      ],
    ],
    body: resume.map((r) => [
      {
        content: `${ZONE_LABEL[r.zone]}${
          r.zonePresent ? "" : " (no presente)"
        }`,
        styles: { fontStyle: r.zonePresent ? "bold" : "normal" },
      },
      String(r.subzones),
      String(r.presentSubzones),
      String(r.ok),
      String(r.alerts),
      {
        content: `${r.score}% - ${r.statusText}`,
        styles: {
          fillColor: r.statusColor,
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
      },
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
      0: { cellWidth: 120, fontStyle: "bold" },
      1: { cellWidth: 60, halign: "center" },
      2: { cellWidth: 70, halign: "center" },
      3: { cellWidth: 60, halign: "center" },
      4: { cellWidth: 80, halign: "center" },
      5: { cellWidth: 100, halign: "center" },
    },
    margin: { left: M, right: M },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.text("Resumen por Zona", data.settings.margin.left, yPos - 10);
    },
  });

  // Gráfico de resumen visual (simulado con texto)
  const finalY = (doc as any).lastAutoTable?.finalY || yPos;
  if (finalY + 100 < pageHeight - 40) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text("Distribución General de Seguridad", M, finalY + 30);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    // Simulación simple de gráfico de barras con texto
    const totalItems = resume.length;
    const barWidth = contentWidth / totalItems - 10;

    resume.forEach((r, i) => {
      const x = M + i * (barWidth + 10);
      const barHeight = (r.score / 100) * 50;

      // Barra
      doc.setFillColor(...r.statusColor);
      doc.rect(x, finalY + 60 + (50 - barHeight), barWidth, barHeight, "F");

      // Etiqueta
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(8);
      doc.text(
        ZONE_LABEL[r.zone].substring(0, 8),
        x + barWidth / 2,
        finalY + 115,
        { align: "center" }
      );

      // Porcentaje
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(8);
      doc.text(
        `${r.score}%`,
        x + barWidth / 2,
        finalY + 55 + (50 - barHeight),
        { align: "center" }
      );
    });

    // Eje Y
    doc.setLineWidth(0.5);
    doc.setDrawColor(...COLORS.border);
    doc.line(M, finalY + 60, M, finalY + 110);
    doc.line(M, finalY + 110, M + contentWidth, finalY + 110);

    // Marcas de porcentaje
    [0, 25, 50, 75, 100].forEach((p) => {
      const yPos = finalY + 110 - (p / 100) * 50;
      doc.line(M - 5, yPos, M, yPos);
      doc.text(`${p}%`, M - 8, yPos + 3, { align: "right" });
    });
  }

  // Detalle por zona
  ZONES.forEach((zone, zoneIndex) => {
    const zoneData = resume.find((r) => r.zone === zone);
    if (!zoneData?.zonePresent) return; // Saltar zonas no presentes

    doc.addPage();
    addHeader(ZONE_LABEL[zone]);

    const zoneRows = reportByZone[zone] || [];

    // Título de zona
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Zona: ${ZONE_LABEL[zone]}`, M, 70);

    // Estado general de la zona
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);

    doc.text(`Nivel de seguridad: ${zoneData.score}%`, pageWidth - M, 70, {
      align: "right",
    });

    doc.text(
      `Subzonas: ${zoneData.ok} óptimas de ${zoneData.subzones}`,
      pageWidth - M,
      85,
      { align: "right" }
    );

    // Descripción de la zona (para no expertos)
    const zoneDescriptions: Record<ZoneKind, string> = {
      cloud:
        "Entornos cloud públicos y privados donde se ejecutan aplicaciones y se almacenan datos.",
      dmz: "Zona desmilitarizada que actúa como barrera entre internet y la red interna.",
      lan: "Red de área local donde se conectan estaciones de trabajo y dispositivos internos.",
      datacenter:
        "Infraestructura centralizada que aloja servidores y sistemas críticos.",
      ot: "Sistemas de tecnología operacional que controlan procesos industriales físicos.",
    };

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(zoneDescriptions[zone], M, 90, { maxWidth: contentWidth });

    // Filas de detalle
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
      let explanation: string;

      if (!r.subzonePresent) {
        status = "Posible implementación";
        color = COLORS.warning;
        explanation =
          "Esta subzona no está presente en su infraestructura actual.";
      } else if (missing.length === 0) {
        status = "Óptimo";
        color = COLORS.success;
        explanation = "Cumple con todos los requisitos de seguridad.";
      } else if (zone === "ot") {
        status = "Faltan verificaciones";
        color = COLORS.warning;
        explanation = "Requiere controles de seguridad específicos para OT.";
      } else {
        status = "Faltan tecnologías";
        color = COLORS.danger;
        explanation =
          "Se necesitan implementar medidas de seguridad adicionales.";
      }

      // Si no está presente, las "recomendaciones" son TODOS los requisitos
      const recs =
        !r.subzonePresent && Array.isArray(requirements[r.subzoneId])
          ? requirements[r.subzoneId]
          : missing;

      return {
        subzone: r.subzoneName,
        status,
        statusColor: color,
        explanation,
        have: have.length ? have : ["Ninguna tecnología registrada"],
        missing: (recs?.length
          ? recs
          : ["No se requieren acciones adicionales"]
        ).map(canon),
      };
    });

    autoTable(doc, {
      startY: 110,
      head: [
        [
          "Subzona",
          "Estado",
          "Tecnologías Implementadas",
          "Recomendaciones / Acciones Requeridas",
        ],
      ],
      body: rows.map((r) => [
        {
          content: r.subzone,
          styles: { fontStyle: "bold" },
        },
        {
          content: `${r.status}\n${r.explanation}`,
          styles: {
            fillColor: r.statusColor,
            textColor: 255,
            fontStyle: "bold",
            cellPadding: 5,
          },
        },
        {
          content: r.have.map((it) => `• ${it}`).join("\n"),
          styles: { cellPadding: 5 },
        },
        {
          content: r.missing.map((it) => `• ${it}`).join("\n"),
          styles: {
            cellPadding: 5,
            fillColor:
              r.statusColor[0] === COLORS.danger[0]
                ? [255, 245, 230]
                : [240, 250, 240],
          },
        },
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: COLORS.border,
        lineWidth: 0.5,
        textColor: COLORS.text,
        overflow: "linebreak",
        minCellHeight: 20,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 6,
      },
      alternateRowStyles: { fillColor: COLORS.light },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: "bold" },
        1: { cellWidth: 120, halign: "center" },
        2: { cellWidth: 130 },
        3: { cellWidth: 130 },
      },
      margin: { left: M, right: M },
      didParseCell: (data) => {
        if (data.section !== "body") return;

        // Para celdas con múltiples líneas, ajustar altura
        if (data.column.index === 2 || data.column.index === 3) {
          const content = String(data.cell.raw || "");
          const lineCount = content.split("\n").length;
          if (lineCount > 3) {
            data.cell.styles.minCellHeight = 10 * lineCount;
          }
        }
      },
    });

    // Recomendaciones específicas de zona
    const lastY = (doc as any).lastAutoTable?.finalY ?? 110;
    if (lastY + 50 < pageHeight - 100) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.text("Recomendaciones Prioritarias para esta Zona", M, lastY + 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const zoneRecommendations: Record<ZoneKind, string[]> = {
        cloud: [
          "1. Implementar gestión centralizada de identidades y acceso (IAM).",
          "2. Asegurar que todos los datos sensibles estén cifrados en reposo y tránsito.",
          "3. Configurar monitorización y alertas de seguridad continuas.",
          "4. Establecer políticas de respaldo y recuperación ante desastres.",
        ],
        dmz: [
          "1. Revisar y actualizar reglas de firewall regularmente.",
          "2. Implementar sistemas de prevención de intrusiones (IPS).",
          "3. Asegurar el parcheo oportuno de todos los sistemas expuestos.",
          "4. Configurar honeypots para detectar actividades maliciosas.",
        ],
        lan: [
          "1. Segmentar la red para limitar el movimiento lateral.",
          "2. Implementar autenticación 802.1X para dispositivos de red.",
          "3. Desplegar solución de protección de endpoints (EDR).",
          "4. Establecer políticas de uso aceptable y capacitación de usuarios.",
        ],
        datacenter: [
          "1. Implementar controles de acceso físico y lógico estrictos.",
          "2. Asegurar la monitorización continua de servidores críticos.",
          "3. Establecer políticas de hardening para todos los sistemas.",
          "4. Implementar solución de gestión de vulnerabilidades.",
        ],
        ot: [
          "1. Aislar redes OT de redes IT con un DMZ industrial.",
          "2. Implementar monitorización específica para protocolos OT.",
          "3. Realizar auditorías periódicas de dispositivos ICS/SCADA.",
          "4. Desarrollar planes de respuesta a incidentes específicos para OT.",
        ],
      };

      let recY = lastY + 40;
      zoneRecommendations[zone].forEach((rec) => {
        doc.text(rec, M + 10, recY, { maxWidth: contentWidth - 20 });
        recY += 18;
      });
    }
  });

  // Página final de recomendaciones generales
  doc.addPage();
  addHeader("Recomendaciones Generales");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text("Recomendaciones Generales", M, 80);

  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(1);
  doc.line(M, 90, M + 250, 90);

  let yRec = 120;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);

  const generalRecommendations = [
    {
      title: "Gobernanza y Estrategia",
      items: [
        "Establecer un comité de seguridad que se reúna trimestralmente.",
        "Desarrollar una estrategia de seguridad alineada con objetivos de negocio.",
        "Asignar claramente roles y responsabilidades de seguridad.",
        "Definir métricas e indicadores clave de desempeño (KPIs).",
      ],
    },
    {
      title: "Gestión de Riesgos",
      items: [
        "Implementar un proceso formal de gestión de riesgos.",
        "Realizar evaluaciones de riesgo anuales o ante cambios significativos.",
        "Establecer un registro de riesgos con planes de tratamiento.",
        "Integrar la gestión de riesgos en los proyectos de TI.",
      ],
    },
    {
      title: "Concientización y Capacitación",
      items: [
        "Implementar programas regulares de concientización en seguridad.",
        "Capacitar específicamente a roles con mayores privilegios.",
        "Realizar simulacros de phishing y otros ataques comunes.",
        "Establecer una cultura de seguridad organizacional.",
      ],
    },
    {
      title: "Monitorización y Mejora Continua",
      items: [
        "Implementar un Centro de Operaciones de Seguridad (SOC).",
        "Establecer revisiones periódicas de efectividad de controles.",
        "Automatizar la recolección y análisis de métricas de seguridad.",
        "Realizar ejercicios de tabletop para mejorar la respuesta a incidentes.",
      ],
    },
  ];

  generalRecommendations.forEach((section) => {
    // Título de sección
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text(section.title, M, yRec);
    yRec += 20;

    // Items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    section.items.forEach((item) => {
      doc.text(`• ${item}`, M + 10, yRec, { maxWidth: contentWidth - 20 });
      yRec += 18;
    });

    yRec += 10; // Espacio entre secciones
  });

  // Plan de acción sugerido
  if (yRec < pageHeight - 100) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text("Plan de Acción Sugerido", M, yRec + 20);

    doc.setDrawColor(...COLORS.secondary);
    doc.setLineWidth(1);
    doc.line(M, yRec + 30, M + 200, yRec + 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    const actionPlan = [
      "Corto plazo (0-3 meses): Abordar las brechas de alto riesgo identificadas.",
      "Mediano plazo (3-12 meses): Implementar controles de seguridad faltantes.",
      "Largo plazo (1-2 años): Establecer programa maduro de gestión de seguridad.",
    ];

    let planY = yRec + 50;
    actionPlan.forEach((item) => {
      doc.text(`• ${item}`, M + 10, planY, { maxWidth: contentWidth - 20 });
      planY += 20;
    });
  }

  addFooter();
  const fileName = `reporte-seguridad-${
    companyInfo?.name
      ? companyInfo.name.replace(/\s+/g, "-").toLowerCase()
      : "empresa"
  }-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
