class AutoClicker {
    constructor() {
        this.isRunning = false;
        this.clickCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.clickInterval = null;
        this.cpsUpdateInterval = null;
        this.cpsHistory = [];
        this.easterEggClickCount = 0;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateUI();
        this.initEasterEgg();
    }

    initializeElements() {
        // Основные элементы
        this.actionBtn = document.getElementById('actionBtn');
        this.intervalSlider = document.getElementById('intervalSlider');
        this.intervalDisplay = document.getElementById('intervalDisplay');
        this.clickCountEl = document.getElementById('clickCount');
        this.timerEl = document.getElementById('timer');
        this.cpsEl = document.getElementById('cps');
        this.testArea = document.getElementById('testArea');
        this.clickRipple = document.getElementById('clickRipple');
        this.notification = document.getElementById('notification');
        this.limitControl = document.getElementById('limitControl');
        
        // Кнопки
        this.mouseButtons = document.querySelectorAll('.mouse-btn');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        
        // Радио кнопки
        this.clickModes = document.querySelectorAll('input[name="clickMode"]');
        this.clickTypes = document.querySelectorAll('input[name="clickType"]');
        
        // Инпуты
        this.clickLimit = document.getElementById('clickLimit');
        
        // Пасхалка
        this.easterEgg = document.getElementById('easterEgg');
        this.easterTrigger = document.getElementById('easterTrigger');
    }

    attachEventListeners() {
        // Кнопка старт/стоп
        this.actionBtn.addEventListener('click', () => this.toggleClicker());
        
        // Слайдер интервала
        this.intervalSlider.addEventListener('input', (e) => {
            this.intervalDisplay.textContent = e.target.value;
        });
        
        // Пресеты интервала
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                this.intervalSlider.value = value;
                this.intervalDisplay.textContent = value;
                this.showNotification(`Интервал установлен: ${value}мс`);
            });
        });
        
        // Кнопки мыши
        this.mouseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.mouseButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showNotification(`Выбрана: ${btn.textContent} кнопка`);
            });
        });
        
        // Режим кликов
        this.clickModes.forEach(mode => {
            mode.addEventListener('change', () => {
                if (mode.value === 'limited') {
                    this.limitControl.style.display = 'flex';
                } else {
                    this.limitControl.style.display = 'none';
                }
            });
        });
        
        // Тестовая область
        this.testArea.addEventListener('click', (e) => {
            this.simulateClick(e);
            if (!this.isRunning) {
                this.clickCount++;
                this.updateStats();
            }
        });
        
        // Touch события для мобильных
        this.testArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.simulateClick(e);
        });
    }

    toggleClicker() {
        if (this.isRunning) {
            this.stopClicker();
        } else {
            this.startClicker();
        }
    }

    startClicker() {
        if (this.isRunning) return;
        
        const mode = document.querySelector('input[name="clickMode"]:checked').value;
        const clickType = document.querySelector('input[name="clickType"]:checked').value;
        const interval = parseInt(this.intervalSlider.value);
        
        if (mode === 'limited') {
            const limit = parseInt(this.clickLimit.value);
            if (this.clickCount >= limit) {
                this.clickCount = 0;
            }
        }
        
        this.isRunning = true;
        this.startTime = Date.now() - (this.clickCount * interval);
        
        // Обновляем UI
        this.actionBtn.classList.add('active');
        this.actionBtn.querySelector('.btn-text').textContent = 'Остановить';
        this.actionBtn.querySelector('.btn-icon').textContent = '⏸';
        
        this.showNotification('Автокликер запущен!');
        
        // Запускаем клики
        this.clickInterval = setInterval(() => {
            const currentMode = document.querySelector('input[name="clickMode"]:checked').value;
            const currentLimit = parseInt(this.clickLimit.value);
            
            if (currentMode === 'limited' && this.clickCount >= currentLimit) {
                this.stopClicker();
                this.showNotification('Достигнут лимит кликов');
                return;
            }
            
            this.performClick(clickType);
        }, interval);
        
        // Обновляем CPS
        this.cpsUpdateInterval = setInterval(() => this.updateCPS(), 1000);
        
        // Запускаем таймер
        this.timerInterval = setInterval(() => this.updateTimer(), 10);
    }

    stopClicker() {
        this.isRunning = false;
        
        // Очищаем интервалы
        clearInterval(this.clickInterval);
        clearInterval(this.timerInterval);
        clearInterval(this.cpsUpdateInterval);
        
        // Обновляем UI
        this.actionBtn.classList.remove('active');
        this.actionBtn.querySelector('.btn-text').textContent = 'Запустить';
        this.actionBtn.querySelector('.btn-icon').textContent = '▶';
        
        this.showNotification('Автокликер остановлен');
    }

    performClick(clickType) {
        this.clickCount++;
        
        // Симулируем клик в тестовой области
        this.simulateClick();
        
        // Для двойного клика
        if (clickType === 'double') {
            setTimeout(() => {
                this.simulateClick();
            }, 50);
        }
        
        this.updateStats();
        
        // Добавляем в историю CPS
        this.cpsHistory.push(Date.now());
        this.cpsHistory = this.cpsHistory.filter(time => Date.now() - time < 1000);
    }

    simulateClick(e) {
        // Создаем ripple эффект
        this.clickRipple.classList.remove('active');
        void this.clickRipple.offsetWidth;
        this.clickRipple.classList.add('active');
        
        // Анимируем тестовую область
        this.testArea.style.transform = 'scale(0.99)';
        setTimeout(() => {
            this.testArea.style.transform = 'scale(1)';
        }, 100);
        
        // Вибрация на мобильных (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    updateStats() {
        this.clickCountEl.textContent = this.clickCount;
    }

    updateTimer() {
        if (!this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const milliseconds = Math.floor((elapsed % 1000) / 10);
        
        this.timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }

    updateCPS() {
        const now = Date.now();
        this.cpsHistory = this.cpsHistory.filter(time => now - time < 1000);
        const cps = (this.cpsHistory.length).toFixed(1);
        this.cpsEl.textContent = cps;
    }

    updateUI() {
        // Обновляем интервал
        this.intervalDisplay.textContent = this.intervalSlider.value;
    }

    // ===== ПАСХАЛКА =====
    initEasterEgg() {
        // Счетчик кликов по триггеру
        let clickCount = 0;
        
        // Активация по клику на невидимую кнопку
        this.easterTrigger.addEventListener('click', () => {
            clickCount++;
            
            if (clickCount === 1) {
                this.showNotification('🤔 Что-то тут есть...');
            } else if (clickCount === 2) {
                this.showNotification('👀 Еще немного...');
            } else if (clickCount === 3) {
                this.showNotification('🔍 Почти...');
            } else if (clickCount >= 5) {
                this.showEasterEgg();
                this.showNotification('🎉 Секрет найден!');
                
                // Сбрасываем счетчик
                clickCount = 0;
            }
        });
        
        // Активация по комбинации клавиш (для ПК)
        let keysPressed = {};
        
        document.addEventListener('keydown', (e) => {
            keysPressed[e.key.toLowerCase()] = true;
            
            // Комбинация: В + А + Н + Я
            if (keysPressed['в'] && keysPressed['а'] && keysPressed['н'] && keysPressed['я']) {
                this.showEasterEgg();
                this.showNotification('🎉 Пасхалка активирована!');
                
                // Очищаем нажатые клавиши
                keysPressed = {};
            }
            
            // Альтернативная комбинация: D + E + X + T + E + R
            if (keysPressed['d'] && keysPressed['e'] && keysPressed['x'] && keysPressed['t'] && keysPressed['e'] && keysPressed['r']) {
                this.showEasterEgg();
                this.showNotification('🎉 Dexter mode activated!');
                keysPressed = {};
            }
        });
        
        document.addEventListener('keyup', (e) => {
            delete keysPressed[e.key.toLowerCase()];
        });
        
        // Активация по свайпу (для мобильных)
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!touchStartY) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchEndY - touchStartY;
            
            // Свайп вверх в нижней части экрана
            if (deltaY < -50 && window.innerHeight - touchStartY < 200) {
                this.showEasterEgg();
                this.showNotification('🎉 Секретный свайп!');
            }
            
            touchStartY = 0;
        });
    }
    
    showEasterEgg() {
        // Показываем пасхалку
        this.easterEgg.classList.add('visible');
        
        // Создаем конфетти эффект
        this.createConfetti();
        
        // Воспроизводим звук (если есть)
        // this.playSecretSound();
        
        // Через 5 секунд прячем
        setTimeout(() => {
            this.easterEgg.classList.remove('visible');
        }, 5000);
    }
    
    createConfetti() {
        // Создаем конфетти из emoji
        const emojis = ['⚡', '🎮', '💻', '🖱️', '🎯', '⭐', '👾', '🤫', '🔍'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-20px';
                confetti.style.fontSize = (Math.random() * 20 + 20) + 'px';
                confetti.style.zIndex = '10000';
                confetti.style.pointerEvents = 'none';
                confetti.style.animation = `float ${Math.random() * 3 + 2}s linear forwards`;
                confetti.style.opacity = Math.random() * 0.8 + 0.2;
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 50);
        }
    }

    showNotification(message) {
        this.notification.textContent = message;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 2000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new AutoClicker();
});

// Prevent zoom on double tap для мобильных
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Добавляем стиль для анимации конфетти
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
