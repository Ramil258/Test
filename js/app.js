/**
 * Главный файл приложения
 * Инициализирует все модули и запускает приложение
 */

// Основной объект приложения
const App = {
    /**
     * Инициализация приложения
     */
    async init() {
        console.log('Инициализация NetEquipment...');
        
        // Инициализируем модули
        await Storage.init();
        Excel.init();
        Auth.init();
        Users.init();
        Equipment.init();
        Charts.init();
        UI.init();
        
        console.log('NetEquipment успешно инициализирован');
    },

    /**
     * Запуск приложения
     */
    async start() {
        await this.init();
        
        // Если пользователь авторизован, показываем главную страницу
        if (Auth.isAuthenticated()) {
            UI.navigateTo('home');
        }
    }
};

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await App.start();
});

// Обработка ошибок
window.addEventListener('error', (error) => {
    console.error('Ошибка приложения:', error);
});

// Обработка предупреждений
window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанное обещание:', event.reason);
});
