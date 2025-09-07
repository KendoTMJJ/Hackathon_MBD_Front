import { useState } from "react";
import type { Technology } from "../../../mocks/technologies.types";
import { Handle, Position } from "@xyflow/react";

/** Lo que guardaremos en Node.data */
export type SwitchPayload = {
  kind: "switch";
  technology: Technology & { isSwitch: true };
};

export const SWITCH_TECH: Technology & { isSwitch: true } = {
  id: "switch-fixed",
  name: "Switch",
  imageUrl: "/images/Switch.png",
  description:
    "Un switch (conmutador) es un dispositivo de red de Capa 2/Capa 3...",
  provider: "TX ONE",
  tags: ["switching"],
  allowedZones: [],
  allowedSubzones: [],
  isSwitch: true,
};

export default function SwitchNode({ data }: { data: SwitchPayload }) {
  const [hover, setHover] = useState(false);
  const t = data.technology;

  return (
    <div
      className="group relative select-none rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm hover:shadow-md"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-2">
        <img
          src={t.imageUrl || "/placeholder.svg"}
          className="w-20 h-20 object-contain"
          alt={t.name}
        />
      </div>

      {[
        { type: "target", position: Position.Top, id: "top" },
        { type: "target", position: Position.Left, id: "left" },
        { type: "target", position: Position.Right, id: "right" },
        { type: "target", position: Position.Bottom, id: "bottom" },
        { type: "source", position: Position.Top, id: "top-source" },
        { type: "source", position: Position.Left, id: "left-source" },
        { type: "source", position: Position.Right, id: "right-source" },
        { type: "source", position: Position.Bottom, id: "bottom-source" },
      ].map((handle) => (
        <Handle
          key={`${handle.type}-${handle.id}`}
          className="!w-4 !h-4 !bg-gray-700 !border-2 !border-white rounded-full opacity-60 group-hover:!opacity-100 transition-all duration-200 hover:!scale-125 hover:!bg-blue-600"
          type={handle.type as any}
          position={handle.position}
          id={handle.id}
        />
      ))}

      {hover && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {t.name}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1">
              <div className="w-2 h-2 bg-gray-900 rotate-45 transform"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
