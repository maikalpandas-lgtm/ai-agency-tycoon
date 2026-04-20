import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { PLATFORMS } from '../data/gameData';

export default function PublishModal() {
  const { showPublishModal, pendingVideo, channels, publishVideo, closePublishModal, canUnlockPlatform } = useGameStore();
  const [selectedPlatforms, setSelectedPlatforms] = useState(['tiktok']);

  if (!showPublishModal || !pendingVideo) return null;

  const togglePlatform = (pid) => {
    setSelectedPlatforms(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  };

  const handlePublish = () => {
    // Only publish to platforms that have channels
    const validPlatforms = selectedPlatforms.filter(pid =>
      channels.find(c => c.platform === pid)
    );
    if (validPlatforms.length > 0) {
      publishVideo(validPlatforms);
      setSelectedPlatforms(['tiktok']);
    }
  };

  const platformIds = ['tiktok', 'youtube', 'instagram'];

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closePublishModal}
      >
        <motion.div
          className="modal-content"
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <h2>📱 Опубликовать видео</h2>

          {/* Video preview */}
          <div style={{
            padding: 14,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{pendingVideo.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Готово к публикации
            </div>
          </div>

          {/* Platform selection */}
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
            Выбери платформы:
          </div>

          {platformIds.map(pid => {
            const platform = PLATFORMS[pid];
            const hasChannel = channels.find(c => c.platform === pid);
            const unlocked = canUnlockPlatform(pid);
            const isSelected = selectedPlatforms.includes(pid);
            const isAvailable = hasChannel && unlocked;

            return (
              <div
                key={pid}
                className={`platform-option ${isSelected && isAvailable ? 'platform-option--selected' : ''} ${!isAvailable ? 'platform-option--locked' : ''}`}
                onClick={() => isAvailable && togglePlatform(pid)}
              >
                <span className="platform-option__icon">{platform.icon}</span>
                <span className="platform-option__name">
                  {platform.name}
                  {!hasChannel && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> (нет канала)</span>}
                </span>
                {isAvailable && (
                  <span className="platform-option__check">
                    {isSelected ? '✓' : ''}
                  </span>
                )}
              </div>
            );
          })}

          {selectedPlatforms.length > 1 && (
            <div style={{ fontSize: 11, color: 'var(--accent-warning)', margin: '8px 0' }}>
              ⚠️ Кросс-постинг: алгоритмы платформ снижают охват на -20%
            </div>
          )}

          <button
            className="generate-btn"
            style={{ marginTop: 16 }}
            onClick={handlePublish}
            disabled={selectedPlatforms.filter(p => channels.find(c => c.platform === p)).length === 0}
          >
            🚀 Опубликовать
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
