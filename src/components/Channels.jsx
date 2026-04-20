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
      {channels.map((channel, index) => {
        const platform = PLATFORMS[channel.platform];
        const niche = NICHES.find(n => n.id === channel.niche);
        const nextMilestone = platform.milestones.find(m => channel.followers < m.followers);
        const prevMilestone = [...platform.milestones].reverse().find(m => channel.followers >= m.followers);
        const progress = nextMilestone
          ? ((channel.followers - (prevMilestone?.followers || 0)) / (nextMilestone.followers - (prevMilestone?.followers || 0))) * 100
          : 100;

        // Visual Tier Logic
        let tier = 1;
        if (channel.followers >= 1000) tier = 2;
        if (channel.followers >= 10000) tier = 3;
        if (channel.followers >= 100000) tier = 4;
          
        let avatarSrc = '/ai-agency-tycoon/avatars/tier1.png';
        if (tier >= 2) avatarSrc = '/ai-agency-tycoon/avatars/tier2.png';
        if (tier >= 3) avatarSrc = '/ai-agency-tycoon/avatars/tier3.png';
        if (tier >= 4) avatarSrc = '/ai-agency-tycoon/avatars/tier4.png';

        let bgSrc = '/ai-agency-tycoon/bg/tier1.png';
        if (tier >= 2) bgSrc = '/ai-agency-tycoon/bg/tier2.png';
        if (tier >= 3) bgSrc = '/ai-agency-tycoon/bg/tier3.png';
        if (tier >= 4) bgSrc = '/ai-agency-tycoon/bg/tier4.png';

        // Check if any video is viral
        const hasViral = videos.some(v => v.platforms[channel.platform] && v.status === 'viral');

        const channelVideos = useGameStore.getState().videos.filter(v => v.platform === channel.platform);
        const lastVideo = channelVideos.length > 0 ? channelVideos[channelVideos.length - 1] : null;

        return (
          <motion.div
            key={channel.id}
            className="channel-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {/* Visual Cover Profile */}
            <div className="channel-profile" style={{ marginBottom: 0, borderRadius: 0, border: 'none' }}>
              <div className={`channel-banner channel-banner--tier-${tier}`} style={{ backgroundImage: `url(${bgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {hasViral && <div className="viral-badge">🔴 VIRAL</div>}
                <div className="channel-avatar-wrapper" style={{ overflow: 'hidden' }}>
                  <img src={avatarSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              <div className="channel-profile-info">
                <div className="channel-card__header" style={{ padding: 0 }}>
                  <div className="channel-card__platform" style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className="channel-card__platform-icon" style={{ fontSize: 16 }}>{platform.icon}</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{channel.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{platform.name}</span>
                  </div>
                  {channel.income > 0 && (
                    <span className="channel-card__income" style={{ fontSize: 16 }}>{formatDollars(channel.income)}/мес</span>
                  )}
                </div>

                <div className="channel-card__stats" style={{ marginTop: 16 }}>
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

                {lastVideo && (
                  <div className="channel-last-video">
                    🎬 Последнее: <strong>{lastVideo.title}</strong>
                  </div>
                )}
              </div>
            </div>
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
