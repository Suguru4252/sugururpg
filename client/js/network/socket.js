/**
 * Rucoy Online Clone - Сетевая система
 * Версия: 1.0.0
 * Модуль: WebSocket Network Manager
 * Строк: ~650
 */

class NetworkManager {
    constructor(engine) {
        this.engine = engine;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        // Серверные данные
        this.serverUrl = 'ws://localhost:8080';
        this.serverInfo = {
            name: 'Rucoy Online Server',
            players: 0,
            uptime: 0,
            version: '1.0.0'
        };
        
        // Игроки онлайн
        this.players = new Map(); // id -> player data
        this.localPlayerId = null;
        
        // Очередь сообщений
        this.messageQueue = [];
        this.processingQueue = false;
        
        // Пинг
        this.ping = 0;
        this.lastPing = 0;
        this.pingInterval = null;
        
        // События
        this.handlers = new Map();
        
        this.init();
    }
    
    init() {
        this.setupHandlers();
        console.log('NetworkManager инициализирован');
    }
    
    setupHandlers() {
        // Обработчики входящих сообщений
        this.handlers.set('connected', (data) => this.onConnected(data));
        this.handlers.set('player_join', (data) => this.onPlayerJoin(data));
        this.handlers.set('player_leave', (data) => this.onPlayerLeave(data));
        this.handlers.set('player_move', (data) => this.onPlayerMove(data));
        this.handlers.set('player_attack', (data) => this.onPlayerAttack(data));
        this.handlers.set('player_damage', (data) => this.onPlayerDamage(data));
        this.handlers.set('player_death', (data) => this.onPlayerDeath(data));
        this.handlers.set('player_skill', (data) => this.onPlayerSkill(data));
        this.handlers.set('player_chat', (data) => this.onPlayerChat(data));
        this.handlers.set('monster_spawn', (data) => this.onMonsterSpawn(data));
        this.handlers.set('monster_die', (data) => this.onMonsterDie(data));
        this.handlers.set('item_drop', (data) => this.onItemDrop(data));
        this.handlers.set('item_pickup', (data) => this.onItemPickup(data));
        this.handlers.set('world_data', (data) => this.onWorldData(data));
        this.handlers.set('sync', (data) => this.onSync(data));
        this.handlers.set('pong', (data) => this.onPong(data));
        this.handlers.set('error', (data) => this.onError(data));
        this.handlers.set('chat_message', (data) => this.onChatMessage(data));
        this.handlers.set('guild_message', (data) => this.onGuildMessage(data));
        this.handlers.set('trade_request', (data) => this.onTradeRequest(data));
        this.handlers.set('party_invite', (data) => this.onPartyInvite(data));
    }
    
    connect(serverUrl = null) {
        if (serverUrl) this.serverUrl = serverUrl;
        
        console.log(`Подключение к ${this.serverUrl}...`);
        
        try {
            this.socket = new WebSocket(this.serverUrl);
            
            this.socket.onopen = () => this.onOpen();
            this.socket.onclose = () => this.onClose();
            this.socket.onerror = (error) => this.onError(error);
            this.socket.onmessage = (event) => this.onMessage(event);
            
        } catch (error) {
            console.error('Ошибка подключения:', error);
            this.reconnect();
        }
    }
    
    disconnect() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.connected = false;
        this.players.clear();
        
        console.log('Отключено от сервера');
    }
    
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Превышено максимальное количество попыток переподключения');
            this.engine.events.emit('connection_failed', { message: 'Не удалось подключиться к серверу' });
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${this.reconnectDelay}мс...`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }
    
    onOpen() {
        console.log('Подключено к серверу');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Отправка информации о клиенте
        this.send('handshake', {
            version: this.serverInfo.version,
            client: 'web',
            timestamp: Date.now()
        });
        
        // Запуск пинга
        this.startPing();
        
        // Обработка очереди
        this.processQueue();
        
        this.engine.events.emit('connected', { server: this.serverUrl });
    }
    
    onClose() {
        console.log('Соединение закрыто');
        this.connected = false;
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        this.engine.events.emit('disconnected');
        
        // Автоматическое переподключение
        this.reconnect();
    }
    
    onError(error) {
        console.error('WebSocket ошибка:', error);
        this.engine.events.emit('network_error', { error: error });
    }
    
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            const handler = this.handlers.get(data.type);
            
            if (handler) {
                handler(data.payload);
            } else {
                console.warn(`Неизвестный тип сообщения: ${data.type}`);
            }
        } catch (error) {
            console.error('Ошибка парсинга сообщения:', error);
        }
    }
    
    send(type, payload = {}) {
        const message = {
            type: type,
            payload: payload,
            timestamp: Date.now()
        };
        
        if (this.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            // Сохраняем в очередь для отправки после подключения
            this.messageQueue.push(message);
        }
    }
    
    processQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;
        
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            this.socket.send(JSON.stringify(message));
        }
        
        this.processingQueue = false;
    }
    
    startPing() {
        this.pingInterval = setInterval(() => {
            this.lastPing = Date.now();
            this.send('ping', { time: this.lastPing });
        }, 5000);
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    
    onConnected(data) {
        console.log('Установлено соединение с сервером:', data);
        this.localPlayerId = data.playerId;
        this.serverInfo.name = data.serverName;
        this.serverInfo.players = data.playersOnline;
        
        this.engine.events.emit('server_connected', data);
    }
    
    onPlayerJoin(data) {
        // Добавление нового игрока
        this.players.set(data.id, data);
        this.engine.events.emit('player_joined', data);
        
        if (this.engine.hud) {
            this.engine.hud.addChatMessage('Система', `${data.name} присоединился к игре`, true);
        }
    }
    
    onPlayerLeave(data) {
        // Удаление игрока
        const player = this.players.get(data.id);
        if (player) {
            this.players.delete(data.id);
            this.engine.events.emit('player_left', { id: data.id, name: player.name });
            
            if (this.engine.hud) {
                this.engine.hud.addChatMessage('Система', `${player.name} покинул игру`, true);
            }
        }
    }
    
    onPlayerMove(data) {
        // Обновление позиции другого игрока
        const player = this.players.get(data.id);
        if (player && data.id !== this.localPlayerId) {
            player.x = data.x;
            player.y = data.y;
            player.direction = data.direction;
            player.moving = data.moving;
            
            this.engine.events.emit('player_moved', { id: data.id, x: data.x, y: data.y });
        }
    }
    
    onPlayerAttack(data) {
        // Атака другого игрока
        const player = this.players.get(data.id);
        if (player && data.id !== this.localPlayerId) {
            player.attacking = true;
            setTimeout(() => { player.attacking = false; }, 300);
            
            this.engine.events.emit('player_attacked', {
                id: data.id,
                targetId: data.targetId,
                damage: data.damage
            });
        }
    }
    
    onPlayerDamage(data) {
        // Получение урона
        if (data.targetId === this.localPlayerId) {
            if (this.engine.player) {
                this.engine.player.hp = data.newHp;
                if (this.engine.hud) {
                    this.engine.hud.addDamageNumber(data.damage, { x: this.engine.player.x, y: this.engine.player.y }, '#ff4444');
                }
            }
        } else {
            const player = this.players.get(data.targetId);
            if (player) {
                player.hp = data.newHp;
                this.engine.events.emit('player_damaged', { id: data.targetId, damage: data.damage, hp: data.newHp });
            }
        }
    }
    
    onPlayerDeath(data) {
        if (data.id === this.localPlayerId) {
            if (this.engine.player) {
                this.engine.player.hp = 0;
                this.engine.player.die({ name: data.killerName });
            }
        } else {
            const player = this.players.get(data.id);
            if (player) {
                player.alive = false;
                this.engine.events.emit('player_died', { id: data.id, name: player.name, killer: data.killerName });
            }
        }
        
        if (this.engine.hud) {
            this.engine.hud.addChatMessage('Бой', `${data.name} погиб от ${data.killerName}`, true);
        }
    }
    
    onPlayerSkill(data) {
        if (data.id === this.localPlayerId) {
            this.engine.events.emit('skill_used', { skill: data.skill, targets: data.targets });
        } else {
            const player = this.players.get(data.id);
            if (player) {
                this.engine.events.emit('player_skill', { id: data.id, skill: data.skill });
            }
        }
    }
    
    onPlayerChat(data) {
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(data.name, data.message);
        }
        this.engine.events.emit('chat_message', data);
    }
    
    onMonsterSpawn(data) {
        // Спавн монстра на сервере
        const monster = new Monster(data.type, data.x, data.y);
        monster.id = data.id;
        monster.hp = data.hp;
        
        this.engine.monsters.push(monster);
        this.engine.events.emit('monster_spawned', monster);
    }
    
    onMonsterDie(data) {
        // Смерть монстра
        const monster = this.engine.monsters.find(m => m.id === data.id);
        if (monster) {
            monster.alive = false;
            monster.hp = 0;
            
            if (data.killerId === this.localPlayerId && this.engine.player) {
                this.engine.player.addExp(data.exp);
                this.engine.player.gold += data.gold;
            }
            
            this.engine.events.emit('monster_died', { monster: monster, killer: data.killerId });
        }
    }
    
    onItemDrop(data) {
        // Предмет на земле
        this.engine.items.push({
            id: data.id,
            itemId: data.itemId,
            x: data.x,
            y: data.y,
            count: data.count
        });
    }
    
    onItemPickup(data) {
        // Подбор предмета другим игроком
        if (data.playerId === this.localPlayerId) {
            if (this.engine.player) {
                const item = new Item(data.itemId, data.count);
                this.engine.player.inventory.addItem(item);
                
                if (this.engine.hud) {
                    this.engine.hud.addNotification(`🎁 Вы подобрали ${item.name} x${data.count}`, '#88ff88');
                }
            }
        }
        
        // Удаление предмета с земли
        const index = this.engine.items.findIndex(i => i.id === data.id);
        if (index !== -1) {
            this.engine.items.splice(index, 1);
        }
    }
    
    onWorldData(data) {
        // Загрузка данных мира
        if (this.engine.world) {
            this.engine.world.loadFromData(data);
        }
        
        this.engine.events.emit('world_loaded', data);
    }
    
    onSync(data) {
        // Полная синхронизация состояния
        if (this.engine.player) {
            this.engine.player.hp = data.player.hp;
            this.engine.player.mp = data.player.mp;
            this.engine.player.x = data.player.x;
            this.engine.player.y = data.player.y;
            this.engine.player.level = data.player.level;
            this.engine.player.exp = data.player.exp;
            this.engine.player.gold = data.player.gold;
        }
        
        // Синхронизация монстров
        this.engine.monsters = data.monsters.map(m => {
            const monster = new Monster(m.type, m.x, m.y);
            monster.id = m.id;
            monster.hp = m.hp;
            monster.alive = m.alive;
            return monster;
        });
        
        // Синхронизация других игроков
        this.players.clear();
        for (const player of data.players) {
            if (player.id !== this.localPlayerId) {
                this.players.set(player.id, player);
            }
        }
        
        this.engine.events.emit('synced', data);
    }
    
    onPong(data) {
        this.ping = Date.now() - data.time;
        this.engine.events.emit('pong', { ping: this.ping });
    }
    
    onError(data) {
        console.error('Серверная ошибка:', data.message);
        this.engine.events.emit('server_error', data);
    }
    
    onChatMessage(data) {
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(data.sender, data.message, data.isSystem);
        }
    }
    
    onGuildMessage(data) {
        if (this.engine.hud && this.engine.player && this.engine.player.guild === data.guild) {
            this.engine.hud.addChatMessage(`[Гильдия] ${data.sender}`, data.message, false);
        }
    }
    
    onTradeRequest(data) {
        this.engine.events.emit('trade_request', {
            from: data.from,
            fromName: data.fromName
        });
    }
    
    onPartyInvite(data) {
        this.engine.events.emit('party_invite', {
            from: data.from,
            fromName: data.fromName
        });
    }
    
    // ========== ОТПРАВКА СОБЫТИЙ ==========
    
    sendMove(x, y, direction, moving) {
        this.send('move', {
            x: x,
            y: y,
            direction: direction,
            moving: moving
        });
    }
    
    sendAttack(targetId, damage) {
        this.send('attack', {
            targetId: targetId,
            damage: damage,
            timestamp: Date.now()
        });
    }
    
    sendSkill(skillId, targetId, position) {
        this.send('skill', {
            skillId: skillId,
            targetId: targetId,
            x: position?.x,
            y: position?.y,
            timestamp: Date.now()
        });
    }
    
    sendChat(message) {
        this.send('chat', {
            message: message,
            timestamp: Date.now()
        });
    }
    
    sendGuildChat(message) {
        this.send('guild_chat', {
            message: message,
            timestamp: Date.now()
        });
    }
    
    sendPickupItem(itemId) {
        this.send('pickup', {
            itemId: itemId
        });
    }
    
    sendDropItem(slot, count) {
        this.send('drop', {
            slot: slot,
            count: count
        });
    }
    
    sendTradeRequest(playerId) {
        this.send('trade_request', {
            targetId: playerId
        });
    }
    
    sendTradeAccept(playerId) {
        this.send('trade_accept', {
            targetId: playerId
        });
    }
    
    sendPartyInvite(playerId) {
        this.send('party_invite', {
            targetId: playerId
        });
    }
    
    sendPartyAccept(playerId) {
        this.send('party_accept', {
            targetId: playerId
        });
    }
    
    // ========== ПОЛУЧЕНИЕ ДАННЫХ ==========
    
    getPlayers() {
        return Array.from(this.players.values());
    }
    
    getPlayer(id) {
        return this.players.get(id);
    }
    
    getPlayersInRange(x, y, radius) {
        return this.getPlayers().filter(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
    }
    
    getPing() {
        return this.ping;
    }
    
    isConnected() {
        return this.connected;
    }
    
    getPlayerCount() {
        return this.players.size + 1;
    }
}

window.NetworkManager = NetworkManager;
