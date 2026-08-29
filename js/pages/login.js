    Auth.init();

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');

      if (!email || !password) {
        errorEl.textContent = 'Completa todos los campos';
        errorEl.classList.add('show');
        return;
      }

      try {
        const user = await Auth.login(email, password);
        errorEl.classList.remove('show');
        showToast(`Bienvenido, ${user.name}`, 'success');

        const redirect = getParam('redirect');
        setTimeout(() => {
          window.location.href = redirect || (user.role === 'admin' ? 'admin.html' : 'index.html');
        }, 500);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.add('show');
      }
    }
