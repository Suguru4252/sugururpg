/**
 * Rucoy Online Clone - Полный HUD интерфейс
 * Версия: 1.0.0
 * Модуль: UI System
 * Строк: ~1300
 */

class HUD {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Состояние интерфейса
        this.visible = true;
        this.showInventory = false;
        this.showSkills = false;
        this.showQuests = false;
        this.showSettings = false;
        this.showChat = true;
        
        // Панели
        this.panels = {
            inventory: null,
            skills: null,
            quests: null,
            settings: null,
            chat: null
        };
        
        // Размеры UI
        this.uiScale = 1;
        this.padding = 10;
        
        // Анимации
        this.animations = {
            hpBar: 1,
            xpBar: 0,
            lastHp: 1,
            lastXp: 0
        };
        
        // Уведомления
        this.notifications = [];
        this.damageNumbers = [];
        
        // Чат
        this.chatMessages = [];
        this.chatInput = '';
        this.chatFocused = false;
        
        // Слоты инвентаря
        this.inventorySlots = 40;
        this.selectedSlot = -1;
        
        // Панель навыков
        this.skillBarSlots = 9;
        
        // Тултипы
        this.tooltip = null;
        this.tooltipTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupChat();
        this.updateLayout();
        
        window.addEventListener('resize', () => this.updateLayout());
    }
    
    setupEventListeners() {
        // События игры
        this.engine.events.on('playerDamaged', (data) => {
            this.addDamageNumber(data.damage, data.position, '#ff4444');
            this.updateHealthBar();
        });
        
        this.engine.events.on('playerHealed', (data) => {
            this.addDamageNumber(`+${data.amount}`, data.position, '#44ff44');
            this.updateHealthBar();
        });
        
        this.engine.events.on('playerLevelUp', (data) => {
            this.addNotification(`✨ УРОВЕНЬ ${data.level}! ✨`, '#ffaa44');
            this.updateStats();
        });
        
        this.engine.events.on('itemPicked', (item) => {
            this.addNotification(`🎁 Вы получили: ${item.name}`, '#88ff88');
        });
        
        this.engine.events.on('skillUsed', (data) => {
            this.addDamageNumber(data.skill.name, data.result.targets[0]?.target, '#88aaff');
        });
        
        // Клики по канвасу для UI
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Клавиши
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    setupChat() {
        // Создание элемента ввода чата (скрытый)
        this.chatInputElement = document.createElement('input');
        this.chatInputElement.type = 'text';
        this.chatInputElement.style.position = 'fixed';
        this.chatInputElement.style.bottom = '80px';
        this.chatInputElement.style.left = '20px';
        this.chatInputElement.style.width = '300px';
        this.chatInputElement.style.background = 'rgba(0,0,0,0.8)';
        this.chatInputElement.style.color = '#ffffff';
        this.chatInputElement.style.border = '1px solid #ffd966';
        this.chatInputElement.style.borderRadius = '8px';
        this.chatInputElement.style.padding = '8px';
        this.chatInputElement.style.fontFamily = 'monospace';
        this.chatInputElement.style.display = 'none';
        this.chatInputElement.style.zIndex = '1000';
        
        document.body.appendChild(this.chatInputElement);
        
        this.chatInputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
            if (e.key === 'Escape') {
                this.hideChatInput();
            }
        });
    }
    
    updateLayout() {
        // Адаптация под размер экрана
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.uiScale = Math.min(width / 1200, height / 800, 1);
        
        // Размеры элементов
        this.bottomBarHeight = 100 * this.uiScale;
        this.skillBarHeight = 60 * this.uiScale;
        this.chatWidth = 300 * this.uiScale;
        this.chatHeight = 200 * this.uiScale;
    }
    
    updateHealthBar() {
        const player = this.engine.player;
        if (!player) return;
        
        this.animations.lastHp = this.animations.hpBar;
        this.animations.hpBar = player.hp / player.maxHp;
    }
    
    updateStats() {
        const player = this.engine.player;
        if (!player) return;
        
        const needXP = 100 + (player.level - 1) * 50;
        this.animations.lastXp = this.animations.xpBar;
        this.animations.xpBar = player.xp / needXP;
    }
    
    addDamageNumber(text, position, color = '#ffaa44') {
        this.damageNumbers.push({
            text: typeof text === 'number' ? `-${Math.floor(text)}` : text,
            x: position?.x || 0,
            y: position?.y || 0,
            color: color,
            life: 1,
            velocity: { x: (Math.random() - 0.5) * 30, y: -40 }
        });
    }
    
    addNotification(message, color = '#ffd966') {
        this.notifications.push({
            message: message,
            color: color,
            life: 1
        });
    }
    
    addChatMessage(sender, message, isSystem = false) {
        this.chatMessages.push({
            sender: sender,
            message: message,
            isSystem: isSystem,
            time: Date.now()
        });
        
        // Ограничение истории
        while (this.chatMessages.length > 100) {
            this.chatMessages.shift();
        }
    }
    
    showChatInput() {
        this.chatFocused = true;
        this.chatInputElement.style.display = 'block';
        this.chatInputElement.focus();
        this.chatInputElement.value = '';
    }
    
    hideChatInput() {
        this.chatFocused = false;
        this.chatInputElement.style.display = 'none';
    }
    
    sendChatMessage() {
        const message = this.chatInputElement.value.trim();
        if (message) {
            this.addChatMessage('Вы', message);
            // Отправка на сервер (если есть)
            if (this.engine.network) {
                this.engine.network.sendChat(message);
            }
        }
        this.hideChatInput();
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // Проверка кликов по UI элементам
        if (this.checkInventoryClick(mouseX, mouseY)) return;
        if (this.checkSkillBarClick(mouseX, mouseY)) return;
        if (this.checkPanelButtons(mouseX, mouseY)) return;
        
        // Клик по чату
        if (this.showChat && mouseY > this.canvas.height - this.chatHeight - 10) {
            this.showChatInput();
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // Проверка ховера по слотам инвентаря
        this.checkInventoryHover(mouseX, mouseY);
        this.checkSkillBarHover(mouseX, mouseY);
    }
    
    handleKeyDown(e) {
        // Цифры 1-9 для навыков
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && !this.chatFocused) {
            const skillIndex = num - 1;
            if (this.engine.player && this.engine.player.skillManager) {
                this.engine.player.skillManager.useSkill(skillIndex, this.engine.getTargetedMonster());
            }
            e.preventDefault();
        }
        
        // I - инвентарь
        if (e.key === 'i' || e.key === 'I') {
            this.showInventory = !this.showInventory;
            e.preventDefault();
        }
        
        // K - навыки
        if (e.key === 'k' || e.key === 'K') {
            this.showSkills = !this.showSkills;
            e.preventDefault();
        }
        
        // Q - квесты
        if (e.key === 'q' || e.key === 'Q') {
            this.showQuests = !this.showQuests;
            e.preventDefault();
        }
        
        // Enter - чат
        if (e.key === 'Enter' && !this.chatFocused) {
            this.showChatInput();
            e.preventDefault();
        }
        
        // Esc - закрыть все панели
        if (e.key === 'Escape') {
            this.showInventory = false;
            this.showSkills = false;
            this.showQuests = false;
            this.showSettings = false;
            this.hideChatInput();
            e.preventDefault();
        }
    }
    
    checkInventoryClick(x, y) {
        if (!this.showInventory) return false;
        
        const invX = this.canvas.width - 320;
        const invY = 60;
        const slotSize = 48;
        
        for (let i = 0; i < this.inventorySlots; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const slotX = invX + 20 + col * (slotSize + 5);
            const slotY = invY + 60 + row * (slotSize + 5);
            
            if (x > slotX && x < slotX + slotSize && y > slotY && y < slotY + slotSize) {
                this.selectedSlot = i;
                return true;
            }
        }
        
        return false;
    }
    
    checkSkillBarClick(x, y) {
        const barX = this.canvas.width / 2 - (this.skillBarSlots * 52) / 2;
        const barY = this.canvas.height - 70;
        const slotWidth = 48;
        
        for (let i = 0; i < this.skillBarSlots; i++) {
            const slotX = barX + i * (slotWidth + 8);
            const slotY = barY;
            
            if (x > slotX && x < slotX + slotWidth && y > slotY && y < slotY + slotWidth) {
                if (this.engine.player && this.engine.player.skillManager) {
                    this.engine.player.skillManager.useSkill(i, this.engine.getTargetedMonster());
                }
                return true;
            }
        }
        
        return false;
    }
    
    checkPanelButtons(x, y) {
        // Кнопки инвентаря, навыков и т.д.
        const buttonX = 10;
        const buttonY = this.canvas.height - 50;
        const buttonWidth = 40;
        
        // Инвентарь
        if (x > buttonX && x < buttonX + buttonWidth && y > buttonY && y < buttonY + buttonWidth) {
            this.showInventory = !this.showInventory;
            return true;
        }
        
        return false;
    }
    
    checkInventoryHover(x, y) {
        // Поиск слота для тултипа
        // Аналогично checkInventoryClick, но без выбора
    }
    
    checkSkillBarHover(x, y) {
        // Поиск навыка для тултипа
    }
    
    update(deltaTime) {
        // Обновление анимаций
        this.animations.hpBar += (this.animations.lastHp - this.animations.hpBar) * 0.1;
        this.animations.xpBar += (this.animations.lastXp - this.animations.xpBar) * 0.1;
        
        // Обновление уведомлений
        for (let i = 0; i < this.notifications.length; i++) {
            this.notifications[i].life -= deltaTime;
            if (this.notifications[i].life <= 0) {
                this.notifications.splice(i, 1);
                i--;
            }
        }
        
        // Обновление цифр урона
        for (let i = 0; i < this.damageNumbers.length; i++) {
            const dn = this.damageNumbers[i];
            dn.life -= deltaTime;
            dn.x += dn.velocity.x * deltaTime;
            dn.y += dn.velocity.y * deltaTime;
            
            if (dn.life <= 0) {
                this.damageNumbers.splice(i, 1);
                i--;
            }
        }
    }
    
    render() {
        if (!this.visible) return;
        
        this.renderBottomBar();
        this.renderSkillBar();
        this.renderChat();
        
        if (this.showInventory) this.renderInventory();
        if (this.showSkills) this.renderSkillsPanel();
        if (this.showQuests) this.renderQuestsPanel();
        
        this.renderNotifications();
        this.renderDamageNumbers();
        this.renderTooltip();
    }
    
    renderBottomBar() {
        const player = this.engine.player;
        if (!player) return;
        
        const barHeight = 80;
        const barY = this.canvas.height - barHeight;
        
        // Фон
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(0, barY, this.canvas.width, barHeight);
        
        // Статы слева
        const statX = 20;
        const statY = barY + 15;
        
        // Имя и уровень
        this.ctx.font = `bold ${16 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffd966';
        this.ctx.fillText(`${player.name} (Lv.${player.level})`, statX, statY);
        
        // Класс
        const classNames = { knight: 'Рыцарь', archer: 'Лучник', mage: 'Маг' };
        this.ctx.font = `${14 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#88aaff';
        this.ctx.fillText(classNames[player.class], statX, statY + 20);
        
        // HP Бар
        const hpBarX = statX;
        const hpBarY = statY + 35;
        const hpBarWidth = 250;
        const hpBarHeight = 20;
        
        this.ctx.fillStyle = '#3a1f1f';
        this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        this.ctx.fillStyle = '#d44a4a';
        this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth * this.animations.hpBar, hpBarHeight);
        
        this.ctx.font = `${12 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            `${Math.floor(player.hp)}/${player.maxHp} HP`,
            hpBarX + 10,
            hpBarY + 15
        );
        
        // XP Бар
        const needXP = 100 + (player.level - 1) * 50;
        const xpPercent = player.xp / needXP;
        
        const xpBarX = statX;
        const xpBarY = hpBarY + 28;
        const xpBarWidth = 250;
        const xpBarHeight = 8;
        
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
        this.ctx.fillStyle = '#6a9eff';
        this.ctx.fillRect(xpBarX, xpBarY, xpBarWidth * xpPercent, xpBarHeight);
        
        this.ctx.font = `${10 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText(`XP: ${player.xp}/${needXP}`, xpBarX + 5, xpBarY + 7);
        
        // Золото справа
        const goldX = this.canvas.width - 150;
        this.ctx.font = `${18 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffd966';
        this.ctx.fillText(`💰 ${player.gold}`, goldX, statY + 15);
        
        // Кнопки панелей
        const buttonY = barY + 10;
        this.renderPanelButton(10, buttonY, '🎒', this.showInventory, 'Инвентарь (I)');
        this.renderPanelButton(60, buttonY, '⚡', this.showSkills, 'Навыки (K)');
        this.renderPanelButton(110, buttonY, '📜', this.showQuests, 'Квесты (Q)');
        this.renderPanelButton(160, buttonY, '⚙️', this.showSettings, 'Настройки');
    }
    
    renderPanelButton(x, y, icon, active, tooltip) {
        const size = 40;
        
        this.ctx.fillStyle = active ? 'rgba(100,80,50,0.9)' : 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.strokeStyle = '#ffd966';
        this.ctx.strokeRect(x, y, size, size);
        
        this.ctx.font = `${24 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(icon, x + 8, y + 32);
        
        // Тултип при ховере
    }
    
    renderSkillBar() {
        if (!this.engine.player || !this.engine.player.skillManager) return;
        
        const skillManager = this.engine.player.skillManager;
        const barX = this.canvas.width / 2 - (this.skillBarSlots * 52) / 2;
        const barY = this.canvas.height - 70;
        const slotWidth = 48;
        const slotHeight = 48;
        
        for (let i = 0; i < this.skillBarSlots; i++) {
            const slotX = barX + i * (slotWidth + 8);
            const skill = skillManager.skillBar[i];
            
            // Фон слота
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(slotX, barY, slotWidth, slotHeight);
            this.ctx.strokeStyle = '#ffd966';
            this.ctx.strokeRect(slotX, barY, slotWidth, slotHeight);
            
            if (skill) {
                // Иконка
                this.ctx.font = `${28 * this.uiScale}px monospace`;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(skill.icon, slotX + 10, barY + 38);
                
                // Кулдаун
                if (skill.currentCooldown > 0) {
                    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
                    this.ctx.fillRect(slotX, barY, slotWidth, slotHeight);
                    
                    this.ctx.font = `bold ${14 * this.uiScale}px monospace`;
                    this.ctx.fillStyle = '#ffaa44';
                    this.ctx.fillText(
                        skill.currentCooldown.toFixed(1),
                        slotX + 12,
                        barY + 32
                    );
                }
                
                // Номер
                this.ctx.font = `${10 * this.uiScale}px monospace`;
                this.ctx.fillStyle = '#aaaaaa';
                this.ctx.fillText(`${i + 1}`, slotX + 4, barY + 15);
                
                // Стоимость маны
                this.ctx.font = `${8 * this.uiScale}px monospace`;
                this.ctx.fillStyle = '#88aaff';
                this.ctx.fillText(`${skill.manaCost}`, slotX + 32, barY + 45);
            }
        }
    }
    
    renderInventory() {
        const player = this.engine.player;
        if (!player) return;
        
        const panelX = this.canvas.width - 340;
        const panelY = 60;
        const panelWidth = 320;
        const panelHeight = 450;
        
        // Фон панели
        this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#ffd966';
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Заголовок
        this.ctx.font = `bold ${16 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffd966';
        this.ctx.fillText('ИНВЕНТАРЬ', panelX + 10, panelY + 30);
        
        // Слоты
        const slotSize = 48;
        const cols = 8;
        const startX = panelX + 20;
        const startY = panelY + 60;
        
        for (let i = 0; i < this.inventorySlots; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const slotX = startX + col * (slotSize + 5);
            const slotY = startY + row * (slotSize + 5);
            
            // Рамка слота
            this.ctx.fillStyle = this.selectedSlot === i ? 'rgba(100,80,50,0.8)' : 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(slotX, slotY, slotSize, slotSize);
            this.ctx.strokeStyle = '#ffd966';
            this.ctx.strokeRect(slotX, slotY, slotSize, slotSize);
            
            // Предмет
            const item = player.inventory.getItem(i);
            if (item) {
                this.ctx.font = `${28 * this.uiScale}px monospace`;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(item.icon, slotX + 10, slotY + 38);
                
                if (item.count > 1) {
                    this.ctx.font = `${10 * this.uiScale}px monospace`;
                    this.ctx.fillStyle = '#cccccc';
                    this.ctx.fillText(`x${item.count}`, slotX + 30, slotY + 45);
                }
            }
        }
        
        // Экипировка
        const equipX = panelX + 10;
        const equipY = startY + 400;
        
        this.ctx.font = `${12 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffd966';
        this.ctx.fillText('ЭКИПИРОВКА', equipX, equipY);
        
        // Оружие
        if (player.equipment.weapon) {
            this.ctx.font = `${20 * this.uiScale}px monospace`;
            this.ctx.fillText(player.equipment.weapon.icon, equipX + 10, equipY + 35);
            this.ctx.font = `${10 * this.uiScale}px monospace`;
            this.ctx.fillText(player.equipment.weapon.name, equipX + 40, equipY + 32);
        }
    }
    
    renderSkillsPanel() {
        const player = this.engine.player;
        if (!player || !player.skillManager) return;
        
        const panelX = this.canvas.width / 2 - 250;
        const panelY = 60;
        const panelWidth = 500;
        const panelHeight = 400;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#ffd966';
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        this.ctx.font = `bold ${16 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffd966';
        this.ctx.fillText('НАВЫКИ', panelX + 10, panelY + 30);
        
        const skills = player.skillManager.getAvailableSkills();
        let y = panelY + 60;
        
        for (const skill of skills) {
            this.ctx.font = `${14 * this.uiScale}px monospace`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`${skill.icon} ${skill.name} (Lv.${skill.level})`, panelX + 20, y);
            this.ctx.font = `${10 * this.uiScale}px monospace`;
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText(skill.description, panelX + 40, y + 15);
            y += 45;
        }
        
        // Очки навыков
        this.ctx.font = `${12 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#88ff88';
        this.ctx.fillText(`Очки навыков: ${player.skillManager.skillPoints}`, panelX + 10, y + 10);
    }
    
    renderQuestsPanel() {
        const panelX = 20;
        const panelY = 60;
        const panelWidth = 300;
        const panelHeight = 300;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#ffd966';
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        this.ctx.font = `bold ${14 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#ffd966';
        this.ctx.fillText('АКТИВНЫЕ КВЕСТЫ', panelX + 10, panelY + 30);
        
        // Заглушка для квестов
        this.ctx.font = `${12 * this.uiScale}px monospace`;
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText('Нет активных квестов', panelX + 20, panelY + 80);
    }
    
    renderChat() {
        if (!this.showChat) return;
        
        const chatX = 20;
        const chatY = this.canvas.height - this.chatHeight - 10;
        const chatWidth = this.chatWidth;
        const chatHeight = this.chatHeight;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(chatX, chatY, chatWidth, chatHeight);
        this.ctx.strokeStyle = '#ffd966';
        this.ctx.strokeRect(chatX, chatY, chatWidth, chatHeight);
        
        let y = chatY + 20;
        const messages = this.chatMessages.slice(-8);
        
        for (const msg of messages) {
            this.ctx.font = `${11 * this.uiScale}px monospace`;
            this.ctx.fillStyle = msg.isSystem ? '#88ff88' : '#ffffff';
            this.ctx.fillText(
                `${msg.sender}: ${msg.message}`,
                chatX + 10,
                y
            );
            y += 18;
        }
        
        if (this.chatFocused) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.ctx.fillRect(chatX + 5, y, chatWidth - 10, 20);
            this.ctx.font = `${11 * this.uiScale}px monospace`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.chatInputElement.value + '_', chatX + 10, y + 15);
        }
    }
    
    renderNotifications() {
        let y = 100;
        for (const notif of this.notifications) {
            const alpha = Math.min(1, notif.life * 2);
            this.ctx.font = `${14 * this.uiScale}px monospace`;
            this.ctx.fillStyle = notif.color;
            this.ctx.shadowBlur = 2;
            this.ctx.shadowColor = '#000000';
            this.ctx.fillText(notif.message, this.canvas.width / 2 - 100, y);
            this.ctx.shadowBlur = 0;
            y += 30;
        }
    }
    
    renderDamageNumbers() {
        const camera = this.engine.camera;
        
        for (const dn of this.damageNumbers) {
            const alpha = Math.min(1, dn.life * 2);
            const screenX = dn.x - camera.x;
            const screenY = dn.y - camera.y;
            
            this.ctx.font = `bold ${20 * (1 - dn.life * 0.5)}px monospace`;
            this.ctx.fillStyle = dn.color;
            this.ctx.shadowBlur = 2;
            this.ctx.shadowColor = '#000000';
            this.ctx.fillText(dn.text, screenX, screenY);
            this.ctx.shadowBlur = 0;
        }
    }
    
    renderTooltip() {
        if (!this.tooltip) return;
        
        const x = this.tooltip.x + 15;
        const y = this.tooltip.y + 15;
        const lines = this.tooltip.text.split('\n');
        const maxWidth = 200;
        const lineHeight = 16;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
        this.ctx.fillRect(x, y, maxWidth, lines.length * lineHeight + 10);
        this.ctx.strokeStyle = '#ffd966';
        this.ctx.strokeRect(x, y, maxWidth, lines.length * lineHeight + 10);
        
        for (let i = 0; i < lines.length; i++) {
            this.ctx.font = `${11 * this.uiScale}px monospace`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(lines[i], x + 5, y + 15 + i * lineHeight);
        }
    }
}

window.HUD = HUD;
