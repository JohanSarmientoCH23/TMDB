    Auth.init();
    updateNavAuth();
    setupMobileNav();
    setupNavbarScroll();

    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html?redirect=mi-lista.html';
    }

    async function loadFavorites() {
      try {
        const favorites = await API.getFavorites(Auth.getUserId());
        const grid = document.getElementById('favorites-grid');

        if (!favorites.length) {
          grid.innerHTML = renderEmptyState('Tu lista está vacía. Agrega películas desde su página de detalles.', '❤️');
          return;
        }

        let html = '';
        for (const fav of favorites) {
          try {
            const movie = await TMDB.getMovieDetails(fav.movieId);
            html += renderMovieCard(movie);
          } catch {}
        }
        grid.innerHTML = html || renderEmptyState('Error al cargar las películas');
        if (typeof LazyLoad !== 'undefined') LazyLoad.observe(grid);
      } catch (err) {
        document.getElementById('favorites-grid').innerHTML = renderEmptyState('Error al cargar tu lista');
      }
    }

    loadFavorites();
