export default function PresenceChips({
  users,
  status,
}: {
  users: { id: string; name: string; color: string }[];
  status: "connected" | "connecting" | "disconnected" | "error";
}) {
  const dot =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
      ? "bg-amber-400"
      : status === "error"
      ? "bg-red-500"
      : "bg-gray-500";

  return (
    <div className="absolute right-3 top-3 z-[110] flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-[#17171a] border border-white/10 px-2 py-1">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-xs text-gray-300">{status}</span>
      </div>
      <div className="flex -space-x-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="h-7 w-7 rounded-full ring-2 ring-[#0f1115] grid place-items-center text-[11px] font-semibold"
            style={{ background: u.color }}
            title={u.name}
          >
            {u.name.slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
