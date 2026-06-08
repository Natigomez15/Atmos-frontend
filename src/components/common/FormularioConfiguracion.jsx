import { useState } from "react"
import { actualizarConfiguracionSistema } from "../../api/ajustes"

const estiloCampo =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

function CampoFormulario({
  etiqueta,
  tipo = "text",
  valor,
  alCambiar,
  minimo,
  maximo,
  paso,
  marcador,
  nota,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
        {etiqueta}
      </label>
      <input
        type={tipo}
        value={valor ?? ""}
        min={minimo}
        max={maximo}
        step={paso}
        placeholder={marcador}
        onChange={evento => alCambiar(evento.target.value)}
        className={estiloCampo}
      />
      {nota && <p className="text-xs text-muted mt-1">{nota}</p>}
    </div>
  )
}

export default function FormularioConfiguracion({ configuracion, alGuardar }) {
  const [datosFormulario, setDatosFormulario] = useState(configuracion ?? {})
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState(null)

  function actualizarCampo(campo, valor) {
    setDatosFormulario(datosActuales => ({
      ...datosActuales,
      [campo]: valor,
    }))
  }

  function actualizarNumero(campo, valor) {
    actualizarCampo(campo, valor === "" ? "" : Number(valor))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setGuardando(true)
    setExito(false)
    setError(null)

    try {
      await actualizarConfiguracionSistema(datosFormulario)
      setExito(true)
      await alGuardar?.()
    } catch (fallo) {
      setError(fallo.response?.data?.detail ?? "No se pudo guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="card flex flex-col gap-4">
      <p className="font-semibold text-dark">Configuración del pabellón</p>
      <hr className="border-gray-100" />

      <CampoFormulario
        etiqueta="Nombre del pabellón"
        valor={datosFormulario.nombre_pabellon}
        marcador="Ej: Pabellón A"
        alCambiar={valor => actualizarCampo("nombre_pabellon", valor)}
      />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-dark">Temperatura de confort</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CampoFormulario
            etiqueta="Mínima (°C)"
            tipo="number"
            minimo={16}
            maximo={30}
            paso={0.5}
            valor={datosFormulario.temperatura_confort_min}
            alCambiar={valor => actualizarNumero("temperatura_confort_min", valor)}
          />
          <CampoFormulario
            etiqueta="Máxima (°C)"
            tipo="number"
            minimo={16}
            maximo={30}
            paso={0.5}
            valor={datosFormulario.temperatura_confort_max}
            alCambiar={valor => actualizarNumero("temperatura_confort_max", valor)}
          />
        </div>
        <p className="text-xs text-muted">Rango recomendado: 20-24°C</p>
      </div>

      <CampoFormulario
        etiqueta="Costo por kWh (USD)"
        tipo="number"
        minimo={0}
        paso={0.001}
        valor={datosFormulario.costo_kwh_usd}
        marcador="0.1700"
        nota="Tarifa eléctrica de Panamá: $0.17/kWh"
        alCambiar={valor => actualizarNumero("costo_kwh_usd", valor)}
      />

      <hr className="border-gray-100" />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-dark">Umbrales de alertas</p>

        <CampoFormulario
          etiqueta="Minutos sin señal antes de alertar"
          tipo="number"
          minimo={1}
          maximo={60}
          valor={datosFormulario.minutos_sin_senal}
          nota="Tiempo sin datos del ESP32 para generar alerta"
          alCambiar={valor => actualizarNumero("minutos_sin_senal", valor)}
        />

        <CampoFormulario
          etiqueta="Exceso de consumo para alertar (%)"
          tipo="number"
          minimo={10}
          maximo={200}
          valor={datosFormulario.exceso_consumo_pct}
          nota="% sobre el promedio histórico para generar alerta"
          alCambiar={valor => actualizarNumero("exceso_consumo_pct", valor)}
        />

        <CampoFormulario
          etiqueta="Temperatura máxima de alerta (°C)"
          tipo="number"
          minimo={20}
          maximo={35}
          paso={0.5}
          valor={datosFormulario.temperatura_max_alerta}
          nota="Temperatura que activa alerta de sobrecalentamiento"
          alCambiar={valor => actualizarNumero("temperatura_max_alerta", valor)}
        />

        <CampoFormulario
          etiqueta="Minutos sin enfriamiento para alertar"
          tipo="number"
          minimo={5}
          maximo={120}
          valor={datosFormulario.minutos_sin_enfriamiento}
          nota="Tiempo con AC encendido sin bajar temperatura"
          alCambiar={valor => actualizarNumero("minutos_sin_enfriamiento", valor)}
        />
      </div>

      {exito && <span className="badge-success w-fit">Configuración guardada correctamente</span>}
      {error && <p className="text-danger text-xs">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardando && (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        Guardar configuración
      </button>
    </form>
  )
}
