/**
 * Rucoy Online Clone - Главный файл
 * Версия: 1.0.0
 * Модуль: Main Entry Point
 * Строк: ~280
 */

// Глобальный объект игры
window.RucoyGame = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Rucoy Online Clone v1.0.0');
    console.log('Инициализация игры...');
    
    startGame();
});

function startGame() {
    // Создание канваса
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    // Установка размеров
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Инициализация ядра
    const engine = new RucoyEngine();
    engine.debug = true;
    
    // Инициализация рендерера
    const renderer = new Renderer('gameCanvas', canvas.width, canvas.height);
    engine.renderer = renderer;
    
    // Инициализация камеры
    engine.camera = {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        update: function(deltaTime) {
            if (engine.player) {
                // Плавное следование камеры
                const targetX = engine.player.x - this.width / 2;
                const targetY = engine.player.y - this.height / 2;
                this.x += (targetX - this.x) * 0.1;
                this.y += (targetY - this.y) * 0.1;
                
                // Ограничения
                this.x = Math.max(0, Math.min(this.x, engine.world?.width || 2000 - this.width));
                this.y = Math.max(0, Math.min(this.y, engine.world?.height || 2000 - this.height));
            }
        }
    };
    
    // Инициализация мира
    const worldManager = new WorldManager();
    const startWorld = worldManager.loadWorld('STARTING_PLAINS');
    engine.world = startWorld;
    
    // Инициализация игрока
    const spawnPoint = startWorld.getSpawnPoint();
    const player = new Player(spawnPoint.x, spawnPoint.y, 'Герой');
    
    // Начальная экипировка
    player.inventory.addItem(new Item('wooden_sword'));
    player.inventory.addItem(new Item('leather_armor'));
    player.inventory.addItem(new Item('small_health_potion', 5));
    player.inventory.addItem(new Item('mana_potion', 3));
    player.equipment.weapon = new Item('wooden_sword');
    
    // Система навыков
    player.skillManager = new SkillManager(player);
    player.skillManager.skillPoints = 3;
    
    engine.player = player;
    
    // Инициализация менеджера монстров
    const monsterManager = new MonsterManager();
    monsterManager.generateSpawnPoints(startWorld.width, startWorld.height);
    monsterManager.spawnMonsters();
    engine.monsters = monsterManager.monsters;
    engine.monsterManager = monsterManager;
    
    // Инициализация UI
    const hud = new HUD(engine, canvas);
    engine.hud = hud;
    
    // Инициализация сети (опционально)
    // const network = new NetworkManager(engine);
    // engine.network = network;
    // network.connect();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setSize(canvas.width, canvas.height);
        engine.camera.width = canvas.width;
        engine.camera.height = canvas.height;
    });
    
    // Обработка кликов по канвасу для движения
    canvas.addEventListener('click', (e) => {
        if (!engine.player || engine.player.hp <= 0) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        const worldX = clickX + engine.camera.x;
        const worldY = clickY + engine.camera.y;
        
        // Проверка, не кликнули ли по монстру
        let clickedMonster = null;
        for (const monster of engine.monsters) {
            if (!monster.alive) continue;
            const dx = Math.abs(worldX - monster.x);
            const dy = Math.abs(worldY - monster.y);
            if (dx < monster.size && dy < monster.size) {
                clickedMonster = monster;
                break;
            }
        }
        
        if (clickedMonster) {
            // Атака
            const result = engine.player.attack(clickedMonster);
            if (result.success && engine.hud) {
                engine.hud.addDamageNumber(result.damage, { x: clickedMonster.x, y: clickedMonster.y }, result.isCrit ? '#ffaa44' : '#ff8844');
            }
        } else {
            // Движение
            engine.player.moveTo(worldX, worldY);
        }
    });
    
    // Обработка правого клика для навыков
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (engine.player && engine.player.skillManager) {
            // Использование навыка по умолчанию (первый слот)
            engine.player.skillManager.useSkill(0, engine.getTargetedMonster?.());
        }
        return false;
    });
    
    // Глобальные команды
    window.gameCommands = {
        heal: () => {
            if (engine.player) {
                const healAmount = Math.floor(engine.player.maxHp * 0.3);
                engine.player.hp = Math.min(engine.player.maxHp, engine.player.hp + healAmount);
                if (engine.hud) engine.hud.addNotification(`Вылечено +${healAmount} HP`, '#88ff88');
            }
        },
        levelUp: () => {
            if (engine.player) {
                engine.player.addExp(100);
            }
        },
        spawnMonster: (type = 'goblin') => {
            if (engine.player && engine.monsterManager) {
                const x = engine.player.x + (Math.random() - 0.5) * 200;
                const y = engine.player.y + (Math.random() - 0.5) * 200;
                const monster = new Monster(type, x, y);
                engine.monsters.push(monster);
                if (engine.hud) engine.hud.addNotification(`Спавн ${monster.name}`, '#ffaa44');
            }
        },
        giveGold: (amount = 100) => {
            if (engine.player) {
                engine.player.gold += amount;
                if (engine.hud) engine.hud.addNotification(`+${amount} золота`, '#ffd966');
            }
        },
        giveItem: (itemId = 'small_health_potion', count = 1) => {
            if (engine.player) {
                const item = new Item(itemId, count);
                engine.player.inventory.addItem(item);
                if (engine.hud) engine.hud.addNotification(`Получено: ${item.name} x${count}`, '#88ff88');
            }
        }
    };
    
    // Сохранение в localStorage
    window.saveGame = () => {
        if (engine.player) {
            const saveData = engine.player.serialize();
            localStorage.setItem('rucoy_save', JSON.stringify(saveData));
            console.log('Игра сохранена');
            if (engine.hud) engine.hud.addNotification('Игра сохранена', '#88ff88');
        }
    };
    
    window.loadGame = () => {
        const saveData = localStorage.getItem('rucoy_save');
        if (saveData && engine.player) {
            engine.player.deserialize(JSON.parse(saveData));
            console.log('Загрузка сохранения');
            if (engine.hud) engine.hud.addNotification('Загрузка завершена', '#88ff88');
        }
    };
    
    // Автосохранение каждые 30 секунд
    setInterval(() => {
        if (engine.player && engine.player.hp > 0) {
            window.saveGame();
        }
    }, 30000);
    
    // Запуск игры
    engine.start();
    
    // Сохранение глобальной ссылки
    window.RucoyGame = engine;
    
    console.log('Игра готова!');
    console.log('Доступные команды: gameCommands.heal(), gameCommands.levelUp(), gameCommands.spawnMonster(), gameCommands.giveGold(), gameCommands.giveItem()');
    console.log('Сохранение: saveGame(), loadGame()');
}

// Предзагрузка спрайтов (заглушка)
function preloadSprites(renderer) {
    // Здесь будет загрузка спрайтов
    console.log('Загрузка спрайтов...');
}
