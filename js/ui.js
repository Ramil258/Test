/**
 * Модуль пользовательского интерфейса
 * Обрабатывает навигацию, темы, уведомления и общие элементы UI
 */

const UI = {
    currentPage: 'home',

    /**
     * Инициализация модуля
     */
    init() {
        this.setupNavigation();
        this.setupTheme();
        this.setupModals();
    },

    /**
     * Настроить навигацию
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
    },

    /**
     * Перейти на страницу
     */
    navigateTo(page) {
        // Проверяем права доступа
        if (!this.checkPageAccess(page)) {
            this.showToast('Ошибка', 'У вас нет прав для доступа к этой странице', 'error');
            return;
        }
        
        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Показываем выбранную страницу
        const pageElement = document.getElementById(`${page}Page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }
        
        this.currentPage = page;
        
        // Загружаем контент страницы
        this.loadPageContent(page);
        
        // Закрываем мобильное меню
        document.getElementById('sidebar').classList.remove('show');
    },

    /**
     * Проверить доступ к странице
     */
    checkPageAccess(page) {
        switch (page) {
            case 'home':
                return Auth.hasPermission('view_equipment');
            case 'equipment':
                return Auth.hasPermission('view_equipment');
            case 'users':
                return Auth.hasPermission('manage_users');
            case 'import':
                return Auth.hasPermission('import_excel');
            case 'export':
                return Auth.hasPermission('export_excel');
            case 'logs':
                return Auth.hasPermission('view_logs');
            case 'settings':
                return Auth.hasPermission('access_settings');
            default:
                return false;
        }
    },

    /**
     * Загрузить контент страницы
     */
    loadPageContent(page) {
        switch (page) {
            case 'home':
                Charts.renderHomeStatistics();
                break;
            case 'equipment':
                Equipment.loadEquipment();
                break;
            case 'users':
                Users.loadUsers();
                break;
            case 'import':
                this.renderImportPage();
                break;
            case 'export':
                this.renderExportPage();
                break;
            case 'logs':
                this.renderLogsPage();
                break;
            case 'settings':
                this.renderSettingsPage();
                break;
        }
    },

    /**
     * Отобразить страницу импорта
     */
    renderImportPage() {
        const container = document.getElementById('importContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <strong>Информация:</strong> При импорте оборудование с существующим инвентарным номером будет обновлено. Новое оборудование будет создано. Перед импортом автоматически создается резервная копия.
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Excel файл (.xlsx, .xls)</label>
                        <input type="file" class="form-control" id="importFile" accept=".xlsx,.xls">
                    </div>
                    
                    <div class="mb-3">
                        <h5>Требования к файлу:</h5>
                        <ul>
                            <li>Файл должен содержать заголовки в первой строке</li>
                            <li>Обязательные поля: Инвентарный номер, Тип оборудования, Название, Производитель, Модель</li>
                            <li>Инвентарный номер должен быть уникальным</li>
                            <li>Формат MAC-адреса: XX:XX:XX:XX:XX:XX</li>
                            <li>Формат IP-адреса: XXX.XXX.XXX.XXX</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <button class="btn btn-outline-primary" onclick="Excel.createTemplate()">
                            <i class="fas fa-download"></i> Скачать шаблон
                        </button>
                    </div>
                    
                    <button class="btn btn-primary" onclick="UI.importEquipment()">
                        <i class="fas fa-upload"></i> Загрузить и импортировать
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Импортировать оборудование
     */
    async importEquipment() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Ошибка', 'Выберите файл для импорта', 'error');
            return;
        }
        
        try {
            const result = await Excel.importEquipment(file);
            this.showToast('Успех', `Импорт завершен: добавлено ${result.added}, обновлено ${result.updated}`);
            
            // Очищаем поле ввода
            fileInput.value = '';
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    },

    /**
     * Отобразить страницу экспорта
     */
    renderExportPage() {
        const container = document.getElementById('exportContent');
        if (!container) return;
        
        const equipment = Storage.getEquipment();
        
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="mb-3">
                        <h5>Экспорт оборудования</h5>
                        <p class="text-muted">Всего оборудования в базе: ${equipment.length}</p>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Варианты экспорта:</label>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="exportType" id="exportAll" value="all" checked>
                            <label class="form-check-label" for="exportAll">
                                Все оборудование
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="exportType" id="exportSelected" value="selected">
                            <label class="form-check-label" for="exportSelected">
                                Выбранные записи (${Equipment.selectedItems.size})
                            </label>
                        </div>
                    </div>
                    
                    <button class="btn btn-success" onclick="UI.exportEquipment()">
                        <i class="fas fa-file-export"></i> Экспорт в Excel
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Экспортировать оборудование
     */
    exportEquipment() {
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        
        let options = {};
        
        if (exportType === 'selected') {
            if (Equipment.selectedItems.size === 0) {
                this.showToast('Ошибка', 'Выберите записи для экспорта', 'error');
                return;
            }
            options.selectedIds = Array.from(Equipment.selectedItems);
        }
        
        const result = Excel.exportEquipment(options);
        
        if (result) {
            this.showToast('Успех', 'Экспорт завершен');
        } else {
            this.showToast('Ошибка', 'Ошибка при экспорте', 'error');
        }
    },

    /**
     * Отобразить страницу логов
     */
    renderLogsPage() {
        const container = document.getElementById('logsContent');
        if (!container) return;
        
        const logs = Storage.getLogs();
        
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Дата и время</th>
                                    <th>Пользователь</th>
                                    <th>Действие</th>
                                    <th>Описание</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.length > 0 ? logs.map(log => `
                                    <tr>
                                        <td>${new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                                        <td>${log.username}</td>
                                        <td>
                                            <span class="badge bg-primary">${log.action}</span>
                                        </td>
                                        <td>${log.description}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="4" class="text-center">Нет записей</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Отобразить страницу настроек
     */
    renderSettingsPage() {
        const container = document.getElementById('settingsContent');
        if (!container) return;
        
        const settings = Storage.getSettings();
        const backups = Excel.getBackups();
        
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-file-excel"></i> Данные Excel</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Всего оборудования:</strong> ${Storage.getEquipment().length}</p>
                            <p><strong>Последнее обновление:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                            
                            <hr>
                            
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="Excel.createBackup()">
                                    <i class="fas fa-save"></i> Создать резервную копию
                                </button>
                                <button class="btn btn-success" onclick="Excel.exportEquipment()">
                                    <i class="fas fa-file-export"></i> Экспорт все данные
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-archive"></i> Резервные копии</h5>
                        </div>
                        <div class="card-body">
                            ${backups.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Дата</th>
                                                <th>Записей</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${backups.map((backup, index) => `
                                                <tr>
                                                    <td>${new Date(backup.backupDate).toLocaleString('ru-RU')}</td>
                                                    <td>${backup.equipment.length}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-primary" onclick="UI.restoreBackup(${index})">
                                                            Восстановить
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted">Нет резервных копий</p>'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-cog"></i> Настройки приложения</h5>
                        </div>
                        <div class="card-body">
                            <form id="settingsForm">
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Записей на странице</label>
                                        <input type="number" class="form-control" name="itemsPerPage" value="${settings.itemsPerPage}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Макс. бэкапов</label>
                                        <input type="number" class="form-control" name="maxBackups" value="${settings.maxBackups}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Формат даты</label>
                                        <select class="form-select" name="dateFormat">
                                            <option value="DD.MM.YYYY" ${settings.dateFormat === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY</option>
                                            <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-check mt-3">
                                    <input class="form-check-input" type="checkbox" name="autoSave" id="autoSave" ${settings.autoSave ? 'checked' : ''}>
                                    <label class="form-check-label" for="autoSave">
                                        Автосохранение изменений
                                    </label>
                                </div>
                                
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="autoBackup" id="autoBackup" ${settings.autoBackup ? 'checked' : ''}>
                                    <label class="form-check-label" for="autoBackup">
                                        Автоматическое резервное копирование
                                    </label>
                                </div>
                                
                                <button type="button" class="btn btn-primary mt-3" onclick="UI.saveSettings()">
                                    <i class="fas fa-save"></i> Сохранить настройки
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Сохранить настройки
     */
    saveSettings() {
        const form = document.getElementById('settingsForm');
        const formData = new FormData(form);
        const settings = Object.fromEntries(formData.entries());
        
        // Преобразуем чекбоксы
        settings.autoSave = form.querySelector('[name="autoSave"]').checked;
        settings.autoBackup = form.querySelector('[name="autoBackup"]').checked;
        
        Storage.setSettings(settings);
        
        // Применяем настройки
        Equipment.itemsPerPage = parseInt(settings.itemsPerPage);
        
        this.showToast('Успех', 'Настройки сохранены');
    },

    /**
     * Восстановить из резервной копии
     */
    restoreBackup(index) {
        UI.showConfirm(
            'Вы уверены, что хотите восстановить данные из резервной копии? Текущие данные будут заменены.',
            () => {
                const result = Excel.restoreFromBackup(index);
                if (result) {
                    Equipment.loadEquipment();
                    this.showToast('Успех', 'Данные восстановлены');
                } else {
                    this.showToast('Ошибка', 'Ошибка при восстановлении', 'error');
                }
            }
        );
    },

    /**
     * Настроить тему
     */
    setupTheme() {
        const theme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    },

    /**
     * Переключить тему
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.setTheme(newTheme);
        this.updateThemeIcon(newTheme);
    },

    /**
     * Обновить иконку темы
     */
    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    },

    /**
     * Настроить модальные окна
     */
    setupModals() {
        // Настройка подтверждения
        const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
        window.confirmModal = confirmModal;
    },

    /**
     * Показать подтверждение
     */
    showConfirm(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        
        const confirmButton = document.getElementById('confirmButton');
        confirmButton.onclick = () => {
            callback();
            window.confirmModal.hide();
        };
        
        window.confirmModal.show();
    },

    /**
     * Показать toast уведомление
     */
    showToast(title, message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Устанавливаем цвет в зависимости от типа
        const toastHeader = toast.querySelector('.toast-header');
        toastHeader.className = 'toast-header';
        
        if (type === 'error') {
            toastHeader.classList.add('bg-danger', 'text-white');
        } else if (type === 'warning') {
            toastHeader.classList.add('bg-warning');
        } else {
            toastHeader.classList.add('bg-success', 'text-white');
        }
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
};

// Глобальные функции
window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('show');
};

window.toggleTheme = () => UI.toggleTheme();

window.logout = () => Auth.logout();

window.showProfile = () => Users.showProfile();
