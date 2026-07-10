// js/utils.js — Utility helpers
window.PCL = window.PCL || {};

PCL.Utils = {
  // Get team by id from DB
  getTeam(id) {
    return PCL.DB.getTeam(id);
  },

  // Format date
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    } catch(e) { return dateStr; }
  },

  // Format time
  formatTime(timeStr) {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const d = new Date();
      d.setHours(parseInt(h), parseInt(m));
      return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    } catch(e) { return timeStr; }
  },

  // Check if date is today
  isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  },

  // Check if date is in future
  isFuture(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
  },

  // Navigate to a hash route
  navigate(hash) {
    window.location.hash = hash;
  },

  // Show toast notification
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Get match status badge HTML
  statusBadge(status) {
    const map = {
      live: '<span class="match-status-badge badge-live">🔴 LIVE</span>',
      upcoming: '<span class="match-status-badge badge-upcoming">📅 UPCOMING</span>',
      completed: '<span class="match-status-badge badge-completed">✅ COMPLETED</span>',
    };
    return map[status] || '';
  },

  // Truncate text
  truncate(str, len = 40) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  },

  // Generate initials avatar background
  roleEmoji(role) {
    const map = {
      'Batter': '🏏',
      'Bowler': '🎯',
      'All-rounder': '⭐',
      'Wicket-keeper': '🧤',
    };
    return map[role] || '🏏';
  },

  // Get ball class for coloring
  ballClass(ball) {
    if (ball === 'W') return 'ball-W';
    if (ball === 'Wd') return 'ball-Wd';
    if (ball === 'Nb') return 'ball-Nb';
    const n = parseInt(ball);
    if (n === 6) return 'ball-6';
    if (n === 4) return 'ball-4';
    if (n >= 1) return `ball-${n}`;
    return 'ball-0';
  },

  // Compute CRR
  computeCRR(runs, balls) {
    if (!balls) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
  },

  // Format overs string (e.g. 12.3)
  formatOvers(balls) {
    const ov = Math.floor(balls / 6);
    const b  = balls % 6;
    return `${ov}.${b}`;
  },
};
