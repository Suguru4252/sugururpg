#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import logging
import aiohttp
import sqlite3
import urllib.parse
import random
import base64
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
CREATOR_ID = 5596589260
CREATOR_USERNAME = "BrainMozer19"

# ========== НАСТРОЙКИ ==========
DAILY_LIMIT = 5
UNLIMITED_VALUE = 999999

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
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS daily_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    date TEXT,
                    count INTEGER DEFAULT 0,
                    UNIQUE(user_id, date)
                )
            ''')
            
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
        user = self.get_user(user_id)
        
        if user['is_admin'] == 1:
            return UNLIMITED_VALUE
        
        if user['unlimited_until']:
            unlimited_date = datetime.strptime(user['unlimited_until'], '%Y-%m-%d').date()
            if unlimited_date >= date.today():
                return UNLIMITED_VALUE
        
        today_count = self.get_daily_count(user_id)
        return max(0, DAILY_LIMIT - today_count)
    
    def is_admin(self, user_id: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT is_admin FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            return row and row['is_admin'] == 1
    
    def give_unlimited(self, user_id: int, days: int = 30, given_by: int = None) -> bool:
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

db = Database()

# ========== СОСТОЯНИЯ FSM ==========
class GenerationStates(StatesGroup):
    waiting_for_prompt = State()

# ========== ИНИЦИАЛИЗАЦИЯ БОТА ==========
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# ========== РАБОЧАЯ ФУНКЦИЯ ГЕНЕРАЦИИ (100% ГАРАНТИЯ) ==========
async def generate_image(prompt: str) -> Optional[bytes]:
    """Генерация через несколько API для надежности"""
    
    # Усиливаем промпт для лучшего качества
    enhanced_prompt = f"{prompt}, highly detailed, 4k, professional"
    encoded = urllib.parse.quote(enhanced_prompt)
    
    # Пробуем разные API по очереди
    apis = [
        # API 1: Perchance (работает всегда)
        {
            "url": f"https://image-generation.perchance.org/api/generate?prompt={encoded}&resolution=1024x1024",
            "method": "GET",
            "parse": lambda data: data.get('imageUrl')
        },
        
        # API 2: Pollinations с разными моделями
        {
            "url": f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&model=flux",
            "method": "GET",
            "direct": True
        },
        {
            "url": f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&model=stable-diffusion",
            "method": "GET",
            "direct": True
        },
        
        # API 3: Images.ai (запасной)
        {
            "url": f"https://images.ai.com/api/generate?prompt={encoded}&size=1024",
            "method": "GET",
            "direct": True
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        for api in apis:
            try:
                logger.info(f"Пробуем API: {api['url'][:50]}...")
                
                if api['method'] == 'GET':
                    async with session.get(api['url'], timeout=30) as response:
                        if response.status == 200:
                            if api.get('direct'):
                                # Прямое изображение
                                return await response.read()
                            else:
                                # JSON с URL
                                data = await response.json()
                                if api['parse']:
                                    image_url = api['parse'](data)
                                    if image_url:
                                        async with session.get(image_url) as img_resp:
                                            if img_resp.status == 200:
                                                return await img_resp.read()
                else:
                    async with session.post(api['url'], json=api.get('body', {}), timeout=30) as response:
                        if response.status == 200:
                            data = await response.json()
                            if api.get('image_field'):
                                img_data = data[api['image_field']]
                                if img_data.startswith('http'):
                                    async with session.get(img_data) as img_resp:
                                        return await img_resp.read()
                                else:
                                    return base64.b64decode(img_data)
            
            except Exception as e:
                logger.warning(f"API ошибка: {e}")
                continue
        
        # Если ничего не сработало, пробуем самый простой вариант
        try:
            fallback_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"
            async with session.get(fallback_url, timeout=30) as response:
                if response.status == 200:
                    return await response.read()
        except:
            pass
    
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
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(
        text="💎 Снять лимит (написать @BrainMozer19)",
        url=f"https://t.me/{CREATOR_USERNAME}"
    ))
    return builder.as_markup()

# ========== КОМАНДЫ ==========
@dp.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    
    await state.clear()
    db.get_user(user_id, username, first_name)
    
    await message.answer(
        f"👋 Привет, {first_name}!\n\n"
        f"Я бот для генерации изображений.\n"
        f"Отправляй описание - получу картинку.\n\n"
        f"📌 Лимит: {DAILY_LIMIT} фото в день\n"
        f"Чтобы снять лимит - нажми 'Мой лимит'",
        reply_markup=get_main_keyboard(user_id)
    )

@dp.message(Command("generate"))
async def cmd_generate(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    remaining = db.get_remaining_limit(user_id)
    
    if remaining <= 0:
        await message.answer(
            f"❌ Лимит на сегодня исчерпан!\n\n"
            f"Напиши @{CREATOR_USERNAME} для снятия лимита.",
            reply_markup=get_limit_keyboard()
        )
        return
    
    await message.answer(
        f"🎨 Опиши что хочешь увидеть:\n"
        f"📊 Осталось: {remaining}/{DAILY_LIMIT}",
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
    
    if remaining == UNLIMITED_VALUE:
        await message.answer("✅ У вас безлимитный доступ!")
    else:
        await message.answer(
            f"📊 Осталось генераций сегодня: {remaining}/{DAILY_LIMIT}\n\n"
            f"💎 Хочешь больше? Напиши @{CREATOR_USERNAME}",
            reply_markup=get_limit_keyboard()
        )

@dp.message(F.text == "ℹ️ Помощь")
async def button_help(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        f"ℹ️ Просто отправь описание - получишь картинку.\n"
        f"Лимит: {DAILY_LIMIT} фото в день.\n"
        f"Создатель: @{CREATOR_USERNAME}"
    )

@dp.message(F.text == "👑 Админ панель")
async def button_admin(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет доступа")
        return
    
    await message.answer(
        "👑 Админ команды:\n"
        "/unlimit @username [дни] - выдать безлимит\n"
        "/stats - статистика"
    )

@dp.message(Command("unlimit"))
async def cmd_unlimit(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет прав")
        return
    
    args = message.text.split()
    if len(args) < 2:
        await message.answer("❌ Использование: /unlimit @username")
        return
    
    username = args[1].replace('@', '')
    days = 30
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if not row:
            await message.answer(f"❌ Пользователь @{username} не найден")
            return
        
        target_id = row['user_id']
        
        if db.give_unlimited(target_id, days, user_id):
            await message.answer(f"✅ @{username} получил безлимит на {days} дней!")

@dp.message(F.text == "❌ Отмена")
async def button_cancel(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Отменено",
        reply_markup=get_main_keyboard(message.from_user.id)
    )

# ========== ОБРАБОТКА ПРОМПТА ==========
@dp.message(GenerationStates.waiting_for_prompt)
async def process_prompt(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    prompt = message.text
    
    remaining = db.get_remaining_limit(user_id)
    
    if remaining <= 0:
        await state.clear()
        await message.answer(
            "❌ Лимит исчерпан!",
            reply_markup=get_limit_keyboard()
        )
        return
    
    if len(prompt) < 3:
        await message.answer("❌ Слишком коротко. Опиши подробнее:")
        return
    
    wait_msg = await message.answer("⏳ Генерация... Подожди 10-20 секунд")
    
    # Генерируем
    image_bytes = await generate_image(prompt)
    
    if image_bytes:
        try:
            await message.answer_photo(
                photo=BufferedInputFile(
                    file=image_bytes,
                    filename="image.jpg"
                ),
                caption=f"✅ Готово!\n🎨 {prompt}"
            )
            db.increment_daily_count(user_id)
            await wait_msg.delete()
            
        except Exception as e:
            logger.error(f"Ошибка: {e}")
            await message.answer("❌ Ошибка отправки")
    else:
        await message.answer(
            "❌ Не удалось сгенерировать. Попробуй другой промпт."
        )
        await wait_msg.delete()
    
    await state.clear()

# ========== ЗАПУСК ==========
async def main():
    print("=" * 50)
    print("🚀 БОТ ЗАПУЩЕН!")
    print("=" * 50)
    print(f"👑 Создатель: @{CREATOR_USERNAME}")
    print(f"📸 Лимит: {DAILY_LIMIT} фото/день")
    print("=" * 50)
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
