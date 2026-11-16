 

const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Иван Романов',
    email: 'admin@sneakfix.by',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    name: 'Артём Смирнов',
    email: 'master@sneakfix.by',
    password: 'master123',
    role: 'master'
  },
  {
    id: 3,
    name: 'Алексей Клиент',
    email: 'client@sneakfix.by',
    password: 'client123',
    role: 'user'
  }
];

function createAuthService(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  const USERS_KEY = 'sneakfix_users_v1';
  const CURRENT_USER_KEY = 'sneakfix_current_user_v1';

  const delay = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));

  const getUsers = () => {
    if (!storage) return [...DEFAULT_USERS];
    const raw = storage.getItem(USERS_KEY);
    if (!raw) {
      storage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return [...DEFAULT_USERS];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_USERS];
    } catch {
      return [...DEFAULT_USERS];
    }
  };

  const saveUsers = (users) => {
    if (storage) {
      storage.setItem(USERS_KEY, JSON.stringify(users));
    }
  };

  return {
    getCurrentUser() {
      if (!storage) return null;
      const raw = storage.getItem(CURRENT_USER_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    async login(email, password) {
      await delay();
      const users = getUsers();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const found = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!found || found.password !== password) {
        return {
          success: false,
          message: 'Неверный адрес email или пароль. Пожалуйста, проверьте данные.'
        };
      }

      const safeUser = { id: found.id, name: found.name, email: found.email, role: found.role };
      if (storage) {
        storage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      }
      return { success: true, user: safeUser };
    },

    async quickLogin(role = 'admin') {
      await delay();
      const users = getUsers();
      let found = users.find(u => u.role === role);
      if (!found) {
        found = DEFAULT_USERS.find(u => u.role === role) || users[0];
      }
      const safeUser = { id: found.id, name: found.name, email: found.email, role: found.role };
      if (storage) {
        storage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      }
      return { success: true, user: safeUser };
    },

    async register(name, email, password, confirmPassword) {
      await delay();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();

      if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: 'Все обязательные поля должны быть заполнены.' };
      }

      if (password !== confirmPassword) {
        return { success: false, message: 'Введённые пароли не совпадают.' };
      }

      if (password.length < 6) {
        return { success: false, message: 'Пароль должен содержать не менее 6 символов.' };
      }

      const users = getUsers();
      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'Пользователь с таким email уже существует.' };
      }

      const newUser = {
        id: Date.now(),
        name: cleanName,
        email: cleanEmail,
        password,
        role: 'user'
      };

      users.push(newUser);
      saveUsers(users);

      const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      if (storage) {
        storage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      }
      return { success: true, user: safeUser };
    },

    async resetPassword(email) {
      await delay();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const users = getUsers();
      const found = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!found) {
        return {
          success: false,
          message: 'Пользователь с указанным адресом email не найден в системе.'
        };
      }

      return {
        success: true,
        message: `Ссылка для восстановления доступа направлена на почту ${cleanEmail}.`
      };
    },

    async logout() {
      await delay();
      if (storage) {
        storage.removeItem(CURRENT_USER_KEY);
      }
      return { success: true };
    }
  };
}

if (typeof window !== 'undefined') {
  window.createAuthService = createAuthService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createAuthService };
}

