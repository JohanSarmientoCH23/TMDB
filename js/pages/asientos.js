Auth.init();
updateNavAuth();
setupMobileNav();
setupNavbarScroll();

const functionId = parseInt(getParam('functionId'));
let funcData = null;
let roomData = null;
let movieData = null;
let allSeats = [];
let functionSeats = [];
let selectedSeats = [];

async function loadSeats() {
  if (!functionId) {
    document.getElementById('seat-map-area').innerHTML = renderEmptyState('No se especificó una función');
    return;
  }

  try {
    funcData = await API.getFunction(functionId);
    roomData = await API.getRoom(funcData.roomId);
    movieData = await TMDB.getMovieDetails(funcData.movieId);
    allSeats = await API.getSeats(funcData.roomId);
    functionSeats = await API.getFunctionSeats(functionId);

    document.getElementById('seat-subtitle').textContent =
      `${movieData.title} • ${roomData.name} • ${formatDate(funcData.date)} ${funcData.time}`;

    renderSeatMap();
    renderSummary();
  } catch (err) {
    document.getElementById('seat-map-area').innerHTML = renderEmptyState('Error al cargar los asientos');
  }
}

function renderSeatMap() {
  const rows = {};
  allSeats.forEach(seat => {
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
      const fSeat = functionSeats.find(fs => fs.seatId === seat.id);
      const status = fSeat ? fSeat.status : 'available';
      const seatType = seat.type || 'standard';
      const seatClass = `seat seat-${status} seat-type-${seatType}`;
      const price = getSeatPrice(seatType);
      const tooltip = `${escapeHtml(seat.seatCode)} - ${escapeHtml(seat.location)} (${escapeHtml(seatType)})`;

      html += `
        <div
          class="${seatClass}"
          data-seat-id="${seat.id}"
          data-status="${status}"
          data-code="${escapeHtml(seat.seatCode)}"
          data-row="${escapeHtml(seat.row)}"
          data-number="${seat.number}"
          data-location="${escapeHtml(seat.location)}"
          data-type="${escapeHtml(seatType)}"
          data-price="${price}"
          title="${tooltip}"
          onclick="toggleSeat(this)">
        </div>
      `;
    });

    html += `</div>`;
  });

  html += `
      </div>
    </div>
  `;

  document.getElementById('seat-map-area').innerHTML = html;
}

function toggleSeat(el) {
  const status = el.dataset.status;
  if (status === 'sold' || status === 'reserved') {
    showToast('Este asiento no está disponible', 'warning');
    return;
  }

  const seatId = parseInt(el.dataset.seatId);
  const seatCode = el.dataset.code;
  const seatRow = el.dataset.row;
  const seatNumber = el.dataset.number;
  const seatLocation = el.dataset.location;
  const seatType = el.dataset.type;
  const price = Number(el.dataset.price || getSeatPrice(seatType));

  const idx = selectedSeats.findIndex(s => s.seatId === seatId);
  if (idx >= 0) {
    selectedSeats.splice(idx, 1);
    el.className = 'seat seat-available';
    el.dataset.status = 'available';
  } else {
    selectedSeats.push({
      seatId,
      seatCode,
      seatRow,
      seatNumber,
      seatLocation,
      type: seatType,
      price
    });
    el.className = 'seat seat-selected';
    el.dataset.status = 'selected';
  }
  renderSummary();
}

function getSeatPrice(type) {
  const base = Number(funcData.price);

  switch (type) {
    case 'premium':
      return Math.round(base * 1.25);

    case 'vip':
      return Math.round(base * 1.50);

    default:
      return base;
  }
}

function renderSummary() {
  const count = selectedSeats.length;

  const subtotal = selectedSeats.reduce(
    (sum, seat) => sum + seat.price,
    0
  );

  document.getElementById('summary-panel').innerHTML = `
    <div class="purchase-summary">
      <h3>Resumen de Compra</h3>

      <div class="summary-row">
        <span class="summary-label">Película</span>
        <span>${escapeHtml(movieData.title)}</span>
      </div>

      <div class="summary-row">
        <span class="summary-label">Fecha</span>
        <span>${formatDate(funcData.date)}</span>
      </div>

      <div class="summary-row">
        <span class="summary-label">Hora</span>
        <span>${funcData.time}</span>
      </div>

      <div class="summary-row">
        <span class="summary-label">Sala</span>
        <span>${escapeHtml(roomData.name)}</span>
      </div>

      ${count > 0 ? `
        <div class="selected-seats-list">
          ${selectedSeats.map(s => `
            <div class="seat-summary-item">
              <span class="seat-tag">${escapeHtml(s.seatCode)}</span>
              <span>
                ${escapeHtml(s.type.toUpperCase())}
                ${formatCurrency(s.price)}
              </span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="summary-row">
        <span class="summary-label">Subtotal</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>

      <div class="summary-row total">
        <span>Total</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>

      <button
        class="btn btn-primary"
        style="width:100%;justify-content:center;margin-top:1.5rem"
        onclick="proceedToCheckout()"
        ${count === 0 ? 'disabled' : ''}>
        Continuar
      </button>

      ${count === 0 ? `
        <p style="text-align:center;font-size:0.8rem;color:var(--on-background-dim);margin-top:0.8rem">
          Selecciona al menos un asiento
        </p>
      ` : ''}
    </div>
  `;
}

function proceedToCheckout() {
  if (!Auth.isLoggedIn()) {
    showToast('Inicia sesión para continuar', 'warning');
    window.location.href = `login.html?redirect=asientos.html?functionId=${functionId}`;
    return;
  }
  if (selectedSeats.length === 0) {
    showToast('Selecciona al menos un asiento', 'warning');
    return;
  }
  showActionChoice();
}

function showActionChoice() {
  const total = selectedSeats.length * funcData.price;
  const seatsList = selectedSeats.map(s => `<span class="seat-tag">${escapeHtml(s.seatCode)}</span>`).join('');

  const content = `
    <div style="text-align:center;margin-bottom:1.5rem">
      <p style="color:var(--on-background-dim);margin-top:0.5rem">¿Qué deseas hacer con ${selectedSeats.length} entrada${selectedSeats.length > 1 ? 's' : ''}?</p>
      <div class="selected-seats-list" style="justify-content:center;margin-top:0.8rem">${seatsList}</div>
      <p style="font-size:1.1rem;font-weight:600;margin-top:0.8rem;color:var(--primary)">Total: ${formatCurrency(total)}</p>
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
  showModal('¿Qué desea hacer?', content);
}

function storeSelection(actionType) {
  return {
    actionType: actionType || 'purchase',
    functionId,
    movieId: funcData.movieId,
    movieTitle: movieData.title,
    seats: selectedSeats,
    roomName: roomData.name,
    roomType: roomData.type,
    date: funcData.date,
    time: funcData.time,
    price: funcData.price,
    total: selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  };
}

function goToPurchase() {
  closeModal();
  sessionStorage.setItem('cinema_checkout', JSON.stringify(storeSelection('purchase')));
  window.location.href = 'checkout.html';
}

function goToReserve() {
  closeModal();
  sessionStorage.setItem('cinema_checkout', JSON.stringify(storeSelection('reservation')));
  window.location.href = 'checkout.html';
}

loadSeats();
