function generateAsciiBar(percentage, length = 15) {
    const filledLength = Math.round((percentage / 100) * length);
    const emptyLength = length - filledLength;
    return `[${'#'.repeat(filledLength)}${'.'.repeat(emptyLength)}]`;
}

function generateSvg({ username, totalCommits, stars, topLanguages }) {
    let languagesText = '';
    topLanguages.forEach((lang, index) => {
        const bar = generateAsciiBar(lang.percent);
        const name = lang.name.padEnd(10, ' ').replace(/ /g, '\u00A0');
        const pct = lang.percent.toFixed(1).padStart(5, ' ').replace(/ /g, '\u00A0');
        languagesText += `<tspan x="20" dy="22">&gt; ${name} ${bar} ${pct}%</tspan>\n`;
    });

    const svg = `
<svg width="500" height="300" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
  <style>
    .bg { fill: #0d1117; }
    .border { stroke: #58a6ff; stroke-width: 2; fill: none; }
    .text { font-family: "Courier New", Courier, monospace; font-size: 14px; fill: #c9d1d9; }
    .prompt { fill: #7ee787; font-weight: bold; }
    .highlight { fill: #79c0ff; font-weight: bold; }
  </style>

  <rect class="bg" width="496" height="296" x="2" y="2" rx="6" ry="6" />
  <rect class="border" width="496" height="296" x="2" y="2" rx="6" ry="6" />
  
  <text class="text" x="20" y="30">
    <tspan class="prompt">tui@github:~$</tspan> ./fetch_stats --user ${username}
  </text>
  
  <line x1="20" y1="42" x2="480" y2="42" stroke="#30363d" stroke-dasharray="4" />

  <text class="text" x="20" y="65">
    <tspan class="highlight">OS:</tspan> GitHub TUI v1.0
  </text>
  <text class="text" x="20" y="87">
    <tspan class="highlight">Commits (1yr):</tspan> ${totalCommits}
  </text>
  <text class="text" x="20" y="109">
    <tspan class="highlight">Stars Earned:</tspan> ${stars}
  </text>

  <text class="text" x="20" y="145">
    <tspan class="highlight">Top Languages:</tspan>
    ${languagesText}
  </text>

  <text class="text" x="20" y="250">
    <tspan class="highlight">Status:</tspan> "Coding and drinking coffee..."
  </text>

  <text class="text" x="20" y="275">
    <tspan class="prompt">root@system:~#</tspan> _
  </text>
</svg>
`;
    return svg.trim();
}

module.exports = { generateSvg };
