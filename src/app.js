/**
 * 🐟 程序员摸鱼计时器 v1.0.0
 * Procrastination Timer - Main Application Logic
 * 
 * A fun web app to track and visualize "procrastination" time.
 * All data stored locally in localStorage.
 */

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================

const PROCRAS_TYPES = [
  { id: 'phone', name: '刷手机', icon: '📱', color: '#e17055' },
  { id: 'daydream', name: '发呆', icon: '🧘', color: '#6c5ce7' },
  { id: 'water', name: '喝水', icon: '☕', color: '#00b894' },
  { id: 'chat', name: '聊天', icon: '💬', color: '#fdcb6e' },
  { id: 'github', name: '逛GitHub', icon: '🐙', color: '#0984e3' },
  { id: 'other', name: '其他', icon: '🎮', color: '#e84393' }
];

const QUOTES = [
  '"摸鱼不是偷懒，是给大脑充电" — 某位程序员',
  '"代码写得好，摸鱼少不了"',
  '"Bug 是摸鱼的理由，不是不摸鱼的借口"',
  '"我摸的不是鱼，是灵感"',
  '"每次摸鱼都是为了写出更好的代码"',
  '"生产环境的 Bug 等我回来再修... 也许"',
  '"摸鱼 10 分钟 = 效率提升 200%"（伪科学）',
  '"我的代码在编译，所以我在摸鱼"',
  '"这不是摸鱼，这是创意孵化期"',
  '"好的代码需要好的休息来孕育"',
  '"摸鱼是一种态度，更是一门艺术"',
  '"今天你摸鱼了吗？没有的话现在开始"',
  '"程序员的三大美德：懒惰、急躁、傲慢 — Larry Wall"',
  '"摸鱼时间：唯一不会出现 404 的页面"',
  '"我在 GitHub 上冲浪，这叫技术调研"'
];

const ACHIEVEMENTS = [
  { id: 'ACH01', name: '🌱 初出茅庐', desc: '完成第一次计时', icon: 'seedling',
    check: (profile) => profile.totalSessions >= 1 },
  { id: 'ACH02', name: '⏰ 时间管理大师', desc: '累计摸鱼时长超过10小时', icon: 'clock',
    check: (profile) => profile.totalSeconds >= 36000 },
  { id: 'ACH03', name: '🔥 连续作战', desc: '连续3天都有摸鱼记录', icon: 'fire',
    check: (profile) => profile.streakDays >= 3 },
  { id: 'ACH04', name: '💪 坚持不懈', desc: '连续7天都有摸鱼记录', icon: 'zap',
    check: (profile) => profile.streakDays >= 7 },
  { id: 'ACH05', name: '🏆 摸鱼达人', desc: '累计摸鱼时长超过50小时', icon: 'trophy',
    check: (profile) => profile.totalSeconds >= 180000 },
  { id: 'ACH06', name: '🎯 专注选手', desc: '单次摸鱼超过1小时', icon: 'target',
    check: (profile) => profile.maxSingleSession >= 3600 },
  { id: 'ACH07', name: '📱 手机控', desc: '刷手机模式累计超过5小时', icon: 'smartphone',
    check: (profile) => (profile.typeTotals?.phone || 0) >= 18000 },
  { id: 'ACH08', name: '☕ 咖啡成瘾', desc: '喝水模式使用超过50次', icon: 'coffee',
    check: (profile) => (profile.typeCounts?.water || 0) >= 50 },
  { id: 'ACH09', name: '🗣️ 社交达人', desc: '聊天模式累计超过3小时', icon: 'message-circle',
    check: (profile) => (profile.typeTotals?.chat || 0) >= 10800 },
  { id: 'ACH10', name: '🐙 GitHub潜水员', desc: '逛GitHub模式累计超过2小时', icon: 'github',
    check: (profile) => (profile.typeTotals?.github || 0) >= 7200 },
  { id: 'ACH11', name: '🧘 发呆艺术家', desc: '发呆模式累计超过5小时', icon: 'eye-off',
    check: (profile) => (profile.typeTotals?.daydream || 0) >= 18000 },
  { id: 'ACH12', name: '👑 摸鱼之王', desc: '解锁所有其他成就', icon: 'crown',
    check: (profile) => {
      const otherIds = ACHIEVEMENTS.filter(a => a.id !== 'ACH12').map(a => a.id);
      return otherIds.every(id => profile.achievements.includes(id));
    }}
];

const STORAGE_KEYS = {
  SESSIONS: 'pt_sessions',
  PROFILE: 'pt_profile',
  THEME: 'pt_theme'
};

// ============================================================
// STATE
// ============================================================

let state = {
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

// ============================================================
// UTILITY FUNCTIONS
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

function getTimeStr(timestamp) {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function getDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === getTodayStr()) return '今天';
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天';
  return `${d.getMonth()+1}月${d.getDate()}日`;
}

// ============================================================
// DATA LAYER (localStorage CRUD)
// ============================================================

function loadData() {
  try {
    const sessionsRaw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    state.sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];
    
    const profileRaw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    state.profile = profileRaw ? JSON.parse(profileRaw) : createDefaultProfile();
  } catch (e) {
    console.error('Failed to load data:', e);
    state.sessions = [];
    state.profile = createDefaultProfile();
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
  } catch (e) {
    console.error('Failed to save data:', e);
    showToast('⚠️ 数据保存失败，存储空间可能已满');
  }
}

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

// ============================================================
// PROFILE CALCULATION
// ============================================================

function recalculateProfile() {
  const p = state.profile;
  p.totalSessions = state.sessions.length;
  p.totalSeconds = state.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  p.maxSingleSession = state.sessions.reduce((max, s) => Math.max(max, s.duration || 0), 0);
  
  // Type breakdown
  p.typeTotals = {};
  p.typeCounts = {};
  state.sessions.forEach(s => {
    const t = s.type || 'other';
    p.typeTotals[t] = (p.typeTotals[t] || 0) + (s.duration || 0);
    p.typeCounts[t] = (p.typeCounts[t] || 0) + 1;
  });
  
  // Streak calculation
  calculateStreak(p);
  
  // Last active date
  if (state.sessions.length > 0) {
    const dates = state.sessions.map(s => s.date).sort().reverse();
    p.lastActiveDate = dates[0];
  }
  
  saveData();
  return p;
}

function calculateStreak(profile) {
  if (state.sessions.length === 0) {
    profile.streakDays = 0; return;
  }
  
  const dateSet = new Set(state.sessions.map(s => s.date));
  const dates = Array.from(dateSet).sort().reverse();
  const today = getTodayStr();
  
  let streak = 0;
  let checkDate = new Date(today + 'T00:00:00');
  
  // Check if today or yesterday has activity
  const hasToday = dateSet.has(today);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const hasYesterday = dateSet.has(yesterday.toISOString().split('T')[0]);
  
  if (!hasToday && !hasYesterday) {
    profile.streakDays = 0; return;
  }
  
  if (!hasToday && hasYesterday) {
    checkDate = yesterday;
  }
  
  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    if (dateSet.has(ds)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  profile.streakDays = streak;
  if (streak > profile.longestStreak) {
    profile.longestStreak = streak;
  }
}

// ============================================================
// ACHIEVEMENT SYSTEM
// ============================================================

function checkAchievements() {
  const p = recalculateProfile();
  const newUnlocks = [];
  
  ACHIEVEMENTS.forEach(ach => {
    if (!p.achievements.includes(ach.id) && ach.check(p)) {
      p.achievements.push(ach.id);
      newUnlocks.push(ach);
    }
  });
  
  if (newUnlocks.length > 0) {
    saveData();
    newUnlocks.forEach((ach, i) => {
      setTimeout(() => showAchievementUnlock(ach), i * 800);
    });
  }
  
  return newUnlocks;
}

function showAchievementUnlock(achievement) {
  showToast(`🏆 成就解锁：${achievement.name}`);
  fireConfetti();
  renderRecentAchievements();
  renderAchievementGrid();
}

// ============================================================
// TIMER CONTROLS
// ============================================================

function renderModeGrid() {
  const grid = document.getElementById('modeGrid');
  grid.innerHTML = PROCRAS_TYPES.map(t => `
    <button class="mode-btn ${state.selectedType === t.id ? 'selected' : ''}"
            data-type="${t.id}" onclick="selectMode('${t.id}')">
      <span class="mode-icon">${t.icon}</span>
      <span class="mode-name">${t.name}</span>
    </button>
  `).join('');
}

function selectMode(typeId) {
  state.selectedType = typeId;
  renderModeGrid();
  updateTimerStatus();
  showRandomQuote();
}

function startTimer() {
  if (!state.selectedType) {
    showToast('⚠️ 请先选择一个摸鱼模式！');
    return;
  }
  
  state.isRunning = true;
  state.isPaused = false;
  state.startTime = Date.now() - state.pausedElapsed * 1000;
  
  document.getElementById('btnStart').disabled = true;
  document.getElementById('btnPause').disabled = false;
  document.getElementById('btnStop').disabled = false;
  document.getElementById('timerRingProgress').classList.add('running');
  
  updateTimerStatus();
  
  state.timerInterval = setInterval(updateTimerDisplay, 200);
  showRandomQuote();
}

function pauseTimer() {
  if (!state.isRunning) return;
  
  state.isPaused = !state.isPaused;
  const btnPause = document.getElementById('btnPause');
  
  if (state.isPaused) {
    clearInterval(state.timerInterval);
    state.pausedElapsed = Math.floor((Date.now() - state.startTime) / 1000);
    btnPause.innerHTML = '▶ 继续';
    document.getElementById('timerRingProgress').classList.remove('running');
    updateTimerStatus('已暂停');
  } else {
    state.startTime = Date.now() - state.pausedElapsed * 1000;
    state.timerInterval = setInterval(updateTimerDisplay, 200);
    btnPause.innerHTML = '⏸ 暂停';
    document.getElementById('timerRingProgress').classList.add('running');
    updateTimerStatus();
  }
}

function stopTimer() {
  if (!state.isRunning && state.pausedElapsed === 0) return;
  
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  
  const elapsed = state.isPaused 
    ? state.pausedElapsed 
    : Math.floor((Date.now() - state.startTime) / 1000);
  
  if (elapsed >= 1 && state.selectedType) {
    // Save session
    const session = {
      id: generateId(),
      type: state.selectedType,
      startTime: state.startTime,
      endTime: Date.now(),
      duration: elapsed,
      date: getTodayStr()
    };
    
    state.sessions.push(session);
    
    // Reset timer state
    resetTimerState();
    
    // Save and check achievements
    const newUnlocks = checkAchievements();
    
    // Update UI
    updateTodayStats();
    renderHistoryList();
    
    if (newUnlocks.length === 0) {
      showToast(`✅ 记录保存！${PROCRAS_TYPES.find(t=>t.id===session.type)?.icon} ${formatDuration(elapsed)}`);
    }
  } else {
    resetTimerState();
    updateTimerStatus();
  }
  
  document.getElementById('btnStart').disabled = false;
  document.getElementById('btnPause').disabled = true;
  document.getElementById('btnStop').disabled = true;
  document.getElementById('btnPause').innerHTML = '⏸ 暂停';
  document.getElementById('timerRingProgress').classList.remove('running');
  document.getElementById('timerDisplay').textContent = '00:00:00';
}

function resetTimerState() {
  state.isRunning = false;
  state.isPaused = false;
  state.startTime = null;
  state.pausedElapsed = 0;
}

function updateTimerDisplay() {
  if (!state.isRunning || state.isPaused) return;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  document.getElementById('timerDisplay').textContent = formatTime(elapsed);
}

function updateTimerStatus(customText) {
  const statusEl = document.getElementById('timerStatus');
  if (customText) {
    statusEl.textContent = customText;
    return;
  }
  
  if (state.isRunning && !state.isPaused) {
    const typeName = PROCRAS_TYPES.find(t => t.id === state.selectedType)?.name || '';
    statusEl.textContent = `正在${typeName}中... 🐟`;
  } else if (state.selectedType) {
    const typeName = PROCRAS_TYPES.find(t => t.id === state.selectedType)?.name || '';
    statusEl.textContent = `准备${typeName}`;
  } else {
    statusEl.textContent = '选择模式开始摸鱼 🐟';
  }
}

function showRandomQuote() {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const el = document.getElementById('quoteBar');
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = `💡 ${quote}`;
    el.style.opacity = 1;
  }, 200);
}

// ============================================================
// TODAY STATS SIDEBAR
// ============================================================

function updateTodayStats() {
  const today = getTodayStr();
  const todaySessions = state.sessions.filter(s => s.date === today);
  const totalSec = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  
  document.getElementById('todayTotal').textContent = formatShortDuration(totalSec);
  document.getElementById('todaySessionCount').textContent = `${todaySessions.length} 次记录`;
  
  // Type breakdown
  const breakdown = {};
  todaySessions.forEach(s => {
    breakdown[s.type] = (breakdown[s.type] || 0) + (s.duration || 0);
  });
  
  const container = document.getElementById('typeBreakdown');
  if (Object.keys(breakdown).length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:10px;">今天还没有记录</div>';
    return;
  }
  
  const maxVal = Math.max(...Object.values(breakdown), 1);
  container.innerHTML = Object.entries(breakdown)
    .sort((a,b) => b[1]-a[1])
    .map(([type, secs]) => {
      const info = PROCRAS_TYPES.find(t => t.id === type) || PROCRAS_TYPES[5];
      const pct = ((secs / maxVal) * 100).toFixed(0);
      return `
        <div class="breakdown-row">
          <span style="font-size:16px;">${info.icon}</span>
          <div class="breakdown-bar-bg">
            <div class="breakdown-bar-fill" style="width:${pct}%;background:${info.color};"></div>
          </div>
          <span class="breakdown-value">${formatShortDuration(secs)}</span>
        </div>
      `;
    }).join('');
}

function renderRecentAchievements() {
  const container = document.getElementById('recentAchievements');
  const achievements = state.profile.achievements || [];
  
  if (achievements.length === 0) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">完成更多计时来解锁成就吧！</span>';
    return;
  }
  
  const recent = achievements.slice(-4).reverse();
  container.innerHTML = recent.map(id => {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    return ach ? `<span class="achievement-badge">${ach.name}</span>` : '';
  }).join('');
}

// ============================================================
// STATS PAGE
// ============================================================

function setStatsRange(range) {
  state.currentRange = range;
  document.querySelectorAll('.stats-range-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
  renderStatsPage();
}

function getFilteredSessions() {
  const now = new Date();
  let startDate;
  
  switch (state.currentRange) {
    case 'week':
      startDate = new Date(now); startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      return [...state.sessions];
  }
  
  const startStr = startDate.toISOString().split('T')[0];
  return state.sessions.filter(s => s.date >= startStr);
}

function renderStatsPage() {
  const filtered = getFilteredSessions();
  
  // Summary cards
  const totalSec = filtered.reduce((sum, s) => sum + (s.duration || 0), 0);
  const sessionCount = filtered.length;
  const avgSession = sessionCount > 0 ? Math.round(totalSec / sessionCount) : 0;
  const dates = new Set(filtered.map(s => s.date)).size;
  
  document.getElementById('summaryCards').innerHTML = `
    <div class="summary-item">
      <div class="summary-value">${formatShortDuration(totalSec)}</div>
      <div class="summary-label">总时长</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${sessionCount}</div>
      <div class="summary-label">总次数</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${formatShortDuration(avgSession)}</div>
      <div class="summary-label">平均时长</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${dates}</div>
      <div class="summary-label">活跃天数</div>
    </div>
  `;
  
  // Bar chart - daily trend
  renderBarChart(filtered);
  
  // Pie chart - type distribution
  renderPieChart(filtered);
}

function renderBarChart(sessions) {
  const canvas = document.getElementById('barChart');
  const ctx = canvas.getContext('2d');
  
  // Aggregate by date
  const dailyMap = {};
  sessions.forEach(s => {
    dailyMap[s.date] = (dailyMap[s.date] || 0) + (s.duration || 0);
  });
  
  const sortedDates = Object.keys(dailyMap).sort();
  
  if (sortedDates.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8b8da3';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Set canvas size for retina
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const w = rect.width;
  const h = rect.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  
  const values = sortedDates.map(d => dailyMap[d] / 3600); // in hours
  const maxVal = Math.max(...values, 0.5);
  const barWidth = Math.min((chartW / sortedDates.length) * 0.6, 50);
  const gap = (chartW - barWidth * sortedDates.length) / (sortedDates.length + 1);
  
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#555770';
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6c5ce7';
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e8e8f0';
  
  ctx.clearRect(0, 0, w, h);
  
  // Grid lines
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    
    // Y axis labels
    const val = (maxVal * (gridLines - i) / gridLines).toFixed(1);
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val + 'h', padding.left - 6, y + 4);
  }
  
  // Bars
  sortedDates.forEach((date, i) => {
    const x = padding.left + gap + i * (barWidth + gap);
    const barH = (values[i] / maxVal) * chartH;
    const y = padding.top + chartH - barH;
    
    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, accentColor);
    grad.addColorStop(1, accentColor + '66');
    
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barWidth, barH, 4);
    
    // X axis label
    const d = new Date(date + 'T00:00:00');
    const label = `${d.getMonth()+1}/${d.getDate()}`;
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth / 2, h - padding.bottom + 18);
  });
}

function renderPieChart(sessions) {
  const canvas = document.getElementById('pieChart');
  const ctx = canvas.getContext('2d');
  
  // Type totals
  const typeMap = {};
  sessions.forEach(s => {
    typeMap[s.type] = (typeMap[s.type] || 0) + (s.duration || 0);
  });
  
  const entries = Object.entries(typeMap).filter(([,v]) => v > 0);
  
  if (entries.length === 0) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8b8da3';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', rect.width / 2, rect.height / 2);
    return;
  }
  
  const total = entries.reduce((sum, [,v]) => sum + v, 0);
  const colors = ['#6c5ce7','#e17055','#00b894','#fdcb6e','#0984e3','#e84393'];
  
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const w = rect.width;
  const h = rect.height;
  const cx = w * 0.38;
  const cy = h * 0.5;
  const radius = Math.min(cx, cy) - 15;
  
  let startAngle = -Math.PI / 2;
  
  entries.forEach(([type, value], i) => {
    const sliceAngle = (value / total) * Math.PI * 2;
    const info = PROCRAS_TYPES.find(t => t.id === type) || PROCRAS_TYPES[5];
    const color = info.color || colors[i % colors.length];
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // Slice border
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    startAngle += sliceAngle;
  });
  
  // Center hole (donut effect)
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#fff';
  ctx.fill();
  
  // Legend
  const legendX = w * 0.65;
  let legendY = 25;
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#555770';
  
  entries.forEach(([type, value]) => {
    const info = PROCRAS_TYPES.find(t => t.id === type) || PROCRAS_TYPES[5];
    const pct = ((value / total) * 100).toFixed(1);
    
    ctx.fillStyle = info.color || '#888';
    ctx.fillRect(legendX, legendY, 12, 12);
    
    ctx.fillStyle = textColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${info.icon} ${info.name}`, legendX + 18, legendY + 11);
    
    ctx.font = '11px sans-serif';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8b8da3';
    ctx.fillText(`${pct}%`, legendX + 18, legendY + 26);
    
    legendY += 40;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ============================================================
// ACHIEVEMENTS PAGE
// ============================================================

function renderAchievementGrid() {
  const container = document.getElementById('achievementGrid');
  const unlocked = state.profile.achievements || [];
  
  container.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${isUnlocked ? ach.name.split(' ')[0] : '🔒'}</div>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
        <span class="achievement-status ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
          ${isUnlocked ? '✅ 已解锁' : '🔒 未解锁'}
        </span>
      </div>
    `;
  }).join('');
}

// ============================================================
// HISTORY PAGE
// ============================================================

function renderHistoryList() {
  const container = document.getElementById('historyList');
  
  if (state.sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🐟</div>
        <div class="empty-state-text">还没有任何摸鱼记录<br>快去开始第一次摸鱼吧！</div>
      </div>`;
    return;
  }
  
  // Group by date
  const grouped = {};
  state.sessions.slice().reverse().forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });
  
  let html = '';
  Object.entries(grouped).forEach(([date, items]) => {
    html += `<div class="history-date-group">
      <div class="history-date-label">${getDateLabel(date)} (${date}) · 共 ${items.length} 次</div>`;
    
    items.forEach(item => {
      const info = PROCRAS_TYPES.find(t => t.id === item.type) || PROCRAS_TYPES[5];
      html += `
        <div class="history-item">
          <div class="history-left">
            <span class="history-type-icon">${info.icon}</span>
            <div class="history-info">
              <span class="history-type-name">${info.name}</span>
              <span class="history-time-range">${getTimeStr(item.startTime)} – ${getTimeStr(item.endTime)}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="history-duration">${formatDuration(item.duration)}</span>
            <button class="history-delete" onclick="deleteSession('${item.id}')" title="删除此记录">✕</button>
          </div>
        </div>`;
    });
    
    html += '</div>';
  });
  
  container.innerHTML = html;
}

function deleteSession(id) {
  if (!confirm('确定要删除这条摸鱼记录吗？')) return;
  state.sessions = state.sessions.filter(s => s.id !== id);
  recalculateProfile();
  saveData();
  updateTodayStats();
  renderHistoryList();
  renderRecentAchievements();
  showToast('🗑️ 记录已删除');
}

// ============================================================
// SETTINGS & DATA MANAGEMENT
// ============================================================

function exportData() {
  const data = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    sessions: state.sessions,
    profile: state.profile
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `procrastination-timer-backup-${getTodayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 数据导出成功！');
}

function clearAllData() {
  if (!confirm('⚠️ 确定要清除所有数据吗？此操作不可撤销！')) return;
  if (!confirm('再次确认：真的要清除全部摸鱼数据吗？')) return;
  
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  state.sessions = [];
  state.profile = createDefaultProfile();
  
  updateTodayStats();
  renderHistoryList();
  renderRecentAchievements();
  renderAchievementGrid();
  renderStatsPage();
  showToast('🗑️ 所有数据已清除');
}

// ============================================================
// THEME
// ============================================================

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  
  const toggle = document.getElementById('themeToggle');
  const darkToggle = document.getElementById('darkModeToggle');
  
  if (toggle) toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (darkToggle) darkToggle.classList.toggle('on', theme === 'dark');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
  
  // Redraw charts with new theme colors
  if (document.getElementById('page-stats').classList.contains('active')) {
    renderStatsPage();
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function navigateTo(page) {
  // Update tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === page);
  });
  
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  
  // Page-specific rendering
  switch (page) {
    case 'stats': renderStatsPage(); break;
    case 'achievements': renderAchievementGrid(); break;
    case 'history': renderHistoryList(); break;
  }
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================================
// CONFETTI EFFECT
// ============================================================

function fireConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#6c5ce7','#e17055','#00b894','#fdcb6e','#0984e3','#e84393','#ff7675','#55efc4'];
  
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 8 + 5) + 'px';
    piece.style.height = (Math.random() * 8 + 5) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDelay = Math.random() * 0.6 + 's';
    piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    container.appendChild(piece);
    
    setTimeout(() => piece.remove(), 3500);
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  initTheme();
  loadData();
  recalculateProfile();
  
  renderModeGrid();
  updateTodayStats();
  renderRecentAchievements();
  showRandomQuote();
  
  // Handle window resize for charts
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (document.getElementById('page-stats').classList.contains('active')) {
        renderStatsPage();
      }
    }, 200);
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch(e.code) {
      case 'Space': e.preventDefault();
        if (state.isRunning) pauseTimer(); else startTimer();
        break;
      case 'Escape':
        if (state.isRunning) stopTimer();
        break;
    }
  });
  
  console.log('🐟 Procrastination Timer initialized! Happy fishing!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
