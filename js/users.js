/**
 * Модуль управления пользователями
 * Обрабатывает все операции с пользователями
 */

const Users = {
    currentUser: null,
    currentPage: 1,
    itemsPerPage: 20,
    searchQuery: '',

    // Роли пользователей
    ROLES: [
        { value: 'admin', name: 'Администратор' },
        { value: 'editor', name: 'Редактор' },
        { value: 'viewer', name: 'Просмотр' }
    ],

    /**
     * Инициализация модуля
     */
    init() {
        this.loadUsers();
    },

    /**
     * Загрузить пользователей
     */
    loadUsers() {
        this.renderUsersList();
    },

    /**
     * Отобразить список пользователей
     */
    renderUsersList() {
        const container = document.getElementById('usersContent');
        if (!container) return;
        
        let users = Storage.getUsers();
        
        // Поиск
        if (this.searchQuery) {
            const searchLower = this.searchQuery.toLowerCase();
            users = users.filter(user => 
                user.username.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
            );
        }
        
        // Пагинация
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageUsers = users.slice(startIndex, endIndex);
        
        container.innerHTML = `
            <div class="search-container mb-3">
                <div class="row g-3">
                    <div class="col-md-6">
                        <input type="text" class="form-control" id="userSearchInput" 
                               placeholder="Поиск по имени или email..." value="${this.searchQuery}">
                    </div>
                    <div class="col-md-6">
                        <button class="btn btn-primary" onclick="Users.showAddForm()">
                            <i class="fas fa-plus"></i> Добавить пользователя
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Имя пользователя</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Статус</th>
                                    <th>Создан</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pageUsers.length > 0 ? pageUsers.map(user => `
                                    <tr>
                                        <td>
                                            <strong>${user.username}</strong>
                                        </td>
                                        <td>${user.email || '-'}</td>
                                        <td>
                                            <span class="badge bg-primary">${this.getRoleName(user.role)}</span>
                                        </td>
                                        <td>
                                            <span class="badge ${user.active !== false ? 'bg-success' : 'bg-danger'}">
                                                ${user.active !== false ? 'Активен' : 'Заблокирован'}
                                            </span>
                                        </td>
                                        <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-primary" onclick="Users.showEditForm(${user.id})" title="Редактировать">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-warning" onclick="Users.showChangePasswordForm(${user.id})" title="Сменить пароль">
                                                    <i class="fas fa-key"></i>
                                                </button>
                                                <button class="btn btn-${user.active !== false ? 'danger' : 'success'}" 
                                                        onclick="Users.toggleUserStatus(${user.id})" 
                                                        title="${user.active !== false ? 'Заблокировать' : 'Разблокировать'}">
                                                    <i class="fas fa-${user.active !== false ? 'lock' : 'unlock'}"></i>
                                                </button>
                                                ${user.id !== 1 ? `
                                                    <button class="btn btn-danger" onclick="Users.deleteUser(${user.id})" title="Удалить">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" class="text-center py-4">
                                            <i class="fas fa-users fa-2x text-muted mb-2"></i>
                                            <p class="text-muted">Пользователи не найдены</p>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            ${this.renderPagination(users.length)}
        `;
        
        // Добавляем обработчик поиска
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.renderUsersList();
            });
        }
    },

    /**
     * Отобразить пагинацию
     */
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) return '';
        
        let html = '<nav><ul class="pagination justify-content-center">';
        
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="Users.goToPage(${this.currentPage - 1})">Предыдущая</a>
            </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="Users.goToPage(${i})">${i}</a>
                </li>
            `;
        }
        
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="Users.goToPage(${this.currentPage + 1})">Следующая</a>
            </li>
        `;
        
        html += '</ul></nav>';
        
        return html;
    },

    /**
     * Перейти на страницу
     */
    goToPage(page) {
        const users = Storage.getUsers();
        const totalPages = Math.ceil(users.length / this.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderUsersList();
    },

    /**
     * Получить имя роли
     */
    getRoleName(role) {
        const roleObj = this.ROLES.find(r => r.value === role);
        return roleObj ? roleObj.name : role;
    },

    /**
     * Показать форму добавления пользователя
     */
    showAddForm() {
        this.showForm();
    },

    /**
     * Показать форму редактирования пользователя
     */
    showEditForm(id) {
        const user = Storage.getUsers().find(u => u.id === id);
        if (!user) return;
        
        this.showForm(user);
    },

    /**
     * Показать форму пользователя
     */
    showForm(user = null) {
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        title.textContent = user ? 'Редактирование пользователя' : 'Добавление пользователя';
        
        form.innerHTML = this.getFormHTML(user);
        
        modal.show();
    },

    /**
     * Получить HTML формы
     */
    getFormHTML(user = null) {
        return `
            <div class="mb-3">
                <label class="form-label">Имя пользователя *</label>
                <input type="text" class="form-control" name="username" value="${user?.username || ''}" required
                       ${user ? 'readonly' : ''}>
            </div>
            <div class="mb-3">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" name="email" value="${user?.email || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Роль *</label>
                <select class="form-select" name="role" required>
                    ${this.ROLES.map(role => 
                        `<option value="${role.value}" ${user?.role === role.value ? 'selected' : ''}>${role.name}</option>`
                    ).join('')}
                </select>
            </div>
            ${!user ? `
                <div class="mb-3">
                    <label class="form-label">Пароль *</label>
                    <input type="password" class="form-control" name="password" required minlength="8">
                    <small class="text-muted">Минимум 8 символов</small>
                </div>
                <div class="mb-3">
                    <label class="form-label">Подтверждение пароля *</label>
                    <input type="password" class="form-control" name="confirmPassword" required minlength="8">
                </div>
            ` : ''}
            <input type="hidden" name="id" value="${user?.id || ''}">
        `;
    },

    /**
     * Сохранить пользователя
     */
    async saveUser() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Проверяем, это форма смены пароля или редактирования
        if (data.userId) {
            // Это форма смены пароля
            await this.changePassword();
            return;
        }
        
        // Валидация
        if (!data.username || !data.email || !data.role) {
            UI.showToast('Ошибка', 'Заполните обязательные поля', 'error');
            return;
        }
        
        // Проверка уникальности имени пользователя
        const users = Storage.getUsers();
        const existing = users.find(
            user => user.username === data.username && user.id !== parseInt(data.id)
        );
        if (existing) {
            UI.showToast('Ошибка', 'Пользователь с таким именем уже существует', 'error');
            return;
        }
        
        // Проверка паролей для нового пользователя
        if (!data.id) {
            if (data.password !== data.confirmPassword) {
                UI.showToast('Ошибка', 'Пароли не совпадают', 'error');
                return;
            }
            
            if (data.password.length < 8) {
                UI.showToast('Ошибка', 'Пароль должен содержать минимум 8 символов', 'error');
                return;
            }
        }
        
        if (data.id) {
            // Редактирование
            const index = users.findIndex(u => u.id === parseInt(data.id));
            if (index >= 0) {
                users[index] = {
                    ...users[index],
                    email: data.email,
                    role: data.role
                };
                
                Storage.addLog('user_edit', `Изменен пользователь: ${data.username}`, 
                    Auth.getCurrentUser()?.username);
            }
        } else {
            // Создание
            const passwordHash = await Storage.hashPassword(data.password);
            data.id = Date.now();
            data.passwordHash = passwordHash;
            data.active = true;
            data.createdAt = new Date().toISOString();
            delete data.password;
            delete data.confirmPassword;
            
            users.push(data);
            
            Storage.addLog('user_add', `Создан пользователь: ${data.username}`, 
                Auth.getCurrentUser()?.username);
        }
        
        Storage.setUsers(users);
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        modal.hide();
        
        // Обновляем отображение
        this.loadUsers();
        
        UI.showToast('Успех', 'Пользователь сохранен');
    },

    /**
     * Показать форму смены пароля
     */
    showChangePasswordForm(id) {
        const user = Storage.getUsers().find(u => u.id === id);
        if (!user) return;
        
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        title.textContent = 'Смена пароля';
        
        form.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Новый пароль будет установлен немедленно.
            </div>
            <div class="mb-3">
                <label class="form-label">Новый пароль *</label>
                <input type="password" class="form-control" name="newPassword" required minlength="8">
            </div>
            <div class="mb-3">
                <label class="form-label">Подтверждение пароля *</label>
                <input type="password" class="form-control" name="confirmPassword" required minlength="8">
            </div>
            <input type="hidden" name="userId" value="${user.id}">
        `;
        
        modal.show();
    },

    /**
     * Сменить пароль пользователя
     */
    async changePassword() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        if (data.newPassword !== data.confirmPassword) {
            UI.showToast('Ошибка', 'Пароли не совпадают', 'error');
            return;
        }
        
        if (data.newPassword.length < 8) {
            UI.showToast('Ошибка', 'Пароль должен содержать минимум 8 символов', 'error');
            return;
        }
        
        const users = Storage.getUsers();
        const index = users.findIndex(u => u.id === parseInt(data.userId));
        
        if (index >= 0) {
            users[index].passwordHash = await Storage.hashPassword(data.newPassword);
            Storage.setUsers(users);
            
            Storage.addLog('password_change', `Сменен пароль для пользователя: ${users[index].username}`, 
                Auth.getCurrentUser()?.username);
            
            UI.showToast('Успех', 'Пароль изменен');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        modal.hide();
    },

    /**
     * Переключить статус пользователя (активен/заблокирован)
     */
    toggleUserStatus(id) {
        const users = Storage.getUsers();
        const index = users.findIndex(u => u.id === id);
        
        if (index >= 0) {
            users[index].active = users[index].active === false ? true : false;
            Storage.setUsers(users);
            
            const action = users[index].active ? 'разблокирован' : 'заблокирован';
            Storage.addLog('user_status', `Пользователь ${users[index].username} ${action}`, 
                Auth.getCurrentUser()?.username);
            
            this.loadUsers();
            UI.showToast('Успех', `Пользователь ${action}`);
        }
    },

    /**
     * Удалить пользователя
     */
    deleteUser(id) {
        const user = Storage.getUsers().find(u => u.id === id);
        if (!user) return;
        
        if (user.id === 1) {
            UI.showToast('Ошибка', 'Невозможно удалить главного администратора', 'error');
            return;
        }
        
        UI.showConfirm(
            `Вы уверены, что хотите удалить пользователя "${user.username}"?`,
            () => {
                const users = Storage.getUsers().filter(u => u.id !== id);
                Storage.setUsers(users);
                
                Storage.addLog('user_delete', `Удален пользователь: ${user.username}`, 
                    Auth.getCurrentUser()?.username);
                
                this.loadUsers();
                UI.showToast('Успех', 'Пользователь удален');
            }
        );
    },

    /**
     * Показать профиль текущего пользователя
     */
    showProfile() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;
        
        this.showEditForm(currentUser.id);
    }
};

// Глобальная функция для сохранения пользователя
window.saveUser = () => Users.saveUser();
