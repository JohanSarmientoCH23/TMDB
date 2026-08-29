class CMovieCard extends HTMLElement {
  connectedCallback() {
    const id = this.getAttribute('movie-id') || '';
    const poster = this.getAttribute('poster') || '';
    const title = this.getAttribute('title') || 'Sin título';
    const rating = this.getAttribute('rating') || 'N/A';
    const year = this.getAttribute('year') || '';

    this.innerHTML = `
      <div class="movie-card" data-movie-id="${escapeHtml(id)}" onclick="window.location.href='pelicula.html?id=${escapeHtml(id)}'">
        <div class="movie-card-poster">
          <img src="${escapeHtml(poster)}" alt="${escapeHtml(title)}" loading="lazy">
          <div class="quick-view">
            <span class="quick-view-title">${escapeHtml(title)}</span>
            <span class="quick-view-btn">Ver detalles</span>
          </div>
        </div>
        <div class="movie-card-info">
          <div class="movie-card-title">${escapeHtml(title)}</div>
          <div class="movie-card-meta">
            <span class="movie-card-rating">★ ${escapeHtml(rating)}</span>
            <span>${escapeHtml(year)}</span>
          </div>
        </div>
      </div>
    `;
  }

  static create(movie) {
    const el = document.createElement('c-movie-card');
    const poster = TMDB.getPosterURL(movie.poster_path);
    const title = movie.title || movie.name || 'Sin título';
    const rating = TMDB.formatRating(movie.vote_average);
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
    el.setAttribute('movie-id', movie.id);
    el.setAttribute('poster', poster);
    el.setAttribute('title', title);
    el.setAttribute('rating', rating);
    el.setAttribute('year', year);
    return el;
  }
}
customElements.define('c-movie-card', CMovieCard);


class CMiniTicket extends HTMLElement {
  connectedCallback() {
    const ticketId = this.getAttribute('ticket-id') || '';
    const poster = this.getAttribute('poster') || '';
    const title = this.getAttribute('title') || 'Película';
    const date = this.getAttribute('date') || '';
    const time = this.getAttribute('time') || '';
    const room = this.getAttribute('room') || 'Sala';
    const quantity = this.getAttribute('quantity') || '1';
    const code = this.getAttribute('code') || '';

    this.innerHTML = `
      <div class="mini-ticket" onclick="window.location.href='confirmacion.html?ticketId=${escapeHtml(ticketId)}'">
        <div class="mini-ticket-poster">
          <img src="${escapeHtml(poster)}" alt="${escapeHtml(title)}" loading="lazy">
        </div>
        <div class="mini-ticket-info">
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(date)} • ${escapeHtml(time)}</p>
          <p>${escapeHtml(room)} • ${escapeHtml(quantity)} entrada${parseInt(quantity) > 1 ? 's' : ''}</p>
          <span class="mini-ticket-code">${escapeHtml(code)}</span>
        </div>
      </div>
    `;
  }

  static create(ticket, movie, func, room) {
    const el = document.createElement('c-mini-ticket');
    const poster = movie ? TMDB.getPosterURL(movie.poster_path) : '';
    const title = movie ? movie.title : 'Película';
    const date = func ? formatDate(func.date) : '';
    const time = func ? func.time : '';
    const roomName = room ? room.name : 'Sala';
    el.setAttribute('ticket-id', ticket.id);
    el.setAttribute('poster', poster);
    el.setAttribute('title', title);
    el.setAttribute('date', date);
    el.setAttribute('time', time);
    el.setAttribute('room', roomName);
    el.setAttribute('quantity', ticket.quantity);
    el.setAttribute('code', ticket.code);
    return el;
  }
}
customElements.define('c-mini-ticket', CMiniTicket);


class CUserBadge extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name') || '';
    const initials = this.getAttribute('initials') || '';
    const isAdmin = this.getAttribute('is-admin') === 'true';
    const loggedIn = this.getAttribute('logged-in') === 'true';

    if (!loggedIn) {
      this.innerHTML = `
        <a href="login.html" class="btn btn-secondary btn-sm">Iniciar Sesión</a>
        <a href="register.html" class="btn btn-primary btn-sm">Registrarse</a>
      `;
      return;
    }

    const adminLink = isAdmin ? '<a href="admin.html" class="nav-links-link">Admin</a>' : '';
    const firstName = name.split(' ')[0];

    this.innerHTML = `
      ${adminLink}
      <div class="nav-user" onclick="window.location.href='perfil.html'">
        <div class="nav-user-avatar">${escapeHtml(initials)}</div>
        <span class="nav-user-name">${escapeHtml(firstName)}</span>
      </div>
    `;
  }

  static create(user, isLoggedIn) {
    const el = document.createElement('c-user-badge');
    if (!isLoggedIn || !user) {
      el.setAttribute('logged-in', 'false');
      return el;
    }
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    el.setAttribute('logged-in', 'true');
    el.setAttribute('name', user.name);
    el.setAttribute('initials', initials);
    el.setAttribute('is-admin', Auth.isAdmin() ? 'true' : 'false');
    return el;
  }
}
customElements.define('c-user-badge', CUserBadge);


class CRatingCard extends HTMLElement {
  connectedCallback() {
    const userName = this.getAttribute('user-name') || 'Anónimo';
    const initials = this.getAttribute('initials') || '?';
    const rating = parseInt(this.getAttribute('rating')) || 0;
    const comment = this.getAttribute('comment') || '';

    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span style="color:${i < rating ? '#ffd700' : 'rgba(255,255,255,0.2)'}">★</span>`
    ).join('');

    this.innerHTML = `
      <div class="rating-card">
        <div class="rating-card-header">
          <div class="rating-card-user">
            <div class="rating-card-avatar">${escapeHtml(initials)}</div>
            <span style="font-weight:500">${escapeHtml(userName)}</span>
          </div>
          <div class="rating-stars">${stars}</div>
        </div>
        <p class="rating-card-comment">${escapeHtml(comment)}</p>
      </div>
    `;
  }

  static create(userName, rating, comment) {
    const el = document.createElement('c-rating-card');
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    el.setAttribute('user-name', userName);
    el.setAttribute('initials', initials);
    el.setAttribute('rating', rating);
    el.setAttribute('comment', comment);
    return el;
  }
}
customElements.define('c-rating-card', CRatingCard);


class CSeatGrid extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  setData(seats, functionSeats, onToggle) {
    this._seats = seats;
    this._functionSeats = functionSeats;
    this._onToggle = onToggle;
    this._render();
  }

  _render() {
    if (!this._seats) {
      this.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
      return;
    }

    const rows = {};
    this._seats.forEach(seat => {
      if (!rows[seat.row]) rows[seat.row] = [];
      rows[seat.row].push(seat);
    });

    const sortedRows = Object.keys(rows).sort();
    let html = `
      <div class="seat-map-container">
        <div class="seat-screen">PANTALLA</div>
        <div class="seat-rows">
    `;

    sortedRows.forEach(rowLabel => {
      const rowSeats = rows[rowLabel].sort((a, b) => a.number - b.number);
      html += `<div class="seat-row"><span class="seat-row-label">${escapeHtml(rowLabel)}</span>`;
      rowSeats.forEach(seat => {
        const fSeat = this._functionSeats ? this._functionSeats.find(fs => fs.seatId === seat.id) : null;
        const status = fSeat ? fSeat.status : 'available';
        const seatClass = `seat seat-${status}`;
        const tooltip = `${seat.seatCode} - ${seat.location} (${seat.type})`;
        html += `<div class="${seatClass}"
          data-seat-id="${seat.id}"
          data-status="${status}"
          data-code="${escapeHtml(seat.seatCode)}"
          data-row="${escapeHtml(seat.row)}"
          data-number="${seat.number}"
          data-location="${escapeHtml(seat.location)}"
          data-type="${escapeHtml(seat.type)}"
          title="${escapeHtml(tooltip)}"
          onclick="this.getRootNode().host._handleClick(this)">${seat.number}</div>`;
      });
      html += `<span class="seat-row-label">${escapeHtml(rowLabel)}</span></div>`;
    });

    html += `
          </div>
          <div class="seat-legend">
            <div class="seat-legend-item"><div class="seat-legend-dot available"></div>Disponible</div>
            <div class="seat-legend-item"><div class="seat-legend-dot selected"></div>Seleccionado</div>
            <div class="seat-legend-item"><div class="seat-legend-dot reserved"></div>Reservado</div>
            <div class="seat-legend-item"><div class="seat-legend-dot sold"></div>Vendido</div>
          </div>
        </div>
      `;

    this.innerHTML = html;
  }

  _handleClick(el) {
    if (this._onToggle) this._onToggle(el);
  }
}
customElements.define('c-seat-grid', CSeatGrid);


class CActionChoice extends HTMLElement {
  connectedCallback() {
    const total = this.getAttribute('total') || '0';
    const count = this.getAttribute('count') || '0';

    this.innerHTML = `
      <div style="text-align:center;margin-bottom:1.5rem">
        <p style="color:var(--on-background-dim);margin-top:0.5rem">¿Qué deseas hacer con ${escapeHtml(count)} entrada${parseInt(count) > 1 ? 's' : ''}?</p>
        <div class="selected-seats-list" style="justify-content:center;margin-top:0.8rem" id="choice-seats"></div>
        <p style="font-size:1.1rem;font-weight:600;margin-top:0.8rem;color:var(--primary)">Total: ${escapeHtml(total)}</p>
      </div>
      <div class="action-choice-grid">
        <button class="action-choice-card" onclick="goToReserve()">
          <div class="action-choice-icon">🎟️</div>
          <h3>Reservar</h3>
          <p>Reserva tus asientos y paga en el local</p>
          <span class="action-choice-note">Sin pago en línea</span>
        </button>
        <button class="action-choice-card" onclick="goToPurchase()">
          <div class="action-choice-icon">💳</div>
          <h3>Comprar</h3>
          <p>Paga ahora y recibe tu ticket digital</p>
          <span class="action-choice-note">Pago en línea</span>
        </button>
      </div>
    `;
  }

  setSeats(seatCodes) {
    const container = this.querySelector('#choice-seats');
    if (container) {
      container.innerHTML = seatCodes.map(s => `<span class="seat-tag">${escapeHtml(s)}</span>`).join('');
    }
  }
}
customElements.define('c-action-choice', CActionChoice);


class COrderSummary extends HTMLElement {
  connectedCallback() {
    const data = JSON.parse(this.getAttribute('data') || '{}');
    const isPurchase = this.getAttribute('action') === 'purchase';
    this._render(data, isPurchase);
  }

  _render(d, isPurchase) {
    if (!d.movieTitle) {
      this.innerHTML = '';
      return;
    }

    const poster = d.moviePoster || '';
    const genres = d.genres || '';
    const duration = d.duration || '';
    const year = d.year || '';

    const dateObj = new Date(d.date + 'T00:00:00');
    const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const dateFormatted = `${days[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;

    const seatBadges = (d.seats || []).map(s =>
      `<div class="seat-badge"><span class="seat-badge-dot"></span>${escapeHtml(s.seatCode || s)}</div>`
    ).join('');

    this.innerHTML = `
      <div class="order-summary">
        <h3 class="order-summary-title">Resumen de compra</h3>
        <div class="order-movie">
          ${poster ? `<img src="${escapeHtml(poster)}" alt="${escapeHtml(d.movieTitle)}" class="order-movie-poster" loading="lazy" onerror="handleImgError(this)">` : ''}
          <div class="order-movie-info">
            <div class="order-movie-title">${escapeHtml(d.movieTitle)}</div>
            ${genres ? `<div class="order-movie-meta">${escapeHtml(genres)}</div>` : ''}
            ${year || duration ? `<div class="order-movie-meta">${escapeHtml(year)}${duration ? ' · ' + escapeHtml(duration) : ''}</div>` : ''}
          </div>
        </div>
        <div class="order-detail">
          <div class="order-detail-icon">📅</div>
          <div><strong>${escapeHtml(dateFormatted)}</strong><br><span class="text-dim">${escapeHtml(d.time)}</span></div>
        </div>
        <div class="order-detail">
          <div class="order-detail-icon">🎬</div>
          <div><strong>${escapeHtml(d.roomName)}</strong><br><span class="text-dim">${escapeHtml(d.roomType)}</span></div>
        </div>
        <div class="order-seats">
          <div class="order-seats-label">Asientos seleccionados</div>
          <div class="order-seats-list">${seatBadges}</div>
          <div class="order-seats-count">${d.seats.length} entrada${d.seats.length > 1 ? 's' : ''}</div>
        </div>
      </div>
    `;
  }
}
customElements.define('c-order-summary', COrderSummary);
