// ===== EQUIPMENT DATA =====
export const EQUIPMENT = [
  { id: 1, tier: 1, name: 'Старый ноутбук', icon: '🖥️', computePerSec: 1, price: 0, desc: '«Еле тянет, но мы верим»' },
  { id: 2, tier: 2, name: 'Игровой ПК', icon: '💻', computePerSec: 5, price: 50, desc: '«GTX 1060 — наш первый боец»' },
  { id: 3, tier: 3, name: 'RTX 3060', icon: '🎮', computePerSec: 20, price: 200, desc: '«Уже можно генерить котиков»' },
  { id: 4, tier: 4, name: 'RTX 4090', icon: '🔥', computePerSec: 100, price: 1000, desc: '«Зверь. Stable Diffusion летает»' },
  { id: 5, tier: 5, name: 'Стойка A100', icon: '⚙️', computePerSec: 500, price: 10000, desc: '«Датацентр-уровень»' },
  { id: 6, tier: 6, name: 'Кластер H100', icon: '🧊', computePerSec: 3000, price: 100000, desc: '«NVIDIA мечтает о таком клиенте»' },
  { id: 7, tier: 7, name: 'Квантовый CPU', icon: '🛸', computePerSec: 20000, price: 1000000, desc: '«Будущее уже здесь»' },
];

// ===== WORKSPACE LEVELS =====
export const WORKSPACES = [
  { level: 1, name: '🏠 Гараж', slots: 2, unlockPrice: 0 },
  { level: 2, name: '🏢 Коворкинг', slots: 4, unlockPrice: 500 },
  { level: 3, name: '🏬 Офис', slots: 8, unlockPrice: 5000 },
  { level: 4, name: '🏭 Серверная', slots: 16, unlockPrice: 50000 },
  { level: 5, name: '🌐 Мини ДЦ', slots: 32, unlockPrice: 500000 },
  { level: 6, name: '🚀 Mega DC', slots: 64, unlockPrice: 5000000 },
];

// ===== CONTENT NICHES =====
export const NICHES = [
  { id: 1, name: 'AI Котики', icon: '🐱', computeCost: 10, baseViews: [100, 500], unlock: 0 },
  { id: 2, name: 'AI Арт', icon: '🎨', computeCost: 25, baseViews: [200, 1000], unlock: 100 },
  { id: 3, name: 'AI Мемы', icon: '😂', computeCost: 50, baseViews: [500, 5000], unlock: 1000 },
  { id: 4, name: 'AI Музыка', icon: '🎵', computeCost: 100, baseViews: [1000, 10000], unlock: 5000 },
  { id: 5, name: 'AI Истории', icon: '📖', computeCost: 200, baseViews: [2000, 20000], unlock: 25000 },
  { id: 6, name: 'AI Фильмы', icon: '🎬', computeCost: 500, baseViews: [5000, 50000], unlock: 100000 },
  { id: 7, name: 'AI Инфлюенсер', icon: '🤖', computeCost: 1000, baseViews: [10000, 200000], unlock: 500000 },
  { id: 8, name: 'AI Кино', icon: '🌍', computeCost: 5000, baseViews: [50000, 1000000], unlock: 2000000 },
];

// ===== PLATFORMS =====
export const PLATFORMS = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#06b6d4',
    unlockFollowers: 0,
    viewMultiplier: 1.0,
    incomePerKViews: 0.01,
    viralChance: 0.05,
    milestones: [
      { followers: 1000, label: '📊 Аналитика', bonus: null },
      { followers: 10000, label: '💵 Creator Fund', bonus: 'monetization' },
      { followers: 50000, label: '📢 Рекламодатели', bonus: 'ads_small' },
      { followers: 100000, label: '🤝 Бренды', bonus: 'ads_big' },
      { followers: 1000000, label: '👑 Верификация', bonus: 'verified' },
    ],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Shorts',
    icon: '▶️',
    color: '#ef4444',
    unlockFollowers: 5000,
    viewMultiplier: 0.7,
    incomePerKViews: 0.03,
    viralChance: 0.02,
    milestones: [
      { followers: 1000, label: '📊 YouTube Studio', bonus: null },
      { followers: 1000, label: '💵 YPP', bonus: 'monetization', extraReq: '10M просмотров' },
      { followers: 50000, label: '📢 AdSense Premium', bonus: 'ads_premium' },
      { followers: 100000, label: '🎬 Серебряная кнопка', bonus: 'silver_button' },
      { followers: 1000000, label: '💎 Золотая кнопка', bonus: 'gold_button' },
    ],
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram Reels',
    icon: '📸',
    color: '#e1306c',
    unlockFollowers: 10000,
    viewMultiplier: 0.8,
    incomePerKViews: 0.02,
    viralChance: 0.03,
    milestones: [
      { followers: 5000, label: '📊 Insights', bonus: null },
      { followers: 10000, label: '🔗 Swipe-up', bonus: 'affiliate' },
      { followers: 50000, label: '📢 Премиум реклама', bonus: 'ads_premium' },
      { followers: 100000, label: '🤝 Luxury бренды', bonus: 'luxury' },
      { followers: 500000, label: '⭐ Амбассадор', bonus: 'ambassador' },
    ],
  },
};

// ===== VIDEO TITLES =====
export const VIDEO_TITLES = {
  1: ['Этот кот поёт оперу 😱', 'AI кот vs настоящий кот', 'Самый мягкий кот в мире 🥺', 'Кот-хакер взламывает NASA', 'AI сгенерировал идеального котика'],
  2: ['Нейросеть нарисовала шедевр 🎨', 'AI Art за 10 секунд', 'Когда AI рисует лучше тебя', 'Портрет AI в стиле Ван Гога', 'AI создал картину за $1M'],
  3: ['AI сделал мем и сам не понял 😂', 'Самый тупой AI мем', 'Мемы от нейросети (ЖЁСТКО)', 'AI vs мемоделы: кто круче?', 'Нейросеть шутит лучше тебя'],
  4: ['AI написал хит за 5 сек 🎵', 'Нейросеть vs Моргенштерн', 'Этот трек создан за 1 клик', 'AI Music: будущее музыки', 'Бит от нейросети (ОГОНЬ)'],
  5: ['История от AI (мурашки) 📖', 'Нейросеть написала роман', 'AI рассказал историю — все плачут', 'Сторителлинг от ChatGPT', 'Сюжет лучше Нетфликса'],
  6: ['Нейросеть сняла фильм (ШОКИРУЕТ) 🎬', 'AI короткометражка за 10 сек', 'Фильм от нейросети: оскар?', 'AI режиссёр лучше Нолана', 'Кино будущего уже здесь'],
  7: ['Виртуальный блогер набрал 1M 🤖', 'AI инфлюенсер продаёт всё', 'Этот блогер не существует', 'AI человек захватывает TikTok', 'Инфлюенсер из нейросети'],
  8: ['AI снял полный фильм 🌍', 'Полнометражка от нейросети', '2 часа AI контента!!!', 'Голливуд в шоке от AI', 'Кинофестиваль AI фильмов'],
};

// ===== GAME LEVELS =====
export const GAME_LEVELS = [
  { level: 1, name: 'Мечтатель в гараже', icon: '🏠', goalFollowers: 100, reward: '🎁 Игровой ПК бесплатно' },
  { level: 2, name: 'Первая тысяча', icon: '💻', goalFollowers: 1000, goalDollars: 100, reward: '🎁 500$ + Мёрдж' },
  { level: 3, name: 'На радаре алгоритма', icon: '📈', goalFollowers: 5000, reward: '🎁 RTX 3060' },
  { level: 4, name: 'Первые деньги', icon: '💵', goalFollowers: 10000, reward: '🎁 2-й канал' },
  { level: 5, name: 'Малый бизнес', icon: '🏬', goalFollowers: 50000, goalDollars: 1000, reward: '🎁 A100' },
  { level: 6, name: 'Студия', icon: '🏭', goalFollowers: 200000, reward: '🎁 H100' },
  { level: 7, name: 'Медиа-империя', icon: '🌐', goalFollowers: 1000000, reward: '🎁 CTO бесплатно' },
  { level: 8, name: 'Контент-фабрика', icon: '🚀', goalFollowers: 5000000, reward: '🎁 Квантовый CPU' },
  { level: 9, name: 'Монополист', icon: '👑', goalFollowers: 20000000, reward: '🎁 Prestige' },
  { level: 10, name: 'AI Mogul', icon: '🏆', goalFollowers: 100000000, goalDollars: 10000000, reward: '🏆 ПОБЕДА' },
];

// ===== RANDOM EVENTS =====
export const EVENTS = {
  positive: [
    { id: 'trend', text: '🔥 Тренд! «AI-коты в космосе» — видео в нише Котики получают x5 просмотров!', duration: 7200, effect: { nicheId: 1, viewMultiplier: 5 } },
    { id: 'mention', text: '📰 Блогер упомянул твой канал! +5,000 подписчиков!', effect: { addFollowers: 5000 } },
    { id: 'sponsor', text: '🎁 Спонсорский контракт на $500!', effect: { addDollars: 500 } },
    { id: 'sale', text: '⚡ Скидка на оборудование -50% на 1 час!', duration: 3600, effect: { equipDiscount: 0.5 } },
    { id: 'viral', text: '🌟 Одно из твоих видео завирусилось! x10 просмотров!', effect: { viralBoost: true } },
  ],
  negative: [
    { id: 'ban', text: '⚠️ Бан за «неоригинальный контент»! Канал заморожен на 1 час.', duration: 3600, effect: { channelFreeze: true } },
    { id: 'gpu_burn', text: '🔧 Сгорела видеокарта! Нужно $100 на ремонт.', effect: { removeDollars: 100 } },
    { id: 'algo_change', text: '📉 Алгоритм изменился! -30% просмотров на 3 часа.', duration: 10800, effect: { viewPenalty: 0.7 } },
  ],
};

// ===== HELPERS =====
export function formatNumber(n) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

export function formatDollars(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + Math.floor(n);
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
