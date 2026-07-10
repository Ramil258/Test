/**
 * Модуль хранения данных
 * Работает с LocalStorage для хранения данных приложения
 */

const Storage = {
    // Ключи LocalStorage
    KEYS: {
        USERS: 'netequipment_users',
        EQUIPMENT: 'netequipment_equipment',
        LOGS: 'netequipment_logs',
        SETTINGS: 'netequipment_settings',
        CURRENT_USER: 'netequipment_current_user',
        THEME: 'netequipment_theme',
        EXCEL_DATA: 'netequipment_excel_data'
    },

    /**
     * Инициализация модуля
     */
    async init() {
        // Проверяем доступность LocalStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (e) {
            console.error('LocalStorage недоступен:', e);
        }
        
        // Инициализируем GitHub Storage
        await GitHubStorage.init();
        
        // Создаем пользователей по умолчанию если их нет
        if (!this.get(this.KEYS.USERS)) {
            this.setUsers(this.getDefaultUsers());
        }
        
        // Создаем настройки по умолчанию если их нет
        if (!this.get(this.KEYS.SETTINGS)) {
            this.setSettings(this.getDefaultSettings());
        }
        
        // Синхронизируем оборудование с GitHub только если есть токен
        if (GitHubStorage.hasToken()) {
            await this.syncEquipmentFromGitHub();
        }
    },

    /**
     * Получить данные из LocalStorage
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Ошибка при получении данных ${key}:`, error);
            return null;
        }
    },

    /**
     * Сохранить данные в LocalStorage
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Ошибка при сохранении данных ${key}:`, error);
            return false;
        }
    },

    /**
     * Удалить данные из LocalStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Ошибка при удалении данных ${key}:`, error);
            return false;
        }
    },

    /**
     * Получить пользователей
     */
    getUsers() {
        return this.get(this.KEYS.USERS) || this.getDefaultUsers();
    },

    /**
     * Сохранить пользователей
     */
    setUsers(users) {
        return this.set(this.KEYS.USERS, users);
    },

    /**
     * Получить оборудование
     */
    getEquipment() {
        return this.get(this.KEYS.EQUIPMENT) || [];
    },

    /**
     * Сохранить оборудование
     */
    async setEquipment(equipment) {
        const result = this.set(this.KEYS.EQUIPMENT, equipment);
        // Синхронизируем с GitHub только если есть токен
        if (GitHubStorage.hasToken()) {
            await this.syncEquipmentToGitHub(equipment);
        }
        return result;
    },

    /**
     * Получить логи
     */
    getLogs() {
        return this.get(this.KEYS.LOGS) || [];
    },

    /**
     * Сохранить логи
     */
    setLogs(logs) {
        return this.set(this.KEYS.LOGS, logs);
    },

    /**
     * Добавить запись в лог
     */
    addLog(action, description, username) {
        const logs = this.getLogs();
        logs.unshift({
            id: Date.now(),
            action,
            description,
            username,
            timestamp: new Date().toISOString()
        });
        
        // Храним только последние 1000 записей
        if (logs.length > 1000) {
            logs.pop();
        }
        
        return this.setLogs(logs);
    },

    /**
     * Получить настройки
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || this.getDefaultSettings();
    },

    /**
     * Сохранить настройки
     */
    setSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    /**
     * Получить текущего пользователя
     */
    getCurrentUser() {
        return this.get(this.KEYS.CURRENT_USER);
    },

    /**
     * Сохранить текущего пользователя
     */
    setCurrentUser(user) {
        return this.set(this.KEYS.CURRENT_USER, user);
    },

    /**
     * Получить тему
     */
    getTheme() {
        return this.get(this.KEYS.THEME) || 'light';
    },

    /**
     * Сохранить тему
     */
    setTheme(theme) {
        return this.set(this.KEYS.THEME, theme);
    },

    /**
     * Получить данные Excel
     */
    getExcelData() {
        return this.get(this.KEYS.EXCEL_DATA);
    },

    /**
     * Сохранить данные Excel
     */
    setExcelData(data) {
        return this.set(this.KEYS.EXCEL_DATA, data);
    },

    /**
     * Получить пользователей по умолчанию
     */
    getDefaultUsers() {
        return [
            {
                id: 1,
                username: 'admin',
                passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // SHA-256 для 'admin123'
                role: 'admin',
                email: 'admin@netequipment.local',
                createdAt: new Date().toISOString()
            }
        ];
    },

    /**
     * Получить настройки по умолчанию
     */
    getDefaultSettings() {
        return {
            itemsPerPage: 20,
            autoSave: true,
            autoBackup: true,
            maxBackups: 10,
            defaultEquipmentType: 'router',
            dateFormat: 'DD.MM.YYYY',
            language: 'ru'
        };
    },

    /**
     * Хеширование пароля (SHA-256)
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Проверка пароля
     */
    async verifyPassword(password, hash) {
        const passwordHash = await this.hashPassword(password);
        return passwordHash === hash;
    },

    /**
     * Очистить все данные
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });
    },

    /**
     * Экспорт всех данных
     */
    exportAllData() {
        return {
            users: this.getUsers(),
            equipment: this.getEquipment(),
            logs: this.getLogs(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },

    /**
     * Импорт всех данных
     */
    importAllData(data) {
        if (data.users) this.setUsers(data.users);
        if (data.equipment) this.setEquipment(data.equipment);
        if (data.logs) this.setLogs(data.logs);
        if (data.settings) this.setSettings(data.settings);
        return true;
    },

    /**
     * Синхронизировать оборудование с GitHub
     */
    async syncEquipmentToGitHub(equipment) {
        try {
            await GitHubStorage.set(GitHubStorage.DATA_KEYS.EQUIPMENT, equipment);
            console.log('Оборудование синхронизировано с GitHub');
        } catch (error) {
            console.error('Ошибка при синхронизации с GitHub:', error);
        }
    },

    /**
     * Загрузить оборудование из GitHub
     */
    async syncEquipmentFromGitHub() {
        try {
            const githubEquipment = await GitHubStorage.get(GitHubStorage.DATA_KEYS.EQUIPMENT);
            if (githubEquipment) {
                // Всегда загружаем данные из GitHub, если они есть
                this.set(this.KEYS.EQUIPMENT, githubEquipment);
                console.log('Оборудование загружено из GitHub:', githubEquipment.length, 'единиц');
            } else {
                console.log('Данных в GitHub нет, используем локальные');
            }
        } catch (error) {
            console.error('Ошибка при загрузке из GitHub:', error);
        }
    }
};
