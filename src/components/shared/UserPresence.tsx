import { useWebSocket } from "../../context/WebSocketContext";

export function UserPresence() {
  const { users, currentUser, isConnected } = useWebSocket();

  const otherUsers = users.filter((user) => user.id !== currentUser?.id);

  if (!isConnected || otherUsers.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="relative h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {otherUsers.length > 5 && (
          <div className="relative h-8 w-8 rounded-full border-2 border-white bg-gray-600 flex items-center justify-center text-xs font-medium text-white">
            +{otherUsers.length - 5}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-full bg-green-600/20 border border-green-500/30 px-2 py-1">
        <div className="h-2 w-2 rounded-full bg-green-400"></div>
        <span className="text-xs text-green-300">
          {otherUsers.length} usuario{otherUsers.length !== 1 ? "s" : ""}{" "}
          editando
        </span>
      </div>
    </div>
  );
}

export function UserCursors() {
  const { users, currentUser } = useWebSocket();

  const otherUsers = users.filter(
    (user) => user.id !== currentUser?.id && user.cursor
  );

  return (
    <>
      {otherUsers.map((user) => (
        <div
          key={user.id}
          className="absolute pointer-events-none z-50 transition-all duration-100"
          style={{
            left: user.cursor!.x,
            top: user.cursor!.y,
            transform: "translate(-2px, -2px)",
          }}
        >
          <div className="relative" style={{ color: user.color }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="drop-shadow-lg"
            >
              <path d="M5.65376 12.3673L5.65376 5.63288L18.3461 12.3673L12.1737 14.9569L9.58407 21.1295L5.65376 12.3673Z" />
            </svg>
            <div
              className="absolute top-5 left-2 px-2 py-1 text-xs rounded whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              <span className="text-white font-medium">{user.name}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
