const API_URL_PRODUCCION = "https://atmos-backend-slno.onrender.com/api/v1"
const API_URL_LOCAL = "http://localhost:8000/api/v1"

function normalizarApiUrl(valor) {
  if (!valor) return valor
  const url = valor.trim()
  if (url.startsWith("wss://")) {
    const corregida = url.replace(/^wss:\/\//, "https://")
    console.error(
      "[ATMOS CONFIG] VITE_API_URL no debe usar wss://. Usando HTTPS para fetch:",
      corregida
    )
    return corregida
  }
  if (url.startsWith("ws://")) {
    const corregida = url.replace(/^ws:\/\//, "http://")
    console.error(
      "[ATMOS CONFIG] VITE_API_URL no debe usar ws://. Usando HTTP para fetch:",
      corregida
    )
    return corregida
  }
  return url
}

function normalizarWsUrl(valor) {
  if (!valor) return valor
  const url = valor.trim()
  if (url.startsWith("https://")) {
    const corregida = url.replace(/^https:\/\//, "wss://")
    console.warn(
      "[ATMOS CONFIG] VITE_WS_URL deberia usar wss://. Usando WSS para WebSocket:",
      corregida
    )
    return corregida
  }
  if (url.startsWith("http://")) {
    const corregida = url.replace(/^http:\/\//, "ws://")
    console.warn(
      "[ATMOS CONFIG] VITE_WS_URL deberia usar ws://. Usando WS para WebSocket:",
      corregida
    )
    return corregida
  }
  return url
}

export const API_BASE_URL = normalizarApiUrl(
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? API_URL_PRODUCCION : API_URL_LOCAL)
)

export const API_KEY = import.meta.env.VITE_API_KEY || ""

export const WS_BASE_URL = normalizarWsUrl(
  import.meta.env.VITE_WS_URL || (import.meta.env.PROD
    ? "wss://atmos-backend-slno.onrender.com/api/v1"
    : "ws://localhost:8000/api/v1")
)

console.log("[ATMOS CONFIG] API_BASE_URL:", API_BASE_URL)
console.log("[ATMOS CONFIG] WS_BASE_URL:", WS_BASE_URL)

export const COST_PER_KWH = 0.17

export const REFRESH_INTERVAL_MS = 30000

export const COLORS = {
  primary:   "#1B4F8A",
  secondary: "#2ABFBF",
  success:   "#10B981",
  warning:   "#F59E0B",
  danger:    "#EF4444",
  muted:     "#64748B",
}

export const CHART_COLORS = [
  "#2ABFBF",
  "#1B4F8A",
  "#10B981",
  "#F59E0B",
  "#EF4444",
]
