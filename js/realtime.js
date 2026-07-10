// js/realtime.js — Real-time synchronization layer (Firestore onSnapshot / Local BroadcastChannel)
window.PCL = window.PCL || {};

PCL.Realtime = {
  channel: null,
  listeners: {}, // { key: [callbacks] }

  init() {
    const db = PCL.DB.firestore;

    if (db) {
      console.log("📡 Real-time sync engine: listening to Cloud Firestore...");

      // 1. Listen to Teams Collection changes
      db.collection("teams").onSnapshot(snapshot => {
        const teams = [];
        snapshot.forEach(doc => {
          teams.push({ id: doc.id, ...doc.data() });
        });
        PCL.DB.setLocalCache("teams", teams);
        this._notify("teams", teams);
      }, err => {
        console.warn("Firestore teams subscription failed:", err);
      });

      // 2. Listen to Matches Collection changes
      db.collection("matches").onSnapshot(snapshot => {
        const matches = [];
        snapshot.forEach(doc => {
          matches.push({ id: doc.id, ...doc.data() });
        });
        // Maintain match ordering by match number
        matches.sort((a,b) => (a.num || 0) - (b.num || 0));
        PCL.DB.setLocalCache("matches", matches);
        this._notify("matches", matches);
      }, err => {
        console.warn("Firestore matches subscription failed:", err);
      });

      // 3. Listen to Points Table document changes
      db.collection("system").doc("pointsTable").onSnapshot(doc => {
        if (doc.exists) {
          const pt = doc.data().data || [];
          PCL.DB.setLocalCache("pointsTable", pt);
          this._notify("pointsTable", pt);
        }
      }, err => {
        console.warn("Firestore pointsTable subscription failed:", err);
      });

      // 4. Listen to Live Match document changes
      db.collection("system").doc("liveMatch").onSnapshot(doc => {
        if (doc.exists) {
          let lm = doc.data();
          if (lm && lm.status === "none") lm = null; // Normalize empty live match
          PCL.DB.setLocalCache("liveMatch", lm);
          this._notify("liveMatch", lm);
        }
      }, err => {
        console.warn("Firestore liveMatch subscription failed:", err);
      });

      // 5. Listen to Tournament config document changes
      db.collection("system").doc("tournament").onSnapshot(doc => {
        if (doc.exists) {
          const tournament = doc.data();
          PCL.DB.setLocalCache("tournament", tournament);
          this._notify("tournament", tournament);
        }
      }, err => {
        console.warn("Firestore tournament subscription failed:", err);
      });

    } else {
      // Offline fallback mode: cross-tab BroadcastChannel
      console.log("📡 Real-time sync engine: listening to local BroadcastChannel...");

      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('pcl-realtime-v1');
        this.channel.onmessage = (event) => {
          const { key, data } = event.data;
          PCL.DB.setLocalCache(key, data);
          this._notify(key, data);
        };
      }

      // Fallback for older browsers
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('pcl_') && e.newValue) {
          const key = e.key.replace('pcl_', '');
          try {
            const data = JSON.parse(e.newValue);
            this._notify(key, data);
          } catch(err) {}
        }
      });
    }
  },

  // Broadcast a change locally (for fallback mode)
  broadcast(key, data) {
    if (this.channel) {
      try {
        this.channel.postMessage({ key, data });
      } catch(e) {}
    }
  },

  // Subscribe to a database key (e.g. 'liveMatch', 'pointsTable')
  on(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => this.off(key, callback);
  },

  // Unsubscribe
  off(key, callback) {
    if (this.listeners[key]) {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    }
  },

  // Clear all listeners (called on page routing)
  clear(key) {
    if (key) {
      delete this.listeners[key];
    } else {
      this.listeners = {};
    }
  },

  // Internal trigger helper
  _notify(key, data) {
    const cbs = this.listeners[key] || [];
    cbs.forEach(cb => { try { cb(data); } catch(e) {} });

    // Wildcard subscriber fallback
    const all = this.listeners['*'] || [];
    all.forEach(cb => { try { cb(key, data); } catch(e) {} });
  }
};
