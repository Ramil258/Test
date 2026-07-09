/**
 * Модуль диаграмм
 * Использует Chart.js для отображения статистики
 */

const Charts = {
    charts: {},

    /**
     * Инициализация модуля
     */
    init() {
        // Модуль инициализируется при необходимости
    },

    /**
     * Отобразить статистику на главной странице
     */
    renderHomeStatistics() {
        const container = document.getElementById('homeContent');
        if (!container) return;
        
        const stats = Equipment.getStatistics();
        
        container.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <div class="icon"><i class="fas fa-server"></i></div>
                        <div class="number">${stats.total}</div>
                        <div class="label">Всего оборудования</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                        <div class="icon"><i class="fas fa-network-wired"></i></div>
                        <div class="number">${stats.byType['DSLAM'] || 0}</div>
                        <div class="label">DSLAM</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
                        <div class="icon"><i class="fas fa-project-diagram"></i></div>
                        <div class="number">${stats.byType['Коммутатор доступа'] || 0}</div>
                        <div class="label">Коммутаторы доступа</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;">
                        <div class="icon"><i class="fas fa-broadcast-tower"></i></div>
                        <div class="number">${stats.byType['OLT'] || 0}</div>
                        <div class="label">OLT</div>
                    </div>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white;">
                        <div class="icon"><i class="fas fa-modem"></i></div>
                        <div class="number">${stats.byType['ONU'] || 0}</div>
                        <div class="label">ONU</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333;">
                        <div class="icon"><i class="fas fa-globe"></i></div>
                        <div class="number">${stats.byType['Маршрутизатор'] || 0}</div>
                        <div class="label">Маршрутизаторы</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333;">
                        <div class="icon"><i class="fas fa-shield-alt"></i></div>
                        <div class="number">${stats.byType['Firewall'] || 0}</div>
                        <div class="label">Firewall</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); color: #333;">
                        <div class="icon"><i class="fas fa-check-circle"></i></div>
                        <div class="number">${stats.byStatus['В работе'] || 0}</div>
                        <div class="label">В работе</div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-chart-pie"></i> Оборудование по типам</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="typeChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-chart-bar"></i> Оборудование по статусам</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-industry"></i> Оборудование по производителям</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="manufacturerChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-map-marker-alt"></i> Оборудование по городам</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="cityChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Отображаем диаграммы после загрузки контента
        setTimeout(() => {
            this.renderTypeChart(stats.byType);
            this.renderStatusChart(stats.byStatus);
            this.renderManufacturerChart(stats.byManufacturer);
            this.renderCityChart(stats.byCity);
        }, 100);
    },

    /**
     * Диаграмма по типам оборудования
     */
    renderTypeChart(data) {
        const ctx = document.getElementById('typeChart');
        if (!ctx) return;
        
        // Уничтожаем предыдущую диаграмму если есть
        if (this.charts.type) {
            this.charts.type.destroy();
        }
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        this.charts.type = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#667eea', '#f093fb', '#4facfe', '#43e97b',
                        '#fa709a', '#a8edea', '#ff9a9e', '#a1c4fd',
                        '#fbc2eb', '#8fd3f4'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    /**
     * Диаграмма по статусам
     */
    renderStatusChart(data) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        if (this.charts.status) {
            this.charts.status.destroy();
        }
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        this.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Количество',
                    data: values,
                    backgroundColor: [
                        '#43e97b', '#fa709a', '#f5576c', '#fee140', '#a8edea'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Диаграмма по производителям
     */
    renderManufacturerChart(data) {
        const ctx = document.getElementById('manufacturerChart');
        if (!ctx) return;
        
        if (this.charts.manufacturer) {
            this.charts.manufacturer.destroy();
        }
        
        // Сортируем и берем топ-10
        const sorted = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const labels = sorted.map(item => item[0]);
        const values = sorted.map(item => item[1]);
        
        this.charts.manufacturer = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#667eea', '#f093fb', '#4facfe', '#43e97b',
                        '#fa709a', '#a8edea', '#ff9a9e', '#a1c4fd',
                        '#fbc2eb', '#8fd3f4'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    /**
     * Диаграмма по городам
     */
    renderCityChart(data) {
        const ctx = document.getElementById('cityChart');
        if (!ctx) return;
        
        if (this.charts.city) {
            this.charts.city.destroy();
        }
        
        // Сортируем и берем топ-10
        const sorted = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const labels = sorted.map(item => item[0]);
        const values = sorted.map(item => item[1]);
        
        this.charts.city = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Количество',
                    data: values,
                    backgroundColor: '#4facfe'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Уничтожить все диаграммы
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
};
