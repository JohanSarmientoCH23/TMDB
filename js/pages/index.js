Auth.init();
updateNavAuth();
setupMobileNav();
setupNavbarScroll();

async function loadHome() {
  try {
    const [trending, nowPlaying, upcoming, popular, topRated] = await Promise.all([
      TMDB.getTrending(),
      TMDB.getNowPlaying(),
      TMDB.getUpcoming(),
      TMDB.getPopular(),
      TMDB.getTopRated()
    ]);

    if (trending.results && trending.results.length > 0) {
      const featured = trending.results[Math.floor(Math.random() * Math.min(5, trending.results.length))];
      renderHero(featured);
    }

    renderGrid('now-playing-grid', nowPlaying.results || []);
    renderGrid('upcoming-grid', upcoming.results || []);
    renderGrid('popular-grid', popular.results || []);
    renderGrid('toprated-grid', topRated.results || []);

  } catch (err) {
    console.error('Home load error:', err);
    document.querySelectorAll('.movie-grid').forEach(g => {
      g.innerHTML = renderEmptyState('Error al cargar películas');
    });
  }
}

function renderHero(movie) {
  const backdrop = TMDB.getBackdropURL(movie.backdrop_path);
  const title = escapeHtml(movie.title || 'Sin título');
  const rating = TMDB.formatRating(movie.vote_average);
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const genres = movie.genre_ids ? movie.genre_ids.slice(0, 3) : [];
  const desc = escapeHtml(movie.overview || 'Sin descripción disponible');

  const genreNames = {
    28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',
    99:'Documental',18:'Drama',10751:'Familiar',14:'Fantasía',36:'Historia',
    27:'Terror',10402:'Música',9648:'Misterio',10749:'Romance',878:'Ciencia Ficción',
    10770:'TV Movie',53:'Suspense',10752:'Bélico',37:'Western'
  };

  document.getElementById('hero-bg').style.backgroundImage = `url(${backdrop})`;
  document.getElementById('hero-content').innerHTML = `
    <span class="hero-tag">Destacada</span>
    <h1 class="hero-title">${title}</h1>
    <div class="hero-meta">
      <span class="hero-rating">★ ${rating}</span>
      <div class="hero-info">
        <span>${year}</span>
      </div>
    </div>
    <div class="hero-genres">
      ${genres.map(g => `<span class="genre-tag">${escapeHtml(genreNames[g] || 'Género')}</span>`).join('')}
    </div>
    <p class="hero-desc">${desc}</p>
    <div class="hero-actions">
      <a href="funciones.html?movieId=${movie.id}" class="btn btn-primary">Comprar Entradas</a>
      <a href="pelicula.html?id=${movie.id}" class="btn btn-secondary">Ver Detalles</a>
    </div>
  `;
}

function renderGrid(containerId, movies) {
  const container = document.getElementById(containerId);
  if (!movies.length) {
    container.innerHTML = renderEmptyState('No hay películas disponibles');
    return;
  }
  container.innerHTML = movies.slice(0, 12).map(m => renderMovieCard(m)).join('');
  if (typeof LazyLoad !== 'undefined') LazyLoad.observe(container);
}

loadHome();

function dismissSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('splash-hide');
    setTimeout(() => splash.remove(), 600);
  }
}
window.addEventListener('load', () => setTimeout(dismissSplash, 2200));
setTimeout(dismissSplash, 4000);

(function() {
  const container = document.getElementById('splash-particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'splash-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = 60 + Math.random() * 40 + '%';
    p.style.animationDelay = Math.random() * 3 + 's';
    p.style.animationDuration = 2 + Math.random() * 2 + 's';
    const colors = ['#b388ff', '#7c3aed', '#00f0ff', '#a855f7'];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(p);
  }
})();