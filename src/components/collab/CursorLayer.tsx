type Viewport = { x: number; y: number; zoom: number };
type RemoteCursor = {
  userId: string;
  x: number;
  y: number;
  name: string;
  color: string;
};

export default function CursorLayer({
  cursors,
  viewport,
}: {
  cursors: RemoteCursor[];
  viewport: Viewport;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {cursors.map((c) => {
        const px = c.x * viewport.zoom + viewport.x;
        const py = c.y * viewport.zoom + viewport.y;
        return (
          <div
            key={c.userId}
            className="absolute translate-x-0 translate-y-0"
            style={{ left: px, top: py }}
          >
            <div className="flex items-center gap-1">
              <div
                style={{ borderLeftColor: c.color }}
                className="w-0 h-0 border-l-8 border-y-8 border-y-transparent"
              />
              <span
                className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                style={{
                  background: c.color + "22",
                  border: `1px solid ${c.color}55`,
                  color: "#fff",
                }}
              >
                {c.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
