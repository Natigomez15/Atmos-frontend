import {
  MdAir,
  MdBolt,
  MdDeviceThermostat,
  MdOpacity,
  MdPerson,
  MdSwapVert,
} from "react-icons/md"

function numeroDisponible(valor) {
  return valor != null && Number.isFinite(Number(valor))
}

function Variable({ etiqueta, valor, unidad, Icono, disponible = true }) {
  return (
    <article className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <div className="flex items-center gap-2 text-muted">
        <Icono size={17} className="shrink-0" aria-hidden="true" />
        <p className="text-xs leading-snug break-words">{etiqueta}</p>
      </div>
      <p className={`mt-2 text-base font-semibold tabular-nums break-words ${disponible ? "text-dark" : "text-muted"}`}>
        {disponible ? <>{valor}{unidad ? ` ${unidad}` : ""}</> : "No disponible"}
      </p>
    </article>
  )
}

export default function DecisionVariables({ variables = {} }) {
  const presenciaDisponible = variables.presencia != null
  const presencia = presenciaDisponible
    ? (variables.presencia === true || Number(variables.presencia) > 0 ? "Detectada" : "No detectada")
    : null

  const elementos = [
    {
      etiqueta: "Presencia",
      valor: presencia,
      Icono: MdPerson,
      disponible: presenciaDisponible,
    },
    {
      etiqueta: "Temperatura ambiente",
      valor: numeroDisponible(variables.temperaturaAmbiente) ? Number(variables.temperaturaAmbiente).toFixed(1) : null,
      unidad: "°C",
      Icono: MdDeviceThermostat,
      disponible: numeroDisponible(variables.temperaturaAmbiente),
    },
    {
      etiqueta: "Temperatura de salida",
      valor: numeroDisponible(variables.temperaturaSalida) ? Number(variables.temperaturaSalida).toFixed(1) : null,
      unidad: "°C",
      Icono: MdAir,
      disponible: numeroDisponible(variables.temperaturaSalida),
    },
    {
      etiqueta: "Diferencia de temperatura",
      valor: numeroDisponible(variables.deltaT) ? Number(variables.deltaT).toFixed(1) : null,
      unidad: "°C",
      Icono: MdSwapVert,
      disponible: numeroDisponible(variables.deltaT),
    },
    {
      etiqueta: "Humedad",
      valor: numeroDisponible(variables.humedad) ? Number(variables.humedad).toFixed(1) : null,
      unidad: "%",
      Icono: MdOpacity,
      disponible: numeroDisponible(variables.humedad),
    },
    {
      etiqueta: "Potencia",
      valor: numeroDisponible(variables.potencia) ? Number(variables.potencia).toFixed(0) : null,
      unidad: "W",
      Icono: MdBolt,
      disponible: numeroDisponible(variables.potencia),
    },
  ]

  return (
    <section aria-labelledby="variables-decision-titulo">
      <div className="mb-3">
        <h2 id="variables-decision-titulo" className="section-title">
          Variables consideradas
        </h2>
        <p className="mt-1 text-xs text-muted">
          Datos disponibles en la predicción que influyeron en esta decisión.
        </p>
      </div>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {elementos.map(elemento => <Variable key={elemento.etiqueta} {...elemento} />)}
      </div>
    </section>
  )
}
