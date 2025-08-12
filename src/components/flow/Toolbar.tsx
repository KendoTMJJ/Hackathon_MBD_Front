import React from "react";
import { Save, Download, Upload, Play, Square, Layers } from "lucide-react";

interface ToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onPresentationMode: () => void;
  presentationMode: boolean;
  onShowZones: () => void;
  showZones: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onLoad,
  onExport,
  onPresentationMode,
  presentationMode,
  onShowZones,
  showZones,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-blue-600">🔐</div>
          <h1 className="text-xl font-bold text-gray-800">
            Security Architecture Designer
          </h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={onShowZones}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showZones
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Zonas
          </button>

          <button
            onClick={onPresentationMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              presentationMode
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
            }`}
          >
            {presentationMode ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {presentationMode ? "Salir" : "Presentar"}
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>

          <input
            type="file"
            id="load-file"
            accept=".json"
            onChange={onLoad}
            className="hidden"
          />
          <label
            htmlFor="load-file"
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Cargar
          </label>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
};
