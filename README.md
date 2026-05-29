# ATMOS Frontend

Dashboard web desarrollado en React + Vite para el sistema
de optimización energética ATMOS.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación local

1. Clonar el repositorio:
```bash
git clone https://github.com/natigomez15/atmos-frontend.git
cd atmos-frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` en la raíz:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_KEY=tu_admin_api_key
VITE_WS_URL=ws://localhost:8000/api/v1
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. Correr en desarrollo:
```bash
npm run dev
```

5. Abrir en el navegador:
http://localhost:3000

## Estructura del proyecto
atmos-frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/              # Llamadas al backend
│   │   ├── ajustes.js
│   │   ├── alertas.js
│   │   ├── cliente.js    # Axios configurado
│   │   ├── comandos.js
│   │   ├── dashboard.js
│   │   ├── ml.js
│   │   ├── monitoreo.js
│   │   ├── nodos.js
│   │   ├── reportes.js
│   │   ├── salas.js
│   │   └── supabase.js
│   ├── components/
│   │   ├── charts/       # Gráficas Recharts
│   │   ├── common/       # Componentes reutilizables
│   │   └── layout/       # Sidebar, Topbar, PageWrapper
│   ├── context/
│   │   └── AuthContext.jsx  # Estado de autenticación
│   ├── hooks/            # Hooks personalizados
│   ├── pages/            # Una página por ruta
│   ├── store/            # Estado global
│   ├── utils/            # Funciones auxiliares
│   └── constants/        # Configuración y constantes
├── .env.example
├── vercel.json
├── tailwind.config.js
└── vite.config.js

## Páginas del sistema

| Ruta | Página | Acceso |
|------|--------|--------|
| /dashboard | Panel principal | Público |
| /monitoring | Monitoreo en tiempo real | Público |
| /alerts | Alertas del sistema | Público |
| /rooms | Gestión de salones | Público |
| /commands | Comandos AC | Login requerido |
| /reports | Reportes energéticos | Login requerido |
| /predictions | Predicciones ML | Solo admin |
| /nodes | Nodos ESP32 | Solo admin |
| /users | Gestión de usuarios | Solo admin |
| /settings | Ajustes del sistema | Login requerido |

## Roles y permisos

| Acción | Sin sesión | Mantenimiento | Admin |
|--------|------------|---------------|-------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Ver monitoreo | ✅ | ✅ | ✅ |
| Ver alertas | ✅ | ✅ | ✅ |
| Resolver alertas | ❌ | ✅ | ✅ |
| Comandos AC | ❌ | ✅ | ✅ |
| Ver reportes | ❌ | ✅ | ✅ |
| Predicciones ML | ❌ | ❌ | ✅ |
| Crear salones | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

## Tecnologías utilizadas

| Librería | Versión | Uso |
|----------|---------|-----|
| React | 18 | Framework UI |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Estilos |
| Recharts | 2 | Gráficas |
| Axios | 1 | HTTP client |
| React Query | 5 | Cache de datos |
| React Router | 6 | Navegación |
| Supabase JS | 2 | Autenticación |

## Build para producción

```bash
npm run build
```

Los archivos generados quedan en `/dist`.

## Deploy en Vercel

1. Conectar repositorio en vercel.com
2. Vercel detecta Vite automáticamente
3. Agregar variables de entorno en el panel
4. Cada push a main despliega automáticamente

## Colores del sistema

| Variable | Color | Uso |
|----------|-------|-----|
| primary | #1B4F8A | Azul principal |
| secondary | #2ABFBF | Teal — acentos |
| success | #10B981 | Estados OK |
| warning | #F59E0B | Alertas medias |
| danger | #EF4444 | Alertas altas |

Crea tres archivos:
atmos-backend/README.md
atmos-frontend/README.md
README.md (en el repositorio que prefieras como raíz)
