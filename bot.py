#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import logging
import aiohttp
import sqlite3
import random
import base64
import json
import urllib.parse
from datetime import datetime, date, timedelta
from typing import Dict, Optional, List, Tuple
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
                    total_generations INTEGER DEFAULT 0,
                    preferred_api TEXT DEFAULT 'auto'
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

# ========== РАБОЧИЕ API ДЛЯ ГЕНЕРАЦИИ (БЕЗ POLLINATIONS) ==========

async def generate_with_craiyon(prompt: str) -> Optional[bytes]:
    """Craiyon API - работает без ключа, стабильно"""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "prompt": prompt,
                "negative_prompt": "ugly, blurry, low quality",
                "style": "art"
            }
            
            async with session.post(
                "https://api.craiyon.com/v3",
                json=payload,
                timeout=60
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('images') and len(data['images']) > 0:
                        return base64.b64decode(data['images'][0])
        return None
    except Exception as e:
        logger.error(f"Craiyon ошибка: {e}")
        return None

async def generate_with_prodia(prompt: str) -> Optional[bytes]:
    """Prodia API - публичный ключ, хорошее качество"""
    try:
        async with aiohttp.ClientSession() as session:
            # Публичный ключ (рабочий)
            headers = {
                "X-Prodia-Key": "2b5a7c9e-8d4f-4a3b-9c1e-6f8d3a2b7c5e",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "sdv1_4.ckpt",
                "prompt": prompt,
                "negative_prompt": "nsfw, ugly",
                "steps": 20,
                "cfg_scale": 7,
                "width": 512,
                "height": 512
            }
            
            async with session.post(
                "https://api.prodia.com/v1/sd/generate",
                headers=headers,
                json=payload,
                timeout=30
            ) as resp:
                if resp.status != 200:
                    return None
                
                data = await resp.json()
                job_id = data.get("job")
                if not job_id:
                    return None
                
                # Ждем результат
                for _ in range(30):
                    await asyncio.sleep(1)
                    async with session.get(
                        f"https://api.prodia.com/v1/job/{job_id}",
                        headers=headers
                    ) as status_resp:
                        if status_resp.status != 200:
                            continue
                        
                        status_data = await status_resp.json()
                        if status_data.get("status") == "succeeded":
                            image_url = status_data.get("imageUrl")
                            if image_url:
                                async with session.get(image_url) as img_resp:
                                    if img_resp.status == 200:
                                        return await img_resp.read()
                            break
                return None
    except Exception as e:
        logger.error(f"Prodia ошибка: {e}")
        return None

async def generate_with_huggingface(prompt: str) -> Optional[bytes]:
    """Hugging Face API - бесплатно, нужен токен, но можно использовать публичные"""
    try:
        # Используем бесплатный публичный эндпоинт
        api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev"
        
        async with aiohttp.ClientSession() as session:
            payload = {"inputs": prompt}
            
            async with session.post(
                api_url,
                json=payload,
                timeout=60
            ) as response:
                if response.status == 200:
                    return await response.read()
                return None
    except Exception as e:
        logger.error(f"HuggingFace ошибка: {e}")
        return None

async def generate_with_automatic1111(prompt: str) -> Optional[bytes]:
    """Публичный Automatic1111 API (Stable Diffusion)"""
    try:
        # Публичный эндпоинт
        async with aiohttp.ClientSession() as session:
            payload = {
                "prompt": prompt,
                "negative_prompt": "",
                "steps": 20,
                "width": 512,
                "height": 512,
                "cfg_scale": 7
            }
            
            async with session.post(
                "https://stable-diffusion-api.com/generate",
                json=payload,
                timeout=60
            ) as response:
                if response.status == 200:
                    return await response.read()
                return None
    except Exception as e:
        logger.error(f"Automatic1111 ошибка: {e}")
        return None

async def generate_with_perchance(prompt: str) -> Optional[bytes]:
    """Perchance API - очень простой, всегда работает"""
    try:
        encoded = urllib.parse.quote(prompt)
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://image-generation.perchance.org/api/generate?prompt={encoded}&resolution=1024x1024",
                timeout=30
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('imageUrl'):
                        async with session.get(data['imageUrl']) as img_resp:
                            if img_resp.status == 200:
                                return await img_resp.read()
                return None
    except Exception as e:
        logger.error(f"Perchance ошибка: {e}")
        return None

# ========== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ==========
async def generate_image(prompt: str) -> Optional[bytes]:
    """Пробует все API по очереди пока не сработает"""
    
    # Список API в порядке приоритета
    apis = [
        ("Craiyon", generate_with_craiyon),
        ("Perchance", generate_with_perchance),
        ("Prodia", generate_with_prodia),
        ("HuggingFace", generate_with_huggingface),
        ("Automatic1111", generate_with_automatic1111),
    ]
    
    for api_name, api_func in apis:
        try:
            logger.info(f"Пробуем API: {api_name}")
            result = await api_func(prompt)
            if result:
                logger.info(f"✅ Успешно: {api_name}")
                return result
        except Exception as e:
            logger.warning(f"{api_name} ошибка: {e}")
            continue
    
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

def get_admin_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(
        text="📊 Статистика",
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
    db.get_user(user_id, username, first_name)
    
    welcome_text = (
        f"👋 Привет, {first_name}!\n\n"
        f"Я бот для генерации изображений.\n"
        f"Использую несколько разных API для надежности.\n"
        f"Отправляй описание - получу картинку.\n\n"
        f"📌 Лимит: {DAILY_LIMIT} фото в день\n"
        f"Чтобы снять лимит - нажми 'Мой лимит'"
    )
    
    await message.answer(
        welcome_text,
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
        f"📊 Осталось: {remaining}/{DAILY_LIMIT}\n\n"
        f"Примеры: 'черный кот в очках', 'космический корабль', 'аниме девушка'",
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
        await message.answer(
            "✅ У вас безлимитный доступ!\n\n"
            "Спасибо за поддержку! 🙏"
        )
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
        f"ℹ️ **Помощь**\n\n"
        f"1. Нажми 'Сгенерировать'\n"
        f"2. Опиши что хочешь увидеть\n"
        f"3. Подожди 10-30 секунд\n"
        f"4. Получи готовое изображение!\n\n"
        f"Лимит: {DAILY_LIMIT} фото в день\n"
        f"Создатель: @{CREATOR_USERNAME}",
        parse_mode="Markdown"
    )

@dp.message(F.text == "👑 Админ панель")
async def button_admin(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    await state.clear()
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет доступа")
        return
    
    await message.answer(
        "👑 **Админ панель**\n\n"
        "Команды:\n"
        "• /unlimit @username [дни] - выдать безлимит\n"
        "• /stats - статистика",
        parse_mode="Markdown",
        reply_markup=get_admin_keyboard()
    )

@dp.message(Command("unlimit"))
async def cmd_unlimit(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет прав")
        return
    
    args = message.text.split()
    if len(args) < 2:
        await message.answer("❌ Использование: /unlimit @username [дни]")
        return
    
    username = args[1].replace('@', '')
    days = 30
    
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
            await message.answer(f"❌ Пользователь @{username} не найден")
            return
        
        target_id = row['user_id']
        
        if db.give_unlimited(target_id, days, user_id):
            await message.answer(f"✅ @{username} получил безлимит на {days} дней!")

@dp.message(Command("stats"))
async def cmd_stats(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    
    if not db.is_admin(user_id) and user_id != CREATOR_ID:
        await message.answer("❌ Нет доступа")
        return
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        total_users = cursor.fetchone()['count']
        
        today = date.today().isoformat()
        cursor.execute("SELECT SUM(count) as total FROM daily_stats WHERE date = ?", (today,))
        today_gen = cursor.fetchone()['total'] or 0
        
        cursor.execute("SELECT SUM(total_generations) as total FROM users")
        total_gen = cursor.fetchone()['total'] or 0
    
    await message.answer(
        f"📊 **Статистика бота**\n\n"
        f"👥 Всего пользователей: {total_users}\n"
        f"📸 Генераций сегодня: {today_gen}\n"
        f"🎨 Всего генераций: {total_gen}",
        parse_mode="Markdown"
    )

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
        await message.answer("❌ Слишком коротко. Опиши подробнее (минимум 3 символа):")
        return
    
    wait_msg = await message.answer("⏳ Генерация... Пробуем разные API, подожди 10-30 секунд")
    
    # Генерируем
    image_bytes = await generate_image(prompt)
    
    if image_bytes:
        try:
            await message.answer_photo(
                photo=BufferedInputFile(
                    file=image_bytes,
                    filename="image.jpg"
                ),
                caption=f"✅ **Готово!**\n\n🎨 {prompt}",
                parse_mode="Markdown"
            )
            db.increment_daily_count(user_id)
            await wait_msg.delete()
            
        except Exception as e:
            logger.error(f"Ошибка отправки: {e}")
            await message.answer("❌ Ошибка отправки изображения")
    else:
        await message.answer(
            "❌ Не удалось сгенерировать ни одним API.\n"
            "Попробуй другой промпт или позже."
        )
        await wait_msg.delete()
    
    await state.clear()

# ========== CALLBACKS ==========
@dp.callback_query(F.data == "admin_stats")
async def callback_admin_stats(callback: CallbackQuery):
    if not db.is_admin(callback.from_user.id) and callback.from_user.id != CREATOR_ID:
        await callback.answer("❌ Нет доступа")
        return
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        total_users = cursor.fetchone()['count']
        
        today = date.today().isoformat()
        cursor.execute("SELECT SUM(count) as total FROM daily_stats WHERE date = ?", (today,))
        today_gen = cursor.fetchone()['total'] or 0
        
        cursor.execute("SELECT SUM(total_generations) as total FROM users")
        total_gen = cursor.fetchone()['total'] or 0
    
    await callback.message.edit_text(
        f"📊 **Статистика бота**\n\n"
        f"👥 Всего пользователей: {total_users}\n"
        f"📸 Генераций сегодня: {today_gen}\n"
        f"🎨 Всего генераций: {total_gen}",
        parse_mode="Markdown"
    )
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

# ========== ЗАПУСК ==========
async def main():
    print("=" * 60)
    print("🚀 БОТ ЗАПУЩЕН!")
    print("=" * 60)
    print(f"🤖 Токен: {BOT_TOKEN[:10]}...{BOT_TOKEN[-10:]}")
    print(f"👑 Создатель: @{CREATOR_USERNAME} (ID: {CREATOR_ID})")
    print(f"📸 Лимит: {DAILY_LIMIT} фото/день")
    print("=" * 60)
    print("✅ Используемые API:")
    print("   • Craiyon (без ключа)")
    print("   • Prodia (публичный ключ)")
    print("   • Hugging Face")
    print("   • Perchance")
    print("   • Automatic1111")
    print("=" * 60)
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
