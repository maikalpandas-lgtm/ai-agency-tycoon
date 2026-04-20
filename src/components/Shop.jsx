import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { EQUIPMENT, WORKSPACES, STAFF, formatDollars, formatNumber } from '../data/gameData';

export default function Shop() {
  const {
    dollars, workspaceLevel, equipmentSlots, staff,
    buyEquipment, upgradeWorkspace, hireStaff,
    getCurrentWorkspace, getTotalFollowers, getStaffMultipliers,
  } = useGameStore();

  const currentWS = getCurrentWorkspace();
  const nextWS = WORKSPACES.find(w => w.level === workspaceLevel + 1);
  const mults = getStaffMultipliers();
  const totalFollowers = getTotalFollowers();
  const hasEmptySlots = equipmentSlots.includes(null);

  return (
    <div className="shop">
      {/* === WORKSPACE UPGRADE === */}
      {nextWS && (
        <>
          <div className="section-header">
            <span className="section-title">🏢 Рабочее место</span>
            <span className="section-subtitle">{currentWS?.name}</span>
          </div>
          <motion.div
            className={`shop-card shop-card--upgrade ${dollars < nextWS.unlockPrice ? 'shop-card--locked' : ''}`}
            onClick={() => upgradeWorkspace()}
            whileTap={{ scale: 0.97 }}
          >
            <span className="shop-card__icon">🔓</span>
            <div className="shop-card__info">
              <div className="shop-card__name">{nextWS.name}</div>
              <div className="shop-card__desc">{nextWS.slots} слотов для оборудования</div>
            </div>
            <span className={`shop-card__price ${dollars < nextWS.unlockPrice ? 'shop-card__price--cant-afford' : ''}`}>
              {formatDollars(nextWS.unlockPrice)}
            </span>
          </motion.div>
        </>
      )}

      {/* === EQUIPMENT === */}
      <div className="section-header" style={{ marginTop: 12 }}>
        <span className="section-title">⚡ Оборудование</span>
        <span className="section-subtitle">{hasEmptySlots ? '✅ Есть слоты' : '❌ Нет слотов'}</span>
      </div>
      {EQUIPMENT.filter(e => e.price > 0).map(equip => {
        const price = Math.floor(equip.price * mults.equipDiscount);
        const canBuy = dollars >= price && hasEmptySlots;
        return (
          <motion.div
            key={equip.id}
            className={`shop-card ${!canBuy ? 'shop-card--locked' : ''}`}
            onClick={() => canBuy && buyEquipment(equip.id)}
            whileTap={canBuy ? { scale: 0.97 } : {}}
          >
            <span className="shop-card__icon">{equip.icon}</span>
            <div className="shop-card__info">
              <div className="shop-card__name">{equip.name}</div>
              <div className="shop-card__desc">{equip.desc}</div>
              <div className="shop-card__stats">+{equip.computePerSec} Compute/сек</div>
            </div>
            <span className={`shop-card__price ${dollars < price ? 'shop-card__price--cant-afford' : ''}`}>
              {mults.equipDiscount < 1 && <span style={{ fontSize: 10, textDecoration: 'line-through', opacity: 0.5, marginRight: 4 }}>{formatDollars(equip.price)}</span>}
              {formatDollars(price)}
            </span>
          </motion.div>
        );
      })}

      {/* === STAFF === */}
      <div className="section-header" style={{ marginTop: 16 }}>
        <span className="section-title">👥 Сотрудники</span>
        <span className="section-subtitle">{staff.length} нанято</span>
      </div>
      {STAFF.map(s => {
        const hired = staff.includes(s.id);
        const canHire = !hired && dollars >= s.price && totalFollowers >= s.unlock;
        const locked = totalFollowers < s.unlock;
        return (
          <motion.div
            key={s.id}
            className={`shop-card ${hired ? 'shop-card--hired' : ''} ${!canHire && !hired ? 'shop-card--locked' : ''}`}
            onClick={() => canHire && hireStaff(s.id)}
            whileTap={canHire ? { scale: 0.97 } : {}}
          >
            <span className="shop-card__icon">{s.icon}</span>
            <div className="shop-card__info">
              <div className="shop-card__name">
                {s.name}
                {hired && <span className="shop-card__badge">✅ Нанят</span>}
              </div>
              <div className="shop-card__desc">{s.desc}</div>
              {locked && (
                <div className="shop-card__stats" style={{ color: 'var(--text-muted)' }}>
                  🔒 Нужно {formatNumber(s.unlock)} подписчиков
                </div>
              )}
            </div>
            {!hired && (
              <span className={`shop-card__price ${dollars < s.price || locked ? 'shop-card__price--cant-afford' : ''}`}>
                {formatDollars(s.price)}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
