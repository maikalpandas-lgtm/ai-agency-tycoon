import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './store/gameStore';
import { formatNumber, formatDollars } from './data/gameData';
import Studio from './components/Studio';
import Shop from './components/Shop';
import Channels from './components/Channels';
import PublishModal from './components/PublishModal';
import EventToast from './components/EventToast';
import './index.css';

const TABS = [
  { id: 'studio', icon: '🏠', label: 'Студия' },
  { id: 'channels', icon: '📱', label: 'Каналы' },
  { id: 'shop', icon: '🛒', label: 'Шоп' },
  { id: 'friends', icon: '👥', label: 'Друзья' },
  { id: 'settings', icon: '⚙️', label: 'Настр' },
];

export default function App() {
  const {
    activeTab, setActiveTab,
    compute, dollars, totalFollowers, level,
    getComputePerSec, getCurrentLevel, getTotalFollowers,
    tickCompute, tickVideos, checkLevelUp, triggerRandomEvent,
    initGame,
  } = useGameStore();

  const currentLevel = getCurrentLevel();
  const cps = getComputePerSec();
  const followers = getTotalFollowers();

  // Initialize game on first load
  useEffect(() => {
    initGame();
    // Telegram Web App integration
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#09090b');
      tg.setBackgroundColor('#09090b');
      tg.isClosingConfirmationEnabled = true;

      // Disable swipe-to-close so tapping doesn't dismiss the app
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();

      // Listen for safe area changes and apply CSS variable
      const applySafeArea = () => {
        const safeTop = tg.safeAreaInset?.top || 0;
        const contentTop = tg.contentSafeAreaInset?.top || 0;
        const totalTop = safeTop + contentTop;
        document.documentElement.style.setProperty('--tg-safe-top', `${totalTop}px`);
      };

      // Request fullscreen after a short delay (needs expand first)
      setTimeout(() => {
        if (tg.requestFullscreen) {
          tg.requestFullscreen();
        }
        // Apply safe area after fullscreen change
        setTimeout(applySafeArea, 300);
      }, 500);

      applySafeArea();
      tg.onEvent('safeAreaChanged', applySafeArea);
      tg.onEvent('contentSafeAreaChanged', applySafeArea);
      tg.onEvent('fullscreenChanged', applySafeArea);
    }
  }, []);

  // Game tick: passive compute every second
  useEffect(() => {
    const interval = setInterval(() => {
      tickCompute();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Video views tick: every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      tickVideos();
      checkLevelUp();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Random events: every 60-120 seconds
  useEffect(() => {
    const scheduleEvent = () => {
      const delay = 60000 + Math.random() * 60000; // 60-120s
      return setTimeout(() => {
        triggerRandomEvent();
        timerRef.current = scheduleEvent();
      }, delay);
    };
    const timerRef = { current: scheduleEvent() };
    return () => clearTimeout(timerRef.current);
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'studio': return <Studio />;
      case 'channels': return <Channels />;
      case 'shop': return <Shop />;
      case 'friends': return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <span style={{ fontSize: 48 }}>👥</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Скоро</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Приглашай друзей и получай бонусы.<br/>Доступно в следующем обновлении.</span>
        </div>
      );
      case 'settings': return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <span style={{ fontSize: 48 }}>⚙️</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Настройки</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Уровень: {level} — {currentLevel.name} {currentLevel.icon}<br/>
            Цель: {formatNumber(currentLevel.goalFollowers)} подписчиков
          </span>
        </div>
      );
      default: return <Studio />;
    }
  };

  return (
    <div className="app">
      {/* === TOP BAR === */}
      <div className="top-bar">
        <div>
          <div className="top-bar__title">AI Agency Tycoon</div>
          <div className="top-bar__level">
            Ур. {level} — {currentLevel.name} {currentLevel.icon}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-badge stat-badge--compute">
            <span className="stat-badge__icon">⚡</span>
            <span className="stat-badge__value">{formatNumber(compute)}</span>
          </div>
          <div className="stat-badge stat-badge--followers">
            <span className="stat-badge__icon">👥</span>
            <span className="stat-badge__value">{formatNumber(followers)}</span>
          </div>
          <div className="stat-badge stat-badge--dollars">
            <span className="stat-badge__icon">💰</span>
            <span className="stat-badge__value">{formatDollars(dollars)}</span>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="app-content">
        {renderScreen()}
      </div>

      {/* === TAB BAR === */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-bar__item ${activeTab === tab.id ? 'tab-bar__item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-bar__icon">{tab.icon}</span>
            <span className="tab-bar__label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* === MODALS & OVERLAYS === */}
      <PublishModal />
      <EventToast />
    </div>
  );
}
