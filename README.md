# CINEMA PREMIUM — GALAXY

Plataforma web de cine con estética deep-space. Cartelera, compras, reservas, asientos dinámicos estilo silla de cine, tickets con QR, favoritos, valoraciones, splash screen animado y panel admin.

**Solo HTML + CSS + JS vanilla. Sin dependencias externas. Sin npm. Sin frameworks.**

## Cómo usar

1. Abre `index.html` en tu navegador
2. No necesita servidor local ni base de datos
3. Los datos se guardan en `localStorage`
4. Configura tu API key de TMDB en `js/config.js`

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| juan@email.com | 123456 | user |
| maria@email.com | 123456 | admin |

## Estructura del proyecto

```
├── index.html              # Inicio + splash screen animado
├── login.html              # Login
├── register.html           # Registro
├── cartelera.html          # Cartelera completa con filtros y búsqueda
├── pelicula.html           # Detalle de película + trailer + cast + valoraciones
├── funciones.html          # Funciones disponibles (se generan auto si no existen)
├── asientos.html           # Mapa de asientos estilo silla de cine (3D con CSS)
├── checkout.html           # Checkout unificado (compra o reserva)
├── confirmacion.html       # Confirmación con ticket y código QR
├── mis-entradas.html       # Tabs: tickets y reservas
├── mi-lista.html           # Películas favoritas
├── perfil.html             # Perfil de usuario + estadísticas de actividad
├── admin.html              # Panel administrativo
├── reservar.html           # Formulario de reserva
│
├── css/
│   ├── styles.css          # Estilos principales (tema Galaxy)
│   ├── components.css      # Estilos de componentes (featured, tickets, checkout, tabs)
│   ├── responsive.css      # Responsive design (1200px → 480px)
│   └── splash.css          # Estilos del splash screen
│
├── js/
│   ├── config.js           # API key y endpoints de TMDB
│   ├── api.js              # Base de datos localStorage + CRUD + UserActivity
│   ├── tmdb.js             # Consumo de API TMDB (peliculas, trailers, reparto, búsqueda)
│   ├── auth.js             # Login, registro, sesión en localStorage
│   ├── main.js             # Utilidades: renderMovieCard, toasts, modales, nav, lazy loading
│   ├── components.js       # Web Components: CMovieCard, CMiniTicket, CUserBadge, CRatingCard, CSeatGrid, CActionChoice, COrderSummary
│   ├── sanitize.js         # Función escapeHtml() para prevenir XSS
│   ├── lazyload.js         # Lazy loading de imágenes con IntersectionObserver
│   ├── qrcode.js           # Generador de códigos QR en canvas puro JS
│   │
│   └── pages/              # Lógica específica de cada página
│       ├── index.js        # Hero + grids de películas + splash
│       ├── cartelera.js    # Filtros por género + búsqueda
│       ├── pelicula.js     # Detalle, trailer, cast, favoritos, valoraciones
│       ├── funciones.js    # Selección de función + generación automática
│       ├── asientos.js     # Mapa de asientos + selección + checkout flow
│       ├── checkout.js     # Pago unificado (compra/reserva) + cupones
│       ├── confirmacion.js # Ticket/reserva con QR
│       ├── mis-entradas.js # Tabs tickets/reservas
│       ├── mi-lista.js     # Favoritos
│       ├── reservar.js     # Formulario de reserva
│       ├── perfil.js       # Perfil + stats de actividad
│       ├── admin.js        # Dashboard + CRUD funciones/salas
│       ├── login.js        # Login
│       └── register.js     # Registro
│
├── data/
│   └── db.json             # Datos iniciales de referencia
│
└── README.md
```

## Arquitectura de scripts

Cada página HTML carga los scripts en este orden:

```
api.js → config.js → tmdb.js → auth.js → lazyload.js → sanitize.js → components.js → main.js → pages/PAGINA.js
```

- **No hay scripts inline** en ningún HTML
- Cada página tiene su propio archivo JS en `js/pages/`
- Los web components (`components.js`) se usan para renderizado XSS-safe

## Tema visual — Galaxy

Paleta de colores deep-space:

| Variable | Valor | Uso |
|----------|-------|-----|
| `--g-900` | `#070514` | Fondo más oscuro |
| `--g-800` | `#0a0b10` | Fondo principal |
| `--g-700` | `#13112c` | Superficies |
| `--g-purple` | `#7c3aed` | Acento primario |
| `--g-purple-light` | `#a855f7` | Acento secundario |
| `--g-cyan` | `#00f0ff` | Acento-neón |
| `--g-text` | `#e0e0e0` | Texto principal |

Efectos: glassmorphism (`backdrop-filter: blur()`), glow neón, gradientes, bordes sutiles con transparencia.

## Asientos — Estilo silla de cine

Los asientos se renderizan como sillas reales usando solo CSS:

- **`::before`** = respaldo de la silla (más oscuro, bordes redondeados arriba)
- **`::after`** = cojín del asiento (más ancho, bordes redondeados abajo)
- Estados con colores Galaxy: disponible (púrpura oscuro), seleccionado (neón púrpura con glow), reservado (cyan sutil), vendido (casi invisible)

## Funcionalidades

### Usuario
- Buscar y filtrar películas por género (TMDB)
- Ver detalles, trailer, reparto con modal de actor
- Seleccionar asientos dinámicos (4 estados)
- Comprar entradas con pago simulado
- Reservar asientos (pago en local)
- Ver tickets con código QR generado en canvas puro
- Agregar/eliminar de Mi Lista
- Valorar películas (1-5 estrellas + comentario)
- Ver historial completo de actividad

### Seguridad XSS
- Todas las inserciones de datos de usuario pasan por `escapeHtml()`
- Web components (`CMovieCard`, `CMiniTicket`, etc.) renderizan de forma segura
- Sin `innerHTML` sin sanitizar en datos provenientes de TMDB o localStorage

### Actividad del usuario
El sistema `UserActivity` en `api.js` registra automáticamente:
- **Compras**: película, asientos, total, código
- **Reservas**: película, asientos, fecha
- **Vistas**: películas visitadas en detalle
- **Búsquedas**: términos buscados
- **Favoritos**: agregados y eliminados
- **Valoraciones**: rating y comentario
- **Login/Logout**: sesiones

Toda esta información se guarda por usuario en `localStorage` y se puede ver en el perfil.

### Administrador
- Dashboard con estadísticas (funciones, reservas, compras, ingresos, valoraciones)
- CRUD de funciones
- CRUD de salas (standard, 3D, VIP)
- Tabla de reservas, compras, valoraciones

## TMDB API

1. Ve a [themoviedb.org](https://www.themoviedb.org/) y crea cuenta
2. Settings > API > Copia tu API Key
3. Abre `js/config.js` y reemplaza:

```js
const TMDB_CONFIG = {
  API_KEY: 'TU_API_KEY_AQUI',
  ...
};
```

## Cupones de descuento (simulados)

| Código | Descuento |
|--------|-----------|
| `CINEMA20` | 20% off |
| `AHORRO5000` | $5.000 off |
| `ESTRENO` | 15% off |

## Datos iniciales

El archivo `data/db.json` contiene los datos de prueba iniciales (salas, asientos, funciones). La app los carga automáticamente en `localStorage` la primera vez que se abre.
