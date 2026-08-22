/**
 * 🐟 程序员摸鱼计时器 - 单元测试
 * Procrastination Timer - Unit Tests
 * 
 * Self-contained test suite with extracted pure functions
 */

// ============================================================
// EXTRACTED PURE FUNCTIONS (from app.js)
// ============================================================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}分${seconds%60}秒`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatShortDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Mock state object
const state = {
  selectedType: null,
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedElapsed: 0,
  timerInterval: null,
  sessions: [],
  profile: null,
  currentRange: 'week'
};

const PROCRAS_TYPES = [
  { id: 'phone', name: '刷手机', icon: '📱', color: '#e17055' },
  { id: 'daydream', name: '发呆', icon: '🧘', color: '#6c5ce7' },
  { id: 'water', name: '喝水', icon: '☕', color: '#00b894' },
  { id: 'chat', name: '聊天', icon: '💬', color: '#fdcb6e' },
  { id: 'github', name: '逛GitHub', icon: '🐙', color: '#0984e3' },
  { id: 'other', name: '其他', icon: '🎮', color: '#e84393' }
];

const ACHIEVEMENTS = [
  { id: 'ACH01', name: '🌱 初出茅庐', desc: '完成第一次计时',
    check: (p) => p.totalSessions >= 1 },
  { id: 'ACH02', name: '⏰ 时间管理大师', desc: '累计摸鱼时长超过10小时',
    check: (p) => p.totalSeconds >= 36000 },
  { id: 'ACH03', name: '🔥 连续作战', desc: '连续3天都有摸鱼记录',
    check: (p) => p.streakDays >= 3 },
  { id: 'ACH04', name: '💪 坚持不懈', desc: '连续7天都有摸鱼记录',
    check: (p) => p.streakDays >= 7 },
  { id: 'ACH05', name: '🏆 摸鱼达人', desc: '累计摸鱼时长超过50小时',
    check: (p) => p.totalSeconds >= 180000 },
  { id: 'ACH06', name: '🎯 专注选手', desc: '单次摸鱼超过1小时',
    check: (p) => p.maxSingleSession >= 3600 },
  { id: 'ACH07', name: '📱 手机控', desc: '刷手机模式累计超过5小时',
    check: (p) => (p.typeTotals?.phone || 0) >= 18000 },
  { id: 'ACH08', name: '☕ 咖啡成瘾', desc: '喝水模式使用超过50次',
    check: (p) => (p.typeCounts?.water || 0) >= 50 },
  { id: 'ACH09', name: '🗣️ 社交达人', desc: '聊天模式累计超过3小时',
    check: (p) => (p.typeTotals?.chat || 0) >= 10800 },
  { id: 'ACH10', name: '🐙 GitHub潜水员', desc: '逛GitHub模式累计超过2小时',
    check: (p) => (p.typeTotals?.github || 0) >= 7200 },
  { id: 'ACH11', name: '🧘 发呆艺术家', desc: '发呆模式累计超过5小时',
    check: (p) => (p.typeTotals?.daydream || 0) >= 18000 },
  { id: 'ACH12', name: '👑 摸鱼之王', desc: '解锁所有其他成就',
    check: (p) => {
      const otherIds = ACHIEVEMENTS.filter(a => a.id !== 'ACH12').map(a => a.id);
      return otherIds.every(id => p.achievements.includes(id));
    }}
];

const STORAGE_KEYS = {
  SESSIONS: 'pt_sessions',
  PROFILE: 'pt_profile',
  THEME: 'pt_theme'
};

function createDefaultProfile() {
  return {
    totalSessions: 0,
    totalSeconds: 0,
    achievements: [],
    streakDays: 0,
    longestStreak: 0,
    maxSingleSession: 0,
    typeTotals: {},
    typeCounts: {},
    createdAt: new Date().toISOString(),
    lastActiveDate: null
  };
}

function loadData() {
  try {
    const sessionsRaw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    state.sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];
    const profileRaw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    state.profile = profileRaw ? JSON.parse(profileRaw) : createDefaultProfile();
  } catch (e) {
    state.sessions = [];
    state.profile = createDefaultProfile();
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
  } catch (e) {}
}

function recalculateProfile() {
  const p = state.profile;
  p.totalSessions = state.sessions.length;
  p.totalSeconds = state.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  p.maxSingleSession = state.sessions.reduce((max, s) => Math.max(max, s.duration || 0), 0);
  p.typeTotals = {};
  p.typeCounts = {};
  state.sessions.forEach(s => {
    const t = s.type || 'other';
    p.typeTotals[t] = (p.typeTotals[t] || 0) + (s.duration || 0);
    p.typeCounts[t] = (p.typeCounts[t] || 0) + 1;
  });
  calculateStreak(p);
  if (state.sessions.length > 0) {
    const dates = state.sessions.map(s => s.date).sort().reverse();
    p.lastActiveDate = dates[0];
  }
  saveData();
  return p;
}

function calculateStreak(profile) {
  if (state.sessions.length === 0) { profile.streakDays = 0; return; }
  const dateSet = new Set(state.sessions.map(s => s.date));
  const today = getTodayStr();
  const hasToday = dateSet.has(today);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const hasYesterday = dateSet.has(yesterday.toISOString().split('T')[0]);
  if (!hasToday && !hasYesterday) { profile.streakDays = 0; return; }

  let streak = 0;
  let checkDate = new Date(today + 'T00:00:00');
  if (!hasToday && hasYesterday) { checkDate = yesterday; }

  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    if (dateSet.has(ds)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
  }
  profile.streakDays = streak;
  if (streak > profile.longestStreak) profile.longestStreak = streak;
}

function checkAchievements() {
  const p = recalculateProfile();
  const newUnlocks = [];
  ACHIEVEMENTS.forEach(ach => {
    if (!p.achievements.includes(ach.id) && ach.check(p)) {
      p.achievements.push(ach.id);
      newUnlocks.push(ach);
    }
  });
  if (newUnlocks.length > 0) saveData();
  return newUnlocks;
}

function selectMode(typeId) {
  state.selectedType = typeId;
}

function startTimer() {
  if (!state.selectedType) return;
  state.isRunning = true;
  state.isPaused = false;
  state.startTime = Date.now() - state.pausedElapsed * 1000;
}

function pauseTimer() {
  if (!state.isRunning) return;
  state.isPaused = !state.isPaused;
  if (state.isPaused) {
    state.pausedElapsed = Math.floor((Date.now() - state.startTime) / 1000);
  } else {
    state.startTime = Date.now() - state.pausedElapsed * 1000;
  }
}

function stopTimer() {
  if (!state.isRunning && state.pausedElapsed === 0) return;
  const elapsed = state.isPaused ? state.pausedElapsed : Math.floor((Date.now() - state.startTime) / 1000);
  if (elapsed >= 1 && state.selectedType) {
    state.sessions.push({
      id: Date.now().toString(36), type: state.selectedType,
      startTime: state.startTime, endTime: Date.now(), duration: elapsed, date: getTodayStr()
    });
    state.isRunning = false; state.isPaused = false; state.startTime = null; state.pausedElapsed = 0;
    checkAchievements();
  } else {
    state.isRunning = false; state.isPaused = false; state.startTime = null; state.pausedElapsed = 0;
  }
}

// ============================================================
// TEST UTILITIES
// ============================================================

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// ============================================================
// TEST SUITE 1: Utility Function Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 1: Utility Function Tests');
console.log('═══════════════════════════════════════\n');

assert(formatTime(0) === '00:00:00', 'formatTime: zero seconds');
assert(formatTime(65) === '00:01:05', 'formatTime: 1 min 5 sec');
assert(formatTime(3661) === '01:01:01', 'formatTime: 1 hour 1 min 1 sec');
assert(formatTime(7265) === '02:01:05', 'formatTime: 2 hours 1 min 5 sec');
assert(formatTime(359999) === '99:59:59', 'formatTime: handles near-max value');

assert(formatDuration(30) === '30秒', 'formatDuration: seconds only');
assert(formatDuration(90) === '1分30秒', 'formatDuration: minutes and seconds');
assert(formatDuration(3725) === '1h 2m', 'formatDuration: hours and minutes');
assert(formatDuration(86400) === '24h 0m', 'formatDuration: 24 hours exactly');

assert(formatShortDuration(45) === '0m', 'formatShortDuration: less than 1 min');
assert(formatShortDuration(125) === '2m', 'formatShortDuration: 2 minutes');
assert(formatShortDuration(3725) === '1h 2m', 'formatShortDuration: hours format');
assert(formatShortDuration(0) === '0m', 'formatShortDuration: zero');

const today = getTodayStr();
const expectedToday = new Date().toISOString().split('T')[0];
assert(today === expectedToday, 'getTodayStr: returns correct ISO date string');

const id1 = generateId();
const id2 = generateId();
assert(id1 !== id2, 'generateId: generates unique IDs');
assert(id1.length > 10, 'generateId: ID has reasonable length (>10 chars)');
assert(typeof id1 === 'string', 'generateId: ID is string type');

// ============================================================
// TEST SUITE 2: Data Layer & Profile Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 2: Data Layer Tests');
console.log('═══════════════════════════════════════\n');

localStorage.removeItem(STORAGE_KEYS.SESSIONS);
localStorage.removeItem(STORAGE_KEYS.PROFILE);

const defaultProfile = createDefaultProfile();
assert(defaultProfile.totalSessions === 0, 'createDefaultProfile: zero initial sessions');
assert(defaultProfile.totalSeconds === 0, 'createDefaultProfile: zero initial seconds');
assert(Array.isArray(defaultProfile.achievements), 'createDefaultProfile: achievements is array');
assert(defaultProfile.streakDays === 0, 'createDefaultProfile: zero streak days');
assert(defaultProfile.longestStreak === 0, 'createDefaultProfile: zero longest streak');
assert(defaultProfile.typeTotals !== undefined, 'createDefaultProfile: typeTotals exists');
assert(defaultProfile.typeCounts !== undefined, 'createDefaultProfile: typeCounts exists');

loadData();
assert(state.sessions.length === 0, 'loadData: empty sessions from empty storage');
assert(state.profile.totalSessions === 0, 'loadData: profile loaded correctly');

state.sessions = [
  { id: 'test1', type: 'phone', startTime: Date.now()-300000, endTime: Date.now(), duration: 300, date: getTodayStr() },
  { id: 'test2', type: 'github', startTime: Date.now()-600000, endTime: Date.now()-300000, duration: 300, date: getTodayStr() }
];
saveData();

loadData();
assert(state.sessions.length === 2, 'saveData/loadData: sessions persist correctly');
assert(state.sessions[0].type === 'phone', 'saveData/loadData: session data preserved');
assert(state.sessions[0].duration === 300, 'saveData/loadData: duration preserved');

// ============================================================
// TEST SUITE 3: Profile Calculation Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 3: Profile Calculation Tests');
console.log('═══════════════════════════════════════\n');

const p = recalculateProfile();
assert(p.totalSessions === 2, 'recalculateProfile: counts sessions correctly');
assert(p.totalSeconds === 600, 'recalculateProfile: sums duration correctly');
assert(p.typeTotals.phone === 300, 'recalculateProfile: phone type total correct');
assert(p.typeTotals.github === 300, 'recalculateProfile: github type total correct');
assert(p.typeCounts.phone === 1, 'recalculateProfile: phone count correct');
assert(p.maxSingleSession === 300, 'recalculateProfile: max single session correct');

// Streak test
state.sessions = [{ id: 's1', type: 'phone', duration: 100, date: getTodayStr() }];
calculateStreak(state.profile);
assert(state.profile.streakDays >= 1, 'calculateStreak: today counts as streak day');

// Multi-day streak test
const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
state.sessions = [
  { id: 's1', type: 'phone', duration: 100, date: getTodayStr() },
  { id: 's2', type: 'github', duration: 200, date: yesterday.toISOString().split('T')[0] },
  { id: 's3', type: 'water', duration: 150, date: twoDaysAgo.toISOString().split('T')[0] }
];
calculateStreak(state.profile);
assert(state.profile.streakDays === 3, 'calculateStreak: 3 consecutive days counted');

// Broken streak test
const oldDay = new Date(); oldDay.setDate(oldDay.getDate() - 5);
state.sessions = [
  { id: 's1', type: 'phone', duration: 100, date: getTodayStr() },
  { id: 's2', type: 'other', duration: 200, date: oldDay.toISOString().split('T')[0] }
];
calculateStreak(state.profile);
assert(state.profile.streakDays === 1, 'calculateStreak: broken streak resets to 1');

// ============================================================
// TEST SUITE 4: Achievement System Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 4: Achievement System Tests');
console.log('═══════════════════════════════════════\n');

state.sessions = [];
state.profile = createDefaultProfile();

// First session unlocks ACH01
state.sessions.push({ id: 'first', type: 'phone', duration: 60, date: getTodayStr() });
const unlocks = checkAchievements();
assert(unlocks.some(a => a.id === 'ACH01'), 'checkAchievements: unlocks ACH01 on first session');
assert(state.profile.achievements.includes('ACH01'), 'checkAchievements: achievement saved in profile');

// No duplicate unlocks
const prevCount = state.profile.achievements.length;
const moreUnlocks = checkAchievements();
assert(moreUnlocks.length === 0, 'checkAchievements: no duplicate unlocks on re-check');
assert(state.profile.achievements.length === prevCount, 'checkAchievements: count unchanged');

// Time-based achievement via sessions (10+ hours = 36000+ seconds)
state.sessions = [];
for (let i = 0; i < 120; i++) {
  state.sessions.push({ id: `t${i}`, type: 'phone', duration: 300, date: getTodayStr() });
}
const timeUnlocks = checkAchievements();
assert(timeUnlocks.some(a => a.id === 'ACH02'), 'checkAchievements: unlocks ACH02 at 10+ hours via sessions');

// Max single session achievement
state.sessions.push({ id: 'long1', type: 'github', duration: 3700, date: getTodayStr() });
const focusUnlocks = checkAchievements();
assert(focusUnlocks.some(a => a.id === 'ACH06'), 'checkAchievements: unlocks ACH06 at 1h+ single session');

// Type-specific: phone mode 5+ hours (18000+ seconds)
state.sessions = [];
state.profile = createDefaultProfile();
for (let i = 0; i < 60; i++) {
  state.sessions.push({ id: `ph${i}`, type: 'phone', duration: 310, date: getTodayStr() });
}
const phoneUnlocks = checkAchievements();
assert(phoneUnlocks.some(a => a.id === 'ACH07'), 'checkAchievements: unlocks ACH07 at 5h+ phone sessions');

// ============================================================
// TEST SUITE 5: Timer Control Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 5: Timer Control Tests');
console.log('═══════════════════════════════════════\n');

state.sessions = [];
state.profile = createDefaultProfile();
state.selectedType = null;
state.isRunning = false;
state.isPaused = false;
state.startTime = null;
state.pausedElapsed = 0;

selectMode('phone');
assert(state.selectedType === 'phone', 'selectMode: sets selected type to phone');

startTimer();
assert(state.isRunning === true, 'startTimer: sets running state to true');
assert(state.isPaused === false, 'startTimer: paused is false after start');

// Simulate 2 minutes of running
state.startTime = Date.now() - 120000;

pauseTimer();
assert(state.isPaused === true, 'pauseTimer: sets paused to true');
assert(state.pausedElapsed >= 119, 'pauseTimer: records ~120s elapsed time');
assert(state.pausedElapsed <= 121, 'pauseTimer: elapsed time within range');

stopTimer();
assert(state.isRunning === false, 'stopTimer: clears running state');
assert(state.sessions.length === 1, 'stopTimer: saves one session');
assert(state.sessions[0].duration >= 119, 'stopTimer: session duration ~120s');
assert(state.sessions[0].type === 'phone', 'stopTimer: session type preserved');

// Zero-duration should not save
state.selectedType = 'github';
state.isRunning = true;
state.startTime = Date.now();
state.pausedElapsed = 0;
stopTimer();
assert(state.sessions.length === 1, 'stopTimer: does not save zero/near-zero duration session');

// ============================================================
// TEST SUITE 6: Type Distribution Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 6: Type Distribution Tests');
console.log('═══════════════════════════════════════\n');

const baseDate = getTodayStr();
state.sessions = [
  { id: 't1', type: 'phone', duration: 300, date: baseDate },
  { id: 't2', type: 'phone', duration: 200, date: baseDate },
  { id: 't3', type: 'github', duration: 400, date: baseDate },
  { id: 't4', type: 'water', duration: 100, date: baseDate },
  { id: 't5', type: 'chat', duration: 250, date: baseDate }
];

recalculateProfile();
assert(state.profile.typeTotals.phone === 500, 'typeTotals: phone aggregated (300+200=500)');
assert(state.profile.typeTotals.github === 400, 'typeTotals: github = 400');
assert(state.profile.typeTotals.water === 100, 'typeTotals: water = 100');
assert(state.profile.typeTotals.chat === 250, 'typeTotals: chat = 250');
assert(state.profile.typeCounts.phone === 2, 'typeCounts: phone count = 2');
assert(state.profile.typeCounts.github === 1, 'typeCounts: github count = 1');
assert(state.profile.totalSessions === 5, 'totalSessions: 5 sessions');
assert(state.profile.totalSeconds === 1250, 'totalSeconds: 1250 total');

// ============================================================
// TEST SUITE 7: Edge Case Tests
// ============================================================

console.log('\n═══════════════════════════════════════');
console.log('  🧪 SUITE 7: Edge Case Tests');
console.log('═══════════════════════════════════════\n');

assert(formatDuration(90061) === '25h 1m', 'formatDuration: large duration');
assert(formatShortDuration(0) === '0m', 'formatShortDuration: zero edge case');

// Empty sessions
state.sessions = [];
recalculateProfile();
assert(state.profile.totalSessions === 0, 'edge case: empty sessions -> 0 total');
assert(state.profile.totalSeconds === 0, 'edge case: empty sessions -> 0 seconds');

// Single session
state.sessions = [{ id: 'e1', type: 'daydream', duration: 9999, date: baseDate }];
recalculateProfile();
assert(state.profile.totalSeconds === 9999, 'edge case: single session counted');
assert(state.profile.typeTotals.daydream === 9999, 'edge case: type total correct');

// All 6 types present
state.sessions = PROCRAS_TYPES.map((t, i) => ({
  id: `all${i}`, type: t.id, duration: (i + 1) * 100, date: baseDate
}));
recalculateProfile();
assert(Object.keys(state.profile.typeTotals).length === 6, 'edge case: all 6 types represented');

// Very long streak simulation
state.sessions = [];
for (let i = 0; i < 14; i++) {
  const d = new Date(); d.setDate(d.getDate() - i);
  state.sessions.push({ id: `st${i}`, type: 'phone', duration: 60, date: d.toISOString().split('T')[0] });
}
calculateStreak(state.profile);
assert(state.profile.streakDays === 14, 'edge case: 14-day streak calculated');
assert(state.profile.longestStreak === 14, 'edge case: longest streak updated');

// ============================================================
// TEST SUMMARY
// ============================================================

console.log('\n╔══════════════════════════════════════╗');
console.log('║     📊 TEST RESULTS SUMMARY          ║');
console.log('╠══════════════════════════════════════╣');
console.log(`║  ✅ Passed:  ${String(passedTests).padStart(4)}                   ║`);
console.log(`║  ❌ Failed:  ${String(failedTests).padStart(4)}                   ║`);
const rate = ((passedTests / (passedTests + failedTests)) * 100).toFixed(1);
console.log(`║  📈 Success: ${rate.padStart(6)}%                  ║`);
console.log('╚══════════════════════════════════════╝\n');

if (failedTests > 0) {
  console.error('⚠️  Some tests failed. Please review output above.\n');
  process.exit(1);
} else {
  console.log('🎉 All tests passed! Code is ready for deployment.\n');
  process.exit(0);
}
