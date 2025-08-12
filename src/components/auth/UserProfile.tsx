import { useAuth0 } from "@auth0/auth0-react";

export default function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth0();

  if (!isAuthenticated || !user) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <img
        src={String(user.picture)}
        alt={String(user.name)}
        style={{ width: 48, borderRadius: 24 }}
      />
      <div>{user.name}</div>
      <div>{user.email}</div>
      <button
        onClick={() =>
          logout({ logoutParams: { returnTo: window.location.origin } })
        }
      >
        Cerrar sesión
      </button>
    </div>
  );
}
