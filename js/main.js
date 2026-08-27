function formatCurrency(amount) {
  return '$' + Number(amount).toLocaleString('es-CO');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-CO') + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function generateCode(prefix = 'TKT') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${code}`;
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showModal(title, content, actions = '') {
  let overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
      ${actions ? `<div class="modal-footer">${actions}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
}

function showLoading(container) {
  if (typeof container === 'string') container = document.querySelector(container);
  if (container) {
    container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="text-dim">Cargando...</p>
      </div>
    `;
  }
}

function renderSkeletonCards(count = 6) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="movie-card">
        <div class="skeleton skeleton-card"></div>
        <div style="padding:1rem">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text-sm"></div>
        </div>
      </div>
    `;
  }
  return html;
}

function renderEmptyState(message = 'No se encontraron resultados', icon = '🎬') {
  return `
    <div class="empty-state">
      <div style="font-size:3rem;margin-bottom:1rem;opacity:0.3">${icon}</div>
      <h3>${message}</h3>
    </div>
  `;
}

function renderMovieCard(movie, options = {}) {
  const poster = TMDB.getPosterURL(movie.poster_path);
  const title = movie.title || movie.name || 'Sin título';
  const rating = TMDB.formatRating(movie.vote_average);
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return `
    <div class="movie-card" data-movie-id="${movie.id}" onclick="window.location.href='pelicula.html?id=${movie.id}'">
      <div class="movie-card-poster">
        <img src="${poster}" alt="${title}" loading="lazy">
        <div class="quick-view">
          <span class="quick-view-title">${title}</span>
          <span class="quick-view-btn">Ver detalles</span>
        </div>
      </div>
      <div class="movie-card-info">
        <div class="movie-card-title">${title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-rating">★ ${rating}</span>
          <span>${year}</span>
        </div>
      </div>
    </div>
  `;
}

function renderFunctionCard(func, room) {
  const date = new Date(func.date + 'T00:00:00');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return `
    <div class="function-card" onclick="selectFunction(${func.id})">
      <div class="function-date">
        <div class="function-date-day">${date.getDate()}</div>
        <div class="function-date-month">${days[date.getDay()]} ${months[date.getMonth()]}</div>
      </div>
      <div class="function-time">${func.time}</div>
      <div class="function-room">
        <span class="function-room-name">${room ? room.name : 'Sala'}</span>
        <span class="function-room-type">${room ? room.type : 'Standard'}</span>
      </div>
      <div class="function-price">${formatCurrency(func.price)}</div>
      <button class="btn btn-primary btn-sm">Seleccionar</button>
    </div>
  `;
}

function renderMiniTicket(ticket, movie, func, room) {
  const poster = movie ? TMDB.getPosterURL(movie.poster_path) : '';
  const movieTitle = movie ? movie.title : 'Película';
  const roomName = room ? room.name : 'Sala';

  return `
    <div class="mini-ticket" onclick="window.location.href='confirmacion.html?ticketId=${ticket.id}'">
      <div class="mini-ticket-poster">
        <img src="${poster}" alt="${movieTitle}" loading="lazy">
      </div>
      <div class="mini-ticket-info">
        <h4>${movieTitle}</h4>
        <p>${func ? formatDate(func.date) : ''} • ${func ? func.time : ''}</p>
        <p>${roomName} • ${ticket.quantity} entrada${ticket.quantity > 1 ? 's' : ''}</p>
        <span class="mini-ticket-code">${ticket.code}</span>
      </div>
    </div>
  `;
}

function updateNavAuth() {
  const navUser = document.getElementById('nav-user-area');
  if (!navUser) return;

  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const adminLink = Auth.isAdmin() ? `<a href="admin.html" class="nav-links-link">Admin</a>` : '';
    navUser.innerHTML = `
      ${adminLink}
      <div class="nav-user" onclick="window.location.href='perfil.html'">
        <div class="nav-user-avatar">${initials}</div>
        <span class="nav-user-name">${user.name.split(' ')[0]}</span>
      </div>
    `;
  } else {
    navUser.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Iniciar Sesión</a>
      <a href="register.html" class="btn btn-primary btn-sm">Registrarse</a>
    `;
  }
}

function setupMobileNav() {
  const toggle = document.querySelector('.nav-mobile-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('mobile-open');
    });
  }
}

function setupNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Renderizar HTML en un contenedor e inicializar lazy loading
function renderTo(selector, html) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  el.innerHTML = html;
  if (typeof LazyLoad !== 'undefined') {
    LazyLoad.observe(el);
  }
}

// Inicializar lazy loading para toda la pagina
function initLazyLoad() {
  if (typeof LazyLoad !== 'undefined') {
    LazyLoad.observeAll();
  }
}
