Auth.init();
updateNavAuth();
setupMobileNav();
setupNavbarScroll();

let allMovies = [];
let currentGenre = 'all';
let searchTimeout = null;

const genreMap = {
  28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',
  99:'Documental',18:'Drama',10751:'Familiar',14:'Fantasía',36:'Historia',
  27:'Terror',10402:'Música',9648:'Misterio',10749:'Romance',878:'Ciencia Ficción',
  10770:'TV Movie',53:'Suspense',10752:'Bélico',37:'Western'
};

async function loadCartelera() {
  try {
    const [nowPlaying, popular, topRated] = await Promise.all([
      TMDB.getNowPlaying(),
      TMDB.getPopular(),
      TMDB.getTopRated()
    ]);

    const seen = new Set();
    allMovies = [];
    [nowPlaying, popular, topRated].forEach(list => {
      (list.results || []).forEach(m => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          allMovies.push(m);
        }
      });
    });

    buildFilters();
    renderMovies(allMovies);
  } catch (err) {
    document.getElementById('movies-grid').innerHTML = renderEmptyState('Error al cargar la cartelera');
  }
}

function buildFilters() {
  const usedGenres = new Set();
  allMovies.forEach(m => {
    if (m.genre_ids) m.genre_ids.forEach(g => usedGenres.add(g));
  });

  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '<button class="filter-chip active" data-genre="all">Todas</button>';
  [...usedGenres].sort().forEach(gId => {
    if (genreMap[gId]) {
      bar.innerHTML += `<button class="filter-chip" data-genre="${gId}">${genreMap[gId]}</button>`;
    }
  });

  bar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGenre = btn.dataset.genre;
      filterMovies();
    });
  });
}

function filterMovies() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  let filtered = [...allMovies];

  if (query) {
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(query) ||
      (m.overview && m.overview.toLowerCase().includes(query))
    );
  }

  if (currentGenre !== 'all') {
    const genreId = parseInt(currentGenre);
    filtered = filtered.filter(m => m.genre_ids && m.genre_ids.includes(genreId));
  }

  renderMovies(filtered);
}

function renderMovies(movies) {
  const grid = document.getElementById('movies-grid');
  if (!movies.length) {
    grid.innerHTML = renderEmptyState('No se encontraron películas');
    return;
  }
  grid.innerHTML = movies.map(m => renderMovieCard(m)).join('');
  if (typeof LazyLoad !== 'undefined') LazyLoad.observe(grid);
}

document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterMovies();
    const q = document.getElementById('search-input').value.trim();
    if (q && Auth.isLoggedIn()) {
      API.logActivity(Auth.getUserId(), 'search', { query: q });
    }
  }, 300);
});

loadCartelera();