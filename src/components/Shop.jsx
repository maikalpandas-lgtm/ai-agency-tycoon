import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { EQUIPMENT, WORKSPACES, formatDollars } from '../data/gameData';

export default function Shop() {
  const { dollars, equipmentSlots, workspaceLevel, buyEquipment, upgradeWorkspace } = useGameStore();
  const currentWorkspace = WORKSPACES.find(w => w.level === workspaceLevel);
  const nextWorkspace = WORKSPACES.find(w => w.level === workspaceLevel + 1);
  const hasEmptySlot = equipmentSlots.includes(null);

  return (
    <div className="shop">
      <div className="section-header" style={{ marginBottom: 4 }}>
        <span className="section-title">🛒 Магазин</span>
        <span className="section-subtitle">Баланс: {formatDollars(dollars)}</span>
      </div>

      {/* === WORKSPACE UPGRADE === */}
      {nextWorkspace && (
        <motion.div
          className={`shop-card ${dollars < nextWorkspace.unlockPrice ? 'shop-card--locked' : ''}`}
          whileTap={{ scale: 0.98 }}
          onClick={() => upgradeWorkspace()}
          style={{ borderColor: dollars >= nextWorkspace.unlockPrice ? '#f59e0b50' : undefined }}
        >
          <span className="shop-card__icon">🏢</span>
          <div className="shop-card__info">
            <div className="shop-card__name">Улучшить до: {nextWorkspace.name}</div>
            <div className="shop-card__desc">{nextWorkspace.slots} слотов под оборудование</div>
            <div className="shop-card__stats" style={{ color: '#f59e0b' }}>
              Сейчас: {currentWorkspace.name} ({currentWorkspace.slots} слотов)
            </div>
          </div>
          <span className={`shop-card__price ${dollars < nextWorkspace.unlockPrice ? 'shop-card__price--cant-afford' : ''}`}>
            {formatDollars(nextWorkspace.unlockPrice)}
          </span>
        </motion.div>
      )}

      {/* === EQUIPMENT LIST === */}
      <div className="section-header" style={{ marginTop: 8, marginBottom: 4 }}>
        <span className="section-title">⚡ Оборудование</span>
        <span className="section-subtitle">{!hasEmptySlot ? '⚠️ Нет свободных слотов' : ''}</span>
      </div>

      {EQUIPMENT.filter(e => e.price > 0).map(equip => {
        const canAfford = dollars >= equip.price;
        const canBuy = canAfford && hasEmptySlot;

        return (
          <motion.div
            key={equip.id}
            className={`shop-card ${!canBuy ? 'shop-card--locked' : ''}`}
            whileTap={canBuy ? { scale: 0.98 } : {}}
            onClick={() => canBuy && buyEquipment(equip.id)}
            style={{ opacity: canBuy ? 1 : canAfford ? 0.6 : 0.35 }}
          >
            <span className="shop-card__icon">{equip.icon}</span>
            <div className="shop-card__info">
              <div className="shop-card__name">{equip.name}</div>
              <div className="shop-card__desc">{equip.desc}</div>
              <div className="shop-card__stats">+{equip.computePerSec} ⚡/сек</div>
            </div>
            <span className={`shop-card__price ${!canAfford ? 'shop-card__price--cant-afford' : ''}`}>
              {formatDollars(equip.price)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
