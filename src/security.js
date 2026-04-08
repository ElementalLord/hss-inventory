export const DEVELOPER_USERNAME = "developer";

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export const isPrivilegedRole = (role) => role === "admin" || role === "developer";

export const isDeveloperUser = (user) => user?.role === "developer";

export const canDeleteUser = (actorRole, targetUser) => {
  if (!isPrivilegedRole(actorRole)) return false;
  return !isDeveloperUser(targetUser);
};

export const canAssignRole = (actorRole, targetUser, nextRole) => {
  if (!isPrivilegedRole(actorRole)) return false;
  if (isDeveloperUser(targetUser) && actorRole !== "developer") return false;
  if (nextRole === "developer" && actorRole !== "developer") return false;
  return true;
};
