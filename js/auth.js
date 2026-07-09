/**
 * Модуль авторизации
 * Обрабатывает вход, выход и проверку прав пользователей
 */

const Auth = {
    currentUser: null,

    /**
     * Инициализация модуля авторизации
     */
    init() {
        // Инициализируем Storage если нужно
        if (typeof Storage !== 'undefined') {
            this.currentUser = Storage.getCurrentUser();
            this.checkAuth();
        }
    },

    /**
     * Проверка авторизации
     */
    checkAuth() {
        if (this.currentUser) {
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }
    },

    /**
     * Показать экран входа
     */
    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('mainApp').classList.add('d-none');
    },

    /**
     * Показать основное приложение
     */
    showMainApp() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('mainApp').classList.remove('d-none');
        this.updateUserInfo();
        this.setupPermissions();
    },

    /**
     * Обновить информацию о пользователе в интерфейсе
     */
    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('currentUserName').textContent = this.currentUser.username;
            document.getElementById('currentUserRole').textContent = this.getRoleDisplayName(this.currentUser.role);
        }
    },

    /**
     * Настроить права доступа
     */
    setupPermissions() {
        const role = this.currentUser?.role;
        
        // Показывать/скрывать пункты меню в зависимости от роли
        const usersMenuItem = document.getElementById('usersMenuItem');
        const importMenuItem = document.getElementById('importMenuItem');
        const logsMenuItem = document.getElementById('logsMenuItem');
        const settingsMenuItem = document.getElementById('settingsMenuItem');
        
        if (role === 'admin') {
            usersMenuItem?.classList.remove('d-none');
            importMenuItem?.classList.remove('d-none');
            logsMenuItem?.classList.remove('d-none');
            settingsMenuItem?.classList.remove('d-none');
        } else if (role === 'editor') {
            usersMenuItem?.classList.add('d-none');
            importMenuItem?.classList.add('d-none');
            logsMenuItem?.classList.add('d-none');
            settingsMenuItem?.classList.add('d-none');
        } else { // viewer
            usersMenuItem?.classList.add('d-none');
            importMenuItem?.classList.add('d-none');
            logsMenuItem?.classList.add('d-none');
            settingsMenuItem?.classList.add('d-none');
        }
    },

    /**
     * Вход в систему
     */
    async login(username, password) {
        try {
            const users = Storage.getUsers();
            const user = users.find(u => u.username === username);
            
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            
            const isValid = await Storage.verifyPassword(password, user.passwordHash);
            
            if (!isValid) {
                throw new Error('Неверный пароль');
            }
            
            this.currentUser = user;
            Storage.setCurrentUser(user);
            
            // Логируем вход
            Storage.addLog('login', `Пользователь ${username} вошел в систему`, username);
            
            this.showMainApp();
            UI.showToast('Успешный вход', 'Добро пожаловать, ' + username);
            
            return true;
        } catch (error) {
            UI.showToast('Ошибка входа', error.message, 'error');
            return false;
        }
    },

    /**
     * Выход из системы
     */
    logout() {
        const username = this.currentUser?.username;
        
        // Логируем выход
        Storage.addLog('logout', `Пользователь ${username} вышел из системы`, username);
        
        this.currentUser = null;
        Storage.remove(Storage.KEYS.CURRENT_USER);
        
        this.showLoginScreen();
        UI.showToast('Выход', 'Вы успешно вышли из системы');
    },

    /**
     * Проверить права пользователя
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        
        switch (permission) {
            case 'view_equipment':
                return ['admin', 'editor', 'viewer'].includes(role);
            case 'add_equipment':
                return ['admin', 'editor'].includes(role);
            case 'edit_equipment':
                return ['admin', 'editor'].includes(role);
            case 'delete_equipment':
                return role === 'admin';
            case 'manage_users':
                return role === 'admin';
            case 'import_excel':
                return role === 'admin';
            case 'export_excel':
                return ['admin', 'viewer'].includes(role);
            case 'view_logs':
                return role === 'admin';
            case 'access_settings':
                return role === 'admin';
            default:
                return false;
        }
    },

    /**
     * Получить отображаемое имя роли
     */
    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Администратор',
            'editor': 'Редактор',
            'viewer': 'Просмотр'
        };
        return roleNames[role] || role;
    },

    /**
     * Получить текущего пользователя
     */
    getCurrentUser() {
        return this.currentUser;
    },

    /**
     * Проверить, авторизован ли пользователь
     */
    isAuthenticated() {
        return !!this.currentUser;
    }
};

// Обработчик формы входа
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    await Auth.login(username, password);
});
