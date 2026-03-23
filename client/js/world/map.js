/**
 * Rucoy Online Clone - Система миров и карты
 * Версия: 1.0.0
 * Модуль: World Generator & Map System
 * Строк: ~1400
 */

// Типы тайлов
const TILE_TYPES = {
    GRASS: { id: 0, name: 'Трава', walkable: true, color: '#5c6e4a', speed: 1.0 },
    DIRT: { id: 1, name: 'Земля', walkable: true, color: '#8b7a5a', speed: 0.9 },
    STONE: { id: 2, name: 'Камень', walkable: true, color: '#8a8a8a', speed: 0.8 },
    WATER: { id: 3, name: 'Вода', walkable: false, color: '#4a6a8a', speed: 0 },
    FOREST: { id: 4, name: 'Лес', walkable: true, color: '#4a6e3a', speed: 0.7 },
    SAND: { id: 5, name: 'Песок', walkable: true, color: '#c9b86a', speed: 0.85 },
    MOUNTAIN: { id: 6, name: 'Горы', walkable: false, color: '#8a7a5a', speed: 0 },
    SNOW: { id: 7, name: 'Снег', walkable: true, color: '#eef4ff', speed: 0.75 },
    SWAMP: { id: 8, name: 'Болото', walkable: true, color: '#6a8a5a', speed: 0.6 },
    LAVA: { id: 9, name: 'Лава', walkable: false, color: '#ff6a2a', speed: 0 },
    DUNGEON_FLOOR: { id: 10, name: 'Пол подземелья', walkable: true, color: '#5a5a6a', speed: 0.9 },
    DUNGEON_WALL: { id: 11, name: 'Стена', walkable: false, color: '#4a4a5a', speed: 0 }
};

// Миры игры
const WORLDS = {
    // Начальный мир - равнины
    STARTING_PLAINS: {
        id: 'starting_plains',
        name: 'Равнины Начала',
        description: 'Зеленые равнины, где начинают свой путь молодые герои',
        levelRange: { min: 1, max: 10 },
        width: 200,
        height: 200,
        baseTiles: TILE_TYPES.GRASS,
        spawnZones: [
            { type: 'forest', density: 0.15, tiles: [TILE_TYPES.FOREST] },
            { type: 'water', density: 0.05, tiles: [TILE_TYPES.WATER] },
            { type: 'dirt', density: 0.1, tiles: [TILE_TYPES.DIRT] }
        ],
        monsters: ['goblin', 'wolf', 'skeleton'],
        npcs: ['trainer', 'merchant', 'healer'],
        spawnPoint: { x: 100, y: 100 },
        ambient: 'forest'
    },
    
    // Лесной мир
    FOREST_WORLD: {
        id: 'forest_world',
        name: 'Дремучий Лес',
        description: 'Густые леса, полные диких зверей и древних тайн',
        levelRange: { min: 5, max: 20 },
        width: 250,
        height: 250,
        baseTiles: TILE_TYPES.FOREST,
        spawnZones: [
            { type: 'grass', density: 0.2, tiles: [TILE_TYPES.GRASS] },
            { type: 'water', density: 0.08, tiles: [TILE_TYPES.WATER] },
            { type: 'swamp', density: 0.1, tiles: [TILE_TYPES.SWAMP] }
        ],
        monsters: ['wolf', 'orc', 'troll', 'elite_orc'],
        npcs: ['hunter', 'druid'],
        spawnPoint: { x: 125, y: 125 },
        ambient: 'forest_deep'
    },
    
    // Пустыня
    DESERT_WORLD: {
        id: 'desert_world',
        name: 'Бескрайняя Пустыня',
        description: 'Знойные пески, где обитают опасные создания',
        levelRange: { min: 10, max: 25 },
        width: 220,
        height: 220,
        baseTiles: TILE_TYPES.SAND,
        spawnZones: [
            { type: 'stone', density: 0.12, tiles: [TILE_TYPES.STONE] },
            { type: 'dirt', density: 0.08, tiles: [TILE_TYPES.DIRT] }
        ],
        monsters: ['mummy', 'scorpion', 'minotaur'],
        npcs: ['nomad', 'treasure_hunter'],
        spawnPoint: { x: 110, y: 110 },
        ambient: 'desert'
    },
    
    // Горный хребет
    MOUNTAIN_WORLD: {
        id: 'mountain_world',
        name: 'Горный Хребет',
        description: 'Высокие горы, где обитают сильнейшие существа',
        levelRange: { min: 15, max: 35 },
        width: 180,
        height: 180,
        baseTiles: TILE_TYPES.STONE,
        spawnZones: [
            { type: 'snow', density: 0.2, tiles: [TILE_TYPES.SNOW] },
            { type: 'mountain', density: 0.25, tiles: [TILE_TYPES.MOUNTAIN] }
        ],
        monsters: ['troll', 'minotaur', 'dragon'],
        npcs: ['blacksmith', 'elder'],
        spawnPoint: { x: 90, y: 90 },
        ambient: 'mountain'
    },
    
    // Подземелье
    DUNGEON_WORLD: {
        id: 'dungeon_world',
        name: 'Глубинные Подземелья',
        description: 'Темные катакомбы, где обитают нежить и демоны',
        levelRange: { min: 20, max: 45 },
        width: 150,
        height: 150,
        baseTiles: TILE_TYPES.DUNGEON_FLOOR,
        spawnZones: [
            { type: 'wall', density: 0.3, tiles: [TILE_TYPES.DUNGEON_WALL] }
        ],
        monsters: ['skeleton', 'ghost', 'demon', 'minotaur'],
        npcs: ['prisoner', 'dark_mage'],
        spawnPoint: { x: 75, y: 75 },
        ambient: 'dungeon'
    },
    
    // Вулканический мир (босс зона)
    VOLCANO_WORLD: {
        id: 'volcano_world',
        name: 'Пылающий Вулкан',
        description: 'Логово древнего дракона, место силы и опасности',
        levelRange: { min: 30, max: 60 },
        width: 120,
        height: 120,
        baseTiles: TILE_TYPES.STONE,
        spawnZones: [
            { type: 'lava', density: 0.2, tiles: [TILE_TYPES.LAVA] },
            { type: 'stone', density: 0.15, tiles: [TILE_TYPES.STONE] }
        ],
        monsters: ['dragon', 'demon', 'elite_orc'],
        npcs: [],
        spawnPoint: { x: 60, y: 60 },
        ambient: 'volcano',
        isBossZone: true
    }
};

// Класс карты
class GameMap {
    constructor(worldId) {
        this.worldData = WORLDS[worldId];
        if (!this.worldData) throw new Error(`Unknown world: ${worldId}`);
        
        this.id = worldId;
        this.name = this.worldData.name;
        this.description = this.worldData.description;
        this.width = this.worldData.width;
        this.height = this.worldData.height;
        this.levelRange = this.worldData.levelRange;
        
        // Тайлы
        this.tiles = [];
        this.walkable = [];
        this.speedModifiers = [];
        
        // Объекты на карте
        this.objects = [];
        this.spawnPoints = [];
        this.portals = [];
        
        // Генерация
        this.generateMap();
        this.generateObjects();
        this.generatePortals();
        
        console.log(`Карта ${this.name} создана (${this.width}x${this.height})`);
    }
    
    generateMap() {
        // Инициализация массива тайлов
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.walkable[y] = [];
            this.speedModifiers[y] = [];
            
            for (let x = 0; x < this.width; x++) {
                // Базовый тайл
                let tile = { ...this.worldData.baseTiles };
                
                // Применение зон
                for (const zone of this.worldData.spawnZones) {
                    // Используем шум Перлина для естественной генерации
                    const noise = this.simplexNoise(x, y, zone.density);
                    
                    if (noise > 0.7) {
                        const zoneTile = zone.tiles[Math.floor(Math.random() * zone.tiles.length)];
                        tile = { ...zoneTile };
                        break;
                    }
                }
                
                // Добавление случайных вариаций
                if (Math.random() < 0.05 && tile.walkable) {
                    tile.variant = Math.floor(Math.random() * 3);
                }
                
                this.tiles[y][x] = tile;
                this.walkable[y][x] = tile.walkable;
                this.speedModifiers[y][x] = tile.speed;
            }
        }
        
        // Сглаживание границ между зонами
        this.smoothMap();
        
        // Добавление дорог и троп
        this.generatePaths();
    }
    
    simplexNoise(x, y, scale) {
        // Упрощенная версия шума для генерации карты
        const nx = x * 0.05 * scale;
        const ny = y * 0.05 * scale;
        
        // Используем синусоидальную волну для создания паттернов
        const value = Math.sin(nx) * Math.cos(ny) + 
                      Math.sin(nx * 2) * 0.5 + 
                      Math.cos(ny * 2) * 0.5;
        
        return (value + 1) / 2;
    }
    
    smoothMap() {
        // Сглаживание карты для более естественного вида
        const newTiles = JSON.parse(JSON.stringify(this.tiles));
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let sameNeighbors = 0;
                const currentTile = this.tiles[y][x];
                
                // Проверка соседей
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighbor = this.tiles[y + dy][x + dx];
                        if (neighbor.id === currentTile.id) {
                            sameNeighbors++;
                        }
                    }
                }
                
                // Если окружение сильно отличается, меняем тайл
                if (sameNeighbors < 2 && currentTile.walkable) {
                    // Поиск наиболее распространенного соседнего тайла
                    const neighborCounts = {};
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const neighbor = this.tiles[y + dy][x + dx];
                            neighborCounts[neighbor.id] = (neighborCounts[neighbor.id] || 0) + 1;
                        }
                    }
                    
                    let mostCommonId = currentTile.id;
                    let maxCount = 0;
                    for (const [id, count] of Object.entries(neighborCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            mostCommonId = parseInt(id);
                        }
                    }
                    
                    if (mostCommonId !== currentTile.id) {
                        const newTile = Object.values(TILE_TYPES).find(t => t.id === mostCommonId);
                        if (newTile) newTiles[y][x] = { ...newTile };
                    }
                }
            }
        }
        
        this.tiles = newTiles;
        
        // Обновление walkable и speedModifiers
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.walkable[y][x] = this.tiles[y][x].walkable;
                this.speedModifiers[y][x] = this.tiles[y][x].speed;
            }
        }
    }
    
    generatePaths() {
        // Генерация дорог между важными точками
        const importantPoints = [
            { x: Math.floor(this.width * 0.2), y: Math.floor(this.height * 0.2) },
            { x: Math.floor(this.width * 0.8), y: Math.floor(this.height * 0.2) },
            { x: Math.floor(this.width * 0.5), y: Math.floor(this.height * 0.5) },
            { x: Math.floor(this.width * 0.2), y: Math.floor(this.height * 0.8) },
            { x: Math.floor(this.width * 0.8), y: Math.floor(this.height * 0.8) }
        ];
        
        // Соединение точек дорогами
        for (let i = 0; i < importantPoints.length - 1; i++) {
            const start = importantPoints[i];
            const end = importantPoints[i + 1];
            this.drawPath(start.x, start.y, end.x, end.y);
        }
    }
    
    drawPath(x1, y1, x2, y2) {
        // Алгоритм Брезенхема для рисования линии
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let sx = x1 < x2 ? 1 : -1;
        let sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1, y = y1;
        
        while (true) {
            // Делаем тайл дорогой (земля)
            if (this.tiles[y][x].walkable) {
                this.tiles[y][x] = { ...TILE_TYPES.DIRT };
                this.walkable[y][x] = true;
                this.speedModifiers[y][x] = 1.1; // Дорога увеличивает скорость
            }
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
    
    generateObjects() {
        // Генерация декоративных объектов (деревья, камни, цветы)
        const decorCount = Math.floor(this.width * this.height * 0.01);
        
        for (let i = 0; i < decorCount; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            if (this.tiles[y][x].walkable && this.tiles[y][x].id !== TILE_TYPES.DIRT.id) {
                const decorType = this.getRandomDecor(x, y);
                if (decorType) {
                    this.objects.push({
                        x: x,
                        y: y,
                        type: decorType,
                        interactive: false
                    });
                }
            }
        }
    }
    
    getRandomDecor(x, y) {
        const tile = this.tiles[y][x];
        const random = Math.random();
        
        switch (tile.id) {
            case TILE_TYPES.GRASS.id:
                if (random < 0.3) return 'flower';
                if (random < 0.4) return 'bush';
                break;
            case TILE_TYPES.FOREST.id:
                if (random < 0.5) return 'tree';
                if (random < 0.6) return 'mushroom';
                break;
            case TILE_TYPES.SAND.id:
                if (random < 0.2) return 'cactus';
                if (random < 0.25) return 'bones';
                break;
            case TILE_TYPES.STONE.id:
                if (random < 0.3) return 'rock';
                break;
        }
        
        return null;
    }
    
    generatePortals() {
        // Портал на следующий уровень (если есть)
        const worldsList = Object.keys(WORLDS);
        const currentIndex = worldsList.indexOf(this.id);
        
        if (currentIndex < worldsList.length - 1) {
            const nextWorld = worldsList[currentIndex + 1];
            // Портал на востоке
            this.portals.push({
                x: this.width - 5,
                y: Math.floor(this.height / 2),
                targetWorld: nextWorld,
                targetX: 5,
                targetY: Math.floor(WORLDS[nextWorld].height / 2),
                requiredLevel: WORLDS[nextWorld].levelRange.min,
                name: `Вход в ${WORLDS[nextWorld].name}`
            });
        }
        
        if (currentIndex > 0) {
            const prevWorld = worldsList[currentIndex - 1];
            // Портал на западе
            this.portals.push({
                x: 5,
                y: Math.floor(this.height / 2),
                targetWorld: prevWorld,
                targetX: this.width - 5,
                targetY: Math.floor(WORLDS[prevWorld].height / 2),
                requiredLevel: 1,
                name: `Возврат в ${WORLDS[prevWorld].name}`
            });
        }
    }
    
    isWalkable(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        
        // Проверка на объекты, блокирующие проход
        const blockingObject = this.objects.find(obj => 
            Math.floor(obj.x) === x && Math.floor(obj.y) === y && obj.blocking
        );
        
        if (blockingObject) return false;
        
        return this.walkable[y][x];
    }
    
    getSpeedModifier(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 1;
        
        return this.speedModifiers[y][x] || 1;
    }
    
    getTileAt(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        
        return this.tiles[y][x];
    }
    
    getPortalAt(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        
        for (const portal of this.portals) {
            const dx = Math.abs(portal.x - x);
            const dy = Math.abs(portal.y - y);
            if (dx < 2 && dy < 2) return portal;
        }
        
        return null;
    }
    
    render(renderer, camera) {
        const startX = Math.max(0, Math.floor(camera.x / 32) - 5);
        const startY = Math.max(0, Math.floor(camera.y / 32) - 5);
        const endX = Math.min(this.width, startX + Math.ceil(renderer.width / 32) + 10);
        const endY = Math.min(this.height, startY + Math.ceil(renderer.height / 32) + 10);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const screenX = x * 32 - camera.x;
                const screenY = y * 32 - camera.y;
                
                const tile = this.tiles[y][x];
                
                // Рисуем тайл
                renderer.ctx.fillStyle = tile.color;
                renderer.ctx.fillRect(screenX, screenY, 32, 32);
                
                // Рисуем текстуру/детали
                if (tile.variant) {
                    renderer.ctx.fillStyle = this.getVariantColor(tile, tile.variant);
                    renderer.ctx.fillRect(screenX + 4, screenY + 4, 24, 24);
                }
                
                // Рисуем сетку (для отладки)
                if (window.gameEngine && window.gameEngine.debug) {
                    renderer.ctx.strokeStyle = '#000000';
                    renderer.ctx.lineWidth = 0.5;
                    renderer.ctx.strokeRect(screenX, screenY, 32, 32);
                }
            }
        }
        
        // Рендер объектов
        for (const obj of this.objects) {
            const screenX = obj.x * 32 - camera.x;
            const screenY = obj.y * 32 - camera.y;
            
            if (screenX > -50 && screenX < renderer.width + 50 &&
                screenY > -50 && screenY < renderer.height + 50) {
                
                this.renderObject(renderer, obj, screenX, screenY);
            }
        }
        
        // Рендер порталов
        for (const portal of this.portals) {
            const screenX = portal.x * 32 - camera.x;
            const screenY = portal.y * 32 - camera.y;
            
            if (screenX > -50 && screenX < renderer.width + 50 &&
                screenY > -50 && screenY < renderer.height + 50) {
                
                // Анимированный портал
                const time = Date.now() / 1000;
                const pulse = Math.sin(time * 3) * 0.3 + 0.7;
                
                renderer.ctx.fillStyle = `rgba(100, 50, 200, ${pulse * 0.5})`;
                renderer.ctx.fillRect(screenX, screenY, 32, 32);
                
                renderer.ctx.fillStyle = '#ffffff';
                renderer.ctx.font = 'bold 10px monospace';
                renderer.ctx.fillText(portal.name, screenX + 4, screenY - 5);
                
                if (portal.requiredLevel > 1) {
                    renderer.ctx.fillStyle = '#ffaa66';
                    renderer.ctx.font = '8px monospace';
                    renderer.ctx.fillText(`Lv.${portal.requiredLevel}+`, screenX + 4, screenY + 40);
                }
            }
        }
    }
    
    renderObject(renderer, obj, x, y) {
        switch (obj.type) {
            case 'tree':
                renderer.ctx.fillStyle = '#4a6e3a';
                renderer.ctx.fillRect(x + 8, y + 8, 16, 24);
                renderer.ctx.fillStyle = '#6a8e4a';
                renderer.ctx.beginPath();
                renderer.ctx.arc(x + 16, y + 12, 12, 0, Math.PI * 2);
                renderer.ctx.fill();
                break;
                
            case 'rock':
                renderer.ctx.fillStyle = '#8a8a8a';
                renderer.ctx.fillRect(x + 6, y + 10, 20, 18);
                break;
                
            case 'flower':
                renderer.ctx.fillStyle = '#ffaa88';
                renderer.ctx.beginPath();
                renderer.ctx.arc(x + 16, y + 24, 4, 0, Math.PI * 2);
                renderer.ctx.fill();
                renderer.ctx.fillStyle = '#6a8e4a';
                renderer.ctx.fillRect(x + 15, y + 20, 2, 8);
                break;
                
            case 'cactus':
                renderer.ctx.fillStyle = '#6a8e4a';
                renderer.ctx.fillRect(x + 12, y + 8, 8, 24);
                renderer.ctx.fillStyle = '#8aae6a';
                renderer.ctx.fillRect(x + 10, y + 20, 12, 6);
                break;
        }
    }
    
    getVariantColor(tile, variant) {
        const colors = {
            [TILE_TYPES.GRASS.id]: ['#5c6e4a', '#6c7e5a', '#4c5e3a'],
            [TILE_TYPES.DIRT.id]: ['#8b7a5a', '#9b8a6a', '#7b6a4a'],
            [TILE_TYPES.STONE.id]: ['#8a8a8a', '#9a9a9a', '#7a7a7a']
        };
        
        const tileColors = colors[tile.id];
        if (tileColors && variant < tileColors.length) {
            return tileColors[variant];
        }
        
        return tile.color;
    }
    
    getSpawnPoint() {
        return {
            x: this.worldData.spawnPoint.x * 32,
            y: this.worldData.spawnPoint.y * 32
        };
    }
    
    getMonsterSpawnPoints() {
        const points = [];
        
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            if (this.walkable[y][x] && this.getTileAt(x, y).id !== TILE_TYPES.DIRT.id) {
                points.push({ x: x * 32, y: y * 32 });
            }
        }
        
        return points;
    }
}

// Менеджер миров
class WorldManager {
    constructor() {
        this.currentWorld = null;
        this.worlds = new Map();
        this.loadedWorlds = new Set();
    }
    
    loadWorld(worldId) {
        if (this.loadedWorlds.has(worldId)) {
            this.currentWorld = this.worlds.get(worldId);
            return this.currentWorld;
        }
        
        const world = new GameMap(worldId);
        this.worlds.set(worldId, world);
        this.loadedWorlds.add(worldId);
        this.currentWorld = world;
        
        console.log(`Загружен мир: ${world.name}`);
        
        return world;
    }
    
    changeWorld(worldId, playerX, playerY) {
        const newWorld = this.loadWorld(worldId);
        this.currentWorld = newWorld;
        
        // Обновление позиции игрока
        if (playerX !== undefined && playerY !== undefined) {
            return { x: playerX, y: playerY };
        }
        
        return newWorld.getSpawnPoint();
    }
    
    getCurrentWorld() {
        return this.currentWorld;
    }
    
    getWorldInfo(worldId) {
        return WORLDS[worldId];
    }
    
    getAllWorlds() {
        return Object.keys(WORLDS).map(id => ({
            id: id,
            name: WORLDS[id].name,
            description: WORLDS[id].description,
            levelRange: WORLDS[id].levelRange
        }));
    }
}

window.TILE_TYPES = TILE_TYPES;
window.WORLDS = WORLDS;
window.GameMap = GameMap;
window.WorldManager = WorldManager;
