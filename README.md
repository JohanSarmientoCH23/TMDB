# CINEMA PREMIUM

Plataforma web de cine. Cartelera, compras, reservas, asientos dinamicos, tickets con QR, favoritos, valoraciones y panel admin.

**Solo HTML + CSS + JS. Sin dependencias externas. Sin npm.**

## Como usar

1. Abre `index.html` en tu navegador
2. No necesita servidor local
3. Los datos se guardan en `localStorage`

## Usuarios de prueba

| Email | Contrasena | Rol |
|-------|-----------|-----|
| juan@email.com | 123456 | user |
| maria@email.com | 123456 | admin |

## Estructura

```
├── index.html            # Inicio
├── login.html            # Login
├── register.html         # Registro
├── cartelera.html        # Cartelera completa
├── pelicula.html         # Detalle pelicula + trailer
├── funciones.html        # Funciones disponibles
├── asientos.html         # Mapa de asientos dinamico
├── checkout.html         # Compra
├── confirmacion.html     # Ticket con QR
├── mis-entradas.html     # Tickets y reservas
├── mi-lista.html         # Favoritos
├── perfil.html           # Perfil + actividad
├── admin.html            # Panel administrativo
│
├── css/
│   ├── styles.css        # Estilos principales
│   ├── components.css    # Componentes
│   └── responsive.css    # Responsive
│
├── js/
│   ├── config.js         # Config API TMDB (API_KEY)
│   ├── api.js            # Base de datos localStorage + CRUD
│   ├── tmdb.js           # API TMDB con fetch
│   ├── auth.js           # Autenticacion
│   ├── main.js           # Utilidades + UI
│   └── qrcode.js         # Generador QR puro JS
│
├── data/
│   └── db.json           # Datos iniciales de referencia
│
└── README.md
```

## Archivos JS - Que hace cada uno

| Archivo | Funcion |
|---------|---------|
| `config.js` | API key y endpoints de TMDB. Se edita aqui si cambia la key |
| `api.js` | Base de datos completa en localStorage. CRUD + actividad del usuario |
| `tmdb.js` | Consumo de API TMDB (peliculas, trailers, reparto, busqueda) |
| `auth.js` | Login, registro, sesion en localStorage |
| `main.js` | Renderizado de cards, tickets, toasts, modales, utilidades |
| `qrcode.js` | Generador de codigos QR en canvas puro |

## Funcionalidades

### Usuario
- Buscar y filtrar peliculas (TMDB)
- Ver detalles, trailer, reparto
- Seleccionar asientos dinamicos (4 estados: disponible/seleccionado/reservado/vendido)
- Comprar entradas
- Reservar asientos
- Ver tickets con codigo QR
- Agregar a Mi Lista
- Valorar peliculas (1-5 estrellas)
- Ver historial completo de actividad

### Actividad del usuario (localStorage)
El sistema registra automaticamente:
- **Compras**: pelicula, asientos, total, codigo
- **Reservas**: pelicula, asientos, fecha
- **Vistas**: peliculas visitadas en detalle
- **Busquedas**: terminos buscados
- **Favoritos**: agregados y eliminados
- **Valoraciones**: rating y comentario
- **Login/Logout**: sesiones

Toda esta info se guarda por usuario en `localStorage` y se puede ver en el perfil.

### Administrador
- Dashboard con estadisticas
- CRUD de funciones
- CRUD de salas
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

## Datos iniciales

El archivo `data/db.json` contiene los datos de prueba iniciales. La app los carga automaticamente en `localStorage` la primera vez que se abre.
