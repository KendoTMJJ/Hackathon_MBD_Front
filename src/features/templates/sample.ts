// src/features/templates/sample.ts
import type { DocumentData } from "../../models";

/** Plantilla de ejemplo compatible con tus nodeTypes/edgeTypes (usa "cloud" y edge "secure") */
export const SAMPLE_TEMPLATE_TITLE = "Arquitectura Básica";
export const SAMPLE_TEMPLATE_DATA: DocumentData = {
  nodes: [
    {
      id: "start",
      type: "cloud",
      position: { x: 0, y: 0 },
      data: { label: "Cliente" },
    },
    {
      id: "api",
      type: "cloud",
      position: { x: 200, y: 0 },
      data: { label: "API Gateway" },
    },
    {
      id: "svc",
      type: "cloud",
      position: { x: 400, y: 0 },
      data: { label: "Servicio" },
    },
    {
      id: "db",
      type: "cloud",
      position: { x: 600, y: 0 },
      data: { label: "Base de Datos" },
    },
  ],
  edges: [
    { id: "e1", source: "start", target: "api", type: "secure" as any },
    { id: "e2", source: "api", target: "svc", type: "secure" as any },
    { id: "e3", source: "svc", target: "db", type: "secure" as any },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};
