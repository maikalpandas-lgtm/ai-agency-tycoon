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

      <div style={{ marginTop: 12 }}>
        {RESEARCH_NODES.map(node => {
          const isUnlocked = unlockedResearch.includes(node.id);
          const canAfford = typeof compute === 'number' && typeof node.price === 'number' && compute >= node.price;

          return (
            <motion.div
              key={node.id}
              className={`shop-card ${isUnlocked ? 'shop-card--hired' : ''} ${!isUnlocked && !canAfford ? 'shop-card--locked' : ''}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={(!isUnlocked && canAfford) ? { scale: 0.95 } : {}}
              onClick={() => {
                if (!isUnlocked) buyResearch(node.id);
              }}
            >
              <span className="shop-card__icon">{node.icon}</span>
              <div className="shop-card__info" style={{ flex: 1 }}>
                <div className="shop-card__name">{node.name}</div>
                <div className="shop-card__desc">{node.desc}</div>
              </div>
              {!isUnlocked ? (
                 <button 
                  className="generate-btn"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13, background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', boxShadow: 'none' }}
                  disabled={!canAfford}
                >
                  Исследовать: {formatNumber(node.price)} ⚡
                </button>
              ) : (
                <div className="shop-card__badge">✔️ Изучено</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
