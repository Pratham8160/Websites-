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

  const sorted = [...matches].filter(m => m.status === "completed").sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`) - new Date(`${b.date}T${b.time || "00:00"}`));
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