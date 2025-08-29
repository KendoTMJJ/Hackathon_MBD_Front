
import type { Technology } from "../../../mocks/technologies.types";
import type { ZoneKind } from "../../data/zones";

type Props = {
  data: Technology & { zoneKind?: ZoneKind }; // le pasamos la zona para tematizar colores
};

const THEME: Record<
  ZoneKind,
  { bg: string; border: string; text: string; accent: string }
> = {
  cloud: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-900",
    accent: "text-cyan-600",
  },
  dmz: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    accent: "text-amber-600",
  },
  lan: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    accent: "text-sky-600",
  },
  datacenter: {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-900",
    accent: "text-fuchsia-600",
  },
  ot: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-900",
    accent: "text-orange-600",
  },
};

export default function TechNode({ data }: Props) {
  // const kind = (data.zoneKind ?? "lan") as ZoneKind;
  // const theme = THEME[kind];

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-transparent">
      <div className="flex items-center gap-2">
        <img src={data.imageUrl} className="w-10 h-10 text-cyan-600" />
      </div>
    </div>
  );
}
