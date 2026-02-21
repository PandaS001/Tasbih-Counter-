const CONFIG = {
    musicEnabled: true,
    defaultPreset: 33,
    storageKey: 'islamicCounter',
    historyKey: 'counterHistory'
};

class IslamicCounter {
    constructor() {
        this.count = 0;
        this.max = 33;
        this.currentZikr = 'Субханаллах';
        this.history = [];
        this.musicPlaying = false;
        this.audio = document.getElementById('bgMusic');
        this.selectedHistoryItems = new Set();
        
        // Голосовые свойства
        this.recognition = null;
        this.isListening = false;
        this.speechSupported = false;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupTheme();
        this.updateDisplay();
        this.renderHistory();
        this.initVoiceRecognition();
        
        setTimeout(() => {
            document.querySelector('.splash-screen').style.display = 'none';
            document.querySelector('.main-page').style.display = 'block';
        }, 2000);
    }
    
    initVoiceRecognition() {
        // Проверяем поддержку Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'ru-RU';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI(true);
                this.showNotification('Голосовой счет активирован', '#00ff9d');
            };
            
            this.recognition.onend = () => {
                if (this.isListening) {
                    // Автоматически перезапускаем, если все еще должно слушать
                    this.recognition.start();
                } else {
                    this.updateVoiceUI(false);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.showNotification('Доступ к микрофону запрещен', '#ff4d4d');
                    this.isListening = false;
                    this.updateVoiceUI(false);
                } else if (event.error === 'no-speech') {
                    // Игнорируем ошибку отсутствия речи
                } else {
                    this.showNotification(`Ошибка: ${event.error}`, '#ff4d4d');
                }
            };
            
            this.recognition.onresult = (event) => {
                const lastResult = event.results[event.results.length - 1];
                if (lastResult.isFinal) {
                    const transcript = lastResult[0].transcript.trim().toLowerCase();
                    this.processVoiceCommand(transcript);
                }
            };
            
            this.speechSupported = true;
            document.getElementById('voice-status').textContent = 'Микрофон доступен';
        } else {
            this.speechSupported = false;
            document.getElementById('voice-btn').disabled = true;
            document.getElementById('voice-btn').style.opacity = '0.5';
            document.getElementById('voice-status').textContent = 'Голосовое управление не поддерживается';
        }
    }
    
    processVoiceCommand(transcript) {
        console.log('Распознано:', transcript);
        
        // Нормализуем текст (убираем знаки препинания, лишние пробелы)
        const normalized = transcript.toLowerCase()
            .replace(/[.,!?;:]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Проверяем, содержит ли распознанный текст текущий зикр
        const currentZikrLower = this.currentZikr.toLowerCase();
        
        if (normalized.includes(currentZikrLower)) {
            // Нашли зикр - увеличиваем счет
            this.increment();
            
            // Показываем, что распознали
            this.showNotification(`✓ ${this.currentZikr}`, '#00ff9d');
        } else {
            // Проверяем команды
            if (normalized.includes('сброс') || normalized.includes('обнули')) {
                this.reset();
                this.showNotification('Сброс по голосу', '#ff9900');
            } else if (normalized.includes('сохранить')) {
                this.saveToHistory();
                this.showNotification('Сохранено по голосу', '#00ffff');
            } else if (normalized.includes('минус') || normalized.includes('убрать')) {
                this.decrement();
                this.showNotification('-1 по голосу', '#ff4d4d');
            } else if (normalized.includes('лимит 33')) {
                this.max = 33;
                this.reset();
                this.showNotification('Лимит 33', '#00ffff');
            } else if (normalized.includes('лимит 66')) {
                this.max = 66;
                this.reset();
                this.showNotification('Лимит 66', '#00ffff');
            } else if (normalized.includes('лимит 99')) {
                this.max = 99;
                this.reset();
                this.showNotification('Лимит 99', '#00ffff');
            } else if (normalized.includes('лимит 100')) {
                this.max = 100;
                this.reset();
                this.showNotification('Лимит 100', '#00ffff');
            } else if (normalized.includes('лимит 1000')) {
                this.max = 1000;
                this.reset();
                this.showNotification('Лимит 1000', '#00ffff');
            }
        }
    }
    
    toggleVoiceRecognition() {
        if (!this.speechSupported) {
            this.showNotification('Голосовое управление не поддерживается', '#ff4d4d');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceUI(false);
            this.showNotification('Голосовой счет выключен', '#ff4d4d');
        } else {
            // Запрашиваем разрешение на микрофон
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Failed to start recognition:', error);
                this.showNotification('Ошибка запуска микрофона', '#ff4d4d');
            }
        }
    }
    
    updateVoiceUI(isActive) {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceIcon = document.getElementById('voice-icon');
        const voiceStatus = document.getElementById('voice-status');
        
        if (isActive) {
            voiceBtn.classList.add('active');
            voiceIcon.textContent = '🎤✨';
            voiceStatus.textContent = 'Слушаю... Говорите зикры';
            voiceStatus.classList.add('active');
        } else {
            voiceBtn.classList.remove('active');
            voiceIcon.textContent = '🎤';
            voiceStatus.textContent = 'Микрофон выключен';
            voiceStatus.classList.remove('active');
        }
    }
    
    setupEventListeners() {
        document.getElementById('increment-btn').addEventListener('click', () => this.increment());
        document.getElementById('decrement-btn').addEventListener('click', () => this.decrement());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoiceRecognition());
        
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.max = parseInt(e.target.dataset.preset);
                this.reset();
                this.showNotification(`Лимит установлен: ${this.max}`, '#00ffff');
            });
        });
        
        document.getElementById('zikr-select').addEventListener('change', (e) => {
            this.currentZikr = e.target.value;
            document.getElementById('counter-name-display').textContent = this.currentZikr;
            this.showNotification(`Зикр: ${this.currentZikr}`, '#00ffff');
        });
        
        document.getElementById('save-btn').addEventListener('click', () => this.saveToHistory());
        document.getElementById('load-btn').addEventListener('click', () => this.loadFromHistory());
        
        document.getElementById('select-all-btn').addEventListener('click', () => this.toggleSelectAll());
        document.getElementById('delete-selected-btn').addEventListener('click', () => this.deleteSelected());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        
        document.getElementById('theme-dark').addEventListener('click', () => this.setTheme('dark'));
        document.getElementById('theme-light').addEventListener('click', () => this.setTheme('light'));
        
        document.getElementById('music-control').addEventListener('click', () => this.toggleMusic());
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(console.error);
        }
        
        setInterval(() => this.saveToStorage(), 30000);
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        document.getElementById('theme-dark').classList.toggle('active', theme === 'dark');
        document.getElementById('theme-light').classList.toggle('active', theme === 'light');
    }
    
    increment() {
        if (this.count < this.max) {
            this.count++;
            this.updateDisplay();
            
            if (this.count === this.max) {
                this.showNotification('Лимит достигнут!', '#ff9900');
            }
        }
    }
    
    decrement() {
        if (this.count > 0) {
            this.count--;
            this.updateDisplay();
        }
    }
    
    reset() {
        this.count = 0;
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('counter-value').textContent = this.count;
        document.getElementById('counter-max').textContent = `/${this.max}`;
        
        const percentage = (this.count / this.max) * 100;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
    }
    
    saveToStorage() {
        const data = {
            count: this.count,
            max: this.max,
            zikr: this.currentZikr,
            timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.count = data.count || 0;
                this.max = data.max || 33;
                this.currentZikr = data.zikr || 'Субханаллах';
                
                document.getElementById('zikr-select').value = this.currentZikr;
                document.getElementById('counter-name-display').textContent = this.currentZikr;
            } catch (e) {
                console.error('Error loading from storage');
            }
        }
    }
    
    saveToHistory() {
        const history = this.getHistory();
        
        const record = {
            id: Date.now(),
            zikr: this.currentZikr,
            count: this.count,
            max: this.max,
            date: new Date().toLocaleString()
        };
        
        history.unshift(record);
        if (history.length > 50) history.pop();
        
        localStorage.setItem(CONFIG.historyKey, JSON.stringify(history));
        this.renderHistory();
        this.showNotification('Сохранено в историю', '#00ff9d');
    }
    
    loadFromHistory() {
        const history = this.getHistory();
        if (history.length > 0) {
            const lastRecord = history[0];
            this.count = lastRecord.count;
            this.max = lastRecord.max;
            this.currentZikr = lastRecord.zikr;
            
            document.getElementById('zikr-select').value = this.currentZikr;
            document.getElementById('counter-name-display').textContent = this.currentZikr;
            this.updateDisplay();
            this.showNotification('Загружено последнее сохранение', '#00ffff');
        }
    }
    
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(CONFIG.historyKey)) || [];
        } catch {
            return [];
        }
    }
    
    renderHistory() {
        const history = this.getHistory();
        const container = document.getElementById('history-list');
        
        if (history.length === 0) {
            container.innerHTML = '<p class="history-empty">Нет сохраненных записей</p>';
            return;
        }
        
        container.innerHTML = history.map(record => {
            const isSelected = this.selectedHistoryItems.has(record.id);
            return `
                <div class="history-item" data-id="${record.id}">
                    <input type="checkbox" class="history-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="history-content">
                        <div class="history-item-header">
                            <span class="history-zikr">${record.zikr}</span>
                            <span class="history-value">${record.count}/${record.max}</span>
                        </div>
                        <div class="history-date">${record.date}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.history-checkbox').forEach((checkbox, index) => {
            const item = checkbox.closest('.history-item');
            const recordId = parseInt(item.dataset.id);
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedHistoryItems.add(recordId);
                } else {
                    this.selectedHistoryItems.delete(recordId);
                }
            });
            
            item.querySelector('.history-content').addEventListener('click', () => {
                this.loadSpecificHistory(recordId);
            });
        });
    }
    
    loadSpecificHistory(id) {
        const history = this.getHistory();
        const record = history.find(r => r.id === id);
        
        if (record) {
            this.count = record.count;
            this.max = record.max;
            this.currentZikr = record.zikr;
            
            document.getElementById('zikr-select').value = this.currentZikr;
            document.getElementById('counter-name-display').textContent = this.currentZikr;
            this.updateDisplay();
            this.showNotification('Запись загружена', '#00ffff');
        }
    }
    
    toggleSelectAll() {
        const history = this.getHistory();
        const checkboxes = document.querySelectorAll('.history-checkbox');
        
        if (this.selectedHistoryItems.size === history.length) {
            this.selectedHistoryItems.clear();
            checkboxes.forEach(cb => cb.checked = false);
            this.showNotification('Все записи отменены', '#ff9900');
        } else {
            history.forEach(record => this.selectedHistoryItems.add(record.id));
            checkboxes.forEach(cb => cb.checked = true);
            this.showNotification(`Выбрано ${history.length} записей`, '#00ffff');
        }
    }
    
    deleteSelected() {
        if (this.selectedHistoryItems.size === 0) {
            this.showNotification('Нет выбранных записей', '#ff4d4d');
            return;
        }
        
        if (confirm(`Удалить ${this.selectedHistoryItems.size} выбранных записей?`)) {
            const history = this.getHistory();
            const filteredHistory = history.filter(record => !this.selectedHistoryItems.has(record.id));
            
            localStorage.setItem(CONFIG.historyKey, JSON.stringify(filteredHistory));
            this.selectedHistoryItems.clear();
            this.renderHistory();
            this.showNotification(`Удалено ${history.length - filteredHistory.length} записей`, '#ff4d4d');
        }
    }
    
    clearHistory() {
        if (confirm('Очистить всю историю сохранений?')) {
            localStorage.removeItem(CONFIG.historyKey);
            this.selectedHistoryItems.clear();
            this.renderHistory();
            this.showNotification('История очищена', '#ff4d4d');
        }
    }
    
    toggleMusic() {
        if (!this.audio) return;
        
        if (this.musicPlaying) {
            this.audio.pause();
            document.querySelector('.music-icon').textContent = '🎵';
            this.showNotification('Музыка выключена', '#ff4d4d');
        } else {
            this.audio.play().catch(() => {
                this.showNotification('Нажмите на страницу для музыки', '#ff9900');
            });
            document.querySelector('.music-icon').textContent = '🔊';
            this.showNotification('Музыка включена', '#00ff9d');
        }
        
        this.musicPlaying = !this.musicPlaying;
    }
    
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.borderColor = color;
        notification.style.color = color;
        notification.style.boxShadow = `0 0 20px ${color}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
}

const counter = new IslamicCounter();