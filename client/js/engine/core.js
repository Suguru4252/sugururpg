/**
 * Rucoy Online Clone - Ядро игры
 * Версия: 1.0.0
 * Модуль: Core Engine
 * Строк: ~800
 */

class RucoyEngine {
    constructor() {
        // Версия
        this.version = '1.0.0';
        
        // Состояние игры
        this.running = false;
        this.paused = false;
        this.debug = false;
        
        // FPS и производительность
        this.fps = 60;
        this.deltaTime = 0;
        this.lastTimestamp = 0;
        this.frameCount = 0;
        this.fpsCounter = 0;
        
        // Компоненты (будут инициализированы позже)
        this.renderer = null;
        this.camera = null;
        this.input = null;
        this.audio = null;
        this.network = null;
        
        // Игровые системы
        this.player = null;
        this.world = null;
        this.monsters = [];
        this.npcs = [];
        this.particles = [];
        this.projectiles = [];
        this.items = [];
        
        // UI системы
        this.ui = {
            hud: null,
            inventory: null,
            skills: null,
            quests: null,
            chat: null,
            settings: null
        };
        
        // События
        this.events = {};
        
        // Таймеры
        this.timers = [];
        this.intervals = [];
        
        // Инициализация
        this.init();
    }
    
    init() {
        console.log(`Rucoy Engine v${this.version} инициализация...`);
        this.setupEventSystem();
        this.setupGameLoop();
    }
    
    setupEventSystem() {
        // Система событий (pub/sub)
        this.events = {
            listeners: {},
            
            on: (event, callback) => {
                if (!this.listeners[event]) this.listeners[event] = [];
                this.listeners[event].push(callback);
            },
            
            off: (event, callback) => {
                if (!this.listeners[event]) return;
                this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
            },
            
            emit: (event, data) => {
                if (!this.listeners[event]) return;
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch(e) {
                        console.error(`Ошибка в событии ${event}:`, e);
                    }
                });
            }
        };
    }
    
    setupGameLoop() {
        // Основной игровой цикл
        this.gameLoop = (timestamp) => {
            if (!this.running) return;
            
            // Вычисляем дельту времени (ограничиваем максимум 0.033 для стабильности)
            this.deltaTime = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
            this.lastTimestamp = timestamp;
            
            // Обновление FPS счетчика
            this.frameCount++;
            if (timestamp - this.fpsCounter >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.fpsCounter = timestamp;
                if (this.debug) console.log(`FPS: ${this.fps}`);
            }
            
            // Обновление всех систем
            this.update(this.deltaTime);
            
            // Рендеринг
            this.render();
            
            // Следующий кадр
            requestAnimationFrame(this.gameLoop);
        };
    }
    
    update(deltaTime) {
        if (this.paused) return;
        
        // Обновление таймеров
        this.updateTimers(deltaTime);
        
        // Обновление игрока
        if (this.player) this.player.update(deltaTime);
        
        // Обновление мира
        if (this.world) this.world.update(deltaTime);
        
        // Обновление монстров
        this.monsters.forEach(monster => monster.update(deltaTime));
        
        // Обновление NPC
        this.npcs.forEach(npc => npc.update(deltaTime));
        
        // Обновление частиц
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.alive;
        });
        
        // Обновление снарядов
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return projectile.alive;
        });
        
        // Обновление камеры
        if (this.camera) this.camera.update(deltaTime);
        
        // Проверка коллизий
        this.checkCollisions();
        
        // Спавн систем
        this.checkSpawns();
    }
    
    render() {
        if (!this.renderer) return;
        
        // Очистка экрана
        this.renderer.clear();
        
        // Рендер мира
        if (this.world) this.world.render(this.renderer, this.camera);
        
        // Рендер предметов на земле
        this.items.forEach(item => item.render(this.renderer, this.camera));
        
        // Рендер NPC
        this.npcs.forEach(npc => npc.render(this.renderer, this.camera));
        
        // Рендер монстров
        this.monsters.forEach(monster => monster.render(this.renderer, this.camera));
        
        // Рендер снарядов
        this.projectiles.forEach(projectile => projectile.render(this.renderer, this.camera));
        
        // Рендер игрока
        if (this.player) this.player.render(this.renderer, this.camera);
        
        // Рендер частиц
        this.particles.forEach(particle => particle.render(this.renderer, this.camera));
        
        // Рендер UI поверх всего
        this.renderUI();
    }
    
    renderUI() {
        // Базовый UI будет рендериться здесь
        // Полноценный UI будет в отдельном модуле
        if (this.debug) {
            this.renderer.ctx.fillStyle = '#ffffff';
            this.renderer.ctx.font = '12px monospace';
            this.renderer.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
            this.renderer.ctx.fillText(`Delta: ${this.deltaTime.toFixed(4)}`, 10, 35);
            if (this.player) {
                this.renderer.ctx.fillText(`Pos: ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`, 10, 50);
            }
        }
    }
    
    updateTimers(deltaTime) {
        // Обновление таймеров
        for (let i = 0; i < this.timers.length; i++) {
            const timer = this.timers[i];
            timer.time -= deltaTime;
            if (timer.time <= 0) {
                timer.callback();
                this.timers.splice(i, 1);
                i--;
            }
        }
    }
    
    checkCollisions() {
        if (!this.player || !this.world) return;
        
        // Коллизия игрока с монстрами
        for (const monster of this.monsters) {
            if (!monster.alive) continue;
            
            const dx = this.player.x - monster.x;
            const dy = this.player.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionDistance = (this.player.size + monster.size) / 2;
            
            if (distance < collisionDistance) {
                // Отталкивание
                const angle = Math.atan2(dy, dx);
                const overlap = collisionDistance - distance;
                const pushX = Math.cos(angle) * overlap;
                const pushY = Math.sin(angle) * overlap;
                
                this.player.x += pushX;
                this.player.y += pushY;
                monster.x -= pushX;
                monster.y -= pushY;
                
                // Триггер события столкновения
                this.events.emit('playerCollision', { monster, damage: true });
            }
        }
        
        // Коллизия с предметами
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                // Подбор предмета
                this.player.inventory.addItem(item);
                this.items.splice(i, 1);
                i--;
                this.events.emit('itemPicked', item);
            }
        }
    }
    
    checkSpawns() {
        // Автоматический спавн монстров
        if (this.monsters.length < 50 && Math.random() < 0.01) {
            this.spawnRandomMonster();
        }
    }
    
    spawnRandomMonster() {
        // Будет реализовано в monsterManager
        this.events.emit('spawnMonster');
    }
    
    setTimeout(callback, delay) {
        this.timers.push({
            time: delay / 1000,
            callback: callback
        });
    }
    
    setInterval(callback, interval) {
        const intervalId = setInterval(callback, interval);
        this.intervals.push(intervalId);
        return intervalId;
    }
    
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        requestAnimationFrame(this.gameLoop);
        this.events.emit('gameStart');
        console.log('Игра запущена');
    }
    
    stop() {
        this.running = false;
        this.events.emit('gameStop');
        console.log('Игра остановлена');
    }
    
    pause() {
        this.paused = true;
        this.events.emit('gamePaused');
    }
    
    resume() {
        this.paused = false;
        this.events.emit('gameResumed');
    }
    
    destroy() {
        this.stop();
        this.intervals.forEach(clearInterval);
        this.timers = [];
        this.intervals = [];
        this.events.listeners = {};
        console.log('Игровой движок уничтожен');
    }
}

// Экспорт для использования
window.RucoyEngine = RucoyEngine;
