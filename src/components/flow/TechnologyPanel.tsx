
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { useState } from "react";
import { securityTechnologies } from "../data/securityTechnologies";
import type { SecurityCategory, SecurityTechnology } from "../types/securityTypes";

interface TechnologyPanelProps {
  onDragStart: (event: React.DragEvent, technology: SecurityTechnology) => void;
}

const categoryNames: Record<SecurityCategory, string> = {
  firewall: "Firewalls",
  waf: "Web App Firewalls",
  proxy: "Proxy/Gateway",
  nac: "Network Access",
  ips: "Intrusion Prevention",
  ids: "Intrusion Detection",
  siem: "SIEM/Analytics",
  endpoint: "Endpoint Security",
  encryption: "Encryption",
  authentication: "Identity/Auth",
  monitoring: "Monitoring",
  backup: "Backup/Recovery",
  server: "Servers",
  network: "Network",
};

export const TechnologyPanel: React.FC<TechnologyPanelProps> = ({
  onDragStart,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<
    Set<SecurityCategory>
  >(new Set(["firewall", "waf", "ips"]));
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCategory = (category: SecurityCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredTechnologies = securityTechnologies.filter(
    (tech) =>
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTechnologies = filteredTechnologies.reduce((acc, tech) => {
    if (!acc[tech.category]) {
      acc[tech.category] = [];
    }
    acc[tech.category].push(tech);
    return acc;
  }, {} as Record<SecurityCategory, SecurityTechnology[]>);

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Tecnologías de Seguridad
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar tecnologías..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedTechnologies).map(([category, technologies]) => (
          <div key={category} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleCategory(category as SecurityCategory)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">
                {categoryNames[category as SecurityCategory]} (
                {technologies.length})
              </span>
              {expandedCategories.has(category as SecurityCategory) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedCategories.has(category as SecurityCategory) && (
              <div className="pb-2">
                {technologies.map((tech) => (
                  <div
                    key={tech.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, tech)}
                    className="mx-3 mb-2 p-3 border border-gray-200 rounded cursor-grab hover:shadow-md transition-shadow bg-gray-50 hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{tech.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">
                          {tech.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {tech.manufacturer}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {tech.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
