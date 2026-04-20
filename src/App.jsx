import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './store/gameStore';
import { formatNumber, formatDollars, ACHIEVEMENTS } from './data/gameData';
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
    offlineEarnings, dismissOffline,
    screenShake, achievementToast, achievements,
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
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#09090b');
      tg.setBackgroundColor('#09090b');
      tg.isClosingConfirmationEnabled = true;
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();

      setTimeout(() => {
        if (tg.requestFullscreen) tg.requestFullscreen();
        const applySafeArea = () => {
          const safeTop = tg.safeAreaInset?.top || 0;
          const contentTop = tg.contentSafeAreaInset?.top || 0;
          document.documentElement.style.setProperty('--tg-safe-top', `${safeTop + contentTop}px`);
        };
        setTimeout(applySafeArea, 300);
        applySafeArea();
        tg.onEvent('safeAreaChanged', applySafeArea);
        tg.onEvent('contentSafeAreaChanged', applySafeArea);
        tg.onEvent('fullscreenChanged', applySafeArea);
      }, 500);
    }
  }, []);

  // Game tick
  useEffect(() => {
    const interval = setInterval(() => tickCompute(), 1000);
    return () => clearInterval(interval);
  }, []);

  // Video views tick
  useEffect(() => {
    const interval = setInterval(() => { tickVideos(); checkLevelUp(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Random events
  useEffect(() => {
    const scheduleEvent = () => {
      const delay = 60000 + Math.random() * 60000;
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
        <div className="settings-screen">
          {/* Game Info */}
          <div className="settings-info">
            <div style={{ fontSize: 48 }}>{currentLevel.icon}</div>
            <div className="settings-info__name">Уровень {level} — {currentLevel.name}</div>
            <div className="settings-info__goal">Цель: {formatNumber(currentLevel.goalFollowers)} подписчиков</div>
          </div>

          {/* Achievements */}
          <div className="section-header" style={{ marginTop: 16 }}>
            <span className="section-title">🏆 Достижения</span>
            <span className="section-subtitle">{achievements.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="achievements-grid">
            {ACHIEVEMENTS.map(ach => {
              const unlocked = achievements.includes(ach.id);
              return (
                <div key={ach.id} className={`achievement-card ${unlocked ? 'achievement-card--unlocked' : ''}`}>
                  <span className="achievement-card__icon">{unlocked ? ach.icon : '🔒'}</span>
                  <div className="achievement-card__info">
                    <div className="achievement-card__name">{ach.name}</div>
                    <div className="achievement-card__desc">{ach.desc}</div>
                  </div>
                  {unlocked && (
                    <span className="achievement-card__reward">
                      +{ach.reward}{ach.rewardType === 'dollars' ? '$' : '⚡'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
      default: return <Studio />;
    }
  };

  return (
    <div className={`app ${screenShake ? 'app--shake' : ''}`}>
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

      {/* === ACHIEVEMENT TOAST === */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            className="achievement-toast"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', dampen: 20 }}
          >
            <span style={{ fontSize: 28 }}>{achievementToast.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>🏆 {achievementToast.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{achievementToast.desc}</div>
              <div style={{ fontSize: 11, color: 'var(--accent-success)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                +{achievementToast.reward}{achievementToast.rewardType === 'dollars' ? '$' : '⚡'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === OFFLINE EARNINGS MODAL === */}
      <AnimatePresence>
        {offlineEarnings && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissOffline}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}
            >
              <div style={{ fontSize: 48 }}>🌙</div>
              <h2 style={{ marginTop: 12 }}>С возвращением!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
                Пока тебя не было ({Math.floor(offlineEarnings.seconds / 60)} мин),<br/>
                оборудование заработало:
              </p>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textShadow: '0 0 20px rgba(139,92,246,0.3)',
                margin: '16px 0',
              }}>
                +{formatNumber(offlineEarnings.compute)} ⚡
              </div>
              <button className="generate-btn" onClick={dismissOffline}>
                🎮 Продолжить
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
