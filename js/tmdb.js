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
    if (!path) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='750'%3E%3Crect fill='%231a1a1a' width='500' height='750'/%3E%3Ctext fill='%23555' font-size='20' text-anchor='middle' x='250' y='375'%3ESin Poster%3C/text%3E%3C/svg%3E";
    return `${TMDB_CONFIG.IMG_BASE}${TMDB_CONFIG.POSTER_SIZE}${path}`;
  },

  getBackdropURL(path) {
    if (!path) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%231a1a1a' width='1280' height='720'/%3E%3C/svg%3E";
    return `${TMDB_CONFIG.IMG_BASE}${TMDB_CONFIG.BACKDROP_SIZE}${path}`;
  },

  getProfileURL(path) {
    if (!path) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='185' height='278'%3E%3Crect fill='%232a2a2a' width='185' height='278' rx='8'/%3E%3Ccircle cx='92' cy='95' r='40' fill='%23444'/%3E%3Cellipse cx='92' cy='240' rx='60' ry='55' fill='%23444'/%3E%3C/svg%3E";
    return `${TMDB_CONFIG.IMG_BASE}${TMDB_CONFIG.PROFILE_SIZE}${path}`;
  },

  async getPersonDetails(id) {
    const person = await this.fetchFromTMDB(`/person/${id}`, { append_to_response: 'combined_credits' });
    if (!person.biography) {
      try {
        const en = await fetch(`${TMDB_CONFIG.BASE_URL}/person/${id}?api_key=${TMDB_CONFIG.API_KEY}&language=en-US`);
        const enData = await en.json();
        if (enData.biography) person.biography = enData.biography;
        if (!person.place_of_birth && enData.place_of_birth) person.place_of_birth = enData.place_of_birth;
      } catch {}
    }
    return person;
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
