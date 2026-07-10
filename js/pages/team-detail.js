// js/pages/team-detail.js — Team detail page with tabs
window.PCL = window.PCL || {};
PCL.Pages = PCL.Pages || {};

PCL.Pages.TeamDetail = function({ id }) {
  const app = document.getElementById('app');
  const team = PCL.DB.getTeam(id);
  if (!team) {
    app.innerHTML = `<div class="container" style="padding:80px 24px;text-align:center">
      <div style="font-size:64px;margin-bottom:16px">🏏</div>
      <h2>Team not found</h2>
      <a href="#/teams" class="btn btn-gold" style="margin-top:16px;display:inline-block">← Back to Teams</a>
    </div>`;
    return;
  }
  const matches = PCL.DB.get('matches') || [];
  const teamMatches = matches.filter(m => m.team1 === id || m.team2 === id);
  const pt = PCL.DB.get('pointsTable') || [];
  const ptRow = pt.find(r => r.teamId === id) || { p:0,w:0,l:0,nr:0,pts:0,nrr:0 };

  function teamOf(tid) { return PCL.DB.getTeam(tid) || {}; }

  // ---- Tabs ----
  const TABS = ['Overview','Squad','Schedule','Stats'];
  let activeTab = 'Overview';

  function render() {
    app.innerHTML = `
      <!-- Team Hero -->
      <div class="team-hero" style="background:linear-gradient(135deg,${team.color}18 0%,var(--bg-1) 70%)">
        <div class="container">
          <a href="#/teams" style="font-size:12px;color:var(--text-3);margin-bottom:20px;display:inline-block">← All Teams</a>
          <div class="team-hero-content">
            <div class="team-hero-logo">${team.emoji}</div>
            <div class="team-hero-info">
              <div class="team-hero-short" style="color:${team.color}">${team.shortName}</div>
              <h1 class="team-hero-name">${team.name}</h1>
              <div class="team-hero-meta">
                <div class="team-hero-stat">
                  <label>Captain</label>
                  <span>👑 ${team.captain}</span>
                </div>
                <div class="team-hero-stat">
                  <label>Coach</label>
                  <span>${team.coach}</span>
                </div>
                <div class="team-hero-stat">
                  <label>Home Ground</label>
                  <span>🏟️ ${team.homeGround}</span>
                </div>
                <div class="team-hero-stat">
                  <label>Titles</label>
                  <span>🏆 ${team.titles} ${team.titleYears.length ? '('+team.titleYears.join(', ')+')' : ''}</span>
                </div>
                <div class="team-hero-stat">
                  <label>Points</label>
                  <span style="color:var(--gold)">${ptRow.pts} pts (${ptRow.w}W-${ptRow.l}L)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Bar -->
      <div class="tabs-bar">
        <div class="tabs-list">
          ${TABS.map(t => `
            <button class="tab-btn ${t===activeTab?'active':''}" data-tab="${t}" onclick="PCL._switchTab('${t}')">${t.toUpperCase()}</button>
          `).join('')}
        </div>
      </div>

      <!-- Tab Content -->
      <div class="container" id="tab-content-area" style="padding-top:0">
        ${renderTabContent()}
      </div>
    `;
  }

  PCL._switchTab = function(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const area = document.getElementById('tab-content-area');
    if (area) area.innerHTML = renderTabContent();
  };

  function renderTabContent() {
    switch(activeTab) {
      case 'Overview':  return renderOverview();
      case 'Squad':     return renderSquad();
      case 'Schedule':  return renderSchedule();
      case 'Stats':     return renderStats();
      default: return '';
    }
  }

  function renderOverview() {
    return `
      <div class="section anim-fade">
        <div class="home-grid" style="gap:32px">
          <div>
            <h3 style="font-size:18px;font-weight:700;margin-bottom:12px;color:var(--text-2)">About the Team</h3>
            <p style="font-size:15px;color:var(--text-1);line-height:1.8;margin-bottom:24px">${team.desc}</p>
            <div class="admin-card">
              <div class="admin-card-title">Season ${PCL.DB.get('tournament')?.season||5} Performance</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center">
                ${[
                  {v:ptRow.p, l:'Played'},
                  {v:ptRow.w, l:'Won'},
                  {v:ptRow.l, l:'Lost'},
                  {v:ptRow.nr||0, l:'No Result'},
                  {v:ptRow.pts, l:'Points'},
                  {v:(ptRow.nrr>=0?'+':'')+ptRow.nrr.toFixed(3), l:'NRR'},
                ].map(s=>`
                  <div>
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--gold);letter-spacing:2px">${s.v}</div>
                    <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:1px">${s.l}</div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
          <div>
            <div class="admin-card" style="margin-bottom:16px">
              <div class="admin-card-title">Team Info</div>
              ${[
                ['🏏', 'Full Name', team.name],
                ['🔤', 'Short Code', team.shortName],
                ['👑', 'Captain', team.captain],
                ['🧠', 'Head Coach', team.coach],
                ['🏟️', 'Home Ground', team.homeGround],
                ['📅', 'Founded', team.founded],
                ['🏆', 'Titles', team.titles ? team.titleYears.join(', ') : 'None'],
                ['👥', 'Squad Size', team.players.length + ' players'],
              ].map(([icon,l,v]) => `
                <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);align-items:center">
                  <span>${icon}</span>
                  <span style="color:var(--text-3);font-size:13px;min-width:100px">${l}</span>
                  <span style="color:var(--text-1);font-size:13px;font-weight:600">${v}</span>
                </div>`).join('')}
            </div>
            ${team.titleYears.length ? `
              <div class="admin-card">
                <div class="admin-card-title">🏆 Title Winning Years</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${team.titleYears.map(y=>`<span class="title-badge">🏆 PCL ${y}</span>`).join('')}
                </div>
              </div>` : ''}
          </div>
        </div>
      </div>`;
  }

  function renderSquad() {
    const groups = ['Batter','All-rounder','Wicket-keeper','Bowler'];
    return `
      <div class="section anim-fade">
        ${groups.map(g => {
          const players = team.players.filter(p =>
            g === 'Bowler' ? p.role.startsWith('Bowler') : p.role === g
          );
          if (!players.length) return '';
          return `
            <div style="margin-bottom:32px">
              <h3 style="font-size:13px;font-weight:700;letter-spacing:2px;color:var(--text-3);text-transform:uppercase;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                ${g==='Batter'?'🏏':g==='Bowler'?'🎯':g==='All-rounder'?'⭐':'🧤'} ${g}s (${players.length})
              </h3>
              <div class="squad-grid">
                ${players.map(p => `
                  <div class="player-card">
                    <div class="player-avatar" style="background:${team.color}20;border-color:${team.color}40">
                      ${p.avatar}
                    </div>
                    <div class="player-name">${p.name}</div>
                    <div class="player-role">${p.role}</div>
                    <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">
                      ${p.isCaptain ? '<span class="player-badge badge-captain">C</span>' : ''}
                      ${p.isWK ? '<span class="player-badge badge-wk">WK</span>' : ''}
                    </div>
                    <div style="margin-top:10px;font-size:11px;color:var(--text-3)">
                      <div>${p.bat}</div>
                      ${p.bowl !== 'N/A' ? `<div>${p.bowl}</div>` : ''}
                    </div>
                  </div>`).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderSchedule() {
    return `
      <div class="section anim-fade">
        <div class="matches-list">
          ${teamMatches.length === 0
            ? '<p style="color:var(--text-3)">No matches scheduled.</p>'
            : teamMatches.map(m => {
                const t1 = teamOf(m.team1); const t2 = teamOf(m.team2);
                const isWinner = m.winner === id;
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
                      ${m.status==='upcoming' ? `<div class="match-venue-date">📅 ${m.time} IST</div>` : ''}
                    </div>
                  </div>`;
              }).join('')}
        </div>
      </div>`;
  }

  function renderStats() {
    const batters = [...team.players].sort((a,b) => b.stats.r - a.stats.r);
    const bowlers = [...team.players].filter(p=>p.stats.w>0).sort((a,b) => b.stats.w - a.stats.w);
    return `
      <div class="section anim-fade">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">Batting Stats</h3>
        <div class="admin-card stats-table-wrap" style="padding:0;margin-bottom:32px">
          <table class="stats-table">
            <thead><tr>
              <th>Player</th><th>M</th><th>Runs</th><th>Avg</th><th>SR</th>
            </tr></thead>
            <tbody>
              ${batters.map(p => `
                <tr>
                  <td class="player-name-cell">
                    ${p.avatar} ${p.name}
                    ${p.isCaptain?'<span class="player-badge badge-captain" style="margin-left:4px">C</span>':''}
                    ${p.isWK?'<span class="player-badge badge-wk" style="margin-left:4px">WK</span>':''}
                  </td>
                  <td>${p.stats.m}</td>
                  <td class="highlight">${p.stats.r}</td>
                  <td>${p.stats.avg.toFixed(1)}</td>
                  <td>${p.stats.sr.toFixed(1)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">Bowling Stats</h3>
        <div class="admin-card stats-table-wrap" style="padding:0">
          <table class="stats-table">
            <thead><tr>
              <th>Player</th><th>M</th><th>Wickets</th><th>Economy</th><th>Style</th>
            </tr></thead>
            <tbody>
              ${bowlers.length === 0
                ? '<tr><td colspan="5" style="text-align:center;color:var(--text-3)">No bowling data</td></tr>'
                : bowlers.map(p => `
                  <tr>
                    <td class="player-name-cell">${p.avatar} ${p.name}</td>
                    <td>${p.stats.m}</td>
                    <td class="highlight">${p.stats.w}</td>
                    <td>${p.stats.eco ? p.stats.eco.toFixed(1) : '—'}</td>
                    <td style="color:var(--text-3);font-size:12px">${p.bowl}</td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  render();
};
