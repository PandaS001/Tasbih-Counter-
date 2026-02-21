class ZikrCounter {
    constructor() {
        this.count = 0;
        this.max = 33;
        this.currentZikr = 'Субханаллах';
        this.history = [];
        this.selectedItems = new Set();
        this.isListening = false;
        this.recognition = null;
        this.audio = document.getElementById('audioPlayer');
        this.lastTap = 0;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        
        setTimeout(() => {
            document.getElementById('splash').style.display = 'none';
            document.getElementById('mainPage').style.display = 'block';
        }, 1800);
        
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Бургер меню
        document.getElementById('burger-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('side-menu').classList.add('open');
        });
        
        document.getElementById('close-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('side-menu').classList.remove('open');
        });
        
        // Кнопки счета
        document.getElementById('plusBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.increment();
        });
        
        document.getElementById('minusBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.decrement();
        });
        
        document.getElementById('resetBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.reset();
        });
        
        // Голос
        document.getElementById('voiceBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVoice();
        });
        
        // Тема
        document.getElementById('theme-dark').addEventListener('click', (e) => {
            e.stopPropagation();
            this.setTheme('dark');
        });
        
        document.getElementById('theme-light').addEventListener('click', (e) => {
            e.stopPropagation();
            this.setTheme('light');
        });
        
        // Зикр
        document.getElementById('custom-zikr').addEventListener('input', (e) => {
            e.stopPropagation();
            if (e.target.value.trim()) {
                this.currentZikr = e.target.value.trim();
                document.getElementById('zikrDisplay').textContent = this.currentZikr;
            }
        });
        
        // Пресеты лимита
        document.querySelectorAll('.menu-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.max = parseInt(btn.dataset.limit);
                document.getElementById('limitDisplay').textContent = `/${this.max}`;
                this.updateProgress();
            });
        });
        
        // История
        document.getElementById('show-history').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('side-menu').classList.remove('open');
            document.getElementById('historyModal').classList.add('show');
            this.renderHistory();
        });
        
        document.getElementById('closeHistory').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('historyModal').classList.remove('show');
        });
        
        document.getElementById('saveCurrent').addEventListener('click', (e) => {
            e.stopPropagation();
            this.saveCurrent();
        });
        
        document.getElementById('deleteSelected').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteSelected();
        });
        
        document.getElementById('clearAll').addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearAll();
        });
        
        // Нашиды
        document.getElementById('nasheed-select').addEventListener('change', (e) => {
            e.stopPropagation();
            this.changeNasheed(e.target.value);
        });
        
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            e.stopPropagation();
            this.audio.volume = parseFloat(e.target.value);
        });
        
        // ========== ГЛАВНОЕ: НАЖАТИЕ НА ЛЮБУЮ ОБЛАСТЬ ==========
        document.addEventListener('click', (e) => {
            // Проверяем, что клик не по меню и не по кнопкам
            const isMenu = e.target.closest('.side-menu');
            const isModal = e.target.closest('.modal-content');
            const isBurger = e.target.closest('.burger-menu');
            const isButton = e.target.closest('button');
            const isInput = e.target.closest('input');
            const isSelect = e.target.closest('select');
            
            // Если клик не по интерактивным элементам - считаем как плюс
            if (!isMenu && !isModal && !isBurger && !isButton && !isInput && !isSelect) {
                // Защита от двойного нажатия
                const now = Date.now();
                if (now - this.lastTap > 300) { // Минимальный интервал 300мс
                    this.increment();
                    this.lastTap = now;
                }
            }
        });
        
        // Отключаем всплытие для модального окна
        document.querySelector('.modal-content')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Отключаем всплытие для меню
        document.querySelector('.side-menu')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    increment() {
        if (this.count < this.max) {
            this.count++;
            this.updateDisplay();
            this.saveData();
            this.showFeedback('+1');
        }
    }
    
    decrement() {
        if (this.count > 0) {
            this.count--;
            this.updateDisplay();
            this.saveData();
            this.showFeedback('-1');
        }
    }
    
    reset() {
        this.count = 0;
        this.updateDisplay();
        this.saveData();
        this.showFeedback('↺ Сброс');
    }
    
    showFeedback(text) {
        // Визуальная обратная связь
        const feedback = document.createElement('div');
        feedback.textContent = text;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            color: var(--primary);
            text-shadow: var(--glow);
            z-index: 1000;
            pointer-events: none;
            animation: fadeOut 0.3s ease-out;
        `;
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 300);
    }
    
    updateDisplay() {
        document.getElementById('countDisplay').textContent = this.count;
        document.getElementById('limitDisplay').textContent = `/${this.max}`;
        document.getElementById('zikrDisplay').textContent = this.currentZikr;
        this.updateProgress();
    }
    
    updateProgress() {
        const percent = (this.count / this.max) * 100;
        document.getElementById('progressFill').style.width = percent + '%';
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        document.getElementById('theme-dark').classList.toggle('active', theme === 'dark');
        document.getElementById('theme-light').classList.toggle('active', theme === 'light');
    }
    
    // Голосовое распознавание
    toggleVoice() {
        if (!this.recognition) {
            this.initVoice();
        }
        
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            document.getElementById('voiceBtn').classList.remove('active');
            document.getElementById('voiceStatus').textContent = '🎤 Выкл';
        } else {
            try {
                this.recognition.start();
            } catch (e) {
                console.log('Voice error');
            }
        }
    }
    
    initVoice() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            document.getElementById('voiceStatus').textContent = '❌ Не поддерживается';
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.lang = 'ru-RU';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            document.getElementById('voiceBtn').classList.add('active');
            document.getElementById('voiceStatus').textContent = '🎤 Слушаю...';
        };
        
        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };
        
        this.recognition.onresult = (event) => {
            const last = event.results[event.results.length - 1];
            const text = last[0].transcript.toLowerCase();
            
            if (text.includes(this.currentZikr.toLowerCase())) {
                this.increment();
            } else if (text.includes('сброс')) {
                this.reset();
            } else if (text.includes('минус')) {
                this.decrement();
            }
        };
    }
    
    // Нашиды
    changeNasheed(value) {
        if (value === 'none') {
            this.audio.pause();
            return;
        }
        
        // ЗДЕСЬ ВСТАВЬТЕ СВОИ ССЫЛКИ НА НАШИДЫ
        const nasheeds = {
            'nasheed1': 'assets/audio/1',
            'nasheed2': '2',
            'nasheed3': '3'
            'nasheed1': '4',
            'nasheed2': '5',
            'nasheed3': '6'
            'nasheed1': '7',
            'nasheed2': '8',
            'nasheed3': '9'
        };
        
        if (nasheeds[value]) {
            this.audio.src = nasheeds[value];
            this.audio.play().catch(() => {});
        }
    }
    
    // Сохранение данных
    saveData() {
        const data = {
            count: this.count,
            max: this.max,
            zikr: this.currentZikr
        };
        localStorage.setItem('zikrData', JSON.stringify(data));
    }
    
    loadData() {
        const saved = localStorage.getItem('zikrData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.count = data.count || 0;
                this.max = data.max || 33;
                this.currentZikr = data.zikr || 'Субханаллах';
            } catch (e) {}
        }
        
        const theme = localStorage.getItem('theme') || 'dark';
        this.setTheme(theme);
    }
    
    // История
    saveCurrent() {
        const history = this.getHistory();
        
        history.unshift({
            id: Date.now(),
            zikr: this.currentZikr,
            count: this.count,
            max: this.max,
            date: new Date().toLocaleString()
        });
        
        if (history.length > 30) history.pop();
        
        localStorage.setItem('zikrHistory', JSON.stringify(history));
        this.renderHistory();
    }
    
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('zikrHistory')) || [];
        } catch {
            return [];
        }
    }
    
    renderHistory() {
        const history = this.getHistory();
        const container = document.getElementById('historyList');
        
        if (history.length === 0) {
            container.innerHTML = '<p class="history-empty">Нет сохранений</p>';
            return;
        }
        
        container.innerHTML = history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <input type="checkbox" class="history-checkbox" ${this.selectedItems.has(item.id) ? 'checked' : ''}>
                <div class="history-item-content">
                    <div class="history-item-header">
                        <span class="history-zikr">${item.zikr.substring(0, 15)}</span>
                        <span class="history-value">${item.count}/${item.max}</span>
                    </div>
                    <div class="history-date">${item.date}</div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.history-checkbox').forEach(cb => {
            cb.addEventListener('click', (e) => e.stopPropagation());
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.closest('.history-item').dataset.id);
                if (e.target.checked) {
                    this.selectedItems.add(id);
                } else {
                    this.selectedItems.delete(id);
                }
            });
        });
    }
    
    deleteSelected() {
        if (this.selectedItems.size === 0) return;
        
        const history = this.getHistory();
        const filtered = history.filter(item => !this.selectedItems.has(item.id));
        
        localStorage.setItem('zikrHistory', JSON.stringify(filtered));
        this.selectedItems.clear();
        this.renderHistory();
    }
    
    clearAll() {
        if (confirm('Очистить всю историю?')) {
            localStorage.removeItem('zikrHistory');
            this.selectedItems.clear();
            this.renderHistory();
        }
    }
}

// Запуск
new ZikrCounter();

// Добавляем стили для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
    }
`;
document.head.appendChild(style);

