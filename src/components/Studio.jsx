import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { EQUIPMENT, NICHES, formatNumber, formatDollars } from '../data/gameData';

export default function Studio() {
  const {
    compute, computePerTap, selectedNiche, dollars,
    generatingVideo, generateProgress, equipmentSlots, selectedSlot,
    getComputePerSec, getAvailableNiches, getStaffMultipliers,
    tap, startGenerateVideo, selectSlot, upgradeEquipmentDirect,
    videos, tapParticles,
  } = useGameStore();

  const cps = getComputePerSec();
  const mults = getStaffMultipliers();
  const effectiveTap = computePerTap + mults.tapBonus;
  const niches = getAvailableNiches();
  const liveVideos = videos.filter(v => v.status !== 'dead' && v.status !== 'ready');
  const currentNiche = NICHES.find(n => n.id === selectedNiche);

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tap(x, y);
  };

  // Generate floating dollars for videos
  const [floatingDollars, setFloatingDollars] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const activeGenVideos = videos.filter(v => v.status !== 'dead' && v.status !== 'ready');
      if (activeGenVideos.length > 0 && Math.random() > 0.3) {
        const randomVid = activeGenVideos[Math.floor(Math.random() * activeGenVideos.length)];
        const platform = PLATFORMS[randomVid.platform];
        if (!platform) return;
        const income = Math.floor((randomVid.totalViews / 1000) * platform.incomePerKViews);
        if (income > 0) {
          const id = Math.random().toString(36).substr(2, 9);
          setFloatingDollars(prev => [...prev, { id, videoId: randomVid.id, amount: income }]);
          setTimeout(() => {
            setFloatingDollars(prev => prev.filter(d => d.id !== id));
          }, 2000);
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [videos]);

  return (
    <div className="studio">
      {/* === Workspace Tap Area === */}
      <motion.div
        className={`studio__workspace workspace-${level}`}
        onClick={handleTap}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated background particles */}
        <div className="studio__particles-bg">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`studio__orb studio__orb--${i + 1}`} />
          ))}
        </div>

        <div className="studio__tap-area">
          <motion.div
            className="studio__compute-display"
            key={compute}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {formatNumber(compute)} ⚡
          </motion.div>
          <div className="studio__compute-rate">
            +{cps}/сек пассивно • +{effectiveTap}/тап
          </div>
          <div className="studio__tap-hint">
            👆 Тапай чтобы майнить Compute
          </div>
        </div>

        {/* Tap particles */}
        <AnimatePresence>
          {tapParticles.map(p => (
            <motion.div
              key={p.id}
              className="tap-particle"
              initial={{ opacity: 1, y: 0, x: p.x - 20, top: p.y }}
              animate={{ opacity: 0, y: -60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ position: 'absolute', left: p.x - 20, top: p.y }}
            >
              {p.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* === Niche Selector === */}
      <div className="niche-selector">
        {niches.map(n => (
          <button
            key={n.id}
            className={`niche-pill ${selectedNiche === n.id ? 'niche-pill--active' : ''}`}
            onClick={() => useGameStore.setState({ selectedNiche: n.id })}
          >
            {n.icon} {n.name}
          </button>
        ))}
      </div>

      {/* === Generate Button === */}
      <motion.button
        className="generate-btn"
        onClick={() => startGenerateVideo(selectedNiche)}
        disabled={generatingVideo || compute < (currentNiche?.computeCost || 10)}
        whileTap={{ scale: 0.97 }}
      >
        {generatingVideo && (
          <div className="generate-btn__progress" style={{ width: `${generateProgress}%` }} />
        )}
        {generatingVideo
          ? `⏳ Генерация ${Math.floor(generateProgress)}%`
          : `🎬 Генерировать видео (${currentNiche?.computeCost || 10}⚡)`
        }
      </motion.button>

      {/* === Equipment Grid === */}
      <div className="equipment-section">
        <div className="section-header">
          <span className="section-title">⚡ Оборудование</span>
          <span className="section-subtitle">{equipmentSlots.filter(e => e !== null).length}/{equipmentSlots.length} слотов</span>
        </div>
        <div className="equipment-grid">
          {equipmentSlots.map((eqId, idx) => {
            const equip = EQUIPMENT.find(e => e.id === eqId);
            const isSelected = selectedSlot === idx;
            const canMerge = selectedSlot !== null && selectedSlot !== idx && eqId !== null 
              && equipmentSlots[selectedSlot] === eqId
              && EQUIPMENT.find(e => e.id === eqId + 1);

            return (
              <motion.div
                key={idx}
                className={`equipment-card ${!equip ? 'equipment-card--empty' : ''} ${isSelected ? 'equipment-card--selected' : ''} ${canMerge ? 'equipment-card--merge' : ''} ${equip && equip.tier >= 5 ? 'equipment-card--holo' : ''}`}
                onClick={() => equip && selectSlot(idx)}
                whileTap={equip ? { scale: 0.9 } : {}}
                layout
              >
                {equip ? (
                  <>
                    <span className="equipment-card__tier">T{equip.tier}</span>
                    <span className="equipment-card__icon">{equip.icon}</span>
                    <span className="equipment-card__name">{equip.name}</span>
                    <span className="equipment-card__compute">+{equip.computePerSec}/с</span>
                    {canMerge && <span className="equipment-card__merge-badge">🔄</span>}
                  </>
                ) : (
                  <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>+</span>
                )}
              </motion.div>
            );
          })}
        </div>
        {selectedSlot !== null && (
          <div className="selected-actions" style={{ marginTop: 12, padding: 12, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div className="merge-hint" style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
              💡 Тапни на такое же оборудование для бесплатного слияния (Merge) ↑
            </div>
            {(() => {
               const eqId = equipmentSlots[selectedSlot];
               if (eqId === null) return null;
               const nextTier = EQUIPMENT.find(e => e.id === eqId + 1);
               if (nextTier) {
                 const upgradeCost = Math.floor(nextTier.price * mults.equipDiscount);
                 const canAfford = dollars >= upgradeCost;
                 return (
                   <button 
                     className="generate-btn"
                     style={{ 
                       opacity: canAfford ? 1 : 0.5, 
                       padding: '12px', 
                       fontSize: 14,
                       background: canAfford ? 'var(--gradient-cta)' : 'var(--bg-secondary)',
                       boxShadow: 'none'
                     }}
                     onClick={() => upgradeEquipmentDirect(selectedSlot)}
                     disabled={!canAfford}
                   >
                     🚀 Апгрейд до {nextTier.name} ({formatDollars(upgradeCost)})
                   </button>
                 );
               } else {
                 return <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Максимальный уровень</div>;
               }
            })()}
          </div>
        )}
      </div>

      {/* === Active Videos === */}
      {liveVideos.length > 0 && (
        <div className="video-feed">
          <div className="section-header">
            <span className="section-title">📺 Активные видео</span>
            <span className="section-subtitle">{liveVideos.length} live</span>
          </div>
          {liveVideos.slice(0, 5).map(video => {
            const niche = NICHES.find(n => n.id === video.nicheId);
            return (
              <motion.div
                key={video.id}
                className="video-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="video-item__icon">{niche?.icon}</span>
                <div className="video-item__info">
                  <div className="video-item__title">{video.title}</div>
                  <div className="video-item__views">
                    👁 {formatNumber(video.totalViews)} просмотров • 🎵
                  </div>
                </div>
                <span className={`video-item__status video-item__status--${video.status}`}>
                  {video.status === 'viral' ? '🔥 Viral' : video.status === 'live' ? '📈 Растёт' : '💀'}
                </span>
                <AnimatePresence>
                  {floatingDollars.filter(d => d.videoId === video.id).map(d => (
                    <div key={d.id} className="floating-dollar">
                      +${d.amount}
                    </div>
                  ))}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
