    Auth.init();
    updateNavAuth();
    setupMobileNav();
    setupNavbarScroll();

    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html?redirect=mis-entradas.html';
    }

    function showTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tickets-list').style.display = tab === 'tickets' ? 'block' : 'none';
      document.getElementById('reservations-list').style.display = tab === 'reservations' ? 'block' : 'none';
    }

    async function loadTickets() {
      try {
        const [tickets, purchases, reservations, rooms, functions] = await Promise.all([
          API.getTicketsByUser(Auth.getUserId()),
          API.getPurchasesByUser(Auth.getUserId()),
          API.getReservationsByUser(Auth.getUserId()),
          API.getRooms(),
          API.getFunctions()
        ]);

        const ticketsContainer = document.getElementById('tickets-list');
        if (!tickets.length) {
          ticketsContainer.innerHTML = renderEmptyState('No tienes tickets aún', '🎫');
          return;
        }

        let html = '';
        for (const ticket of tickets) {
          const func = functions.find(f => f.id === ticket.functionId);
          if (!func) continue;
          const room = rooms.find(r => r.id === func.roomId);
          let movie;
          try {
            movie = await TMDB.getMovieDetails(func.movieId);
          } catch (e) {
            movie = { title: ticket.movieTitle || 'Pelicula', poster_path: null };
          }
          html += renderMiniTicket(ticket, movie, func, room);
        }
        ticketsContainer.innerHTML = html || renderEmptyState('No se pudieron cargar los tickets');
        if (typeof LazyLoad !== 'undefined') LazyLoad.observe(ticketsContainer);

        const reservationsContainer = document.getElementById('reservations-list');
        if (!reservations.length) {
          reservationsContainer.innerHTML = renderEmptyState('No tienes reservas', '📋');
          return;
        }

        let resHtml = '';
        for (const res of reservations) {
          const func = functions.find(f => f.id === res.functionId);
          if (!func) continue;
          const room = rooms.find(r => r.id === func.roomId);
          let movie;
          try {
            movie = await TMDB.getMovieDetails(func.movieId);
          } catch (e) {
            movie = { title: res.movieTitle || 'Pelicula', poster_path: null };
          }
          const seats = API.getSeats(func.roomId);
          const seatCodes = (res.seatIds || []).map(id => {
            const s = seats.find(x => x.id === id);
            return s ? s.seatCode : '?';
          });
          const posterUrl = movie.poster_path ? TMDB.getPosterURL(movie.poster_path) : '';
          resHtml += `
              <div class="mini-ticket" onclick="window.location.href='confirmacion.html?reservationId=${res.id}'">
                <div class="mini-ticket-poster">
                  ${posterUrl ? '<img src="' + posterUrl + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' : ''}
                </div>
                <div class="mini-ticket-info">
                  <h4>${escapeHtml(movie.title)}</h4>
                  <p>${formatDate(func.date)} • ${func.time}</p>
                  <p>${room ? room.name : 'Sala'} • ${seatCodes.join(', ')}</p>
                  <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem">
                    <span class="mini-ticket-code">${res.code}</span>
                    <span class="badge badge-warning">${res.status}</span>
                  </div>
                </div>
              </div>
            `;
        }
        reservationsContainer.innerHTML = resHtml || renderEmptyState('No se pudieron cargar las reservas');
        if (typeof LazyLoad !== 'undefined') LazyLoad.observe(reservationsContainer);

      } catch (err) {
        document.getElementById('tickets-list').innerHTML = renderEmptyState('Error al cargar tus entradas');
      }
    }

    loadTickets();