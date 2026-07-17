// database.js - Google Apps Script Database Connector
class DatabaseConnector {
    constructor() {
        this.baseUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    async executeQuery(query, params = {}) {
        let attempts = 0;
        
        while (attempts < this.retryAttempts) {
            try {
                const encodedQuery = btoa(JSON.stringify({
                    query: query,
                    params: params,
                    timestamp: Date.now()
                }));

                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Database-Operation': 'query'
                    },
                    body: JSON.stringify({
                        action: 'database_query',
                        data: encodedQuery
                    })
                });

                if (!response.ok) {
                    throw new Error(`Database error: ${response.status}`);
                }

                const result = await response.json();
                return this.decodeResponse(result);
                
            } catch (error) {
                attempts++;
                if (attempts === this.retryAttempts) {
                    throw new Error(`Database connection failed after ${this.retryAttempts} attempts`);
                }
                await this.sleep(this.retryDelay * attempts);
            }
        }
    }

    decodeResponse(response) {
        if (response.data) {
            try {
                response.data = JSON.parse(atob(response.data));
            } catch (e) {
                console.warn('Failed to decode response data');
            }
        }
        return response;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // CRUD Operations
    async create(table, data) {
        return this.executeQuery('INSERT', { table, data });
    }

    async read(table, conditions = {}) {
        return this.executeQuery('SELECT', { table, conditions });
    }

    async update(table, data, conditions) {
        return this.executeQuery('UPDATE', { table, data, conditions });
    }

    async delete(table, conditions) {
        return this.executeQuery('DELETE', { table, conditions });
    }
}

window.db = new DatabaseConnector();
