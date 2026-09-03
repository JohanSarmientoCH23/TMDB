    Auth.init();
    updateNavAuth();
    setupMobileNav();
    setupNavbarScroll();

    const checkoutData = JSON.parse(sessionStorage.getItem('cinema_checkout'));
    let actionType = checkoutData?.actionType || 'purchase';
    let movieDetails = null;
    let discount = 0;
    let couponApplied = false;

    let PROMO_CODES = [];

    async function loadCheckout() {
      if (!checkoutData) {
        document.getElementById('checkout-content').innerHTML = renderEmptyState('No hay datos de compra. Selecciona asientos primero.');
        return;
      }

      try {
        if (checkoutData.movieId) {
          try { movieDetails = await TMDB.getMovieDetails(checkoutData.movieId); } catch {}
        }
      } catch {}

      renderPage();
    }

    function renderPage() {
      const user = Auth.getUser();
      const isPurchase = actionType === 'purchase';
      const d = checkoutData;
      const subtotal = d.total;
      const total = subtotal - discount;

      const poster = movieDetails?.poster_path ? TMDB.getPosterURL(movieDetails.poster_path) : '';
      const genres = movieDetails?.genres ? movieDetails.genres.map(g => g.name).join(' · ') : '';
      const duration = movieDetails?.runtime ? TMDB.formatDuration(movieDetails.runtime) : '';
      const year = movieDetails?.release_date ? new Date(movieDetails.release_date).getFullYear() : '';

      const dateObj = new Date(d.date + 'T00:00:00');
      const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const dateFormatted = `${days[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;

      document.getElementById('checkout-content').innerHTML = `
        <a href="asientos.html?functionId=${d.functionId}" class="checkout-back">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a asientos
        </a>

        <h1 class="checkout-title">Completa tu compra</h1>

        <div class="checkout-steps">
          <div class="checkout-step done"><div class="step-circle">✓</div><span>Función</span></div>
          <div class="checkout-step-line done"></div>
          <div class="checkout-step done"><div class="step-circle">✓</div><span>Asientos</span></div>
          <div class="checkout-step-line active"></div>
          <div class="checkout-step active"><div class="step-circle">3</div><span>Datos</span></div>
          <div class="checkout-step-line"></div>
          <div class="checkout-step"><div class="step-circle">4</div><span>Confirmación</span></div>
        </div>

        <div class="checkout-grid">
          <div class="checkout-left">

            <div class="action-toggle">
              <button class="action-toggle-btn ${isPurchase ? 'active' : ''}" onclick="switchAction('purchase')">
                <span class="action-toggle-icon">💳</span>
                <span class="action-toggle-label">Comprar</span>
                <span class="action-toggle-desc">Pagar ahora</span>
              </button>
              <button class="action-toggle-btn ${!isPurchase ? 'active' : ''}" onclick="switchAction('reservation')">
                <span class="action-toggle-icon">🎟️</span>
                <span class="action-toggle-label">Reservar</span>
                <span class="action-toggle-desc">Pagar en el local</span>
              </button>
            </div>

            <div class="checkout-card">
              <h2 class="checkout-card-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Datos personales
              </h2>
              <div class="form-group">
                <label for="buyer-name">Nombre completo *</label>
                <input type="text" id="buyer-name" value="${user ? escapeHtml(user.name) : ''}" placeholder="Tu nombre completo" required>
              </div>
              <div class="form-group">
                <label for="buyer-email">Correo electrónico *</label>
                <input type="email" id="buyer-email" value="${user ? escapeHtml(user.email) : ''}" placeholder="tu@email.com" required>
              </div>
              ${!isPurchase ? `
              <div class="form-group">
                <label for="buyer-phone">Teléfono de contacto *</label>
                <input type="tel" id="buyer-phone" placeholder="Tu teléfono" required>
              </div>
              ` : ''}
            </div>

            ${isPurchase ? `
            <div class="checkout-card" id="payment-section">
              <h2 class="checkout-card-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Método de pago
              </h2>
            <div class="payment-options">
              <label class="payment-option selected" id="opt-card">
                <input
                  type="radio"
                  name="payment-method"
                  value="card"
                  checked
                  onchange="handlePaymentChange(this)"
                >

                <div class="payment-option-content">
                  <span class="payment-option-icon">💳</span>
                  <span class="payment-option-label">Tarjeta</span>
                </div>
              </label>

              <label class="payment-option" id="opt-cash">
                <input
                  type="radio"
                  name="payment-method"
                  value="cash"
                  onchange="handlePaymentChange(this)"
                >

                <div class="payment-option-content">
                  <span class="payment-option-icon">💵</span>
                  <span class="payment-option-label">Efectivo</span>
                </div>
              </label>

              <label class="payment-option" id="opt-pse">
                <input
                  type="radio"
                  name="payment-method"
                  value="pse"
                  onchange="handlePaymentChange(this)"
                >

                <div class="payment-option-content">
                  <span class="payment-option-icon">🏦</span>
                  <span class="payment-option-label">PSE</span>
                </div>
              </label>

            </div>
                </label>
              </div>
              <div id="card-fields">
                <div class="form-group">
                  <label for="card-number">Número de tarjeta *</label>
                  <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="card-expiry">Fecha de expiración *</label>
                    <input type="text" id="card-expiry" placeholder="MM/AA" maxlength="5" required>
                  </div>
                  <div class="form-group">
                    <label for="card-cvv">CVV *</label>
                    <input type="text" id="card-cvv" placeholder="123" maxlength="4" required>
                  </div>
                </div>
              </div>
            </div>
            ` : `
            <div class="checkout-card reservation-notice-card">
              <div class="reservation-notice">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <div>
                  <strong>Reserva seleccionada</strong>
                  <p>Podrás pagar tus entradas directamente en el establecimiento. La reserva se mantiene hasta 30 minutos antes de la función.</p>
                </div>
              </div>
            </div>
            `}

            <div class="checkout-card">
              <h2 class="checkout-card-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                ¿Tienes un código promocional?
              </h2>
              <div class="coupon-row">
                <input type="text" id="coupon-input" placeholder="Código promocional" class="coupon-input">
                <button class="btn btn-outline btn-sm" onclick="applyCoupon()">Aplicar</button>
              </div>
              <div id="coupon-message"></div>
            </div>

            <div class="checkout-security">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span><strong>Pago seguro</strong> — Compra simulada. No se realizará ningún cobro real.</span>
            </div>

          </div>

          <div class="checkout-right">
            <div class="order-summary">
              <h3 class="order-summary-title">Resumen de compra</h3>

              <div class="order-movie">
                ${poster ? `<img src="${poster}" alt="${escapeHtml(d.movieTitle)}" class="order-movie-poster" loading="lazy" onerror="handleImgError(this)">` : ''}
                <div class="order-movie-info">
                  <div class="order-movie-title">${escapeHtml(d.movieTitle)}</div>
                  ${genres ? `<div class="order-movie-meta">${genres}</div>` : ''}
                  ${year || duration ? `<div class="order-movie-meta">${year}${duration ? ' · ' + duration : ''}</div>` : ''}
                </div>
              </div>

              <div class="order-detail">
                <div class="order-detail-icon">📅</div>
                <div><strong>${dateFormatted}</strong><br><span class="text-dim">${d.time}</span></div>
              </div>
              <div class="order-detail">
                <div class="order-detail-icon">🎬</div>
                <div><strong>${escapeHtml(d.roomName)}</strong><br><span class="text-dim">${escapeHtml(d.roomType)}</span></div>
              </div>

              <div class="order-seats">
                <div class="order-seats-label">Asientos seleccionados</div>
                <div class="order-seats-list">
                  ${d.seats.map(s => `<div class="seat-badge"><span class="seat-badge-dot"></span>${escapeHtml(s.seatCode)}<small>${escapeHtml((s.type || 'standard').toUpperCase())}- ${formatCurrency(s.price)}</small></div>`).join('')}
                </div>
                <div class="order-seats-count">${d.seats.length} entrada${d.seats.length > 1 ? 's' : ''}</div>
              </div>

              <div class="order-pricing">
                <div class="order-price-row">
                  <span>${d.seats.length} × ${formatCurrency(d.price)}</span>
                  <span>${formatCurrency(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                <div class="order-price-row discount">
                  <span>Descuento</span>
                  <span>-${formatCurrency(discount)}</span>
                </div>
                ` : ''}
                <div class="order-price-total">
                  <span>Total</span>
                  <span>${formatCurrency(total)}</span>
                </div>
              </div>

              <button class="btn btn-primary btn-block" id="submit-btn" onclick="processAction()" ${checkoutData.seats.length === 0 ? 'disabled' : ''}>
                ${isPurchase ? '💳 Comprar' : '🎟️ Confirmar Reserva'}
              </button>

              ${isPurchase ? `
              <div class="order-secure">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Transacción segura y encriptada
              </div>
              ` : `
              <div class="order-secure">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Pago pendiente en local
              </div>
              `}
            </div>
          </div>
        </div>
      `;

      setupCardFormatting();
    }

    function switchAction(type) {
      actionType = type;
      checkoutData.actionType = type;
      sessionStorage.setItem('cinema_checkout', JSON.stringify(checkoutData));
      discount = 0;
      couponApplied = false;
      renderPage();
    }

    function handlePaymentChange(radio) {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      radio.closest('.payment-option').classList.add('selected');
      const cardFields = document.getElementById('card-fields');
      if (cardFields) {cardFields.style.display = radio.value === 'card' ? 'block' : 'none';}
    }

    function setupCardFormatting() {
      const cardInput = document.getElementById('card-number');
      const expiryInput = document.getElementById('card-expiry');
      if (cardInput) {
        cardInput.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\D/g, '').substring(0, 16);
          e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
        });
      }
      if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\D/g, '').substring(0, 4);
          if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
          e.target.value = v;
        });
      }
    }

    function applyCoupon() {
      async function applyCoupon() {
      const code = document
      .getElementById('coupon-input')
      .value
      .trim()
      .toUpperCase();

      const msgEl = document.getElementById('coupon-message');

      if (!code) {
         msgEl.innerHTML =
        '<span class="coupon-error">Ingresa un código</span>';
      return;
     }

      if (couponApplied) {
         msgEl.innerHTML =
        '<span class="coupon-error">Ya hay un cupón aplicado</span>';
     return;
      }

     try {
        const promo = await API.getPromotion(code);

       if (!promo) {
        msgEl.innerHTML =
        '<span class="coupon-error">Código promocional inválido.</span>';
      return;
     }

      if (!promo.active) {
        msgEl.innerHTML =
        '<span class="coupon-error">El código promocional está inactivo.</span>';
      return;
      }

    discount = Math.round(
      checkoutData.total * Number(promo.discount) / 100
    );

    couponApplied = true;

    msgEl.innerHTML = 
      <span class="coupon-success">
        ✓ ${promo.discount}% de descuento aplicado
      </span>
    ;

    renderPage();

    document.getElementById('coupon-message').innerHTML = 
      <span class="coupon-success">
        ✓ ${promo.discount}% de descuento aplicado
      </span>
    ;

    } catch (error) {
     console.error(error);

     msgEl.innerHTML =
      '<span class="coupon-error">Error al consultar el código.</span>';
    }

    }

    async function processAction() {
      const name = document.getElementById('buyer-name').value.trim();
      const email = document.getElementById('buyer-email').value.trim();
      const phone = document.getElementById('buyer-phone')?.value.trim() || '';
      const isPurchase = actionType === 'purchase';

      if (!name) { showToast('Ingresa tu nombre', 'warning'); return; }
      if (!email) { showToast('Ingresa tu correo', 'warning'); return; }
      if (isPurchase){ const selectedPayment = document.querySelector('input[name="payment-method"]:checked'); 
      if (!selectedPayment) { showToast('Selecciona un método de pago', 'warning'); return; } }

      let paymentMethod = 'credit_card';
      if (isPurchase) {
        paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'credit_card';
        if (paymentMethod !== 'cash') {
          const card = document.getElementById('card-number').value.trim();
          const expiry = document.getElementById('card-expiry').value.trim();
          const cvv = document.getElementById('card-cvv').value.trim();
          if (card.replace(/\s/g, '').length < 16) { showToast('Número de tarjeta inválido', 'warning'); return; }
          if (!expiry || expiry.length < 5) { showToast('Ingresa la fecha de expiración', 'warning'); return; }
          if (!cvv || cvv.length < 3) { showToast('Ingresa el CVV', 'warning'); return; }
        }
      } else {
        if (!phone) { showToast('Ingresa tu teléfono', 'warning'); return; }
      }

      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.textContent = isPurchase ? 'Procesando...' : 'Reservando...';

      try {
        const total = checkoutData.total - discount;

        if (isPurchase) {
          const purchase = await API.createPurchase({
            userId: Auth.getUserId(),
            functionId: checkoutData.functionId,
            movieId: checkoutData.movieId || null,
            seatIds: checkoutData.seats.map(s => s.seatId),
            seatCodes: checkoutData.seats.map(s => s.seatCode),
            quantity: checkoutData.seats.length,
            total: total,
            discount: discount,
            status: 'completed',
            code: generateCode('PUR'),
            paymentMethod,
            buyerName: name,
            buyerEmail: email,
            createdAt: new Date().toISOString()
          });

          const functionSeats = await API.getFunctionSeats(checkoutData.functionId);
          for (const seat of checkoutData.seats) {
            const fSeat = functionSeats.find(fs => fs.seatId === seat.seatId);
            if (fSeat) await API.updateFunctionSeat(fSeat.id, { status: 'sold' });
          }

          const ticket = await API.createTicket({
            purchaseId: purchase.id,
            userId: Auth.getUserId(),
            functionId: checkoutData.functionId,
            movieId: checkoutData.movieId || null,
            movieTitle: checkoutData.movieTitle || 'Pelicula',
            seatIds: checkoutData.seats.map(s => s.seatId),
            quantity: checkoutData.seats.length,
            total: total,
            discount: discount,
            code: generateCode('TKT'),
            status: 'active',
            createdAt: new Date().toISOString()
          });

          sessionStorage.removeItem('cinema_checkout');
          showToast('Compra realizada con exito!', 'success');
          window.location.href = 'confirmacion.html?ticketId=' + ticket.id;

        } else {
          const reservation = await API.createReservation({
            userId: Auth.getUserId(),
            functionId: checkoutData.functionId,
            movieId: checkoutData.movieId || null,
            movieTitle: checkoutData.movieTitle || 'Pelicula',
            seatIds: checkoutData.seats.map(s => s.seatId),
            seatCodes: checkoutData.seats.map(s => s.seatCode),
            quantity: checkoutData.seats.length,
            total: total,
            discount: discount,
            code: generateCode('RES'),
            status: 'RESERVADA',
            buyerName: name,
            buyerEmail: email,
            buyerPhone: phone,
            createdAt: new Date().toISOString()
          });

          const functionSeats = await API.getFunctionSeats(checkoutData.functionId);
          for (const seat of checkoutData.seats) {
            const fSeat = functionSeats.find(fs => fs.seatId === seat.seatId);
            if (fSeat) await API.updateFunctionSeat(fSeat.id, { status: 'reserved' });
          }

          API.logActivity(Auth.getUserId(), 'reservation', {
            movieId: checkoutData.movieId,
            functionId: checkoutData.functionId,
            total: total,
            quantity: checkoutData.seats.length,
            seatCodes: checkoutData.seats.map(s => s.seatCode),
            code: reservation.code
          });

          sessionStorage.removeItem('cinema_checkout');
          showToast('Reserva realizada con exito!', 'success');
          window.location.href = 'confirmacion.html?reservationId=' + reservation.id;
        }
      } catch (err) {
        showToast('Error al procesar. Intenta de nuevo.', 'error');
        btn.disabled = false;
        btn.textContent = isPurchase ? '💳 Comprar' : '🎟️ Confirmar Reserva';
      }
    }
  }
    loadCheckout();