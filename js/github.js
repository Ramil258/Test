/**
 * Модуль для работы с GitHub API
 * Хранит данные в комментариях issue
 */

const GitHubStorage = {
    // Конфигурация
    config: {
        owner: 'Ramil258',
        repo: 'Test',
        issueNumber: 1,
        token: null // Будет запрошен у пользователя
    },

    // Ключи для хранения в комментариях
    DATA_KEYS: {
        USERS: 'USERS',
        EQUIPMENT: 'EQUIPMENT',
        LOGS: 'LOGS',
        SETTINGS: 'SETTINGS'
    },

    /**
     * Инициализация модуля
     */
    async init() {
        // Пытаемся получить токен из localStorage
        const savedToken = localStorage.getItem('github_token');
        if (savedToken) {
            this.config.token = savedToken;
        }
    },

    /**
     * Установить токен
     */
    setToken(token) {
        this.config.token = token;
        if (token) {
            localStorage.setItem('github_token', token);
        } else {
            localStorage.removeItem('github_token');
        }
    },

    /**
     * Проверить наличие токена
     */
    hasToken() {
        return !!this.config.token;
    },

    /**
     * Получить заголовки для запросов
     */
    getHeaders() {
        return {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    },

    /**
     * Получить все комментарии issue
     */
    async getComments() {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues/${this.config.issueNumber}/comments`,
                { headers: this.getHeaders() }
            );
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении комментариев:', error);
            return [];
        }
    },

    /**
     * Найти комментарий с данными по ключу
     */
    findCommentByKey(comments, key) {
        return comments.find(comment => {
            const body = comment.body.trim();
            return body.startsWith(`### ${key}`);
        });
    },

    /**
     * Извлечь данные из комментария
     */
    extractDataFromComment(comment) {
        try {
            const lines = comment.body.split('\n');
            const dataLine = lines.find(line => line.startsWith('```json'));
            if (!dataLine) return null;
            
            const startIndex = lines.indexOf(dataLine) + 1;
            const endIndex = lines.findIndex((line, index) => 
                index > startIndex && line.startsWith('```')
            );
            
            const jsonLines = lines.slice(startIndex, endIndex);
            const jsonString = jsonLines.join('\n');
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Ошибка при извлечении данных:', error);
            return null;
        }
    },

    /**
     * Создать формат комментария с данными
     */
    createCommentBody(key, data) {
        return `### ${key}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    },

    /**
     * Получить данные по ключу
     */
    async get(key) {
        try {
            const comments = await this.getComments();
            const comment = this.findCommentByKey(comments, key);
            
            if (comment) {
                return this.extractDataFromComment(comment);
            }
            
            return null;
        } catch (error) {
            console.error(`Ошибка при получении данных ${key}:`, error);
            return null;
        }
    },

    /**
     * Сохранить данные по ключу
     */
    async set(key, data) {
        try {
            const comments = await this.getComments();
            const existingComment = this.findCommentByKey(comments, key);
            
            const commentBody = this.createCommentBody(key, data);
            
            if (existingComment) {
                // Обновляем существующий комментарий
                const response = await fetch(
                    `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues/comments/${existingComment.id}`,
                    {
                        method: 'PATCH',
                        headers: this.getHeaders(),
                        body: JSON.stringify({ body: commentBody })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Ошибка обновления: ${response.status}`);
                }
            } else {
                // Создаем новый комментарий
                const response = await fetch(
                    `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues/${this.config.issueNumber}/comments`,
                    {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify({ body: commentBody })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Ошибка создания: ${response.status}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Ошибка при сохранении данных ${key}:`, error);
            return false;
        }
    },

    /**
     * Удалить данные по ключу
     */
    async remove(key) {
        try {
            const comments = await this.getComments();
            const comment = this.findCommentByKey(comments, key);
            
            if (comment) {
                const response = await fetch(
                    `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues/comments/${comment.id}`,
                    {
                        method: 'DELETE',
                        headers: this.getHeaders()
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Ошибка удаления: ${response.status}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Ошибка при удалении данных ${key}:`, error);
            return false;
        }
    }
};
