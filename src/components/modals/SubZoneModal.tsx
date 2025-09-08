import { useEffect, useMemo, useState } from "react";
import type { infoModalProps } from "./props/props";
import { zoneTemplates, type ZoneKind } from "../data/zones";
import { cloudZones } from "../data/CloudZones";
import { dmzZones } from "../data/DmzZones";
import { lanZones } from "../data/LanZones";
import { otZones } from "../data/OtZones";
import { datacenterZones } from "../data/DatacenterZones";
import ImgModal from "./ImgModal";

export default function SubZoneModal({
  isOpen,
  onClose,
  title,
  initialZone = "cloud",
  onChange,
}: infoModalProps) {
  const [zone, setZone] = useState<ZoneKind>(initialZone);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [imgModalOpen, setImgModal] = useState(false);

  type AnySubzone = {
    id: string;
    name: string;
    description?: string;
    caracteristics?: string;
    color: string;
    icon?: string;
  };

  const SUBZONES_BY_ZONE: Record<ZoneKind, AnySubzone[]> = {
    cloud: cloudZones as AnySubzone[],
    dmz: dmzZones as AnySubzone[],
    lan: lanZones as AnySubzone[],
    datacenter: datacenterZones as AnySubzone[],
    ot: otZones as AnySubzone[],
  };

  const subzones = useMemo(() => SUBZONES_BY_ZONE[zone] ?? [], [zone]);

  useEffect(() => {
    if (!activeSubId && subzones.length > 0) {
      setActiveSubId(subzones[0].id);
    }
  }, [subzones, activeSubId]);

  const activeSub = useMemo(
    () => subzones.find((s) => s.id === activeSubId) || null,
    [subzones, activeSubId]
  );

  if (!isOpen) return null;

  const zoneMeta = zoneTemplates.find((z) => z.id === zone)!;
  // const zoneImage =
  //   zoneImages?.[zone] ??
  //   `https://dummyimage.com/800x300/${zoneMeta.color.replace(
  //     "#",
  //     ""
  //   )}/ffffff&text=${encodeURIComponent(zoneMeta.name)}`;

  const handleSubzoneSelect = (subzoneId: string) => {
    setActiveSubId(subzoneId);
    setShowInfo(true);
    onChange?.(zone, subzoneId);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold">{title}</h2>

          {/* Pestañas de zonas */}
          <div className="flex flex-wrap gap-2">
            {zoneTemplates.map((z) => {
              const active = z.id === zone;
              return (
                <button
                  key={z.id}
                  onClick={() => {
                    setZone(z.id as ZoneKind);
                    setShowInfo(false);
                  }}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    active
                      ? "bg-white/20"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                  style={{
                    border: active ? `1px solid ${z.color}` : undefined,
                  }}
                  aria-pressed={active}
                >
                  {z.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setImgModal(true)}
            className="rounded-md border border-white/10 bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
          >
            Imagen
          </button>

          <button
            onClick={onClose}
            className="rounded-md bg-white/10 px-2 py-1 text-sm text-white/70 hover:bg-white/20"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Body - Manteniendo la estructura de dos columnas */}
        <div className="grid grid-cols-12 gap-0">
          {/* Lista lateral de subzonas */}
          <aside className="col-span-4 max-h-[70vh] overflow-y-auto border-r border-white/10 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/80">
              Subzonas de {zoneMeta.name}
            </h3>
            <div className="flex flex-col gap-2">
              {subzones.map((s) => {
                const isActive = s.id === activeSubId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSubzoneSelect(s.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                      isActive
                        ? "border-white/20 bg-white/10"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="text-lg">{s.icon ?? "📦"}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="rounded px-2 py-0.5 text-[10px] uppercase tracking-wide"></span>
                      </div>
                      {s.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-white/60">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
              {subzones.length === 0 && (
                <p className="text-sm text-white/50">
                  Esta zona no tiene subzonas definidas.
                </p>
              )}
            </div>
          </aside>
          {/* Contenido principal - Imagen que ocupa todo el espacio */}
          <section className="col-span-8 relative">
            {/* Imagen de la zona que ocupa todo el espacio */}
            <div className="h-full w-full overflow-hidden">
              <img
                src={zoneMeta.img}
                alt={`Imagen de la zona ${zoneMeta.name}`}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Información de subzona que aparece al seleccionar */}
            {showInfo && activeSub && (
              <div className="absolute inset-0 bg-black/80 p-6 flex flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <div className="text-3xl">{activeSub.icon ?? "📦"}</div>
                  <div>
                    <h3 className="text-2xl font-semibold">{activeSub.name}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: activeSub.color }}
                        title="Color de referencia"
                      />
                      <span className="rounded px-2 py-1 text-xs uppercase tracking-wide"></span>
                    </div>
                  </div>
                </div>

                {activeSub.description && (
                  <p className="text-lg text-white/80 mb-6">
                    {activeSub.description}
                  </p>
                )}

                <div className="rounded-lg border border-white/15 p-4 mb-6">
                  <h4 className="text-lg font-medium mb-3">Características</h4>
                  <p className="text-white/60">
                    {activeSub.caracteristics}
                  </p>
                </div>

                <div className="mt-auto flex justify-end">
                  <button
                    onClick={() => setShowInfo(false)}
                    className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                  >
                    Cerrar información
                  </button>
                </div>
              </div>
            )}

            {/* Indicador para mostrar que se puede seleccionar una subzona */}
            {!showInfo && (
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md rounded-lg p-3 border border-white/10">
                <p className="text-sm text-white/80">
                  Selecciona una subzona para ver su información
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
      <ImgModal isOpen={imgModalOpen} onClose={() => setImgModal(false)} />
    </div>
  );
}
