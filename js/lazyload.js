// ============================================================
// Lazy Loading con IntersectionObserver
// Aplica fade-in a imagenes al entrar en el viewport
// ============================================================

const LazyLoad = (() => {

  let observer = null;
  const LOADING_CLASS = 'lazy-loading';
  const LOADED_CLASS = 'lazy-loaded';

  function createObserver() {
    if (observer) return observer;

    const options = {
      root: null,
      rootMargin: '100px 0px',
      threshold: 0.01
    };

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          loadImage(img);
          observer.unobserve(img);
        }
      });
    }, options);

    return observer;
  }

  function loadImage(img) {
    const src = img.dataset.src;
    if (!src) {
      img.classList.remove(LOADING_CLASS);
      img.classList.add(LOADED_CLASS);
      return;
    }

    img.classList.add(LOADING_CLASS);

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.remove(LOADING_CLASS);
      img.classList.add(LOADED_CLASS);
    };
    tempImg.onerror = () => {
      img.classList.remove(LOADING_CLASS);
      img.classList.add(LOADED_CLASS);
    };
    tempImg.src = src;
  }

  function observe(container) {
    const obs = createObserver();
    const images = (container || document).querySelectorAll('img[data-src]:not(.' + LOADED_CLASS + ')');
    images.forEach(img => obs.observe(img));
  }

  function observeAll() {
    observe(document);
  }

  // Convertir src a data-src para imagenes que deben cargarse diferidamente
  function prepareImages(container) {
    const imgs = (container || document).querySelectorAll('img:not([data-src])');
    imgs.forEach(img => {
      // No tocar imagenes tiny (avatars, iconos), solo posters/profiles/backdrops
      const w = img.naturalWidth || img.width || 0;
      if (w > 60 || img.classList.contains('lazy-target')) {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:') && src !== '') {
          img.dataset.src = src;
          img.classList.add(LOADING_CLASS);
        }
      }
    });
  }

  // Funcion para renderizar y observar automaticamente
  function renderAndObserve(container, html) {
    container.innerHTML = html;
    prepareImages(container);
    observe(container);
  }

  return { observe, observeAll, prepareImages, renderAndObserve, loadImage };

})();
