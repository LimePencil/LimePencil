require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || 'coder';

async function fetchStats() {
    if (!GITHUB_TOKEN) {
        console.warn("No GITHUB_TOKEN found. Using mock data for preview.");
        return {
            username: USERNAME,
            totalCommits: 5337,
            stars: 42,
            currentStreak: 14,
            busiestDay: "Tuesday",
            followers: 128,
            pullRequests: 56,
            monthlyCounts: [
                { month: 'Jul', count: 120 }, { month: 'Aug', count: 150 },
                { month: 'Sep', count: 90 },  { month: 'Oct', count: 200 },
                { month: 'Nov', count: 210 }, { month: 'Dec', count: 300 },
                { month: 'Jan', count: 250 }, { month: 'Feb', count: 180 },
                { month: 'Mar', count: 220 }, { month: 'Apr', count: 170 },
                { month: 'May', count: 190 }, { month: 'Jun', count: 240 }
            ],
            topLanguages: [
                { name: 'Python', percent: 65.5 },
                { name: 'Rust', percent: 20.0 },
                { name: 'C++', percent: 14.5 }
            ]
        };
    }

    const fetchImpl = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const headers = {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
    };

    // 1. Fetch available years
    const yearQuery = `
      query {
        viewer {
          contributionsCollection {
            contributionYears
          }
        }
      }
    `;
    const yearRes = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: yearQuery })
    });
    const yearJson = await yearRes.json();
    if (yearJson.errors) throw new Error("GraphQL Error: " + JSON.stringify(yearJson.errors));
    
    const years = yearJson.data.viewer.contributionsCollection.contributionYears;

    // 2. Build dynamic query for all years
    let calendarQueries = years.map(y => {
        const from = `${y}-01-01T00:00:00Z`;
        const to = `${y}-12-31T23:59:59Z`;
        return `
          year${y}: contributionsCollection(from: "${from}", to: "${to}") {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        `;
    }).join('\n');

    const fullQuery = `
      query {
        viewer {
          login
          followers { totalCount }
          pullRequests { totalCount }
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
            nodes {
              stargazerCount
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    name
                  }
                }
              }
            }
          }
          ${calendarQueries}
        }
      }
    `;

    const res = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: fullQuery })
    });

    const json = await res.json();
    if (json.errors) throw new Error("GraphQL Error: " + JSON.stringify(json.errors));

    const viewer = json.data.viewer;
    const username = viewer.login;
    const followers = viewer.followers.totalCount;
    const pullRequests = viewer.pullRequests.totalCount;
    
    // Aggregate contributions across all years
    let totalCommits = 0;
    let allDays = [];
    
    years.forEach(y => {
        const cal = viewer[`year${y}`].contributionCalendar;
        totalCommits += cal.totalContributions;
        
        const daysInYear = cal.weeks.flatMap(w => w.contributionDays);
        allDays.push(...daysInYear);
    });

    // Sort days chronologically
    allDays.sort((a, b) => new Date(a.date) - new Date(b.date));

    let stars = 0;
    let languageSizes = {};
    const IGNORED_LANGUAGES = ['Jupyter Notebook', 'HTML', 'CSS'];

    viewer.repositories.nodes.forEach(repo => {
        stars += repo.stargazerCount;
        repo.languages.edges.forEach(edge => {
            const name = edge.node.name;
            const size = edge.size;
            if (IGNORED_LANGUAGES.includes(name)) return;
            languageSizes[name] = (languageSizes[name] || 0) + size;
        });
    });

    const totalSize = Object.values(languageSizes).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(languageSizes)
        .map(([name, size]) => ({
            name,
            percent: totalSize > 0 ? (size / totalSize) * 100 : 0
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);

    // Calculate Lifetime Streak & Busiest Day
    let currentStreak = 0;
    let dayCounts = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    
    let streakActive = true;
    for (let i = allDays.length - 1; i >= 0; i--) {
        const day = allDays[i];
        
        // Skip future dates if the year hasn't ended yet
        if (new Date(day.date) > new Date()) continue;

        if (day.contributionCount > 0) {
            if (streakActive) currentStreak++;
        } else {
            // If it's today and we haven't contributed, the streak is not broken (yet).
            // We just don't increment. But if it's yesterday or earlier, it's broken.
            // For simplicity, if we hit a 0 and it's not the very last valid day in the list, break.
            const isToday = (new Date(day.date).toDateString() === new Date().toDateString());
            if (!isToday && i !== allDays.length - 1) {
                streakActive = false;
            }
        }
        dayCounts[day.weekday] += day.contributionCount;
    }
    
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let busiestDayIndex = 0;
    let maxCount = -1;
    for (let i = 0; i < 7; i++) {
        if (dayCounts[i] > maxCount) {
            maxCount = dayCounts[i];
            busiestDayIndex = i;
        }
    }
    const busiestDay = daysOfWeek[busiestDayIndex];

    // Monthly Trends (Last 14 months to cover May 2025 through June 2026)
    let monthsMap = new Map();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    allDays.forEach(day => {
        const dateObj = new Date(day.date);
        if (dateObj > new Date()) return; // Skip future dates
        
        const y = dateObj.getFullYear();
        const key = `${y}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}`;
        
        if (!monthsMap.has(key)) {
            monthsMap.set(key, { month: monthNames[dateObj.getMonth()], count: 0, year: y });
        }
        monthsMap.get(key).count += day.contributionCount;
    });

    const sortedMonths = Array.from(monthsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    // Slice the last 14 months
    const recentMonths = sortedMonths.slice(-14);
    const monthlyCounts = recentMonths.map(entry => ({ month: entry[1].month, count: entry[1].count }));
    
    let earliestYear = recentMonths.length > 0 ? recentMonths[0][1].year : 0;
    let latestYear = recentMonths.length > 0 ? recentMonths[recentMonths.length - 1][1].year : 0;
    const dateRangeStr = earliestYear === latestYear ? `${earliestYear}` : `${earliestYear}-${latestYear}`;

    return {
        username,
        totalCommits,
        stars,
        currentStreak,
        busiestDay,
        followers,
        pullRequests,
        monthlyCounts,
        dateRangeStr,
        topLanguages
    };
}

module.exports = { fetchStats };
