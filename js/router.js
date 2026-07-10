// js/router.js — Hash-based SPA router
window.PCL = window.PCL || {};

PCL.Router = {
  routes: {},
  currentRoute: null,
  beforeEach: null,

  // Register a route
  on(pattern, handler) {
    this.routes[pattern] = handler;
    return this;
  },

  // Start the router
  start() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  },

  // Navigate programmatically
  go(hash) {
    window.location.hash = hash;
  },

  // Internal: resolve current hash
  _resolve() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '') || '/';

    // Find matching route (support :param)
    let matched = null;
    let params = {};

    for (const pattern of Object.keys(this.routes)) {
      const result = this._match(pattern, path);
      if (result !== null) {
        matched = this.routes[pattern];
        params = result;
        break;
      }
    }

    if (!matched) {
      // Fallback to home
      matched = this.routes['/'] || (() => {});
    }

    // Update active nav links
    this._updateNav(path);

    // Clear realtime listeners from previous page
    if (PCL.Realtime) PCL.Realtime.clear();

    // Show loader briefly
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div class="page-loader"><div class="loader-ball"></div></div>';
    }

    this.currentRoute = path;

    // Small delay for smooth transition
    setTimeout(() => {
      try { matched(params); } catch(e) { console.error('Route error:', e); }
    }, 80);
  },

  // Match a route pattern against a path, return params or null
  _match(pattern, path) {
    if (pattern === path) return {};

    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  },

  // Update active state on nav links
  _updateNav(path) {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.classList.remove('active');
      const page = link.getAttribute('data-page');
      if (
        (page === 'home' && (path === '/' || path === '')) ||
        (path.startsWith('/' + page) && page !== 'home')
      ) {
        link.classList.add('active');
      }
    });

    // Show/hide live nav indicator
    const lm = PCL.DB.getLiveMatch();
    const liveLink = document.getElementById('nav-live-link');
    if (liveLink) {
      if (lm && lm.status === 'live') {
        liveLink.style.display = '';
      }
    }
  }
};
