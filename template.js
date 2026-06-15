function renderHtml(stats) {
    // 1. Generate Terminal Language Bars
    const colors = ['var(--primary-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--purple-color)', 'var(--cyan-color)'];
    const languagesHtml = stats.topLanguages.map((lang, i) => {
        const color = colors[i % colors.length];
        const name = lang.name.padEnd(10, ' ').replace(/ /g, '&nbsp;');
        const pctText = lang.percent.toFixed(1).padStart(5, ' ').replace(/ /g, '&nbsp;');
        
        const length = 20;
        const filled = Math.round((lang.percent / 100) * length);
        const empty = length - filled;
        
        const filledBar = `<span style="color: ${color}">${'█'.repeat(filled)}</span>`;
        const emptyBar = `<span style="color: #3e4451">${'█'.repeat(empty)}</span>`;
        
        return `<div style="font-family: var(--font-stack); white-space: pre; margin-bottom: 5px;">${name} [${filledBar}${emptyBar}] <span style="color: ${color}">${pctText}%</span></div>`;
    }).join('');

    // 2. Generate Beautiful CSS Monthly Contribution Graph
    const maxCommits = Math.max(...stats.monthlyCounts.map(m => m.count), 1);
    
    const graphHtml = `
        <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 120px; gap: 8px;">
            ${stats.monthlyCounts.map(data => {
                const heightPct = Math.max((data.count / maxCommits) * 100, 5); // 5% minimum height
                return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                        <div style="width: 100%; height: 90px; display: flex; align-items: flex-end; background: rgba(255,255,255,0.05);">
                            <div style="width: 100%; height: ${heightPct}%; background: var(--purple-color);"></div>
                        </div>
                        <div style="font-size: 11px; color: var(--secondary-color);">${data.month}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://unpkg.com/terminal.css@0.7.4/dist/terminal.min.css" />
    <style>
        :root {
            /* One Dark Pro Color Palette */
            --global-font-size: 14px;
            --global-line-height: 1.4em;
            --background-color: #282c34;
            --page-width: 60em;
            --font-color: #abb2bf;
            --invert-font-color: #282c34;
            
            --secondary-color: #5c6370;
            --tertiary-color: #7f848e;
            
            --primary-color: #61afef;
            --error-color: #e06c75;
            --progress-color: #98c379;
            --success-color: #98c379;
            --warning-color: #e5c07b;
            --purple-color: #c678dd;
            --cyan-color: #56b6c2;
            
            --mark-background-color: #e06c75;
            --marked-color: #282c34;
        }
        
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            background-color: var(--background-color);
            width: 860px;
            height: auto;
            display: flex;
            align-items: flex-start;
            justify-content: center;
        }

        #capture {
            width: 860px;
            padding: 40px;
            background-color: var(--background-color);
            display: flex;
            justify-content: center;
        }

        .terminal-container {
            width: 100%;
        }

        /* Overrides to match the terminal-css vibe for our chat layout */
        .chat-block {
            margin-bottom: 30px;
        }

        .prompt {
            color: var(--success-color);
            font-weight: bold;
            margin-bottom: 10px;
        }

        .prompt span.user-host {
            color: var(--primary-color);
        }

        .prompt span.cmd {
            color: var(--font-color);
        }

        .ai-response {
            /* No left border, just output straight under the prompt like a real TUI */
            margin-bottom: 10px;
            color: var(--font-color);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dotted var(--secondary-color);
            padding-bottom: 2px;
        }
        .stat-label { 
            color: var(--font-color); 
            display: flex; 
            align-items: center; 
            gap: 6px; 
        }
        .stat-label svg {
            position: relative;
            top: -2px; /* Tweak to move icon slightly upward */
        }
        .stat-val { color: var(--primary-color); font-weight: bold; }
    </style>
</head>
<body class="terminal">
    <div id="capture">
        <div class="terminal-container">
            
            <!-- Instruction 1: whoami -->
            <div class="chat-block">
                <div class="prompt"><span class="user-host">${stats.username}@github:~$</span> <span class="cmd">whoami</span></div>
                <div class="ai-response">
                    <div class="terminal-card">
                        <header>Personal Information</header>
                        <div>
                            <div class="stats-grid" style="grid-template-columns: 1fr;">
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--font-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Name</span> <span class="stat-val">Jaeyoung Shin</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--font-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> School</span> <span class="stat-val">KAIST</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--font-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Location</span> <span class="stat-val">Daejeon</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--font-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> Current Job</span> <span class="stat-val">Data Engineer @ ROKAF (~2027.10)</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--font-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Email</span> <span class="stat-val" style="text-transform: none;">limepencil@kaist.ac.kr</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="var(--font-color)"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg> LinkedIn</span> <span class="stat-val" style="text-transform: none;">/in/limepencil</span></div>
                            </div>
                        </div>
                    </div>

                    <div class="terminal-card" style="margin-top: 20px;">
                        <header>Favorite Things</header>
                        <div>
                            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                                <div class="stat-item"><span class="stat-label" style="display: flex; align-items: center; justify-content: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7 .18 7.79 2.05 2.7 1.67 7.27-1.15 8.72-1.71.84-3.8 1.46-7.45 1.49-3.65-.03-5.74-.65-7.45-1.49-2.82-1.45-3.2-6.02-1.15-8.72.6-.79-1.22-7.21.18-7.79 1.4-.58 4.64.26 6.42 2.26.65-.17 1.33-.26 2-.26z"/><path d="M12 17a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/><path d="M12 14v3"/></svg> Kitten</span></div>
                                <div class="stat-item"><span class="stat-label" style="display: flex; align-items: center; justify-content: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg> Games</span></div>
                                <div class="stat-item"><span class="stat-label" style="display: flex; align-items: center; justify-content: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Sleeping</span></div>
                            </div>
                        </div>
                    </div>

                    <div class="terminal-card" style="margin-top: 20px;">
                        <header>GitHub Statistics</header>
                        <div>
                            <div class="stats-grid">
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="1.05" y1="12" x2="7" y2="12"></line><line x1="17.01" y1="12" x2="22.96" y2="12"></line></svg> Total Commits</span> <span class="stat-val">${stats.totalCommits}</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Followers</span> <span class="stat-val">${stats.followers}</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg> Pull Requests</span> <span class="stat-val">${stats.pullRequests}</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg> Current Streak</span> <span class="stat-val">${stats.currentStreak} d</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Stars Earned</span> <span class="stat-val">${stats.stars}</span></div>
                                <div class="stat-item"><span class="stat-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Busiest Day</span> <span class="stat-val">${stats.busiestDay}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Instruction 2 -->
            <div class="chat-block">
                <div class="prompt"><span class="user-host">${stats.username}@github:~$</span> <span class="cmd">/extract_tech_stack</span></div>
                <div class="ai-response">
                    <div class="terminal-card">
                        <header>Top Languages</header>
                        <div>
                            ${languagesHtml}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Instruction 3 -->
            <div class="chat-block">
                <div class="prompt"><span class="user-host">${stats.username}@github:~$</span> <span class="cmd">/plot_contributions --range 1yr --type bar_chart</span></div>
                <div class="ai-response">
                    <div class="terminal-card">
                        <header>Contributions (${stats.dateRangeStr})</header>
                        <div>
                            ${graphHtml}
                        </div>
                    </div>
                </div>
            </div>

            <div class="prompt"><span class="user-host">${stats.username}@github:~$</span> <span class="terminal-cursor"></span></div>
            
        </div>
    </div>
</body>
</html>
    `;
}

module.exports = { renderHtml };
