import { useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { PLATFORMS, NICHES, formatNumber, formatDollars } from '../data/gameData';

export default function Channels() {
  const { channels, totalFollowers, createChannel, canUnlockPlatform } = useGameStore();
  const [showCreate, setShowCreate] = useState(false);
  const [createPlatform, setCreatePlatform] = useState(null);

  const platformIds = ['tiktok', 'youtube', 'instagram'];

  const handleCreateChannel = (platformId) => {
    // For now, auto-assign niche based on first available
    const availableNiches = useGameStore.getState().getAvailableNiches();
    if (availableNiches.length > 0) {
      createChannel(platformId, availableNiches[0].id);
    }
    setShowCreate(false);
  };

  return (
    <div className="channels">
      <div className="section-header" style={{ marginBottom: 8 }}>
        <span className="section-title">📱 Мои каналы</span>
        <span className="section-subtitle">Всего: {formatNumber(totalFollowers)} подписчиков</span>
      </div>

      {/* === EXISTING CHANNELS === */}
      {channels.map(channel => {
        const platform = PLATFORMS[channel.platform];
        const niche = NICHES.find(n => n.id === channel.niche);
        const nextMilestone = platform.milestones.find(m => channel.followers < m.followers);
        const prevMilestone = [...platform.milestones].reverse().find(m => channel.followers >= m.followers);
        const progress = nextMilestone
          ? ((channel.followers - (prevMilestone?.followers || 0)) / (nextMilestone.followers - (prevMilestone?.followers || 0))) * 100
          : 100;

        return (
          <motion.div
            key={channel.id}
            className="channel-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="channel-card__header">
              <div className="channel-card__platform">
                <span className="channel-card__platform-icon">{platform.icon}</span>
                <span>{platform.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{channel.name}</span>
              </div>
              {channel.income > 0 && (
                <span className="channel-card__income">{formatDollars(channel.income)}/мес</span>
              )}
            </div>
            <div className="channel-card__stats">
              <span className="channel-card__stat">
                👥 <span className="channel-card__stat-value">{formatNumber(channel.followers)}</span>
              </span>
              <span className="channel-card__stat">
                👁 <span className="channel-card__stat-value">{formatNumber(channel.totalViews)}</span> просм.
              </span>
              <span className="channel-card__stat">
                {niche?.icon} {niche?.name}
              </span>
            </div>
            <div className="channel-card__progress">
              <div
                className={`channel-card__progress-fill channel-card__progress-fill--${channel.platform}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {nextMilestone && (
              <div className="channel-card__milestone">
                {formatNumber(channel.followers)} / {formatNumber(nextMilestone.followers)} → {nextMilestone.label}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* === LOCKED PLATFORMS === */}
      {platformIds
        .filter(pid => !channels.find(c => c.platform === pid))
        .map(pid => {
          const platform = PLATFORMS[pid];
          const unlocked = canUnlockPlatform(pid);
          return (
            <motion.div
              key={pid}
              className={`channel-card ${!unlocked ? 'channel-card--locked' : ''}`}
              onClick={() => unlocked && handleCreateChannel(pid)}
              whileTap={unlocked ? { scale: 0.98 } : {}}
              style={{ cursor: unlocked ? 'pointer' : 'default' }}
            >
              {!unlocked ? (
                <>
                  <span className="lock-icon">🔒</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{platform.icon} {platform.name}</span>
                  <span className="lock-text">
                    Нужно {formatNumber(platform.unlockFollowers)} подписчиков суммарно
                  </span>
                </>
              ) : (
                <div style={{ width: '100%' }}>
                  <div className="channel-card__header">
                    <div className="channel-card__platform">
                      <span className="channel-card__platform-icon">{platform.icon}</span>
                      <span>{platform.name}</span>
                    </div>
                  </div>
                  <button
                    className="create-channel-btn"
                    style={{ marginTop: 8 }}
                    onClick={(e) => { e.stopPropagation(); handleCreateChannel(pid); }}
                  >
                    + Создать канал
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
    </div>
  );
}
