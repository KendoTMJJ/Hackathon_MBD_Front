import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function NavBar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = (user?.name || user?.email || "U")
    .trim()
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b12]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0b0b12]/70">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white">
        <Link to="/" className="rounded-md px-3 py-1.5 hover:bg-white/5">
          Home
        </Link>
        <div className="relative" ref={menuRef}>
          {!isAuthenticated ? (
            <button
              onClick={() =>
                loginWithRedirect({
                  appState: { returnTo: "/" },
                  authorizationParams: { ui_locales: "es" },
                })
              }
              className="rounded-md border border-white/10 bg-[#171727] px-3 py-1.5 hover:bg-[#1c1c2e]"
            >
              Iniciar sesión
            </button>
          ) : (
            <>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/5"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {user?.picture ? (
                  <img
                    src={String(user.picture) || "/placeholder.svg"}
                    alt={String(user.name ?? "Usuario")}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs font-bold">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:inline text-sm">
                  {user?.name ?? "Mi perfil"}
                </span>
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-white/10 bg-[#141420] text-sm shadow-lg"
                >
                  <button
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left hover:bg-white/5"
                    onClick={() => {
                      setOpen(false);
                      navigate("/profile");
                    }}
                  >
                    Mi perfil
                  </button>
                  <button
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left hover:bg-white/5"
                    onClick={() => {
                      setOpen(false);
                      logout({
                        logoutParams: { returnTo: window.location.origin },
                      });
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
