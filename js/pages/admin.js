// js/pages/admin.js — Admin Dashboard (password-protected)
window.PCL = window.PCL || {};
PCL.Pages = PCL.Pages || {};

const ADMIN_PASSWORD = 'PCL@Admin2024';
const AUTH_KEY = 'pcl_admin_auth';

PCL.Pages.Admin = function() {
  const app = document.getElementById('app');

  // Check auth
  const isAuth = sessionStorage.getItem(AUTH_KEY) === '1';

  if (!isAuth) {
    renderLogin();
  } else {
    renderDashboard();
  }

  // ================================================
  // LOGIN
  // ================================================
  function renderLogin() {
    app.innerHTML = `
      <div class="admin-login">
        <div class="admin-login-card">
          <div class="login-logo">🏏</div>
          <div class="login-title">PCL ADMIN</div>
          <div class="login-sub">Patidar Cricket League — Control Panel</div>
          <div class="login-error" id="login-error">Incorrect password. Please try again.</div>
          <div class="form-group">
            <label class="form-label">Admin Password</label>
            <input type="password" class="form-input" id="admin-pwd" placeholder="Enter password..."
              onkeydown="if(event.key==='Enter')PCL._adminLogin()" />
          </div>
          <button class="btn btn-gold btn-block" style="margin-top:8px" onclick="PCL._adminLogin()">
            🔐 Login to Admin Panel
          </button>
          <div style="margin-top:20px;text-align:center;font-size:12px;color:var(--text-3)">
            Demo password: <code style="color:var(--gold)">PCL@Admin2024</code>
          </div>
        </div>
      </div>`;

    document.getElementById('admin-pwd').focus();
  }

  PCL._adminLogin = function() {
    const pwd = document.getElementById('admin-pwd')?.value;
    const errEl = document.getElementById('login-error');
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      renderDashboard();
    } else {
      if (errEl) errEl.style.display = 'block';
      document.getElementById('admin-pwd').value = '';
    }
  };

  // ================================================
  // DASHBOARD
  // ================================================
  let activeSection = 'overview';

  function renderDashboard() {
    const matches = PCL.DB.get('matches') || [];
    const teams   = PCL.DB.get('teams') || [];
    const lm      = PCL.DB.getLiveMatch();

    app.innerHTML = `
      <div class="admin-layout">
        <!-- Sidebar -->
        <div class="admin-sidebar">
          <div class="admin-sidebar-header">
            <div class="admin-sidebar-title">⚙️ PCL ADMIN</div>
            <div class="admin-sidebar-sub">Season 5 · 2025</div>
          </div>
          <ul class="admin-nav">
            ${[
              {id:'overview',   icon:'📊', label:'Overview'},
              {id:'live-match', icon:'🔴', label:'Live Match Control'},
              {id:'matches',    icon:'📅', label:'Match Manager'},
              {id:'teams',      icon:'🏏', label:'Teams & Players'},
              {id:'points',     icon:'🏆', label:'Points Table'},
              {id:'reset',      icon:'🔄', label:'Reset Data'},
            ].map(n => `
              <li>
                <button class="admin-nav-btn ${n.id===activeSection?'active':''}"
                  data-section="${n.id}" onclick="PCL._adminNav('${n.id}')">
                  <span class="admin-nav-icon">${n.icon}</span>
                  ${n.label}
                </button>
              </li>`).join('')}
            <li style="margin-top:auto;padding-top:20px">
              <button class="admin-nav-btn" onclick="PCL._adminLogout()" style="color:#f87171">
                <span class="admin-nav-icon">🚪</span> Logout
              </button>
            </li>
          </ul>
        </div>

        <!-- Content -->
        <div class="admin-content" id="admin-content">
          ${renderSection()}
        </div>
      </div>`;
  }

  PCL._adminNav = function(section) {
    activeSection = section;
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === section));
    const content = document.getElementById('admin-content');
    if (content) content.innerHTML = renderSection();
  };

  PCL._adminLogout = function() {
    sessionStorage.removeItem(AUTH_KEY);
    PCL.Router.go('#/');
  };

  function renderSection() {
    switch(activeSection) {
      case 'overview':   return renderOverview();
      case 'live-match': return renderLiveMatchControl();
      case 'matches':    return renderMatchManager();
      case 'teams':      return renderTeamsManager();
      case 'points':     return renderPointsEditor();
      case 'reset':      return renderReset();
      default: return renderOverview();
    }
  }

  // ================================================
  // OVERVIEW
  // ================================================
  function renderOverview() {
    const matches = PCL.DB.get('matches') || [];
    const teams   = PCL.DB.get('teams') || [];
    const lm      = PCL.DB.getLiveMatch();
    const played  = matches.filter(m=>m.status==='completed').length;
    const upcoming = matches.filter(m=>m.status==='upcoming').length;

    return `
      <div class="admin-section active">
        <h2 class="admin-page-title">Dashboard Overview</h2>
        <p class="admin-page-sub">Welcome to the PCL Admin Panel. Manage live scores, teams, and match results from here.</p>

        ${lm && lm.status==='live' ? `
          <div class="admin-card" style="border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.05);margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
              <div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  <span class="live-dot"></span>
                  <span style="font-size:13px;font-weight:800;letter-spacing:2px;color:#f87171">LIVE MATCH IN PROGRESS</span>
                </div>
                <div style="font-size:15px;color:var(--text-1);font-weight:600">
                  ${(PCL.DB.getTeam(lm.team1Id)||{}).name||''} vs ${(PCL.DB.getTeam(lm.team2Id)||{}).name||''}
                </div>
                <div style="font-size:13px;color:var(--text-2);margin-top:4px">
                  Score: ${lm.score1||0}/${lm.wkts1||0} · Overs: ${PCL.Utils.formatOvers(lm.balls1||0)}
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-gold" onclick="PCL._adminNav('live-match')">Manage Live →</button>
                <button class="btn btn-danger" onclick="PCL._endMatch()">End Match</button>
              </div>
            </div>
          </div>` : ''}

        <div class="admin-stats-row">
          <div class="admin-stat-card"><div class="admin-stat-val">${teams.length}</div><div class="admin-stat-label">Teams</div></div>
          <div class="admin-stat-card"><div class="admin-stat-val">${played}</div><div class="admin-stat-label">Matches Played</div></div>
          <div class="admin-stat-card"><div class="admin-stat-val">${upcoming}</div><div class="admin-stat-label">Upcoming</div></div>
          <div class="admin-stat-card"><div class="admin-stat-val" style="${lm?'color:#f87171':''}">
            ${lm?'🔴 LIVE':'—'}</div><div class="admin-stat-label">Live Now</div></div>
          <div class="admin-stat-card"><div class="admin-stat-val">${teams.reduce((a,t)=>a+t.players.length,0)}</div><div class="admin-stat-label">Players</div></div>
        </div>

        <div class="admin-card">
          <div class="admin-card-title">Quick Actions</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            <button class="btn btn-gold" onclick="PCL._adminNav('live-match')">🔴 Start Live Match</button>
            <button class="btn btn-ghost" onclick="PCL._adminNav('matches')">📅 Update Results</button>
            <button class="btn btn-ghost" onclick="PCL._adminNav('points')">📊 Edit Points Table</button>
            <button class="btn btn-ghost" onclick="PCL._adminNav('teams')">🏏 Manage Teams</button>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-title">All Teams</div>
          ${(PCL.DB.get('teams')||[]).map(t=>`
            <div class="admin-player-row">
              <div class="admin-player-info">
                <span style="font-size:28px">${t.emoji}</span>
                <div>
                  <div class="admin-player-name">${t.name}</div>
                  <div class="admin-player-role">Captain: ${t.captain} · ${t.players.length} players</div>
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="PCL.Router.go('#/teams/${t.id}');sessionStorage.setItem('${AUTH_KEY}','1')">View →</button>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ================================================
  // LIVE MATCH CONTROL
  // ================================================
  function renderLiveMatchControl() {
    const lm = PCL.DB.getLiveMatch();
    const matches = PCL.DB.get('matches') || [];
    const upcoming = matches.filter(m => m.status === 'upcoming');
    const teams = PCL.DB.get('teams') || [];

    if (lm && lm.status === 'live') {
      return renderLiveScorer(lm);
    }

    return `
      <div class="admin-section active anim-fade">
        <h2 class="admin-page-title">Live Match Control</h2>
        <p class="admin-page-sub">Select an upcoming match to go live. Once started, you can update scores ball-by-ball.</p>

        <div class="admin-card">
          <div class="admin-card-title">Start Live Match</div>
          <div class="form-group">
            <label class="form-label">Select Match</label>
            <select class="form-select" id="live-match-select">
              <option value="">-- Choose a match --</option>
              ${upcoming.map(m => {
                const t1 = PCL.DB.getTeam(m.team1)||{};
                const t2 = PCL.DB.getTeam(m.team2)||{};
                return `<option value="${m.id}">${t1.emoji||'🏏'} ${t1.shortName||m.team1} vs ${t2.shortName||m.team2} ${t2.emoji||'🏏'} — Match #${m.num}</option>`;
              }).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Batting Team (Innings 1)</label>
              <select class="form-select" id="live-batting-team">
                <option value="">-- Select after choosing match --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Venue</label>
              <input type="text" class="form-input" id="live-venue" placeholder="Stadium name..." />
            </div>
          </div>
          <button class="btn btn-gold" onclick="PCL._startLiveMatch()">🔴 Start Live Match</button>
        </div>

        <script>
          document.getElementById('live-match-select').addEventListener('change', function() {
            const id = this.value;
            if (!id) return;
            const m = (PCL.DB.get('matches')||[]).find(x=>x.id===id);
            if (!m) return;
            const t1 = PCL.DB.getTeam(m.team1)||{};
            const t2 = PCL.DB.getTeam(m.team2)||{};
            const sel = document.getElementById('live-batting-team');
            sel.innerHTML = [
              \`<option value="\${m.team1}">\${t1.emoji||''} \${t1.name||m.team1}</option>\`,
              \`<option value="\${m.team2}">\${t2.emoji||''} \${t2.name||m.team2}</option>\`,
            ].join('');
            document.getElementById('live-venue').value = m.venue || '';
          });
        <\/script>
      </div>`;
  }

  function renderLiveScorer(lm) {
    const t1 = PCL.DB.getTeam(lm.team1Id)||{};
    const t2 = PCL.DB.getTeam(lm.team2Id)||{};
    const batting = lm.innings === 1 ? t1 : t2;
    const score = lm.innings === 1 ? (lm.score1||0) : (lm.score2||0);
    const wkts  = lm.innings === 1 ? (lm.wkts1||0) : (lm.wkts2||0);
    const balls = lm.innings === 1 ? (lm.balls1||0) : (lm.balls2||0);
    const crr   = PCL.Utils.computeCRR(score, balls);
    const overBalls = lm.currentOver || [];

    return `
      <div class="admin-section active anim-fade">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:24px">
          <div>
            <h2 class="admin-page-title">🔴 Live Scorer</h2>
            <p class="admin-page-sub">${t1.name||''} vs ${t2.name||''} · Match #${lm.matchNum||''}</p>
          </div>
          <div style="display:flex;gap:8px">
            ${lm.innings===1?`<button class="btn btn-ghost" onclick="PCL._endInnings()">🔄 End Innings</button>`:''}
            <button class="btn btn-danger" onclick="PCL._endMatch()">🏁 End Match</button>
          </div>
        </div>

        <!-- Score Display -->
        <div class="admin-card" style="border-color:rgba(239,68,68,0.3);margin-bottom:20px">
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--text-3);letter-spacing:2px;margin-bottom:8px">
              ${batting.shortName||batting.name||''} BATTING · INNINGS ${lm.innings||1}
            </div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:56px;letter-spacing:4px;color:var(--text-1)">
              ${score}/${wkts}
            </div>
            <div style="font-size:16px;color:var(--text-2);margin-bottom:8px">
              ${PCL.Utils.formatOvers(balls)} overs · CRR: ${crr}
            </div>
            ${lm.target && lm.innings===2 ? `
              <div style="color:var(--gold);font-weight:700">
                Target: ${lm.target} · Need: ${Math.max(0,lm.target-score)} from ${120-balls} balls
              </div>` : ''}
            <!-- Current over balls -->
            <div class="over-balls" style="justify-content:center;margin-top:16px">
              ${overBalls.map(b=>`<div class="ball-item ${PCL.Utils.ballClass(b)}">${b}</div>`).join('')}
              ${overBalls.length===0?'<span style="color:var(--text-3);font-size:13px">No balls bowled this over</span>':''}
            </div>
          </div>
        </div>

        <!-- Ball-by-ball input -->
        <div class="admin-card">
          <div class="admin-card-title">Ball Entry — Over ${Math.floor(balls/6)+1}</div>
          <div class="ball-buttons">
            ${['0','1','2','3','4','6','W','Wd','Nb','4s'].map(b => `
              <button class="ball-btn ball-btn-${b}" onclick="PCL._addBall('${b}')" title="${b==='W'?'Wicket':b==='Wd'?'Wide':b==='Nb'?'No Ball':b==='4s'?'4 (overthrow)':b+' runs'}">
                ${b}
              </button>`).join('')}
          </div>
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Commentary text (optional)</label>
            <input type="text" class="form-input" id="commentary-input"
              placeholder="e.g. 'Massive SIX over long-on!'" />
          </div>
        </div>

        <!-- Batsmen Input -->
        <div class="admin-card">
          <div class="admin-card-title">Batting (On-strike batsmen)</div>
          <div id="batsmen-list">
            ${(lm.batsmen||[]).map((b,i) => `
              <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
                <input type="text" class="form-input" style="flex:2;min-width:120px" value="${b.name}" placeholder="Name"
                  onchange="PCL._updateBatsman(${i},'name',this.value)" />
                <input type="number" class="form-input" style="width:60px" value="${b.runs}" placeholder="R"
                  onchange="PCL._updateBatsman(${i},'runs',parseInt(this.value)||0)" />
                <input type="number" class="form-input" style="width:60px" value="${b.balls}" placeholder="B"
                  onchange="PCL._updateBatsman(${i},'balls',parseInt(this.value)||0)" />
                <label style="font-size:12px;color:var(--text-3);display:flex;align-items:center;gap:4px">
                  <input type="checkbox" ${b.onStrike?'checked':''} onchange="PCL._setOnStrike(${i},this.checked)"> On Strike
                </label>
                <button class="btn btn-danger btn-sm" onclick="PCL._removeBatsman(${i})">✕</button>
              </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="PCL._addBatsman()">+ Add Batsman</button>
        </div>

        <!-- Bowler Input -->
        <div class="admin-card">
          <div class="admin-card-title">Current Bowler</div>
          <div id="bowlers-list">
            ${(lm.bowlers||[]).map((b,i) => `
              <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
                <input type="text" class="form-input" style="flex:2;min-width:120px" value="${b.name}" placeholder="Name"
                  onchange="PCL._updateBowler(${i},'name',this.value)" />
                <input type="number" class="form-input" style="width:60px" value="${b.runs}" placeholder="R"
                  onchange="PCL._updateBowler(${i},'runs',parseInt(this.value)||0)" />
                <input type="number" class="form-input" style="width:60px" value="${b.wickets}" placeholder="W"
                  onchange="PCL._updateBowler(${i},'wickets',parseInt(this.value)||0)" />
                <label style="font-size:12px;color:var(--text-3);display:flex;align-items:center;gap:4px">
                  <input type="checkbox" ${b.isBowling?'checked':''} onchange="PCL._setCurrentBowler(${i},this.checked)"> Current
                </label>
                <button class="btn btn-danger btn-sm" onclick="PCL._removeBowler(${i})">✕</button>
              </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="PCL._addBowler()">+ Add Bowler</button>
        </div>
      </div>`;
  }

  // Ball entry
  PCL._addBall = function(ball) {
    let lm = PCL.DB.getLiveMatch();
    if (!lm || lm.status !== 'live') return;

    const isWide = ball === 'Wd';
    const isNoBall = ball === 'Nb';
    const isWicket = ball === 'W';
    const runs = isWide || isNoBall ? 1 : (isWicket ? 0 : (ball === '4s' ? 4 : parseInt(ball) || 0));

    const field = lm.innings === 1 ? 'score1' : 'score2';
    const wkField = lm.innings === 1 ? 'wkts1' : 'wkts2';
    const ballField = lm.innings === 1 ? 'balls1' : 'balls2';

    lm[field] = (lm[field]||0) + runs;
    if (isWicket) lm[wkField] = Math.min((lm[wkField]||0) + 1, 10);
    if (!isWide && !isNoBall) lm[ballField] = (lm[ballField]||0) + 1;

    // Add to current over
    if (!isWide && !isNoBall) {
      lm.currentOver = [...(lm.currentOver||[]), ball];
      // End of over
      if (lm.currentOver.length >= 6) {
        lm.currentOver = [];
        // Rotate strike at the end of the over
        if (lm.batsmen && lm.batsmen.length >= 2) {
          lm.batsmen.forEach(b => b.onStrike = !b.onStrike);
        }
      }
    }

    // Update on-strike batsman
    if (!isWide && !isNoBall) {
      const bIdx = (lm.batsmen||[]).findIndex(b => b.onStrike);
      if (bIdx >= 0) {
        lm.batsmen[bIdx].runs  = (lm.batsmen[bIdx].runs||0) + runs;
        lm.batsmen[bIdx].balls = (lm.batsmen[bIdx].balls||0) + 1;
        if (runs === 4 || ball === '4s') lm.batsmen[bIdx].fours = (lm.batsmen[bIdx].fours||0) + 1;
        if (runs === 6) lm.batsmen[bIdx].sixes = (lm.batsmen[bIdx].sixes||0) + 1;
      }
      // Strike rotation on odd runs (1 or 3)
      if ((runs === 1 || runs === 3) && lm.batsmen && lm.batsmen.length >= 2) {
        lm.batsmen.forEach(b => b.onStrike = !b.onStrike);
      }
    }

    // Update current bowler
    const bwlIdx = (lm.bowlers||[]).findIndex(b => b.isBowling);
    if (bwlIdx >= 0) {
      lm.bowlers[bwlIdx].runs  = (lm.bowlers[bwlIdx].runs||0) + runs;
      if (!isWide && !isNoBall) lm.bowlers[bwlIdx].balls = (lm.bowlers[bwlIdx].balls||0) + 1;
      if (isWicket) lm.bowlers[bwlIdx].wickets = (lm.bowlers[bwlIdx].wickets||0) + 1;
    }

    // Commentary
    const commInput = document.getElementById('commentary-input');
    const commText = commInput?.value?.trim() || autoCommentary(ball, lm[field], lm.balls1||lm.balls2);
    if (commInput) commInput.value = '';
    const overBall = `${Math.floor((lm[ballField])/6)}.${(lm[ballField])%6}`;
    lm.commentary = [...(lm.commentary||[]), { ball: overBall, text: commText, timestamp: Date.now() }];

    // Check innings end
    if (lm.innings === 1 && (lm.wkts1 >= 10 || lm.balls1 >= 120)) {
      lm.innings = 2;
      lm.target  = lm.score1 + 1;
      lm.currentOver = [];
      PCL.Utils.toast('🔄 Innings complete! Target: ' + lm.target, 'info', 5000);
    }
    // Check match end
    if (lm.innings === 2 && ((lm.score2||0) >= (lm.target||999) || lm.wkts2 >= 10 || lm.balls2 >= 120)) {
      PCL._endMatch();
      return;
    }

    PCL.DB.setLiveMatch(lm);
    renderDashboard();
    PCL._adminNav('live-match');
    PCL.Utils.toast(`Ball entered: ${ball}`, 'success', 1500);
  };

  function autoCommentary(ball, score, balls) {
    const over = Math.floor(balls/6);
    const b = balls%6;
    const ovStr = `${over}.${b}`;
    if (ball === 'W') return `${ovStr} — WICKET! A big blow for the batting side!`;
    if (ball === '6') return `${ovStr} — SIX! Massive hit over the boundary!`;
    if (ball === '4' || ball === '4s') return `${ovStr} — FOUR! Cracking shot to the boundary!`;
    if (ball === 'Wd') return `${ovStr} — Wide ball, 1 extra.`;
    if (ball === 'Nb') return `${ovStr} — No ball, free hit coming!`;
    if (ball === '0') return `${ovStr} — Dot ball, good delivery.`;
    return `${ovStr} — ${ball} run${ball!=='1'?'s':''} taken.`;
  }

  PCL._endInnings = function() {
    let lm = PCL.DB.getLiveMatch();
    if (!lm) return;
    lm.innings = 2;
    lm.target = (lm.score1||0) + 1;
    lm.currentOver = [];
    PCL.DB.setLiveMatch(lm);
    PCL.Utils.toast(`Innings 1 closed! Target: ${lm.target}`, 'info', 4000);
    renderDashboard();
    PCL._adminNav('live-match');
  };

  PCL._endMatch = function() {
    let lm = PCL.DB.getLiveMatch();
    if (!lm) return;
    lm.status = 'completed';
    const innings1Win = lm.innings === 2 && (lm.score2||0) < (lm.target||999) && lm.wkts2 >= 10;
    const innings2Win = lm.innings === 2 && (lm.score2||0) >= (lm.target||999);
    const winner = innings2Win ? lm.team2Id : lm.team1Id;
    const winnerTeam = PCL.DB.getTeam(winner)||{};

    // Update match in DB
    const matches = PCL.DB.get('matches') || [];
    const matchIdx = matches.findIndex(m => m.id === lm.matchId);
    if (matchIdx >= 0) {
      const t1 = PCL.DB.getTeam(lm.team1Id)||{};
      const t2 = PCL.DB.getTeam(lm.team2Id)||{};
      const margin = innings2Win
        ? `${10 - (lm.wkts2||0)} wickets`
        : `${(lm.score1||0) - (lm.score2||0)} runs`;
      matches[matchIdx].status = 'completed';
      matches[matchIdx].winner = winner;
      matches[matchIdx].score1 = `${lm.score1||0}/${lm.wkts1||0} (${PCL.Utils.formatOvers(lm.balls1||0)})`;
      matches[matchIdx].score2 = `${lm.score2||0}/${lm.wkts2||0} (${PCL.Utils.formatOvers(lm.balls2||0)})`;
      matches[matchIdx].result = `${winnerTeam.name||winner} won by ${margin}`;
      PCL.DB.set('matches', matches);

      // Update points table
      updatePointsTable(lm.team1Id, lm.team2Id, winner);
    }

    PCL.DB.setLiveMatch(null);
    PCL.Utils.toast(`🏁 Match ended! ${winnerTeam.name||winner} wins!`, 'success', 5000);
    renderDashboard();
    PCL._adminNav('overview');
  };

  function updatePointsTable(team1Id, team2Id, winnerId) {
    const pt = PCL.DB.get('pointsTable') || [];
    const update = (teamId, won) => {
      const idx = pt.findIndex(r => r.teamId === teamId);
      if (idx >= 0) {
        pt[idx].p += 1;
        if (won) { pt[idx].w += 1; pt[idx].pts += 2; pt[idx].nrr = Math.round((pt[idx].nrr + 0.15)*1000)/1000; }
        else      { pt[idx].l += 1; pt[idx].nrr = Math.round((pt[idx].nrr - 0.15)*1000)/1000; }
      }
    };
    update(team1Id, winnerId === team1Id);
    update(team2Id, winnerId === team2Id);
    PCL.DB.updatePointsTable(pt);
  }

  // Batsmen management
  PCL._addBatsman = function() {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    lm.batsmen = [...(lm.batsmen||[]), { name:'', runs:0, balls:0, fours:0, sixes:0, onStrike:false }];
    PCL.DB.setLiveMatch(lm);
    PCL._adminNav('live-match');
  };
  PCL._removeBatsman = function(i) {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    lm.batsmen = (lm.batsmen||[]).filter((_,idx)=>idx!==i);
    PCL.DB.setLiveMatch(lm); PCL._adminNav('live-match');
  };
  PCL._updateBatsman = function(i,field,val) {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    if (lm.batsmen && lm.batsmen[i]) { lm.batsmen[i][field] = val; PCL.DB.setLiveMatch(lm); }
  };
  PCL._setOnStrike = function(i,val) {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    (lm.batsmen||[]).forEach((b,idx) => b.onStrike = idx===i?val:false);
    PCL.DB.setLiveMatch(lm); PCL._adminNav('live-match');
  };

  // Bowlers management
  PCL._addBowler = function() {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    lm.bowlers = [...(lm.bowlers||[]), { name:'', balls:0, runs:0, wickets:0, maidens:0, isBowling:false }];
    PCL.DB.setLiveMatch(lm); PCL._adminNav('live-match');
  };
  PCL._removeBowler = function(i) {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    lm.bowlers = (lm.bowlers||[]).filter((_,idx)=>idx!==i);
    PCL.DB.setLiveMatch(lm); PCL._adminNav('live-match');
  };
  PCL._updateBowler = function(i,field,val) {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    if (lm.bowlers && lm.bowlers[i]) { lm.bowlers[i][field] = val; PCL.DB.setLiveMatch(lm); }
  };
  PCL._setCurrentBowler = function(i,val) {
    let lm = PCL.DB.getLiveMatch(); if (!lm) return;
    (lm.bowlers||[]).forEach((b,idx) => b.isBowling = idx===i?val:false);
    PCL.DB.setLiveMatch(lm); PCL._adminNav('live-match');
  };

  PCL._startLiveMatch = function() {
    const matchId = document.getElementById('live-match-select')?.value;
    const battingTeam = document.getElementById('live-batting-team')?.value;
    const venue = document.getElementById('live-venue')?.value;
    if (!matchId || !battingTeam) { PCL.Utils.toast('Please select a match and batting team', 'error'); return; }

    const match = (PCL.DB.get('matches')||[]).find(m => m.id === matchId);
    if (!match) { PCL.Utils.toast('Match not found', 'error'); return; }

    const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;

    const lm = {
      matchId, matchNum: match.num, status: 'live',
      team1Id: battingTeam, team2Id: bowlingTeam,
      venue: venue || match.venue,
      innings: 1,
      score1: 0, wkts1: 0, balls1: 0,
      score2: 0, wkts2: 0, balls2: 0,
      target: null,
      currentOver: [],
      batsmen: [
        { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: true },
        { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: false },
      ],
      bowlers: [
        { name: '', balls: 0, runs: 0, wickets: 0, maidens: 0, isBowling: true },
      ],
      commentary: [],
    };

    // Update match status to live
    const matches = PCL.DB.get('matches') || [];
    const idx = matches.findIndex(m => m.id === matchId);
    if (idx >= 0) { matches[idx].status = 'live'; PCL.DB.set('matches', matches); }

    PCL.DB.setLiveMatch(lm);
    PCL.Utils.toast('🔴 Live match started!', 'success');
    PCL._adminNav('live-match');
  };

  // ================================================
  // MATCH MANAGER
  // ================================================
  function renderMatchManager() {
    const matches = PCL.DB.get('matches') || [];
    return `
      <div class="admin-section active anim-fade">
        <h2 class="admin-page-title">Match Manager</h2>
        <p class="admin-page-sub">Update match results, statuses, and scorelines. Changes reflect instantly across all viewers.</p>
        ${matches.map(m => {
          const t1 = PCL.DB.getTeam(m.team1)||{}; const t2 = PCL.DB.getTeam(m.team2)||{};
          return `
            <div class="admin-card" style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px">
                <div>
                  <div style="font-size:12px;color:var(--text-3)">Match #${m.num} · ${m.date}</div>
                  <div style="font-size:15px;font-weight:700">${t1.emoji||'🏏'} ${t1.shortName||m.team1} vs ${t2.shortName||m.team2} ${t2.emoji||'🏏'}</div>
                </div>
                ${PCL.Utils.statusBadge(m.status)}
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Score 1 (${t1.shortName||'T1'})</label>
                  <input type="text" class="form-input" value="${m.score1||''}" placeholder="e.g. 182/6 (20)"
                    onchange="PCL._updateMatchField('${m.id}','score1',this.value)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Score 2 (${t2.shortName||'T2'})</label>
                  <input type="text" class="form-input" value="${m.score2||''}" placeholder="e.g. 137/9 (20)"
                    onchange="PCL._updateMatchField('${m.id}','score2',this.value)" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Result</label>
                <input type="text" class="form-input" value="${m.result||''}" placeholder="e.g. Team A won by 45 runs"
                  onchange="PCL._updateMatchField('${m.id}','result',this.value)" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-select" onchange="PCL._updateMatchField('${m.id}','status',this.value)">
                    <option value="upcoming" ${m.status==='upcoming'?'selected':''}>Upcoming</option>
                    <option value="completed" ${m.status==='completed'?'selected':''}>Completed</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Winner</label>
                  <select class="form-select" onchange="PCL._updateMatchField('${m.id}','winner',this.value)">
                    <option value="">-- No winner yet --</option>
                    <option value="${m.team1}" ${m.winner===m.team1?'selected':''}>${t1.name||m.team1}</option>
                    <option value="${m.team2}" ${m.winner===m.team2?'selected':''}>${t2.name||m.team2}</option>
                  </select>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  PCL._updateMatchField = function(id, field, value) {
    PCL.DB.updateMatch(id, { [field]: value });
    PCL.Utils.toast(`Match updated: ${field}`, 'success', 1500);
  };

  // ================================================
  // TEAMS MANAGER
  // ================================================
  function renderTeamsManager() {
    const teams = PCL.DB.get('teams') || [];
    let selectedTeam = teams[0]?.id;
    const team = teams.find(t => t.id === selectedTeam) || teams[0];
    return `
      <div class="admin-section active anim-fade">
        <h2 class="admin-page-title">Teams & Players</h2>
        <p class="admin-page-sub">View and edit team information and player data.</p>
        <div class="form-group" style="max-width:300px">
          <label class="form-label">Select Team</label>
          <select class="form-select" onchange="PCL._selectAdminTeam(this.value)">
            ${teams.map(t=>`<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="team-editor">
          ${team ? renderTeamEditor(team) : ''}
        </div>
      </div>`;
  }

  PCL._selectAdminTeam = function(id) {
    const teams = PCL.DB.get('teams')||[];
    const team = teams.find(t=>t.id===id);
    if (!team) return;
    const area = document.querySelector('.admin-section.active');
    if (area) {
      const existing = area.querySelector('.team-editor');
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.className = 'team-editor';
      div.innerHTML = renderTeamEditor(team);
      area.appendChild(div);
    }
  };

  function renderTeamEditor(team) {
    return `
      <div class="admin-card">
        <div class="admin-card-title">${team.emoji} ${team.name} — ${team.players.length} players</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Captain</label>
            <input class="form-input" value="${team.captain}" onchange="PCL._updateTeamField('${team.id}','captain',this.value)"/></div>
          <div class="form-group"><label class="form-label">Coach</label>
            <input class="form-input" value="${team.coach}" onchange="PCL._updateTeamField('${team.id}','coach',this.value)"/></div>
        </div>
        <div class="form-group"><label class="form-label">Home Ground</label>
          <input class="form-input" value="${team.homeGround}" onchange="PCL._updateTeamField('${team.id}','homeGround',this.value)"/></div>
        <div class="divider"></div>
        <div class="admin-card-title">Players</div>
        ${team.players.map((p,i) => `
          <div class="admin-player-row">
            <div class="admin-player-info">
              <div class="admin-player-avatar">${p.avatar}</div>
              <div>
                <input class="form-input" style="font-size:13px;padding:4px 8px;margin-bottom:2px" value="${p.name}"
                  onchange="PCL._updatePlayer('${team.id}',${i},'name',this.value)"/>
                <div class="admin-player-role">${p.role} ${p.isCaptain?'· Captain':''} ${p.isWK?'· WK':''}</div>
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:11px;color:var(--text-3)">R:${p.stats.r} W:${p.stats.w}</span>
            </div>
          </div>`).join('')}
      </div>`;
  }

  PCL._updateTeamField = function(id, field, value) {
    PCL.DB.updateTeam(id, { [field]: value });
    PCL.Utils.toast('Team updated!', 'success', 1500);
  };

  PCL._updatePlayer = function(teamId, playerIdx, field, value) {
    const teams = PCL.DB.get('teams')||[];
    const tIdx = teams.findIndex(t=>t.id===teamId);
    if (tIdx<0) return;
    teams[tIdx].players[playerIdx][field] = value;
    PCL.DB.set('teams', teams);
    PCL.Utils.toast('Player updated!', 'success', 1500);
  };

  // ================================================
  // POINTS TABLE EDITOR
  // ================================================
  function renderPointsEditor() {
    const pt = PCL.DB.get('pointsTable') || [];
    const sorted = [...pt].sort((a,b)=>b.pts-a.pts||b.nrr-a.nrr);
    return `
      <div class="admin-section active anim-fade">
        <h2 class="admin-page-title">Points Table Editor</h2>
        <p class="admin-page-sub">Manually adjust standings. Updates push to all viewers in real-time.</p>
        <div class="admin-card" style="padding:0;overflow-x:auto">
          <table class="stats-table">
            <thead><tr>
              <th style="text-align:left">Team</th>
              <th>P</th><th>W</th><th>L</th><th>NR</th><th>PTS</th><th>NRR</th>
            </tr></thead>
            <tbody>
              ${sorted.map((row,i) => {
                const team = PCL.DB.getTeam(row.teamId)||{};
                return `
                  <tr>
                    <td style="text-align:left"><strong>${team.emoji||'🏏'} ${team.shortName||row.teamId}</strong></td>
                    ${['p','w','l','nr','pts'].map(f=>`
                      <td><input type="number" class="form-input" style="width:60px;padding:4px 6px;text-align:center"
                        value="${row[f]||0}" onchange="PCL._updatePtField('${row.teamId}','${f}',parseInt(this.value)||0)" /></td>`).join('')}
                    <td><input type="number" class="form-input" style="width:72px;padding:4px 6px;text-align:center"
                      value="${row.nrr||0}" step="0.001" onchange="PCL._updatePtField('${row.teamId}','nrr',parseFloat(this.value)||0)" /></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <button class="btn btn-gold" style="margin-top:16px" onclick="PCL._savePointsTable()">💾 Save Points Table</button>
      </div>`;
  }

  PCL._updatePtField = function(teamId, field, value) {
    const pt = PCL.DB.get('pointsTable')||[];
    const idx = pt.findIndex(r=>r.teamId===teamId);
    if (idx>=0) { pt[idx][field] = value; localStorage.setItem('pcl_pointsTable_draft', JSON.stringify(pt)); }
  };

  PCL._savePointsTable = function() {
    const draft = localStorage.getItem('pcl_pointsTable_draft');
    if (draft) { PCL.DB.set('pointsTable', JSON.parse(draft)); localStorage.removeItem('pcl_pointsTable_draft'); }
    PCL.Utils.toast('✅ Points table saved & pushed to all viewers!', 'success');
  };

  // ================================================
  // RESET DATA
  // ================================================
  function renderReset() {
    return `
      <div class="admin-section active anim-fade">
        <h2 class="admin-page-title">Reset Data</h2>
        <p class="admin-page-sub">Reset all data back to the default sample state. This cannot be undone.</p>
        <div class="admin-card" style="border-color:rgba(239,68,68,0.3)">
          <div class="admin-card-title" style="color:#f87171">⚠️ Danger Zone</div>
          <p style="color:var(--text-2);font-size:14px;margin-bottom:20px">
            This will reset all matches, points table, live match, and team data to the default sample data.
            All your changes will be lost.
          </p>
          <button class="btn btn-danger" onclick="PCL._confirmReset()">🔄 Reset All Data</button>
        </div>
      </div>`;
  }

  PCL._confirmReset = function() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      PCL.DB.reset();
      PCL.Utils.toast('✅ Data reset to defaults', 'success');
      PCL._adminNav('overview');
    }
  };
};
