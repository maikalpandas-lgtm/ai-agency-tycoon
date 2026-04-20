import { create } from 'zustand';
import { EQUIPMENT, WORKSPACES, NICHES, PLATFORMS, VIDEO_TITLES, GAME_LEVELS, EVENTS, STAFF, ACHIEVEMENTS, randomBetween, randomChoice } from '../data/gameData';

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
      staff: state.staff,
      achievements: state.achievements,
      totalVideosPublished: state.totalVideosPublished,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const offlineSeconds = Math.min((Date.now() - data.savedAt) / 1000, 3600 * 8);
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
    return null;
  }
}

// ===== STORE =====
const useGameStore = create((set, get) => ({
  // ===== CORE STATE =====
  compute: 0,
  dollars: 10,
  totalFollowers: 0,
  computePerTap: 1,
  
  // ===== WORKSPACE =====
  workspaceLevel: 1,
  equipmentSlots: Array(2).fill(null),
  selectedSlot: null, // for merge-by-tap
  
  // ===== STAFF =====
  staff: [], // hired staff ids
  
  // ===== ACHIEVEMENTS =====
  achievements: [], // unlocked achievement ids
  achievementToast: null, // currently showing achievement
  
  // ===== CHANNELS =====
  channels: [],
  
  // ===== VIDEOS =====
  videos: [],
  totalVideosPublished: 0,
  
  // ===== GAME PROGRESS =====
  level: 1,
  generatingVideo: false,
  generateProgress: 0,
  selectedNiche: 1,
  
  // ===== EVENTS =====
  activeEvent: null,
  offlineEarnings: null,
  screenShake: false,
  levelUpModal: null,
  
  // ===== UI =====
  activeTab: 'studio',
  showPublishModal: false,
  pendingVideo: null,
  tapParticles: [],

  // ===== COMPUTED =====
  getComputePerSec: () => {
    const state = get();
    let cps = state.equipmentSlots.reduce((total, eq) => {
      if (!eq) return total;
      const data = EQUIPMENT.find(e => e.id === eq);
      return total + (data?.computePerSec || 0);
    }, 0);
    // Staff: стажёр adds autoTap
    if (state.staff.includes(1)) cps += 1;
    return cps;
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

  getStaffMultipliers: () => {
    const state = get();
    let followerMult = 1;
    let viewMult = 1;
    let incomeMult = 1;
    let tapBonus = 0;
    let equipDiscount = 1;
    state.staff.forEach(sid => {
      const s = STAFF.find(st => st.id === sid);
      if (!s) return;
      if (s.effect.followerMultiplier) followerMult *= s.effect.followerMultiplier;
      if (s.effect.viewMultiplier) viewMult *= s.effect.viewMultiplier;
      if (s.effect.incomeMultiplier) incomeMult *= s.effect.incomeMultiplier;
      if (s.effect.tapBonus) tapBonus += s.effect.tapBonus;
      if (s.effect.equipDiscount) equipDiscount *= s.effect.equipDiscount;
    });
    return { followerMult, viewMult, incomeMult, tapBonus, equipDiscount };
  },

  // ===== ACHIEVEMENTS =====
  unlockAchievement: (achievementId) => {
    const state = get();
    if (state.achievements.includes(achievementId)) return;
    
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) return;

    const updates = { achievements: [...state.achievements, achievementId] };
    if (ach.rewardType === 'dollars') updates.dollars = state.dollars + ach.reward;
    if (ach.rewardType === 'compute') updates.compute = state.compute + ach.reward;
    
    set({ ...updates, achievementToast: ach });
    haptic.success();
    
    setTimeout(() => set({ achievementToast: null }), 4000);
    saveGame(get());
  },

  checkAchievements: () => {
    const state = get();
    const unlock = state.unlockAchievement;
    const totalFollowers = state.getTotalFollowers();
    
    if (state.videos.length > 0 || state.totalVideosPublished > 0) unlock('first_video');
    if (state.totalVideosPublished > 0) unlock('first_publish');
    if (state.totalVideosPublished >= 10) unlock('ten_videos');
    if (state.videos.some(v => v.totalViews >= 1000)) unlock('first_1k_views');
    if (state.videos.some(v => v.status === 'viral')) unlock('viral_video');
    if (totalFollowers >= 100) unlock('first_100_followers');
    if (totalFollowers >= 1000) unlock('first_1k_followers');
    if (state.dollars >= 1) unlock('first_dollar');
    if (state.staff.length > 0) unlock('hire_first');
    if (state.workspaceLevel >= 2) unlock('workspace_upgrade');
    if (state.channels.length >= 2) unlock('second_platform');
  },

  // ===== ACTIONS =====
  
  // --- TAP ---
  tap: (x, y) => {
    const state = get();
    const mults = state.getStaffMultipliers();
    const amount = state.computePerTap + mults.tapBonus;
    haptic.tap();
    const particle = {
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 20,
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

  // --- PASSIVE COMPUTE ---
  tickCompute: () => {
    const cps = get().getComputePerSec();
    if (cps > 0) {
      set(s => ({ compute: s.compute + cps }));
    }
  },

  // --- SELECT EQUIPMENT SLOT (for merge) ---
  selectSlot: (slotIndex) => {
    const state = get();
    const currentItem = state.equipmentSlots[slotIndex];
    
    if (!currentItem) {
      set({ selectedSlot: null });
      return;
    }
    
    // If no slot selected, select this one
    if (state.selectedSlot === null) {
      set({ selectedSlot: slotIndex });
      haptic.light();
      return;
    }
    
    // If same slot, deselect
    if (state.selectedSlot === slotIndex) {
      set({ selectedSlot: null });
      return;
    }
    
    // Try to merge
    const selectedItem = state.equipmentSlots[state.selectedSlot];
    if (selectedItem === currentItem) {
      const nextTier = EQUIPMENT.find(e => e.id === currentItem + 1);
      if (nextTier) {
        const newSlots = [...state.equipmentSlots];
        newSlots[state.selectedSlot] = nextTier.id;
        newSlots[slotIndex] = null;
        set({ equipmentSlots: newSlots, selectedSlot: null, screenShake: true });
        haptic.heavy();
        // Achievement
        state.unlockAchievement('merge_first');
        setTimeout(() => set({ screenShake: false }), 300);
        saveGame(get());
        return;
      }
    }
    
    // Different items — just select the new one
    set({ selectedSlot: slotIndex });
    haptic.light();
  },

  // --- BUY EQUIPMENT ---
  buyEquipment: (equipId) => {
    const state = get();
    const equip = EQUIPMENT.find(e => e.id === equipId);
    const mults = state.getStaffMultipliers();
    const price = Math.floor(equip.price * mults.equipDiscount);
    
    if (!equip || state.dollars < price) return false;
    
    const emptySlot = state.equipmentSlots.indexOf(null);
    if (emptySlot === -1) return false;

    const newSlots = [...state.equipmentSlots];
    newSlots[emptySlot] = equipId;
    
    set({
      dollars: state.dollars - price,
      equipmentSlots: newSlots,
    });
    haptic.success();
    saveGame(get());
    return true;
  },

  // --- MERGE EQUIPMENT (legacy) ---
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
    state.unlockAchievement('workspace_upgrade');
    haptic.heavy();
    saveGame(get());
    return true;
  },

  // --- HIRE STAFF ---
  hireStaff: (staffId) => {
    const state = get();
    if (state.staff.includes(staffId)) return false;
    
    const staffData = STAFF.find(s => s.id === staffId);
    if (!staffData || state.dollars < staffData.price) return false;
    if (state.getTotalFollowers() < staffData.unlock) return false;

    set({
      staff: [...state.staff, staffId],
      dollars: state.dollars - staffData.price,
    });
    state.unlockAchievement('hire_first');
    haptic.success();
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
        state.unlockAchievement('first_video');
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

    const publishedVideo = { ...video, platforms, status: 'live' };

    set(s => ({
      videos: [publishedVideo, ...s.videos].slice(0, 50),
      pendingVideo: null,
      showPublishModal: false,
      totalVideosPublished: s.totalVideosPublished + 1,
    }));
    state.unlockAchievement('first_publish');
    haptic.success();
    saveGame(get());
  },

  // --- TICK VIDEOS ---
  tickVideos: () => {
    const state = get();
    if (state.videos.length === 0) return;

    const mults = state.getStaffMultipliers();
    let dollarsEarned = 0;

    const updatedVideos = state.videos.map(video => {
      if (video.status === 'dead') return video;
      
      const niche = NICHES.find(n => n.id === video.nicheId);
      let totalNewViews = 0;
      const updatedPlatforms = { ...video.platforms };

      Object.entries(video.platforms).forEach(([pid, pdata]) => {
        const platform = PLATFORMS[pid];
        if (!platform) return;

        const qualityMultiplier = 1 + (state.getComputePerSec() / 50);
        const isViral = Math.random() < platform.viralChance;
        const waveMultiplier = isViral ? 10 : 1;
        
        const baseViews = randomBetween(niche.baseViews[0], niche.baseViews[1]);
        const newViews = Math.floor(
          (baseViews / 50) * qualityMultiplier * platform.viewMultiplier * waveMultiplier * mults.viewMult * (1 + Math.random())
        );

        updatedPlatforms[pid] = { ...pdata, views: pdata.views + newViews };
        totalNewViews += newViews;

        const channel = state.channels.find(c => c.platform === pid);
        if (channel && channel.followers >= 1000) {
          dollarsEarned += (newViews / 1000) * platform.incomePerKViews * 5 * mults.incomeMult;
        }
      });

      const totalViews = Object.values(updatedPlatforms).reduce((s, p) => s + p.views, 0);
      const ageHours = (Date.now() - video.createdAt) / (1000 * 3600);
      const newStatus = totalViews > niche.baseViews[1] * 5 ? 'viral' : ageHours > 48 ? 'dead' : 'live';

      return { ...video, platforms: updatedPlatforms, totalViews, status: newStatus };
    });

    const updatedChannels = state.channels.map(ch => {
      const channelVideoViews = updatedVideos
        .filter(v => v.platforms[ch.platform])
        .reduce((sum, v) => sum + (v.platforms[ch.platform]?.views || 0), 0);
      
      const prevViews = state.videos
        .filter(v => v.platforms[ch.platform])
        .reduce((sum, v) => sum + (v.platforms[ch.platform]?.views || 0), 0);
      
      const newViews = channelVideoViews - prevViews;
      const newFollowers = Math.floor(newViews * 0.03 * mults.followerMult);
      
      const platform = PLATFORMS[ch.platform];
      let income = 0;
      if (ch.followers >= 1000) {
        income = (newViews / 1000) * platform.incomePerKViews * 30 * 5 * mults.incomeMult;
      }

      return { ...ch, followers: ch.followers + newFollowers, totalViews: ch.totalViews + newViews, income };
    });

    set({
      videos: updatedVideos,
      channels: updatedChannels,
      dollars: state.dollars + dollarsEarned,
      totalFollowers: updatedChannels.reduce((s, c) => s + c.followers, 0),
    });

    state.checkAchievements();
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
    if (get().channels.length >= 2) state.unlockAchievement('second_platform');
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
    if (totalFollowers >= currentLevel.goalFollowers && state.level < 10) {
      const nextLevel = GAME_LEVELS.find(l => l.level === state.level + 1);
      set(s => ({ level: s.level + 1, screenShake: true, levelUpModal: nextLevel }));
      haptic.heavy();
      setTimeout(() => set({ screenShake: false }), 500);
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

    if (event.effect.addDollars) set(s => ({ dollars: s.dollars + event.effect.addDollars }));
    if (event.effect.removeDollars) set(s => ({ dollars: Math.max(0, s.dollars - event.effect.removeDollars) }));
    if (event.effect.addFollowers) {
      set(s => {
        if (s.channels.length === 0) return {};
        const channels = [...s.channels];
        channels[0] = { ...channels[0], followers: channels[0].followers + event.effect.addFollowers };
        return { channels, totalFollowers: channels.reduce((sum, c) => sum + c.followers, 0) };
      });
    }

    setTimeout(() => set({ activeEvent: null }), Math.min(event.duration || 5000, 8000));
  },

  // --- UI ---
  setActiveTab: (tab) => { set({ activeTab: tab }); haptic.tap(); },
  closePublishModal: () => set({ showPublishModal: false, pendingVideo: null }),
  dismissOffline: () => set({ offlineEarnings: null }),
  dismissLevelUp: () => set({ levelUpModal: null }),

  // --- INIT ---
  initGame: () => {
    const saved = loadGame();
    if (saved) {
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
        staff: saved.staff || [],
        achievements: saved.achievements || [],
        totalVideosPublished: saved.totalVideosPublished || 0,
        offlineEarnings: saved.offlineCompute > 0 ? {
          compute: saved.offlineCompute,
          seconds: Math.floor(saved.offlineSeconds),
        } : null,
      });
    } else {
      const state = get();
      if (state.equipmentSlots[0] === null) {
        const slots = [...state.equipmentSlots];
        slots[0] = 1;
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
