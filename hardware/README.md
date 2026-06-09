# Hardware — Atmos

Esta carpeta contiene los códigos y recursos físicos del prototipo Atmos.

## Componentes por nodo

- ESP32 DevKit V1
- DHT11
- PIR AM312
- DS18B20
- Protoboard
- Cable UTP CAT6
- Fuente USB 5V

## Pines usados

| Sensor | Pin ESP32 |
|---|---|
| DHT11 | GPIO 4 |
| PIR AM312 | GPIO 13 |
| DS18B20 | GPIO 15 |

## Flujo del nodo

Sensores → ESP32 → WiFi → Firebase → Supabase → Dashboard
