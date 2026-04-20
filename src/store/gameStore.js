import { create } from 'zustand';
import { EQUIPMENT, WORKSPACES, NICHES, PLATFORMS, VIDEO_TITLES, GAME_LEVELS, EVENTS, randomBetween, randomChoice } from '../data/gameData';

// ===== HAPTIC FEEDBACK =====
const haptic = {
  light: () => { try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch(e) {} },
  medium: () => { try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); } catch(e) {} },
  heavy: () => { try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'); } catch(e) {} },
  success: () => { try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch(e) {} },
  warning: () => { try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning'); } catch(e) {} },
  error: () => { try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'); } catch(e) {} },
  tap: () => { try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch(e) {} },
};

// ===== LOCAL STORAGE =====
const SAVE_KEY = 'ai_agency_tycoon_save';

function saveGame(state) {
  try {
    const saveData = {
      compute: state.compute,
      dollars: state.dollars,
      totalFollowers: state.totalFollowers,
      computePerTap: state.computePerTap,
      workspaceLevel: state.workspaceLevel,
      equipmentSlots: state.equipmentSlots,
      channels: state.channels,
      videos: state.videos.filter(v => v.status !== 'dead').slice(0, 20),
      level: state.level,
      selectedNiche: state.selectedNiche,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch(e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Calculate offline earnings
    const offlineSeconds = Math.min((Date.now() - data.savedAt) / 1000, 3600 * 8); // max 8h
    let offlineCompute = 0;
    if (data.equipmentSlots) {
      const cps = data.equipmentSlots.reduce((total, eq) => {
        if (!eq) return total;
        const eqData = EQUIPMENT.find(e => e.id === eq);
        return total + (eqData?.computePerSec || 0);
      }, 0);
      offlineCompute = Math.floor(cps * offlineSeconds);
    }
    return { ...data, offlineCompute, offlineSeconds };
  } catch(e) {
    console.warn('Load failed:', e);
    return null;
  }
}

// ===== STORE =====
const useGameStore = create((set, get) => ({
  // ===== CORE STATE =====
  compute: 0,
  dollars: 10,  // 🔥 START WITH $10 so player can buy first upgrade faster
  totalFollowers: 0,
  computePerTap: 1,
  
  // ===== WORKSPACE =====
  workspaceLevel: 1,
  equipmentSlots: Array(2).fill(null),
  
  // ===== CHANNELS =====
  channels: [],
  
  // ===== VIDEOS =====
  videos: [],
  
  // ===== GAME PROGRESS =====
  level: 1,
  generatingVideo: false,
  generateProgress: 0,
  selectedNiche: 1,
  
  // ===== EVENTS =====
  activeEvent: null,
  offlineEarnings: null,
  
  // ===== UI =====
  activeTab: 'studio',
  showPublishModal: false,
  pendingVideo: null,
  tapParticles: [],

  // ===== COMPUTED =====
  getComputePerSec: () => {
    const state = get();
    return state.equipmentSlots.reduce((total, eq) => {
      if (!eq) return total;
      const data = EQUIPMENT.find(e => e.id === eq);
      return total + (data?.computePerSec || 0);
    }, 0);
  },

  getTotalFollowers: () => {
    return get().channels.reduce((sum, ch) => sum + ch.followers, 0);
  },
  
  getMonthlyIncome: () => {
    return get().channels.reduce((sum, ch) => sum + ch.income, 0);
  },

  getCurrentWorkspace: () => {
    return WORKSPACES.find(w => w.level === get().workspaceLevel);
  },

  getNextMilestone: (channelId) => {
    const channel = get().channels.find(c => c.id === channelId);
    if (!channel) return null;
    const platform = PLATFORMS[channel.platform];
    return platform.milestones.find(m => channel.followers < m.followers);
  },

  getAvailableNiches: () => {
    const totalFollowers = get().getTotalFollowers();
    return NICHES.filter(n => totalFollowers >= n.unlock);
  },

  getCurrentLevel: () => {
    return GAME_LEVELS.find(l => l.level === get().level) || GAME_LEVELS[0];
  },

  canUnlockPlatform: (platformId) => {
    const platform = PLATFORMS[platformId];
    return get().getTotalFollowers() >= platform.unlockFollowers;
  },

  // ===== ACTIONS =====
  
  // --- TAP ---
  tap: (x, y) => {
    const state = get();
    const amount = state.computePerTap;
    haptic.tap();
    const particle = {
      id: Date.now() + Math.random(),
      x, y,
      value: `+${amount}⚡`,
    };
    set(s => ({
      compute: s.compute + amount,
      tapParticles: [...s.tapParticles.slice(-10), particle],
    }));
    setTimeout(() => {
      set(s => ({ tapParticles: s.tapParticles.filter(p => p.id !== particle.id) }));
    }, 600);
  },

  // --- PASSIVE COMPUTE (called every second) ---
  tickCompute: () => {
    const cps = get().getComputePerSec();
    if (cps > 0) {
      set(s => ({ compute: s.compute + cps }));
    }
  },

  // --- BUY EQUIPMENT ---
  buyEquipment: (equipId) => {
    const state = get();
    const equip = EQUIPMENT.find(e => e.id === equipId);
    if (!equip || state.dollars < equip.price) return false;
    
    const emptySlot = state.equipmentSlots.indexOf(null);
    if (emptySlot === -1) return false;

    const newSlots = [...state.equipmentSlots];
    newSlots[emptySlot] = equipId;
    
    set({
      dollars: state.dollars - equip.price,
      equipmentSlots: newSlots,
    });
    haptic.success();
    saveGame(get());
    return true;
  },

  // --- MERGE EQUIPMENT ---
  mergeEquipment: (slotA, slotB) => {
    const state = get();
    const idA = state.equipmentSlots[slotA];
    const idB = state.equipmentSlots[slotB];
    if (!idA || !idB || idA !== idB) return false;

    const nextTier = EQUIPMENT.find(e => e.id === idA + 1);
    if (!nextTier) return false;

    const newSlots = [...state.equipmentSlots];
    newSlots[slotA] = nextTier.id;
    newSlots[slotB] = null;

    set({ equipmentSlots: newSlots });
    haptic.heavy();
    saveGame(get());
    return true;
  },

  // --- UPGRADE WORKSPACE ---
  upgradeWorkspace: () => {
    const state = get();
    const nextLevel = state.workspaceLevel + 1;
    const next = WORKSPACES.find(w => w.level === nextLevel);
    if (!next || state.dollars < next.unlockPrice) return false;

    const currentSlots = state.equipmentSlots.length;
    const newSlots = [...state.equipmentSlots, ...Array(next.slots - currentSlots).fill(null)];

    set({
      workspaceLevel: nextLevel,
      dollars: state.dollars - next.unlockPrice,
      equipmentSlots: newSlots,
    });
    haptic.heavy();
    saveGame(get());
    return true;
  },

  // --- GENERATE VIDEO ---
  startGenerateVideo: (nicheId) => {
    const state = get();
    const niche = NICHES.find(n => n.id === nicheId);
    if (!niche || state.compute < niche.computeCost || state.generatingVideo) return false;

    haptic.medium();
    set({
      compute: state.compute - niche.computeCost,
      generatingVideo: true,
      generateProgress: 0,
      selectedNiche: nicheId,
    });

    const duration = Math.min(2000 + nicheId * 500, 8000);
    const interval = 50;
    let progress = 0;
    const timer = setInterval(() => {
      progress += (interval / duration) * 100;
      if (progress >= 100) {
        clearInterval(timer);
        const titles = VIDEO_TITLES[nicheId] || ['AI видео'];
        const video = {
          id: Date.now(),
          title: randomChoice(titles),
          nicheId,
          platforms: {},
          totalViews: 0,
          status: 'ready',
          createdAt: Date.now(),
        };
        set({
          generatingVideo: false,
          generateProgress: 100,
          pendingVideo: video,
          showPublishModal: true,
        });
        haptic.success();
      } else {
        set({ generateProgress: progress });
      }
    }, interval);

    return true;
  },

  // --- PUBLISH VIDEO ---
  publishVideo: (platformIds) => {
    const state = get();
    const video = state.pendingVideo;
    if (!video || platformIds.length === 0) return;

    const platforms = {};
    platformIds.forEach(pid => {
      platforms[pid] = { views: 0, wave: 0, lastWaveTime: Date.now() };
    });

    const publishedVideo = {
      ...video,
      platforms,
      status: 'live',
    };

    set(s => ({
      videos: [publishedVideo, ...s.videos].slice(0, 50),
      pendingVideo: null,
      showPublishModal: false,
    }));
    haptic.success();
    saveGame(get());
  },

  // --- TICK VIDEOS (called every 5 seconds) ---
  tickVideos: () => {
    const state = get();
    if (state.videos.length === 0) return;

    let dollarsEarned = 0;

    const updatedVideos = state.videos.map(video => {
      if (video.status === 'dead') return video;
      
      const niche = NICHES.find(n => n.id === video.nicheId);
      let totalNewViews = 0;
      const updatedPlatforms = { ...video.platforms };

      Object.entries(video.platforms).forEach(([pid, pdata]) => {
        const platform = PLATFORMS[pid];
        if (!platform) return;

        const qualityMultiplier = 1 + (state.getComputePerSec() / 50); // 🔥 buffed quality bonus
        
        const isViral = Math.random() < platform.viralChance;
        const waveMultiplier = isViral ? 10 : 1;
        
        const baseViews = randomBetween(niche.baseViews[0], niche.baseViews[1]);
        // 🔥 BUFFED: /50 instead of /100 — faster view growth
        const newViews = Math.floor(
          (baseViews / 50) * qualityMultiplier * platform.viewMultiplier * waveMultiplier * (1 + Math.random())
        );

        updatedPlatforms[pid] = {
          ...pdata,
          views: pdata.views + newViews,
        };

        totalNewViews += newViews;

        // 🔥 BUFFED: income starts at 1000 followers instead of 10000
        const channel = state.channels.find(c => c.platform === pid);
        if (channel && channel.followers >= 1000) {
          dollarsEarned += (newViews / 1000) * platform.incomePerKViews * 5; // 🔥 x5 income multiplier
        }
      });

      const totalViews = Object.values(updatedPlatforms).reduce((s, p) => s + p.views, 0);
      const ageHours = (Date.now() - video.createdAt) / (1000 * 3600);
      const newStatus = totalViews > niche.baseViews[1] * 5 ? 'viral' : ageHours > 48 ? 'dead' : 'live';

      return { ...video, platforms: updatedPlatforms, totalViews, status: newStatus };
    });

    // Distribute followers to channels
    const updatedChannels = state.channels.map(ch => {
      const channelVideoViews = updatedVideos
        .filter(v => v.platforms[ch.platform])
        .reduce((sum, v) => sum + (v.platforms[ch.platform]?.views || 0), 0);
      
      const prevViews = state.videos
        .filter(v => v.platforms[ch.platform])
        .reduce((sum, v) => sum + (v.platforms[ch.platform]?.views || 0), 0);
      
      const newViews = channelVideoViews - prevViews;
      // 🔥 BUFFED: 3% conversion instead of 1%
      const newFollowers = Math.floor(newViews * 0.03);
      
      const platform = PLATFORMS[ch.platform];
      let income = 0;
      if (ch.followers >= 1000) {
        income = (newViews / 1000) * platform.incomePerKViews * 30 * 5;
      }

      return {
        ...ch,
        followers: ch.followers + newFollowers,
        totalViews: ch.totalViews + newViews,
        income,
      };
    });

    const newDollars = state.dollars + dollarsEarned;
    
    set({
      videos: updatedVideos,
      channels: updatedChannels,
      dollars: newDollars,
      totalFollowers: updatedChannels.reduce((s, c) => s + c.followers, 0),
    });

    // 🔥 Auto-save every tick
    saveGame(get());
  },

  // --- CREATE CHANNEL ---
  createChannel: (platformId, nicheId) => {
    const state = get();
    const platform = PLATFORMS[platformId];
    if (!platform) return false;

    const existingOnPlatform = state.channels.filter(c => c.platform === platformId);
    if (existingOnPlatform.length > 0) return false;

    const niche = NICHES.find(n => n.id === nicheId);
    const channel = {
      id: Date.now(),
      platform: platformId,
      niche: nicheId,
      name: `@ai_${niche.name.toLowerCase().replace(/\s/g, '_')}`,
      followers: 0,
      totalViews: 0,
      videos: [],
      income: 0,
      createdAt: Date.now(),
    };

    set(s => ({ channels: [...s.channels, channel] }));
    haptic.success();
    saveGame(get());
    return true;
  },

  // --- CHECK LEVEL UP ---
  checkLevelUp: () => {
    const state = get();
    const currentLevel = GAME_LEVELS.find(l => l.level === state.level);
    if (!currentLevel) return;

    const totalFollowers = state.getTotalFollowers();
    const meetsFollowers = totalFollowers >= currentLevel.goalFollowers;
    const meetsDollars = !currentLevel.goalDollars || state.dollars >= currentLevel.goalDollars;

    if (meetsFollowers && meetsDollars && state.level < 10) {
      set(s => ({ level: s.level + 1 }));
      haptic.heavy();
      saveGame(get());
      return true;
    }
    return false;
  },

  // --- RANDOM EVENT ---
  triggerRandomEvent: () => {
    const state = get();
    if (state.activeEvent) return;

    const isPositive = Math.random() > 0.3;
    const pool = isPositive ? EVENTS.positive : EVENTS.negative;
    const event = randomChoice(pool);

    set({ activeEvent: { ...event, startedAt: Date.now() } });
    isPositive ? haptic.success() : haptic.warning();

    if (event.effect.addDollars) {
      set(s => ({ dollars: s.dollars + event.effect.addDollars }));
    }
    if (event.effect.removeDollars) {
      set(s => ({ dollars: Math.max(0, s.dollars - event.effect.removeDollars) }));
    }
    if (event.effect.addFollowers) {
      set(s => {
        if (s.channels.length === 0) return {};
        const channels = [...s.channels];
        channels[0] = { ...channels[0], followers: channels[0].followers + event.effect.addFollowers };
        return { channels, totalFollowers: channels.reduce((sum, c) => sum + c.followers, 0) };
      });
    }

    const duration = event.duration || 5000;
    setTimeout(() => {
      set({ activeEvent: null });
    }, Math.min(duration, 8000));
  },

  // --- UI ---
  setActiveTab: (tab) => { set({ activeTab: tab }); haptic.tap(); },
  closePublishModal: () => set({ showPublishModal: false, pendingVideo: null }),
  dismissOffline: () => set({ offlineEarnings: null }),

  // --- INIT ---
  initGame: () => {
    const saved = loadGame();
    if (saved) {
      // Restore saved state
      set({
        compute: saved.compute + (saved.offlineCompute || 0),
        dollars: saved.dollars,
        totalFollowers: saved.totalFollowers,
        computePerTap: saved.computePerTap || 1,
        workspaceLevel: saved.workspaceLevel,
        equipmentSlots: saved.equipmentSlots,
        channels: saved.channels,
        videos: saved.videos,
        level: saved.level,
        selectedNiche: saved.selectedNiche || 1,
        offlineEarnings: saved.offlineCompute > 0 ? {
          compute: saved.offlineCompute,
          seconds: Math.floor(saved.offlineSeconds),
        } : null,
      });
      console.log(`✅ Game loaded! +${saved.offlineCompute}⚡ offline earnings`);
    } else {
      // New game: give starter equipment and channel
      const state = get();
      if (state.equipmentSlots[0] === null) {
        const slots = [...state.equipmentSlots];
        slots[0] = 1; // starter laptop
        set({ equipmentSlots: slots });
      }
      if (state.channels.length === 0) {
        get().createChannel('tiktok', 1);
      }
      saveGame(get());
    }
  },
}));

export default useGameStore;
