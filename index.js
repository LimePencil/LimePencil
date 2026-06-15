require('dotenv').config();
const fs = require('fs');
const { generateSvg } = require('./svg_generator');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || 'coder';

async function fetchStats() {
    if (!GITHUB_TOKEN) {
        console.warn("No GITHUB_TOKEN found. Using mock data for preview.");
        return {
            username: USERNAME,
            totalCommits: 1337,
            stars: 42,
            topLanguages: [
                { name: 'JavaScript', percent: 65.5 },
                { name: 'Rust', percent: 20.0 },
                { name: 'Python', percent: 14.5 }
            ]
        };
    }

    const query = `
      query {
        viewer {
          login
          contributionsCollection {
            contributionCalendar {
              totalContributions
            }
          }
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
        }
      }
    `;

    const fetchImpl = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

    const res = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    const json = await res.json();
    if (json.errors) {
        throw new Error("GraphQL Error: " + JSON.stringify(json.errors));
    }

    const viewer = json.data.viewer;
    const username = viewer.login;
    const totalCommits = viewer.contributionsCollection.contributionCalendar.totalContributions;
    
    let stars = 0;
    let languageSizes = {};

    viewer.repositories.nodes.forEach(repo => {
        stars += repo.stargazerCount;
        repo.languages.edges.forEach(edge => {
            const name = edge.node.name;
            const size = edge.size;
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

    return {
        username,
        totalCommits,
        stars,
        topLanguages
    };
}

async function main() {
    try {
        const stats = await fetchStats();
        const svg = generateSvg(stats);
        fs.writeFileSync('tui-profile.svg', svg);
        console.log("Successfully generated tui-profile.svg");
    } catch (err) {
        console.error("Failed to generate SVG:", err);
        process.exit(1);
    }
}

main();
