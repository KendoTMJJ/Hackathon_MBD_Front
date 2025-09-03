import type { Technology } from "../../../mocks/technologies.types";
import type { ZoneKind } from "../../data/zones";
import { useState } from "react";

type Props = {
  data: Technology & { zoneKind?: ZoneKind };
};

export default function TechNode({ data }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative px-4 py-2 shadow-sm rounded-lg bg-white border border-gray-200 hover:shadow-md transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2">
        <img
          src={data.imageUrl}
          className="w-10 h-10 object-contain"
          alt={data.name}
        />
      </div>

      {isHovered && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {data.name}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-3 h-3 bg-gray-900 rotate-45 transform origin-center"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
