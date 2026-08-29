    Auth.init();

    async function handleRegister(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;
      const errorEl = document.getElementById('register-error');

      if (!name || !email || !password) {
        errorEl.textContent = 'Completa todos los campos';
        errorEl.classList.add('show');
        return;
      }

      if (password !== confirm) {
        errorEl.textContent = 'Las contraseñas no coinciden';
        errorEl.classList.add('show');
        return;
      }

      if (password.length < 6) {
        errorEl.textContent = 'La contrasena debe tener al menos 6 caracteres';
        errorEl.classList.add('show');
        return;
      }

      // Validar nombre y correo duplicados
      const users = API.getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        errorEl.textContent = 'Este correo ya esta registrado';
        errorEl.classList.add('show');
        return;
      }
      if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
        errorEl.textContent = 'Este nombre de usuario ya existe';
        errorEl.classList.add('show');
        return;
      }

      try {
        const user = await Auth.register(name, email, password);
        errorEl.classList.remove('show');
        showToast(`Cuenta creada. Bienvenido, ${user.name}`, 'success');
        setTimeout(() => {
          window.location.href = getParam('redirect') || 'index.html';
        }, 500);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.add('show');
      }
    }
