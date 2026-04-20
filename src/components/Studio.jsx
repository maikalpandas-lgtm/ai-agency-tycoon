import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { EQUIPMENT, NICHES, formatNumber } from '../data/gameData';

export default function Studio() {
  const {
    compute, computePerTap, generatingVideo, generateProgress,
    selectedNiche, equipmentSlots, tapParticles, videos,
    tap, startGenerateVideo, getComputePerSec, getAvailableNiches,
  } = useGameStore();

  const workspaceRef = useRef(null);
  const cps = getComputePerSec();
  const niches = getAvailableNiches();
  const currentNiche = NICHES.find(n => n.id === selectedNiche);
  const canGenerate = !generatingVideo && compute >= (currentNiche?.computeCost || 10);

  const handleTap = useCallback((e) => {
    const rect = workspaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX ? e.clientX - rect.left : e.touches?.[0]?.clientX - rect.left || rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : e.touches?.[0]?.clientY - rect.top || rect.height / 2;
    tap(x, y);
  }, [tap]);

  const liveVideos = videos.filter(v => v.status === 'live' || v.status === 'viral').slice(0, 5);

  return (
    <div className="studio">
      {/* === WORKSPACE TAP AREA === */}
      <div
        ref={workspaceRef}
        className="studio__workspace"
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        <div className="studio__tap-area">
          <div className="studio__compute-display">
            {formatNumber(compute)} ⚡
          </div>
          <div className="studio__compute-rate">
            +{formatNumber(cps)}/сек пассивно • +{computePerTap}/тап
          </div>
          <div className="studio__tap-hint">
            👆 Тапай чтобы майнить Compute
          </div>
        </div>

        {/* Tap Particles */}
        <AnimatePresence>
          {tapParticles.map(p => (
            <motion.div
              key={p.id}
              className="tap-particle"
              initial={{ x: p.x - 20, y: p.y - 10, opacity: 1, scale: 1 }}
              animate={{ y: p.y - 70, opacity: 0, scale: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ position: 'absolute' }}
            >
              {p.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* === NICHE SELECTOR === */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {niches.map(niche => (
          <button
            key={niche.id}
            onClick={() => useGameStore.setState({ selectedNiche: niche.id })}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: `1px solid ${selectedNiche === niche.id ? '#8b5cf6' : '#27272a'}`,
              background: selectedNiche === niche.id ? 'rgba(139,92,246,0.15)' : '#1c1c22',
              color: selectedNiche === niche.id ? '#8b5cf6' : '#a1a1aa',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {niche.icon} {niche.name}
          </button>
        ))}
      </div>

      {/* === GENERATE BUTTON === */}
      <button
        className="generate-btn"
        disabled={!canGenerate}
        onClick={() => startGenerateVideo(selectedNiche)}
      >
        {generatingVideo && (
          <div className="generate-btn__progress" style={{ width: `${generateProgress}%` }} />
        )}
        <span style={{ position: 'relative', zIndex: 1 }}>
          {generatingVideo
            ? `⏳ Генерация... ${Math.round(generateProgress)}%`
            : `🎬 Генерировать видео (${currentNiche?.computeCost || 0}⚡)`
          }
        </span>
      </button>

      {/* === EQUIPMENT GRID === */}
      <div className="equipment-section">
        <div className="section-header">
          <span className="section-title">⚡ Оборудование</span>
          <span className="section-subtitle">{equipmentSlots.filter(s => s !== null).length}/{equipmentSlots.length} слотов</span>
        </div>
        <div className="equipment-grid">
          {equipmentSlots.map((eqId, idx) => {
            const eq = eqId ? EQUIPMENT.find(e => e.id === eqId) : null;
            return (
              <motion.div
                key={idx}
                className={`equipment-card ${!eq ? 'equipment-card--empty' : ''}`}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {eq ? (
                  <>
                    <span className="equipment-card__tier">T{eq.tier}</span>
                    <span className="equipment-card__icon">{eq.icon}</span>
                    <span className="equipment-card__name">{eq.name}</span>
                    <span className="equipment-card__compute">+{eq.computePerSec}/с</span>
                  </>
                ) : (
                  <span className="equipment-card__icon" style={{ opacity: 0.3 }}>+</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* === LIVE VIDEOS ===  */}
      {liveVideos.length > 0 && (
        <div className="equipment-section">
          <div className="section-header">
            <span className="section-title">📱 Активные видео</span>
            <span className="section-subtitle">{liveVideos.length} live</span>
          </div>
          <div className="video-feed">
            {liveVideos.map(video => (
              <motion.div
                key={video.id}
                className="video-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="video-item__icon">
                  {NICHES.find(n => n.id === video.nicheId)?.icon || '🎬'}
                </span>
                <div className="video-item__info">
                  <div className="video-item__title">{video.title}</div>
                  <div className="video-item__views">
                    👁 {formatNumber(video.totalViews)} просмотров • 
                    {Object.keys(video.platforms).map(p => PLATFORMS_ICONS[p]).join(' ')}
                  </div>
                </div>
                <span className={`video-item__status video-item__status--${video.status}`}>
                  {video.status === 'viral' ? '🔥 Вирал' : video.status === 'live' ? '📈 Растёт' : '💤'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PLATFORMS_ICONS = {
  tiktok: '🎵',
  youtube: '▶️',
  instagram: '📸',
};
