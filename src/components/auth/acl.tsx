// src/auth/acl.tsx
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

/* --- Definición de permisos soportados por la app --- */
export type Permission =
  | "template:create"
  | "template:delete"
  | "template:view"
  | "document:create"
  | "document:delete"
  | "document:view"
  | "admin:users";

/* --- Roles hardcodeados con los permisos que otorgan --- */
const ROLE_PERMS: Record<string, Permission[]> = {
  admin: [
    "template:create",
    "template:delete",
    "template:view",
    "document:create",
    "document:delete",
    "document:view",
    "admin:users",
  ],
};

/* --- Namespace usado en el claim de Auth0 Action --- */
const CLAIMS_NAMESPACE = "https://tuapp.com"; // 👈 cámbialo a tu dominio/namespace

/* Extrae roles del usuario desde el claim del token */
export function getUserRoles(user: any): string[] {
  if (!user) return [];
  const nsRoles = user?.[`${CLAIMS_NAMESPACE}/roles`];
  if (Array.isArray(nsRoles)) return nsRoles.map(String);
  if (Array.isArray(user?.roles)) return user.roles.map(String);
  if (typeof user?.roles === "string")
    return user.roles.split(",").map((r: string) => r.trim());
  return [];
}

/* Extrae permisos directos (si los hubiera) */
export function getUserPermissions(user: any): string[] {
  if (!user) return [];
  const nsPerms = user?.[`${CLAIMS_NAMESPACE}/permissions`];
  if (Array.isArray(nsPerms)) return nsPerms.map(String);
  if (Array.isArray(user?.permissions)) return user.permissions.map(String);
  return [];
}

/* Une permisos directos + permisos heredados de roles */
export function resolvePermissions(user: any): Set<Permission> {
  const direct = new Set(getUserPermissions(user) as Permission[]);
  const fromRoles = new Set<Permission>();
  for (const role of getUserRoles(user)) {
    (ROLE_PERMS[role] ?? []).forEach((p) => fromRoles.add(p));
  }
  return new Set<Permission>([...fromRoles, ...direct]);
}

/* Función pura: comprueba permiso */
export function can(user: any, permission: Permission): boolean {
  return !!user && resolvePermissions(user).has(permission);
}

/* Hook: usa useAuth0 y delega en can() */
export function useCan(permission: Permission): boolean {
  const { user, isAuthenticated } = useAuth0();
  return !!isAuthenticated && can(user, permission);
}

/* Componente wrapper: muestra children si hay permiso, fallback si no */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const allowed = useCan(permission);
  return <>{allowed ? children : fallback}</>;
}
