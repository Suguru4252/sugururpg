#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import logging
import aiohttp
import sqlite3
import urllib.parse
import random
from datetime import datetime, date, timedelta
from typing import Dict, Optional, List
from contextlib import contextmanager

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    InlineKeyboardButton, InlineKeyboardMarkup,
    ReplyKeyboardMarkup, KeyboardButton,
    CallbackQuery, BufferedInputFile
)
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

# ========== ТВОИ ДАННЫЕ ==========
BOT_TOKEN = "8703891124:AAGYfu1MsclMc8e4ulVOTdNy-j1TbJN3CDc"
CREATOR_ID = 5596589260  # Ты - создатель
CREATOR_USERNAME = "BrainMozer19"  # Твой юзернейм

# ========== НАСТРОЙКИ ==========
DAILY_LIMIT = 5  # 5 фото в день для обычных пользователей
UNLIMITED_VALUE = 999999  # Для админов - без лимита

# ========== НАСТРОЙКА ЛОГИРОВАНИЯ ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========== БАЗА ДАННЫХ ==========
class Database:
    def __init__(self, db_name: str = "bot_database.db"):
        self.db_name = db_name
        self.init_db()
    
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Таблица пользователей
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_admin INTEGER DEFAULT 0,
                    unlimited_until DATE DEFAULT NULL,
                    total_generations INTEGER DEFAULT 0
                )
            ''')
            
            # Таблица статистики по дням
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS daily_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    date TEXT,
                    count INTEGER DEFAULT 0,
                    UNIQUE(user_id, date)
                )
            ''')
            
            # Добавляем создателя
            cursor.execute(
                "INSERT OR IGNORE INTO users (user_id, username, is_admin) VALUES (?, ?, ?)",
                (CREATOR_ID, CREATOR_USERNAME, 1)
            )
            conn.commit()
    
    def get_user(self, user_id: int, username: str = None, first_name: str = None) -> dict:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            
            if not row:
                cursor.execute(
                    "INSERT INTO users (user_id, username, first_name) VALUES (?, ?, ?)",
                    (user_id, username, first_name)
                )
                conn.commit()
                cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()
            else:
                # Обновляем username если изменился
                if username:
                    cursor.execute(
                        "UPDATE users SET username = ? WHERE user_id = ?",
                        (username, user_id)
                    )
                    conn.commit()
            
            return dict(row)
    
    def get_daily_count(self, user_id: int) -> int:
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT count FROM daily_stats WHERE user_id = ? AND date = ?",
                (user_id, today)
            )
            row = cursor.fetchone()
            return row['count'] if row else 0
    
    def increment_daily_count(self, user_id: int):
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO daily_stats (user_id, date, count) 
                VALUES (?, ?, 1)
                ON CONFLICT(user_id, date) 
                DO UPDATE SET count = count + 1
            ''', (user_id, today))
            
            cursor.execute(
                "UPDATE users SET total_generations = total_generations + 1 WHERE user_id = ?",
                (user_id,)
            )
            conn.commit()
    
    def get_remaining_limit(self, user_id: int) -> int:
        """Возвращает сколько осталось генераций сегодня"""
        user = self.get_user(user_id)
        
        # Если админ - без лимита
        if user['is_admin'] == 1:
            return UNLIMITED_VALUE
        
        # Проверяем unlimited_until
        if user['unlimited_until']:
            unlimited_date = datetime.strptime(user['unlimited_until'], '%Y-%m-%d').date()
            if unlimited_date >= date.today():
                return UNLIMITED_VALUE
        
        # Обычный лимит
        today_count = self.get_daily_count(user_id)
        return max(0, DAILY_LIMIT - today_count)
    
    def is_admin(self, user_id: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT is_admin FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            return row and row['is_admin'] == 1
    
    def add_admin(self, admin_id: int, added_by: int) -> bool:
        """Добавляет нового админа"""
        if not self.is_admin(added_by) and added_by != CREATOR_ID:
            return False
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET is_admin = 1 WHERE user_id = ?",
                (admin_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
    
    def remove_admin(self, admin_id: int, removed_by: int) -> bool:
        """Удаляет админа (только создатель может)"""
        if removed_by != CREATOR_ID:
            return False
        if admin_id == CREATOR_ID:
            return False  # Нельзя удалить создателя
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET is_admin = 0 WHERE user_id = ?",
                (admin_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
    
    def give_unlimited(self, user_id: int, days: int = 30, given_by: int = None) -> bool:
        """Выдает безлимит на определенное количество дней"""
        if given_by and not self.is_admin(given_by) and given_by != CREATOR_ID:
            return False
        
        unlimited_date = (date.today() + timedelta(days=days)).isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET unlimited_until = ? WHERE user_id = ?",
                (unlimited_date, user_id)
            )
            conn.commit()
            return cursor.rowcount > 0
    
    def get_all_admins(self) -> List[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_id, username FROM users WHERE is_admin = 1")
            return [dict(row) for row in cursor.fetchall()]

# Инициализация базы
db = Database()

# ========== СОСТОЯНИЯ FSM ==========
class GenerationStates(StatesGroup):
    waiting_for_prompt = State()

# ========== ИНИЦИАЛИЗАЦИЯ БОТА ==========
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# ========== ФУНКЦИИ ГЕНЕРАЦИИ ==========
async def generate_image(prompt: str) -> Optional[bytes]:
    """Генерация изображения через Pollinations API (без фильтров)"""
    try:
        # Добавляем параметры для лучшего качества
        enhanced_prompt = f"{prompt}, highly detailed, 8k, professional"
        encoded = urllib.parse.quote(enhanced_prompt)
        
        # Используем разные модели для разнообразия
        models = ["flux", "stable-diffusion", "pixart", "sdxl"]
        model = random.choice(models)
        
        # Формируем URL
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&model={model}"
        
        logger.info(f"Генерация: {prompt[:50]}... (модель: {model})")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=60) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    logger.error(f"Ошибка API: {response.status}")
                    
                    # Пробуем запасной вариант
                    backup_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"
                    async with session.get(backup_url, timeout=60) as backup_response:
                        if backup_response.status == 200:
                            return await backup_response.read()
                        return None
    except Exception as e:
        logger.error(f"Ошибка генерации: {e}")
        return None

# ========== КЛАВИАТУРЫ ==========
def get_main_keyboard(user_id: int = None) -> ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎨 Сгенерировать"))
    builder.add(KeyboardButton(text="📊 Мой лимит"))
    builder.add(KeyboardButton(text="ℹ️ Помощь"))
    
    if user_id and (db.is_admin(user_id) or user_id == CREATOR_ID):
        builder.add(KeyboardButton(text="👑 Админ панель"))
    
    builder.adjust(2, 1, 1)
    return builder.as_markup(resize_keyboard=True)

def get_cancel_keyboard() -> ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="❌ Отмена"))
    return builder.as_markup(resize_keyboard=True)

def get_limit_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура для снятия лимита"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(
        text="💎 Снять лимит (связаться с @BrainMozer19)",
        url=f"https://t.me/{CREATOR_USERNAME}"
    ))
    return builder.as_markup()

def get_admin_keyboard() -> InlineKeyboardMarkup:
    """Админская клавиатура"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(
        text="👥 Список админов",
        callback_data="admin_list"
    ))
    builder.add(InlineKeyboardButton(
        text="📊 Статистика бота",
        callback_data="admin_stats"
    ))
    builder.add(InlineKeyboardButton(
        text="🔙 Назад",
        callback_data="back_to_menu"
    ))
    builder.adjust(1)
    return builder.as_markup()

# ========== КОМАНДЫ ==========
@dp.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    
    await state.clear()
    
    # Регистрируем пользователя
    user = db.get_user(user_id, username, first_name)
    
    welcome_text = (
        f"👋 Привет, {first_name}!\n\n"
        f"Я бот для генерации изображений по тексту.\n"
        f"Могу создать ЛЮБУЮ картинку, даже 18+ 🔞\n\n"
        f"📌 **Лимиты:**\n"
        f"• {DAILY_LIMIT} бесплатных фото в день\n"
        f"• Лимит обновляется каждый день\n"
        f"• Чтобы снять лимит - нажми кнопку ниже\n\n"
        f"🎨 Нажми /generate или кнопку 'Сгенерировать'"
    )
    
    await message.answer(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_main_keyboard(user_id)
    )

@dp.message(Command("help"))
async def cmd_help(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    help_text = (
        "ℹ️ **Помощь по боту**\n\n"
        "**Как пользоваться:**\n"
        "1️⃣ Нажми /generate или кнопку 'Сгенерировать'\n"
        "2️⃣ Отправь описание того, что хочешь увидеть\n"
        "3️⃣ Подожди 10-20 секунд\n"
        "4️⃣ Получи готовое изображение!\n\n"
        "**Примеры запросов:**\n"
        "• черный кот в очках\n"
        "• космический корабль\n"
        "• аниме девушка\n"
        "• киберпанк город\n"
        "• 18+ контент тоже работает\n\n"
        "**Лимиты:**\n"
        f"• {DAILY_LIMIT} фото в день бесплатно\n"
        "• Каждый день лимит обновляется\n"
        "• Чтобы снять лимит - нажми 'Мой лимит'\n\n"
        f"👑 Создатель: @{CREATOR_USERNAME}"
    )
    
    await message.answer(help_text, parse_mode="Markdown")

@dp.message(Command("generate"))
async def cmd_generate(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    # Проверяем лимит
    remaining = db.get_remaining_limit(user_id)
    
    if remaining <= 0:
        await message.answer(
            f"❌ **У вас закончился лимит на сегодня!**\n\n"
            f"Сегодня вы использовали все {DAILY_LIMIT} генераций.\n"
            f"Завтра лимит обновится автоматически.\n\n"
            f"💎 **Хотите снять лимит?**\n"
            f"Напишите @{CREATOR_USERNAME} для покупки подписки!",
            parse_mode="Markdown",
            reply_markup=get_limit_keyboard()
        )
        return
    
    await message.answer(
        "🎨 **Отправь описание:**\n\n"
        "Напиши, что хочешь увидеть на картинке.\n"
        "Можно использовать любые слова, даже 18+.\n\n"
        f"📊 Осталось сегодня: {remaining}/{DAILY_LIMIT}",
        parse_mode="Markdown",
        reply_markup=get_cancel_keyboard()
    )
    await state.set_state(GenerationStates.waiting_for_prompt)

@dp.message(F.text == "🎨 Сгенерировать")
async def button_generate(message: types.Message, state: FSMContext):
    await cmd_generate(message, state)

@dp.message(F.text == "📊 Мой лимит")
async def button_limit(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    remaining = db.get_remaining_limit(user_id)
    user = db.get_user(user_id)
    
    if remaining == UNLIMITED_VALUE:
        limit_text = (
            "✅ **У вас БЕЗЛИМИТНЫЙ доступ!**\n\n"
            "Вы можете генерировать сколько угодно фото.\n\n"
            "Спасибо за поддержку! 🙏"
        )
    else:
        limit_text = (
            f"📊 **Ваш лимит:**\n\n"
            f"• Всего в день: {DAILY_LIMIT} фото\n"
            f"• Осталось сегодня: **{remaining}**\n"
            f"• Использовано: {DAILY_LIMIT - remaining}\n\n"
            f"💎 **Хотите больше?**\n"
            f"Напишите @{CREATOR_USERNAME} для снятия лимита!"
        )
    
    await message.answer(
        limit_text,
        parse_mode="Markdown",
        reply_markup=get_limit_keyboard() if remaining != UNLIMITED_VALUE else None
    )

@dp.message(F.text == "ℹ️ Помощь")
async def button_help(message: types.Message, state: FSMContext):
    await cmd_help(message, state)

@dp.message(F.text == "👑 Админ панель")
async def button_admin(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ У вас нет доступа к админ панели.")
        return
    
    admin_text = (
        "👑 **Админ панель**\n\n"
        "**Команды:**\n"
        "• /addadmin @username - добавить админа\n"
        "• /removeadmin @username - удалить админа\n"
        "• /unlimit @username [дни] - выдать безлимит\n"
        "• /stats - статистика бота\n"
        "• /broadcast - рассылка (в разработке)"
    )
    
    await message.answer(
        admin_text,
        parse_mode="Markdown",
        reply_markup=get_admin_keyboard()
    )

@dp.message(F.text == "❌ Отмена")
async def button_cancel(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Действие отменено.",
        reply_markup=get_main_keyboard(message.from_user.id)
    )

# ========== КОМАНДЫ АДМИНОВ ==========
@dp.message(Command("addadmin"))
async def cmd_add_admin(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    
    # Только админы и создатель
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет прав!")
        return
    
    args = message.text.split()
    if len(args) < 2:
        await message.answer("❌ Использование: /addadmin @username")
        return
    
    username = args[1].replace('@', '')
    
    # Ищем пользователя по username
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if not row:
            await message.answer(f"❌ Пользователь @{username} не найден в базе!")
            return
        
        target_id = row['user_id']
        
        if db.add_admin(target_id, user_id):
            await message.answer(f"✅ Пользователь @{username} теперь админ!")
            
            # Уведомляем нового админа
            try:
                await bot.send_message(
                    target_id,
                    f"✅ Вам выданы права администратора бота!"
                )
            except:
                pass
        else:
            await message.answer("❌ Не удалось добавить админа")

@dp.message(Command("unlimit"))
async def cmd_unlimit(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет прав!")
        return
    
    args = message.text.split()
    if len(args) < 2:
        await message.answer("❌ Использование: /unlimit @username [дни]")
        return
    
    username = args[1].replace('@', '')
    days = 30  # по умолчанию 30 дней
    
    if len(args) >= 3:
        try:
            days = int(args[2])
        except:
            pass
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if not row:
            await message.answer(f"❌ Пользователь @{username} не найден!")
            return
        
        target_id = row['user_id']
        
        if db.give_unlimited(target_id, days, user_id):
            unlimited_until = (date.today() + timedelta(days=days)).isoformat()
            await message.answer(
                f"✅ @{username} получил безлимит на {days} дней!\n"
                f"📅 Действует до: {unlimited_until}"
            )
            
            try:
                await bot.send_message(
                    target_id,
                    f"🎉 **Поздравляем!**\n\n"
                    f"Вам выдан безлимитный доступ на {days} дней!\n"
                    f"Теперь можно генерировать сколько угодно фото.",
                    parse_mode="Markdown"
                )
            except:
                pass
        else:
            await message.answer("❌ Не удалось выдать безлимит")

# ========== ОБРАБОТКА ПРОМПТА ==========
@dp.message(GenerationStates.waiting_for_prompt)
async def process_prompt(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    
    # Обновляем пользователя
    db.get_user(user_id, username, first_name)
    
    # Проверяем лимит
    remaining = db.get_remaining_limit(user_id)
    
    if remaining <= 0:
        await state.clear()
        await message.answer(
            f"❌ **У вас закончился лимит на сегодня!**\n\n"
            f"Сегодня вы использовали все {DAILY_LIMIT} генераций.\n"
            f"Завтра лимит обновится автоматически.\n\n"
            f"💎 **Хотите снять лимит?**\n"
            f"Напишите @{CREATOR_USERNAME} для покупки подписки!",
            parse_mode="Markdown",
            reply_markup=get_limit_keyboard()
        )
        return
    
    prompt = message.text
    
    if len(prompt) < 3:
        await message.answer("❌ Слишком коротко. Опиши подробнее (минимум 3 символа):")
        return
    
    if len(prompt) > 1000:
        await message.answer("❌ Слишком длинно. Максимум 1000 символов.")
        return
    
    # Отправляем сообщение о начале генерации
    wait_msg = await message.answer(
        f"🎨 **Генерация...**\n\n"
        f"Промпт: _{prompt[:100]}{'...' if len(prompt) > 100 else ''}_\n\n"
        f"⏳ Подожди 10-20 секунд\n"
        f"📊 Осталось сегодня: {remaining-1}/{DAILY_LIMIT}",
        parse_mode="Markdown"
    )
    
    # Генерируем
    image_bytes = await generate_image(prompt)
    
    if image_bytes:
        try:
            await message.answer_photo(
                photo=BufferedInputFile(
                    file=image_bytes,
                    filename="generated.jpg"
                ),
                caption=(
                    f"✅ **Готово!**\n\n"
                    f"🎨 Промпт: {prompt}\n"
                    f"📊 Осталось сегодня: {remaining-1}/{DAILY_LIMIT}"
                ),
                parse_mode="Markdown"
            )
            
            # Увеличиваем счетчик
            db.increment_daily_count(user_id)
            
            await wait_msg.delete()
            
        except Exception as e:
            logger.error(f"Ошибка отправки: {e}")
            await message.answer(
                "❌ Ошибка при отправке.",
                reply_markup=get_main_keyboard(user_id)
            )
    else:
        await message.answer(
            "❌ Не удалось сгенерировать. Попробуй другой промпт.",
            reply_markup=get_main_keyboard(user_id)
        )
        await wait_msg.delete()
    
    await state.clear()

# ========== CALLBACKS ==========
@dp.callback_query(F.data == "admin_list")
async def callback_admin_list(callback: CallbackQuery):
    if not db.is_admin(callback.from_user.id) and callback.from_user.id != CREATOR_ID:
        await callback.answer("❌ Нет доступа!")
        return
    
    admins = db.get_all_admins()
    
    text = "👑 **Список админов:**\n\n"
    for admin in admins:
        if admin['user_id'] == CREATOR_ID:
            text += f"• {admin['username'] or admin['user_id']} (создатель) 👑\n"
        else:
            text += f"• {admin['username'] or admin['user_id']}\n"
    
    await callback.message.edit_text(text, parse_mode="Markdown")
    await callback.answer()

@dp.callback_query(F.data == "admin_stats")
async def callback_admin_stats(callback: CallbackQuery):
    if not db.is_admin(callback.from_user.id) and callback.from_user.id != CREATOR_ID:
        await callback.answer("❌ Нет доступа!")
        return
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        # Всего пользователей
        cursor.execute("SELECT COUNT(*) as count FROM users")
        total_users = cursor.fetchone()['count']
        
        # Генераций сегодня
        today = date.today().isoformat()
        cursor.execute("SELECT SUM(count) as total FROM daily_stats WHERE date = ?", (today,))
        today_gen = cursor.fetchone()['total'] or 0
        
        # Всего генераций
        cursor.execute("SELECT SUM(total_generations) as total FROM users")
        total_gen = cursor.fetchone()['total'] or 0
    
    text = (
        "📊 **Статистика бота:**\n\n"
        f"👥 Всего пользователей: {total_users}\n"
        f"📸 Генераций сегодня: {today_gen}\n"
        f"🎨 Всего генераций: {total_gen}\n"
        f"📅 Дата: {today}"
    )
    
    await callback.message.edit_text(text, parse_mode="Markdown")
    await callback.answer()

@dp.callback_query(F.data == "back_to_menu")
async def callback_back_to_menu(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.delete()
    await callback.message.answer(
        "Главное меню:",
        reply_markup=get_main_keyboard(callback.from_user.id)
    )
    await callback.answer()

# ========== ЗАПУСК БОТА ==========
async def main():
    print("=" * 60)
    print("🚀 IMAGE GENERATOR БОТ ЗАПУЩЕН!")
    print("=" * 60)
    print(f"🤖 Токен: {BOT_TOKEN[:10]}...{BOT_TOKEN[-10:]}")
    print(f"👑 Создатель: @{CREATOR_USERNAME} (ID: {CREATOR_ID})")
    print(f"📸 Лимит в день: {DAILY_LIMIT} фото")
    print("=" * 60)
    print("✅ Бот готов к работе!")
    print("=" * 60)
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
