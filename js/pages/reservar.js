    Auth.init();
    updateNavAuth();
    setupMobileNav();
    setupNavbarScroll();

    const reservationData = JSON.parse(sessionStorage.getItem('cinema_reservation'));

    function loadReserve() {
      if (!reservationData) {
        document.getElementById('reserve-content').innerHTML = renderEmptyState('No hay datos de reserva. Selecciona asientos primero.');
        return;
      }

      const user = Auth.getUser();

      document.getElementById('reserve-content').innerHTML = `
        <div class="section-header" style="padding-top:2rem">
          <div>
            <h2 class="section-title">Reservar Entradas</h2>
            <p class="section-subtitle">Completa tus datos para reservar. El pago se realizará en el local.</p>
          </div>
        </div>

        <div class="checkout-container">
          <div class="checkout-form">
            <h2>Datos de Reserva</h2>
            <div class="form-group">
              <label>Nombre completo *</label>
              <input type="text" id="buyer-name" value="${user ? escapeHtml(user.name) : ''}" placeholder="Tu nombre" required>
            </div>
            <div class="form-group">
              <label>Correo electrónico *</label>
              <input type="email" id="buyer-email" value="${user ? escapeHtml(user.email) : ''}" placeholder="tu@email.com" required>
            </div>
            <div class="form-group">
              <label>Teléfono de contacto *</label>
              <input type="tel" id="buyer-phone" placeholder="Tu teléfono" required>
            </div>
            <div class="reservation-notice">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div>
                <strong>Pago en local</strong>
                <p>El pago se realizará al recoger tus entradas en la boletería. La reserva se mantiene hasta 30 minutos antes de la función.</p>
              </div>
            </div>
          </div>

          <div class="purchase-summary">
            <h3>Resumen de Reserva</h3>
            <div class="summary-row"><span class="summary-label">Película</span><span>${escapeHtml(reservationData.movieTitle)}</span></div>
            <div class="summary-row"><span class="summary-label">Fecha</span><span>${formatDate(reservationData.date)}</span></div>
            <div class="summary-row"><span class="summary-label">Hora</span><span>${reservationData.time}</span></div>
            <div class="summary-row"><span class="summary-label">Sala</span><span>${escapeHtml(reservationData.roomName)}</span></div>
            <div class="summary-row">
              <span class="summary-label">Asientos</span>
              <span>${reservationData.seats.length}</span>
            </div>
            <div class="selected-seats-list">
              ${reservationData.seats.map(s => `<span class="seat-tag">${escapeHtml(s.seatCode)}</span>`).join('')}
            </div>
            <div class="summary-row"><span class="summary-label">Precio unitario</span><span>${formatCurrency(reservationData.price)}</span></div>
            <div class="summary-row total"><span>Total a pagar</span><span>${formatCurrency(reservationData.total)}</span></div>
            <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1.5rem" onclick="processReservation()">Confirmar Reserva</button>
            <p style="text-align:center;font-size:0.75rem;color:var(--on-background-dim);margin-top:0.8rem">No se realiza cobro en línea</p>
          </div>
        </div>
      `;
    }

    async function processReservation() {
      const name = document.getElementById('buyer-name').value.trim();
      const email = document.getElementById('buyer-email').value.trim();
      const phone = document.getElementById('buyer-phone').value.trim();

      if (!name) { showToast('Ingresa tu nombre', 'warning'); return; }
      if (!email) { showToast('Ingresa tu correo', 'warning'); return; }
      if (!phone) { showToast('Ingresa tu teléfono', 'warning'); return; }

      try {
        const code = generateCode('RES');

        const reservation = API.createReservation({
          userId: Auth.getUserId(),
          functionId: reservationData.functionId,
          movieId: reservationData.movieId || null,
          movieTitle: reservationData.movieTitle || 'Pelicula',
          seatIds: reservationData.seats.map(s => s.seatId),
          seatCodes: reservationData.seats.map(s => s.seatCode),
          quantity: reservationData.seats.length,
          total: reservationData.total,
          code: code,
          status: 'RESERVADA',
          buyerName: name,
          buyerEmail: email,
          buyerPhone: phone,
          createdAt: new Date().toISOString()
        });

        const functionSeats = await API.getFunctionSeats(reservationData.functionId);
        for (const seat of reservationData.seats) {
          const fSeat = functionSeats.find(fs => fs.seatId === seat.seatId);
          if (fSeat) {
            await API.updateFunctionSeat(fSeat.id, { status: 'reserved' });
          }
        }

        API.logActivity(Auth.getUserId(), 'reservation', {
          movieId: reservationData.movieId,
          functionId: reservationData.functionId,
          total: reservationData.total,
          quantity: reservationData.seats.length,
          seatCodes: reservationData.seats.map(s => s.seatCode),
          code: code
        });

        sessionStorage.removeItem('cinema_reservation');

        showToast('Reserva realizada con exito!', 'success');
        window.location.href = 'confirmacion.html?reservationId=' + reservation.id;

      } catch (err) {
        showToast('Error al procesar la reserva. Intenta de nuevo.', 'error');
      }
    }

    loadReserve();
