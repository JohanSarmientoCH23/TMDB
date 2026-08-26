const Auth = {
  currentUser: null,

  init() {
    const stored = localStorage.getItem('cinema_user');
    if (stored) {
      try { this.currentUser = JSON.parse(stored); } catch { this.currentUser = null; }
    }
    return this.currentUser;
  },

  isLoggedIn() { return this.currentUser !== null; },
  isAdmin() { return this.currentUser && this.currentUser.role === 'admin'; },

  async login(email, password) {
    const users = API.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Email o contrasena incorrectos');
    const safeUser = { ...user };
    delete safeUser.password;
    this.currentUser = safeUser;
    localStorage.setItem('cinema_user', JSON.stringify(safeUser));
    // Registrar actividad de login
    API.logActivity(safeUser.id, 'login', { email: safeUser.email });
    return safeUser;
  },

  async register(name, email, password) {
    const users = API.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Este correo ya esta registrado');
    }
    if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Este nombre de usuario ya existe');
    }
    const newUser = API.createUser({ name, email, password, role: 'user', createdAt: new Date().toISOString() });
    const safeUser = { ...newUser };
    delete safeUser.password;
    this.currentUser = safeUser;
    localStorage.setItem('cinema_user', JSON.stringify(safeUser));
    API.logActivity(safeUser.id, 'register', { name: safeUser.name, email: safeUser.email });
    return safeUser;
  },

  logout() {
    if (this.currentUser) {
      API.logActivity(this.currentUser.id, 'logout', {});
    }
    this.currentUser = null;
    localStorage.removeItem('cinema_user');
    window.location.href = 'index.html';
  },

  getUser() { return this.currentUser; },
  getUserId() { return this.currentUser ? this.currentUser.id : null; }
};
