import iconoAtmosIA from "../../assets/atmos_ia_icon.png"

export default function AtmosIAIcon({
  size = 18,
  className = "",
  title = "ATMOS IA",
}) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${iconoAtmosIA})`,
        maskImage: `url(${iconoAtmosIA})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  )
}
