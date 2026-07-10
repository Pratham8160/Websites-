// js/app.js — App initialization and main entry point
window.PCL = window.PCL || {};

(function() {
  'use strict';

  // ================================================
  // INIT
  // ================================================
  function init() {
    // 1. Initialize DB (load default data if first run)
    PCL.DB.init();

    // 2. Initialize real-time engine
    PCL.Realtime.init();

    // 3. Set up navbar hamburger
    setupNavbar();

    // 4. Setup ticker
    setupTicker();

    // 5. Register routes
    PCL.Router
      .on('/', () => PCL.Pages.Home())
      .on('/teams', () => PCL.Pages.Teams())
      .on('/teams/:id', ({ id }) => PCL.Pages.TeamDetail({ id }))
      .on('/live', () => PCL.Pages.Live())
      .on('/points-table', () => PCL.Pages.PointsTable())
      .on('/matches', () => PCL.Pages.Matches())
      .on('/admin', () => PCL.Pages.Admin());

    // 6. Start router
    PCL.Router.start();

    // 7. Listen for any realtime updates to update navbar/ticker
    PCL.Realtime.on('liveMatch', updateTickerAndNav);
  }

  // ================================================
  // NAVBAR
  // ================================================
  function setupNavbar() {
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks  = document.getElementById('nav-links');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
      });

      // Close menu when a nav link is clicked
      navLinks.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
        }
      });

      // Close menu on outside click
      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
        }
      });
    }

    // Add scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.scrollY > 20) {
          navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
        } else {
          navbar.style.boxShadow = '';
        }
      }
    });
  }

  // ================================================
  // TICKER (live score top bar)
  // ================================================
  function setupTicker() {
    updateTickerAndNav(PCL.DB.getLiveMatch());
  }

  function updateTickerAndNav(lm) {
    const ticker    = document.getElementById('ticker-bar');
    const tickerContent = document.getElementById('ticker-content');
    const navbar    = document.getElementById('navbar');
    const appMain   = document.getElementById('app');
    const navLinks  = document.getElementById('nav-links');

    const isLive = lm && lm.status === 'live';

    if (ticker) ticker.classList.toggle('hidden', !isLive);
    if (navbar) navbar.classList.toggle('with-ticker', isLive);
    if (appMain) appMain.classList.toggle('with-ticker', isLive);

    // Adjust nav-links position if ticker visible
    if (navLinks) {
      navLinks.style.top = isLive
        ? `calc(var(--navbar-h) + var(--ticker-h))`
        : `var(--navbar-h)`;
    }

    if (isLive && tickerContent) {
      const t1 = PCL.DB.getTeam(lm.team1Id) || {};
      const t2 = PCL.DB.getTeam(lm.team2Id) || {};
      const scoreStr = `${t1.shortName||'T1'} ${lm.score1||0}/${lm.wkts1||0} (${PCL.Utils.formatOvers(lm.balls1||0)} ov)`
        + (lm.innings >= 2 ? ` vs ${t2.shortName||'T2'} ${lm.score2||0}/${lm.wkts2||0} (${PCL.Utils.formatOvers(lm.balls2||0)} ov)` : '')
        + (lm.target ? ` · Target: ${lm.target}` : '');
      tickerContent.textContent = `LIVE: ${scoreStr} · ${lm.venue||''}`;
    }

    // Show/hide live nav button
    const liveLink = document.getElementById('nav-live-link');
    if (liveLink) {
      liveLink.style.display = isLive ? '' : '';
      if (isLive) liveLink.style.color = '#f87171';
      else liveLink.style.color = '';
    }
  }

  // ================================================
  // KICK OFF
  // ================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
