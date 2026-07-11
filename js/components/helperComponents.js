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
    let commText = commentaryInput.trim() || `${ovStr} overs: ${ball} runs added.`;
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