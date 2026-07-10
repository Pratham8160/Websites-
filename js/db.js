// js/db.js — localStorage / Firestore hybrid wrapper simulating a real-time database
window.PCL = window.PCL || {};

PCL.DB = {
  PREFIX: 'pcl_',
  firestore: null,

  // Initialize DB. Connects to Firestore if configured; otherwise, falls back to localStorage.
  init() {
    const config = PCL.FirebaseConfig;
    const isConfigured = config && config.apiKey && !config.apiKey.startsWith("YOUR_");

    if (isConfigured) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        this.firestore = firebase.firestore();
        console.log("🔥 Firebase Firestore connected successfully.");
        // Seed in the background
        this.checkAndSeed();
      } catch (err) {
        console.error("🔥 Firebase connection failed. Falling back to local storage:", err);
      }
    } else {
      console.warn("⚠️ Firebase configuration missing or default placeholders found. Falling back to local storage.");
    }

    // Always seed/init localStorage as a fallback
    this.initLocalFallback();
  },

  initLocalFallback() {
    if (!localStorage.getItem(this.PREFIX + 'initialized')) {
      localStorage.setItem(this.PREFIX + 'teams', JSON.stringify(PCL.DATA.teams));
      localStorage.setItem(this.PREFIX + 'matches', JSON.stringify(PCL.DATA.matches));
      localStorage.setItem(this.PREFIX + 'pointsTable', JSON.stringify(PCL.DATA.pointsTable));
      localStorage.setItem(this.PREFIX + 'liveMatch', JSON.stringify(PCL.DATA.liveMatch));
      localStorage.setItem(this.PREFIX + 'tournament', JSON.stringify(PCL.DATA.tournament));
      localStorage.setItem(this.PREFIX + 'settings', JSON.stringify({
        logoHeader: "images/pcl-logo-new.png",
        logoFooter: "images/pcl-logo-footer.png",
        seasonLabel: "Yuvakmandal Secundrabad - Garud Production",
        tournamentName: "Patidar Cricket League",
        tagline: "Bound By Roots. United By Cricket."
      }));
      localStorage.setItem(this.PREFIX + 'initialized', 'true');
    }
  },

  async checkAndSeed() {
    if (!this.firestore) return;
    try {
      const configRef = this.firestore.collection("system").doc("config");
      const doc = await configRef.get();
      if (!doc.exists) {
        console.log("🌱 Database empty. Seeding default data to Firestore...");
        const batch = this.firestore.batch();

        // Seed teams
        PCL.DATA.teams.forEach(t => {
          const ref = this.firestore.collection("teams").doc(t.id);
          batch.set(ref, t);
        });

        // Seed matches
        PCL.DATA.matches.forEach(m => {
          const ref = this.firestore.collection("matches").doc(m.id);
          batch.set(ref, m);
        });

        // Seed other documents
        batch.set(this.firestore.collection("system").doc("pointsTable"), { data: PCL.DATA.pointsTable });
        batch.set(this.firestore.collection("system").doc("liveMatch"), PCL.DATA.liveMatch || { status: "none" });
        batch.set(this.firestore.collection("system").doc("tournament"), PCL.DATA.tournament);
        batch.set(this.firestore.collection("system").doc("settings"), {
          logoHeader: "images/pcl-logo-new.png",
          logoFooter: "images/pcl-logo-footer.png",
          seasonLabel: "Yuvakmandal Secundrabad - Garud Production",
          tournamentName: "Patidar Cricket League",
          tagline: "Bound By Roots. United By Cricket."
        });
        batch.set(configRef, { initialized: true });

        await batch.commit();
        console.log("🌱 Firestore seeding complete!");
      }
    } catch (err) {
      console.error("🌱 Seeding Firestore failed:", err);
    }
  },

  // Synchronous read from local cache
  get(key) {
    try {
      const val = localStorage.getItem(this.PREFIX + key);
      return val ? JSON.parse(val) : null;
    } catch(e) { return null; }
  },

  // Synchronous update to local cache
  setLocalCache(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch(e) {}
  },

  // Write updates to DB
  async set(key, value) {
    // 1. Update local cache immediately for local reactivity
    this.setLocalCache(key, value);

    // 2. Write to Firestore if connected
    if (this.firestore) {
      try {
        if (key === 'liveMatch') {
          await this.firestore.collection("system").doc("liveMatch").set(value || { status: "none" });
        } else if (key === 'pointsTable') {
          await this.firestore.collection("system").doc("pointsTable").set({ data: value });
        } else if (key === 'tournament') {
          await this.firestore.collection("system").doc("tournament").set(value);
        } else if (key === 'settings') {
          await this.firestore.collection("system").doc("settings").set(value);
        } else if (key === 'teams' || key === 'matches') {
          // If the entire array is replaced, push item by item to collections
          const batch = this.firestore.batch();
          value.forEach(item => {
            const ref = this.firestore.collection(key).doc(item.id);
            batch.set(ref, item);
          });
          await batch.commit();
        }
      } catch (err) {
        console.error(`Firestore set failed for ${key}:`, err);
      }
    } else {
      // Offline fallback: broadcast via BroadcastChannel
      if (PCL.Realtime) PCL.Realtime.broadcast(key, value);
    }
    return true;
  },

  async reset() {
    if (this.firestore) {
      try {
        console.log("🔄 Resetting Firestore data...");
        // Clear config to trigger re-seed
        await this.firestore.collection("system").doc("config").delete();
        await this.checkAndSeed();
        PCL.Utils.toast("Database reset on Cloud Firestore!", "success");
      } catch (err) {
        console.error("Firestore reset failed:", err);
      }
    }

    // Reset local cache
    const keys = ['teams','matches','pointsTable','liveMatch','tournament','settings','initialized'];
    keys.forEach(k => localStorage.removeItem(this.PREFIX + k));
    this.initLocalFallback();
  },

  // Helpers: read/write teams
  getTeam(id) {
    const teams = this.get('teams') || [];
    return teams.find(t => t.id === id) || null;
  },

  async updateTeam(id, updates) {
    const teams = this.get('teams') || [];
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) return false;

    teams[idx] = { ...teams[idx], ...updates };
    this.setLocalCache('teams', teams);

    if (this.firestore) {
      try {
        await this.firestore.collection("teams").doc(id).update(updates);
      } catch (err) {
        console.error("Firestore team update failed:", err);
      }
    } else {
      if (PCL.Realtime) PCL.Realtime.broadcast('teams', teams);
    }
    return true;
  },

  // Helpers: read/write matches
  getMatch(id) {
    const matches = this.get('matches') || [];
    return matches.find(m => m.id === id) || null;
  },

  async updateMatch(id, updates) {
    const matches = this.get('matches') || [];
    const idx = matches.findIndex(m => m.id === id);
    if (idx === -1) return false;

    matches[idx] = { ...matches[idx], ...updates };
    this.setLocalCache('matches', matches);

    if (this.firestore) {
      try {
        await this.firestore.collection("matches").doc(id).update(updates);
      } catch (err) {
        console.error("Firestore match update failed:", err);
      }
    } else {
      if (PCL.Realtime) PCL.Realtime.broadcast('matches', matches);
    }
    return true;
  },

  // Helpers: live match
  setLiveMatch(data) {
    this.set('liveMatch', data);
  },

  getLiveMatch() {
    return this.get('liveMatch');
  },

  // Helpers: points table
  updatePointsTable(table) {
    this.set('pointsTable', table);
  },

  // nrrStr(nrr) {
  //   return (nrr >= 0 ? '+' : '') + nrr.toFixed(3);
  // }
};
