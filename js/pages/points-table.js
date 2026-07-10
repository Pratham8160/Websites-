// js/pages/points-table.js — Live points table
window.PCL = window.PCL || {};
PCL.Pages = PCL.Pages || {};

PCL.Pages.PointsTable = function() {
  const app = document.getElementById('app');

  function render() {
    const pt = PCL.DB.get('pointsTable') || [];
    const sorted = [...pt].sort((a,b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return b.nrr - a.nrr;
    });

    app.innerHTML = `
      <div class="page-header">
        <div class="container">
          <div class="hero-eyebrow" style="display:inline-flex;margin-bottom:12px">📊 PCL 2025</div>
          <h1 class="page-title">POINTS TABLE</h1>
          <p class="page-subtitle">Live standings — updates automatically as matches complete</p>
        </div>
      </div>
      <div class="container">
        <div class="points-table-wrap anim-fade">
          <table class="points-table">
            <thead>
              <tr>
                <th>#</th>
                <th style="text-align:left;padding-left:24px">Team</th>
                <th>P</th><th>W</th><th>L</th><th>NR</th>
                <th>PTS</th><th>NRR</th>
              </tr>
            </thead>
            <tbody id="pt-tbody">
              ${renderRows(sorted)}
            </tbody>
          </table>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:16px">
          <div class="qualification-note">
            <span class="qual-dot"></span> Top 4 qualify for playoffs
          </div>
          <div class="qualification-note">
            <span class="qual-dot" style="background:var(--gold)"></span> Qualified / Strong position
          </div>
        </div>

        <!-- Recent Results that affected table -->
        <div style="margin-top:40px">
          <div class="section-title"><div class="section-divider"></div><h2>Recent Results</h2></div>
          <div class="matches-list" style="margin-top:16px">
            ${((PCL.DB.get('matches')||[]).filter(m=>m.status==='completed').slice(-4).reverse()).map(m => {
              const t1 = PCL.DB.getTeam(m.team1)||{};
              const t2 = PCL.DB.getTeam(m.team2)||{};
              return `
                <div class="match-card">
                  <div class="match-card-header">
                    <span>Match #${m.num}</span>
                    <span style="color:var(--text-3)">${PCL.Utils.formatDate(m.date)}</span>
                    ${PCL.Utils.statusBadge(m.status)}
                  </div>
                  <div class="match-card-body">
                    <div class="match-teams">
                      <div class="match-team">
                        <div class="match-team-logo">${t1.emoji||'🏏'}</div>
                        <div class="match-team-name">${t1.shortName||m.team1}</div>
                        <div class="match-team-score ${m.winner===m.team1?'winner':''}">${m.score1||''}</div>
                      </div>
                      <div class="match-vs">VS</div>
                      <div class="match-team">
                        <div class="match-team-logo">${t2.emoji||'🏏'}</div>
                        <div class="match-team-name">${t2.shortName||m.team2}</div>
                        <div class="match-team-score ${m.winner===m.team2?'winner':''}">${m.score2||''}</div>
                      </div>
                    </div>
                    <div class="match-result"><strong>${m.result||''}</strong></div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <footer class="footer">
        <div class="container">
          <div class="footer-bottom">
            <div class="footer-copy">© 2025 Patidar Cricket League</div>
            <div class="footer-realtime"><span class="rt-dot"></span> Table updates live</div>
          </div>
        </div>
      </footer>`;

    // Subscribe to real-time updates
    PCL.Realtime.on('pointsTable', (data) => {
      const sorted2 = [...(data||[])].sort((a,b)=>{
        if (b.pts!==a.pts) return b.pts-a.pts;
        return b.nrr-a.nrr;
      });
      const tbody = document.getElementById('pt-tbody');
      if (tbody) {
        tbody.innerHTML = renderRows(sorted2);
        PCL.Utils.toast('📊 Points table updated!', 'info');
      }
    });

    PCL.Realtime.on('matches', () => {
      render(); // Re-render fully on match update
    });
  }

  function renderRows(sorted) {
    return sorted.map((row, i) => {
      const team = PCL.DB.getTeam(row.teamId) || {};
      const rank = i + 1;
      const isTop4 = rank <= 4;
      const nrrStr = (row.nrr >= 0 ? '+' : '') + (row.nrr||0).toFixed(3);
      const nrrClass = row.nrr >= 0 ? 'pos' : 'neg';
      return `
        <tr onclick="PCL.Router.go('#/teams/${row.teamId}')" style="cursor:pointer">
          <td><span class="pt-rank ${isTop4?'top4'}">${isTop4?'✅':rank}</span></td>
          <td>
            <div class="pt-team-cell">
              <span class="pt-team-logo">${team.emoji||'🏏'}</span>
              <div>
                <div class="pt-team-name">${team.name||row.teamId}</div>
                <div class="pt-team-short">${team.shortName||''}</div>
              </div>
            </div>
          </td>
          <td>${row.p||0}</td>
          <td>${row.w||0}</td>
          <td>${row.l||0}</td>
          <td>${row.nr||0}</td>
          <td class="pt-pts">${row.pts||0}</td>
          <td class="pt-nrr ${nrrClass}">${nrrStr}</td>
        </tr>`;
    }).join('');
  }

  render();
};
