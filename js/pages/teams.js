// js/pages/teams.js — Teams grid page (IPL-style)
window.PCL = window.PCL || {};
PCL.Pages = PCL.Pages || {};

PCL.Pages.Teams = function() {
  const app = document.getElementById('app');
  const teams = PCL.DB.get('teams') || [];

  app.innerHTML = `
    <div class="page-header">
      <div class="container">
        <div class="hero-eyebrow" style="display:inline-flex;margin-bottom:12px">🏏 PCL 2025</div>
        <h1 class="page-title">ALL TEAMS</h1>
        <p class="page-subtitle">Meet the 8 squads competing for the Patidar Cricket League title</p>
      </div>
    </div>
    <div class="container">
      <div class="teams-grid anim-fade" id="teams-grid">
        ${teams.map(t => renderTeamCard(t)).join('')}
      </div>
    </div>
    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-bottom">
          <div class="footer-copy">© 2025 Patidar Cricket League</div>
          <div class="footer-realtime"><span class="rt-dot"></span> Real-time updates active</div>
        </div>
      </div>
    </footer>
  `;
};

function renderTeamCard(t) {
  const titlesBadges = t.titleYears && t.titleYears.length
    ? t.titleYears.map(y => `<span class="title-badge">🏆 ${y}</span>`).join('')
    : '<span style="font-size:12px;color:var(--text-3)">No titles yet</span>';

  return `
    <div class="team-card" style="--tc:${t.color};--tc2:${t.color2||'#000'}"
         onclick="PCL.Router.go('#/teams/${t.id}')" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')PCL.Router.go('#/teams/${t.id}')">
      <div class="team-card-top">
        <div class="team-banner-bg" style="background:linear-gradient(135deg,${t.color},${t.color2||'#000'})"></div>
        <div class="team-logo-large">${t.emoji}</div>
      </div>
      <div class="team-card-body">
        <div class="team-short-name">${t.shortName}</div>
        <div class="team-full-name">${t.name}</div>
        <div class="team-meta">
          <div class="team-meta-item">
            <strong>${t.captain}</strong>
            Captain
          </div>
          <div class="team-meta-item">
            <strong>${t.players.length}</strong>
            Players
          </div>
        </div>
        <div class="team-titles">${titlesBadges}</div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:16px">
          🏟️ ${t.homeGround}
        </div>
        <button class="team-card-btn" style="background:${t.color}">
          VIEW TEAM →
        </button>
      </div>
    </div>`;
}
