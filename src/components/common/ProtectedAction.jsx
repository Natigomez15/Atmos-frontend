import { useAuth } from "../../store/authStore"

export default function ProtectedAction({
  children,
  requireRole = null,
  fallback = null,
}) {
  const { isLoggedIn, isAdmin, isMaintenance } = useAuth()

  if (requireRole === "admin" && !isAdmin) return fallback
  if (requireRole === "mantenimiento" && !isAdmin && !isMaintenance) return fallback
  if (requireRole === "any" && !isLoggedIn) return fallback

  return children
}
