    Auth.init();
    updateNavAuth();
    setupMobileNav();
    setupNavbarScroll();

    const ticketId = parseInt(getParam('ticketId'));
    const reservationId = parseInt(getParam('reservationId'));

    async function loadConfirmation() {
      if (reservationId) {
        loadReservationConfirmation();
        return;
      }

      if (!ticketId) {
        document.getElementById('confirmation-content').innerHTML = renderEmptyState('Ticket no encontrado');
        return;
      }

      try {
        const ticket = API.getTicket(ticketId);
        if (!ticket) {
          document.getElementById('confirmation-content').innerHTML = renderEmptyState('Ticket no encontrado');
          return;
        }

        const func = API.getFunction(ticket.functionId);
        const room = func ? API.getRoom(func.roomId) : null;

        let movieTitle = ticket.movieTitle || 'Pelicula';
        let moviePoster = null;
        try {
          const movie = await TMDB.getMovieDetails(func.movieId);
          movieTitle = movie.title;
          moviePoster = movie.poster_path;
        } catch (e) {
          movieTitle = ticket.movieTitle || sessionStorage.getItem('cinema_last_movieTitle') || 'Pelicula';
        }

        const seats = func ? API.getSeats(func.roomId) : [];
        const seatCodes = (ticket.seatIds || []).map(id => {
          const s = seats.find(x => x.id === id);
          return s ? s.seatCode : '?';
        });

        renderTicket(ticket, func, room, { title: movieTitle, poster_path: moviePoster }, seatCodes);
      } catch (err) {
        console.error('Error ticket:', err);
        document.getElementById('confirmation-content').innerHTML = renderEmptyState('Error al cargar el ticket');
      }
    }

    async function loadReservationConfirmation() {
      try {
        const reservation = findById('reservations', reservationId);
        if (!reservation) {
          document.getElementById('confirmation-content').innerHTML = renderEmptyState('Reserva no encontrada');
          return;
        }

        const func = API.getFunction(reservation.functionId);
        const room = func ? API.getRoom(func.roomId) : null;

        let movieTitle = reservation.movieTitle || 'Pelicula';
        let moviePoster = null;
        try {
          const movie = await TMDB.getMovieDetails(func.movieId);
          movieTitle = movie.title;
          moviePoster = movie.poster_path;
        } catch (e) {
          movieTitle = reservation.movieTitle || 'Pelicula';
        }

        const seats = func ? API.getSeats(func.roomId) : [];
        const seatCodes = (reservation.seatIds || []).map(id => {
          const s = seats.find(x => x.id === id);
          return s ? s.seatCode : '?';
        });

        renderReservation(reservation, func, room, { title: movieTitle, poster_path: moviePoster }, seatCodes);
      } catch (err) {
        console.error('Error reservation:', err);
        document.getElementById('confirmation-content').innerHTML = renderEmptyState('Error al cargar la reserva');
      }
    }

    function renderTicket(ticket, func, room, movie, seatCodes) {
      const poster = movie.poster_path ? TMDB.getPosterURL(movie.poster_path) : '';

      document.getElementById('confirmation-content').innerHTML = `
        <div class="confirmation">
          <div class="confirmation-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2>Compra Exitosa!</h2>
          <p>Tu ticket ha sido generado correctamente</p>
        </div>

        <div class="ticket" id="ticket-card">
          <div class="ticket-header">
            <p style="font-size:0.75rem;opacity:0.8;text-transform:uppercase;letter-spacing:2px;margin-bottom:0.3rem">CINEMA PREMIUM</p>
            <h3>${escapeHtml(movie.title)}</h3>
          </div>
          <div class="ticket-body">
            <div class="ticket-field">
              <label>Fecha</label>
              <span>${func ? formatDate(func.date) : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Hora</label>
              <span>${func ? func.time : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Sala</label>
              <span>${room ? escapeHtml(room.name) + ' (' + escapeHtml(room.type) + ')' : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Formato</label>
              <span>${room ? escapeHtml(room.type) : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Asientos</label>
              <span>${seatCodes.length > 0 ? seatCodes.join(', ') : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Cantidad</label>
              <span>${ticket.quantity} entrada${ticket.quantity > 1 ? 's' : ''}</span>
            </div>
            <div class="ticket-field">
              <label>Total</label>
              <span style="color:var(--primary);font-size:1.2rem">${formatCurrency(ticket.total)}</span>
            </div>
            <div class="ticket-field">
              <label>Estado</label>
              <span class="badge badge-success">Activo</span>
            </div>
          </div>
          <div class="ticket-divider"></div>
          <div class="ticket-qr">
            <canvas id="qr-canvas"></canvas>
            <div class="ticket-code" style="margin-top:1rem">${ticket.code}</div>
          </div>
        </div>

        <div style="display:flex;gap:1rem;margin-top:2rem;justify-content:center;flex-wrap:wrap">
          <a href="mis-entradas.html" class="btn btn-primary">Mis Entradas</a>
          <a href="index.html" class="btn btn-secondary">Volver al Inicio</a>
        </div>
      `;

      if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
        QRCode.toCanvas(document.getElementById('qr-canvas'), ticket.code, {
          cellSize: 4,
          margin: 4,
          darkColor: '#131313',
          lightColor: '#ffb4aa'
        });
      }
    }

    function renderReservation(reservation, func, room, movie, seatCodes) {
      const statusClass = reservation.status === 'RESERVADA' ? 'badge-warning' : reservation.status === 'PAGADA' ? 'badge-success' : 'badge-danger';

      document.getElementById('confirmation-content').innerHTML = `
        <div class="confirmation">
          <div class="confirmation-icon" style="border-color:var(--seat-reserved)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2>Reserva Exitosa!</h2>
          <p>Tu reserva ha sido registrada. Recoge tus entradas en la boletería.</p>
        </div>

        <div class="ticket" id="ticket-card">
          <div class="ticket-header">
            <p style="font-size:0.75rem;opacity:0.8;text-transform:uppercase;letter-spacing:2px;margin-bottom:0.3rem">CINEMA PREMIUM - RESERVA</p>
            <h3>${escapeHtml(movie.title)}</h3>
          </div>
          <div class="ticket-body">
            <div class="ticket-field">
              <label>Fecha</label>
              <span>${func ? formatDate(func.date) : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Hora</label>
              <span>${func ? func.time : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Sala</label>
              <span>${room ? escapeHtml(room.name) + ' (' + escapeHtml(room.type) + ')' : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Formato</label>
              <span>${room ? escapeHtml(room.type) : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Asientos</label>
              <span>${seatCodes.length > 0 ? seatCodes.join(', ') : '-'}</span>
            </div>
            <div class="ticket-field">
              <label>Cantidad</label>
              <span>${reservation.quantity} entrada${reservation.quantity > 1 ? 's' : ''}</span>
            </div>
            <div class="ticket-field">
              <label>Total a pagar</label>
              <span style="color:var(--primary);font-size:1.2rem">${formatCurrency(reservation.total)}</span>
            </div>
            <div class="ticket-field">
              <label>Estado</label>
              <span class="badge ${statusClass}">${reservation.status}</span>
            </div>
            <div class="ticket-field">
              <label>Pago</label>
              <span style="color:var(--seat-reserved)">Pendiente en local</span>
            </div>
          </div>
          <div class="ticket-divider"></div>
          <div class="ticket-qr">
            <canvas id="qr-canvas"></canvas>
            <div class="ticket-code" style="margin-top:1rem">${reservation.code}</div>
          </div>
        </div>

        <div style="display:flex;gap:1rem;margin-top:2rem;justify-content:center;flex-wrap:wrap">
          <a href="mis-entradas.html" class="btn btn-primary">Mis Reservas</a>
          <a href="index.html" class="btn btn-secondary">Volver al Inicio</a>
        </div>
      `;

      if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
        QRCode.toCanvas(document.getElementById('qr-canvas'), reservation.code, {
          cellSize: 4,
          margin: 4,
          darkColor: '#131313',
          lightColor: '#ffb4aa'
        });
      }
    }

    loadConfirmation();