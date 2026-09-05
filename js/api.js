// ============================================================
// API Mock - localStorage puro (sin servidor)
// Incluye registro de actividad del usuario
// ============================================================

const DB_KEY = 'cinema_db';

// --- Datos iniciales de prueba ---
const SEED_DATA = {
  users: [
    { id: 1, name: "Juan Perez", email: "juan@email.com", password: "123456", role: "user", createdAt: "2026-08-20T10:00:00Z" },
    { id: 2, name: "Maria Garcia", email: "maria@email.com", password: "123456", role: "admin", createdAt: "2026-08-20T10:00:00Z" }
  ],
  rooms: [
    { id: 1, name: "Sala 1", capacity: 48, type: "standard" },
    { id: 2, name: "Sala 2", capacity: 48, type: "standard" },
    { id: 3, name: "Sala 3", capacity: 48, type: "3D" },
    { id: 4, name: "Sala 4", capacity: 36, type: "VIP" }
  ],
  seats: [],
  functions: [
    { id: 1, movieId: 550, roomId: 1, date: "2026-08-25", time: "18:30", price: 12000 },
    { id: 2, movieId: 550, roomId: 2, date: "2026-08-25", time: "21:00", price: 12000 },
    { id: 3, movieId: 680, roomId: 3, date: "2026-08-25", time: "19:00", price: 15000 },
    { id: 4, movieId: 680, roomId: 1, date: "2026-08-26", time: "16:00", price: 12000 },
    { id: 5, movieId: 27205, roomId: 4, date: "2026-08-25", time: "20:00", price: 22000 },
    { id: 6, movieId: 27205, roomId: 3, date: "2026-08-26", time: "15:00", price: 15000 },
    { id: 7, movieId: 155, roomId: 2, date: "2026-08-25", time: "17:30", price: 12000 },
    { id: 8, movieId: 155, roomId: 4, date: "2026-08-26", time: "21:30", price: 22000 },
    { id: 9, movieId: 299534, roomId: 1, date: "2026-08-27", time: "19:00", price: 12000 },
    { id: 10, movieId: 299534, roomId: 3, date: "2026-08-27", time: "21:30", price: 15000 }
  ],
  functionSeats: [],
  reservations: [],
  purchases: [],
  tickets: [],

  promotions: [
    { id: 1, code: "CINE20", discount: 20, active: true },
    { id: 2, code: "AHORRO5000", discount: 5000, active: false },
    { id: 3, code: "ESTRENO", discount: 15, active: true }
  ],

  ratings: [
    { id: 1, userId: 1, movieId: 550, rating: 5, comment: "Una obra maestra del cine.", createdAt: "2026-08-21T12:00:00Z" },
    { id: 2, userId: 1, movieId: 27205, rating: 4, comment: "Visualmente impresionante.", createdAt: "2026-08-22T10:00:00Z" }
  ],
  favorites: [
    { id: 1, userId: 1, movieId: 550, createdAt: "2026-08-21T08:00:00Z" },
    { id: 2, userId: 1, movieId: 27205, createdAt: "2026-08-22T10:30:00Z" }
  ],
  userActivity: []
};

// --- Generar asientos ---
function generateSeats() {
  const seats = [];
  let id = 1;
  const rows6 = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Salas 1 y 2: A-B-C standard, D-E premium, F vip
  for (const roomId of [1, 2]) {
    for (const row of rows6) {
      for (let num = 1; num <= 8; num++) {
        const loc = num <= 2 ? 'Izquierda' : num <= 6 ? 'Centro' : 'Derecha';
        let type = 'standard';
        if (row === 'D' || row === 'E') type = 'premium';
        else if (row === 'F') type = 'vip';
        seats.push({ id: id++, roomId, row, number: num, seatCode: row + num, location: loc, type });
      }
    }
  }

  // Sala 3 (3D): A-B-C standard, D-E premium, F vip
  for (const row of rows6) {
    for (let num = 1; num <= 8; num++) {
      const loc = num <= 2 ? 'Izquierda' : num <= 6 ? 'Centro' : 'Derecha';
      let type = 'standard';
      if (row === 'D' || row === 'E') type = 'premium';
      else if (row === 'F') type = 'vip';
      seats.push({ id: id++, roomId: 3, row, number: num, seatCode: row + num, location: loc, type });
    }
  }

  // Sala 4 VIP: A-B-C standard, D-E premium, F vip
  for (const row of rows6) {
    for (let num = 1; num <= 9; num++) {
      const loc = num <= 3 ? 'Izquierda' : num <= 6 ? 'Centro' : 'Derecha';
      let type = 'standard';
      if (row === 'D' || row === 'E') type = 'premium';
      else if (row === 'F') type = 'vip';
      seats.push({ id: id++, roomId: 4, row, number: num, seatCode: row + num, location: loc, type });
    }
  }

  return seats;
}

// --- Generar asientos por funcion ---
function generateFunctionSeats(functions, seats) {
  const fs = [];
  let id = 1;
  for (const func of functions) {
    const roomSeats = seats.filter(s => s.roomId === func.roomId);
    for (const seat of roomSeats) {
      const r = Math.random();
      let status = 'available';
      if (r < 0.12) status = 'sold';
      else if (r < 0.18) status = 'reserved';
      fs.push({ id: id++, functionId: func.id, seatId: seat.id, status });
    }
  }
  return fs;
}

// --- Inicializar base de datos ---
function initDB() {
  const seats = generateSeats();
  if (localStorage.getItem(DB_KEY)) {
    const db = getDB();
    db.promotions = SEED_DATA.promotions;
    db.seats = seats;
    db.functionSeats = generateFunctionSeats(db.functions, seats);
    saveDB(db);
    return;
  }
  const data = { ...SEED_DATA, seats };
  data.functionSeats = generateFunctionSeats(data.functions, seats);
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// --- Helpers de acceso ---
function getDB() { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); }
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getCollection(name) { return getDB()[name] || []; }
function setCollection(name, items) { const db = getDB(); db[name] = items; saveDB(db); }

function findById(name, id) { return getCollection(name).find(i => i.id === id) || null; }

function findWhere(name, filters) {
  let items = getCollection(name);
  for (const [k, v] of Object.entries(filters)) {
    items = items.filter(i => String(i[k]) === String(v));
  }
  return items;
}

function createItem(name, data) {
  const items = getCollection(name);
  const maxId = items.reduce((m, i) => Math.max(m, i.id || 0), 0);
  const item = { ...data, id: maxId + 1 };
  items.push(item);
  setCollection(name, items);
  return item;
}

function updateItem(name, id, data) {
  const items = getCollection(name);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...data, id };
  setCollection(name, items);
  return items[idx];
}

function deleteItem(name, id) {
  setCollection(name, getCollection(name).filter(i => i.id !== id));
  return { id };
}

// ============================================================
// ACTIVIDAD DEL USUARIO
// Registra todo lo que hace el usuario en la plataforma
// ============================================================

const UserActivity = {
  // Registrar actividad
  log(userId, action, details = {}) {
    const entry = {
      id: Date.now(),
      userId,
      action,
      movieId: details.movieId || null,
      functionId: details.functionId || null,
      details,
      timestamp: new Date().toISOString()
    };
    const db = getDB();
    if (!db.userActivity) db.userActivity = [];
    db.userActivity.push(entry);
    saveDB(db);
  },

  // Obtener toda la actividad de un usuario
  getByUser(userId) {
    return getCollection('userActivity')
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Obtener actividad por tipo
  getByAction(userId, action) {
    return this.getByUser(userId).filter(a => a.action === action);
  },

  // Obtener peliculas vistas (por compra)
  getMoviesPurchased(userId) {
    const activities = this.getByAction(userId, 'purchase');
    const movieIds = [...new Set(activities.map(a => a.movieId).filter(Boolean))];
    return movieIds;
  },

  // Obtener peliculas en favoritos
  getMoviesFavorited(userId) {
    return getCollection('favorites').filter(f => f.userId === userId).map(f => f.movieId);
  },

  // Obtener peliculas valoradas
  getMoviesRated(userId) {
    return getCollection('ratings').filter(r => r.userId === userId).map(r => ({ movieId: r.movieId, rating: r.rating }));
  },

  // Obtener peliculas vistas (detalles)
  getMoviesSeen(userId) {
    const movies = this.getMoviesPurchased(userId);
    const ratings = this.getMoviesRated(userId);
    const allIds = [...new Set([...movies, ...ratings.map(r => r.movieId)])];
    return allIds;
  },

  // Historial de busquedas
  getSearchHistory(userId) {
    return this.getByAction(userId, 'search').map(a => a.details.query).filter(Boolean);
  },

  // Peliculas visitadas (detalles)
  getMoviesViewed(userId) {
    return [...new Set(this.getByAction(userId, 'view').map(a => a.movieId).filter(Boolean))];
  },

  // Resumen de actividad
  getSummary(userId) {
    return {
      compras: this.getByAction(userId, 'purchase').length,
      reservas: this.getByAction(userId, 'reservation').length,
      valoraciones: this.getByAction(userId, 'rating').length,
      favoritos: this.getByAction(userId, 'favorite_add').length - this.getByAction(userId, 'favorite_remove').length,
      peliculasVistas: this.getMoviesSeen(userId).length,
      busquedas: this.getByAction(userId, 'search').length,
      totalActividad: this.getByUser(userId).length
    };
  }
};

// ============================================================
// API - Interfaz principal
// ============================================================

initDB();

const API = {
  // Genericos
  get(endpoint) {
    const parts = endpoint.replace(/^\//, '').split('?');
    const col = parts[0];
    if (parts.length > 1) {
      const params = {};
      parts[1].split('&').forEach(p => { const [k, v] = p.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v); });
      return findWhere(col, params);
    }
    return getCollection(col);
  },

  post(endpoint, data) { return createItem(endpoint.replace(/^\//, ''), data); },
  put(endpoint, data) { const m = endpoint.match(/\/(\w+)\/(\d+)/); return m ? updateItem(m[1], Number(m[2]), data) : null; },
  patch(endpoint, data) { return this.put(endpoint, data); },
  delete(endpoint) { const m = endpoint.match(/\/(\w+)\/(\d+)/); return m ? deleteItem(m[1], Number(m[2])) : null; },

  // Usuarios
  getUsers() { return getCollection('users'); },
  getUser(id) { return findById('users', id); },
  createUser(data) { return createItem('users', data); },
  updateUser(id, data) { return updateItem('users', id, data); },

  // Salas
  getRooms() { return getCollection('rooms'); },
  getRoom(id) { return findById('rooms', id); },
  createRoom(data) { return createItem('rooms', data); },
  updateRoom(id, data) { return updateItem('rooms', id, data); },
  deleteRoom(id) { return deleteItem('rooms', id); },

  // Asientos
  getSeats(roomId) { return findWhere('seats', { roomId }); },
  getSeat(id) { return findById('seats', id); },

  // Funciones
  getFunctions() { return getCollection('functions'); },
  getFunction(id) { return findById('functions', id); },
  getFunctionsByMovie(movieId) { return findWhere('functions', { movieId }); },
  createFunction(data) { return createItem('functions', data); },
  updateFunction(id, data) { return updateItem('functions', id, data); },
  deleteFunction(id) { return deleteItem('functions', id); },

  // Asientos de funcion
  getFunctionSeats(functionId) { return findWhere('functionSeats', { functionId }); },
  updateFunctionSeat(id, data) { return updateItem('functionSeats', id, data); },

  // Reservas
  getReservations() { return getCollection('reservations'); },
  getReservationsByUser(userId) { return findWhere('reservations', { userId }); },
  createReservation(data) { return createItem('reservations', data); },
  updateReservation(id, data) { return updateItem('reservations', id, data); },

  // Promociones
  getPromotions() {
  return getCollection('promotions');
  },

  getPromotion(code) {
  return getCollection('promotions')
    .find(p => p.code.toUpperCase() === code.toUpperCase()) || null;
  },

  // Compras
  getPurchases() { return getCollection('purchases'); },
  getPurchasesByUser(userId) { return findWhere('purchases', { userId }); },
  createPurchase(data) {
    const purchase = createItem('purchases', data);
    UserActivity.log(data.userId, 'purchase', {
      movieId: data.movieId || null,
      functionId: data.functionId,
      total: data.total,
      quantity: data.quantity,
      seatCodes: data.seatCodes || [],
      code: data.code
    });
    return purchase;
  },

  // Tickets
  getTickets() { return getCollection('tickets'); },
  getTicket(id) { return findById('tickets', id); },
  getTicketsByUser(userId) { return findWhere('tickets', { userId }); },
  createTicket(data) { return createItem('tickets', data); },

  // Valoraciones
  getRatings(movieId) { return findWhere('ratings', { movieId }); },
  getRatingsByUser(userId) { return findWhere('ratings', { userId }); },
  createRating(data) {
    const rating = createItem('ratings', data);
    UserActivity.log(data.userId, 'rating', { movieId: data.movieId, rating: data.rating, comment: data.comment });
    return rating;
  },
  updateRating(id, data) { return updateItem('ratings', id, data); },

  // Favoritos
  getFavorites(userId) { return findWhere('favorites', { userId }); },
  addFavorite(data) {
    const fav = createItem('favorites', data);
    UserActivity.log(data.userId, 'favorite_add', { movieId: data.movieId });
    return fav;
  },
  removeFavorite(id) {
    const fav = findById('favorites', id);
    if (fav) UserActivity.log(fav.userId, 'favorite_remove', { movieId: fav.movieId });
    return deleteItem('favorites', id);
  },
  findFavorite(userId, movieId) {
    const favs = findWhere('favorites', { userId, movieId });
    return favs.length > 0 ? favs[0] : null;
  },

  // Actividad del usuario
  logActivity(userId, action, details) { UserActivity.log(userId, action, details); },
  getUserActivity(userId) { return UserActivity.getByUser(userId); },
  getActivitySummary(userId) { return UserActivity.getSummary(userId); },
  getMoviesPurchased(userId) { return UserActivity.getMoviesPurchased(userId); },
  getMoviesViewed(userId) { return UserActivity.getMoviesViewed(userId); },
  getSearchHistory(userId) { return UserActivity.getSearchHistory(userId); }
};
