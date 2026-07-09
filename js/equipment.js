/**
 * Модуль управления оборудованием
 * Обрабатывает все операции с оборудованием
 */

const Equipment = {
    currentEquipment: [],
    filteredEquipment: [],
    currentPage: 1,
    itemsPerPage: 20,
    selectedItems: new Set(),
    sortField: 'inventoryNumber',
    sortDirection: 'asc',
    filters: {
        search: '',
        equipmentType: '',
        manufacturer: '',
        city: '',
        status: '',
        responsible: ''
    },

    // Типы оборудования
    EQUIPMENT_TYPES: [
        'DSLAM',
        'Коммутатор доступа',
        'Коммутатор агрегации',
        'Ядро сети',
        'OLT',
        'ONU',
        'Маршрутизатор',
        'Firewall',
        'Медиа-конвертер',
        'Сервер',
        'Другое'
    ],

    // Статусы оборудования
    STATUSES: [
        'В работе',
        'На обслуживании',
        'Сломано',
        'Резерв',
        'Выведено из эксплуатации'
    ],

    /**
     * Инициализация модуля
     */
    init() {
        this.loadEquipment();
        this.setupEventListeners();
    },

    /**
     * Загрузить оборудование
     */
    loadEquipment() {
        this.currentEquipment = Storage.getEquipment();
        this.applyFilters();
    },

    /**
     * Применить фильтры
     */
    applyFilters() {
        this.filteredEquipment = this.currentEquipment.filter(item => {
            // Поиск по всем полям
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                const searchableText = Object.values(item).join(' ').toLowerCase();
                if (!searchableText.includes(searchLower)) {
                    return false;
                }
            }
            
            // Фильтры по конкретным полям
            if (this.filters.equipmentType && item.equipmentType !== this.filters.equipmentType) {
                return false;
            }
            if (this.filters.manufacturer && item.manufacturer !== this.filters.manufacturer) {
                return false;
            }
            if (this.filters.city && item.city !== this.filters.city) {
                return false;
            }
            if (this.filters.status && item.status !== this.filters.status) {
                return false;
            }
            if (this.filters.responsible && item.responsible !== this.filters.responsible) {
                return false;
            }
            
            return true;
        });
        
        // Сортировка
        this.sortEquipment();
        
        // Обновляем отображение
        this.renderTable();
    },

    /**
     * Сортировка оборудования
     */
    sortEquipment() {
        this.filteredEquipment.sort((a, b) => {
            let aVal = a[this.sortField] || '';
            let bVal = b[this.sortField] || '';
            
            // Числовые поля
            if (['installationDate', 'serviceDate'].includes(this.sortField)) {
                aVal = new Date(aVal).getTime() || 0;
                bVal = new Date(bVal).getTime() || 0;
            }
            
            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    },

    /**
     * Отобразить таблицу
     */
    renderTable() {
        const container = document.getElementById('equipmentContent');
        if (!container) return;
        
        // Пагинация
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredEquipment.slice(startIndex, endIndex);
        
        // Получаем уникальные значения для фильтров
        const manufacturers = [...new Set(this.currentEquipment.map(item => item.manufacturer).filter(Boolean))];
        const cities = [...new Set(this.currentEquipment.map(item => item.city).filter(Boolean))];
        const responsibles = [...new Set(this.currentEquipment.map(item => item.responsible).filter(Boolean))];
        
        container.innerHTML = `
            <div class="search-container">
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" class="form-control" id="searchInput" 
                               placeholder="Поиск по всем полям..." value="${this.filters.search}">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="typeFilter">
                            <option value="">Все типы</option>
                            ${this.EQUIPMENT_TYPES.map(type => 
                                `<option value="${type}" ${this.filters.equipmentType === type ? 'selected' : ''}>${type}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="manufacturerFilter">
                            <option value="">Все производители</option>
                            ${manufacturers.map(m => 
                                `<option value="${m}" ${this.filters.manufacturer === m ? 'selected' : ''}>${m}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="cityFilter">
                            <option value="">Все города</option>
                            ${cities.map(c => 
                                `<option value="${c}" ${this.filters.city === c ? 'selected' : ''}>${c}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="statusFilter">
                            <option value="">Все статусы</option>
                            ${this.STATUSES.map(status => 
                                `<option value="${status}" ${this.filters.status === status ? 'selected' : ''}>${status}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    ${Auth.hasPermission('add_equipment') ? `
                        <button class="btn btn-primary" onclick="Equipment.showAddForm()">
                            <i class="fas fa-plus"></i> Добавить
                        </button>
                    ` : ''}
                    ${Auth.hasPermission('export_excel') ? `
                        <button class="btn btn-success" onclick="Excel.exportEquipment()">
                            <i class="fas fa-file-export"></i> Экспорт
                        </button>
                    ` : ''}
                </div>
                <div>
                    <span class="text-muted">Всего: ${this.filteredEquipment.length}</span>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th width="50">
                                        <input type="checkbox" id="selectAll" onchange="Equipment.toggleSelectAll()">
                                    </th>
                                    <th onclick="Equipment.sortBy('inventoryNumber')" style="cursor: pointer">
                                        Инв. номер ${this.getSortIcon('inventoryNumber')}
                                    </th>
                                    <th onclick="Equipment.sortBy('name')" style="cursor: pointer">
                                        Название ${this.getSortIcon('name')}
                                    </th>
                                    <th onclick="Equipment.sortBy('equipmentType')" style="cursor: pointer">
                                        Тип ${this.getSortIcon('equipmentType')}
                                    </th>
                                    <th onclick="Equipment.sortBy('manufacturer')" style="cursor: pointer">
                                        Производитель ${this.getSortIcon('manufacturer')}
                                    </th>
                                    <th onclick="Equipment.sortBy('ipAddress')" style="cursor: pointer">
                                        IP ${this.getSortIcon('ipAddress')}
                                    </th>
                                    <th onclick="Equipment.sortBy('city')" style="cursor: pointer">
                                        Город ${this.getSortIcon('city')}
                                    </th>
                                    <th onclick="Equipment.sortBy('status')" style="cursor: pointer">
                                        Статус ${this.getSortIcon('status')}
                                    </th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pageItems.length > 0 ? pageItems.map(item => `
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="item-checkbox" value="${item.id}"
                                                   ${this.selectedItems.has(item.id) ? 'checked' : ''}
                                                   onchange="Equipment.toggleSelection(${item.id})">
                                        </td>
                                        <td>
                                            <a href="#" onclick="Equipment.showDetail(${item.id})">${item.inventoryNumber}</a>
                                        </td>
                                        <td>${item.name}</td>
                                        <td>${item.equipmentType}</td>
                                        <td>${item.manufacturer}</td>
                                        <td>${item.ipAddress || '-'}</td>
                                        <td>${item.city || '-'}</td>
                                        <td>
                                            <span class="badge ${this.getStatusBadgeClass(item.status)}">${item.status}</span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-info" onclick="Equipment.showDetail(${item.id})" title="Просмотр">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                ${Auth.hasPermission('edit_equipment') ? `
                                                    <button class="btn btn-primary" onclick="Equipment.showEditForm(${item.id})" title="Редактировать">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                ` : ''}
                                                ${Auth.hasPermission('delete_equipment') ? `
                                                    <button class="btn btn-danger" onclick="Equipment.deleteItem(${item.id})" title="Удалить">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="9" class="text-center py-4">
                                            <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                                            <p class="text-muted">Оборудование не найдено</p>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            ${this.renderPagination()}
        `;
        
        // Добавляем обработчики событий
        this.setupTableEventListeners();
    },

    /**
     * Получить иконку сортировки
     */
    getSortIcon(field) {
        if (this.sortField !== field) return '';
        return this.sortDirection === 'asc' ? '↑' : '↓';
    },

    /**
     * Получить класс бейджа статуса
     */
    getStatusBadgeClass(status) {
        const classes = {
            'В работе': 'bg-success',
            'На обслуживании': 'bg-warning',
            'Сломано': 'bg-danger',
            'Резерв': 'bg-info',
            'Выведено из эксплуатации': 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    },

    /**
     * Отобразить пагинацию
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredEquipment.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';
        
        let html = '<nav><ul class="pagination justify-content-center">';
        
        // Предыдущая страница
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="Equipment.goToPage(${this.currentPage - 1})">Предыдущая</a>
            </li>
        `;
        
        // Страницы
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="Equipment.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Следующая страница
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="Equipment.goToPage(${this.currentPage + 1})">Следующая</a>
            </li>
        `;
        
        html += '</ul></nav>';
        
        return html;
    },

    /**
     * Перейти на страницу
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredEquipment.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderTable();
    },

    /**
     * Сортировка по полю
     */
    sortBy(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.sortEquipment();
        this.renderTable();
    },

    /**
     * Выбрать все элементы
     */
    toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.item-checkbox');
        
        if (selectAll.checked) {
            checkboxes.forEach(cb => {
                cb.checked = true;
                this.selectedItems.add(parseInt(cb.value));
            });
        } else {
            checkboxes.forEach(cb => {
                cb.checked = false;
                this.selectedItems.delete(parseInt(cb.value));
            });
        }
    },

    /**
     * Переключить выбор элемента
     */
    toggleSelection(id) {
        if (this.selectedItems.has(id)) {
            this.selectedItems.delete(id);
        } else {
            this.selectedItems.add(id);
        }
    },

    /**
     * Показать форму добавления
     */
    showAddForm() {
        this.showForm();
    },

    /**
     * Показать форму редактирования
     */
    showEditForm(id) {
        const item = this.currentEquipment.find(i => i.id === id);
        if (!item) return;
        
        this.showForm(item);
    },

    /**
     * Показать форму
     */
    showForm(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('equipmentModal'));
        const form = document.getElementById('equipmentForm');
        const title = document.getElementById('equipmentModalTitle');
        
        title.textContent = item ? 'Редактирование оборудования' : 'Добавление оборудования';
        
        form.innerHTML = this.getFormHTML(item);
        
        modal.show();
    },

    /**
     * Получить HTML формы
     */
    getFormHTML(item = null) {
        return `
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Инвентарный номер *</label>
                    <input type="text" class="form-control" name="inventoryNumber" value="${item?.inventoryNumber || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Тип оборудования *</label>
                    <select class="form-select" name="equipmentType" required>
                        ${this.EQUIPMENT_TYPES.map(type => 
                            `<option value="${type}" ${item?.equipmentType === type ? 'selected' : ''}>${type}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Название *</label>
                    <input type="text" class="form-control" name="name" value="${item?.name || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Производитель *</label>
                    <input type="text" class="form-control" name="manufacturer" value="${item?.manufacturer || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Модель *</label>
                    <input type="text" class="form-control" name="model" value="${item?.model || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Серийный номер</label>
                    <input type="text" class="form-control" name="serialNumber" value="${item?.serialNumber || ''}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">IP-адрес</label>
                    <input type="text" class="form-control" name="ipAddress" value="${item?.ipAddress || ''}" placeholder="192.168.1.1">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Маска</label>
                    <input type="text" class="form-control" name="subnetMask" value="${item?.subnetMask || ''}" placeholder="255.255.255.0">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Шлюз</label>
                    <input type="text" class="form-control" name="gateway" value="${item?.gateway || ''}" placeholder="192.168.1.254">
                </div>
                <div class="col-md-4">
                    <label class="form-label">VLAN</label>
                    <input type="number" class="form-control" name="vlan" value="${item?.vlan || ''}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">MAC-адрес</label>
                    <input type="text" class="form-control" name="macAddress" value="${item?.macAddress || ''}" placeholder="00:11:22:33:44:55">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Статус</label>
                    <select class="form-select" name="status">
                        ${this.STATUSES.map(status => 
                            `<option value="${status}" ${item?.status === status ? 'selected' : ''}>${status}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Регион</label>
                    <input type="text" class="form-control" name="region" value="${item?.region || ''}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Город</label>
                    <input type="text" class="form-control" name="city" value="${item?.city || ''}">
                </div>
                <div class="col-md-12">
                    <label class="form-label">Адрес</label>
                    <input type="text" class="form-control" name="address" value="${item?.address || ''}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Узел</label>
                    <input type="text" class="form-control" name="node" value="${item?.node || ''}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Стойка</label>
                    <input type="text" class="form-control" name="rack" value="${item?.rack || ''}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Полка</label>
                    <input type="text" class="form-control" name="shelf" value="${item?.shelf || ''}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Слот</label>
                    <input type="text" class="form-control" name="slot" value="${item?.slot || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Порт</label>
                    <input type="text" class="form-control" name="port" value="${item?.port || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Прошивка</label>
                    <input type="text" class="form-control" name="firmware" value="${item?.firmware || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Ответственный</label>
                    <input type="text" class="form-control" name="responsible" value="${item?.responsible || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Дата установки</label>
                    <input type="date" class="form-control" name="installationDate" value="${item?.installationDate || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Дата обслуживания</label>
                    <input type="date" class="form-control" name="serviceDate" value="${item?.serviceDate || ''}">
                </div>
                <div class="col-12">
                    <label class="form-label">Комментарий</label>
                    <textarea class="form-control" name="comments" rows="3">${item?.comments || ''}</textarea>
                </div>
            </div>
            <input type="hidden" name="id" value="${item?.id || ''}">
        `;
    },

    /**
     * Сохранить оборудование
     */
    saveEquipment() {
        const form = document.getElementById('equipmentForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Валидация
        if (!data.inventoryNumber || !data.name || !data.manufacturer || !data.model) {
            UI.showToast('Ошибка', 'Заполните обязательные поля', 'error');
            return;
        }
        
        // Проверка уникальности инвентарного номера
        const existing = this.currentEquipment.find(
            item => item.inventoryNumber === data.inventoryNumber && item.id !== parseInt(data.id)
        );
        if (existing) {
            UI.showToast('Ошибка', 'Оборудование с таким инвентарным номером уже существует', 'error');
            return;
        }
        
        if (data.id) {
            // Редактирование
            const index = this.currentEquipment.findIndex(i => i.id === parseInt(data.id));
            if (index >= 0) {
                this.currentEquipment[index] = {
                    ...this.currentEquipment[index],
                    ...data,
                    id: parseInt(data.id),
                    updatedAt: new Date().toISOString()
                };
                
                Storage.addLog('edit', `Обновлено оборудование: ${data.inventoryNumber}`, 
                    Auth.getCurrentUser()?.username);
            }
        } else {
            // Создание
            data.id = Date.now();
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            this.currentEquipment.push(data);
            
            Storage.addLog('add', `Добавлено оборудование: ${data.inventoryNumber}`, 
                Auth.getCurrentUser()?.username);
        }
        
        Storage.setEquipment(this.currentEquipment);
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('equipmentModal'));
        modal.hide();
        
        // Обновляем отображение
        this.loadEquipment();
        
        UI.showToast('Успех', 'Оборудование сохранено');
    },

    /**
     * Удалить оборудование
     */
    deleteItem(id) {
        const item = this.currentEquipment.find(i => i.id === id);
        if (!item) return;
        
        UI.showConfirm(
            `Вы уверены, что хотите удалить оборудование "${item.inventoryNumber} - ${item.name}"?`,
            () => {
                this.currentEquipment = this.currentEquipment.filter(i => i.id !== id);
                Storage.setEquipment(this.currentEquipment);
                
                Storage.addLog('delete', `Удалено оборудование: ${item.inventoryNumber}`, 
                    Auth.getCurrentUser()?.username);
                
                this.loadEquipment();
                UI.showToast('Успех', 'Оборудование удалено');
            }
        );
    },

    /**
     * Массовое удаление
     */
    deleteSelected() {
        if (this.selectedItems.size === 0) {
            UI.showToast('Ошибка', 'Выберите оборудование для удаления', 'error');
            return;
        }
        
        UI.showConfirm(
            `Вы уверены, что хотите удалить ${this.selectedItems.size} единиц оборудования?`,
            () => {
                this.currentEquipment = this.currentEquipment.filter(
                    item => !this.selectedItems.has(item.id)
                );
                Storage.setEquipment(this.currentEquipment);
                
                Storage.addLog('mass_delete', `Массовое удаление: ${this.selectedItems.size} единиц`, 
                    Auth.getCurrentUser()?.username);
                
                this.selectedItems.clear();
                this.loadEquipment();
                UI.showToast('Успех', 'Оборудование удалено');
            }
        );
    },

    /**
     * Показать детальную информацию
     */
    showDetail(id) {
        const item = this.currentEquipment.find(i => i.id === id);
        if (!item) return;
        
        const modal = new bootstrap.Modal(document.getElementById('equipmentDetailModal'));
        const content = document.getElementById('equipmentDetailContent');
        
        content.innerHTML = this.getDetailHTML(item);
        
        // Генерируем QR-код
        this.generateQRCode(item);
        
        modal.show();
    },

    /**
     * Получить HTML детальной информации
     */
    getDetailHTML(item) {
        return `
            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-3">
                        <div class="card-header">Основная информация</div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-4">Инвентарный номер:</dt>
                                <dd class="col-sm-8">${item.inventoryNumber}</dd>
                                <dt class="col-sm-4">Тип оборудования:</dt>
                                <dd class="col-sm-8">${item.equipmentType}</dd>
                                <dt class="col-sm-4">Название:</dt>
                                <dd class="col-sm-8">${item.name}</dd>
                                <dt class="col-sm-4">Производитель:</dt>
                                <dd class="col-sm-8">${item.manufacturer}</dd>
                                <dt class="col-sm-4">Модель:</dt>
                                <dd class="col-sm-8">${item.model}</dd>
                                <dt class="col-sm-4">Серийный номер:</dt>
                                <dd class="col-sm-8">${item.serialNumber || '-'}</dd>
                                <dt class="col-sm-4">Статус:</dt>
                                <dd class="col-sm-8">
                                    <span class="badge ${this.getStatusBadgeClass(item.status)}">${item.status}</span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header">Сетевые настройки</div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-4">IP-адрес:</dt>
                                <dd class="col-sm-8">${item.ipAddress || '-'}</dd>
                                <dt class="col-sm-4">Маска:</dt>
                                <dd class="col-sm-8">${item.subnetMask || '-'}</dd>
                                <dt class="col-sm-4">Шлюз:</dt>
                                <dd class="col-sm-8">${item.gateway || '-'}</dd>
                                <dt class="col-sm-4">VLAN:</dt>
                                <dd class="col-sm-8">${item.vlan || '-'}</dd>
                                <dt class="col-sm-4">MAC-адрес:</dt>
                                <dd class="col-sm-8">${item.macAddress || '-'}</dd>
                            </dl>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header">Местоположение</div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-4">Регион:</dt>
                                <dd class="col-sm-8">${item.region || '-'}</dd>
                                <dt class="col-sm-4">Город:</dt>
                                <dd class="col-sm-8">${item.city || '-'}</dd>
                                <dt class="col-sm-4">Адрес:</dt>
                                <dd class="col-sm-8">${item.address || '-'}</dd>
                                <dt class="col-sm-4">Узел:</dt>
                                <dd class="col-sm-8">${item.node || '-'}</dd>
                                <dt class="col-sm-4">Стойка:</dt>
                                <dd class="col-sm-8">${item.rack || '-'}</dd>
                                <dt class="col-sm-4">Полка:</dt>
                                <dd class="col-sm-8">${item.shelf || '-'}</dd>
                                <dt class="col-sm-4">Слот:</dt>
                                <dd class="col-sm-8">${item.slot || '-'}</dd>
                                <dt class="col-sm-4">Порт:</dt>
                                <dd class="col-sm-8">${item.port || '-'}</dd>
                            </dl>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header">Техническая информация</div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-4">Прошивка:</dt>
                                <dd class="col-sm-8">${item.firmware || '-'}</dd>
                                <dt class="col-sm-4">Ответственный:</dt>
                                <dd class="col-sm-8">${item.responsible || '-'}</dd>
                                <dt class="col-sm-4">Дата установки:</dt>
                                <dd class="col-sm-8">${item.installationDate || '-'}</dd>
                                <dt class="col-sm-4">Дата обслуживания:</dt>
                                <dd class="col-sm-8">${item.serviceDate || '-'}</dd>
                            </dl>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">Комментарий</div>
                        <div class="card-body">
                            ${item.comments || '-'}
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card mb-3">
                        <div class="card-header">QR-код</div>
                        <div class="card-body text-center">
                            <div id="qrCode" class="mb-3"></div>
                            <small class="text-muted">Отсканируйте для быстрого доступа</small>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">Системная информация</div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-6">Создано:</dt>
                                <dd class="col-sm-6">${new Date(item.createdAt).toLocaleString('ru-RU')}</dd>
                                <dt class="col-sm-6">Обновлено:</dt>
                                <dd class="col-sm-6">${new Date(item.updatedAt).toLocaleString('ru-RU')}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Сгенерировать QR-код
     */
    generateQRCode(item) {
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;
        
        const qrData = `ID:${item.id}\nINV:${item.inventoryNumber}\nIP:${item.ipAddress || 'N/A'}`;
        
        QRCode.toCanvas(qrData, { width: 150 }, (error, canvas) => {
            if (error) {
                console.error(error);
                return;
            }
            qrContainer.innerHTML = '';
            qrContainer.appendChild(canvas);
        });
    },

    /**
     * Печать карточки оборудования
     */
    printEquipmentCard() {
        window.print();
    },

    /**
     * Получить статистику
     */
    getStatistics() {
        const total = this.currentEquipment.length;
        
        const byType = {};
        this.EQUIPMENT_TYPES.forEach(type => {
            byType[type] = this.currentEquipment.filter(item => item.equipmentType === type).length;
        });
        
        const byManufacturer = {};
        this.currentEquipment.forEach(item => {
            if (item.manufacturer) {
                byManufacturer[item.manufacturer] = (byManufacturer[item.manufacturer] || 0) + 1;
            }
        });
        
        const byCity = {};
        this.currentEquipment.forEach(item => {
            if (item.city) {
                byCity[item.city] = (byCity[item.city] || 0) + 1;
            }
        });
        
        const byStatus = {};
        this.STATUSES.forEach(status => {
            byStatus[status] = this.currentEquipment.filter(item => item.status === status).length;
        });
        
        return {
            total,
            byType,
            byManufacturer,
            byCity,
            byStatus
        };
    },

    /**
     * Настроить обработчики событий
     */
    setupEventListeners() {
        // Обработчики будут добавлены в setupTableEventListeners
    },

    /**
     * Настроить обработчики событий таблицы
     */
    setupTableEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const typeFilter = document.getElementById('typeFilter');
        const manufacturerFilter = document.getElementById('manufacturerFilter');
        const cityFilter = document.getElementById('cityFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.equipmentType = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        
        if (manufacturerFilter) {
            manufacturerFilter.addEventListener('change', (e) => {
                this.filters.manufacturer = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        
        if (cityFilter) {
            cityFilter.addEventListener('change', (e) => {
                this.filters.city = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
    }
};

// Глобальная функция для сохранения оборудования
window.saveEquipment = () => Equipment.saveEquipment();
