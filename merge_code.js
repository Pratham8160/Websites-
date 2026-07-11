const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const clientFile = path.join(targetDir, 'index_client.html');
const outputFile = path.join(targetDir, 'index.html');

try {
  let content = fs.readFileSync(clientFile, 'utf8');

  // Replace inline React and ReactDOM libraries with lightweight, fast CDN links
  const reactStartMarker = '<script>\n/**\n * @license React';
  const reactEndMarker = '})();\n\n</script>';
  const startIdx = content.indexOf(reactStartMarker);
  const endIdx = content.lastIndexOf(reactEndMarker);
  if (startIdx !== -1 && endIdx !== -1) {
    const beforeReact = content.substring(0, startIdx);
    const afterReact = content.substring(endIdx + reactEndMarker.length);
    const cdnScripts = `
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
`;
    content = beforeReact + cdnScripts + afterReact;
    console.log("Optimized: Replaced inline React & ReactDOM with CDN links!");
  }

  // 1. Inject Firebase compat CDN scripts inside <head>
  const headInject = `
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
`;
  content = content.replace('</head>', headInject + '\n</head>');

  // 2. Inject CSS for ticker animations inside the head style tag
  const cssInject = `
@keyframes scroll-ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-container {
  overflow: hidden;
  white-space: nowrap;
  background: #12285E;
  border-bottom: 2px solid #F05A22;
  color: #fff;
  padding: 12px 0;
  display: flex;
  width: 100%;
}
.ticker-track {
  display: inline-flex;
  animation: scroll-ticker 30s linear infinite;
  will-change: transform;
}
.ticker-item {
  padding: 0 40px;
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@keyframes scroll-teams {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.team-carousel-container {
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  position: relative;
  padding: 10px 0;
  display: flex;
}
.team-carousel-track {
  display: inline-flex;
  gap: 12px;
  animation: scroll-teams 30s linear infinite;
  will-change: transform;
}
.team-carousel-track:hover {
  animation-play-state: paused;
}
`;
  content = content.replace('body { margin: 0; }', `body { margin: 0; }\n${cssInject}`);

  // 3. Inject Firebase initialization code right after react destructuring hooks
  const fbInit = `
let db = null;
let isFirestoreEnabled = false;

if (window.PCL && window.PCL.FirebaseConfig && window.PCL.FirebaseConfig.apiKey && window.PCL.FirebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    firebase.initializeApp(window.PCL.FirebaseConfig);
    db = firebase.firestore();
    isFirestoreEnabled = true;
    console.log("Real-time Firestore enabled!");
  } catch (e) {
    console.error("Firestore init failed. LocalStorage fallback.", e);
  }
}

function formatOvers(balls) {
  const over = Math.floor(balls / 6);
  const b = balls % 6;
  return \`\${over}.\${b}\`;
}

function computeCRR(runs, balls) {
  if (!balls) return "0.00";
  return ((runs / balls) * 6).toFixed(2);
}
`;
  content = content.replace('} = React;', `} = React;\n${fbInit}`);

  // Split into lines to perform precise component replacements
  let lines = content.split('\n');

  // Find line indices dynamically
  const standingsStartIdx = lines.findIndex(l => l.includes('function computeStandings('));
  const formChipStartIdx = lines.findIndex(l => l.includes('function FormChip({'));
  const navStartIdx = lines.findIndex(l => l.includes('function Nav({'));
  const heroStartIdx = lines.findIndex(l => l.includes('function Hero({'));
  const siteStartIdx = lines.findIndex(l => l.includes('function CricketSite() {'));
  const previewStartIdx = lines.findIndex(l => l.includes('function PointsTablePreview({'));

  if (standingsStartIdx === -1 || formChipStartIdx === -1 || navStartIdx === -1 || heroStartIdx === -1 || siteStartIdx === -1 || previewStartIdx === -1) {
    throw new Error('Could not find component boundary lines in index_client.html');
  }

  console.log(`Boundaries found: Standings (${standingsStartIdx} to ${formChipStartIdx}), Nav (${navStartIdx} to ${heroStartIdx}), CricketSite (${siteStartIdx} to ${previewStartIdx})`);

  // Define new computeStandings function with dynamic hasOverride check
  const updatedComputeStandingsCode = `
function computeStandings(teams, matches) {
  const rows = {};
  teams.forEach(t => {
    rows[t.id] = {
      id: t.id,
      name: t.name,
      code: t.code || autoCode(t.name),
      logo: t.logo || "",
      nrr: t.nrr || "0.00",
      played: t.played !== undefined ? t.played : 0,
      won: t.won !== undefined ? t.won : 0,
      lost: t.lost !== undefined ? t.lost : 0,
      tn: t.tn !== undefined ? t.tn : 0,
      points: t.points !== undefined ? t.points : 0,
      form: [],
      hasOverride: t.hasOverride || false
    };
  });

  const sorted = [...matches].filter(m => m.status === "completed").sort((a, b) => new Date(\`\${a.date}T\${a.time || "00:00"}\`) - new Date(\`\${b.date}T\${b.time || "00:00"}\`));
  sorted.forEach(m => {
    const a = rows[m.team1Id];
    const b = rows[m.team2Id];
    if (!a || !b) return;

    if (!a.hasOverride) {
      a.played++;
      if (m.result === "team1") {
        a.won++;
        a.points += 2;
        a.form.push("W");
      } else if (m.result === "team2") {
        a.lost++;
        a.form.push("L");
      } else {
        a.tn++;
        a.points += 1;
        a.form.push("T");
      }
    } else {
      if (m.result === "team1") a.form.push("W");
      else if (m.result === "team2") a.form.push("L");
      else a.form.push("T");
    }

    if (!b.hasOverride) {
      b.played++;
      if (m.result === "team2") {
        b.won++;
        b.points += 2;
        b.form.push("W");
      } else if (m.result === "team1") {
        b.lost++;
        b.form.push("L");
      } else {
        b.tn++;
        b.points += 1;
        b.form.push("T");
      }
    } else {
      if (m.result === "team2") b.form.push("W");
      else if (m.result === "team1") b.form.push("L");
      else b.form.push("T");
    }
  });

  Object.values(rows).forEach(r => {
    r.form = r.form.slice(-5);
  });

  return Object.values(rows).sort((x, y) => y.points - x.points || parseFloat(y.nrr) - parseFloat(x.nrr));
}
`;

  // Define new Nav component
  const updatedNavCode = `
function Nav({
  section,
  setSection,
  isOwner,
  onLockClick,
  hasLiveMatch,
  seasons,
  selectedSeasonId,
  onSeasonChange,
  logoSrc
}) {
  const items = [
    ["home", "Home"],
    ...(hasLiveMatch ? [["live", "🔴 Live Match"]] : []),
    ["sponsors", "Sponsors"],
    ["fixtures", "Fixtures"],
    ["points", "Points Table"],
    ["teams", "Teams"],
    ["reports", "Reports"]
  ];
  if (isOwner) {
    items.push(["admin", "⚙️ Admin"]);
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "sticky top-0 z-40 bg-white border-b border-navy-dark-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSection("home"),
    className: "flex items-center gap-2 shrink-0"
  }, /*#__PURE__*/React.createElement("img", {
    src: logoSrc || LOGO_SRC,
    alt: "Patidar Cricket League",
    className: "h-11 w-auto object-contain"
  })), 
  
  /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, 
    /*#__PURE__*/React.createElement("select", {
      className: "bg-blush border border-navy-dark-15 rounded-md px-2 py-1 text-xs text-navy-dark font-mono outline-none focus:border-orange cursor-pointer",
      value: selectedSeasonId,
      onChange: e => onSeasonChange(e.target.value)
    }, 
      seasons.map(s => /*#__PURE__*/React.createElement("option", { key: s.id, value: s.id }, s.name))
    )
  ),

  /*#__PURE__*/React.createElement("div", {
    className: "hidden md:flex items-center gap-1"
  }, items.map(([key, label]) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => setSection(key),
    className: \`font-body text-sm font-medium px-3 py-2 rounded-md transition-colors \${section === key ? "text-navy bg-blush" : "text-navy-dark-60 hover:text-navy"}\`
  }, label))), /*#__PURE__*/React.createElement("button", {
    onClick: onLockClick,
    className: \`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono border shrink-0 \${isOwner ? "border-orange text-orange bg-orange-10" : "border-navy-dark-20 text-navy-dark-60"}\`
  }, isOwner ? /*#__PURE__*/React.createElement(Unlock, {
    size: 13
  }) : /*#__PURE__*/React.createElement(Lock, {
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, isOwner ? "Editing" : "Owner"))), /*#__PURE__*/React.createElement("div", {
    className: "md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto"
  }, items.map(([key, label]) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => setSection(key),
    className: \`font-body text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap \${section === key ? "text-navy bg-blush" : "text-navy-dark-50"}\`
  }, label))));
}
`;

  // Define secondary modules (TickerBar, LiveMatchPage, TeamDetailPage, AdminScorerPage)
  const helperComponentsCode = `
function TickerBar({ sponsors }) {
  if (!sponsors || sponsors.length === 0) return null;
  const trackItems = [...sponsors, ...sponsors, ...sponsors, ...sponsors];
  return /*#__PURE__*/React.createElement("div", {
    className: "ticker-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ticker-track"
  }, trackItems.map((sp, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: "ticker-item"
  }, sp.logo && /*#__PURE__*/React.createElement("img", {
    src: sp.logo,
    alt: sp.name,
    className: "h-10 w-auto inline-block mr-3 object-contain rounded align-middle"
  }), /*#__PURE__*/React.createElement("span", {
    className: "align-middle"
  }, sp.name)))));
}

function LiveMatchPage({ matches, teams }) {
  const liveMatch = matches.find(m => m.status === "live");
  if (!liveMatch) {
    return /*#__PURE__*/React.createElement(EmptyState, {
      text: "No match is currently live."
    });
  }
  const t1 = teams.find(t => t.id === liveMatch.team1Id);
  const t2 = teams.find(t => t.id === liveMatch.team2Id);
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-xl mx-auto px-5 py-12 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-navy-dark rounded-2xl p-8 text-white shadow-xl border border-white-10 relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-orange/20 text-orange font-mono text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-6 inline-flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", { className: "live-dot" }), "🔴 Live Now"), /*#__PURE__*/React.createElement("h2", {
    className: "font-display text-3xl uppercase tracking-wide mb-6"
  }, (t1?.name || "TBD") + " vs " + (t2?.name || "TBD")), liveMatch.liveLink ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "text-white-60 text-sm font-body mb-6"
  }, "This match is being streamed live. Click the button below to watch the stream!"), /*#__PURE__*/React.createElement("a", {
    href: liveMatch.liveLink,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "w-full bg-orange hover:bg-opacity-90 text-white font-mono text-sm uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
  }, "📺 Watch Live Stream")) : /*#__PURE__*/React.createElement("p", {
    className: "text-white-40 text-sm font-mono mt-4"
  }, "Streaming link will be available soon.")));
}

function TeamDetailPage({ teamId, teams, onBack }) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;
  const players = team.players || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement("button", {
    className: "inline-flex items-center gap-1 text-sm font-mono text-orange mb-6 hover:underline",
    onClick: onBack
  }, "← Back to Teams"), /*#__PURE__*/React.createElement("div", {
    className: "bg-blush rounded-xl p-6 border border-navy-dark-05 mb-6 flex flex-col md:flex-row gap-6 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-24 h-24 rounded-xl bg-white border border-navy-dark-10 flex items-center justify-center overflow-hidden shrink-0"
  }, team.logo ? /*#__PURE__*/React.createElement("img", {
    src: team.logo,
    alt: team.name,
    className: "w-full h-full object-contain p-2"
  }) : /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark-30 text-[9px] font-mono text-center px-1"
  }, "No logo")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 text-center md:text-left"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display text-navy-dark text-3xl uppercase mb-2"
  }, team.name), team.desc && /*#__PURE__*/React.createElement("p", {
    className: "text-navy-dark-70 text-sm mb-4 font-body leading-relaxed"
  }, team.desc), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark-40 block"
  }, "Owner"), /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark font-semibold"
  }, team.owner || "TBD")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark-40 block"
  }, "Captain"), /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark font-semibold"
  }, team.captain || "TBD")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark-40 block"
  }, "Coach"), /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark font-semibold"
  }, team.coach || "TBD")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark-40 block"
  }, "Founded"), /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark font-semibold"
  }, team.founded || "TBD"))))), /*#__PURE__*/React.createElement("h3", {
    className: "font-display text-navy-dark text-xl uppercase mb-4"
  }, "Player Squad"), players.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "No players in squad yet."
  }) : /*#__PURE__*/React.createElement("div", {
    className: "bg-blush rounded-lg p-4 border border-navy-dark-05 overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full font-mono text-xs sm:text-sm min-w-[500px]"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-navy-dark-50 uppercase tracking-wider text-[10px] border-b border-navy-dark-15"
  }, /*#__PURE__*/React.createElement("th", {
    className: "text-left py-2 pr-2"
  }, "Player"), /*#__PURE__*/React.createElement("th", {
    className: "text-center py-2 px-1"
  }, "Role"), /*#__PURE__*/React.createElement("th", {
    className: "text-center py-2 px-1"
  }, "Batting"), /*#__PURE__*/React.createElement("th", {
    className: "text-center py-2 px-1"
  }, "Bowling"), /*#__PURE__*/React.createElement("th", {
    className: "text-center py-2 px-1"
  }, "Matches"), /*#__PURE__*/React.createElement("th", {
    className: "text-center py-2 px-1"
  }, "Runs"), /*#__PURE__*/React.createElement("th", {
    className: "text-center py-2 px-1"
  }, "Wickets"))), /*#__PURE__*/React.createElement("tbody", null, players.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.id,
    className: "border-b border-navy-dark-08 hover:bg-navy-dark-05"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2 text-navy-dark font-medium whitespace-nowrap"
  }, p.avatar && /*#__PURE__*/React.createElement("span", {
    className: "mr-1"
  }, p.avatar), p.name, p.isCaptain && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-orange text-white px-1.5 py-0.5 rounded ml-1"
  }, "C"), p.isWK && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-navy text-white px-1.5 py-0.5 rounded ml-1"
  }, "WK")), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-navy-dark-70 whitespace-nowrap"
  }, p.role), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-navy-dark-70 font-mono"
  }, p.bat), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-navy-dark-70 font-mono"
  }, p.bowl || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-navy-dark-70 font-bold"
  }, p.stats?.m || 0), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-navy-dark-70"
  }, p.stats?.r || 0), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-navy-dark-70"
  }, p.stats?.w || 0)))))));
}

function AdminScorerPage({ matches, teams, seasons, selectedSeasonId, sponsors, settings, isFirestoreEnabled, db, onPersist, onUpdateSettings, onAddSeason, onToggleActiveSeason, onAddSponsor, onDeleteSponsor }) {
  const liveMatch = matches.find(m => m.status === "live");
  const upcoming = matches.filter(m => m.status === "upcoming");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [battingTeamId, setBattingTeamId] = useState("");
  const [venue, setVenue] = useState("");
  const [bat1, setBat1] = useState("");
  const [bat2, setBat2] = useState("");
  const [bwl, setBwl] = useState("");
  const [commentaryInput, setCommentaryInput] = useState("");
  
  // Seasons creation inputs
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonYear, setNewSeasonYear] = useState("");
  
  // Sponsors creation inputs
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorLogo, setNewSponsorLogo] = useState("");
  const [newSponsorTier, setNewSponsorTier] = useState("Title Sponsor");
  const [newSponsorLink, setNewSponsorLink] = useState("");
  
  // Points Table Overrides
  const [overrideTeamId, setOverrideTeamId] = useState(teams[0]?.id || "");
  const [ovPlayed, setOvPlayed] = useState("0");
  const [ovWon, setOvWon] = useState("0");
  const [ovLost, setOvLost] = useState("0");
  const [ovPoints, setOvPoints] = useState("0");
  const [ovNrr, setOvNrr] = useState("0.00");
  const [ovOverride, setOvOverride] = useState(false);

  const [seasonLabel, setSeasonLabel] = useState(settings.seasonLabel || "");
  const [tournamentName, setTournamentName] = useState(settings.tournamentName || "");
  const [tagline, setTagline] = useState(settings.tagline || "");
  const [logoHeader, setLogoHeader] = useState(settings.logoHeader || "");
  const [logoFooter, setLogoFooter] = useState(settings.logoFooter || "");
  const [footerLogoHeight, setFooterLogoHeight] = useState(settings.footerLogoHeight || "96px");

  const [announcementText, setAnnouncementText] = useState(settings.announcementText || "Please submit your player registration details using our official form.");
  const [announcementLink, setAnnouncementLink] = useState(settings.announcementLink || "https://forms.gle/jNr7rdLXTC4FwYtYA");
  const [announcementTitle, setAnnouncementTitle] = useState(settings.announcementTitle || "Registration Form");
  const [showAnnouncementBox, setShowAnnouncementBox] = useState(settings.showAnnouncementBox !== false);

  useEffect(() => {
    if (settings) {
      setSeasonLabel(settings.seasonLabel || "");
      setTournamentName(settings.tournamentName || "");
      setTagline(settings.tagline || "");
      setLogoHeader(settings.logoHeader || "");
      setLogoFooter(settings.logoFooter || "");
      setFooterLogoHeight(settings.footerLogoHeight || "96px");
      setAnnouncementText(settings.announcementText || "Please submit your player registration details using our official form.");
      setAnnouncementLink(settings.announcementLink || "https://forms.gle/jNr7rdLXTC4FwYtYA");
      setAnnouncementTitle(settings.announcementTitle || "Registration Form");
      setShowAnnouncementBox(settings.showAnnouncementBox !== false);
    }
  }, [settings]);

  useEffect(() => {
    if (liveMatch) {
      setBat1(liveMatch.striker?.name || "");
      setBat2(liveMatch.nonStriker?.name || "");
      setBwl(liveMatch.bowler?.name || "");
    } else {
      setBat1("");
      setBat2("");
      setBwl("");
    }
  }, [liveMatch]);

  const [selectedManageTeamId, setSelectedManageTeamId] = useState("");
  const [teamOwner, setTeamOwner] = useState("");
  const [teamCaptain, setTeamCaptain] = useState("");
  const [teamCoach, setTeamCoach] = useState("");
  const [teamFounded, setTeamFounded] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState("Batter");
  const [playerBat, setPlayerBat] = useState("Right-hand bat");
  const [playerBowl, setPlayerBowl] = useState("N/A");
  const [playerIsCaptain, setPlayerIsCaptain] = useState(false);
  const [playerIsWK, setPlayerIsWK] = useState(false);
  const [playerMatches, setPlayerMatches] = useState("0");
  const [playerRuns, setPlayerRuns] = useState("0");
  const [playerWickets, setPlayerWickets] = useState("0");

  useEffect(() => {
    const t = teams.find(x => x.id === selectedManageTeamId);
    if (t) {
      setTeamOwner(t.owner || "");
      setTeamCaptain(t.captain || "");
      setTeamCoach(t.coach || "");
      setTeamFounded(t.founded || "");
      setTeamDesc(t.desc || "");
      clearPlayerForm();
    } else {
      setTeamOwner("");
      setTeamCaptain("");
      setTeamCoach("");
      setTeamFounded("");
      setTeamDesc("");
    }
  }, [selectedManageTeamId, teams]);

  function clearPlayerForm() {
    setEditingPlayerId(null);
    setPlayerName("");
    setPlayerRole("Batter");
    setPlayerBat("Right-hand bat");
    setPlayerBowl("N/A");
    setPlayerIsCaptain(false);
    setPlayerIsWK(false);
    setPlayerMatches("0");
    setPlayerRuns("0");
    setPlayerWickets("0");
  }

  function handleSaveTeamDetails() {
    if (!selectedManageTeamId) return;
    const updatedTeams = teams.map(t => {
      if (t.id === selectedManageTeamId) {
        return {
          ...t,
          owner: teamOwner,
          captain: teamCaptain,
          coach: teamCoach,
          founded: teamFounded,
          desc: teamDesc
        };
      }
      return t;
    });
    onPersist(updatedTeams, matches, settings);
    alert("Team details updated successfully!");
  }

  function handleStartEditPlayer(p) {
    setEditingPlayerId(p.id);
    setPlayerName(p.name || "");
    setPlayerRole(p.role || "Batter");
    setPlayerBat(p.bat || "Right-hand bat");
    setPlayerBowl(p.bowl || "N/A");
    setPlayerIsCaptain(p.isCaptain || false);
    setPlayerIsWK(p.isWK || false);
    setPlayerMatches(String(p.stats?.m || 0));
    setPlayerRuns(String(p.stats?.r || 0));
    setPlayerWickets(String(p.stats?.w || 0));
  }

  function handleDeletePlayer(playerId) {
    if (!confirm("Are you sure you want to delete this player?")) return;
    const updatedTeams = teams.map(t => {
      if (t.id === selectedManageTeamId) {
        return {
          ...t,
          players: (t.players || []).filter(p => p.id !== playerId)
        };
      }
      return t;
    });
    onPersist(updatedTeams, matches, settings);
  }

  function handleSavePlayer() {
    if (!playerName.trim()) {
      alert("Player name is required!");
      return;
    }
    const updatedTeams = teams.map(t => {
      if (t.id === selectedManageTeamId) {
        const currentPlayers = t.players || [];
        let newPlayers;
        if (editingPlayerId) {
          // Update existing player
          newPlayers = currentPlayers.map(p => {
            if (p.id === editingPlayerId) {
              return {
                ...p,
                name: playerName.trim(),
                role: playerRole,
                bat: playerBat,
                bowl: playerBowl,
                isCaptain: playerIsCaptain,
                isWK: playerIsWK,
                stats: {
                  m: parseInt(playerMatches) || 0,
                  r: parseInt(playerRuns) || 0,
                  w: parseInt(playerWickets) || 0
                }
              };
            }
            return p;
          });
        } else {
          // Add new player
          const newPlayer = {
            id: "p_" + Date.now(),
            name: playerName.trim(),
            role: playerRole,
            bat: playerBat,
            bowl: playerBowl,
            isCaptain: playerIsCaptain,
            isWK: playerIsWK,
            avatar: playerIsCaptain ? "👑" : (playerIsWK ? "🧤" : (playerRole === "Bowler" ? "🎯" : (playerRole === "All-rounder" ? "⭐" : "🏏"))),
            stats: {
              m: parseInt(playerMatches) || 0,
              r: parseInt(playerRuns) || 0,
              w: parseInt(playerWickets) || 0
            }
          };
          newPlayers = [...currentPlayers, newPlayer];
        }
        return {
          ...t,
          players: newPlayers
        };
      }
      return t;
    });

    onPersist(updatedTeams, matches, settings);
    clearPlayerForm();
    alert(editingPlayerId ? "Player updated successfully!" : "Player added successfully!");
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId);
  const selT1 = selectedMatch ? teams.find(t => t.id === selectedMatch.team1Id) : null;
  const selT2 = selectedMatch ? teams.find(t => t.id === selectedMatch.team2Id) : null;

  useEffect(() => {
    if (teams.length > 0 && !overrideTeamId) {
      setOverrideTeamId(teams[0].id);
    }
  }, [teams]);

  // Load team override settings when selector changes
  useEffect(() => {
    const t = teams.find(x => x.id === overrideTeamId);
    if (t) {
      setOvPlayed(t.played !== undefined ? String(t.played) : "0");
      setOvWon(t.won !== undefined ? String(t.won) : "0");
      setOvLost(t.lost !== undefined ? String(t.lost) : "0");
      setOvPoints(t.points !== undefined ? String(t.points) : "0");
      setOvNrr(t.nrr || "0.00");
      setOvOverride(t.hasOverride || false);
    }
  }, [overrideTeamId, teams]);

  async function handleStartLive() {
    if (!selectedMatchId || !battingTeamId) {
      alert("Please select a match and batting team.");
      return;
    }
    const match = matches.find(m => m.id === selectedMatchId);
    const mData = {
      status: "live",
      venue: venue || match.venue || "PCL Ground",
      battingTeamId: battingTeamId,
      innings: 1,
      ballsBowled: 0,
      currentRuns: 0,
      currentWickets: 0,
      recentBalls: [],
      commentary: [{ ball: "0.0", text: "Match has started.", timestamp: Date.now() }],
      striker: { name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: true },
      nonStriker: { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: false },
      bowler: { name: "Bowler", runs: 0, wickets: 0, balls: 0 }
    };

    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(selectedMatchId).update(mData);
    } else {
      const next = matches.map(m => m.id === selectedMatchId ? { ...m, ...mData } : m);
      onPersist(teams, next);
    }
  }

  async function handleSwapStrikerNonStriker() {
    if (!liveMatch) return;
    const temp = liveMatch.striker ? { ...liveMatch.striker } : { name: "Striker", runs: 0, balls: 0 };
    const nextStriker = liveMatch.nonStriker ? { ...liveMatch.nonStriker } : { name: "Non-Striker", runs: 0, balls: 0 };
    const nextNonStriker = temp;

    const updates = { striker: nextStriker, nonStriker: nextNonStriker };
    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(liveMatch.id).update(updates);
    } else {
      const nextMatches = matches.map(m => m.id === liveMatch.id ? { ...m, ...updates } : m);
      onPersist(teams, nextMatches);
    }
  }

  async function handleUpdateStriker(name) {
    if (!liveMatch) return;
    if (liveMatch.striker && liveMatch.striker.name === name) return;
    const nextStriker = { ...(liveMatch.striker || { runs: 0, balls: 0 }), name: name || "Striker" };
    const updates = { striker: nextStriker };
    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(liveMatch.id).update(updates);
    } else {
      const nextMatches = matches.map(m => m.id === liveMatch.id ? { ...m, ...updates } : m);
      onPersist(teams, nextMatches);
    }
  }

  async function handleUpdateNonStriker(name) {
    if (!liveMatch) return;
    if (liveMatch.nonStriker && liveMatch.nonStriker.name === name) return;
    const nextNonStriker = { ...(liveMatch.nonStriker || { runs: 0, balls: 0 }), name: name || "Non-Striker" };
    const updates = { nonStriker: nextNonStriker };
    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(liveMatch.id).update(updates);
    } else {
      const nextMatches = matches.map(m => m.id === liveMatch.id ? { ...m, ...updates } : m);
      onPersist(teams, nextMatches);
    }
  }

  async function handleUpdateBowler(name) {
    if (!liveMatch) return;
    if (liveMatch.bowler && liveMatch.bowler.name === name) return;
    const nextBowler = { ...(liveMatch.bowler || { runs: 0, wickets: 0, balls: 0 }), name: name || "Bowler" };
    const updates = { bowler: nextBowler };
    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(liveMatch.id).update(updates);
    } else {
      const nextMatches = matches.map(m => m.id === liveMatch.id ? { ...m, ...updates } : m);
      onPersist(teams, nextMatches);
    }
  }

  async function handleBall(ball) {
    if (!liveMatch) return;
    const isWide = ball === "Wd";
    const isNoBall = ball === "Nb";
    const isWicket = ball === "W";
    const runs = isWide || isNoBall ? 1 : (isWicket ? 0 : (ball === "4s" ? 4 : parseInt(ball) || 0));

    let nextRuns = (liveMatch.currentRuns || 0) + runs;
    let nextWickets = isWicket ? Math.min((liveMatch.currentWickets || 0) + 1, 10) : (liveMatch.currentWickets || 0);
    let nextBalls = (!isWide && !isNoBall) ? (liveMatch.ballsBowled || 0) + 1 : (liveMatch.ballsBowled || 0);

    let nextRecent = [...(liveMatch.recentBalls || [])];
    let nextStriker = liveMatch.striker ? { ...liveMatch.striker } : { name: "Striker", runs: 0, balls: 0 };
    let nextNonStriker = liveMatch.nonStriker ? { ...liveMatch.nonStriker } : { name: "Non-Striker", runs: 0, balls: 0 };
    let nextBowler = liveMatch.bowler ? { ...liveMatch.bowler } : { name: "Bowler", runs: 0, wickets: 0, balls: 0 };
    let nextInnings = liveMatch.innings || 1;
    let nextTarget = liveMatch.target || null;
    let nextStatus = liveMatch.status;
    let nextWinner = liveMatch.winner || "";
    let nextResult = liveMatch.result || "";

    if (!isWide && !isNoBall) {
      nextStriker.runs += runs;
      nextStriker.balls += 1;
      if (runs === 4 || ball === "4s") nextStriker.fours = (nextStriker.fours || 0) + 1;
      if (runs === 6) nextStriker.sixes = (nextStriker.sixes || 0) + 1;
      nextBowler.balls += 1;
    }
    nextBowler.runs += runs;
    if (isWicket) nextBowler.wickets += 1;

    if (!isWide && !isNoBall) {
      nextRecent.push(ball);
      if (runs === 1 || runs === 3) {
        const temp = nextStriker;
        nextStriker = nextNonStriker;
        nextNonStriker = temp;
      }
      if (nextRecent.length >= 6) {
        nextRecent = [];
        const temp = nextStriker;
        nextStriker = nextNonStriker;
        nextNonStriker = temp;
      }
    }

    const ovStr = formatOvers(nextBalls);
    let commText = commentaryInput.trim() || \`\${ovStr} overs: \${ball} runs added.\`;
    setCommentaryInput("");

    let nextCommentary = [...(liveMatch.commentary || []), { ball: ovStr, text: commText, timestamp: Date.now() }];

    if (nextInnings === 1 && (nextWickets >= 10 || nextBalls >= 120)) {
      nextInnings = 2;
      nextTarget = nextRuns + 1;
      nextRecent = [];
      nextCommentary.push({ ball: ovStr, text: "Innings complete! Target: " + nextTarget, timestamp: Date.now() });
    }

    if (nextInnings === 2 && (nextRuns >= nextTarget || nextWickets >= 10 || nextBalls >= 120)) {
      nextStatus = "completed";
      const isTeam2Win = nextRuns >= nextTarget;
      const winnerId = isTeam2Win ? liveMatch.team2Id : liveMatch.team1Id;
      const winnerTeam = teams.find(t => t.id === winnerId);
      const margin = isTeam2Win ? (10 - nextWickets) + " wickets" : (nextTarget - 1 - nextRuns) + " runs";
      nextWinner = winnerId;
      nextResult = (winnerTeam?.name || "TBD") + " won by " + margin;

      // Update Points Table
      const t1 = teams.find(t => t.id === liveMatch.team1Id);
      const t2 = teams.find(t => t.id === liveMatch.team2Id);
      if (t1 && t2) {
        const nrrVal1 = parseFloat(t1.nrr || "0.00") + (winnerId === t1.id ? 0.15 : -0.15);
        const nrrVal2 = parseFloat(t2.nrr || "0.00") + (winnerId === t2.id ? 0.15 : -0.15);
        
        if (isFirestoreEnabled && db) {
          await db.collection("teams").doc(t1.id).update({ nrr: nrrVal1.toFixed(2) });
          await db.collection("teams").doc(t2.id).update({ nrr: nrrVal2.toFixed(2) });
        } else {
          const nextTeams = teams.map(t => {
            if (t.id === t1.id) return { ...t, nrr: nrrVal1.toFixed(2) };
            if (t.id === t2.id) return { ...t, nrr: nrrVal2.toFixed(2) };
            return t;
          });
          onPersist(nextTeams, matches);
        }
      }
    }

    const updateData = {
      currentRuns: nextRuns,
      currentWickets: nextWickets,
      ballsBowled: nextBalls,
      recentBalls: nextRecent,
      striker: nextStriker,
      nonStriker: nextNonStriker,
      bowler: nextBowler,
      commentary: nextCommentary,
      innings: nextInnings,
      target: nextTarget,
      status: nextStatus,
      winner: nextWinner,
      result: nextResult
    };

    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(liveMatch.id).update(updateData);
    } else {
      const nextMatches = matches.map(m => m.id === liveMatch.id ? { ...m, ...updateData } : m);
      onPersist(teams, nextMatches);
    }
  }

  async function handleCloseMatch() {
    if (!liveMatch) return;
    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(liveMatch.id).update({ status: "completed" });
    } else {
      const nextMatches = matches.map(m => m.id === liveMatch.id ? { ...m, status: "completed" } : m);
      onPersist(teams, nextMatches);
    }
  }

  async function handleSponsorLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToLogoDataUrl(file);
      setNewSponsorLogo(url);
    } catch(err) {
      alert("Failed to read image logo.");
    }
  }

  async function handleAddSponsorSubmit() {
    if (!newSponsorName) return;
    onAddSponsor(newSponsorName, newSponsorLogo, newSponsorTier, newSponsorLink);
    setNewSponsorName("");
    setNewSponsorLogo("");
    setNewSponsorTier("Title Sponsor");
    setNewSponsorLink("");
  }

  async function handleAddSeasonSubmit() {
    if (!newSeasonName || !newSeasonYear) return;
    onAddSeason(newSeasonName, newSeasonYear);
    setNewSeasonName("");
    setNewSeasonYear("");
  }

  async function handlePointsOverrideSubmit() {
    const pVal = parseInt(ovPlayed) || 0;
    const wVal = parseInt(ovWon) || 0;
    const lVal = parseInt(ovLost) || 0;
    const ptsVal = parseInt(ovPoints) || 0;
    const nVal = ovNrr;

    const overrideData = {
      played: pVal,
      won: wVal,
      lost: lVal,
      points: ptsVal,
      nrr: nVal,
      hasOverride: ovOverride
    };

    if (isFirestoreEnabled && db) {
      await db.collection("teams").doc(overrideTeamId).update(overrideData);
    } else {
      const nextTeams = teams.map(t => t.id === overrideTeamId ? { ...t, ...overrideData } : t);
      onPersist(nextTeams, matches);
    }
    alert("Points Table updated successfully!");
  }

  async function handleSaveBranding(e) {
    if (e) e.preventDefault();
    await onUpdateSettings({
      seasonLabel,
      tournamentName,
      tagline,
      logoHeader,
      logoFooter,
      footerLogoHeight,
      announcementText,
      announcementLink,
      announcementTitle,
      showAnnouncementBox
    });
    alert("Branding settings updated successfully!");
  }

  async function handleHeaderLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToLogoDataUrl(file);
      setLogoHeader(url);
    } catch(err) {
      alert("Failed to read image logo.");
    }
  }

  async function handleFooterLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToLogoDataUrl(file);
      setLogoFooter(url);
    } catch(err) {
      alert("Failed to read image logo.");
    }
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 max-w-xl mx-auto px-5 py-8"
  }, 
    /*#__PURE__*/React.createElement(SectionHeading, {
      eyebrow: "Control Panel",
      title: "Branding & Settings"
    }),

    // Home Featured Match Selector
    /*#__PURE__*/React.createElement("div", {
      className: "bg-blush rounded-xl p-5 border border-navy-dark-05 space-y-4"
    }, 
      /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, "Home Featured Match"),
      /*#__PURE__*/React.createElement("select", {
        className: inputCls(),
        value: settings.featuredMatchId || "",
        onChange: e => onUpdateSettings({ featuredMatchId: e.target.value })
      }, 
        /*#__PURE__*/React.createElement("option", { value: "" }, "Auto Select (Live / Upcoming)"),
        matches.map(m => {
          const tm1 = teams.find(t => t.id === m.team1Id);
          const tm2 = teams.find(t => t.id === m.team2Id);
          return /*#__PURE__*/React.createElement("option", { key: m.id, value: m.id }, (tm1?.name || "TBD") + " vs " + (tm2?.name || "TBD") + " (" + m.date + ")");
        })
      )
    ),

    // Points Table Overrides
    /*#__PURE__*/React.createElement("div", {
      className: "bg-blush rounded-xl p-5 border border-navy-dark-05 space-y-4"
    }, 
      /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, "Points Table Manager"),
      /*#__PURE__*/React.createElement("select", {
        className: inputCls(),
        value: overrideTeamId,
        onChange: e => setOverrideTeamId(e.target.value)
      }, 
        teams.map(t => /*#__PURE__*/React.createElement("option", { key: t.id, value: t.id }, t.name))
      ),
      /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-3" }, 
        /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          id: "cb-override",
          checked: ovOverride,
          onChange: e => setOvOverride(e.target.checked)
        }),
        /*#__PURE__*/React.createElement("label", { htmlFor: "cb-override", className: "text-xs font-mono text-navy-dark-70 cursor-pointer" }, "Enable Manual Override for this team")
      ),
      /*#__PURE__*/React.createElement("div", { className: "grid grid-cols-5 gap-2 text-xs font-mono" }, 
        /*#__PURE__*/React.createElement("div", null, 
          /*#__PURE__*/React.createElement("span", { className: "text-navy-dark-40" }, "Played"),
          /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: ovPlayed, onChange: e => setOvPlayed(e.target.value) })
        ),
        /*#__PURE__*/React.createElement("div", null, 
          /*#__PURE__*/React.createElement("span", { className: "text-navy-dark-40" }, "Won"),
          /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: ovWon, onChange: e => setOvWon(e.target.value) })
        ),
        /*#__PURE__*/React.createElement("div", null, 
          /*#__PURE__*/React.createElement("span", { className: "text-navy-dark-40" }, "Lost"),
          /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: ovLost, onChange: e => setOvLost(e.target.value) })
        ),
        /*#__PURE__*/React.createElement("div", null, 
          /*#__PURE__*/React.createElement("span", { className: "text-navy-dark-40" }, "Points"),
          /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: ovPoints, onChange: e => setOvPoints(e.target.value) })
        ),
        /*#__PURE__*/React.createElement("div", null, 
          /*#__PURE__*/React.createElement("span", { className: "text-navy-dark-40" }, "NRR"),
          /*#__PURE__*/React.createElement("input", { type: "text", className: inputCls(), value: ovNrr, onChange: e => setOvNrr(e.target.value) })
        )
      ),
      /*#__PURE__*/React.createElement("button", {
        className: "btn bg-orange text-white text-xs py-2 px-4 rounded font-mono uppercase tracking-wide",
        onClick: handlePointsOverrideSubmit
      }, "Update Points Table")
    ),

    // Seasons Manager
    /*#__PURE__*/React.createElement("div", {
      className: "bg-blush rounded-xl p-5 border border-navy-dark-05 space-y-4"
    }, 
      /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, "Seasons Manager"),
      /*#__PURE__*/React.createElement("div", { className: "grid grid-cols-2 gap-3" }, 
        /*#__PURE__*/React.createElement("input", { className: inputCls(), placeholder: "e.g. Season 3", value: newSeasonName, onChange: e => setNewSeasonName(e.target.value) }),
        /*#__PURE__*/React.createElement("input", { className: inputCls(), placeholder: "e.g. 2027", value: newSeasonYear, onChange: e => setNewSeasonYear(e.target.value) })
      ),
      /*#__PURE__*/React.createElement("button", {
        className: "btn bg-orange text-white text-xs py-2 px-4 rounded font-mono uppercase tracking-wide",
        onClick: handleAddSeasonSubmit
      }, "Add Season"),
      /*#__PURE__*/React.createElement("div", { className: "space-y-2 mt-4" }, 
        seasons.map(s => /*#__PURE__*/React.createElement("div", { key: s.id, className: "flex justify-between items-center bg-white p-3 rounded-lg text-sm border border-navy-dark-08" }, 
          /*#__PURE__*/React.createElement("span", { className: "font-mono font-bold text-navy-dark" }, s.name + " (" + s.year + ")"),
          /*#__PURE__*/React.createElement("button", {
            className: "text-xs font-mono " + (s.isActive ? "text-green-600 font-bold" : "text-navy-dark-40"),
            onClick: () => onToggleActiveSeason(s.id)
          }, s.isActive ? "Active ✔" : "Make Active")
        ))
      )
    ),

    // Sponsors Manager
    /*#__PURE__*/React.createElement("div", {
      className: "bg-blush rounded-xl p-5 border border-navy-dark-05 space-y-4"
    }, 
      /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, "Sponsors Manager"),
      /*#__PURE__*/React.createElement("input", { className: inputCls(), placeholder: "Sponsor Name", value: newSponsorName, onChange: e => setNewSponsorName(e.target.value) }),
      /*#__PURE__*/React.createElement("select", { className: inputCls(), value: newSponsorTier, onChange: e => setNewSponsorTier(e.target.value) },
        ["Title Sponsor", "Platinum Sponsor", "Gold Sponsor", "Silver Sponsor", "Partner"].map(tier => /*#__PURE__*/React.createElement("option", { key: tier, value: tier }, tier))
      ),
      /*#__PURE__*/React.createElement("input", { className: inputCls(), placeholder: "Website URL (optional)", value: newSponsorLink, onChange: e => setNewSponsorLink(e.target.value) }),
      /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-3 font-mono text-xs text-navy-dark-50" }, 
        /*#__PURE__*/React.createElement("label", {
          className: "inline-flex items-center gap-1.5 text-xs font-mono uppercase bg-navy-dark-10 text-navy-dark px-3 py-2 rounded-md cursor-pointer"
        }, "Upload Sponsor Logo", /*#__PURE__*/React.createElement("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleSponsorLogoUpload })),
        newSponsorLogo && /*#__PURE__*/React.createElement("img", { src: newSponsorLogo, className: "h-8 w-auto object-contain p-1 border rounded bg-white" })
      ),
      /*#__PURE__*/React.createElement("button", {
        className: "btn bg-orange text-white text-xs py-2 px-4 rounded font-mono uppercase tracking-wide",
        onClick: handleAddSponsorSubmit
      }, "Add Sponsor"),
      /*#__PURE__*/React.createElement("div", { className: "space-y-2 mt-4" }, 
        sponsors.map(sp => /*#__PURE__*/React.createElement("div", { key: sp.id, className: "flex justify-between items-center bg-white p-3 rounded-lg text-sm border border-navy-dark-08" }, 
          /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2" }, 
            sp.logo && /*#__PURE__*/React.createElement("img", { src: sp.logo, className: "h-8 w-auto object-contain rounded border" }),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("span", { className: "font-semibold text-navy-dark block" }, sp.name),
              /*#__PURE__*/React.createElement("span", { className: "text-xs text-navy-dark-40 font-mono block" }, sp.tier)
            )
          ),
          /*#__PURE__*/React.createElement("button", {
            className: "text-xs font-mono text-red-600",
            onClick: () => onDeleteSponsor(sp.id)
          }, "Delete")
        ))
      ),

      // Branding & Logo Manager
      /*#__PURE__*/React.createElement("div", {
        className: "bg-blush rounded-xl p-5 border border-navy-dark-05 space-y-4"
      }, 
        /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, "Branding & Logo Manager"),
        /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
          /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Tournament Name"),
          /*#__PURE__*/React.createElement("input", {
            className: inputCls(),
            value: tournamentName,
            onChange: e => setTournamentName(e.target.value),
            placeholder: "e.g. Patidar Cricket League"
          })
        ),
        /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
          /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Season Label"),
          /*#__PURE__*/React.createElement("input", {
            className: inputCls(),
            value: seasonLabel,
            onChange: e => setSeasonLabel(e.target.value),
            placeholder: "e.g. Yuvamandal Secundrabad - Garud Production"
          })
        ),
        /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
          /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Tagline"),
          /*#__PURE__*/React.createElement("input", {
            className: inputCls(),
            value: tagline,
            onChange: e => setTagline(e.target.value),
            placeholder: "e.g. Bound By Roots. United By Cricket."
          })
        ),
        /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
          /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Footer Logo Height (e.g. 96px, 120px)"),
          /*#__PURE__*/React.createElement("input", {
            className: inputCls(),
            value: footerLogoHeight,
            onChange: e => setFooterLogoHeight(e.target.value),
            placeholder: "e.g. 96px, 120px"
          })
        ),
        /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
          /*#__PURE__*/React.createElement("label", { className: "flex items-center gap-2 text-xs font-mono uppercase text-navy-dark-50 cursor-pointer" }, 
            /*#__PURE__*/React.createElement("input", {
              type: "checkbox",
              checked: showAnnouncementBox,
              onChange: e => setShowAnnouncementBox(e.target.checked)
            }),
            "Enable Homepage Announcement Box"
          )
        ),
        showAnnouncementBox && /*#__PURE__*/React.createElement(React.Fragment, null, 
          /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
            /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Announcement Title"),
            /*#__PURE__*/React.createElement("input", {
              className: inputCls(),
              value: announcementTitle,
              onChange: e => setAnnouncementTitle(e.target.value),
              placeholder: "e.g. Registration Form"
            })
          ),
          /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
            /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Announcement Description"),
            /*#__PURE__*/React.createElement("textarea", {
              className: inputCls() + " h-20 resize-none",
              value: announcementText,
              onChange: e => setAnnouncementText(e.target.value),
              placeholder: "e.g. Please submit your player registration details using our official form."
            })
          ),
          /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
            /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Announcement Button Link"),
            /*#__PURE__*/React.createElement("input", {
              className: inputCls(),
              value: announcementLink,
              onChange: e => setAnnouncementLink(e.target.value),
              placeholder: "e.g. https://forms.gle/jNr7rdLXTC4FwYtYA"
            })
          )
        ),
        /*#__PURE__*/React.createElement("div", { className: "grid grid-cols-2 gap-4" }, 
          /*#__PURE__*/React.createElement("div", { className: "space-y-2" }, 
            /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50" }, "Header Logo"),
            /*#__PURE__*/React.createElement("div", { className: "flex flex-col items-center gap-2 p-3 border border-dashed border-navy-dark-20 rounded-lg bg-white" }, 
              logoHeader ? /*#__PURE__*/React.createElement("img", { src: logoHeader, className: "h-12 w-auto object-contain" }) : /*#__PURE__*/React.createElement("span", { className: "text-[10px] text-navy-dark-30" }, "No Header Logo"),
              /*#__PURE__*/React.createElement("label", {
                className: "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase bg-navy-dark-10 text-navy-dark px-2 py-1 rounded cursor-pointer"
              }, "Change Logo", /*#__PURE__*/React.createElement("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleHeaderLogoUpload }))
            )
          ),
          /*#__PURE__*/React.createElement("div", { className: "space-y-2" }, 
            /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50" }, "Footer Logo"),
            /*#__PURE__*/React.createElement("div", { className: "flex flex-col items-center gap-2 p-3 border border-dashed border-navy-dark-20 rounded-lg bg-white" }, 
              logoFooter ? /*#__PURE__*/React.createElement("img", { src: logoFooter, className: "h-12 w-auto object-contain" }) : /*#__PURE__*/React.createElement("span", { className: "text-[10px] text-navy-dark-30" }, "No Footer Logo"),
              /*#__PURE__*/React.createElement("label", {
                className: "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase bg-navy-dark-10 text-navy-dark px-2 py-1 rounded cursor-pointer"
              }, "Change Logo", /*#__PURE__*/React.createElement("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleFooterLogoUpload }))
            )
          )
        ),
        /*#__PURE__*/React.createElement("button", {
          className: "btn bg-orange text-white text-xs py-2 px-4 rounded font-mono uppercase tracking-wide",
          onClick: handleSaveBranding
        }, "Save Branding Settings")
      ),

      // Teams & Rosters Manager
      /*#__PURE__*/React.createElement("div", {
        className: "bg-blush rounded-xl p-5 border border-navy-dark-05 space-y-4"
      }, 
        /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, "Teams & Rosters Manager"),
        
        /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
          /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Select Team to Manage"),
          /*#__PURE__*/React.createElement("select", {
            className: inputCls(),
            value: selectedManageTeamId,
            onChange: e => setSelectedManageTeamId(e.target.value)
          }, 
            /*#__PURE__*/React.createElement("option", { value: "" }, "Select a team..."),
            teams.map(t => /*#__PURE__*/React.createElement("option", { key: t.id, value: t.id }, t.name))
          )
        ),

        selectedManageTeamId && /*#__PURE__*/React.createElement(React.Fragment, null,
          // 1. Edit Team Details
          /*#__PURE__*/React.createElement("div", { className: "border-t border-navy-dark-10 pt-4 space-y-3" },
            /*#__PURE__*/React.createElement("h4", { className: "font-mono font-bold text-xs uppercase text-navy-dark-70" }, "1. Team Details"),
            /*#__PURE__*/React.createElement("div", { className: "grid grid-cols-2 gap-3" },
              /*#__PURE__*/React.createElement("div", null,
                /*#__PURE__*/React.createElement("label", { className: "block text-[10px] font-mono uppercase text-navy-dark-50 mb-0.5" }, "Owner"),
                /*#__PURE__*/React.createElement("input", { className: inputCls(), value: teamOwner, onChange: e => setTeamOwner(e.target.value), placeholder: "e.g. John Doe" })
              ),
              /*#__PURE__*/React.createElement("div", null,
                /*#__PURE__*/React.createElement("label", { className: "block text-[10px] font-mono uppercase text-navy-dark-50 mb-0.5" }, "Captain"),
                /*#__PURE__*/React.createElement("input", { className: inputCls(), value: teamCaptain, onChange: e => setTeamCaptain(e.target.value), placeholder: "e.g. Jane Smith" })
              ),
              /*#__PURE__*/React.createElement("div", null,
                /*#__PURE__*/React.createElement("label", { className: "block text-[10px] font-mono uppercase text-navy-dark-50 mb-0.5" }, "Coach"),
                /*#__PURE__*/React.createElement("input", { className: inputCls(), value: teamCoach, onChange: e => setTeamCoach(e.target.value), placeholder: "e.g. Coach Carter" })
              ),
              /*#__PURE__*/React.createElement("div", null,
                /*#__PURE__*/React.createElement("label", { className: "block text-[10px] font-mono uppercase text-navy-dark-50 mb-0.5" }, "Founded Year"),
                /*#__PURE__*/React.createElement("input", { className: inputCls(), value: teamFounded, onChange: e => setTeamFounded(e.target.value), placeholder: "e.g. 2024" })
              )
            ),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", { className: "block text-[10px] font-mono uppercase text-navy-dark-50 mb-0.5" }, "Description"),
              /*#__PURE__*/React.createElement("textarea", { className: inputCls(), rows: 2, value: teamDesc, onChange: e => setTeamDesc(e.target.value), placeholder: "Team bio..." })
            ),
            /*#__PURE__*/React.createElement("button", {
              className: "btn bg-navy text-white text-[11px] py-1.5 px-3 rounded font-mono uppercase tracking-wide",
              onClick: handleSaveTeamDetails
            }, "Save Team Details")
          ),

          // 2. Roster / Squad Player Manager
          /*#__PURE__*/React.createElement("div", { className: "border-t border-navy-dark-10 pt-4 space-y-4" },
            /*#__PURE__*/React.createElement("h4", { className: "font-mono font-bold text-xs uppercase text-navy-dark-70" }, "2. Player Squad Manager"),
            
            // Players List Table
            /*#__PURE__*/React.createElement("div", { className: "bg-white p-2 rounded-lg border border-navy-dark-08 overflow-x-auto max-h-60 overflow-y-auto" },
              (teams.find(x => x.id === selectedManageTeamId)?.players || []).length === 0 ? 
              /*#__PURE__*/React.createElement("div", { className: "text-center py-4 text-xs font-mono text-navy-dark-30" }, "No players in squad.") :
              /*#__PURE__*/React.createElement("table", { className: "w-full text-left font-mono text-[11px] min-w-[400px]" },
                /*#__PURE__*/React.createElement("thead", null,
                  /*#__PURE__*/React.createElement("tr", { className: "text-navy-dark-40 uppercase border-b border-navy-dark-10 text-[9px]" },
                    /*#__PURE__*/React.createElement("th", { className: "pb-1" }, "Player"),
                    /*#__PURE__*/React.createElement("th", { className: "pb-1 text-center" }, "Role"),
                    /*#__PURE__*/React.createElement("th", { className: "pb-1 text-center" }, "Stats (M/R/W)"),
                    /*#__PURE__*/React.createElement("th", { className: "pb-1 text-right" }, "Actions")
                  )
                ),
                /*#__PURE__*/React.createElement("tbody", null,
                  (teams.find(x => x.id === selectedManageTeamId)?.players || []).map(p => 
                    /*#__PURE__*/React.createElement("tr", { key: p.id, className: "border-b border-navy-dark-05 hover:bg-navy-dark-05" },
                      /*#__PURE__*/React.createElement("td", { className: "py-1.5 text-navy-dark font-medium" }, 
                        p.avatar && /*#__PURE__*/React.createElement("span", { className: "mr-1" }, p.avatar), 
                        p.name,
                        p.isCaptain && /*#__PURE__*/React.createElement("span", { className: "text-[8px] bg-orange text-white px-1 rounded ml-1" }, "C"),
                        p.isWK && /*#__PURE__*/React.createElement("span", { className: "text-[8px] bg-navy text-white px-1 rounded ml-1" }, "WK")
                      ),
                      /*#__PURE__*/React.createElement("td", { className: "py-1.5 text-center text-navy-dark-70" }, p.role),
                      /*#__PURE__*/React.createElement("td", { className: "py-1.5 text-center text-navy-dark-70" }, (p.stats?.m || 0) + "/" + (p.stats?.r || 0) + "/" + (p.stats?.w || 0)),
                      /*#__PURE__*/React.createElement("td", { className: "py-1.5 text-right space-x-2" },
                        /*#__PURE__*/React.createElement("button", { className: "text-navy hover:underline font-bold", onClick: () => handleStartEditPlayer(p) }, "Edit"),
                        /*#__PURE__*/React.createElement("button", { className: "text-red-600 hover:underline", onClick: () => handleDeletePlayer(p.id) }, "Delete")
                      )
                    )
                  )
                )
              )
            ),

            // Player Form (Add / Edit)
            /*#__PURE__*/React.createElement("div", { className: "bg-navy-dark-05 p-3 rounded-lg border border-navy-dark-10 space-y-3" },
              /*#__PURE__*/React.createElement("h5", { className: "font-mono font-bold text-[10px] uppercase text-navy-dark-50" }, 
                editingPlayerId ? "✏️ Edit Player" : "➕ Add Player"
              ),
              /*#__PURE__*/React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                /*#__PURE__*/React.createElement("div", { className: "col-span-2" },
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Player Name"),
                  /*#__PURE__*/React.createElement("input", { className: inputCls(), value: playerName, onChange: e => setPlayerName(e.target.value), placeholder: "e.g. Pratham" })
                ),
                /*#__PURE__*/React.createElement("div", null,
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Role"),
                  /*#__PURE__*/React.createElement("select", { className: inputCls(), value: playerRole, onChange: e => setPlayerRole(e.target.value) },
                    /*#__PURE__*/React.createElement("option", { value: "Batter" }, "Batter"),
                    /*#__PURE__*/React.createElement("option", { value: "Bowler" }, "Bowler"),
                    /*#__PURE__*/React.createElement("option", { value: "All-rounder" }, "All-rounder"),
                    /*#__PURE__*/React.createElement("option", { value: "Wicket-keeper" }, "Wicket-keeper")
                  )
                ),
                /*#__PURE__*/React.createElement("div", null,
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Batting Style"),
                  /*#__PURE__*/React.createElement("select", { className: inputCls(), value: playerBat, onChange: e => setPlayerBat(e.target.value) },
                    /*#__PURE__*/React.createElement("option", { value: "Right-hand bat" }, "Right-hand bat"),
                    /*#__PURE__*/React.createElement("option", { value: "Left-hand bat" }, "Left-hand bat")
                  )
                ),
                /*#__PURE__*/React.createElement("div", { className: "col-span-2" },
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Bowling Style"),
                  /*#__PURE__*/React.createElement("select", { className: inputCls(), value: playerBowl, onChange: e => setPlayerBowl(e.target.value) },
                    /*#__PURE__*/React.createElement("option", { value: "N/A" }, "N/A (Does not bowl)"),
                    /*#__PURE__*/React.createElement("option", { value: "Right-arm fast" }, "Right-arm fast"),
                    /*#__PURE__*/React.createElement("option", { value: "Right-arm medium" }, "Right-arm medium"),
                    /*#__PURE__*/React.createElement("option", { value: "Right-arm spin" }, "Right-arm spin"),
                    /*#__PURE__*/React.createElement("option", { value: "Left-arm fast" }, "Left-arm fast"),
                    /*#__PURE__*/React.createElement("option", { value: "Left-arm medium" }, "Left-arm medium"),
                    /*#__PURE__*/React.createElement("option", { value: "Left-arm spin" }, "Left-arm spin")
                  )
                ),
                /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-1" },
                  /*#__PURE__*/React.createElement("input", { type: "checkbox", id: "p-captain", checked: playerIsCaptain, onChange: e => setPlayerIsCaptain(e.target.checked) }),
                  /*#__PURE__*/React.createElement("label", { htmlFor: "p-captain", className: "text-[9px] font-mono text-navy-dark-70 cursor-pointer" }, "Is Captain")
                ),
                /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-1" },
                  /*#__PURE__*/React.createElement("input", { type: "checkbox", id: "p-wk", checked: playerIsWK, onChange: e => setPlayerIsWK(e.target.checked) }),
                  /*#__PURE__*/React.createElement("label", { htmlFor: "p-wk", className: "text-[9px] font-mono text-navy-dark-70 cursor-pointer" }, "Is Wicket Keeper")
                )
              ),
              /*#__PURE__*/React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                /*#__PURE__*/React.createElement("div", null,
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Matches"),
                  /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: playerMatches, onChange: e => setPlayerMatches(e.target.value) })
                ),
                /*#__PURE__*/React.createElement("div", null,
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Runs"),
                  /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: playerRuns, onChange: e => setPlayerRuns(e.target.value) })
                ),
                /*#__PURE__*/React.createElement("div", null,
                  /*#__PURE__*/React.createElement("label", { className: "block text-[9px] font-mono uppercase text-navy-dark-50" }, "Wickets"),
                  /*#__PURE__*/React.createElement("input", { type: "number", className: inputCls(), value: playerWickets, onChange: e => setPlayerWickets(e.target.value) })
                )
              ),
              /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
                /*#__PURE__*/React.createElement("button", {
                  className: "btn bg-orange text-white text-[10px] py-1.5 px-3 rounded font-mono uppercase tracking-wide",
                  onClick: handleSavePlayer
                }, editingPlayerId ? "Update Player" : "Add Player"),
                editingPlayerId && /*#__PURE__*/React.createElement("button", {
                  className: "btn bg-navy text-white text-[10px] py-1.5 px-3 rounded font-mono uppercase tracking-wide",
                  onClick: clearPlayerForm
                }, "Cancel")
              )
            )
          )
        )
      )
    )
  );
}
`;

  // Define CricketSite component
  const updatedCricketSite = `
function CricketSite() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [sponsors, setSponsors] = useState([]);
  const [settings, setSettings] = useState({ featuredMatchId: "", logoHeader: LOGO_SRC, logoFooter: FOOTER_LOGO_SRC, seasonLabel: SEASON_LABEL, tournamentName: TOURNAMENT_NAME, tagline: TOURNAMENT_TAGLINE, footerLogoHeight: "96px" });
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState("home");
  const [isOwner, setIsOwner] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState(null);
  const [teamError, setTeamError] = useState("");
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchForm, setMatchForm] = useState(null);
  const [matchError, setMatchError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Custom navigation sub-states
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [reportMatchId, setReportMatchId] = useState("");
  const [reportText, setReportText] = useState("");

  // 1. Listen to seasons list first
  useEffect(() => {
    if (isFirestoreEnabled && db) {
      const unsubSeasons = db.collection("seasons").onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        if (list.length > 0) {
          setSeasons(list);
          const active = list.find(s => s.isActive);
          if (active && !selectedSeasonId) {
            setSelectedSeasonId(active.id);
          }
        } else {
          seedDefaultSeason();
        }
      });
      return () => unsubSeasons();
    } else {
      const defaultSeasons = [
        { id: "season-2026", name: "Season 2026", year: "2026", isActive: true },
        { id: "season-2025", name: "Season 2025", year: "2025", isActive: false }
      ];
      setSeasons(defaultSeasons);
      setSelectedSeasonId("season-2026");
    }
  }, []);

  async function seedDefaultSeason() {
    try {
      const activeId = "season-2026";
      await db.collection("seasons").doc(activeId).set({
        name: "Season 2026",
        year: "2026",
        isActive: true
      });
      await db.collection("seasons").doc(activeId).collection("sponsors").doc("sp-raaj").set({
        name: "Raaj Ply & Boards",
        logo: LOGO_SRC
      });
      console.log("Default season seeded!");
    } catch(e) { console.error(e); }
  }

  async function seedTeamsForSeason(seasonId) {
    try {
      const batch = db.batch();
      SEED_TEAMS.forEach(team => {
        const ref = db.collection("teams").doc(team.id);
        batch.set(ref, {
          name: team.name,
          code: team.code || "",
          logo: team.logo || "",
          nrr: team.nrr || "0.00",
          owner: team.owner || "TBD",
          coach: team.coach || "TBD",
          captain: team.captain || "TBD",
          founded: team.founded || "2020",
          desc: team.desc || "",
          players: team.players || [],
          seasonId: seasonId
        });
      });
      await batch.commit();
      console.log("Teams seeded for season: " + seasonId);
    } catch (e) { console.error(e); }
  }

  // 2. Listen to season-specific data
  useEffect(() => {
    if (!selectedSeasonId) return;

    if (isFirestoreEnabled && db) {
      setLoaded(false);

      const unsubTeams = db.collection("teams")
        .where("seasonId", "==", selectedSeasonId)
        .onSnapshot(snapshot => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setTeams(list);
          if (list.length === 0 && selectedSeasonId === "season-2026") {
            seedTeamsForSeason("season-2026");
          }
        });

      const unsubMatches = db.collection("matches")
        .where("seasonId", "==", selectedSeasonId)
        .onSnapshot(snapshot => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setMatches(list);
        });

      const unsubSponsors = db.collection("seasons").doc(selectedSeasonId).collection("sponsors")
        .onSnapshot(snapshot => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setSponsors(list);
        });

      const unsubSettings = db.collection("system").doc("settings")
        .onSnapshot(doc => {
          if (doc.exists) {
            setSettings(doc.data());
          }
        });

      setLoaded(true);

      return () => {
        unsubTeams();
        unsubMatches();
        unsubSponsors();
        unsubSettings();
      };
    } else {
      setLoaded(false);
      // LocalStorage mode load
      (async () => {
        let gotData = false;
        try {
          const res = await storageGet(STORAGE_KEY);
          if (res && res.value) {
            const parsed = JSON.parse(res.value);
            setTeams(parsed.teams || []);
            setMatches(parsed.matches || []);
            setSponsors(parsed.sponsors || [
              { id: "sp-raaj", name: "Raaj Ply & Boards", logo: LOGO_SRC, tier: "Title Sponsor", link: "" }
            ]);
            if (parsed.settings) {
              setSettings(parsed.settings);
            }
            gotData = true;
          }
        } catch (e) {}
        if (!gotData) {
          setTeams(SEED_TEAMS);
          const initialSponsors = [
            { id: "sp-raaj", name: "Raaj Ply & Boards", logo: LOGO_SRC, tier: "Title Sponsor", link: "" }
          ];
          setSponsors(initialSponsors);
          persist(SEED_TEAMS, [], settings, initialSponsors);
        }
        setLoaded(true);
      })();
    }
  }, [selectedSeasonId]);

  async function persist(nextTeams, nextMatches, nextSettings, nextSponsors) {
    if (isFirestoreEnabled && db) return;
    try {
      await storageSet(STORAGE_KEY, JSON.stringify({
        teams: nextTeams,
        matches: nextMatches,
        settings: nextSettings || settings,
        sponsors: nextSponsors || sponsors
      }));
    } catch (e) {
      console.error("Save failed", e);
    }
  }

  function handleLogin() {
    if (passInput === OWNER_PASSCODE) {
      setIsOwner(true);
      setShowLogin(false);
      setPassInput("");
      setLoginError("");
    } else setLoginError("Incorrect passcode");
  }

  function openNewTeam() {
    setTeamForm({
      id: null,
      name: "",
      code: "",
      logo: ""
    });
    setTeamError("");
    setShowTeamModal(true);
  }

  function openEditTeam(t) {
    setTeamForm({
      logo: "",
      ...t
    });
    setTeamError("");
    setShowTeamModal(true);
  }

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToLogoDataUrl(file);
      setTeamForm(f => ({
        ...f,
        logo: dataUrl
      }));
    } catch (err) {
      setTeamError("Couldn't read that image — try a different file");
    }
  }

  async function saveTeam() {
    const name = teamForm.name.trim();
    if (!name) {
      setTeamError("Enter a team name");
      return;
    }
    const code = (teamForm.code.trim() || autoCode(name)).toUpperCase().slice(0, 4);
    if (teams.some(t => t.id !== teamForm.id && t.name.toLowerCase() === name.toLowerCase())) {
      setTeamError("That team already exists");
      return;
    }
    const newId = teamForm.id || uid();
    const teamData = {
      name,
      code,
      logo: teamForm.logo || "",
      nrr: teamForm.id ? (teams.find(t => t.id === teamForm.id)?.nrr || "0.00") : "0.00",
      seasonId: selectedSeasonId
    };

    if (isFirestoreEnabled && db) {
      await db.collection("teams").doc(newId).set(teamData, { merge: true });
    } else {
      let next;
      if (teamForm.id) next = teams.map(t => t.id === teamForm.id ? { ...t, ...teamData } : t);
      else next = [...teams, { id: newId, ...teamData }];
      setTeams(next);
      persist(next, matches);
    }
    setShowTeamModal(false);
  }

  async function deleteTeam(id) {
    if (matches.some(m => m.team1Id === id || m.team2Id === id)) {
      setTeamError("Remove this team's fixtures first");
      return;
    }
    if (isFirestoreEnabled && db) {
      await db.collection("teams").doc(id).delete();
    } else {
      const next = teams.filter(t => t.id !== id);
      setTeams(next);
      persist(next, matches);
    }
  }

  async function editNrr(id, value) {
    if (isFirestoreEnabled && db) {
      await db.collection("teams").doc(id).update({ nrr: value });
    } else {
      const next = teams.map(t => t.id === id ? { ...t, nrr: value } : t);
      setTeams(next);
      persist(next, matches);
    }
  }

  function openNewMatch() {
    setMatchForm({
      id: null,
      team1Id: teams[0]?.id || "",
      team2Id: teams[1]?.id || "",
      date: "",
      time: "",
      venue: "",
      status: "upcoming",
      liveLink: "",
      team1Score: "",
      team2Score: "",
      result: "",
      resultNote: "",
      report: ""
    });
    setMatchError("");
    setShowMatchModal(true);
  }

  function openEditMatch(m) {
    setMatchForm({
      report: "",
      ...m
    });
    setMatchError("");
    setShowMatchModal(true);
  }

  async function saveMatch() {
    const f = matchForm;
    if (!f.team1Id || !f.team2Id) {
      setMatchError("Pick both teams");
      return;
    }
    if (f.team1Id === f.team2Id) {
      setMatchError("Teams must be different");
      return;
    }
    if (!f.date) {
      setMatchError("Pick a date");
      return;
    }
    if (f.status === "completed" && !f.result) {
      setMatchError("Select the result");
      return;
    }
    
    const newId = f.id || uid();
    const matchData = {
      team1Id: f.team1Id,
      team2Id: f.team2Id,
      date: f.date,
      time: f.time || "",
      venue: f.venue || "",
      status: f.status,
      liveLink: f.liveLink || "",
      team1Score: f.team1Score || "",
      team2Score: f.team2Score || "",
      result: f.result || "",
      resultNote: f.resultNote || "",
      report: f.report || "",
      seasonId: selectedSeasonId
    };

    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(newId).set(matchData, { merge: true });
    } else {
      let next;
      if (f.id) next = matches.map(m => m.id === f.id ? { ...m, ...matchData } : m);
      else next = [...matches, { id: newId, ...matchData }];
      setMatches(next);
      persist(teams, next);
    }
    setShowMatchModal(false);
  }

  async function deleteMatch(id) {
    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(id).delete();
    } else {
      const next = matches.filter(m => m.id !== id);
      setMatches(next);
      persist(teams, next);
    }
    setConfirmDelete(null);
  }

  // Owner settings updates
  async function handleUpdateSettings(newData) {
    const nextSettings = { ...settings, ...newData };
    setSettings(nextSettings);
    if (isFirestoreEnabled && db) {
      await db.collection("system").doc("settings").set(newData, { merge: true });
    } else {
      persist(teams, matches, nextSettings);
    }
  }

  async function handleSaveReport(matchId, text) {
    if (!matchId) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const matchData = { ...match, report: text };

    if (isFirestoreEnabled && db) {
      await db.collection("matches").doc(matchId).set(matchData, { merge: true });
    } else {
      const next = matches.map(m => m.id === matchId ? matchData : m);
      setMatches(next);
      persist(teams, next);
    }
    setReportMatchId("");
    setReportText("");
    alert("Match report saved successfully!");
  }

  // Owner season updates
  async function handleAddSeason(name, year) {
    const newId = "season-" + Date.now();
    const sData = { name, year, isActive: false };
    if (isFirestoreEnabled && db) {
      await db.collection("seasons").doc(newId).set(sData);
    } else {
      const list = [...seasons, { id: newId, ...sData }];
      setSeasons(list);
    }
  }

  async function handleToggleActiveSeason(id) {
    if (isFirestoreEnabled && db) {
      const batch = db.batch();
      seasons.forEach(s => {
        const ref = db.collection("seasons").doc(s.id);
        batch.update(ref, { isActive: s.id === id });
      });
      await batch.commit();
    } else {
      const list = seasons.map(s => ({ ...s, isActive: s.id === id }));
      setSeasons(list);
    }
  }

  // Owner sponsor updates
  async function handleAddSponsor(name, logo, tier, link) {
    const newId = "sp-" + Date.now();
    const spData = { name, logo, tier, link };
    if (isFirestoreEnabled && db) {
      await db.collection("seasons").doc(selectedSeasonId).collection("sponsors").doc(newId).set(spData);
    } else {
      const list = [...sponsors, { id: newId, ...spData }];
      setSponsors(list);
      persist(teams, matches, settings, list);
    }
  }

  async function handleDeleteSponsor(id) {
    if (isFirestoreEnabled && db) {
      await db.collection("seasons").doc(selectedSeasonId).collection("sponsors").doc(id).delete();
    } else {
      const list = sponsors.filter(sp => sp.id !== id);
      setSponsors(list);
      persist(teams, matches, settings, list);
    }
  }

  const liveMatch = matches.find(m => m.status === "live");
  const upcomingSorted = useMemo(() => matches.filter(m => m.status === "upcoming").sort((a, b) => new Date(\`\${a.date}T\${a.time || "00:00"}\`) - new Date(\`\${b.date}T\${b.time || "00:00"}\`)), [matches]);
  const completedSorted = useMemo(() => matches.filter(m => m.status === "completed").sort((a, b) => new Date(\`\${b.date}T\${b.time || "00:00"}\`) - new Date(\`\${a.date}T\${a.time || "00:00"}\`)), [matches]);
  
  // Hero match logic
  const featuredMatch = settings.featuredMatchId ? matches.find(m => m.id === settings.featuredMatchId) : null;
  const heroMatch = liveMatch || featuredMatch || upcomingSorted[0] || null;

  const upcomingList = upcomingSorted.filter(m => m.id !== heroMatch?.id);
  const standings = useMemo(() => computeStandings(teams, matches), [teams, matches]);
  const reportsAvailable = completedSorted.filter(m => m.report && m.report.trim());
  const venueCount = new Set(matches.map(m => m.venue).filter(Boolean)).size;
  const stats = [[teams.length, "Teams"], [matches.length, "Matches"], [venueCount, "Venues"]];

  if (!loaded) {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen bg-white"
    }, /*#__PURE__*/React.createElement("style", null, 
      "@keyframes shimmer { " +
      "  0% { background-position: -200% 0; } " +
      "  100% { background-position: 200% 0; } " +
      "} " +
      ".skeleton-shimmer { " +
      "  background: linear-gradient(90deg, #f0f4f8 25%, #dbe3eb 50%, #f0f4f8 75%); " +
      "  background-size: 200% 100%; " +
      "  animation: shimmer 1.5s infinite linear; " +
      "}"
    ), /*#__PURE__*/React.createElement("div", {
      className: "h-16 border-b border-gray-100 px-6 flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-32 h-6 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "hidden md:flex gap-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-4 rounded skeleton-shimmer"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "max-w-5xl mx-auto px-5 py-8 space-y-8"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-64 rounded-2xl p-8 flex flex-col justify-end space-y-4 skeleton-shimmer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-24 h-4 rounded bg-white/20"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-2/3 h-8 rounded bg-white/30"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-1/2 h-4 rounded bg-white/20"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-32 h-10 rounded bg-white/40 mt-2"
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-3 gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-20 rounded-xl p-4 flex flex-col justify-center space-y-2 skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "h-20 rounded-xl p-4 flex flex-col justify-center space-y-2 skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "h-20 rounded-xl p-4 flex flex-col justify-center space-y-2 skeleton-shimmer"
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 md:grid-cols-3 gap-8"
    }, /*#__PURE__*/React.createElement("div", {
      className: "md:col-span-2 space-y-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-40 h-6 rounded skeleton-shimmer mb-2"
    }), /*#__PURE__*/React.createElement("div", {
      className: "border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-20 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-4 rounded skeleton-shimmer"
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between py-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-12 h-12 rounded-full skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-20 h-5 rounded skeleton-shimmer"
    })), /*#__PURE__*/React.createElement("div", {
      className: "w-10 h-6 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-20 h-5 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-12 h-12 rounded-full skeleton-shimmer"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "w-full h-8 rounded skeleton-shimmer"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-32 h-6 rounded skeleton-shimmer mb-2"
    }), /*#__PURE__*/React.createElement("div", {
      className: "border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between border-b border-gray-100 pb-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-12 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-4 rounded skeleton-shimmer"
    })), [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "flex justify-between items-center py-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-5 h-5 rounded-full skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-4 rounded skeleton-shimmer"
    })), /*#__PURE__*/React.createElement("div", {
      className: "w-4 h-4 rounded skeleton-shimmer"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-4 h-4 rounded skeleton-shimmer"
    }))))))));
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "cricket-app min-h-screen bg-white font-body"
  }, /*#__PURE__*/React.createElement("style", null, \`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Anton', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        .bg-navy { background-color: #1C3D8B; }
        .bg-navy-dark { background-color: #12285E; }
        .text-navy { color: #1C3D8B; }
        .text-navy-dark { color: #12285E; }
        .bg-blush { background-color: #FDF2F7; }
        .text-orange { color: #F05A22; }
        .bg-orange { background-color: #F05A22; }
        .border-orange { border-color: #F05A22; }
        .bg-gold-20 { background-color: rgba(201,162,39,0.2); }
        .bg-black-60 { background-color: rgba(0,0,0,0.6); }
        .bg-navy-dark-10 { background-color: rgba(18,40,94,0.10); }
        .bg-orange-10 { background-color: rgba(240,90,34,0.10); }
        .bg-white-10 { background-color: rgba(255,255,255,0.10); }
        .bg-white-06 { background-color: rgba(255,255,255,0.06); }
        .border-navy-dark-05 { border-color: rgba(18,40,94,0.05); }
        .border-navy-dark-08 { border-color: rgba(18,40,94,0.08); }
        .border-navy-dark-10 { border-color: rgba(18,40,94,0.10); }
        .border-navy-dark-15 { border-color: rgba(18,40,94,0.15); }
        .border-navy-dark-20 { border-color: rgba(18,40,94,0.20); }
        .border-white-10 { border-color: rgba(255,255,255,0.10); }
        .border-white-15 { border-color: rgba(255,255,255,0.15); }
        .text-navy-dark-30 { color: rgba(18,40,94,0.30); }
        .text-navy-dark-40 { color: rgba(18,40,94,0.40); }
        .text-navy-dark-50 { color: rgba(18,40,94,0.50); }
  \`), 
  
  // 1. Navigation Menu
  /*#__PURE__*/React.createElement(Nav, {
    section: section,
    setSection: (sec) => {
      setSection(sec);
      setSelectedTeamId(null);
    },
    isOwner: isOwner,
    onLockClick: () => isOwner ? setIsOwner(false) : setShowLogin(true),
    hasLiveMatch: matches.some(m => m.status === "live"),
    seasons: seasons,
    selectedSeasonId: selectedSeasonId,
    onSeasonChange: (id) => setSelectedSeasonId(id),
    logoSrc: settings.logoHeader
  }),

  // 2. Horizontal Scrolling Sponsors Ticker Bar
  /*#__PURE__*/React.createElement(TickerBar, { sponsors: sponsors }),

  // 3. Render Section Layouts
  selectedTeamId ? /*#__PURE__*/React.createElement(TeamDetailPage, {
    teamId: selectedTeamId,
    teams: teams,
    onBack: () => setSelectedTeamId(null)
  }) :
  section === "live" ? /*#__PURE__*/React.createElement(LiveMatchPage, {
    matches: matches,
    teams: teams
  }) :
  section === "admin" ? /*#__PURE__*/React.createElement(AdminScorerPage, {
    matches: matches,
    teams: teams,
    seasons: seasons,
    selectedSeasonId: selectedSeasonId,
    sponsors: sponsors,
    settings: settings,
    isFirestoreEnabled: isFirestoreEnabled,
    db: db,
    onPersist: (t, m) => { setTeams(t); setMatches(m); persist(t, m); },
    onUpdateSettings: handleUpdateSettings,
    onAddSeason: handleAddSeason,
    onToggleActiveSeason: handleToggleActiveSeason,
    onAddSponsor: handleAddSponsor,
    onDeleteSponsor: handleDeleteSponsor
  }) :
  section === "home" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Hero, {
    teams: teams,
    heroMatch: heroMatch,
    stats: stats,
    setSection: setSection,
    settings: settings
  }), /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, 
    (settings.showAnnouncementBox !== false) && /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl p-6 text-white shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-navy-dark-10 relative overflow-hidden",
      style: { background: "linear-gradient(135deg, #F05A22 0%, #D0400B 100%)" }
    }, 
      /*#__PURE__*/React.createElement("div", { className: "space-y-1 relative z-10 text-left" }, 
        /*#__PURE__*/React.createElement("span", { className: "bg-white-10 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full text-white font-bold inline-block mb-1" }, "📢 Announcement"),
        /*#__PURE__*/React.createElement("h3", { className: "font-display text-2xl uppercase tracking-wide text-white" }, settings.announcementTitle || "Registration Form"),
        /*#__PURE__*/React.createElement("p", { className: "text-white-80 text-sm font-body max-w-xl text-white-80" }, settings.announcementText || "Please submit your player registration details using our official form.")
      ),
      settings.announcementLink && /*#__PURE__*/React.createElement("a", {
        href: settings.announcementLink,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "bg-white text-navy font-mono font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-blush transition-all duration-200 shadow-md shrink-0 relative z-10 text-center"
      }, "Click Here")
    ),
    /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 md:grid-cols-3 gap-8"
    }, /*#__PURE__*/React.createElement("div", {
    className: "md:col-span-2"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Match day",
    title: liveMatch ? "Live score" : "Next Match"
  }), heroMatch ? /*#__PURE__*/React.createElement(MatchCard, {
    match: heroMatch,
    teams: teams,
    isOwner: isOwner,
    onEdit: openEditMatch,
    onDelete: id => setConfirmDelete(matches.find(m => m.id === id))
  }) : /*#__PURE__*/React.createElement(EmptyState, {
    text: "No matches scheduled."
  }), upcomingList.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "PCL Fixtures",
    title: "Upcoming Matches"
  })), upcomingList.slice(0, 3).map(m => /*#__PURE__*/React.createElement(MatchCard, {
    key: m.id,
    match: m,
    teams: teams,
    isOwner: isOwner,
    onEdit: openEditMatch,
    onDelete: id => setConfirmDelete(matches.find(m => m.id === id))
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "PCL Standings",
    title: "Points Table"
  }), /*#__PURE__*/React.createElement(PointsTablePreview, {
    standings: standings
  }))))), 
  
  section === "sponsors" && /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Supporting The League",
    title: "Tournament Sponsors"
  }), sponsors.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "No sponsors added yet."
  }) : /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-6"
  }, ["Title Sponsor", "Platinum Sponsor", "Gold Sponsor", "Silver Sponsor", "Partner"].map(tier => {
    const tierSponsors = sponsors.filter(s => s.tier === tier);
    if (tierSponsors.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: tier,
      className: "border-b border-navy-dark-10 pb-6 last:border-0"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-display text-sm font-bold uppercase text-navy-dark-50 tracking-wider mb-4"
    }, tier, "s"), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    }, tierSponsors.map(s => /*#__PURE__*/React.createElement("div", {
      key: s.id,
      className: "bg-white border border-navy-dark-10 rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow transition-shadow"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-4"
    }, /*#__PURE__*/React.createElement("img", {
      src: s.logo || LOGO_SRC,
      alt: s.name,
      className: "w-16 h-16 object-contain rounded-md border border-navy-dark-10 shrink-0"
    }), /*#__PURE__*/React.createElement("div", null, s.link ? /*#__PURE__*/React.createElement("a", {
      href: s.link,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "font-body font-bold text-navy hover:text-orange transition-colors text-base block"
    }, s.name) : /*#__PURE__*/React.createElement("span", {
      className: "font-body font-bold text-navy text-base block"
    }, s.name), /*#__PURE__*/React.createElement("span", {
      className: "font-mono text-xs text-navy-dark-50 mt-0.5 block"
    }, s.tier)))))));
  }))), 
  
  section === "fixtures" && /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "PCL Schedule",
    title: "Fixtures",
    action: isOwner && /*#__PURE__*/React.createElement("button", {
      onClick: openNewMatch,
      className: "btn bg-orange text-white font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-md flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Plus, {
      size: 13
    }), " Add fixture")
  }), liveMatch && /*#__PURE__*/React.createElement("div", {
    className: "mb-8"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Live Match",
    title: "Currently Live"
  }), /*#__PURE__*/React.createElement(MatchCard, {
    match: liveMatch,
    teams: teams,
    isOwner: isOwner,
    onEdit: openEditMatch,
    onDelete: id => setConfirmDelete(matches.find(m => m.id === id))
  })), upcomingSorted.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Upcoming",
    title: "Future Fixtures"
  }), upcomingSorted.map(m => /*#__PURE__*/React.createElement(MatchCard, {
    key: m.id,
    match: m,
    teams: teams,
    isOwner: isOwner,
    onEdit: openEditMatch,
    onDelete: id => setConfirmDelete(matches.find(m => m.id === id))
  }))), completedSorted.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Completed",
    title: "Results"
  })), completedSorted.map(m => /*#__PURE__*/React.createElement(MatchCard, {
    key: m.id,
    match: m,
    teams: teams,
    isOwner: isOwner,
    onEdit: openEditMatch,
    onDelete: id => setConfirmDelete(matches.find(m => m.id === id))
  }))), upcomingSorted.length === 0 && completedSorted.length === 0 && !liveMatch && /*#__PURE__*/React.createElement(EmptyState, {
    text: "No matches scheduled yet."
  })), 
  
  section === "points" && /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "PCL Standings",
    title: "Full Points Table"
  }), /*#__PURE__*/React.createElement(FullPointsTable, {
    standings: standings,
    isOwner: isOwner,
    onEditNrr: editNrr
  })), 
  
  section === "teams" && /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "PCL Lineup",
    title: "Teams",
    action: isOwner && /*#__PURE__*/React.createElement("button", {
      onClick: openNewTeam,
      className: "btn bg-orange text-white font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-md flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Plus, {
      size: 13
    }), " Add team")
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
  }, teams.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    onClick: () => setSelectedTeamId(t.id),
    className: "bg-blush rounded-lg p-4 border border-navy-dark-05 flex items-center justify-between gap-2 cursor-pointer hover:border-orange transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement(TeamBadge, {
    team: t
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-body text-navy-dark text-sm font-semibold"
  }, t.name)), isOwner && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: (e) => { e.stopPropagation(); openEditTeam(t); },
    className: "p-1 rounded hover:bg-navy-dark-10 text-navy-dark-60"
  }, /*#__PURE__*/React.createElement(Pencil, {
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    onClick: (e) => { e.stopPropagation(); deleteTeam(t.id); },
    className: "p-1 rounded hover:bg-orange-10 text-orange-70"
  }, /*#__PURE__*/React.createElement(Trash2, {
    size: 13
  }))))))), 
  
  section === "reports" && /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "After The Match",
    title: "Match Reports"
  }), 
  
  // Write Report Form for Owner
  isOwner && /*#__PURE__*/React.createElement("div", {
    className: "bg-blush rounded-xl p-5 border border-navy-dark-05 mb-6 space-y-4"
  }, 
    /*#__PURE__*/React.createElement("h3", { className: "font-display text-navy-dark text-lg uppercase" }, 
      reportMatchId ? "📝 Edit Match Report" : "✍️ Write Match Report"
    ),
    /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
      /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Select Match"),
      /*#__PURE__*/React.createElement("select", {
        className: inputCls(),
        value: reportMatchId,
        onChange: e => {
          const mId = e.target.value;
          setReportMatchId(mId);
          const selected = matches.find(m => m.id === mId);
          setReportText(selected?.report || "");
        }
      }, 
        /*#__PURE__*/React.createElement("option", { value: "" }, "Select a match..."),
        matches.map(m => {
          const t1 = teams.find(t => t.id === m.team1Id);
          const t2 = teams.find(t => t.id === m.team2Id);
          const matchName = (t1?.shortName || "TBD") + " vs " + (t2?.shortName || "TBD") + " (" + formatDate(m.date) + ")";
          return /*#__PURE__*/React.createElement("option", { key: m.id, value: m.id }, matchName);
        })
      )
    ),
    reportMatchId && /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", { className: "form-group" }, 
        /*#__PURE__*/React.createElement("label", { className: "block text-xs font-mono uppercase text-navy-dark-50 mb-1" }, "Report Text"),
        /*#__PURE__*/React.createElement("textarea", {
          className: inputCls(),
          rows: 6,
          value: reportText,
          onChange: e => setReportText(e.target.value),
          placeholder: "Enter details of the match, top performers, scores, key moments..."
        })
      ),
      /*#__PURE__*/React.createElement("div", { className: "flex gap-2" }, 
        /*#__PURE__*/React.createElement("button", {
          className: "btn bg-orange text-white text-xs py-2 px-4 rounded font-mono uppercase tracking-wide",
          onClick: () => handleSaveReport(reportMatchId, reportText)
        }, "Save Report"),
        /*#__PURE__*/React.createElement("button", {
          className: "btn bg-navy-dark-10 text-navy-dark text-xs py-2 px-4 rounded font-mono uppercase tracking-wide",
          onClick: () => { setReportMatchId(""); setReportText(""); }
        }, "Cancel")
      )
    )
  ),

  // Reports List
  reportsAvailable.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "No match reports yet."
  }) : reportsAvailable.map(m => {
    const t1 = teams.find(t => t.id === m.team1Id);
    const t2 = teams.find(t => t.id === m.team2Id);
    const winner = m.result === "team1" ? t1 : m.result === "team2" ? t2 : null;
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      className: "bg-blush rounded-lg p-5 mb-4 border border-navy-dark-05"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap mb-2"
    }, /*#__PURE__*/React.createElement(TeamBadge, {
      team: t1
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-display text-navy-dark text-sm"
    }, t1?.name), /*#__PURE__*/React.createElement("span", {
      className: "font-mono text-navy-dark-30 text-xs"
    }, "v"), /*#__PURE__*/React.createElement("span", {
      className: "font-display text-navy-dark text-sm"
    }, t2?.name), /*#__PURE__*/React.createElement(TeamBadge, {
      team: t2
    })), /*#__PURE__*/React.createElement("p", {
      className: "font-mono text-navy-dark-40 text-xs mb-2"
    }, formatDate(m.date) + (m.venue ? " · " + m.venue : "")), winner && /*#__PURE__*/React.createElement("p", {
      className: "text-orange text-xs font-semibold mb-2"
    }, winner.name + (m.resultNote ? " " + m.resultNote : " won")), /*#__PURE__*/React.createElement("p", {
      className: "text-navy-dark-80 text-sm font-body leading-relaxed whitespace-pre-wrap"
    }, m.report),
    
    // Edit/Delete buttons
    isOwner && /*#__PURE__*/React.createElement("div", {
      className: "flex justify-end gap-2 mt-3 pt-3 border-t border-navy-dark-05"
    }, 
      /*#__PURE__*/React.createElement("button", {
        className: "text-navy hover:underline font-mono text-xs font-semibold",
        onClick: () => {
          setReportMatchId(m.id);
          setReportText(m.report || "");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, "Edit"),
      /*#__PURE__*/React.createElement("button", {
        className: "text-red-600 hover:underline font-mono text-xs",
        onClick: () => {
          if (confirm("Are you sure you want to delete this match report?")) {
            handleSaveReport(m.id, "");
          }
        }
      }, "Delete")
    )
    );
  })), /*#__PURE__*/React.createElement("footer", {
    className: "bg-navy-dark mt-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-5 sm:px-6 py-10"
  }, /*#__PURE__*/React.createElement("img", {
    src: settings.logoFooter || FOOTER_LOGO_SRC,
    alt: "Patidar Cricket League",
    style: {
      height: settings.footerLogoHeight || "96px",
      width: "auto",
      objectFit: "contain",
      marginBottom: "1rem"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "team-carousel-container mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "team-carousel-track"
  }, [...teams, ...teams, ...teams, ...teams, ...teams].map((t, idx) => /*#__PURE__*/React.createElement("button", {
    key: idx,
    onClick: () => { setSelectedTeamId(t.id); setSection("teams"); },
    className: "font-mono text-xs sm:text-sm text-white font-bold border border-white-30 bg-white-06 rounded px-3 py-1.5 hover:bg-white hover:text-navy-dark hover:scale-105 transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0"
  }, t.logo && /*#__PURE__*/React.createElement("img", {
    src: t.logo,
    alt: t.code || t.name,
    className: "w-5 h-5 object-contain"
  }), t.code || autoCode(t.name))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-white-10"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-white font-body text-sm font-semibold"
  }, "© ", settings.tournamentName || TOURNAMENT_NAME, " [PCL]. All rights reserved."), /*#__PURE__*/React.createElement("p", {
    className: "text-white font-body text-sm font-bold"
  }, "Powered By Yuvamandal Secundrabad - Garud Production")))), showLogin && /*#__PURE__*/React.createElement(Modal, {
    title: "Owner login",
    onClose: () => {
      setShowLogin(false);
      setLoginError("");
      setPassInput("");
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-navy-dark-60 text-sm mb-3"
  }, "Enter the owner passcode to edit teams, fixtures and results."), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: passInput,
    onChange: e => setPassInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && handleLogin(),
    className: inputCls(),
    placeholder: "Passcode",
    autoFocus: true
  }), loginError && /*#__PURE__*/React.createElement("p", {
    className: "text-orange text-xs mt-2 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(AlertCircle, {
    size: 12
  }), " ", loginError), /*#__PURE__*/React.createElement("button", {
    onClick: handleLogin,
    className: "mt-4 w-full bg-orange text-white font-mono text-sm uppercase tracking-wide py-2.5 rounded-md"
  }, "Unlock")), showTeamModal && teamForm && /*#__PURE__*/React.createElement(Modal, {
    title: teamForm.id ? "Edit team" : "Add team",
    onClose: () => setShowTeamModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: "Team name",
    value: teamForm.name,
    onChange: e => setTeamForm({
      ...teamForm,
      name: e.target.value
    }),
    autoFocus: true
  }), /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: \`Code (auto: \${autoCode(teamForm.name) || "e.g. MUM"})\`,
    value: teamForm.code,
    onChange: e => setTeamForm({
      ...teamForm,
      code: e.target.value.toUpperCase().slice(0, 4)
    }),
    maxLength: 4
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-md bg-blush border border-navy-dark-15 flex items-center justify-center overflow-hidden shrink-0"
  }, teamForm.logo ? /*#__PURE__*/React.createElement("img", {
    src: teamForm.logo,
    alt: "Team logo",
    className: "w-full h-full object-contain p-1"
  }) : /*#__PURE__*/React.createElement("span", {
    className: "text-navy-dark-30 text-[9px] font-mono text-center px-1"
  }, "No logo")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("label", {
    className: "inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide bg-navy-dark-10 text-navy-dark px-3 py-2 rounded-md cursor-pointer"
  }, "Upload logo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: handleLogoFile
  })), teamForm.logo && /*#__PURE__*/React.createElement("button", {
    onClick: () => setTeamForm({
      ...teamForm,
      logo: ""
    }),
    className: "text-xs font-mono text-orange-70"
  }, "Remove"))), teamError && /*#__PURE__*/React.createElement("p", {
    className: "text-orange text-xs flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(AlertCircle, {
    size: 12
  }), " ", teamError), /*#__PURE__*/React.createElement("button", {
    onClick: saveTeam,
    className: "w-full bg-orange text-white font-mono text-sm uppercase tracking-wide py-2.5 rounded-md flex items-center justify-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Check, {
    size: 15
  }), " Save team"))), showMatchModal && matchForm && /*#__PURE__*/React.createElement(Modal, {
    title: matchForm.id ? "Edit fixture" : "New fixture",
    onClose: () => setShowMatchModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls(),
    value: matchForm.team1Id,
    onChange: e => setMatchForm({
      ...matchForm,
      team1Id: e.target.value
    })
  }, teams.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name))), /*#__PURE__*/React.createElement("select", {
    className: inputCls(),
    value: matchForm.team2Id,
    onChange: e => setMatchForm({
      ...matchForm,
      team2Id: e.target.value
    })
  }, teams.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name)))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inputCls(),
    value: matchForm.date,
    onChange: e => setMatchForm({
      ...matchForm,
      date: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "time",
    className: inputCls(),
    value: matchForm.time,
    onChange: e => setMatchForm({
      ...matchForm,
      time: e.target.value
    })
  })), /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: "Venue",
    value: matchForm.venue,
    onChange: e => setMatchForm({
      ...matchForm,
      venue: e.target.value
    })
  }), /*#__PURE__*/React.createElement("select", {
    className: inputCls(),
    value: matchForm.status,
    onChange: e => setMatchForm({
      ...matchForm,
      status: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "upcoming"
  }, "Upcoming"), /*#__PURE__*/React.createElement("option", {
    value: "live"
  }, "Live"), /*#__PURE__*/React.createElement("option", {
    value: "completed"
  }, "Completed")), matchForm.status === "live" && /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: "External Live Stream / Score Link (e.g. YouTube, CricHeroes)",
    value: matchForm.liveLink || "",
    onChange: e => setMatchForm({
      ...matchForm,
      liveLink: e.target.value
    })
  }), (matchForm.status === "completed") && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: "Team 1 score e.g. 182/6 (20)",
    value: matchForm.team1Score,
    onChange: e => setMatchForm({
      ...matchForm,
      team1Score: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: "Team 2 score",
    value: matchForm.team2Score,
    onChange: e => setMatchForm({
      ...matchForm,
      team2Score: e.target.value
    })
  })), matchForm.status === "completed" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("select", {
    className: inputCls(),
    value: matchForm.result,
    onChange: e => setMatchForm({
      ...matchForm,
      result: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Result…"), /*#__PURE__*/React.createElement("option", {
    value: "team1"
  }, teams.find(t => t.id === matchForm.team1Id)?.name || "Team 1", " won"), /*#__PURE__*/React.createElement("option", {
    value: "team2"
  }, teams.find(t => t.id === matchForm.team2Id)?.name || "Team 2", " won"), /*#__PURE__*/React.createElement("option", {
    value: "tie"
  }, "Tied"), /*#__PURE__*/React.createElement("option", {
    value: "no-result"
  }, "No result")), /*#__PURE__*/React.createElement("input", {
    className: inputCls(),
    placeholder: "e.g. won by 20 runs (optional)",
    value: matchForm.resultNote,
    onChange: e => setMatchForm({
      ...matchForm,
      resultNote: e.target.value
    })
  }), /*#__PURE__*/React.createElement("textarea", {
    className: inputCls(),
    placeholder: "Match report (optional) — shown on the Match Reports page",
    rows: 4,
    value: matchForm.report,
    onChange: e => setMatchForm({
      ...matchForm,
      report: e.target.value
    })
  })), matchError && /*#__PURE__*/React.createElement("p", {
    className: "text-orange text-xs flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(AlertCircle, {
    size: 12
  }), " ", matchError), /*#__PURE__*/React.createElement("button", {
    onClick: saveMatch,
    className: "w-full bg-orange text-white font-mono text-sm uppercase tracking-wide py-2.5 rounded-md flex items-center justify-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Check, {
    size: 15
  }), " Save fixture"))), confirmDelete && /*#__PURE__*/React.createElement(Modal, {
    title: "Delete fixture?",
    onClose: () => setConfirmDelete(null)
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-navy-dark-70 text-sm mb-4"
  }, "This can't be undone."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmDelete(null),
    className: "flex-1 border border-navy-dark-20 text-navy-dark text-sm py-2 rounded-md"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteMatch(confirmDelete.id),
    className: "flex-1 bg-orange text-white text-sm py-2 rounded-md"
  }, "Delete"))));
}
`;

  // Assembly via precise splice on lines
  const linesBeforeStandings = lines.slice(0, standingsStartIdx);
  const linesBetweenStandingsAndNav = lines.slice(formChipStartIdx, navStartIdx);
  const linesAfterNavBeforeSite = lines.slice(heroStartIdx, siteStartIdx);
  const linesAfterPreview = lines.slice(previewStartIdx);

  const assembledLines = [
    ...linesBeforeStandings,
    updatedComputeStandingsCode,
    ...linesBetweenStandingsAndNav,
    updatedNavCode,
    ...linesAfterNavBeforeSite,
    helperComponentsCode,
    updatedCricketSite,
    ...linesAfterPreview
  ];

  let finalOutput = assembledLines.join('\n');

  // Inline js/firebase-config.js to save a network request
  const firebaseConfigPath = path.join(targetDir, 'js', 'firebase-config.js');
  if (fs.existsSync(firebaseConfigPath)) {
    const configContent = fs.readFileSync(firebaseConfigPath, 'utf8');
    finalOutput = finalOutput.replace(
      '<script src="js/firebase-config.js"></script>',
      `<script>\n${configContent}\n</script>`
    );
  }

  fs.writeFileSync(outputFile, finalOutput, 'utf8');
  console.log('Successfully compiled and merged all real-time react components into ' + outputFile);

} catch (e) {
  console.error('Merge error:', e);
}
