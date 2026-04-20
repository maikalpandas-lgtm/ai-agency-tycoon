import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';

export default function EventToast() {
  const { activeEvent } = useGameStore();

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          className={`event-toast ${
            activeEvent.id === 'ban' || activeEvent.id === 'gpu_burn' || activeEvent.id === 'algo_change'
              ? 'event-toast--negative'
              : activeEvent.id === 'sale'
              ? 'event-toast--warning'
              : 'event-toast--positive'
          }`}
          initial={{ x: '-50%', y: -100, opacity: 0 }}
          animate={{ x: '-50%', y: 0, opacity: 1 }}
          exit={{ x: '-50%', y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <span className="event-toast__text">{activeEvent.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
