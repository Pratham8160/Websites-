// js/pages/live.js — Live Score page with real-time updates
window.PCL = window.PCL || {};
PCL.Pages = PCL.Pages || {};

PCL.Pages.Live = function() {
  const app = document.getElementById('app');

  function render() {
    const lm = PCL.DB.getLiveMatch();

    if (!lm || lm.status !== 'live') {
      const upcoming = (PCL.DB.get('matches') || []).filter(m => m.status === 'upcoming').slice(0, 3);
      app.innerHTML = `
        <div class="container live-page">
          <div class="no-live">
            <div class="no-live-icon">📡</div>
            <h2 class="no-live-title">No Live Match Right Now</h2>
            <p class="no-live-text">Check back when a match is in progress. The admin can start a live match from the admin panel.</p>
            ${upcoming.length ? `
              <div style="margin-top:32px;max-width:500px;margin-left:auto;margin-right:auto">
                <h3 style="font-size:14px;color:var(--text-3);margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">UPCOMING MATCHES</h3>
                ${upcoming.map(m => {
                  const t1 = PCL.DB.getTeam(m.team1)||{};
                  const t2 = PCL.DB.getTeam(m.team2)||{};
                  return `<div class="card" style="padding:16px;margin-bottom:12px;text-align:left">
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">Match #${m.num} · ${PCL.Utils.formatDate(m.date)}</div>
                    <div style="display:flex;align-items:center;gap:12px;justify-content:space-between">
                      <div style="display:flex;align-items:center;gap:8px"><span style="font-size:28px">${t1.emoji||'🏏'}</span><strong>${t1.name||m.team1}</strong></div>
                      <span style="color:var(--text-3);font-weight:700">VS</span>
                      <div style="display:flex;align-items:center;gap:8px"><strong>${t2.name||m.team2}</strong><span style="font-size:28px">${t2.emoji||'🏏'}</span></div>
                    </div>
                  </div>`;
                }).join('')}
              </div>` : ''}
            <a href="#/admin" class="btn btn-ghost" style="margin-top:24px;display:inline-block">Go to Admin Panel →</a>
          </div>
        </div>`;

      // Subscribe to updates
      PCL.Realtime.on('liveMatch', (data) => {
        if (data && data.status === 'live') render();
      });
      return;
    }

    const t1 = PCL.DB.getTeam(lm.team1Id) || {};
    const t2 = PCL.DB.getTeam(lm.team2Id) || {};
    const batting = lm.innings === 1 ? t1 : t2;
    const bowling = lm.innings === 1 ? t2 : t1;
    const score = lm.innings === 1 ? (lm.score1||0) : (lm.score2||0);
    const wkts  = lm.innings === 1 ? (lm.wkts1||0) : (lm.wkts2||0);
    const balls = lm.innings === 1 ? (lm.balls1||0) : (lm.balls2||0);
    const crr   = PCL.Utils.computeCRR(score, balls);
    const rrr   = lm.target && lm.innings===2
      ? PCL.Utils.computeCRR(lm.target - score, Math.max(0, 120 - balls))
      : null;

    const currentOverBalls = lm.currentOver || [];
    const commentary = [...(lm.commentary || [])].reverse();
    const batsmen = lm.batsmen || [];
    const bowlers = lm.bowlers || [];

    app.innerHTML = `
      <div class="container live-page">
        <div class="live-header">
          <div class="live-badge-large"><span class="live-dot"></span> LIVE</div>
          <div class="live-match-title">Match #${lm.matchNum||''} · ${lm.venue||''}</div>
        </div>

        ${lm.innings === 2 && lm.target ? `
          <div class="innings-banner">
            <div class="innings-banner-title">🏏 2nd Innings — Target: ${lm.target}</div>
            <div class="innings-banner-text">${batting.name||'Batting team'} need ${Math.max(0,lm.target-score)} runs from ${120-balls} balls</div>
          </div>` : ''}

        <!-- Main Scorecard -->
        <div class="scorecard-main">
          <div class="scorecard-banner">
            <div class="sc-team-vs">
              <div class="sc-team">
                <div class="sc-team-logo">${t1.emoji||'🏏'}</div>
                <div class="sc-team-name">${t1.shortName||t1.name||'Team 1'}</div>
                ${lm.innings >= 1 ? `
                  <div class="sc-team-score">${lm.score1||0}/${lm.wkts1||0}</div>
                  <div class="sc-team-overs">${PCL.Utils.formatOvers(lm.balls1||0)} ov</div>` : '<div class="sc-team-overs" style="color:var(--text-3)">Yet to bat</div>'}
              </div>
              <div class="sc-vs">VS</div>
              <div class="sc-team">
                <div class="sc-team-logo">${t2.emoji||'🏏'}</div>
                <div class="sc-team-name">${t2.shortName||t2.name||'Team 2'}</div>
                ${lm.innings >= 2 ? `
                  <div class="sc-team-score">${lm.score2||0}/${lm.wkts2||0}</div>
                  <div class="sc-team-overs">${PCL.Utils.formatOvers(lm.balls2||0)} ov</div>` : '<div class="sc-team-overs" style="color:var(--text-3)">Yet to bat</div>'}
              </div>
            </div>
            <!-- Rate Strip -->
            <div class="widget-crr" style="margin-top:20px">
              <div class="crr-item"><div class="crr-label">CRR</div><div class="crr-value">${crr}</div></div>
              ${rrr ? `<div class="crr-item"><div class="crr-label">RRR</div><div class="crr-value">${rrr}</div></div>` : ''}
              ${lm.target ? `<div class="crr-item"><div class="crr-label">TARGET</div><div class="crr-value">${lm.target}</div></div>` : ''}
              <div class="crr-item"><div class="crr-label">INNINGS</div><div class="crr-value">${lm.innings||1}</div></div>
            </div>
          </div>

          <!-- Current Over -->
          ${currentOverBalls.length > 0 ? `
            <div class="current-over">
              <div class="over-label">CURRENT OVER — OVER ${Math.floor(balls/6)+1}</div>
              <div class="over-balls">
                ${currentOverBalls.map(b => `<div class="ball-item ${PCL.Utils.ballClass(b)}">${b}</div>`).join('')}
              </div>
            </div>` : ''}

          <!-- Batsmen -->
          ${batsmen.length ? `
            <div class="scorecard-section">
              <div class="scorecard-section-title">🏏 Batting — ${batting.name||''}</div>
              <div class="stats-table-wrap">
                <table class="stats-table">
                  <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                  <tbody>
                    ${batsmen.map(b => `
                      <tr ${b.onStrike ? 'style="background:rgba(245,158,11,0.05)"' : ''}>
                        <td><strong>${b.name}</strong> ${b.onStrike?'<span style="color:var(--gold)">*</span>':''}</td>
                        <td class="highlight">${b.runs}</td>
                        <td>${b.balls}</td>
                        <td>${b.fours||0}</td>
                        <td>${b.sixes||0}</td>
                        <td>${b.balls?((b.runs/b.balls)*100).toFixed(1):'0.0'}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>` : ''}

          <!-- Bowlers -->
          ${bowlers.length ? `
            <div class="scorecard-section">
              <div class="scorecard-section-title">🎯 Bowling — ${bowling.name||''}</div>
              <div class="stats-table-wrap">
                <table class="stats-table">
                  <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Eco</th></tr></thead>
                  <tbody>
                    ${bowlers.map(b => `
                      <tr ${b.isBowling ? 'style="background:rgba(59,130,246,0.05)"' : ''}>
                        <td><strong>${b.name}</strong> ${b.isBowling?'<span style="color:#60a5fa">⚡</span>':''}</td>
                        <td>${Math.floor(b.balls/6)}.${b.balls%6}</td>
                        <td>${b.maidens||0}</td>
                        <td>${b.runs}</td>
                        <td class="highlight">${b.wickets}</td>
                        <td>${b.balls?((b.runs/(b.balls/6)).toFixed(2)):'0.00'}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>` : ''}
        </div>

        <!-- Commentary Feed -->
        <div class="admin-card" style="margin-top:24px">
          <div class="admin-card-title" style="margin-bottom:20px">📢 Live Commentary</div>
          <div class="commentary-feed" id="commentary-feed">
            ${commentary.length === 0
              ? '<div style="text-align:center;color:var(--text-3);padding:24px">Waiting for commentary...</div>'
              : commentary.map(c => `
                  <div class="commentary-item">
                    <span class="comm-ball">${c.ball}</span>
                    <span class="comm-text">${c.text.replace(/SIX|FOUR|WICKET|OUT/g, m => `<span class="comm-highlight">${m}</span>`)}</span>
                  </div>`).join('')}
          </div>
        </div>
      </div>`;

    // Subscribe to live updates — re-render when data changes
    PCL.Realtime.on('liveMatch', (data) => {
      if (data && data.status === 'live') {
        render(); // Full re-render for simplicity
      } else {
        render(); // Show no-live screen
      }
    });
  }

  render();
};
