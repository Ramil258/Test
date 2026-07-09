/**
 * Модуль работы с Excel
 * Использует библиотеку SheetJS для работы с Excel файлами
 */

const Excel = {
    // Маппинг полей
    FIELD_MAPPING: {
        'Инвентарный номер': 'inventoryNumber',
        'Тип оборудования': 'equipmentType',
        'Название': 'name',
        'Производитель': 'manufacturer',
        'Модель': 'model',
        'Серийный номер': 'serialNumber',
        'IP': 'ipAddress',
        'Маска': 'subnetMask',
        'Шлюз': 'gateway',
        'VLAN': 'vlan',
        'Регион': 'region',
        'Город': 'city',
        'Адрес': 'address',
        'Узел': 'node',
        'Стойка': 'rack',
        'Полка': 'shelf',
        'Слот': 'slot',
        'Порт': 'port',
        'Прошивка': 'firmware',
        'MAC': 'macAddress',
        'Статус': 'status',
        'Ответственный': 'responsible',
        'Дата установки': 'installationDate',
        'Дата обслуживания': 'serviceDate',
        'Комментарий': 'comments'
    },

    // Обратный маппинг
    REVERSE_FIELD_MAPPING: {},

    /**
     * Инициализация модуля
     */
    init() {
        // Создаем обратный маппинг
        Object.entries(this.FIELD_MAPPING).forEach(([key, value]) => {
            this.REVERSE_FIELD_MAPPING[value] = key;
        });
    },

    /**
     * Прочитать Excel файл
     */
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    resolve(this.parseExcelData(jsonData));
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Парсинг данных из Excel
     */
    parseExcelData(rows) {
        if (!rows || rows.length < 2) return [];
        
        const headers = rows[0];
        const equipment = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const item = {
                id: Date.now() + i,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            headers.forEach((header, index) => {
                const fieldName = this.FIELD_MAPPING[header];
                if (fieldName) {
                    item[fieldName] = row[index] || '';
                }
            });
            
            // Проверяем обязательные поля
            if (item.inventoryNumber && item.name) {
                equipment.push(item);
            }
        }
        
        return equipment;
    },

    /**
     * Экспорт данных в Excel
     */
    exportToExcel(data, filename = 'equipment.xlsx') {
        try {
            // Создаем заголовки
            const headers = Object.keys(this.FIELD_MAPPING);
            const rows = [headers];
            
            // Добавляем данные
            data.forEach(item => {
                const row = headers.map(header => {
                    const fieldName = this.FIELD_MAPPING[header];
                    return item[fieldName] || '';
                });
                rows.push(row);
            });
            
            // Создаем workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            
            // Настраиваем ширину колонок
            const colWidths = headers.map(() => ({ wch: 20 }));
            worksheet['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Оборудование');
            
            // Скачиваем файл
            XLSX.writeFile(workbook, filename);
            
            return true;
        } catch (error) {
            console.error('Ошибка при экспорте в Excel:', error);
            return false;
        }
    },

    /**
     * Создать шаблон Excel
     */
    createTemplate(filename = 'equipment_template.xlsx') {
        const headers = Object.keys(this.FIELD_MAPPING);
        const rows = [headers];
        
        // Добавляем пример данных
        const exampleRow = headers.map(header => {
            const examples = {
                'Инвентарный номер': 'INV001',
                'Тип оборудования': 'Маршрутизатор',
                'Название': 'Core Router 1',
                'Производитель': 'Cisco',
                'Модель': 'ISR 4321',
                'Серийный номер': 'FHK12345678',
                'IP': '192.168.1.1',
                'Маска': '255.255.255.0',
                'Шлюз': '192.168.1.254',
                'VLAN': '1',
                'Регион': 'Московская область',
                'Город': 'Москва',
                'Адрес': 'ул. Примерная, д. 1',
                'Узел': 'Узел 1',
                'Стойка': 'R1',
                'Полка': 'S1',
                'Слот': '0',
                'Порт': 'GE0/0',
                'Прошивка': '16.9.4',
                'MAC': '00:11:22:33:44:55',
                'Статус': 'В работе',
                'Ответственный': 'Иванов И.И.',
                'Дата установки': '01.01.2024',
                'Дата обслуживания': '01.06.2024',
                'Комментарий': 'Основной маршрутизатор'
            };
            return examples[header] || '';
        });
        rows.push(exampleRow);
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        
        // Настраиваем ширину колонок
        const colWidths = headers.map(header => ({
            wch: Math.max(header.length, 15)
        }));
        worksheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Оборудование');
        XLSX.writeFile(workbook, filename);
    },

    /**
     * Импорт оборудования из Excel
     */
    async importEquipment(file) {
        try {
            // Создаем резервную копию
            this.createBackup();
            
            // Читаем файл
            const importedEquipment = await this.readExcelFile(file);
            
            if (importedEquipment.length === 0) {
                throw new Error('Файл не содержит данных для импорта');
            }
            
            // Получаем существующее оборудование
            const existingEquipment = Storage.getEquipment();
            
            // Объединяем данные
            const updatedEquipment = [...existingEquipment];
            let addedCount = 0;
            let updatedCount = 0;
            
            importedEquipment.forEach(importedItem => {
                const existingIndex = updatedEquipment.findIndex(
                    item => item.inventoryNumber === importedItem.inventoryNumber
                );
                
                if (existingIndex >= 0) {
                    // Обновляем существующую запись
                    updatedEquipment[existingIndex] = {
                        ...updatedEquipment[existingIndex],
                        ...importedItem,
                        id: updatedEquipment[existingIndex].id,
                        updatedAt: new Date().toISOString()
                    };
                    updatedCount++;
                } else {
                    // Добавляем новую запись
                    updatedEquipment.push(importedItem);
                    addedCount++;
                }
            });
            
            // Сохраняем
            Storage.setEquipment(updatedEquipment);
            
            // Логируем
            Storage.addLog('import', `Импорт оборудования: добавлено ${addedCount}, обновлено ${updatedCount}`, 
                Auth.getCurrentUser()?.username);
            
            return { added: addedCount, updated: updatedCount };
        } catch (error) {
            console.error('Ошибка при импорте:', error);
            throw error;
        }
    },

    /**
     * Экспорт оборудования в Excel
     */
    exportEquipment(options = {}) {
        try {
            let equipment = Storage.getEquipment();
            
            // Фильтрация
            if (options.selectedIds && options.selectedIds.length > 0) {
                equipment = equipment.filter(item => options.selectedIds.includes(item.id));
            }
            
            // Экспорт
            const filename = options.filename || `equipment_${new Date().toISOString().split('T')[0]}.xlsx`;
            const result = this.exportToExcel(equipment, filename);
            
            if (result) {
                Storage.addLog('export', `Экспорт оборудования: ${equipment.length} записей`, 
                    Auth.getCurrentUser()?.username);
            }
            
            return result;
        } catch (error) {
            console.error('Ошибка при экспорте:', error);
            return false;
        }
    },

    /**
     * Создать резервную копию
     */
    createBackup() {
        try {
            const equipment = Storage.getEquipment();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = {
                equipment,
                backupDate: new Date().toISOString(),
                version: '1.0'
            };
            
            // Сохраняем в LocalStorage
            const backups = JSON.parse(localStorage.getItem('netequipment_backups') || '[]');
            backups.unshift(backupData);
            
            // Храним только последние 10 бэкапов
            const settings = Storage.getSettings();
            const maxBackups = settings.maxBackups || 10;
            
            if (backups.length > maxBackups) {
                backups.splice(maxBackups);
            }
            
            localStorage.setItem('netequipment_backups', JSON.stringify(backups));
            
            return true;
        } catch (error) {
            console.error('Ошибка при создании резервной копии:', error);
            return false;
        }
    },

    /**
     * Получить список резервных копий
     */
    getBackups() {
        try {
            return JSON.parse(localStorage.getItem('netequipment_backups') || '[]');
        } catch (error) {
            return [];
        }
    },

    /**
     * Восстановить из резервной копии
     */
    restoreFromBackup(backupIndex) {
        try {
            const backups = this.getBackups();
            if (backupIndex < 0 || backupIndex >= backups.length) {
                throw new Error('Неверный индекс резервной копии');
            }
            
            const backup = backups[backupIndex];
            Storage.setEquipment(backup.equipment);
            
            Storage.addLog('restore', `Восстановление из резервной копии от ${backup.backupDate}`, 
                Auth.getCurrentUser()?.username);
            
            return true;
        } catch (error) {
            console.error('Ошибка при восстановлении:', error);
            return false;
        }
    }
};
