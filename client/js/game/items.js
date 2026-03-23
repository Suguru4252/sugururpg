/**
 * Rucoy Online Clone - Система предметов
 * Версия: 1.0.0
 * Модуль: Items Database & Equipment System
 * Строк: ~1800
 */

// База данных всех предметов
const ITEMS_DB = {
    // ========== ОРУЖИЕ ==========
    // Деревянное оружие (уровень 1)
    wooden_sword: {
        id: 'wooden_sword',
        name: 'Деревянный Меч',
        type: 'weapon',
        subtype: 'sword',
        level: 1,
        damage: 8,
        attackSpeed: 1.0,
        price: 50,
        rarity: 'common',
        description: 'Простой деревянный меч для начинающих',
        icon: '⚔️',
        sellable: true,
        tradeable: true,
        classes: ['knight']
    },
    
    wooden_bow: {
        id: 'wooden_bow',
        name: 'Деревянный Лук',
        type: 'weapon',
        subtype: 'bow',
        level: 1,
        damage: 6,
        attackSpeed: 1.2,
        range: 150,
        price: 45,
        rarity: 'common',
        description: 'Простой лук для охоты',
        icon: '🏹',
        sellable: true,
        tradeable: true,
        classes: ['archer']
    },
    
    wooden_staff: {
        id: 'wooden_staff',
        name: 'Деревянный Посох',
        type: 'weapon',
        subtype: 'staff',
        level: 1,
        damage: 7,
        attackSpeed: 1.1,
        manaCost: 0,
        price: 55,
        rarity: 'common',
        description: 'Посох начинающего мага',
        icon: '🔮',
        sellable: true,
        tradeable: true,
        classes: ['mage']
    },
    
    // Железное оружие (уровень 5)
    iron_sword: {
        id: 'iron_sword',
        name: 'Железный Меч',
        type: 'weapon',
        subtype: 'sword',
        level: 5,
        damage: 15,
        attackSpeed: 1.0,
        price: 200,
        rarity: 'common',
        description: 'Надежный железный меч',
        icon: '⚔️',
        sellable: true,
        tradeable: true,
        classes: ['knight']
    },
    
    iron_bow: {
        id: 'iron_bow',
        name: 'Железный Лук',
        type: 'weapon',
        subtype: 'bow',
        level: 5,
        damage: 12,
        attackSpeed: 1.2,
        range: 160,
        price: 180,
        rarity: 'common',
        description: 'Усиленный железом лук',
        icon: '🏹',
        sellable: true,
        tradeable: true,
        classes: ['archer']
    },
    
    iron_staff: {
        id: 'iron_staff',
        name: 'Железный Посох',
        type: 'weapon',
        subtype: 'staff',
        level: 5,
        damage: 14,
        attackSpeed: 1.1,
        manaRegen: 2,
        price: 220,
        rarity: 'common',
        description: 'Посох с железным наконечником',
        icon: '🔮',
        sellable: true,
        tradeable: true,
        classes: ['mage']
    },
    
    // Стальное оружие (уровень 10)
    steel_sword: {
        id: 'steel_sword',
        name: 'Стальной Меч',
        type: 'weapon',
        subtype: 'sword',
        level: 10,
        damage: 24,
        attackSpeed: 1.0,
        critChance: 0.05,
        price: 500,
        rarity: 'uncommon',
        description: 'Прочный стальной меч',
        icon: '⚔️',
        sellable: true,
        tradeable: true,
        classes: ['knight']
    },
    
    // Мифриловое оружие (уровень 20)
    mithril_sword: {
        id: 'mithril_sword',
        name: 'Мифриловый Меч',
        type: 'weapon',
        subtype: 'sword',
        level: 20,
        damage: 38,
        attackSpeed: 0.9,
        critChance: 0.08,
        critDamage: 1.6,
        price: 1500,
        rarity: 'rare',
        description: 'Легкий и острый мифриловый клинок',
        icon: '⚔️',
        sellable: true,
        tradeable: true,
        classes: ['knight']
    },
    
    // Эльфийский лук (уровень 20)
    elven_bow: {
        id: 'elven_bow',
        name: 'Эльфийский Лук',
        type: 'weapon',
        subtype: 'bow',
        level: 20,
        damage: 32,
        attackSpeed: 1.1,
        range: 180,
        critChance: 0.1,
        price: 1600,
        rarity: 'rare',
        description: 'Легендарный лук эльфийских мастеров',
        icon: '🏹',
        sellable: true,
        tradeable: true,
        classes: ['archer']
    },
    
    // Посох архимага (уровень 25)
    archmage_staff: {
        id: 'archmage_staff',
        name: 'Посох Архимага',
        type: 'weapon',
        subtype: 'staff',
        level: 25,
        damage: 42,
        attackSpeed: 1.0,
        manaRegen: 5,
        manaMax: 50,
        price: 2500,
        rarity: 'epic',
        description: 'Мощный посох, усиливающий магию',
        icon: '🔮',
        sellable: true,
        tradeable: true,
        classes: ['mage']
    },
    
    // Драконье оружие (уровень 30)
    dragon_sword: {
        id: 'dragon_sword',
        name: 'Драконий Меч',
        type: 'weapon',
        subtype: 'sword',
        level: 30,
        damage: 55,
        attackSpeed: 0.85,
        critChance: 0.12,
        critDamage: 1.8,
        fireDamage: 10,
        price: 5000,
        rarity: 'epic',
        description: 'Меч, выкованный из драконьей чешуи',
        icon: '⚔️',
