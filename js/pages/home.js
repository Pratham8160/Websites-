// js/pages/home.js — Home page
window.PCL = window.PCL || {};

PCL.Pages = PCL.Pages || {};

PCL.Pages.Home = function() {
  const app = document.getElementById('app');
  const teams = PCL.DB.get('teams') || [];
  const matches = PCL.DB.get('matches') || [];
  const liveMatch = PCL.DB.getLiveMatch();
  const tournament = PCL.DB.get('tournament') || PCL.DATA.tournament;

  const upcoming = matches.filter(m => m.status === 'upcoming').slice(0, 3);
  const recent   = matches.filter(m => m.status === 'completed').slice(-3).reverse();

  function teamOf(id) { return PCL.DB.getTeam(id) || {}; }

  function renderLiveWidget() {
    if (!liveMatch || liveMatch.status !== 'live') return '';
    const t1 = teamOf(liveMatch.team1Id);
    const t2 = teamOf(liveMatch.team2Id);
    const crr = PCL.Utils.computeCRR(liveMatch.score1 || 0, liveMatch.balls1 || 0);
    return `
      <div class="live-widget" id="home-live-widget">
        <div class="live-widget-header">
          <div class="live-widget-badge">
            <span class="live-dot"></span> LIVE
          </div>
          <span class="live-widget-match">Match #${liveMatch.matchNum || ''} · ${liveMatch.venue || ''}</span>
        </div>
        <div class="widget-teams">
          <div class="widget-team">
            <div class="widget-team-logo">${t1.emoji || '🏏'}</div>
            <div class="widget-team-name">${t1.shortName || t1.name || ''}</div>
            <div class="widget-score">${liveMatch.score1 || 0}/${liveMatch.wkts1 || 0}</div>
            <div class="widget-overs">${PCL.Utils.formatOvers(liveMatch.balls1 || 0)} ov</div>
          </div>
          <div class="widget-vs">VS</div>
          <div class="widget-team">
            <div class="widget-team-logo">${t2.emoji || '🏏'}</div>
            <div class="widget-team-name">${t2.shortName || t2.name || ''}</div>
            ${liveMatch.innings === 2
              ? `<div class="widget-score">${liveMatch.score2 || 0}/${liveMatch.wkts2 || 0}</div>
                 <div class="widget-overs">${PCL.Utils.formatOvers(liveMatch.balls2 || 0)} ov</div>`
              : `<div class="widget-score" style="color:var(--text-3)">Yet to bat</div>`
            }
          </div>
        </div>
        <div class="widget-crr">
          <div class="crr-item">
            <div class="crr-label">CRR</div>
            <div class="crr-value">${crr}</div>
          </div>
          ${liveMatch.target ? `
          <div class="crr-item">
            <div class="crr-label">TARGET</div>
            <div class="crr-value">${liveMatch.target}</div>
          </div>
          <div class="crr-item">
            <div class="crr-label">NEED</div>
            <div class="crr-value">${Math.max(0, liveMatch.target - (liveMatch.score2 || 0))}</div>
          </div>` : ''}
        </div>
        <div style="margin-top:16px">
          <a href="#/live" class="btn btn-gold btn-block" style="text-align:center;display:block;padding:10px">
            🔴 Watch Live Score →
          </a>
        </div>
      </div>`;
  }

  function renderUpcoming() {
    if (!upcoming.length) return '<p style="color:var(--text-3);font-size:14px">No upcoming matches scheduled.</p>';
    return upcoming.map(m => {
      const t1 = teamOf(m.team1); const t2 = teamOf(m.team2);
      return `
        <div class="card" style="padding:16px;margin-bottom:12px;cursor:pointer" onclick="PCL.Router.go('#/matches')">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">
            ${PCL.Utils.formatDate(m.date)} · ${m.time} · ${m.venue}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:24px">${t1.emoji||'🏏'}</span>
              <strong style="font-size:13px">${t1.shortName||t1.name}</strong>
            </div>
            <span style="font-size:12px;color:var(--text-3);font-weight:700">VS</span>
            <div style="display:flex;align-items:center;gap:8px">
              <strong style="font-size:13px">${t2.shortName||t2.name}</strong>
              <span style="font-size:24px">${t2.emoji||'🏏'}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderRecent() {
    if (!recent.length) return '<p style="color:var(--text-3);font-size:14px">No completed matches yet.</p>';
    return recent.map(m => {
      const t1 = teamOf(m.team1); const t2 = teamOf(m.team2);
      const w = teamOf(m.winner);
      return `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">Match #${m.num} · ${PCL.Utils.formatDate(m.date)}</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
            <span style="font-size:20px">${t1.emoji||'🏏'}</span>
            <span style="font-family:'Space Mono',monospace;font-size:13px">${m.score1||''}</span>
            <span style="color:var(--text-3);font-size:11px">vs</span>
            <span style="font-family:'Space Mono',monospace;font-size:13px">${m.score2||''}</span>
            <span style="font-size:20px">${t2.emoji||'🏏'}</span>
          </div>
          <div style="font-size:12px;color:var(--green);font-weight:600">${m.result||''}</div>
        </div>`;
    }).join('');
  }

  const titlesWon = teams.reduce((a,t) => a + t.titles, 0);

  app.innerHTML = `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg-pattern"></div>
      <div class="hero-glow"></div>
      <div class="container">
        <div class="home-grid" style="align-items:center">
          <div class="hero-content anim-fade">
            <div class="hero-eyebrow">🏆 Season ${tournament.season} · 2025</div>
            <h1 class="hero-title">
              <span class="gold-text">PATIDAR</span><br>CRICKET<br>LEAGUE
            </h1>
            <p class="hero-desc">
              ${tournament.totalTeams} teams. ${tournament.totalMatches} matches. One champion. 
              Follow live scores, stats, and real-time updates all in one place.
            </p>
            <div class="hero-actions">
              <a href="#/teams" class="btn-primary">🏏 View All Teams</a>
              <a href="#/matches" class="btn-secondary">📅 Match Schedule</a>
            </div>
          </div>
          <div id="home-live-section">
            ${renderLiveWidget() || `
              <div class="card" style="padding:32px;text-align:center">
                <div style="font-size:48px;margin-bottom:16px">🏏</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:8px">No Live Match</div>
                <div style="font-size:13px;color:var(--text-2);margin-bottom:20px">Check back when a match is in progress</div>
                <a href="#/matches" style="color:var(--gold);font-size:13px;font-weight:600">View upcoming matches →</a>
              </div>`
            }
          </div>
        </div>
      </div>
    </section>

    <!-- STATS STRIP -->
    <section style="background:var(--bg-2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:24px 0">
      <div class="container">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:24px;text-align:center">
          ${[
            {v: tournament.totalTeams, l: 'Teams'},
            {v: tournament.totalMatches, l: 'Total Matches'},
            {v: matches.filter(m=>m.status==='completed').length, l: 'Played'},
            {v: matches.filter(m=>m.status==='upcoming').length, l: 'Remaining'},
            {v: titlesWon, l: 'Editions'},
            {v: teams.reduce((a,t)=>a+t.players.length,0), l: 'Players'},
          ].map(s => `
            <div>
              <div style="font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:2px;color:var(--gold)">${s.v}</div>
              <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:2px">${s.l}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- TWO COLUMN: UPCOMING + RECENT -->
    <section class="section">
      <div class="container">
        <div class="home-grid">
          <div>
            <div class="section-title">
              <div class="section-divider"></div>
              <h2>Upcoming Matches</h2>
              <a href="#/matches">View all →</a>
            </div>
            <div id="upcoming-list">${renderUpcoming()}</div>
          </div>
          <div>
            <div class="section-title">
              <div class="section-divider"></div>
              <h2>Recent Results</h2>
              <a href="#/matches">View all →</a>
            </div>
            <div id="recent-list">${renderRecent()}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- TEAMS TEASER -->
    <section style="background:var(--bg-2);padding:48px 0;border-top:1px solid var(--border)">
      <div class="container">
        <div class="section-title"><div class="section-divider"></div><h2>All Teams</h2><a href="#/teams">See all →</a></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">
          ${teams.map(t => `
            <a href="#/teams/${t.id}" style="display:flex;align-items:center;gap:10px;padding:12px 20px;
               background:var(--bg-3);border:1px solid var(--border);border-radius:50px;
               transition:all 0.2s;cursor:pointer;text-decoration:none"
               onmouseover="this.style.borderColor='${t.color}'" onmouseout="this.style.borderColor='var(--border)'">
              <span style="font-size:24px">${t.emoji}</span>
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--text-1)">${t.shortName}</div>
                <div style="font-size:10px;color:var(--text-3)">${t.titles} title${t.titles!==1?'s':''}</div>
              </div>
            </a>`).join('')}
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-logo">🏏 PCL</div>
            <p class="footer-desc">Patidar Cricket League — Bringing cricket fever to Gujarat with live scores, real-time updates, and all the action you need.</p>
          </div>
          <div>
            <div class="footer-heading">Quick Links</div>
            <ul class="footer-links">
              <li><a href="#/">Home</a></li>
              <li><a href="#/matches">Matches</a></li>
              <li><a href="#/teams">Teams</a></li>
              <li><a href="#/points-table">Points Table</a></li>
              <li><a href="#/live">Live Score</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-heading">Teams</div>
            <ul class="footer-links">
              ${teams.slice(0,6).map(t=>`<li><a href="#/teams/${t.id}">${t.shortName} — ${t.name}</a></li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-copy">© 2025 Patidar Cricket League. All rights reserved.</div>
          <div class="footer-realtime"><span class="rt-dot"></span> Real-time data powered by PCL Live Engine</div>
        </div>
      </div>
    </footer>
  `;

  // Subscribe to live match updates
  PCL.Realtime.on('liveMatch', (data) => {
    const section = document.getElementById('home-live-section');
    if (!section) return;
    if (data && data.status === 'live') {
      section.innerHTML = renderLiveWidget();
    } else {
      section.innerHTML = `
        <div class="card" style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🏏</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:8px">No Live Match</div>
          <div style="font-size:13px;color:var(--text-2);margin-bottom:20px">Check back when a match is in progress</div>
          <a href="#/matches" style="color:var(--gold);font-size:13px;font-weight:600">View upcoming matches →</a>
        </div>`;
    }
  });
};
