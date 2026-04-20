import { create } from 'zustand';
import { EQUIPMENT, WORKSPACES, NICHES, PLATFORMS, VIDEO_TITLES, GAME_LEVELS, EVENTS, randomBetween, randomChoice } from '../data/gameData';

const useGameStore = create((set, get) => ({
  // ===== CORE STATE =====
  compute: 0,
  dollars: 0,
  totalFollowers: 0,
  computePerTap: 1,
  
  // ===== WORKSPACE =====
  workspaceLevel: 1,
  equipmentSlots: Array(2).fill(null), // starts with 2 slots
  
  // ===== CHANNELS =====
  channels: [],
  // Each channel: { id, platform, niche, name, followers, totalViews, videos: [], income, createdAt }
  
  // ===== VIDEOS =====
  videos: [],
  // Each video: { id, title, nicheId, platforms: ['tiktok','youtube'], views: {tiktok: 0, youtube: 0}, status, wave, createdAt }
  
  // ===== GAME PROGRESS =====
  level: 1,
  generatingVideo: false,
  generateProgress: 0,
  selectedNiche: 1,
  
  // ===== EVENTS =====
  activeEvent: null,
  
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
    const particle = {
      id: Date.now() + Math.random(),
      x, y,
      value: `+${amount}⚡`,
    };
    set(s => ({
      compute: s.compute + amount,
      tapParticles: [...s.tapParticles.slice(-10), particle],
    }));
    // Remove particle after animation
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
    if (emptySlot === -1) return false; // no empty slots

    const newSlots = [...state.equipmentSlots];
    newSlots[emptySlot] = equipId;
    
    set({
      dollars: state.dollars - equip.price,
      equipmentSlots: newSlots,
    });
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
    return true;
  },

  // --- GENERATE VIDEO ---
  startGenerateVideo: (nicheId) => {
    const state = get();
    const niche = NICHES.find(n => n.id === nicheId);
    if (!niche || state.compute < niche.computeCost || state.generatingVideo) return false;

    set({
      compute: state.compute - niche.computeCost,
      generatingVideo: true,
      generateProgress: 0,
      selectedNiche: nicheId,
    });

    // Simulate generation progress
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
  },

  // --- TICK VIDEOS (called every 5 seconds) ---
  tickVideos: () => {
    const state = get();
    if (state.videos.length === 0) return;

    let dollarsEarned = 0;
    let followersGained = 0;

    const updatedVideos = state.videos.map(video => {
      if (video.status === 'dead') return video;
      
      const niche = NICHES.find(n => n.id === video.nicheId);
      let totalNewViews = 0;
      const updatedPlatforms = { ...video.platforms };

      Object.entries(video.platforms).forEach(([pid, pdata]) => {
        const platform = PLATFORMS[pid];
        if (!platform) return;

        const age = (Date.now() - video.createdAt) / 1000; // seconds
        const qualityMultiplier = 1 + (state.getComputePerSec() / 100); // better hardware = better content
        
        // Simulate viral algorithm
        const isViral = Math.random() < platform.viralChance * 0.01;
        const waveMultiplier = isViral ? 10 : 1;
        
        const baseViews = randomBetween(niche.baseViews[0], niche.baseViews[1]);
        const newViews = Math.floor(
          (baseViews / 100) * qualityMultiplier * platform.viewMultiplier * waveMultiplier * (1 + Math.random())
        );

        updatedPlatforms[pid] = {
          ...pdata,
          views: pdata.views + newViews,
        };

        totalNewViews += newViews;

        // Calculate income from views
        const channel = state.channels.find(c => c.platform === pid);
        if (channel && channel.followers >= 10000) {
          dollarsEarned += (newViews / 1000) * platform.incomePerKViews;
        }
      });

      // Followers from views (rough: 1% of views become followers)
      const newFollowers = Math.floor(totalNewViews * 0.01);
      followersGained += newFollowers;

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
      const newFollowers = Math.floor(newViews * 0.01);
      
      const platform = PLATFORMS[ch.platform];
      let income = 0;
      if (ch.followers >= 10000) {
        income = (newViews / 1000) * platform.incomePerKViews * 30; // monthly estimate
      }

      return {
        ...ch,
        followers: ch.followers + newFollowers,
        totalViews: ch.totalViews + newViews,
        income,
      };
    });

    set({
      videos: updatedVideos,
      channels: updatedChannels,
      dollars: state.dollars + dollarsEarned,
      totalFollowers: updatedChannels.reduce((s, c) => s + c.followers, 0),
    });
  },

  // --- CREATE CHANNEL ---
  createChannel: (platformId, nicheId) => {
    const state = get();
    const platform = PLATFORMS[platformId];
    if (!platform) return false;

    const existingOnPlatform = state.channels.filter(c => c.platform === platformId);
    if (existingOnPlatform.length > 0) return false; // one channel per platform for now

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

    // Apply instant effects
    if (event.effect.addDollars) {
      set(s => ({ dollars: s.dollars + event.effect.addDollars }));
    }
    if (event.effect.removeDollars) {
      set(s => ({ dollars: Math.max(0, s.dollars - event.effect.removeDollars) }));
    }
    if (event.effect.addFollowers) {
      // Add to first channel
      set(s => {
        if (s.channels.length === 0) return {};
        const channels = [...s.channels];
        channels[0] = { ...channels[0], followers: channels[0].followers + event.effect.addFollowers };
        return { channels, totalFollowers: channels.reduce((sum, c) => sum + c.followers, 0) };
      });
    }

    // Clear event after duration
    const duration = event.duration || 5000;
    setTimeout(() => {
      set({ activeEvent: null });
    }, Math.min(duration, 8000));
  },

  // --- SET TAB ---
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // --- CLOSE MODAL ---
  closePublishModal: () => set({ showPublishModal: false, pendingVideo: null }),

  // --- INIT: give starter equipment ---
  initGame: () => {
    const state = get();
    if (state.equipmentSlots[0] === null) {
      const slots = [...state.equipmentSlots];
      slots[0] = 1; // starter laptop
      set({ equipmentSlots: slots });
    }
    // Auto-create first TikTok channel if none exist
    if (state.channels.length === 0) {
      get().createChannel('tiktok', 1);
    }
  },
}));

export default useGameStore;
