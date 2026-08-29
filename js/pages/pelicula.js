Auth.init();
updateNavAuth();
setupMobileNav();
setupNavbarScroll();

const movieId = parseInt(getParam('id'));
let currentMovie = null;
let userRating = 0;

const genreMap = {
  28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',
  99:'Documental',18:'Drama',10751:'Familiar',14:'Fantasía',36:'Historia',
  27:'Terror',10402:'Música',9648:'Misterio',10749:'Romance',878:'Ciencia Ficción',
  10770:'TV Movie',53:'Suspense',10752:'Bélico',37:'Western'
};

async function loadMovie() {
  if (!movieId) {
    document.getElementById('detail-content').innerHTML = renderEmptyState('Película no encontrada');
    return;
  }

  try {
    currentMovie = await TMDB.getMovieDetails(movieId);
    renderDetail();
    loadTrailer();
    loadSimilar();
    loadRatings();
    setupFavButton();
    if (Auth.isLoggedIn()) {
      API.logActivity(Auth.getUserId(), 'view', { movieId, movieTitle: currentMovie.title });
    }
  } catch (err) {
    document.getElementById('detail-content').innerHTML = renderEmptyState('Error al cargar la película');
  }
}

function renderDetail() {
  const m = currentMovie;
  const backdrop = TMDB.getBackdropURL(m.backdrop_path);
  const poster = TMDB.getPosterURL(m.poster_path);
  const rating = TMDB.formatRating(m.vote_average);
  const duration = TMDB.formatDuration(m.runtime);
  const year = m.release_date ? new Date(m.release_date).getFullYear() : '';
  const genres = (m.genres || []).map(g => g.name);
  const director = m.credits?.crew?.find(c => c.job === 'Director');
  const cast = (m.credits?.cast || []).slice(0, 12);

  document.getElementById('detail-hero-bg').style.backgroundImage = `url(${backdrop})`;
  document.title = `${m.title} - CINEMA PREMIUM`;

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-poster">
      <img src="${poster}" alt="${m.title}">
    </div>
    <div class="detail-info">
      <h1 class="detail-title">${escapeHtml(m.title)}</h1>
      ${m.tagline ? `<p style="color:var(--primary);font-style:italic;margin-bottom:1rem">${escapeHtml(m.tagline)}</p>` : ''}
      <div class="detail-meta">
        <span class="detail-meta-item">
          <svg viewBox="0 0 24 24" fill="#ffd700" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${rating}
        </span>
        <span class="detail-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${m.release_date ? formatDateFull(m.release_date) : 'N/A'}
        </span>
        ${duration ? `
        <span class="detail-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${duration}
        </span>` : ''}
      </div>
      <div class="detail-genres">
        ${genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
      </div>
      <p class="detail-desc">${escapeHtml(m.overview || 'Sin descripción disponible.')}</p>
      <div class="detail-actions">
        <a href="funciones.html?movieId=${m.id}" class="btn btn-primary btn-lg">Comprar Entradas</a>
        <button class="btn btn-secondary fav-btn" id="fav-btn" onclick="toggleFavorite()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Mi Lista
        </button>
        <button class="btn btn-outline" onclick="openRatingModal()">★ Valorar</button>
      </div>
      ${director ? `
      <div class="detail-credits" style="margin-top:1.5rem">
        <p style="font-size:0.85rem;color:var(--on-background-dim)"><strong style="color:var(--on-background)">Director:</strong> ${escapeHtml(director.name)}</p>
      </div>` : ''}
      ${cast.length > 0 ? `
      <div class="detail-credits">
        <h3>Reparto Principal</h3>
        <div class="detail-cast">
          ${cast.map(c => {
            const actorImg = TMDB.getProfileURL(c.profile_path);
            const actorName = escapeHtml(c.name);
            const actorChar = escapeHtml(c.character || '');
            return `
            <div class="cast-member" onclick="openActorDetail(${c.id})" style="cursor:pointer" title="Ver detalle de ${actorName}">
              <img src="${actorImg}" alt="${actorName}" loading="lazy" onerror="handleImgError(this)">
              <div class="cast-member-name">${actorName}</div>
              <div class="cast-member-char">${actorChar}</div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    </div>
  `;
  if (typeof LazyLoad !== 'undefined') LazyLoad.observe(document.getElementById('detail-content'));
}

function loadTrailer() {
  if (!currentMovie.videos || !currentMovie.videos.results) return;
  const trailer = currentMovie.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || currentMovie.videos.results.find(v => v.site === 'YouTube');
  if (trailer) {
    document.getElementById('trailer-section').innerHTML = `
      <div class="trailer-section">
        <h3>Trailer</h3>
        <div class="trailer-container">
          <iframe src="https://www.youtube.com/embed/${escapeHtml(trailer.key)}" allowfullscreen></iframe>
        </div>
      </div>
    `;
  }
}

function loadSimilar() {
  const similar = currentMovie.similar?.results || currentMovie.recommendations?.results || [];
  if (!similar.length) return;
  document.getElementById('similar-section').innerHTML = `
    <div style="margin-top:3rem">
      <div class="section-header">
        <h2 class="section-title">Películas Similares</h2>
      </div>
      <div class="movie-grid">
        ${similar.slice(0, 6).map(m => renderMovieCard(m)).join('')}
      </div>
    </div>
  `;
}

async function loadRatings() {
  try {
    const ratings = API.getRatings(movieId);
    const users = API.getUsers();
    renderRatingsList(ratings, users);
  } catch (e) {
    console.error('Error loading ratings:', e);
  }
}

function renderRatingsList(ratings, users) {
  if (!ratings.length) return;
  const container = document.getElementById('ratings-section');
  let html = `
    <div class="section-header">
      <h2 class="section-title">Valoraciones</h2>
    </div>
  `;
  ratings.forEach(r => {
    const user = users.find(u => u.id === r.userId);
    const userName = user ? user.name : 'Usuario #' + r.userId;
    const card = CRatingCard.create(userName, r.rating, r.comment || '');
    html += card.outerHTML;
  });
  container.innerHTML = html;
}

function openRatingModal() {
  if (!Auth.isLoggedIn()) {
    showToast('Inicia sesión para valorar', 'warning');
    return;
  }
  userRating = 0;
  document.getElementById('rating-comment').value = '';
  renderRatingStars();
  document.getElementById('rating-modal').style.display = 'flex';
  requestAnimationFrame(() => document.getElementById('rating-modal').classList.add('active'));
}

function closeRatingModal() {
  const modal = document.getElementById('rating-modal');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 300);
}

function renderRatingStars() {
  const container = document.getElementById('rating-stars-input');
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = `star ${i <= userRating ? 'filled' : ''}`;
    star.textContent = '★';
    star.onclick = () => { userRating = i; renderRatingStars(); };
    container.appendChild(star);
  }
}

async function submitRating() {
  if (userRating === 0) {
    showToast('Selecciona una calificación', 'warning');
    return;
  }
  try {
    await API.createRating({
      userId: Auth.getUserId(),
      movieId,
      rating: userRating,
      comment: document.getElementById('rating-comment').value,
      createdAt: new Date().toISOString()
    });
    showToast('Valoración enviada', 'success');
    closeRatingModal();
    loadRatings();
  } catch (err) {
    showToast('Error al enviar valoración', 'error');
  }
}

async function toggleFavorite() {
  if (!Auth.isLoggedIn()) {
    showToast('Inicia sesión para agregar a tu lista', 'warning');
    return;
  }
  try {
    const existing = await API.findFavorite(Auth.getUserId(), movieId);
    if (existing) {
      await API.removeFavorite(existing.id);
      showToast('Eliminada de Mi Lista', 'info');
      document.getElementById('fav-btn').classList.remove('active');
    } else {
      await API.addFavorite({
        userId: Auth.getUserId(),
        movieId,
        createdAt: new Date().toISOString()
      });
      showToast('Agregada a Mi Lista', 'success');
      document.getElementById('fav-btn').classList.add('active');
    }
  } catch (err) {
    showToast('Error al actualizar favorito', 'error');
  }
}

async function setupFavButton() {
  if (!Auth.isLoggedIn()) return;
  try {
    const existing = await API.findFavorite(Auth.getUserId(), movieId);
    const btn = document.getElementById('fav-btn');
    if (btn && existing) {
      btn.classList.add('active');
    }
  } catch (e) {
    console.error('setupFavButton error:', e);
  }
}

async function openActorDetail(personId) {
  if (!personId) return;
  showModal('Actor', '<div style="text-align:center;padding:2rem"><div class="spinner"></div></div>');
  try {
    const person = await TMDB.getPersonDetails(personId);
    const photo = TMDB.getProfileURL(person.profile_path);
    const name = escapeHtml(person.name || 'Desconocido');
    const bio = escapeHtml(person.biography || 'Biografía no disponible.');
    const birthday = person.birthday || null;
    const deathday = person.deathday || null;
    const place = escapeHtml(person.place_of_birth || '');
    const gender = person.gender === 1 ? 'Femenino' : person.gender === 2 ? 'Masculino' : '';

    let credits = (person.combined_credits?.cast || person.combined_credits?.crew || []);
    credits = credits.filter(c => c.poster_path).sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')).slice(0, 12);

    let html = '<div style="display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start">';
    html += `<img src="${photo}" alt="${name}" style="width:120px;height:180px;object-fit:cover;border-radius:12px;flex-shrink:0" onerror="handleImgError(this)">`;
    html += '<div style="flex:1;min-width:200px">';
    html += `<h2 style="font-family:var(--font-heading);font-size:1.3rem;margin-bottom:0.5rem">${name}</h2>`;
    if (person.also_known_as && person.also_known_as.length) {
      html += `<p style="font-size:0.8rem;color:var(--on-background-dim);margin-bottom:0.5rem"><em>También conocido como:</em> ${escapeHtml(person.also_known_as.slice(0,3).join(', '))}</p>`;
    }
    const metaItems = [];
    if (birthday) metaItems.push(`<span>🎂 ${formatDateFull(birthday)}${deathday ? ' — ✝ ' + formatDateFull(deathday) : ''}</span>`);
    if (place) metaItems.push(`<span>📍 ${place}</span>`);
    if (gender) metaItems.push(`<span>👤 ${gender}</span>`);
    if (metaItems.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:0.8rem;font-size:0.8rem;color:var(--on-background-dim);margin-bottom:0.8rem">${metaItems.join('')}</div>`;
    }
    html += `<p style="font-size:0.85rem;line-height:1.6;color:var(--on-background);max-height:150px;overflow-y:auto">${bio}</p>`;
    html += '</div></div>';

    if (credits.length) {
      html += '<h3 style="font-family:var(--font-heading);font-size:1rem;margin-top:1.5rem;margin-bottom:0.8rem">Filmografía</h3>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:0.8rem">';
      credits.forEach(c => {
        const poster = TMDB.getPosterURL(c.poster_path);
        const title = escapeHtml(c.title || c.name || '');
        const year = c.release_date ? c.release_date.substring(0, 4) : '';
        const character = escapeHtml(c.character || '');
        html += `<div onclick="closeModal();window.location.href='pelicula.html?id=${c.id}'" style="cursor:pointer;text-align:center">`;
        html += `<img src="${poster}" alt="${title}" style="width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px" loading="lazy" onerror="handleImgError(this)">`;
        html += `<div style="font-size:0.7rem;font-weight:500;margin-top:0.3rem;line-height:1.2">${title}</div>`;
        if (year) html += `<div style="font-size:0.65rem;color:var(--on-background-dim)">${year}</div>`;
        if (character) html += `<div style="font-size:0.65rem;color:var(--primary);font-style:italic">${character}</div>`;
        html += '</div>';
      });
      html += '</div>';
    }

    showModal(name, html);
  } catch (err) {
    showModal('Actor', renderEmptyState('No se pudo cargar la información del actor'));
  }
}

loadMovie();
