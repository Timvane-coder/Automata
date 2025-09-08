
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import csv from 'csv-parser';
import fetch from 'node-fetch';
import { Readable } from 'stream';

class FootballDataExplorer {
    constructor() {
        this.data = [];
        this.teams = [];
        this.leagues = new Map();
        this.loadErrors = [];
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Fixed league configurations with proper raw GitHub URLs
        this.leagueConfigs = {
            'epl': {
                name: 'Premier League',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/02629107bf7b037ca64c0e737893e5417694bcc5/premier_league_detailed_data.csv',
                color: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
            },
            'serie-a': {
                name: 'Serie A',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/02629107bf7b037ca64c0e737893e5417694bcc5/seriea_detailed_data.csv',
                color: '🇮🇹'
            },
            'bundesliga': {
                name: 'Bundesliga',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/02629107bf7b037ca64c0e737893e5417694bcc5/bundesliga_detailed_data.csv',
                color: '🇩🇪'
            },
            'la-liga': {
                name: 'La Liga',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/02629107bf7b037ca64c0e737893e5417694bcc5/laliga_detailed_data.csv',
                color: '🇪🇸'
            },
            'ligue-1': {
                name: 'Ligue 1',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/02629107bf7b037ca64c0e737893e5417694bcc5/ligue1_detailed_data.csv',
                color: '🇫🇷'
            }
        };
    }

    // Robust CSV loader with the fixes from diagnostic version
    async loadCSV(source, leagueKey = null) {
        return new Promise(async (resolve, reject) => {
            const results = [];
            let stream;
            let headers = [];

            try {
                if (source.startsWith('http')) {
                    console.log(`📡 Fetching data from ${this.leagueConfigs[leagueKey]?.name || leagueKey}...`);

                    const response = await fetch(source, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 15000
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const text = await response.text();

                    // Check if we got HTML instead of CSV
                    if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
                        throw new Error('Received HTML page instead of CSV. URL might be incorrect.');
                    }

                    stream = Readable.from([text]);
                } else {
                    if (!fs.existsSync(source)) {
                        throw new Error(`File not found: ${source}`);
                    }
                    console.log(`📁 Loading data from ${source}...`);
                    stream = fs.createReadStream(source);
                }

                stream
                    .pipe(csv({
                        skipEmptyLines: true,
                        trim: true
                    }))
                    .on('headers', (headerList) => {
                        headers = headerList.map(h => h.trim());
                    })
                    .on('data', (data) => {
                        // Clean the data
                        const cleanData = {};
                        Object.keys(data).forEach(key => {
                            const cleanKey = key.trim();
                            const cleanValue = typeof data[key] === 'string' ? data[key].trim() : data[key];
                            cleanData[cleanKey] = cleanValue;
                        });

                        // Find team name in various possible fields
                        let teamName = cleanData.title || cleanData.team || cleanData.name ||
                                     cleanData.Team || cleanData.Title || cleanData.NAME ||
                                     cleanData.club || cleanData.Club;

                        if (teamName) {
                            cleanData.title = teamName; // Standardize to 'title'
                        }

                        // Convert numeric fields
                        const numericFields = ['xG', 'xGA', 'npxG', 'npxGA', 'deep', 'deep_allowed',
                                             'scored', 'missed', 'xpts', 'wins', 'draws', 'loses', 'pts', 'npxGD',
                                             'ppda_att', 'ppda_def', 'ppda_allowed_att', 'ppda_allowed_def'];

                        numericFields.forEach(field => {
                            if (cleanData[field] !== undefined && cleanData[field] !== null && cleanData[field] !== '') {
                                const numValue = parseFloat(cleanData[field]);
                                if (!isNaN(numValue)) {
                                    cleanData[field] = numValue;
                                }
                            }
                        });

                        // Add league identifier
                        if (leagueKey) {
                            cleanData.league = leagueKey;
                            cleanData.leagueName = this.leagueConfigs[leagueKey]?.name || leagueKey;
                        }

                        // Parse result if available
                        if (cleanData.result && typeof cleanData.result === 'string') {
                            cleanData.result = cleanData.result.toLowerCase();
                        }

                        results.push(cleanData);
                    })
                    .on('end', () => {
                        if (results.length === 0) {
                            reject(new Error('No data found in CSV file'));
                            return;
                        }

                        const validTeams = results.filter(row => row.title && row.title !== 'undefined' && row.title.trim() !== '');

                        if (leagueKey) {
                            this.leagues.set(leagueKey, results);
                            console.log(`✅ Loaded ${results.length} matches for ${this.leagueConfigs[leagueKey]?.name || leagueKey} (${validTeams.length} with team names)`);
                        }
                        resolve(results);
                    })
                    .on('error', (error) => {
                        this.loadErrors.push({league: leagueKey, error: error.message});
                        reject(error);
                    });

            } catch (error) {
                this.loadErrors.push({league: leagueKey, error: error.message});
                reject(error);
            }
        });
    }

    // Load multiple leagues
    async loadMultipleLeagues(sources) {
        console.log('🌍 Loading multiple leagues...\n');
        this.loadErrors = [];

        for (const [leagueKey, source] of Object.entries(sources)) {
            try {
                const leagueData = await this.loadCSV(source, leagueKey);
                this.data.push(...leagueData);
            } catch (error) {
                console.error(`❌ Error loading ${this.leagueConfigs[leagueKey]?.name || leagueKey}: ${error.message}`);
            }
        }

        // Extract unique teams
        const allTitles = this.data.map(row => row.title).filter(title => title && title.trim() !== '' && title !== 'undefined');
        this.teams = [...new Set(allTitles)].sort();

        console.log(`\n🏆 Total: ${this.data.length} matches across ${this.leagues.size} leagues`);
        console.log(`👥 ${this.teams.length} unique teams loaded`);

        return this.data;
    }

    // Load default leagues
    async loadDefaultLeagues() {
        const sources = {};
        for (const [key, config] of Object.entries(this.leagueConfigs)) {
            sources[key] = config.url;
        }
        return this.loadMultipleLeagues(sources);
    }

    // Display main menu (updated with new options)
    showMenu() {
        console.log('\n⚽ FOOTBALL DATA EXPLORER - MULTI LEAGUE');
        console.log('========================================');
        console.log('1. Show all teams');
        console.log('2. Analyze specific team');
        console.log('3. Compare two teams');
        console.log('4. Show top performers');
        console.log('5. Filter matches');
        console.log('6. League comparison');
        console.log('7. Show match details');
        console.log('8. Statistics summary');
        console.log('9. 📈 Form Table Analysis');
        console.log('10. 📊 Performance Trends');
        console.log('11. 🔮 Match Predictions');
        console.log('0. Exit');
        console.log('========================================');
    }

    // Show all teams
    showTeams() {
        console.log('\n📋 TEAMS BY LEAGUE:');

        if (this.teams.length === 0) {
            console.log('❌ No teams available. Try option 11 to debug.');
            return;
        }

        for (const [leagueKey, leagueData] of this.leagues) {
            const config = this.leagueConfigs[leagueKey];
            const leagueTeams = [...new Set(leagueData
                .map(row => row.title)
                .filter(team => team && team !== 'undefined' && team.trim() !== '')
            )].sort();

            console.log(`\n${config?.color || '⚽'} ${config?.name || leagueKey.toUpperCase()}:`);

            if (leagueTeams.length === 0) {
                console.log('  ❌ No valid team names found in this league');
            } else {
                leagueTeams.forEach((team, index) => {
                    const teamMatches = leagueData.filter(row => row.title === team);
                    console.log(`  ${index + 1}. ${team} (${teamMatches.length} matches)`);
                });
            }
        }
    }

    // Helper method to get team by choice (number or name)
    getTeamByChoice(choice) {
        if (!choice || choice.trim() === '') return null;

        const choiceStr = choice.trim();

        // Check if it's a number
        const choiceNum = parseInt(choiceStr);
        if (!isNaN(choiceNum) && choiceNum > 0 && choiceNum <= this.teams.length) {
            return this.teams[choiceNum - 1];
        }

        // Check if it's a team name (exact match or partial)
        let team = this.teams.find(t => t.toLowerCase() === choiceStr.toLowerCase());
        if (team) return team;

        // Partial match
        team = this.teams.find(t => t.toLowerCase().includes(choiceStr.toLowerCase()));
        return team;
    }

    // NEW FEATURE 1: Form table based on last N matches
    async showFormTable() {
        const numMatches = await this.question('Enter number of recent matches to analyze (default 5): ') || '5';
        const n = parseInt(numMatches);

        if (isNaN(n) || n <= 0) {
            console.log('❌ Invalid number of matches. Using default value of 5.');
            n = 5;
        }

        console.log('\n📊 Calculating form table...');

        const formTable = this.teams.map(team => {
            const teamData = this.data.filter(row => row.title === team);

            if (teamData.length === 0) {
                return null;
            }

            // Sort by date if available, otherwise by match order
            const sortedData = teamData.sort((a, b) => {
                if (a.date && b.date) {
                    return new Date(a.date) - new Date(b.date);
                }
                return 0; // Keep original order if no dates
            });

            const recentMatches = sortedData.slice(-n);
            const points = recentMatches.reduce((sum, m) => sum + (m.pts || 0), 0);
            const wins = recentMatches.filter(m => m.result === 'w').length;
            const draws = recentMatches.filter(m => m.result === 'd').length;
            const losses = recentMatches.filter(m => m.result === 'l').length;
            const form = recentMatches.map(m => {
                const result = m.result || 'u';
                return result.toUpperCase();
            }).join('');

            return {
                team,
                matches: recentMatches.length,
                points,
                wins,
                draws,
                losses,
                form: form || 'N/A',
                avgXG: recentMatches.length > 0 ?
                    (recentMatches.reduce((s, m) => s + (m.xG || 0), 0) / recentMatches.length).toFixed(2) : '0.00',
                avgXGA: recentMatches.length > 0 ?
                    (recentMatches.reduce((s, m) => s + (m.xGA || 0), 0) / recentMatches.length).toFixed(2) : '0.00'
            };
        }).filter(team => team !== null).sort((a, b) => b.points - a.points);

        console.log(`\n📈 FORM TABLE (Last ${n} matches):`);
        console.log('='.repeat(85));
        console.log('Pos Team                  Pts  W  D  L  Form      Avg xG  Avg xGA');
        console.log('-'.repeat(85));

        formTable.forEach((team, index) => {
            const pos = (index + 1).toString().padStart(2);
            const name = team.team.padEnd(20);
            const points = team.points.toString().padStart(3);
            const wins = team.wins.toString().padStart(2);
            const draws = team.draws.toString().padStart(2);
            const losses = team.losses.toString().padStart(2);
            const form = team.form.padEnd(9);
            const avgXG = team.avgXG.padStart(6);
            const avgXGA = team.avgXGA.padStart(7);

            console.log(`${pos}  ${name} ${points} ${wins} ${draws} ${losses} ${form} ${avgXG} ${avgXGA}`);
        });

        // Show form guide
        console.log('\nForm Guide: W = Win, D = Draw, L = Loss, U = Unknown');
        console.log('Teams are sorted by points in their last ' + n + ' matches.');
    }

    // NEW FEATURE 2: Performance trends over time
    async showPerformanceTrends() {
        this.showTeams();
        const teamChoice = await this.question('\nSelect team for trend analysis: ');
        const team = this.getTeamByChoice(teamChoice);

        if (!team) {
            console.log('❌ Team not found!');
            return;
        }

        const teamData = this.data.filter(row => row.title === team);

        if (teamData.length === 0) {
            console.log('❌ No data found for this team!');
            return;
        }

        // Sort by date if available
        const sortedData = teamData.sort((a, b) => {
            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            }
            return 0;
        });

        console.log(`\n📈 PERFORMANCE TRENDS - ${team}:`);
        console.log('='.repeat(70));

        // Rolling averages
        const windowSize = Math.min(5, sortedData.length);
        const trends = [];

        for (let i = windowSize - 1; i < sortedData.length; i++) {
            const window = sortedData.slice(i - windowSize + 1, i + 1);
            const avgXG = window.reduce((s, m) => s + (m.xG || 0), 0) / windowSize;
            const avgXGA = window.reduce((s, m) => s + (m.xGA || 0), 0) / windowSize;
            const points = window.reduce((s, m) => s + (m.pts || 0), 0);
            const form = window.map(m => (m.result || 'u').toUpperCase()).join('');

            trends.push({
                matchNum: i + 1,
                date: sortedData[i].date || 'N/A',
                avgXG: avgXG.toFixed(2),
                avgXGA: avgXGA.toFixed(2),
                points: points,
                form: form,
                xGDiff: (avgXG - avgXGA).toFixed(2)
            });
        }

        console.log('Match Date         xG(5)  xGA(5) xGD(5) Pts(5) Form');
        console.log('-'.repeat(70));

        const displayTrends = trends.slice(-15); // Show last 15 trend points
        displayTrends.forEach(trend => {
            const matchNum = trend.matchNum.toString().padStart(2);
            const date = trend.date.toString().substring(0, 10).padEnd(10);
            const avgXG = trend.avgXG.padStart(5);
            const avgXGA = trend.avgXGA.padStart(6);
            const xGDiff = trend.xGDiff.padStart(6);
            const points = trend.points.toString().padStart(6);
            const form = trend.form.padEnd(5);

            console.log(`${matchNum}    ${date} ${avgXG} ${avgXGA} ${xGDiff} ${points} ${form}`);
        });

        // Performance summary
        if (trends.length > 0) {
            const latestTrend = trends[trends.length - 1];
            const firstTrend = trends[0];

            console.log(`\n📊 TREND SUMMARY:`);
            console.log(`Recent form (${windowSize} games): ${latestTrend.form}`);
            console.log(`Current xG average: ${latestTrend.avgXG}`);
            console.log(`Current xGA average: ${latestTrend.avgXGA}`);
            console.log(`xG difference trend: ${parseFloat(latestTrend.xGDiff) > 0 ? '📈 Positive' : '📉 Negative'}`);
        }
    }
    


    // PREDICTION ENGINE METHODS - COMPLETE IMPLEMENTATION
    async showPredictions() {
        console.log('\n🔮 MATCH PREDICTOR & PROJECTIONS');
        console.log('================================');
        console.log('1. Predict next match outcome');
        console.log('2. Season projection');
        console.log('3. Goal prediction model');
        console.log('4. Team form analysis');
        console.log('5. League position predictor');
        console.log('0. Back to main menu');

        const choice = await this.question('\nSelect prediction type (0-5): ');

        switch(choice) {
            case '1': await this.predictMatch(); break;
            case '2': await this.projectSeason(); break;
            case '3': await this.predictGoals(); break;
            case '4': await this.analyzeTeamForm(); break;
            case '5': await this.predictLeaguePositions(); break;
            case '0': return;
            default: console.log('❌ Invalid choice. Please select 0-5.');
        }
    }

    async predictMatch() {
        console.log('\n🔮 MATCH OUTCOME PREDICTOR');
        console.log('='.repeat(50));

        this.showTeams();
        const team1Choice = await this.question('\nEnter home team name or number: ');
        const team2Choice = await this.question('Enter away team name or number: ');

        const homeTeam = this.getTeamByChoice(team1Choice);
        const awayTeam = this.getTeamByChoice(team2Choice);

        if (!homeTeam || !awayTeam) {
            console.log('❌ One or both teams not found!');
            return;
        }

        if (homeTeam === awayTeam) {
            console.log('❌ Cannot predict a team against itself!');
            return;
        }

        // Get team data
        const homeData = this.data.filter(row => row.title === homeTeam);
        const awayData = this.data.filter(row => row.title === awayTeam);

        if (homeData.length === 0 || awayData.length === 0) {
            console.log('❌ Insufficient data for one or both teams!');
            return;
        }

        // Calculate advanced statistics
        const homeStats = this.calculateTeamStats(homeData, true);
        const awayStats = this.calculateTeamStats(awayData, false);

        // Prediction model
        const prediction = this.generateMatchPrediction(homeTeam, awayTeam, homeStats, awayStats);

        console.log(`\n🔮 MATCH PREDICTION: ${homeTeam} vs ${awayTeam}`);
        console.log('='.repeat(60));
        console.log(`Predicted xG: ${homeTeam} ${prediction.homeXG.toFixed(2)} - ${prediction.awayXG.toFixed(2)} ${awayTeam}`);
        console.log(`Most likely score: ${prediction.predictedScore}`);
        console.log(`\n📊 Win Probabilities:`);
        console.log(`${homeTeam} Win: ${prediction.homeWinProb.toFixed(1)}%`);
        console.log(`Draw: ${prediction.drawProb.toFixed(1)}%`);
        console.log(`${awayTeam} Win: ${prediction.awayWinProb.toFixed(1)}%`);

        console.log(`\n🎯 Confidence Level: ${prediction.confidence}`);
        console.log(`\n📈 Key Factors:`);
        prediction.keyFactors.forEach(factor => console.log(`  • ${factor}`));
        
        // Additional prediction insights
        console.log(`\n🔍 Advanced Insights:`);
        console.log(`Over 2.5 Goals: ${prediction.over25Goals.toFixed(1)}%`);
        console.log(`Both Teams to Score: ${prediction.bothTeamsScore.toFixed(1)}%`);
        console.log(`Match Quality Rating: ${prediction.matchQuality}/10`);
    }

    async projectSeason() {
        console.log('\n📈 SEASON PROJECTION');
        console.log('='.repeat(50));

        this.showTeams();
        const teamChoice = await this.question('\nEnter team name or number for season projection: ');
        const team = this.getTeamByChoice(teamChoice);

        if (!team) {
            console.log('❌ Team not found!');
            return;
        }

        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            console.log('❌ No data found for this team!');
            return;
        }

        const projection = this.calculateSeasonProjection(team, teamData);

        console.log(`\n📈 SEASON PROJECTION FOR ${team}`);
        console.log('='.repeat(50));
        console.log(`Current Performance (${teamData.length} matches):`);
        console.log(`  Points per game: ${projection.currentPPG.toFixed(2)}`);
        console.log(`  xG per game: ${projection.avgXG.toFixed(2)}`);
        console.log(`  xGA per game: ${projection.avgXGA.toFixed(2)}`);
        console.log(`  xG Difference: ${projection.xGDiff > 0 ? '+' : ''}${projection.xGDiff.toFixed(2)}`);

        console.log(`\n🎯 Season Projections (38 games):`);
        console.log(`  Projected Points: ${projection.projectedPoints.toFixed(0)} points`);
        console.log(`  Projected Goals: ${projection.projectedGoals.toFixed(0)} goals`);
        console.log(`  Projected Goals Against: ${projection.projectedGA.toFixed(0)} goals`);
        console.log(`  Expected League Position: ${projection.expectedPosition}`);

        console.log(`\n🏆 Season Outlook: ${projection.outlook}`);
        
        // Probability breakdowns
        console.log(`\n📊 Qualification Probabilities:`);
        console.log(`  Champions League: ${projection.clProbability.toFixed(1)}%`);
        console.log(`  Europa League: ${projection.elProbability.toFixed(1)}%`);
        console.log(`  Relegation: ${projection.relegationProbability.toFixed(1)}%`);
    }

    async predictGoals() {
        console.log('\n⚽ GOAL PREDICTION MODEL');
        console.log('='.repeat(50));

        this.showTeams();
        const teamChoice = await this.question('\nEnter team name or number: ');
        const team = this.getTeamByChoice(teamChoice);

        if (!team) {
            console.log('❌ Team not found!');
            return;
        }

        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            console.log('❌ No data found for this team!');
            return;
        }

        const goalModel = this.calculateGoalModel(team, teamData);

        console.log(`\n⚽ GOAL PREDICTION MODEL FOR ${team}`);
        console.log('='.repeat(50));
        console.log(`Next Match Predictions:`);
        console.log(`  Expected Goals (Home): ${goalModel.homeGoals.toFixed(2)}`);
        console.log(`  Expected Goals (Away): ${goalModel.awayGoals.toFixed(2)}`);
        console.log(`  Scoring Probability: ${goalModel.scoringProb.toFixed(1)}%`);
        console.log(`  Clean Sheet Probability: ${goalModel.cleanSheetProb.toFixed(1)}%`);

        console.log(`\n📊 Goal Patterns:`);
        console.log(`  Average goals per game: ${goalModel.avgGoals.toFixed(2)}`);
        console.log(`  Goals vs xG efficiency: ${goalModel.efficiency.toFixed(1)}%`);
        console.log(`  Most likely next match score: ${goalModel.mostLikelyScore}`);
        
        console.log(`\n🎯 Scoring Analysis:`);
        console.log(`  High-scoring games (3+ goals): ${goalModel.highScoringProb.toFixed(1)}%`);
        console.log(`  Goal variance: ${goalModel.consistency}`);
        console.log(`  Best goal-scoring period: ${goalModel.bestPeriod}`);
    }

    async analyzeTeamForm() {
        console.log('\n📈 TEAM FORM ANALYSIS');
        console.log('='.repeat(50));

        this.showTeams();
        const teamChoice = await this.question('\nEnter team name or number: ');
        const team = this.getTeamByChoice(teamChoice);

        if (!team) {
            console.log('❌ Team not found!');
            return;
        }

        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            console.log('❌ No data found for this team!');
            return;
        }

        const formAnalysis = this.analyzeForm(team, teamData);

        console.log(`\n📈 FORM ANALYSIS FOR ${team}`);
        console.log('='.repeat(50));
        console.log(`Current Form: ${formAnalysis.formRating}`);
        console.log(`Recent Performance Trend: ${formAnalysis.trend}`);
        console.log(`Momentum Score: ${formAnalysis.momentum.toFixed(1)}/10`);

        console.log(`\nLast 5 Matches Performance:`);
        console.log(`  xG: ${formAnalysis.recentXG.toFixed(2)} per game`);
        console.log(`  xGA: ${formAnalysis.recentXGA.toFixed(2)} per game`);
        console.log(`  Points per game: ${formAnalysis.recentPPG.toFixed(2)}`);

        console.log(`\n🔥 Form Insights:`);
        formAnalysis.insights.forEach(insight => console.log(`  • ${insight}`));
        
        console.log(`\n📊 Performance Metrics:`);
        console.log(`  Form consistency: ${formAnalysis.consistency}`);
        console.log(`  Pressure performance: ${formAnalysis.pressureRating}`);
        console.log(`  Next match confidence: ${formAnalysis.nextMatchConfidence}`);
    }

    async predictLeaguePositions() {
        console.log('\n🏆 LEAGUE POSITION PREDICTOR');
        console.log('='.repeat(50));

        // Show available leagues
        console.log('\nAvailable leagues:');
        let leagueIndex = 1;
        const leagueKeys = [];
        for (const [key, config] of Object.entries(this.leagueConfigs)) {
            if (this.leagues.has(key)) {
                console.log(`${leagueIndex}. ${config.color} ${config.name}`);
                leagueKeys.push(key);
                leagueIndex++;
            }
        }

        if (leagueKeys.length === 0) {
            console.log('❌ No league data available!');
            return;
        }

        const leagueChoice = await this.question('\nSelect league number: ');
        const selectedLeagueKey = leagueKeys[parseInt(leagueChoice) - 1];

        if (!selectedLeagueKey) {
            console.log('❌ Invalid league selection!');
            return;
        }

        const leagueData = this.leagues.get(selectedLeagueKey);
        const predictions = this.predictFinalTable(selectedLeagueKey, leagueData);

        console.log(`\n🏆 PREDICTED FINAL TABLE - ${this.leagueConfigs[selectedLeagueKey].name}`);
        console.log('='.repeat(60));

        predictions.forEach((team, index) => {
            const position = index + 1;
            let emoji = '';
            if (position <= 4) emoji = '🟢'; // Champions League
            else if (position <= 6) emoji = '🟡'; // Europa League
            else if (position >= predictions.length - 2) emoji = '🔴'; // Relegation

            console.log(`${emoji} ${position.toString().padStart(2)}. ${team.name.padEnd(20)} ${team.projectedPoints.toFixed(0).padStart(3)} pts (${team.confidence})`);
        });

        console.log('\n🏆 Champions League: Top 4');
        console.log('🟡 Europa League: 5th-6th');
        console.log('🔴 Relegation: Bottom 3');
        
        // Additional league insights
        console.log(`\n📊 League Insights:`);
        const leagueStats = this.calculateLeagueStats(predictions);
        console.log(`  Title race: ${leagueStats.titleRace}`);
        console.log(`  Relegation battle: ${leagueStats.relegationBattle}`);
        console.log(`  Average points gap: ${leagueStats.avgPointsGap.toFixed(1)} points`);
    }

    // Helper methods for predictions
    calculateTeamStats(teamData, isHome) {
        const stats = {
            matches: teamData.length,
            avgXG: teamData.reduce((sum, match) => sum + (match.xG || 0), 0) / teamData.length,
            avgXGA: teamData.reduce((sum, match) => sum + (match.xGA || 0), 0) / teamData.length,
            avgGoals: teamData.reduce((sum, match) => sum + (match.scored || 0), 0) / teamData.length,
            avgGA: teamData.reduce((sum, match) => sum + (match.missed || 0), 0) / teamData.length,
            ppg: teamData.reduce((sum, match) => sum + (match.pts || 0), 0) / teamData.length
        };

        // Home/Away specific adjustments
        if (isHome) {
            stats.avgXG *= 1.1; // Home advantage
            stats.avgXGA *= 0.9;
        } else {
            stats.avgXG *= 0.9; // Away disadvantage
            stats.avgXGA *= 1.1;
        }

        return stats;
    }

    generateMatchPrediction(homeTeam, awayTeam, homeStats, awayStats) {
        const homeXG = (homeStats.avgXG + awayStats.avgXGA) / 2;
        const awayXG = (awayStats.avgXG + homeStats.avgXGA) / 2;

        // Poisson-based probability calculation
        const homeWinProb = this.calculateWinProbability(homeXG, awayXG);
        const awayWinProb = this.calculateWinProbability(awayXG, homeXG);
        const drawProb = 100 - homeWinProb - awayWinProb;

        const predictedHomeGoals = Math.round(homeXG);
        const predictedAwayGoals = Math.round(awayXG);

        const keyFactors = [];
        if (homeStats.ppg > awayStats.ppg + 0.5) keyFactors.push(`${homeTeam} has superior recent form`);
        if (awayStats.ppg > homeStats.ppg + 0.5) keyFactors.push(`${awayTeam} has superior recent form`);
        if (homeXG > 2.0) keyFactors.push(`${homeTeam} strong attacking threat`);
        if (awayXG > 2.0) keyFactors.push(`${awayTeam} strong attacking threat`);
        if (homeStats.avgXGA < 1.0) keyFactors.push(`${homeTeam} solid defensive record`);
        if (awayStats.avgXGA < 1.0) keyFactors.push(`${awayTeam} solid defensive record`);

        const confidence = homeStats.matches > 10 && awayStats.matches > 10 ? 'High' :
                          homeStats.matches > 5 && awayStats.matches > 5 ? 'Medium' : 'Low';

        // Additional predictions
        const totalXG = homeXG + awayXG;
        const over25Goals = Math.min(85, totalXG * 35);
        const bothTeamsScore = Math.min(80, (homeXG * awayXG) * 25);
        const matchQuality = Math.min(10, ((homeStats.ppg + awayStats.ppg) / 2) * 3.33);

        return {
            homeXG,
            awayXG,
            homeWinProb,
            drawProb,
            awayWinProb,
            predictedScore: `${predictedHomeGoals}-${predictedAwayGoals}`,
            keyFactors,
            confidence,
            over25Goals,
            bothTeamsScore,
            matchQuality: matchQuality.toFixed(1)
        };
    }

    calculateWinProbability(teamXG, opponentXG) {
        // Simplified probability model
        const scoreDiff = teamXG - opponentXG;
        let baseProb = 35; // Base probability

        if (scoreDiff > 0.5) baseProb += 20;
        if (scoreDiff > 1.0) baseProb += 15;
        if (scoreDiff < -0.5) baseProb -= 15;
        if (scoreDiff < -1.0) baseProb -= 10;

        return Math.max(10, Math.min(75, baseProb));
    }

    calculateSeasonProjection(team, teamData) {
        const avgXG = teamData.reduce((sum, match) => sum + (match.xG || 0), 0) / teamData.length;
        const avgXGA = teamData.reduce((sum, match) => sum + (match.xGA || 0), 0) / teamData.length;
        const currentPPG = teamData.reduce((sum, match) => sum + (match.pts || 0), 0) / teamData.length;

        const projectedPoints = currentPPG * 38;
        const projectedGoals = avgXG * 38;
        const projectedGA = avgXGA * 38;
        const xGDiff = avgXG - avgXGA;

        let expectedPosition = '10th-15th';
        let outlook = 'Mid-table finish expected';
        let clProbability = 0;
        let elProbability = 0;
        let relegationProbability = 0;

        if (projectedPoints > 75) {
            expectedPosition = 'Top 4';
            outlook = 'Champions League qualification likely';
            clProbability = 85;
            elProbability = 10;
        } else if (projectedPoints > 65) {
            expectedPosition = '5th-7th';
            outlook = 'Europa League contention';
            clProbability = 25;
            elProbability = 60;
        } else if (projectedPoints < 35) {
            expectedPosition = 'Bottom 3';
            outlook = 'Relegation battle';
            relegationProbability = 70;
        } else if (projectedPoints < 45) {
            expectedPosition = '15th-18th';
            outlook = 'Lower table, safety concerns';
            relegationProbability = 25;
        } else {
            elProbability = 15;
            relegationProbability = 5;
        }

        return {
            currentPPG,
            avgXG,
            avgXGA,
            xGDiff,
            projectedPoints,
            projectedGoals,
            projectedGA,
            expectedPosition,
            outlook,
            clProbability,
            elProbability,
            relegationProbability
        };
    }

    calculateGoalModel(team, teamData) {
        const avgXG = teamData.reduce((sum, match) => sum + (match.xG || 0), 0) / teamData.length;
        const avgGoals = teamData.reduce((sum, match) => sum + (match.scored || 0), 0) / teamData.length;
        const avgXGA = teamData.reduce((sum, match) => sum + (match.xGA || 0), 0) / teamData.length;

        const homeData = teamData.filter(match => match.h_a === 'h');
        const awayData = teamData.filter(match => match.h_a === 'a');

        const homeGoals = homeData.length > 0 ?
            homeData.reduce((sum, match) => sum + (match.xG || 0), 0) / homeData.length : avgXG * 1.1;
        const awayGoals = awayData.length > 0 ?
            awayData.reduce((sum, match) => sum + (match.xG || 0), 0) / awayData.length : avgXG * 0.9;

        const efficiency = avgGoals > 0 ? (avgGoals / avgXG) * 100 : 100;
        const scoringProb = Math.min(95, avgXG * 45); // Rough probability
        const cleanSheetProb = Math.max(5, (2 - avgXGA) * 30);

        const mostLikelyScore = `${Math.round(avgXG)}-${Math.round(avgXGA)}`;
        
        // Additional goal analysis
        const highScoringProb = Math.min(75, avgXG * 25);
        const goalVariance = teamData.reduce((sum, match) => sum + Math.pow((match.scored || 0) - avgGoals, 2), 0) / teamData.length;
        const consistency = goalVariance < 1 ? 'Very Consistent' : goalVariance < 2 ? 'Consistent' : 'Inconsistent';
        
        let bestPeriod = 'First Half';
        if (avgXG > 1.5) bestPeriod = 'Second Half';
        if (avgXG > 2.0) bestPeriod = 'Both Halves';

        return {
            homeGoals,
            awayGoals,
            avgGoals,
            efficiency,
            scoringProb,
            cleanSheetProb,
            mostLikelyScore,
            highScoringProb,
            consistency,
            bestPeriod
        };
    }

    analyzeForm(team, teamData) {
        // Take last 5 matches for form analysis
        const recentMatches = teamData.slice(-5);
        const recentPoints = recentMatches.reduce((sum, match) => sum + (match.pts || 0), 0);
        const recentPPG = recentPoints / recentMatches.length;
        const recentXG = recentMatches.reduce((sum, match) => sum + (match.xG || 0), 0) / recentMatches.length;
        const recentXGA = recentMatches.reduce((sum, match) => sum + (match.xGA || 0), 0) / recentMatches.length;

        let formRating = '';
        let momentum = 0;

        if (recentPPG >= 2.5) {
            formRating = '🔥 Excellent';
            momentum = 9;
        } else if (recentPPG >= 2.0) {
            formRating = '🟢 Very Good';
            momentum = 7.5;
        } else if (recentPPG >= 1.5) {
            formRating = '🟡 Good';
            momentum = 6;
        } else if (recentPPG >= 1.0) {
            formRating = '🟠 Average';
            momentum = 4.5;
        } else {
            formRating = '🔴 Poor';
            momentum = 2;
        }

        const allPPG = teamData.reduce((sum, match) => sum + (match.pts || 0), 0) / teamData.length;
        const trend = recentPPG > allPPG + 0.3 ? '📈 Improving' : 
                     recentPPG < allPPG - 0.3 ? '📉 Declining' : '➡️ Stable';

        const insights = [];
        if (recentXG > 2.0) insights.push('Strong attacking form');
        if (recentXGA < 1.0) insights.push('Solid defensive shape');
        if (recentPPG > 2.0) insights.push('Excellent recent results');
        if (recentPoints === 15) insights.push('Perfect recent form (5 wins)');
        if (recentPoints === 0) insights.push('Crisis form (5 losses)');
        if (recentXG - recentXGA > 1.0) insights.push('Dominating performances');

        // Additional form metrics
        const consistency = recentMatches.every(match => (match.pts || 0) >= 1) ? 'Very Consistent' : 'Inconsistent';
        const pressureRating = momentum > 7 ? 'Excellent under pressure' : momentum < 4 ? 'Struggles under pressure' : 'Average under pressure';
        const nextMatchConfidence = momentum > 7 ? 'High' : momentum < 4 ? 'Low' : 'Medium';

        return {
            formRating,
            trend,
            momentum,
            recentXG,
            recentXGA,
            recentPPG,
            insights,
            consistency,
            pressureRating,
            nextMatchConfidence
        };
    }

    predictFinalTable(leagueKey, leagueData) {
        // Get unique teams
        const teams = [...new Set(leagueData.map(match => match.title))].filter(team => team && team.trim() !== '');
        
        const predictions = teams.map(teamName => {
            const teamMatches = leagueData.filter(match => match.title === teamName);
            const stats = this.calculateSeasonProjection(teamName, teamMatches);
            
            return {
                name: teamName,
                projectedPoints: stats.projectedPoints,
                currentPPG: stats.currentPPG,
                xGDiff: stats.xGDiff,
                confidence: teamMatches.length > 15 ? 'High' : teamMatches.length > 8 ? 'Medium' : 'Low'
            };
        });

        // Sort by projected points
        return predictions.sort((a, b) => b.projectedPoints - a.projectedPoints);
    }

    calculateLeagueStats(predictions) {
        const topTeam = predictions[0];
        const secondTeam = predictions[1];
        const bottomTeam = predictions[predictions.length - 1];
        const secondBottomTeam = predictions[predictions.length - 2];

        const titleGap = topTeam.projectedPoints - secondTeam.projectedPoints;
        const relegationGap = secondBottomTeam.projectedPoints - bottomTeam.projectedPoints;
        
        const titleRace = titleGap < 3 ? 'Very tight title race' : titleGap < 8 ? 'Competitive title race' : 'Clear title favorite';
        const relegationBattle = relegationGap < 5 ? 'Fierce relegation battle' : 'Clear relegation candidates';
        
        const totalPoints = predictions.reduce((sum, team) => sum + team.projectedPoints, 0);
        const avgPoints = totalPoints / predictions.length;
        const avgPointsGap = predictions.reduce((sum, team, index) => {
            if (index === 0) return sum;
            return sum + (predictions[index - 1].projectedPoints - team.projectedPoints);
        }, 0) / (predictions.length - 1);

        return {
            titleRace,
            relegationBattle,
            avgPointsGap,
            avgPoints
        };
    }

    


    // Analyze specific team
    async analyzeTeam() {
        console.log('\n🔍 TEAM ANALYSIS');
        
        if (this.teams.length === 0) {
            console.log('❌ No teams available for analysis.');
            return;
        }

        this.showTeams();

        const teamChoice = await this.question('\nEnter team name (or part of it): ');
        const selectedTeam = this.teams.find(team =>
            team.toLowerCase().includes(teamChoice.toLowerCase())
        );

        if (!selectedTeam) {
            console.log('❌ Team not found! Try entering just part of the team name.');
            return;
        }

        const teamData = this.data.filter(row => row.title === selectedTeam);
        const league = teamData[0]?.league;
        const leagueConfig = this.leagueConfigs[league];

        console.log(`\n${leagueConfig?.color || '⚽'} ${selectedTeam} - ${leagueConfig?.name || 'Unknown League'}`);
        this.displayTeamStats(selectedTeam, teamData);

        // Show recent matches
        console.log('\n📅 RECENT MATCHES (Last 5):');
        teamData.slice(-5).forEach((match, index) => {
            const venue = match.h_a === 'h' ? 'vs' : match.h_a === 'a' ? '@' : '';
            const result = match.result ? match.result.toUpperCase() : 'N/A';
            const scored = match.scored || 0;
            const missed = match.missed || 0;
            const xG = match.xG ? match.xG.toFixed(2) : 'N/A';
            console.log(`  ${teamData.length - 4 + index}. ${match.date || 'No date'} ${venue} (${result}) - ${scored}-${missed} (xG: ${xG})`);
        });
    }

    // Display team statistics
    displayTeamStats(teamName, data) {
        const matches = data.length;
        const wins = data.filter(m => m.result === 'w').length;
        const draws = data.filter(m => m.result === 'd').length;
        const losses = data.filter(m => m.result === 'l').length;

        const totalScored = data.reduce((sum, m) => sum + (m.scored || 0), 0);
        const totalConceded = data.reduce((sum, m) => sum + (m.missed || 0), 0);
        const totalXG = data.reduce((sum, m) => sum + (m.xG || 0), 0);
        const totalXGA = data.reduce((sum, m) => sum + (m.xGA || 0), 0);
        const points = data.reduce((sum, m) => sum + (m.pts || 0), 0);

        console.log(`\n📊 ${teamName} STATISTICS:`);
        console.log(`Matches: ${matches} | W: ${wins} D: ${draws} L: ${losses}`);
        console.log(`Points: ${points} (${(points/(matches*3)*100).toFixed(1)}% of maximum)`);
        console.log(`Goals: ${totalScored} scored, ${totalConceded} conceded (${totalScored - totalConceded} difference)`);
        console.log(`xG: ${totalXG.toFixed(2)} for, ${totalXGA.toFixed(2)} against (${(totalXG - totalXGA).toFixed(2)} difference)`);
        console.log(`Avg per game: ${(totalScored/matches).toFixed(2)} goals, ${(totalXG/matches).toFixed(2)} xG`);
    }

    // Compare two teams
    async compareTeams() {
        console.log('\n⚔️ TEAM COMPARISON');
        
        if (this.teams.length === 0) {
            console.log('❌ No teams available for comparison.');
            return;
        }

        this.showTeams();

        const team1Choice = await this.question('\nSelect first team: ');
        const team2Choice = await this.question('Select second team: ');

        const team1 = this.teams.find(team => team.toLowerCase().includes(team1Choice.toLowerCase()));
        const team2 = this.teams.find(team => team.toLowerCase().includes(team2Choice.toLowerCase()));

        if (!team1 || !team2) {
            console.log('❌ One or both teams not found!');
            return;
        }

        const team1Data = this.data.filter(row => row.title === team1);
        const team2Data = this.data.filter(row => row.title === team2);

        const team1League = team1Data[0]?.leagueName || 'Unknown';
        const team2League = team2Data[0]?.leagueName || 'Unknown';

        console.log(`\n📊 COMPARISON: ${team1} (${team1League}) vs ${team2} (${team2League})`);
        console.log('='.repeat(80));

        this.compareStats(team1, team1Data, team2, team2Data);
    }

    // Compare statistics between two teams
    compareStats(team1Name, team1Data, team2Name, team2Data) {
        const getTeamStats = (data) => ({
            matches: data.length,
            wins: data.filter(m => m.result === 'w').length,
            points: data.reduce((s, m) => s + (m.pts || 0), 0),
            scored: data.reduce((s, m) => s + (m.scored || 0), 0),
            conceded: data.reduce((s, m) => s + (m.missed || 0), 0),
            avgXG: data.length > 0 ? (data.reduce((s, m) => s + (m.xG || 0), 0) / data.length) : 0
        });

        const team1Stats = getTeamStats(team1Data);
        const team2Stats = getTeamStats(team2Data);

        const stats = [
            { name: 'Matches', team1: team1Stats.matches, team2: team2Stats.matches },
            { name: 'Wins', team1: team1Stats.wins, team2: team2Stats.wins },
            { name: 'Points', team1: team1Stats.points, team2: team2Stats.points },
            { name: 'Goals Scored', team1: team1Stats.scored, team2: team2Stats.scored },
            { name: 'Goals Conceded', team1: team1Stats.conceded, team2: team2Stats.conceded },
            { name: 'Avg xG', team1: team1Stats.avgXG.toFixed(2), team2: team2Stats.avgXG.toFixed(2) }
        ];

        stats.forEach(stat => {
            const better = stat.team1 > stat.team2 ? '🟢' : stat.team1 < stat.team2 ? '🔴' : '🟡';
            const worse = stat.team2 > stat.team1 ? '🟢' : stat.team2 < stat.team1 ? '🔴' : '🟡';
            console.log(`${stat.name.padEnd(15)} ${better} ${team1Name}: ${stat.team1.toString().padStart(8)} | ${worse} ${team2Name}: ${stat.team2.toString().padStart(8)}`);
        });
    }

    // Show top performers
    async showTopPerformers() {
        console.log('\n🏆 TOP PERFORMERS ACROSS ALL LEAGUES');
        console.log('1. Highest xG average');
        console.log('2. Best goal difference');
        console.log('3. Most points per game');
        console.log('4. Best defensive record (lowest xGA)');

        const choice = await this.question('\nSelect category (1-4): ');

        if (this.teams.length === 0) {
            console.log('❌ No teams available for analysis.');
            return;
        }

        const teamStats = this.teams.map(team => {
            const teamData = this.data.filter(row => row.title === team);
            const matches = teamData.length;
            const league = teamData[0]?.leagueName || 'Unknown';

            return {
                team: team,
                league: league,
                matches: matches,
                avgXG: matches > 0 ? teamData.reduce((s, m) => s + (m.xG || 0), 0) / matches : 0,
                avgXGA: matches > 0 ? teamData.reduce((s, m) => s + (m.xGA || 0), 0) / matches : 0,
                goalDiff: teamData.reduce((s, m) => s + (m.scored || 0) - (m.missed || 0), 0),
                pointsPerGame: matches > 0 ? teamData.reduce((s, m) => s + (m.pts || 0), 0) / matches : 0,
                totalPoints: teamData.reduce((s, m) => s + (m.pts || 0), 0)
            };
        });

        let sortedStats;
        let title;

        switch(choice) {
            case '1':
                sortedStats = teamStats.sort((a, b) => b.avgXG - a.avgXG);
                title = 'HIGHEST xG AVERAGE';
                break;
            case '2':
                sortedStats = teamStats.sort((a, b) => b.goalDiff - a.goalDiff);
                title = 'BEST GOAL DIFFERENCE';
                break;
            case '3':
                sortedStats = teamStats.sort((a, b) => b.pointsPerGame - a.pointsPerGame);
                title = 'MOST POINTS PER GAME';
                break;
            case '4':
                sortedStats = teamStats.sort((a, b) => a.avgXGA - b.avgXGA);
                title = 'BEST DEFENSIVE RECORD (Lowest xGA)';
                break;
            default:
                console.log('❌ Invalid choice');
                return;
        }

        console.log(`\n🏆 ${title}:`);
        console.log('='.repeat(90));

        sortedStats.slice(0, 15).forEach((stat, index) => {
            let value;
            switch(choice) {
                case '1': value = stat.avgXG.toFixed(2); break;
                case '2': value = stat.goalDiff.toString(); break;
                case '3': value = stat.pointsPerGame.toFixed(2); break;
                case '4': value = stat.avgXGA.toFixed(2); break;
            }
            console.log(`${(index + 1).toString().padStart(2)}. ${stat.team.padEnd(20)} ${stat.league.padEnd(15)} ${value.padStart(8)} (${stat.matches} matches)`);
        });
    }

    // Filter matches
    async filterMatches() {
        console.log('\n🔍 FILTER MATCHES');
        console.log('1. By result (W/D/L)');
        console.log('2. By venue (Home/Away)');
        console.log('3. By goals scored');
        console.log('4. By xG value');
        console.log('5. By date range');
        console.log('6. By league');

        const choice = await this.question('\nSelect filter type (1-6): ');
        let filteredData = [];

        switch(choice) {
            case '1':
                const result = await this.question('Enter result (w/d/l): ');
                filteredData = this.data.filter(row => row.result === result.toLowerCase());
                break;
            case '2':
                const venue = await this.question('Enter venue (h for home, a for away): ');
                filteredData = this.data.filter(row => row.h_a === venue.toLowerCase());
                break;
            case '3':
                const goals = await this.question('Enter minimum goals scored: ');
                filteredData = this.data.filter(row => (row.scored || 0) >= parseInt(goals));
                break;
            case '4':
                const xg = await this.question('Enter minimum xG: ');
                filteredData = this.data.filter(row => (row.xG || 0) >= parseFloat(xg));
                break;
            case '5':
                const startDate = await this.question('Enter start date (YYYY-MM-DD): ');
                const endDate = await this.question('Enter end date (YYYY-MM-DD): ');
                filteredData = this.data.filter(row => row.date >= startDate && row.date <= endDate);
                break;
            case '6':
                console.log('\nAvailable leagues:');
                for (const [key, config] of Object.entries(this.leagueConfigs)) {
                    if (this.leagues.has(key)) {
                        console.log(`- ${key}: ${config.name}`);
                    }
                }
                const leagueKey = await this.question('Enter league key: ');
                filteredData = this.data.filter(row => row.league === leagueKey);
                break;
            default:
                console.log('❌ Invalid choice');
                return;
        }

        console.log(`\n📋 FILTERED RESULTS (${filteredData.length} matches):`);
        console.log('='.repeat(100));

        filteredData.slice(0, 20).forEach((match, index) => {
            const venue = match.h_a === 'h' ? 'H' : match.h_a === 'a' ? 'A' : '?';
            const result = match.result ? match.result.toUpperCase() : 'N/A';
            const league = match.leagueName || 'Unknown';
            const scored = match.scored || 0;
            const missed = match.missed || 0;
            const xG = match.xG ? match.xG.toFixed(2) : 'N/A';
            console.log(`${(index + 1).toString().padStart(2)}. ${match.title.padEnd(20)} ${league.padEnd(12)} ${venue} ${result} | ${match.date || 'No date'} | ${scored}-${missed} (xG: ${xG})`);
        });

        if (filteredData.length > 20) {
            console.log(`... and ${filteredData.length - 20} more matches`);
        }
    }

    // Compare leagues
    async compareLeagues() {
        console.log('\n🌍 LEAGUE COMPARISON');

        if (this.leagues.size === 0) {
            console.log('❌ No leagues loaded for comparison.');
            return;
        }

        const leagueStats = new Map();

        for (const [leagueKey, leagueData] of this.leagues) {
            const config = this.leagueConfigs[leagueKey];
            const matches = leagueData.length;
            const totalGoals = leagueData.reduce((sum, m) => sum + (m.scored || 0), 0);
            const totalXG = leagueData.reduce((sum, m) => sum + (m.xG || 0), 0);
            const homeWins = leagueData.filter(m => m.h_a === 'h' && m.result === 'w').length;
            const homeMatches = leagueData.filter(m => m.h_a === 'h').length;

            leagueStats.set(leagueKey, {
                name: config?.name || leagueKey,
                color: config?.color || '⚽',
                matches,
                avgGoals: matches > 0 ? totalGoals / matches : 0,
                avgXG: matches > 0 ? totalXG / matches : 0,
                homeWinRate: homeMatches > 0 ? (homeWins / homeMatches) * 100 : 0
            });
        }

        console.log('\n📊 LEAGUE STATISTICS:');
        console.log('='.repeat(80));
        console.log('League'.padEnd(20) + 'Matches'.padEnd(10) + 'Avg Goals'.padEnd(12) + 'Avg xG'.padEnd(10) + 'Home Win %');
        console.log('='.repeat(80));

        for (const [key, stats] of leagueStats) {
            console.log(
                `${stats.color} ${stats.name.padEnd(15)}`.padEnd(20) +
                stats.matches.toString().padEnd(10) +
                stats.avgGoals.toFixed(2).padEnd(12) +
                stats.avgXG.toFixed(2).padEnd(10) +
                stats.homeWinRate.toFixed(1) + '%'
            );
        }
    }

    // Show match details
    async showMatchDetails() {
        console.log('\n📋 MATCH DETAILS');
        
        if (this.data.length === 0) {
            console.log('❌ No match data available.');
            return;
        }

        const teamName = await this.question('Enter team name to see their matches: ');
        const team = this.teams.find(t => t.toLowerCase().includes(teamName.toLowerCase()));
        
        if (!team) {
            console.log('❌ Team not found!');
            return;
        }

        const teamMatches = this.data.filter(row => row.title === team);
        
        console.log(`\n📊 ALL MATCHES FOR ${team}:`);
        console.log('='.repeat(120));
        console.log('Match'.padEnd(6) + 'Date'.padEnd(12) + 'Venue'.padEnd(6) + 'Result'.padEnd(7) + 'Score'.padEnd(8) + 'xG'.padEnd(8) + 'xGA'.padEnd(8) + 'Points'.padEnd(7) + 'League');
        console.log('='.repeat(120));

        teamMatches.forEach((match, index) => {
            const venue = match.h_a === 'h' ? 'Home' : match.h_a === 'a' ? 'Away' : 'N/A';
            const result = match.result ? match.result.toUpperCase() : 'N/A';
            const score = `${match.scored || 0}-${match.missed || 0}`;
            const xG = match.xG ? match.xG.toFixed(2) : 'N/A';
            const xGA = match.xGA ? match.xGA.toFixed(2) : 'N/A';
            const points = match.pts || 0;
            const league = match.leagueName || 'Unknown';

            console.log(
                `${(index + 1).toString().padEnd(6)}` +
                `${(match.date || 'No date').padEnd(12)}` +
                `${venue.padEnd(6)}` +
                `${result.padEnd(7)}` +
                `${score.padEnd(8)}` +
                `${xG.padEnd(8)}` +
                `${xGA.padEnd(8)}` +
                `${points.toString().padEnd(7)}` +
                `${league}`
            );
        });
    }



// Statistics summary
async statisticsSummary() {
    console.log('\n📈 COMPREHENSIVE STATISTICS SUMMARY');
    console.log('='.repeat(80));

    if (this.data.length === 0) {
        console.log('❌ No data available for statistics.');
        return;
    }

    // Overall statistics
    const totalMatches = this.data.length;
    const totalTeams = this.teams.length;
    const totalLeagues = this.leagues.size;

    console.log(`\n🌍 OVERALL STATISTICS:`);
    console.log(`Total Matches: ${totalMatches.toLocaleString()}`);
    console.log(`Total Teams: ${totalTeams}`);
    console.log(`Total Leagues: ${totalLeagues}`);

    // League breakdown
    console.log(`\n🏆 LEAGUE BREAKDOWN:`);
    for (const [leagueKey, leagueData] of this.leagues) {
        const config = this.leagueConfigs[leagueKey];
        const uniqueTeams = new Set(leagueData.map(row => row.title).filter(Boolean));
        console.log(`${config?.color || '⚽'} ${config?.name || leagueKey}: ${leagueData.length} matches, ${uniqueTeams.size} teams`);
    }

    // Goal statistics
    const validMatches = this.data.filter(m => m.scored !== undefined && m.missed !== undefined);
    if (validMatches.length > 0) {
        const totalGoalsScored = validMatches.reduce((sum, m) => sum + (m.scored || 0), 0);
        const totalGoalsConceded = validMatches.reduce((sum, m) => sum + (m.missed || 0), 0);
        const avgGoalsPerMatch = totalGoalsScored / validMatches.length;

        console.log(`\n⚽ GOAL STATISTICS:`);
        console.log(`Total Goals: ${totalGoalsScored.toLocaleString()}`);
        console.log(`Average Goals per Match: ${avgGoalsPerMatch.toFixed(2)}`);
        console.log(`Highest Scoring Match: ${Math.max(...validMatches.map(m => (m.scored || 0) + (m.missed || 0)))} goals`);
    }

    // xG statistics
    const xgMatches = this.data.filter(m => m.xG !== undefined && m.xGA !== undefined);
    if (xgMatches.length > 0) {
        const totalXG = xgMatches.reduce((sum, m) => sum + (m.xG || 0), 0);
        const totalXGA = xgMatches.reduce((sum, m) => sum + (m.xGA || 0), 0);
        const avgXG = totalXG / xgMatches.length;
        const avgXGA = totalXGA / xgMatches.length;

        console.log(`\n📊 xG STATISTICS:`);
        console.log(`Average xG per Match: ${avgXG.toFixed(2)}`);
        console.log(`Average xGA per Match: ${avgXGA.toFixed(2)}`);
        console.log(`Total xG Across All Matches: ${totalXG.toFixed(2)}`);
    }

    // Result distribution
    const resultsWithData = this.data.filter(m => m.result);
    if (resultsWithData.length > 0) {
        const wins = resultsWithData.filter(m => m.result === 'w').length;
        const draws = resultsWithData.filter(m => m.result === 'd').length;
        const losses = resultsWithData.filter(m => m.result === 'l').length;

        console.log(`\n🎯 RESULT DISTRIBUTION:`);
        console.log(`Wins: ${wins} (${(wins/resultsWithData.length*100).toFixed(1)}%)`);
        console.log(`Draws: ${draws} (${(draws/resultsWithData.length*100).toFixed(1)}%)`);
        console.log(`Losses: ${losses} (${(losses/resultsWithData.length*100).toFixed(1)}%)`);
    }

    // Home vs Away performance
    const homeAwayMatches = this.data.filter(m => m.h_a && m.result);
    if (homeAwayMatches.length > 0) {
        const homeMatches = homeAwayMatches.filter(m => m.h_a === 'h');
        const awayMatches = homeAwayMatches.filter(m => m.h_a === 'a');
        
        const homeWins = homeMatches.filter(m => m.result === 'w').length;
        const awayWins = awayMatches.filter(m => m.result === 'w').length;

        console.log(`\n🏠 HOME vs AWAY PERFORMANCE:`);
        console.log(`Home Matches: ${homeMatches.length}`);
        console.log(`Away Matches: ${awayMatches.length}`);
        if (homeMatches.length > 0) {
            console.log(`Home Win Rate: ${(homeWins/homeMatches.length*100).toFixed(1)}%`);
        }
        if (awayMatches.length > 0) {
            console.log(`Away Win Rate: ${(awayWins/awayMatches.length*100).toFixed(1)}%`);
        }
    }

    // Top performing teams summary
    console.log(`\n🌟 TOP TEAMS SUMMARY:`);
    
    const teamStats = this.teams.map(team => {
        const teamData = this.data.filter(row => row.title === team);
        const matches = teamData.length;
        return {
            team: team,
            league: teamData[0]?.leagueName || 'Unknown',
            matches: matches,
            points: teamData.reduce((s, m) => s + (m.pts || 0), 0),
            ppg: matches > 0 ? teamData.reduce((s, m) => s + (m.pts || 0), 0) / matches : 0
        };
    });

    const topTeams = teamStats
        .filter(t => t.matches >= 10) // Minimum 10 matches
        .sort((a, b) => b.ppg - a.ppg)
        .slice(0, 5);

    topTeams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.team} (${team.league}): ${team.ppg.toFixed(2)} PPG`);
    });

    // Data quality report
    console.log(`\n🔍 DATA QUALITY REPORT:`);
    const missingTeamNames = this.data.filter(m => !m.title || m.title.trim() === '').length;
    const missingResults = this.data.filter(m => !m.result).length;
    const missingXG = this.data.filter(m => m.xG === undefined || m.xG === null).length;
    const missingDates = this.data.filter(m => !m.date).length;

    console.log(`Missing Team Names: ${missingTeamNames} (${(missingTeamNames/totalMatches*100).toFixed(1)}%)`);
    console.log(`Missing Results: ${missingResults} (${(missingResults/totalMatches*100).toFixed(1)}%)`);
    console.log(`Missing xG Data: ${missingXG} (${(missingXG/totalMatches*100).toFixed(1)}%)`);
    console.log(`Missing Dates: ${missingDates} (${(missingDates/totalMatches*100).toFixed(1)}%)`);

    if (this.loadErrors.length > 0) {
        console.log(`\n⚠️ LOAD ERRORS:`);
        this.loadErrors.forEach(error => {
            console.log(`${error.league}: ${error.error}`);
        });
    }
}




// Main application loop
async run() {
    console.log('⚽ Welcome to Multi-League Football Data Explorer!');
    console.log('='.repeat(60));
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Load specific files/URLs provided as arguments
        console.log('📁 Loading data from provided sources...');
        const sources = {};
        args.forEach((arg, index) => {
            sources[`custom-league-${index + 1}`] = arg;
        });
        
        try {
            await this.loadMultipleLeagues(sources);
        } catch (error) {
            console.error('❌ Error loading data:', error.message);
            console.log('Continuing with any successfully loaded data...');
        }
    } else {
        // Load default leagues
        console.log('📡 Loading default European leagues...');
        try {
            await this.loadDefaultLeagues();
        } catch (error) {
            console.error('❌ Error loading default leagues. Some leagues may not be available.');
            console.log('You can load additional leagues manually using option 10.');
        }
    }

    // Check if we have any data loaded
    if (this.data.length === 0) {
        console.log('\n⚠️ No data was loaded successfully.');
        console.log('You can try:');
        console.log('1. Check your internet connection');
        console.log('2. Load data from local files using option 10');
        console.log('3. Provide CSV file paths as command line arguments');
        console.log('\nContinuing with empty dataset...\n');
    }

    // Main application loop
    while (true) {
        this.showMenu();
        const choice = await this.question('\nEnter your choice: ');
        
        try {
            switch (choice) {
                case '1':
                    this.showTeams();
                    break;
                case '2':
                    await this.analyzeTeam();
                    break;
                case '3':
                    await this.compareTeams();
                    break;
                case '4':
                    await this.showTopPerformers();
                    break;
                case '5':
                    await this.filterMatches();
                    break;
                case '6':
                    await this.compareLeagues();
                    break;
                case '7':
                    await this.showMatchDetails();
                    break;
                case '8':
                    await this.statisticsSummary();
                    break;
                case '9':
                    await this.showFormTable();
                    break;
                case '10':
                    this.showPerformanceTrends();
                    break;
                case '11':
                    await this.showPredictions();
                    break;
                case '0':
                    console.log('\n👋 Thanks for using Football Data Explorer!');
                    console.log('⚽ Keep analyzing those stats!');
                    this.rl.close();
                    process.exit(0);
                    break;
                default:
                    console.log('❌ Invalid choice. Please select a number from 0-11.');
            }
        } catch (error) {
            console.error(`❌ An error occurred: ${error.message}`);
            console.log('Please try again or contact support if the issue persists.');
        }

        // Wait for user input before showing menu again
        await this.question('\n📎 Press Enter to continue...');
        console.clear(); // Clear console for better UX
    }
}

// Helper method to ask questions
question(query) {
    return new Promise((resolve) => {
        this.rl.question(query, resolve);
    });
}

// Graceful shutdown handler
handleShutdown() {
    console.log('\n\n🛑 Shutting down Football Data Explorer...');
    if (this.rl) {
        this.rl.close();
    }
    process.exit(0);
}
}

// Main function to run the application
async function main() {
    console.log('🚀 Initializing Football Data Explorer...\n');
    
    // Create explorer instance
    const explorer = new FootballDataExplorer();
    
    // Set up graceful shutdown handlers
    process.on('SIGINT', () => explorer.handleShutdown());
    process.on('SIGTERM', () => explorer.handleShutdown());
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        console.log('The application will continue running...');
    });
    
    try {
        // Run the main application
        await explorer.run();
    } catch (error) {
        console.error('❌ Fatal error occurred:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Check your internet connection');
        console.log('2. Verify CSV file formats and URLs');
        console.log('3. Ensure you have proper file permissions');
        console.log('4. Try running with local CSV files');
        
        process.exit(1);
    }
}

// Command line help
function showHelp() {
    console.log('⚽ Football Data Explorer - Help');
    console.log('================================');
    console.log('');
    console.log('Usage:');
    console.log('  node football-explorer.js [csv-file1] [csv-file2] [url1] [url2]...');
    console.log('');
    console.log('Examples:');
    console.log('  node football-explorer.js');
    console.log('  node football-explorer.js ./my-league.csv');
    console.log('  node football-explorer.js https://example.com/data.csv ./local-data.csv');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('  --version, -v Show version information');
    console.log('');
    console.log('Features:');
    console.log('  • Load data from multiple CSV sources');
    console.log('  • Analyze team performance across leagues');
    console.log('  • Compare teams and leagues');
    console.log('  • Export filtered data');
    console.log('  • Comprehensive statistics');
    console.log('');
}

// Version information
function showVersion() {
    console.log('Football Data Explorer v1.0.0');
    console.log('A comprehensive tool for football/soccer data analysis');
    console.log('Supports multiple leagues and advanced statistics');
}

// Check command line arguments for help or version
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
}

// Export the class and main function
export { FootballDataExplorer, main };
export default FootballDataExplorer;

// Run the application if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('❌ Application failed to start:', error.message);
        process.exit(1);
    });
}
