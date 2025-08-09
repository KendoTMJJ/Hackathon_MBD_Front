import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Cloud } from "lucide-react";

interface CloudNodeProps {
  data: {
    label: string;
    icon?: React.ReactNode;
    bgColor?: string;
  };
}

export default function CloudNode({ data }: CloudNodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-cyan-50 border-2 border-cyan-200 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Cloud className="w-5 h-5 text-cyan-600" />
        <div>
          <div className="text-sm font-bold text-cyan-800">{data.label}</div>
          <div className="text-xs text-cyan-600">Cloud Service</div>
        </div>
      </div>

      {/* Entradas y salidas */}
      {/* Entradas */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: "#555" }}
      />

      {/* Salidas */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ background: "#0f0" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ background: "#0f0" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ background: "#0f0" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ background: "#0f0" }}
      />
    </div>
  );
}
