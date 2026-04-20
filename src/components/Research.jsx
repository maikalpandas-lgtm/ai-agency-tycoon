import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { RESEARCH_NODES } from '../data/gameData';
import { formatNumber } from '../data/gameData';

export default function Research() {
  const { compute, unlockedResearch, buyResearch } = useGameStore();

  return (
    <div className="shop">
      <div className="section-header">
        <span className="section-title">🔬 R&D Лаборатория</span>
        <span className="section-subtitle">Технологии будущего</span>
      </div>

      <div className="staff-grid">
        {RESEARCH_NODES.map(node => {
          const isUnlocked = unlockedResearch.includes(node.id);
          const canAfford = typeof compute === 'number' && typeof node.price === 'number' && compute >= node.price;

          return (
            <motion.div
              key={node.id}
              className={`staff-card ${isUnlocked ? 'staff-card--hired' : ''} ${!isUnlocked && !canAfford ? 'staff-card--locked' : ''}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={(!isUnlocked && canAfford) ? { scale: 0.95 } : {}}
              onClick={() => {
                if (!isUnlocked) buyResearch(node.id);
              }}
            >
              <div className="staff-card__info">
                <span className="staff-card__icon">{node.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="staff-card__name">{node.name}</div>
                  <div className="staff-card__desc">{node.desc}</div>
                </div>
              </div>
              {!isUnlocked ? (
                <button 
                  className="staff-card__buy"
                  disabled={!canAfford}
                >
                  Исследовать: {formatNumber(node.price)} ⚡
                </button>
              ) : (
                <div className="staff-card__hired-badge">Изучено ✔️</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
