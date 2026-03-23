/**
 * Rucoy Online Clone - Система навыков
 * Версия: 1.0.0
 * Модуль: Skills & Abilities System
 * Строк: ~1100
 */

// База данных навыков
const SKILLS_DB = {
    // ========== РЫЦАРЬ ==========
    // Базовые навыки
    power_strike: {
        id: 'power_strike',
        name: 'Мощный Удар',
        class: 'knight',
        level: 1,
        manaCost: 15,
        cooldown: 4,
        range: 40,
        type: 'melee',
        description: 'Наносит усиленный урон одной цели',
        damage: (player) => player.totalAttack * 1.8,
        effect: null,
        icon: '⚡',
        animation: 'slash'
    },
    
    whirlwind: {
        id: 'whirlwind',
        name: 'Вихрь',
        class: 'knight',
        level: 5,
        manaCost: 25,
        cooldown: 8,
        radius: 80,
        type: 'aoe',
        description: 'Вращающаяся атака по всем врагам вокруг',
        damage: (player) => player.totalAttack * 1.4,
        effect: null,
        icon: '🌀',
        animation: 'whirlwind'
    },
    
    shield_bash: {
        id: 'shield_bash',
        name: 'Удар Щитом',
        class: 'knight',
        level: 10,
        manaCost: 20,
        cooldown: 6,
        range: 40,
        type: 'melee',
        description: 'Оглушает врага на 2 секунды',
        damage: (player) => player.totalAttack * 1.2,
        effect: (target) => {
            target.addDebuff({
                type: 'stun',
                duration: 2,
                value: 1,
                name: 'Оглушение'
            });
        },
        icon: '🛡️',
        animation: 'bash'
    },
    
    battle_cry: {
        id: 'battle_cry',
        name: 'Боевой Клич',
        class: 'knight',
        level: 15,
        manaCost: 30,
        cooldown: 20,
        radius: 120,
        type: 'buff',
        description: 'Увеличивает атаку союзников на 20% на 10 секунд',
        damage: null,
        effect: (player, targets) => {
            targets.forEach(target => {
                target.addBuff({
                    type: 'damage',
                    value: 1.2,
                    duration: 10,
                    name: 'Боевой Клич'
                });
            });
        },
        icon: '📢',
        animation: 'cry'
    },
    
    revenge: {
        id: 'revenge',
        name: 'Возмездие',
        class: 'knight',
        level: 20,
        manaCost: 35,
        cooldown: 12,
        range: 40,
        type: 'melee',
        description: 'Наносит урон, увеличенный за каждые 10% потерянного HP',
        damage: (player) => {
            const lostPercent = 1 - (player.hp / player.maxHp);
            return player.totalAttack * (1.2 + lostPercent);
        },
        icon: '⚔️',
        animation: 'slash'
    },
    
    // ========== ЛУЧНИК ==========
    quick_shot: {
        id: 'quick_shot',
        name: 'Быстрый Выстрел',
        class: 'archer',
        level: 1,
        manaCost: 12,
        cooldown: 2,
        range: 180,
        type: 'ranged',
        description: 'Быстрая атака с низкой задержкой',
        damage: (player) => player.totalAttack * 1.1,
        icon: '🏹',
        animation: 'arrow'
    },
    
    multi_shot: {
        id: 'multi_shot',
        name: 'Множественный Выстрел',
        class: 'archer',
        level: 5,
        manaCost: 28,
        cooldown: 6,
        radius: 100,
        type: 'aoe',
        description: 'Выпускает 3 стрелы по разным врагам',
        damage: (player) => player.totalAttack * 0.9,
        arrows: 3,
        icon: '🎯',
        animation: 'multi_arrow'
    },
    
    piercing_arrow: {
        id: 'piercing_arrow',
        name: 'Пронзающая Стрела',
        class: 'archer',
        level: 10,
        manaCost: 22,
        cooldown: 5,
        range: 200,
        type: 'ranged',
        description: 'Стрела, проходящая сквозь врагов',
        damage: (player) => player.totalAttack * 1.4,
        pierce: true,
        icon: '➡️',
        animation: 'pierce'
    },
    
    poison_arrow: {
        id: 'poison_arrow',
        name: 'Отравленная Стрела',
        class: 'archer',
        level: 15,
        manaCost: 25,
        cooldown: 8,
        range: 180,
        type: 'ranged',
        description: 'Отравляет врага, нанося урон в течение времени',
        damage: (player) => player.totalAttack * 1.0,
        effect: (target) => {
            target.addDebuff({
                type: 'poison',
                duration: 6,
                tick: 0.5,
                damage: target.maxHp * 0.02,
                name: 'Отравление'
            });
        },
        icon: '☠️',
        animation: 'poison'
    },
    
    hawk_eye: {
        id: 'hawk_eye',
        name: 'Глаз Ястреба',
        class: 'archer',
        level: 20,
        manaCost: 20,
        cooldown: 15,
        radius: 200,
        type: 'buff',
        description: 'Увеличивает дальность атаки и шанс крита на 15%',
        effect: (player) => {
            player.addBuff({
                type: 'range',
                value: 1.3,
                duration: 12,
                name: 'Глаз Ястреба'
            });
            player.addBuff({
                type: 'crit',
                value: 0.15,
                duration: 12,
                name: 'Глаз Ястреба'
            });
        },
        icon: '🦅',
        animation: 'buff'
    },
    
    // ========== МАГ ==========
    fireball: {
        id: 'fireball',
        name: 'Огненный Шар',
        class: 'mage',
        level: 1,
        manaCost: 20,
        cooldown: 4,
        radius: 70,
        type: 'aoe',
        description: 'Взрывной огненный шар, наносящий урон по площади',
        damage: (player) => player.totalAttack * 1.6,
        element: 'fire',
        icon: '🔥',
        animation: 'fireball'
    },
    
    ice_bolt: {
        id: 'ice_bolt',
        name: 'Ледяная Стрела',
        class: 'mage',
        level: 5,
        manaCost: 18,
        cooldown: 5,
        range: 150,
        type: 'ranged',
        description: 'Замораживает врага на 1.5 секунды',
        damage: (player) => player.totalAttack * 1.3,
        effect: (target) => {
            target.addDebuff({
                type: 'slow',
                value: 0.5,
                duration: 2.5,
                name: 'Заморозка'
            });
        },
        element: 'ice',
        icon: '❄️',
        animation: 'ice'
    },
    
    lightning: {
        id: 'lightning',
        name: 'Молния',
        class: 'mage',
        level: 10,
        manaCost: 30,
        cooldown: 7,
        range: 200,
        type: 'ranged',
        description: 'Молниеносный удар, имеющий шанс оглушить',
        damage: (player) => player.totalAttack * 1.9,
        effect: (target) => {
            if (Math.random() < 0.3) {
                target.addDebuff({
                    type: 'stun',
                    duration: 1,
                    value: 1,
                    name: 'Оглушение'
                });
            }
        },
        element: 'lightning',
        icon: '⚡',
        animation: 'lightning'
    },
    
    magic_shield: {
        id: 'magic_shield',
        name: 'Магический Щит',
        class: 'mage',
        level: 15,
        manaCost: 40,
        cooldown: 25,
        type: 'buff',
        description: 'Создает щит, поглощающий 200 урона',
        effect: (player) => {
            player.addBuff({
                type: 'shield',
                value: 200,
                duration: 10,
                name: 'Магический Щит'
            });
        },
        icon: '🛡️',
        animation: 'shield'
    },
    
    meteor: {
        id: 'meteor',
        name: 'Метеоритный Дождь',
        class: 'mage',
        level: 25,
        manaCost: 60,
        cooldown: 20,
        radius: 150,
        type: 'aoe',
        description: 'Призывает метеориты, наносящие огромный урон по области',
        damage: (player) => player.totalAttack * 2.5,
        element: 'fire',
        icon: '☄️',
        animation: 'meteor'
    },
    
    // ========== ОБЩИЕ НАВЫКИ ==========
    heal: {
        id: 'heal',
        name: 'Лечение',
        class: 'all',
        level: 1,
        manaCost: 20,
        cooldown: 8,
        type: 'self',
        description: 'Восстанавливает 40% максимального HP',
        heal: (player) => player.maxHp * 0.4,
        icon: '💚',
        animation: 'heal'
    },
    
    meditation: {
        id: 'meditation',
        name: 'Медитация',
        class: 'all',
        level: 5,
        manaCost: 0,
        cooldown: 30,
        type: 'self',
        description: 'Быстро восстанавливает ману в течение 5 секунд',
        effect: (player) => {
            player.addBuff({
                type: 'mana_regen',
                value: player.maxMp * 0.1,
                duration: 5,
                tick: 1,
                name: 'Медитация'
            });
        },
        icon: '🧘',
        animation: 'meditate'
    },
    
    dash: {
        id: 'dash',
        name: 'Рывок',
        class: 'all',
        level: 10,
        manaCost: 15,
        cooldown: 12,
        type: 'movement',
        description: 'Быстрый рывок в выбранном направлении',
        range: 150,
        icon: '💨',
        animation: 'dash'
    }
};

// Класс навыка
class Skill {
    constructor(skillId) {
        const data = SKILLS_DB[skillId];
        if (!data) throw new Error(`Unknown skill: ${skillId}`);
        
        this.id = skillId;
        this.name = data.name;
        this.class = data.class;
        this.level = data.level;
        this.manaCost = data.manaCost;
        this.cooldown = data.cooldown;
        this.range = data.range;
        this.radius = data.radius;
        this.type = data.type;
        this.description = data.description;
        this.icon = data.icon;
        this.animation = data.animation;
        
        // Функции
        this.damageFunc = data.damage;
        this.healFunc = data.heal;
        this.effectFunc = data.effect;
        
        // Специальные атрибуты
        this.element = data.element;
        this.pierce = data.pierce;
        this.arrows = data.arrows;
        
        // Состояние
        this.currentCooldown = 0;
        this.isOnCooldown = false;
    }
    
    update(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown <= 0) {
                this.currentCooldown = 0;
                this.isOnCooldown = false;
            }
        }
    }
    
    canUse(player) {
        // Проверка уровня
        if (player.level < this.level) {
            return { success: false, reason: `Требуется ${this.level} уровень` };
        }
        
        // Проверка класса
        if (this.class !== 'all' && player.class !== this.class) {
            return { success: false, reason: 'Недоступно для вашего класса' };
        }
        
        // Проверка кулдауна
        if (this.isOnCooldown) {
            return { success: false, reason: `Перезарядка: ${this.currentCooldown.toFixed(1)} сек` };
        }
        
        // Проверка маны
        if (player.mp < this.manaCost) {
            return { success: false, reason: `Недостаточно маны (${this.manaCost})` };
        }
        
        return { success: true };
    }
    
    use(player, target = null, position = null) {
        const check = this.canUse(player);
        if (!check.success) return check;
        
        // Затраты маны
        player.mp -= this.manaCost;
        
        // Установка кулдауна
        this.currentCooldown = this.cooldown;
        this.isOnCooldown = true;
        
        let result = {
            success: true,
            skill: this.name,
            targets: []
        };
        
        // Применение эффекта в зависимости от типа
        if (this.type === 'self' || this.type === 'buff') {
            // Бафф на себя
            if (this.healFunc) {
                const healAmount = this.healFunc(player);
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                result.heal = healAmount;
                result.message = `Вы восстановили ${Math.floor(healAmount)} HP`;
            }
            
            if (this.effectFunc) {
                this.effectFunc(player, [player]);
                result.message = `Вы использовали ${this.name}`;
            }
        } 
        else if (this.type === 'melee' || this.type === 'ranged') {
            // Одиночная атака
            if (target && target.alive !== false) {
                let damage = this.damageFunc ? this.damageFunc(player) : 0;
                damage = Math.floor(damage);
                
                const damageResult = target.takeDamage(damage, player);
                result.targets.push({
                    target: target,
                    damage: damage,
                    died: damageResult.died
                });
                
                if (this.effectFunc) {
                    this.effectFunc(target);
                }
                
                result.message = `${this.name} нанес ${damage} урона ${target.name}`;
            }
        }
        else if (this.type === 'aoe') {
            // Площадная атака
            const targets = this.getTargetsInRange(player, position);
            
            for (const t of targets) {
                let damage = this.damageFunc ? this.damageFunc(player) : 0;
                damage = Math.floor(damage);
                
                const damageResult = t.takeDamage(damage, player);
                result.targets.push({
                    target: t,
                    damage: damage,
                    died: damageResult.died
                });
            }
            
            if (this.effectFunc) {
                this.effectFunc(player, targets);
            }
            
            result.message = `${this.name} поразил ${result.targets.length} целей`;
        }
        
        return result;
    }
    
    getTargetsInRange(player, position) {
        // Получение всех монстров в радиусе
        const centerX = position ? position.x : player.x;
        const centerY = position ? position.y : player.y;
        
        if (!window.gameEngine || !window.gameEngine.monsters) return [];
        
        return window.gameEngine.monsters.filter(monster => {
            if (!monster.alive) return false;
            const dx = monster.x - centerX;
            const dy = monster.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= (this.radius || this.range);
        });
    }
}

// Менеджер навыков игрока
class SkillManager {
    constructor(player) {
        this.player = player;
        this.skills = new Map();
        this.skillBar = [];
        this.skillPoints = 0;
        this.availableSkills = [];
        
        this.initSkills();
    }
    
    initSkills() {
        // Добавление базовых навыков в зависимости от класса
        for (const [skillId, skillData] of Object.entries(SKILLS_DB)) {
            if (skillData.class === 'all' || skillData.class === this.player.class) {
                const skill = new Skill(skillId);
                this.skills.set(skillId, skill);
                
                // Добавление в список доступных
                if (skillData.level <= this.player.level) {
                    this.availableSkills.push(skillId);
                }
            }
        }
        
        // Настройка панели навыков (1-9 клавиши)
        this.setupSkillBar();
    }
    
    setupSkillBar() {
        // Базовые навыки на панели
        const defaultSkills = {
            knight: ['power_strike', 'whirlwind', 'shield_bash', 'heal', 'meditation'],
            archer: ['quick_shot', 'multi_shot', 'piercing_arrow', 'heal', 'meditation'],
            mage: ['fireball', 'ice_bolt', 'lightning', 'heal', 'meditation']
        };
        
        const skills = defaultSkills[this.player.class] || [];
        this.skillBar = skills.map(skillId => this.skills.get(skillId)).filter(s => s);
    }
    
    update(deltaTime) {
        for (const skill of this.skills.values()) {
            skill.update(deltaTime);
        }
    }
    
    useSkill(slot, target = null, position = null) {
        if (slot < 0 || slot >= this.skillBar.length) {
            return { success: false, reason: 'Неверный слот' };
        }
        
        const skill = this.skillBar[slot];
        if (!skill) {
            return { success: false, reason: 'Навык не установлен' };
        }
        
        const result = skill.use(this.player, target, position);
        
        // Событие использования навыка
        if (window.gameEngine && result.success) {
            window.gameEngine.events.emit('skillUsed', {
                player: this.player,
                skill: skill,
                result: result
            });
        }
        
        return result;
    }
    
    useSkillById(skillId, target = null, position = null) {
        const skill = this.skills.get(skillId);
        if (!skill) {
            return { success: false, reason: 'Навык не найден' };
        }
        
        return skill.use(this.player, target, position);
    }
    
    learnSkill(skillId) {
        const skillData = SKILLS_DB[skillId];
        if (!skillData) return { success: false, reason: 'Навык не существует' };
        
        // Проверка уровня
        if (this.player.level < skillData.level) {
            return { success: false, reason: `Требуется ${skillData.level} уровень` };
        }
        
        // Проверка класса
        if (skillData.class !== 'all' && this.player.class !== skillData.class) {
            return { success: false, reason: 'Недоступно для вашего класса' };
        }
        
        // Проверка очков навыков
        if (this.skillPoints <= 0) {
            return { success: false, reason: 'Нет очков навыков' };
        }
        
        // Проверка, не выучен ли уже
        if (this.skills.has(skillId)) {
            return { success: false, reason: 'Навык уже изучен' };
        }
        
        // Изучение
        const skill = new Skill(skillId);
        this.skills.set(skillId, skill);
        this.availableSkills.push(skillId);
        this.skillPoints--;
        
        return { success: true, skill: skill.name };
    }
    
    getSkillCooldown(skillId) {
        const skill = this.skills.get(skillId);
        return skill ? skill.currentCooldown : 0;
    }
    
    getSkillBarCooldowns() {
        return this.skillBar.map(skill => skill ? skill.currentCooldown : 0);
    }
    
    addSkillPoint() {
        this.skillPoints++;
    }
    
    resetSkills() {
        // Сброс всех навыков
        this.skills.clear();
        this.availableSkills = [];
        this.initSkills();
    }
    
    getAvailableSkills() {
        return this.availableSkills.map(id => ({
            id: id,
            name: SKILLS_DB[id].name,
            level: SKILLS_DB[id].level,
            description: SKILLS_DB[id].description,
            icon: SKILLS_DB[id].icon
        }));
    }
    
    renderSkillBar(ctx, x, y, width, height) {
        const slotWidth = 48;
        const slotHeight = 48;
        const spacing = 8;
        
        for (let i = 0; i < this.skillBar.length; i++) {
            const skill = this.skillBar[i];
            const slotX = x + i * (slotWidth + spacing);
            const slotY = y;
            
            // Рамка слота
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(slotX, slotY, slotWidth, slotHeight);
            ctx.strokeStyle = '#ffd966';
            ctx.lineWidth = 1;
            ctx.strokeRect(slotX, slotY, slotWidth, slotHeight);
            
            if (skill) {
                // Иконка
                ctx.font = '24px monospace';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(skill.icon, slotX + 12, slotY + 35);
                
                // Кулдаун
                if (skill.currentCooldown > 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.8)';
                    ctx.fillRect(slotX, slotY, slotWidth, slotHeight);
                    
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#ffaa44';
                    ctx.fillText(
                        skill.currentCooldown.toFixed(1),
                        slotX + 12,
                        slotY + 32
                    );
                }
                
                // Номер клавиши
                ctx.font = '10px monospace';
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(`${i + 1}`, slotX + 4, slotY + 15);
                
                // Стоимость маны
                ctx.font = '8px monospace';
                ctx.fillStyle = '#88aaff';
                ctx.fillText(`${skill.manaCost}`, slotX + 32, slotY + 45);
            }
        }
    }
}

// Древо навыков
class SkillTree {
    constructor() {
        this.trees = {
            knight: {
                name: 'Рыцарь',
                branches: {
                    offense: {
                        name: 'Нападение',
                        skills: ['power_strike', 'whirlwind', 'revenge'],
                        upgrades: [
                            { level: 5, effect: 'Урон +10%' },
                            { level: 10, effect: 'Урон +20%' },
                            { level: 15, effect: 'Крит шанс +10%' }
                        ]
                    },
                    defense: {
                        name: 'Защита',
                        skills: ['shield_bash', 'battle_cry'],
                        upgrades: [
                            { level: 5, effect: 'Защита +15' },
                            { level: 10, effect: 'HP +50' },
                            { level: 15, effect: 'Щит поглощает +100 урона' }
                        ]
                    }
                }
            },
            archer: {
                name: 'Лучник',
                branches: {
                    precision: {
                        name: 'Точность',
                        skills: ['quick_shot', 'piercing_arrow', 'hawk_eye'],
                        upgrades: [
                            { level: 5, effect: 'Дальность +20' },
                            { level: 10, effect: 'Крит шанс +10%' },
                            { level: 15, effect: 'Стрелы пробивают броню' }
                        ]
                    },
                    trickery: {
                        name: 'Хитрость',
                        skills: ['multi_shot', 'poison_arrow'],
                        upgrades: [
                            { level: 5, effect: 'Отравление длится дольше' },
                            { level: 10, effect: '+1 стрела в залпе' },
                            { level: 15, effect: 'Яд наносит +50% урона' }
                        ]
                    }
                }
            },
            mage: {
                name: 'Маг',
                branches: {
                    fire: {
                        name: 'Огонь',
                        skills: ['fireball', 'meteor'],
                        upgrades: [
                            { level: 5, effect: 'Радиус взрыва +20' },
                            { level: 10, effect: 'Урон +15%' },
                            { level: 15, effect: 'Поджигает врагов' }
                        ]
                    },
                    frost: {
                        name: 'Лед',
                        skills: ['ice_bolt'],
                        upgrades: [
                            { level: 5, effect: 'Заморозка длится дольше' },
                            { level: 10, effect: 'Урон +20%' },
                            { level: 15, effect: 'Ледяная аура' }
                        ]
                    },
                    arcane: {
                        name: 'Тайное',
                        skills: ['lightning', 'magic_shield'],
                        upgrades: [
                            { level: 5, effect: 'Мана реген +2' },
                            { level: 10, effect: 'Щит сильнее на 100' },
                            { level: 15, effect: 'Молния оглушает чаще' }
                        ]
                    }
                }
            }
        };
    }
    
    getTree(playerClass) {
        return this.trees[playerClass] || null;
    }
    
    getUpgrade(playerClass, branch, level) {
        const tree = this.trees[playerClass];
        if (!tree) return null;
        
        const branchData = tree.branches[branch];
        if (!branchData) return null;
        
        const upgradeIndex = Math.floor((level - 1) / 5);
        if (upgradeIndex >= branchData.upgrades.length) return null;
        
        return branchData.upgrades[upgradeIndex];
    }
}

window.SKILLS_DB = SKILLS_DB;
window.Skill = Skill;
window.SkillManager = SkillManager;
window.SkillTree = SkillTree;
