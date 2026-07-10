// js/pages/matches.js — Matches list with filter
window.PCL = window.PCL || {};
PCL.Pages = PCL.Pages || {};

PCL.Pages.Matches = function() {
  const app = document.getElementById('app');
  let activeFilter = 'all';

  function render() {
    const matches = PCL.DB.get('matches') || [];
    const liveMatch = PCL.DB.getLiveMatch();

    // If there's a live match not in DB as 'live', show it
    const displayMatches = [...matches];
    if (liveMatch && liveMatch.status === 'live') {
      const idx = displayMatches.findIndex(m => m.id === liveMatch.matchId);
      if (idx >= 0) displayMatches[idx] = { ...displayMatches[idx], status: 'live' };
    }

    const filtered = activeFilter === 'all' ? displayMatches
      : displayMatches.filter(m => m.status === activeFilter);

    app.innerHTML = `
      <div class="page-header">
        <div class="container">
          <div class="hero-eyebrow" style="display:inline-flex;margin-bottom:12px">📅 PCL 2025</div>
          <h1 class="page-title">MATCHES</h1>
          <p class="page-subtitle">Full schedule — ${matches.filter(m=>m.status==='completed').length} completed · ${matches.filter(m=>m.status==='upcoming').length} upcoming</p>
        </div>
      </div>
      <div class="container anim-fade">
        <div class="match-filter-bar">
          ${['all','live','upcoming','completed'].map(f => `
            <button class="filter-btn ${f===activeFilter?'active':''}" onclick="PCL._setMatchFilter('${f}')">
              ${f==='all'?'🗓️ All':f==='live'?'🔴 Live':f==='upcoming'?'📅 Upcoming':'✅ Completed'}
              <span style="margin-left:4px;font-size:11px;opacity:0.8">(${displayMatches.filter(m=>f==='all'?true:m.status===f).length})</span>
            </button>`).join('')}
        </div>
        <div class="matches-list" id="matches-list">
          ${renderMatches(filtered)}
        </div>
      </div>
      <footer class="footer">
        <div class="container">
          <div class="footer-bottom">
            <div class="footer-copy">© 2025 Patidar Cricket League</div>
            <div class="footer-realtime"><span class="rt-dot"></span> Live updates active</div>
          </div>
        </div>
      </footer>`;

    // Real-time subscription
    PCL.Realtime.on('matches', () => render());
    PCL.Realtime.on('liveMatch', () => render());
  }

  PCL._setMatchFilter = function(f) {
    activeFilter = f;
    render();
  };

  function renderMatches(matches) {
    if (!matches.length) return `
      <div style="text-align:center;padding:60px 24px;color:var(--text-3)">
        <div style="font-size:48px;margin-bottom:12px">🏏</div>
        <p>No matches found for this filter</p>
      </div>`;

    return matches.map(m => {
      const t1 = PCL.DB.getTeam(m.team1) || {};
      const t2 = PCL.DB.getTeam(m.team2) || {};

      return `
        <div class="match-card">
          <div class="match-card-header">
            <span class="match-number">Match #${m.num}</span>
            <span style="color:var(--text-3);font-size:12px">${PCL.Utils.formatDate(m.date)} · ${m.venue}</span>
            ${PCL.Utils.statusBadge(m.status)}
          </div>
          <div class="match-card-body">
            <div class="match-teams">
              <div class="match-team">
                <div class="match-team-logo">${t1.emoji||'🏏'}</div>
                <div class="match-team-name">${t1.name||m.team1}</div>
                ${m.score1 ? `<div class="match-team-score ${m.winner===m.team1?'winner':''}">${m.score1}</div>` : ''}
              </div>
              <div class="match-vs">VS</div>
              <div class="match-team">
                <div class="match-team-logo">${t2.emoji||'🏏'}</div>
                <div class="match-team-name">${t2.name||m.team2}</div>
                ${m.score2 ? `<div class="match-team-score ${m.winner===m.team2?'winner':''}">${m.score2}</div>` : ''}
              </div>
            </div>
            ${m.result ? `<div class="match-result"><strong>${m.result}</strong></div>` : ''}
            ${m.status==='upcoming' ? `<div class="match-venue-date">⏰ ${m.time} IST · ${PCL.Utils.formatDate(m.date)}</div>` : ''}
          </div>
          ${m.status === 'live' ? `
            <div class="match-card-actions">
              <a href="#/live" class="btn-match btn-watch-live">🔴 Watch Live</a>
            </div>` : ''}
          ${m.status === 'completed' ? `
            <div class="match-card-actions">
              <button class="btn-match btn-scorecard" onclick="PCL.Utils.toast('Full scorecard coming soon!','info')">📊 Scorecard</button>
            </div>` : ''}
        </div>`;
    }).join('');
  }

  render();
};
