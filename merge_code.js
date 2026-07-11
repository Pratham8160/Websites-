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

  // Load modular component files from disk
  const componentsDir = path.join(targetDir, 'js', 'components');
  const updatedComputeStandingsCode = fs.readFileSync(path.join(componentsDir, 'computeStandings.js'), 'utf8');
  const updatedNavCode = fs.readFileSync(path.join(componentsDir, 'Nav.js'), 'utf8');
  const helperComponentsCode = fs.readFileSync(path.join(componentsDir, 'helperComponents.js'), 'utf8');
  const updatedCricketSite = fs.readFileSync(path.join(componentsDir, 'CricketSite.js'), 'utf8');

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
