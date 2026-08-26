// ============================================================
// TMDB API - Lee config de config.js
// ============================================================

const TMDB = {
  async fetchFromTMDB(endpoint, params = {}) {
    const url = new URL(`${TMDB_CONFIG.BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_CONFIG.API_KEY);
    url.searchParams.set('language', TMDB_CONFIG.LANGUAGE);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Error ${res.status}`);
    return res.json();
  },

  async getTrending() { return this.fetchFromTMDB('/trending/movie/week'); },
  async getNowPlaying() { return this.fetchFromTMDB('/movie/now_playing'); },
  async getPopular() { return this.fetchFromTMDB('/movie/popular'); },
  async getTopRated() { return this.fetchFromTMDB('/movie/top_rated'); },
  async getUpcoming() { return this.fetchFromTMDB('/movie/upcoming'); },
  async searchMovies(query) { return this.fetchFromTMDB('/search/movie', { query }); },
  async getMovieDetails(id) { return this.fetchFromTMDB(`/movie/${id}`, { append_to_response: 'credits,videos,similar,recommendations' }); },
  async getGenres() { return this.fetchFromTMDB('/genre/movie/list'); },

  getPosterURL(path) {
    if (!path) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect fill="%231a1a1a" width="500" height="750"/><text fill="%23555" font-size="20" text-anchor="middle" x="250" y="375">Sin Poster</text></svg>';
    return `${TMDB_CONFIG.IMG_BASE}${TMDB_CONFIG.POSTER_SIZE}${path}`;
  },

  getBackdropURL(path) {
    if (!path) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect fill="%231a1a1a" width="1280" height="720"/></svg>';
    return `${TMDB_CONFIG.IMG_BASE}${TMDB_CONFIG.BACKDROP_SIZE}${path}`;
  },

  getProfileURL(path) {
    if (!path) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="185" height="275"><rect fill="%231a1a1a" width="185" height="275"/></svg>';
    return `${TMDB_CONFIG.IMG_BASE}${TMDB_CONFIG.PROFILE_SIZE}${path}`;
  },

  formatDuration(minutes) {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  formatRating(voteAverage) {
    return voteAverage ? voteAverage.toFixed(1) : 'N/A';
  }
};
