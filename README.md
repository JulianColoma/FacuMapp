# FacuMapp

Aplicación móvil de mapas interactivos para la Facultad Regional Tucumán de la UTN. Permite explorar espacios del campus, consultar eventos académicos y navegar entre pisos con un mapa SVG interactivo.

## Características

- **Mapa interactivo SVG** con soporte para 3 pisos (PB, 1, 2)
- **Zoom y paneo** con gestos de pinch y arrastre
- **Búsqueda de espacios** con autocompletado y cambio automático de piso
- **Filtrado por categorías** con resaltado visual en el mapa
- **Bottom Sheet** con información detallada de cada espacio (imagen, descripción, categorías)
- **Listado de eventos** académicos próximos con detalle de actividades
- **Navegación entre pantallas** (tabs: Mapa y Eventos)

## Stack tecnológico

- **Framework**: React Native con Expo SDK 54
- **Routing**: Expo Router v6
- **Navegación**: React Navigation (bottom-tabs)
- **Animaciones**: React Native Reanimated
- **SVG**: React Native SVG + SVG Transformer
- **Gestos**: React Native Gesture Handler
- **HTTP Client**: Fetch API nativo
- **Lenguaje**: TypeScript

## Estructura del proyecto

```
FacuMapp/
├── app/
│   ├── _layout.tsx          # Layout raíz (Stack)
│   ├── event-detail.tsx     # Detalle de evento con actividades
│   └── (tabs)/
│       ├── _layout.tsx      # Layout de tabs
│       ├── index.tsx        # Tab del mapa interactivo
│       └── events.tsx       # Tab de listado de eventos
├── components/
│   ├── InteractiveMap.tsx   # Mapa SVG interactivo principal
│   ├── EventCard.tsx        # Tarjeta de evento
│   ├── Filters.tsx          # Filtro por categorías
│   ├── Searchbar.tsx        # Barra de búsqueda
│   └── SpaceBottomSheet.tsx # Panel inferior con info del espacio
├── services/
│   └── api.ts               # Servicios HTTP (espacios, eventos, categorías)
├── data/
│   ├── zones0.ts            # Zonas Planta Baja
│   ├── zones1.ts            # Zonas Piso 1
│   └── zones2.ts            # Zonas Piso 2
├── constants/
│   └── colors.tsx           # Constantes de colores
├── assets/
│   ├── fonts/
│   ├── images/
│   └── svg/
├── declarations.d.ts        # Declaraciones de tipos globales
├── app.json                 # Configuración Expo
├── eas.json                 # Configuración EAS Build
├── metro.config.js          # Configuración Metro bundler
├── eslint.config.js         # Configuración ESLint
└── tsconfig.json            # Configuración TypeScript
```

## Endpoints de la API

La aplicación consume una API REST disponible en `https://facumappi.frlp.utn.edu.ar`:

| Método | Endpoint                 | Descripción                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/espacio`               | Listar todos los espacios (paginado) |
| GET    | `/evento`                | Listar eventos próximos (paginado)   |
| GET    | `/actividadEv/:eventoId` | Obtener actividades de un evento     |
| GET    | `/categoria`             | Listar categorías disponibles        |

## Instalación y ejecución

### Prerrequisitos

- Node.js >= 18
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go (para probar en dispositivo)

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/tu-usuario/FacuMapp.git
   cd FacuMapp
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Iniciar el proyecto**

   ```bash
   npx expo start
   ```

4. **Abrir en Expo Go**
   - Escanea el código QR desde la terminal con la app Expo Go (Android/iOS)
   - O presiona `a` para abrir en emulador Android / `i` para iOS

### Scripts disponibles

| Comando           | Descripción                       |
| ----------------- | --------------------------------- |
| `npm start`       | Iniciar el servidor de desarrollo |
| `npm run android` | Abrir en emulador Android         |
| `npm run ios`     | Abrir en emulador iOS             |
| `npm run web`     | Abrir en navegador web            |
| `npm run lint`    | Ejecutar linting                  |

## Generar APK

Para generar un build de producción:

```bash
eas build -p android --profile preview
```

Los archivos APK generados se guardan en la carpeta `apk/`.

## Licencia

© 2026 Julian Valentin Coloma Visconti, Franco Arce y Tomás Rosato. Todos los derechos reservados.
