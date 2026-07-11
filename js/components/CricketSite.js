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
  const upcomingSorted = useMemo(() => matches.filter(m => m.status === "upcoming").sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`) - new Date(`${b.date}T${b.time || "00:00"}`)), [matches]);
  const completedSorted = useMemo(() => matches.filter(m => m.status === "completed").sort((a, b) => new Date(`${b.date}T${b.time || "00:00"}`) - new Date(`${a.date}T${a.time || "00:00"}`)), [matches]);
  
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
  }, /*#__PURE__*/React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Anton', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        :root {
          --bg-page: #f8fafc;
          --text-main: #0f172a;
          --text-muted: #475569;
          --text-muted-light: #64748b;
          --bg-card: #ffffff;
          --border-color: rgba(18, 40, 94, 0.10);
          --bg-blush: #FDF2F7;
          --bg-navy: #1C3D8B;
          --bg-navy-dark: #12285E;
          --text-navy: #1C3D8B;
          --text-navy-dark: #12285E;
          --border-navy-dark-05: rgba(18,40,94,0.05);
          --border-navy-dark-08: rgba(18,40,94,0.08);
          --border-navy-dark-10: rgba(18,40,94,0.10);
          --border-navy-dark-15: rgba(18,40,94,0.15);
          --border-navy-dark-20: rgba(18,40,94,0.20);
          --text-navy-dark-30: rgba(18,40,94,0.30);
          --text-navy-dark-40: rgba(18,40,94,0.40);
          --text-navy-dark-50: rgba(18,40,94,0.50);
        }
        
        body.dark {
          --bg-page: #0b0f19;
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
          --text-muted-light: #64748b;
          --bg-card: #151c2c;
          --border-color: rgba(255, 255, 255, 0.10);
          --bg-blush: #1d2433;
          --bg-navy: #1d3557;
          --bg-navy-dark: #1d2433;
          --text-navy: #60a5fa;
          --text-navy-dark: #f8fafc;
          --border-navy-dark-05: rgba(255,255,255,0.05);
          --border-navy-dark-08: rgba(255,255,255,0.08);
          --border-navy-dark-10: rgba(255,255,255,0.10);
          --border-navy-dark-15: rgba(255,255,255,0.15);
          --border-navy-dark-20: rgba(255,255,255,0.20);
          --text-navy-dark-30: rgba(255,255,255,0.40);
          --text-navy-dark-40: rgba(255,255,255,0.50);
          --text-navy-dark-50: rgba(255,255,255,0.60);
        }
        
        body {
          background-color: var(--bg-page) !important;
          color: var(--text-main) !important;
          transition: background-color 0.25s ease, color 0.25s ease;
        }
        
        .cricket-app {
          background-color: var(--bg-page) !important;
          color: var(--text-main) !important;
        }

        .bg-white {
          background-color: var(--bg-card) !important;
          transition: background-color 0.25s ease;
        }
        .bg-gray-50, .bg-gray-100 {
          background-color: var(--bg-page) !important;
          transition: background-color 0.25s ease;
        }
        .border-gray-100 {
          border-color: var(--border-color) !important;
          transition: border-color 0.25s ease;
        }

        .text-gray-900, .text-slate-900 {
          color: var(--text-main) !important;
        }
        .text-gray-500, .text-gray-600, .text-slate-500, .text-slate-600 {
          color: var(--text-muted) !important;
        }
        
        .bg-navy { background-color: var(--bg-navy) !important; }
        .bg-navy-dark { background-color: var(--bg-navy-dark) !important; }
        .text-navy { color: var(--text-navy) !important; }
        .text-navy-dark { color: var(--text-navy-dark) !important; }
        .bg-blush { background-color: var(--bg-blush) !important; }
        
        .border-navy-dark-05 { border-color: var(--border-navy-dark-05) !important; }
        .border-navy-dark-08 { border-color: var(--border-navy-dark-08) !important; }
        .border-navy-dark-10 { border-color: var(--border-navy-dark-10) !important; }
        .border-navy-dark-15 { border-color: var(--border-navy-dark-15) !important; }
        .border-navy-dark-20 { border-color: var(--border-navy-dark-20) !important; }
        
        .text-navy-dark-30 { color: var(--text-navy-dark-30) !important; }
        .text-navy-dark-40 { color: var(--text-navy-dark-40) !important; }
        .text-navy-dark-50 { color: var(--text-navy-dark-50) !important; }
        
        body.dark input, body.dark select, body.dark textarea {
          background-color: var(--bg-page) !important;
          color: var(--text-main) !important;
          border-color: var(--border-color) !important;
        }
        
        body.dark option {
          background-color: var(--bg-card) !important;
          color: var(--text-main) !important;
        }

        body.dark .border-dashed {
          border-color: var(--border-color) !important;
        }

        .text-orange { color: #F05A22; }
        .bg-orange { background-color: #F05A22; }
        .border-orange { border-color: #F05A22; }
        .bg-gold-20 { background-color: rgba(201,162,39,0.2); }
        .bg-black-60 { background-color: rgba(0,0,0,0.6); }
        .bg-navy-dark-10 { background-color: rgba(18,40,94,0.10); }
        .bg-orange-10 { background-color: rgba(240,90,34,0.10); }
        .bg-white-10 { background-color: rgba(255,255,255,0.10); }
        .bg-white-06 { background-color: rgba(255,255,255,0.06); }
        .border-white-10 { border-color: rgba(255,255,255,0.10); }
        .border-white-15 { border-color: rgba(255,255,255,0.15); }
  `), 
  
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
    placeholder: `Code (auto: ${autoCode(teamForm.name) || "e.g. MUM"})`,
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