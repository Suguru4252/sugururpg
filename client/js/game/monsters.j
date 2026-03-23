/**
 * Rucoy Online Clone - Система монстров
 * Версия: 1.0.0
 * Модуль: Monsters Database & AI
 * Строк: ~1200
 */

// База данных всех монстров
const MONSTER_DB = {
    // Лесные монстры (уровни 1-10)
    goblin: {
        id: 'goblin',
        name: 'Гоблин',
        level: 1,
        hp: 45,
        maxHp: 45,
        attack: 16,
        defense: 3,
        exp: 35,
        gold: { min: 5, max: 15 },
        size: 32,
        speed: 80,
        aggroRange: 150,
        attackRange: 40,
        attackCooldown: 1.0,
        drops: [
            { item: 'small_health_potion', chance: 0.1, min: 1, max: 1 },
            { item: 'cloth', chance: 0.3, min: 1, max: 2 },
            { item: 'wooden_sword', chance: 0.05, min: 1, max: 1 }
        ],
        spawnZones: ['forest', 'plains'],
        color: '#6b8c42',
        sprite: 'goblin'
    },
    
    wolf: {
        id: 'wolf',
        name: 'Волк',
        level: 2,
        hp: 55,
        maxHp: 55,
        attack: 20,
        defense: 4,
        exp: 45,
        gold: { min: 8, max: 20 },
        size: 34,
        speed: 120,
        aggroRange: 180,
        attackRange: 35,
        attackCooldown: 0.9,
        drops: [
            { item: 'wolf_fur', chance: 0.4, min: 1, max: 2 },
            { item: 'leather', chance: 0.2, min: 1, max: 1 }
        ],
        spawnZones: ['forest', 'mountains'],
        color: '#8a8a6a',
        sprite: 'wolf'
    },
    
    skeleton: {
        id: 'skeleton',
        name: 'Скелет',
        level: 3,
        hp: 75,
        maxHp: 75,
        attack: 24,
        defense: 6,
        exp: 60,
        gold: { min: 10, max: 25 },
        size: 36,
        speed: 90,
        aggroRange: 160,
        attackRange: 40,
        attackCooldown: 1.1,
        drops: [
            { item: 'bone', chance: 0.5, min: 1, max: 3 },
            { item: 'iron_sword', chance: 0.08, min: 1, max: 1 },
            { item: 'small_health_potion', chance: 0.15, min: 1, max: 1 }
        ],
        spawnZones: ['dungeon', 'graveyard'],
        color: '#bdb28c',
        sprite: 'skeleton'
    },
    
    orc: {
        id: 'orc',
        name: 'Орк',
        level: 4,
        hp: 110,
        maxHp: 110,
        attack: 28,
        defense: 8,
        exp: 95,
        gold: { min: 15, max: 35 },
        size: 40,
        speed: 85,
        aggroRange: 170,
        attackRange: 42,
        attackCooldown: 1.2,
        drops: [
            { item: 'orc_tooth', chance: 0.4, min: 1, max: 2 },
            { item: 'iron_armor', chance: 0.05, min: 1, max: 1 },
            { item: 'medium_health_potion', chance: 0.1, min: 1, max: 1 }
        ],
        spawnZones: ['mountains', 'cave'],
        color: '#7a6a4a',
        sprite: 'orc'
    },
    
    // Подземелья (уровни 5-15)
    minotaur: {
        id: 'minotaur',
        name: 'Минотавр',
        level: 6,
        hp: 180,
        maxHp: 180,
        attack: 38,
        defense: 12,
        exp: 150,
        gold: { min: 25, max: 50 },
        size: 44,
        speed: 100,
        aggroRange: 200,
        attackRange: 45,
        attackCooldown: 1.3,
        drops: [
            { item: 'minotaur_horn', chance: 0.3, min: 1, max: 1 },
            { item: 'steel_sword', chance: 0.1, min: 1, max: 1 },
            { item: 'large_health_potion', chance: 0.12, min: 1, max: 1 }
        ],
        spawnZones: ['dungeon', 'labyrinth'],
        color: '#9b5e2c',
        sprite: 'minotaur'
    },
    
    ghost: {
        id: 'ghost',
        name: 'Призрак',
        level: 7,
        hp: 95,
        maxHp: 95,
        attack: 32,
        defense: 5,
        exp: 120,
        gold: { min: 20, max: 40 },
        size: 34,
        speed: 110,
        aggroRange: 190,
        attackRange: 38,
        attackCooldown: 1.0,
        drops: [
            { item: 'ectoplasm', chance: 0.4, min: 1, max: 2 },
            { item: 'magic_essence', chance: 0.2, min: 1, max: 1 }
        ],
        spawnZones: ['graveyard', 'dungeon'],
        color: '#aaccee',
        sprite: 'ghost'
    },
    
    // Пустыня (уровни 8-18)
    mummy: {
        id: 'mummy',
        name: 'Мумия',
        level: 8,
        hp: 140,
        maxHp: 140,
        attack: 35,
        defense: 10,
        exp: 135,
        gold: { min: 30, max: 55 },
        size: 38,
        speed: 75,
        aggroRange: 160,
        attackRange: 40,
        attackCooldown: 1.2,
        drops: [
            { item: 'bandage', chance: 0.5, min: 1, max: 3 },
            { item: 'golden_ring', chance: 0.03, min: 1, max: 1 }
        ],
        spawnZones: ['desert', 'tomb'],
        color: '#c9b86a',
        sprite: 'mummy'
    },
    
    scorpion: {
        id: 'scorpion',
        name: 'Скорпион',
        level: 9,
        hp: 125,
        maxHp: 125,
        attack: 40,
        defense: 9,
        exp: 140,
        gold: { min: 28, max: 48 },
        size: 36,
        speed: 105,
        aggroRange: 175,
        attackRange: 35,
        attackCooldown: 1.0,
        drops: [
            { item: 'scorpion_tail', chance: 0.35, min: 1, max: 1 },
            { item: 'poison_antidote', chance: 0.15, min: 1, max: 1 }
        ],
        spawnZones: ['desert'],
        color: '#aa8844',
        sprite: 'scorpion'
    },
    
    // Горы (уровни 10-20)
    troll: {
        id: 'troll',
        name: 'Тролль',
        level: 10,
        hp: 220,
        maxHp: 220,
        attack: 42,
        defense: 15,
        exp: 200,
        gold: { min: 40, max: 70 },
        size: 46,
        speed: 70,
        aggroRange: 170,
        attackRange: 48,
        attackCooldown: 1.4,
        drops: [
            { item: 'troll_skin', chance: 0.4, min: 1, max: 2 },
            { item: 'giant_axe', chance: 0.06, min: 1, max: 1 }
        ],
        spawnZones: ['mountains', 'cave'],
        color: '#6a8c5a',
        sprite: 'troll'
    },
    
    // Боссы
    dragon: {
        id: 'dragon',
        name: 'Дракон',
        level: 20,
        hp: 850,
        maxHp: 850,
        attack: 85,
        defense: 35,
        exp: 800,
        gold: { min: 200, max: 400 },
        size: 64,
        speed: 90,
        aggroRange: 300,
        attackRange: 60,
        attackCooldown: 1.8,
        isBoss: true,
        drops: [
            { item: 'dragon_scale', chance: 0.8, min: 1, max: 3 },
            { item: 'dragon_heart', chance: 0.5, min: 1, max: 1 },
            { item: 'dragon_sword', chance: 0.15, min: 1, max: 1 },
            { item: 'dragon_armor', chance: 0.1, min: 1, max: 1 }
        ],
        spawnZones: ['volcano', 'dragon_lair'],
        color: '#aa4a2a',
        sprite: 'dragon'
    },
    
    demon: {
        id: 'demon',
        name: 'Демон',
        level: 25,
        hp: 1200,
        maxHp: 1200,
        attack: 110,
        defense: 45,
        exp: 1200,
        gold: { min: 300, max: 600 },
        size: 60,
        speed: 100,
        aggroRange: 320,
        attackRange: 55,
        attackCooldown: 1.6,
        isBoss: true,
        drops: [
            { item: 'demon_blood', chance: 0.7, min: 1, max: 2 },
            { item: 'demon_sword', chance: 0.12, min: 1, max: 1 },
            { item: 'demon_armor', chance: 0.08, min: 1, max: 1 }
        ],
        spawnZones: ['hell', 'dungeon'],
        color: '#aa4444',
        sprite: 'demon'
    },
    
    // Элитные монстры
    elite_orc: {
        id: 'elite_orc',
        name: 'Элитный Орк',
        level: 12,
        hp: 280,
        maxHp: 280,
        attack: 52,
        defense: 18,
        exp: 350,
        gold: { min: 60, max: 100 },
        size: 44,
        speed: 90,
        aggroRange: 220,
        attackRange: 45,
        attackCooldown: 1.3,
        isElite: true,
        drops: [
            { item: 'elite_token', chance: 0.5, min: 1, max: 1 },
            { item: 'steel_armor', chance: 0.15, min: 1, max: 1 },
            { item: 'large_health_potion', chance: 0.2, min: 1, max: 2 }
        ],
        spawnZones: ['mountains'],
        color: '#aa6a4a',
        sprite: 'elite_orc'
    }
};

// Класс монстра
class Monster {
    constructor(type, x, y) {
        const data = MONSTER_DB[type];
        if (!data) throw new Error(`Unknown monster type: ${type}`);
        
        // Базовая информация
        this.id = data.id;
        this.type = type;
        this.name = data.name;
        this.level = data.level;
        
        // Статы
        this.maxHp = data.hp;
        this.hp = data.hp;
        this.attack = data.attack;
        this.defense = data.defense;
        this.exp = data.exp;
        
        // Позиция
        this.x = x;
        this.y = y;
        this.size = data.size;
        this.speed = data.speed;
        
        // AI параметры
        this.aggroRange = data.aggroRange;
        this.attackRange = data.attackRange;
        this.attackCooldown = data.attackCooldown;
        this.lastAttackTime = 0;
        
        // Состояние
        this.alive = true;
        this.aggroTarget = null;
        this.moveTarget = null;
        
        // Анимация
        this.animationFrame = 0;
        this.direction = 'down';
        
        // Визуал
        this.color = data.color;
        this.sprite = data.sprite;
        
        // Дроп
        this.drops = data.drops;
        this.gold = data.gold;
        
        // Флаги
        this.isBoss = data.isBoss || false;
        this.isElite = data.isElite || false;
        
        // Движение
        this.moving = false;
        this.targetX = x;
        this.targetY = y;
        this.moveProgress = 1;
        
        // Таймеры
        this.respawnTimer = null;
        
        console.log(`Монстр ${this.name} создан на (${this.x}, ${this.y})`);
    }
    
    update(deltaTime, player) {
        if (!this.alive) return;
        
        // Обновление движения
        this.updateMovement(deltaTime);
        
        // AI: проверка агро
        this.updateAI(deltaTime, player);
        
        // Анимация
        this.animationFrame += deltaTime * 5;
        if (this.animationFrame > Math.PI * 2) this.animationFrame -= Math.PI * 2;
    }
    
    updateMovement(deltaTime) {
        if (this.moveTarget) {
            const dx = this.moveTarget.x - this.x;
            const dy = this.moveTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.moveTarget = null;
                return;
            }
            
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * this.speed * deltaTime;
            const moveY = Math.sin(angle) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }
    }
    
    updateAI(deltaTime, player) {
        if (!player || player.hp <= 0) return;
        
        // Расчет расстояния до игрока
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Агро
        if (distance < this.aggroRange) {
            this.aggroTarget = player;
        }
        
        // Преследование
        if (this.aggroTarget && this.aggroTarget.hp > 0) {
            if (distance > this.attackRange) {
                // Движение к игроку
                const angle = Math.atan2(dy, dx);
                this.moveTarget = {
                    x: this.x + Math.cos(angle) * 100,
                    y: this.y + Math.sin(angle) * 100
                };
            } else {
                // В радиусе атаки
                this.moveTarget = null;
                this.attackPlayer(player);
            }
        } else {
            // Сброс агро
            this.aggroTarget = null;
            this.moveTarget = null;
        }
    }
    
    attackPlayer(player) {
        const now = Date.now() / 1000;
        if (now - this.lastAttackTime >= this.attackCooldown) {
            // Расчет урона
            let damage = this.attack - player.totalDefense * 0.4;
            damage += (Math.random() - 0.5) * 12;
            damage = Math.max(3, Math.floor(damage));
            
            // Нанесение урона
            player.takeDamage(damage, this);
            
            this.lastAttackTime = now;
            
            // Эффект атаки (визуальный)
            if (window.gameEngine) {
                window.gameEngine.events.emit('monsterAttack', {
                    monster: this,
                    target: player,
                    damage: damage
                });
            }
        }
    }
    
    takeDamage(damage, source) {
        const actualDamage = Math.max(1, Math.floor(damage - this.defense * 0.5));
        this.hp -= actualDamage;
        
        // Агро на атакующего
        if (source instanceof Player) {
            this.aggroTarget = source;
        }
        
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return {
            damage: actualDamage,
            died: this.hp <= 0,
            remainingHp: Math.max(0, this.hp)
        };
    }
    
    die(killer) {
        this.alive = false;
        this.hp = 0;
        
        // Начисление опыта и дропа
        if (killer instanceof Player) {
            killer.addExp(this.exp);
            
            // Дроп золота
            const goldAmount = Math.floor(
                this.gold.min + Math.random() * (this.gold.max - this.gold.min)
            );
            killer.gold += goldAmount;
            
            // Дроп предметов
            const drops = this.getDrops();
            drops.forEach(drop => {
                killer.inventory.addItem(drop);
            });
            
            // Событие смерти
            if (window.gameEngine) {
                window.gameEngine.events.emit('monsterDeath', {
                    monster: this,
                    killer: killer,
                    exp: this.exp,
                    gold: goldAmount,
                    drops: drops
                });
            }
        }
        
        console.log(`${this.name} погиб!`);
        
        // Запуск таймера респавна
        this.startRespawnTimer();
    }
    
    getDrops() {
        const drops = [];
        
        // Дроп предметов
        for (const drop of this.drops) {
            if (Math.random() < drop.chance) {
                const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
                drops.push({
                    id: drop.item,
                    count: count,
                    name: this.getItemName(drop.item),
                    stackable: true
                });
            }
        }
        
        return drops;
    }
    
    getItemName(itemId) {
        // Временная заглушка
        const itemNames = {
            'small_health_potion': 'Малая целебная настойка',
            'medium_health_potion': 'Средняя целебная настойка',
            'large_health_potion': 'Большая целебная настойка',
            'wooden_sword': 'Деревянный меч',
            'iron_sword': 'Железный меч',
            'steel_sword': 'Стальной меч',
            'iron_armor': 'Железная броня',
            'leather': 'Кожа',
            'cloth': 'Ткань',
            'bone': 'Кость',
            'wolf_fur': 'Волчий мех',
            'orc_tooth': 'Клык орка',
            'minotaur_horn': 'Рог минотавра',
            'dragon_scale': 'Чешуя дракона'
        };
        
        return itemNames[itemId] || itemId;
    }
    
    startRespawnTimer() {
        const respawnTime = this.isBoss ? 300 : 30; // 5 минут для босса, 30 сек для обычных
        
        setTimeout(() => {
            this.respawn();
        }, respawnTime * 1000);
    }
    
    respawn() {
        this.hp = this.maxHp;
        this.alive = true;
        this.aggroTarget = null;
        this.moveTarget = null;
        
        // Случайная позиция в радиусе 100 пикселей от оригинальной
        this.x += (Math.random() - 0.5) * 100;
        this.y += (Math.random() - 0.5) * 100;
        this.targetX = this.x;
        this.targetY = this.y;
        
        console.log(`${this.name} возродился!`);
        
        if (window.gameEngine) {
            window.gameEngine.events.emit('monsterRespawn', { monster: this });
        }
    }
    
    render(renderer, camera) {
        if (!this.alive) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Тень
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(screenX + this.size/2, screenY + this.size - 4, this.size/3, 6, 0, 0, Math.PI*2);
        renderer.ctx.fill();
        
        // Тело (с анимацией покачивания)
        const bobY = Math.sin(this.animationFrame) * 2;
        
        renderer.ctx.fillStyle = this.color;
        renderer.ctx.fillRect(screenX + 4, screenY + 4 + bobY, this.size - 8, this.size - 8);
        
        // Глаза
        renderer.ctx.fillStyle = '#000000';
        renderer.ctx.fillRect(screenX + this.size/2 - 8, screenY + this.size/2 - 4 + bobY, 5, 5);
        renderer.ctx.fillRect(screenX + this.size/2 + 3, screenY + this.size/2 - 4 + bobY, 5, 5);
        
        // Агро индикатор (красные глаза)
        if (this.aggroTarget) {
            renderer.ctx.fillStyle = '#ff4444';
            renderer.ctx.fillRect(screenX + this.size/2 - 8, screenY + this.size/2 - 4 + bobY, 5, 5);
            renderer.ctx.fillRect(screenX + this.size/2 + 3, screenY + this.size/2 - 4 + bobY, 5, 5);
        }
        
        // HP бар
        const hpPercent = this.hp / this.maxHp;
        renderer.drawHealthBar(
            screenX + 4, screenY - 8,
            this.size - 8, 5,
            this.hp, this.maxHp,
            '#d44a4a'
        );
        
        // Имя монстра
        renderer.ctx.font = 'bold 10px monospace';
        renderer.ctx.fillStyle = this.isBoss ? '#ffaa66' : (this.isElite ? '#ff9966' : '#ffffff');
        renderer.ctx.shadowBlur = 2;
        renderer.ctx.shadowColor = '#000000';
        renderer.ctx.fillText(this.name, screenX + this.size/2 - 20, screenY - 3);
        renderer.ctx.shadowBlur = 0;
        
        // Уровень
        renderer.ctx.font = '8px monospace';
        renderer.ctx.fillStyle = '#cccccc';
        renderer.ctx.fillText(`Lv.${this.level}`, screenX + this.size/2 - 12, screenY + this.size - 2);
        
        // Эффект для боссов
        if (this.isBoss) {
            renderer.ctx.strokeStyle = '#ffaa44';
            renderer.ctx.lineWidth = 2;
            renderer.ctx.strokeRect(screenX + 2, screenY + 2, this.size - 4, this.size - 4);
        }
    }
}

// Менеджер монстров
class MonsterManager {
    constructor() {
        this.monsters = [];
        this.spawnPoints = [];
        this.maxMonsters = 100;
    }
    
    generateSpawnPoints(worldWidth, worldHeight) {
        // Генерация точек спавна по зонам
        const zones = {
            forest: { count: 30, monsters: ['goblin', 'wolf'] },
            plains: { count: 20, monsters: ['goblin'] },
            mountains: { count: 20, monsters: ['orc', 'troll', 'elite_orc'] },
            desert: { count: 15, monsters: ['mummy', 'scorpion'] },
            dungeon: { count: 25, monsters: ['skeleton', 'ghost', 'minotaur'] },
            graveyard: { count: 15, monsters: ['skeleton', 'ghost'] },
            volcano: { count: 5, monsters: ['dragon'] }
        };
        
        for (const [zone, data] of Object.entries(zones)) {
            for (let i = 0; i < data.count; i++) {
                const x = Math.random() * worldWidth;
                const y = Math.random() * worldHeight;
                const monsterType = data.monsters[Math.floor(Math.random() * data.monsters.length)];
                
                this.spawnPoints.push({
                    x: x,
                    y: y,
                    zone: zone,
                    monsterType: monsterType
                });
            }
        }
    }
    
    spawnMonsters() {
        for (const point of this.spawnPoints) {
            const monster = new Monster(point.monsterType, point.x, point.y);
            this.monsters.push(monster);
        }
        
        console.log(`Спавнено ${this.monsters.length} монстров`);
    }
    
    update(deltaTime, player) {
        for (const monster of this.monsters) {
            monster.update(deltaTime, player);
        }
    }
    
    render(renderer, camera) {
        for (const monster of this.monsters) {
            monster.render(renderer, camera);
        }
    }
    
    getMonsterAt(x, y, radius = 30) {
        for (const monster of this.monsters) {
            if (!monster.alive) continue;
            
            const dx = Math.abs(monster.x - x);
            const dy = Math.abs(monster.y - y);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < radius) {
                return monster;
            }
        }
        return null;
    }
    
    getAllAlive() {
        return this.monsters.filter(m => m.alive);
    }
    
    getMonstersInRange(x, y, radius) {
        return this.monsters.filter(monster => {
            if (!monster.alive) return false;
            const dx = monster.x - x;
            const dy = monster.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
    }
}

window.Monster = Monster;
window.MonsterManager = MonsterManager;
window.MONSTER_DB = MONSTER_DB;
