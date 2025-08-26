// config.js - Merkezi konfigürasyon dosyası

export const CONFIG = {
  // Backend sunucu ayarları
  BACKEND: {
    BASE_URL: 'http://192.168.1.104:8000',
    TIMEOUT: 10000, // 10 saniye
  },
  
  // Uygulama ayarları
  APP: {
    NAME: 'Personel İzin Sistemi',
    VERSION: '1.0.0',
  },
  
  // API endpoint'leri
  API: {
    LOGIN: '/login',
    ME: '/me',
    LEAVES: {
      CREATE: '/leaves/create',
      MINE: '/leaves/mine',
      REMAINING: '/leaves/remaining',
      DAY: '/leaves/day',
      MONTH: '/leaves/month',
      PENDING: '/leaves/pending',
      APPROVE: '/leaves/approve',
    },
    TEAMS: {
      INFO: '/teams/info',
      MEMBERS: '/teams/members',
      ALL: '/teams/all',
      MEMBERS_BY_TEAM: '/teams/members-by-team',
      TEAM_LEAVE_LIMIT: '/teams/team-leave-limit',
      UPDATE_TEAM_LEAVE_LIMIT: '/teams/update-team-leave-limit',
      CHANGE_MEMBER_TEAM: '/teams/change-member-team',
    },
  },
};

// API objesini ayrı olarak export et
export const API = CONFIG.API;

// IP adresini kolayca değiştirmek için
export const getBackendUrl = (endpoint = '') => {
  return `${CONFIG.BACKEND.BASE_URL}${endpoint}`;
};

export default CONFIG;
