"""
AI Agency Tycoon — Telegram Bot
Простой бот с приветственным сообщением и кнопкой запуска Mini App.
Запуск: python3 bot.py
"""
import json
import urllib.request
import time

BOT_TOKEN = "8729385897:AAE0SelTDppgZn0NIaP8Y-WWjmIpQqHYyH4"
WEBAPP_URL = "https://maikalpandas-lgtm.github.io/ai-agency-tycoon/"
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"


def api_call(method, data=None):
    """Make a Telegram Bot API call."""
    url = f"{API_URL}/{method}"
    if data:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
    else:
        req = urllib.request.Request(url)
    
    with urllib.request.urlopen(req, timeout=35) as resp:
        return json.loads(resp.read().decode('utf-8'))


def send_welcome(chat_id, first_name):
    """Send welcome message with fullscreen play button."""
    text = (
        f"👋 Привет, {first_name}!\n\n"
        "🎮 Добро пожаловать в *AI Agency Tycoon*!\n\n"
        "Ты начинаешь с потрёпанного ноутбука в гараже.\n"
        "Твоя цель — построить империю AI-контента и захватить "
        "TikTok, YouTube и Instagram! 🚀\n\n"
        "⚡ Покупай видеокарты и серверы\n"
        "🎬 Генерируй AI-видео\n"
        "📱 Набирай подписчиков\n"
        "💰 Зарабатывай доллары\n"
        "🏆 Стань AI Mogul!\n\n"
        "Нажми кнопку ниже, чтобы начать! 👇"
    )

    # ReplyKeyboardMarkup opens web_app in FULLSCREEN mode
    reply_keyboard = {
        "keyboard": [[
            {
                "text": "🎮 Играть в AI Agency Tycoon",
                "web_app": {"url": WEBAPP_URL}
            }
        ]],
        "resize_keyboard": True,
        "is_persistent": True
    }

    api_call("sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "reply_markup": reply_keyboard
    })


def send_help(chat_id):
    """Send help message."""
    text = (
        "❓ *Как играть:*\n\n"
        "1️⃣ Тапай по экрану, чтобы получать ⚡ Compute\n"
        "2️⃣ Покупай оборудование в Магазине 🛒\n"
        "3️⃣ Генерируй AI-видео 🎬\n"
        "4️⃣ Публикуй на TikTok, YouTube, Instagram 📱\n"
        "5️⃣ Набирай подписчиков и зарабатывай 💰\n"
        "6️⃣ Прокачивай студию от Гаража до Mega Data Center 🚀\n\n"
        "🎯 Цель: набрать 100M подписчиков и стать AI Mogul! 🏆"
    )

    api_call("sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    })


def process_update(update):
    """Process a single update."""
    if "message" not in update:
        return

    message = update["message"]
    chat_id = message["chat"]["id"]
    first_name = message["from"].get("first_name", "Игрок")
    text = message.get("text", "")

    if text == "/start":
        send_welcome(chat_id, first_name)
    elif text == "/play":
        send_welcome(chat_id, first_name)
    elif text == "/help":
        send_help(chat_id)
    elif text and not text.startswith("/"):
        # For any other message, just remind about the button
        api_call("sendMessage", {
            "chat_id": chat_id,
            "text": "Нажми кнопку «🎮 Играть» внизу чтобы открыть игру! 👇"
        })


def main():
    """Run bot with long polling."""
    print("🤖 AI Agency Tycoon Bot запущен!")
    print(f"🎮 Web App URL: {WEBAPP_URL}")
    print("Ожидание сообщений...\n")

    offset = 0

    while True:
        try:
            result = api_call("getUpdates", {
                "offset": offset,
                "timeout": 30
            })

            if result.get("ok") and result.get("result"):
                for update in result["result"]:
                    offset = update["update_id"] + 1
                    try:
                        process_update(update)
                        if "message" in update:
                            user = update["message"]["from"]
                            print(f"📩 {user.get('first_name', '?')}: {update['message'].get('text', '[no text]')}")
                    except Exception as e:
                        print(f"❌ Ошибка обработки: {e}")

        except KeyboardInterrupt:
            print("\n👋 Бот остановлен.")
            break
        except Exception as e:
            print(f"❌ Ошибка polling: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
