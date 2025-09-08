
import { Boom } from '@hapi/boom'
import NodeCache from '@cacheable/node-cache'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import readline from 'readline'
import makeWASocket, {
    AnyMessageContent,
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    WAMessageContent,
    WAMessageKey,
    downloadMediaMessage,
    proto
} from '../src'
import * as QRCode from 'qrcode-terminal'
import P from 'pino'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import https from 'https'
import csv from 'csv-parser'
import fetch from 'node-fetch'
import { Readable } from 'stream'
import { createCanvas } from '@napi-rs/canvas';
import * as math from 'mathjs';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import chalk from 'chalk'
import google from 'googlethis'
import { promises as fsPromises } from 'fs'



import { SpreadsheetCalculator } from '../lib/spreadsheet.js'
import GraphingCalculatorGame from './graph.js'
// Import the Enhanced Statistical Workbook

// Import the Statistical Distributions class directly
// Import the Enhanced Statistical Workbook
import { EnhancedStatisticalWorkbook } from './workbook.js'
// Import QuadraticMathematicalWorkbook
import { QuadraticMathematicalWorkbook } from './QuadraticMathematicalWorkbook.js'


// Import YouTube functions
import {
    getYoutubeVideoInfo,
    getYoutubeMP4,
    getYoutubeMP3,
    getRelatedVideos,
    getYoutubeTrending,
    getYoutubeThumbnail
} from '../lib/youtube.js'

// Import RPG game functions and data
import { 
    findUserRpg, 
    editRpg, 
    findUser, 
    expUpdate 
} from './schema.js'

import {
    isNumber,
    blacksmith,
    shopItems,
    createRewards,
    inventoryDisplay,
    LOCATION_DATABASES,
    LOCATION_QUESTIONS,
    ADVENTURE_LOCATIONS,
    EVENT_DIFFICULTIES,
    LOCATION_ORDER,
    DIFFICULTIES,
    DIFFICULTY_INDEX
} from './gameData.js'


import express from 'express'


const app = new express();
let PORT = process.env.PORT || 3000

app.get('/', function (req, res) {
  res.send('your Jojosc music Whatsapp website is online at musicdynansty-3147b60a229f.herokuapp');
});


// FootballDataExplorer class
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
        this.leagueConfigs = {
            'epl': {
                name: 'Premier League',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/02629107bf7b037ca64c0e737893e5417694bcc5/premier_league_detailed_data.csv',
                color: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
            },
            'serie-a': {
                name: 'Serie A',
                url: 'https://raw.githubusercontent.com/Timvane-coder/MySite-/111e1d61cffac7f888e4c7d2d5bd0b21b61358d4/seriea_detailed_data.csv',
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

    async loadCSV(source, leagueKey = null) {
        return new Promise(async (resolve, reject) => {
            const results = [];
            let stream;
            let headers = [];
            try {
                if (source.startsWith('http')) {
                    this.log(`📡 Fetching data from ${this.leagueConfigs[leagueKey]?.name || leagueKey}...`);
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
                    if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
                        throw new Error('Received HTML page instead of CSV. URL might be incorrect.');
                    }
                    stream = Readable.from([text]);
                } else {
                    if (!fs.existsSync(source)) {
                        throw new Error(`File not found: ${source}`);
                    }
                    this.log(`📁 Loading data from ${source}...`);
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
                        const cleanData = {};
                        Object.keys(data).forEach(key => {
                            const cleanKey = key.trim();
                            const cleanValue = typeof data[key] === 'string' ? data[key].trim() : data[key];
                            cleanData[cleanKey] = cleanValue;
                        });
                        let teamName = cleanData.title || cleanData.team || cleanData.name ||
                            cleanData.Team || cleanData.Title || cleanData.NAME ||
                            cleanData.club || cleanData.Club;
                        if (teamName) {
                            cleanData.title = teamName;
                        }
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
                        if (leagueKey) {
                            cleanData.league = leagueKey;
                            cleanData.leagueName = this.leagueConfigs[leagueKey]?.name || leagueKey;
                        }
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
                            this.log(`✅ Loaded ${results.length} matches for ${this.leagueConfigs[leagueKey]?.name || leagueKey} (${validTeams.length} with team names)`);
                        }
                        resolve(results);
                    })
                    .on('error', (error) => {
                        this.loadErrors.push({ league: leagueKey, error: error.message });
                        reject(error);
                    });
            } catch (error) {
                this.loadErrors.push({ league: leagueKey, error: error.message });
                reject(error);
            }
        });
    }

    async loadMultipleLeagues(sources) {
        this.log('🌍 Loading multiple leagues...\n');
        this.loadErrors = [];
        for (const [leagueKey, source] of Object.entries(sources)) {
            try {
                const leagueData = await this.loadCSV(source, leagueKey);
                this.data.push(...leagueData);
            } catch (error) {
                this.log(`❌ Error loading ${this.leagueConfigs[leagueKey]?.name || leagueKey}: ${error.message}`);
            }
        }
        const allTitles = this.data.map(row => row.title).filter(title => title && title.trim() !== '' && title !== 'undefined');
        this.teams = [...new Set(allTitles)].sort();
        this.log(`\n🏆 Total: ${this.data.length} matches across ${this.leagues.size} leagues`);
        this.log(`👥 ${this.teams.length} unique teams loaded`);
        return this.data;
    }

    async loadDefaultLeagues() {
        const sources = {};
        for (const [key, config] of Object.entries(this.leagueConfigs)) {
            sources[key] = config.url;
        }
        return this.loadMultipleLeagues(sources);
    }

    showMenu() {
        this.log('\n⚽ FOOTBALL DATA EXPLORER - MULTI LEAGUE');
        this.log('========================================');
        this.log('1. Show all teams');
        this.log('2. Analyze specific team');
        this.log('3. Compare two teams');
        this.log('4. Show top performers');
        this.log('5. Filter matches');
        this.log('6. League comparison');
        this.log('7. Show match details');
        this.log('8. Statistics summary');
        this.log('9. 📈 Form Table Analysis');
        this.log('10. 📊 Performance Trends');
        this.log('11. 🔮 Match Predictions');
        this.log('0. Exit');
        this.log('========================================');
    }

    showTeams() {
        this.log('\n📋 TEAMS BY LEAGUE:');
        if (this.teams.length === 0) {
            this.log('❌ No teams available. Try option 11 to debug.');
            return;
        }
        for (const [leagueKey, leagueData] of this.leagues) {
            const config = this.leagueConfigs[leagueKey];
            const leagueTeams = [...new Set(leagueData
                .map(row => row.title)
                .filter(team => team && team !== 'undefined' && team.trim() !== '')
            )].sort();
            this.log(`\n${config?.color || '⚽'} ${config?.name || leagueKey.toUpperCase()}:`);
            if (leagueTeams.length === 0) {
                this.log('  ❌ No valid team names found in this league');
            } else {
                leagueTeams.forEach((team, index) => {
                    const teamMatches = leagueData.filter(row => row.title === team);
                    this.log(`  ${index + 1}. ${team} (${teamMatches.length} matches)`);
                });
            }
        }
    }

    getTeamByChoice(choice) {
        if (!choice || choice.trim() === '') return null;
        const choiceStr = choice.trim();
        const choiceNum = parseInt(choiceStr);
        if (!isNaN(choiceNum) && choiceNum > 0 && choiceNum <= this.teams.length) {
            return this.teams[choiceNum - 1];
        }
        let team = this.teams.find(t => t.toLowerCase() === choiceStr.toLowerCase());
        if (team) return team;
        team = this.teams.find(t => t.toLowerCase().includes(choiceStr.toLowerCase()));
        return team;
    }

    async showFormTable() {
        const numMatches = await this.question('Enter number of recent matches to analyze (default 5): ') || '5';
        let n = parseInt(numMatches);
        if (isNaN(n) || n <= 0) {
            this.log('❌ Invalid number of matches. Using default value of 5.');
            n = 5;
        }
        this.log('\n📊 Calculating form table...');
        const formTable = this.teams.map(team => {
            const teamData = this.data.filter(row => row.title === team);
            if (teamData.length === 0) {
                return null;
            }
            const sortedData = teamData.sort((a, b) => {
                if (a.date && b.date) {
                    return new Date(a.date) - new Date(b.date);
                }
                return 0;
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
        this.log(`\n📈 FORM TABLE (Last ${n} matches):`);
        this.log('='.repeat(85));
        this.log('Pos Team                  Pts  W  D  L  Form      Avg xG  Avg xGA');
        this.log('-'.repeat(85));
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
            this.log(`${pos}  ${name} ${points} ${wins} ${draws} ${losses} ${form} ${avgXG} ${avgXGA}`);
        });
        this.log('\nForm Guide: W = Win, D = Draw, L = Loss, U = Unknown');
        this.log('Teams are sorted by points in their last ' + n + ' matches.');
    }

    async showPerformanceTrends() {
        this.showTeams();
        const teamChoice = await this.question('\nSelect team for trend analysis: ');
        const team = this.getTeamByChoice(teamChoice);
        if (!team) {
            this.log('❌ Team not found!');
            return;
        }
        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            this.log('❌ No data found for this team!');
            return;
        }
        const sortedData = teamData.sort((a, b) => {
            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            }
            return 0;
        });
        this.log(`\n📈 PERFORMANCE TRENDS - ${team}:`);
        this.log('='.repeat(70));
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
        this.log('Match Date         xG(5)  xGA(5) xGD(5) Pts(5) Form');
        this.log('-'.repeat(70));
        const displayTrends = trends.slice(-15);
        displayTrends.forEach(trend => {
            const matchNum = trend.matchNum.toString().padStart(2);
            const date = trend.date.toString().substring(0, 10).padEnd(10);
            const avgXG = trend.avgXG.padStart(5);
            const avgXGA = trend.avgXGA.padStart(6);
            const xGDiff = trend.xGDiff.padStart(6);
            const points = trend.points.toString().padStart(6);
            const form = trend.form.padEnd(5);
            this.log(`${matchNum}    ${date} ${avgXG} ${avgXGA} ${xGDiff} ${points} ${form}`);
        });
        if (trends.length > 0) {
            const latestTrend = trends[trends.length - 1];
            const firstTrend = trends[0];
            this.log(`\n📊 TREND SUMMARY:`);
            this.log(`Recent form (${windowSize} games): ${latestTrend.form}`);
            this.log(`Current xG average: ${latestTrend.avgXG}`);
            this.log(`Current xGA average: ${latestTrend.avgXGA}`);
            this.log(`xG difference trend: ${parseFloat(latestTrend.xGDiff) > 0 ? '📈 Positive' : '📉 Negative'}`);
        }
    }

    async analyzeTeam() {
        this.log('\n🔍 TEAM ANALYSIS');
        if (this.teams.length === 0) {
            this.log('❌ No teams available for analysis.');
            return;
        }
        this.showTeams();
        const teamChoice = await this.question('\nEnter team name (or part of it): ');
        const selectedTeam = this.teams.find(team =>
            team.toLowerCase().includes(teamChoice.toLowerCase()));
        if (!selectedTeam) {
            this.log('❌ Team not found! Try entering just part of the team name.');
            return;
        }
        const teamData = this.data.filter(row => row.title === selectedTeam);
        const league = teamData[0]?.league;
        const leagueConfig = this.leagueConfigs[league];
        this.log(`\n${leagueConfig?.color || '⚽'} ${selectedTeam} - ${leagueConfig?.name || 'Unknown League'}`);
        this.displayTeamStats(selectedTeam, teamData);
        this.log('\n📅 RECENT MATCHES (Last 5):');
        teamData.slice(-5).forEach((match, index) => {
            const venue = match.h_a === 'h' ? 'vs' : match.h_a === 'a' ? '@' : '';
            const result = match.result ? match.result.toUpperCase() : 'N/A';
            const scored = match.scored || 0;
            const missed = match.missed || 0;
            const xG = match.xG ? match.xG.toFixed(2) : 'N/A';
            this.log(`  ${teamData.length - 4 + index}. ${match.date || 'No date'} ${venue} (${result}) - ${scored}-${missed} (xG: ${xG})`);
        });
    }

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
        this.log(`\n📊 ${teamName} STATISTICS:`);
        this.log(`Matches: ${matches} | W: ${wins} D: ${draws} L: ${losses}`);
        this.log(`Points: ${points} (${(points / (matches * 3) * 100).toFixed(1)}% of maximum)`);
        this.log(`Goals: ${totalScored} scored, ${totalConceded} conceded (${totalScored - totalConceded} difference)`);
        this.log(`xG: ${totalXG.toFixed(2)} for, ${totalXGA.toFixed(2)} against (${(totalXG - totalXGA).toFixed(2)} difference)`);
        this.log(`Avg per game: ${(totalScored / matches).toFixed(2)} goals, ${(totalXG / matches).toFixed(2)} xG`);
    }

    async compareTeams() {
        this.log('\n⚔️ TEAM COMPARISON');
        if (this.teams.length === 0) {
            this.log('❌ No teams available for comparison.');
            return;
        }
        this.showTeams();
        const team1Choice = await this.question('\nSelect first team: ');
        const team2Choice = await this.question('Select second team: ');
        const team1 = this.teams.find(team => team.toLowerCase().includes(team1Choice.toLowerCase()));
        const team2 = this.teams.find(team => team.toLowerCase().includes(team2Choice.toLowerCase()));
        if (!team1 || !team2) {
            this.log('❌ One or both teams not found!');
            return;
        }
        const team1Data = this.data.filter(row => row.title === team1);
        const team2Data = this.data.filter(row => row.title === team2);
        const team1League = team1Data[0]?.leagueName || 'Unknown';
        const team2League = team2Data[0]?.leagueName || 'Unknown';
        this.log(`\n📊 COMPARISON: ${team1} (${team1League}) vs ${team2} (${team2League})`);
        this.log('='.repeat(80));
        this.compareStats(team1, team1Data, team2, team2Data);
    }

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
            this.log(`${stat.name.padEnd(15)} ${better} ${team1Name}: ${stat.team1.toString().padStart(8)} | ${worse} ${team2Name}: ${stat.team2.toString().padStart(8)}`);
        });
    }

    async showTopPerformers() {
        this.log('\n🏆 TOP PERFORMERS ACROSS ALL LEAGUES');
        this.log('1. Highest xG average');
        this.log('2. Best goal difference');
        this.log('3. Most points per game');
        this.log('4. Best defensive record (lowest xGA)');
        const choice = await this.question('\nSelect category (1-4): ');
        if (this.teams.length === 0) {
            this.log('❌ No teams available for analysis.');
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
        switch (choice) {
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
                this.log('❌ Invalid choice');
                return;
        }
        this.log(`\n🏆 ${title}:`);
        this.log('='.repeat(90));
        sortedStats.slice(0, 15).forEach((stat, index) => {
            let value;
            switch (choice) {
                case '1': value = stat.avgXG.toFixed(2); break;
                case '2': value = stat.goalDiff.toString(); break;
                case '3': value = stat.pointsPerGame.toFixed(2); break;
                case '4': value = stat.avgXGA.toFixed(2); break;
            }
            this.log(`${(index + 1).toString().padStart(2)}. ${stat.team.padEnd(20)} ${stat.league.padEnd(15)} ${value.padStart(8)} (${stat.matches} matches)`);
        });
    }

    async compareLeagues() {
        this.log('\n🌍 LEAGUE COMPARISON');
        if (this.leagues.size === 0) {
            this.log('❌ No leagues loaded for comparison.');
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
        this.log('\n📊 LEAGUE STATISTICS:');
        this.log('='.repeat(80));
        this.log('League'.padEnd(20) + 'Matches'.padEnd(10) + 'Avg Goals'.padEnd(12) + 'Avg xG'.padEnd(10) + 'Home Win %');
        this.log('='.repeat(80));
        for (const [key, stats] of leagueStats) {
            this.log(
                `${stats.color} ${stats.name.padEnd(15)}`.padEnd(20) +
                stats.matches.toString().padEnd(10) +
                stats.avgGoals.toFixed(2).padEnd(12) +
                stats.avgXG.toFixed(2).padEnd(10) +
                stats.homeWinRate.toFixed(1) + '%'
            );
        }
    }

    async showMatchDetails() {
        this.log('\n📋 MATCH DETAILS');
        if (this.data.length === 0) {
            this.log('❌ No match data available.');
            return;
        }
        const teamName = await this.question('Enter team name to see their matches: ');
        const team = this.teams.find(t => t.toLowerCase().includes(teamName.toLowerCase()));
        if (!team) {
            this.log('❌ Team not found!');
            return;
        }
        const teamMatches = this.data.filter(row => row.title === team);
        this.log(`\n📊 ALL MATCHES FOR ${team}:`);
        this.log('='.repeat(120));
        this.log('Match'.padEnd(6) + 'Date'.padEnd(12) + 'Venue'.padEnd(6) + 'Result'.padEnd(7) + 'Score'.padEnd(8) + 'xG'.padEnd(8) + 'xGA'.padEnd(8) + 'Points'.padEnd(7) + 'League');
        this.log('='.repeat(120));
        teamMatches.forEach((match, index) => {
            const venue = match.h_a === 'h' ? 'Home' : match.h_a === 'a' ? 'Away' : 'N/A';
            const result = match.result ? match.result.toUpperCase() : 'N/A';
            const score = `${match.scored || 0}-${match.missed || 0}`;
            const xG = match.xG ? match.xG.toFixed(2) : 'N/A';
            const xGA = match.xGA ? match.xGA.toFixed(2) : 'N/A';
            const points = match.pts || 0;
            const league = match.leagueName || 'Unknown';
            this.log(
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

    async statisticsSummary() {
        this.log('\n📈 COMPREHENSIVE STATISTICS SUMMARY');
        this.log('='.repeat(80));
        if (this.data.length === 0) {
            this.log('❌ No data available for statistics.');
            return;
        }
        const totalMatches = this.data.length;
        const totalTeams = this.teams.length;
        const totalLeagues = this.leagues.size;
        this.log(`\n🌍 OVERALL STATISTICS:`);
        this.log(`Total Matches: ${totalMatches.toLocaleString()}`);
        this.log(`Total Teams: ${totalTeams}`);
        this.log(`Total Leagues: ${totalLeagues}`);
        this.log(`\n🏆 LEAGUE BREAKDOWN:`);
        for (const [leagueKey, leagueData] of this.leagues) {
            const config = this.leagueConfigs[leagueKey];
            const uniqueTeams = new Set(leagueData.map(row => row.title).filter(Boolean));
            this.log(`${config?.color || '⚽'} ${config?.name || leagueKey}: ${leagueData.length} matches, ${uniqueTeams.size} teams`);
        }
        const validMatches = this.data.filter(m => m.scored !== undefined && m.missed !== undefined);
        if (validMatches.length > 0) {
            const totalGoalsScored = validMatches.reduce((sum, m) => sum + (m.scored || 0), 0);
            const totalGoalsConceded = validMatches.reduce((sum, m) => sum + (m.missed || 0), 0);
            const avgGoalsPerMatch = totalGoalsScored / validMatches.length;
            this.log(`\n⚽ GOAL STATISTICS:`);
            this.log(`Total Goals: ${totalGoalsScored.toLocaleString()}`);
            this.log(`Average Goals per Match: ${avgGoalsPerMatch.toFixed(2)}`);
            this.log(`Highest Scoring Match: ${Math.max(...validMatches.map(m => (m.scored || 0) + (m.missed || 0)))} goals`);
        }
        const xgMatches = this.data.filter(m => m.xG !== undefined && m.xGA !== undefined);
        if (xgMatches.length > 0) {
            const totalXG = xgMatches.reduce((sum, m) => sum + (m.xG || 0), 0);
            const totalXGA = xgMatches.reduce((sum, m) => sum + (m.xGA || 0), 0);
            const avgXG = totalXG / xgMatches.length;
            const avgXGA = totalXGA / xgMatches.length;
            this.log(`\n📊 xG STATISTICS:`);
            this.log(`Average xG per Match: ${avgXG.toFixed(2)}`);
            this.log(`Average xGA per Match: ${avgXGA.toFixed(2)}`);
            this.log(`Total xG Across All Matches: ${totalXG.toFixed(2)}`);
        }
        const resultsWithData = this.data.filter(m => m.result);
        if (resultsWithData.length > 0) {
            const wins = resultsWithData.filter(m => m.result === 'w').length;
            const draws = resultsWithData.filter(m => m.result === 'd').length;
            const losses = resultsWithData.filter(m => m.result === 'l').length;
            this.log(`\n🎯 RESULT DISTRIBUTION:`);
            this.log(`Wins: ${wins} (${(wins / resultsWithData.length * 100).toFixed(1)}%)`);
            this.log(`Draws: ${draws} (${(draws / resultsWithData.length * 100).toFixed(1)}%)`);
            this.log(`Losses: ${losses} (${(losses / resultsWithData.length * 100).toFixed(1)}%)`);
        }
        const homeAwayMatches = this.data.filter(m => m.h_a && m.result);
        if (homeAwayMatches.length > 0) {
            const homeMatches = homeAwayMatches.filter(m => m.h_a === 'h');
            const awayMatches = homeAwayMatches.filter(m => m.h_a === 'a');
            const homeWins = homeMatches.filter(m => m.result === 'w').length;
            const awayWins = awayMatches.filter(m => m.result === 'w').length;
            this.log(`\n🏠 HOME vs AWAY PERFORMANCE:`);
            this.log(`Home Matches: ${homeMatches.length}`);
            this.log(`Away Matches: ${awayMatches.length}`);
            if (homeMatches.length > 0) {
                this.log(`Home Win Rate: ${(homeWins / homeMatches.length * 100).toFixed(1)}%`);
            }
            if (awayMatches.length > 0) {
                this.log(`Away Win Rate: ${(awayWins / awayMatches.length * 100).toFixed(1)}%`);
            }
        }
        this.log(`\n🌟 TOP TEAMS SUMMARY:`);
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
            .filter(t => t.matches >= 10)
            .sort((a, b) => b.ppg - a.ppg)
            .slice(0, 5);
        topTeams.forEach((team, index) => {
            this.log(`${index + 1}. ${team.team} (${team.league}): ${team.ppg.toFixed(2)} PPG`);
        });
        this.log(`\n🔍 DATA QUALITY REPORT:`);
        const missingTeamNames = this.data.filter(m => !m.title || m.title.trim() === '').length;
        const missingResults = this.data.filter(m => !m.result).length;
        const missingXG = this.data.filter(m => m.xG === undefined || m.xG === null).length;
        const missingDates = this.data.filter(m => !m.date).length;
        this.log(`Missing Team Names: ${missingTeamNames} (${(missingTeamNames / totalMatches * 100).toFixed(1)}%)`);
        this.log(`Missing Results: ${missingResults} (${(missingResults / totalMatches * 100).toFixed(1)}%)`);
        this.log(`Missing xG Data: ${missingXG} (${(missingXG / totalMatches * 100).toFixed(1)}%)`);
        this.log(`Missing Dates: ${missingDates} (${(missingDates / totalMatches * 100).toFixed(1)}%)`);
        if (this.loadErrors.length > 0) {
            this.log(`\n⚠️ LOAD ERRORS:`);
            this.loadErrors.forEach(error => {
                this.log(`${error.league}: ${error.error}`);
            });
        }
    }

    async showPredictions() {
        this.log('\n🔮 MATCH PREDICTOR & PROJECTIONS');
        this.log('================================');
        this.log('1. Predict next match outcome');
        this.log('2. Season projection');
        this.log('3. Goal prediction model');
        this.log('4. Team form analysis');
        this.log('5. League position predictor');
        this.log('0. Back to main menu');
        const choice = await this.question('\nSelect prediction type (0-5): ');
        switch (choice) {
            case '1': await this.predictMatch(); break;
            case '2': await this.projectSeason(); break;
            case '3': await this.predictGoals(); break;
            case '4': await this.analyzeTeamForm(); break;
            case '5': await this.predictLeaguePositions(); break;
            case '0': return;
            default: this.log('❌ Invalid choice. Please select 0-5.');
        }
    }

    async predictMatch() {
        this.log('\n🔮 MATCH OUTCOME PREDICTOR');
        this.log('='.repeat(50));
        this.showTeams();
        const team1Choice = await this.question('\nEnter home team name or number: ');
        const team2Choice = await this.question('Enter away team name or number: ');
        const homeTeam = this.getTeamByChoice(team1Choice);
        const awayTeam = this.getTeamByChoice(team2Choice);
        if (!homeTeam || !awayTeam) {
            this.log('❌ One or both teams not found!');
            return;
        }
        if (homeTeam === awayTeam) {
            this.log('❌ Cannot predict a team against itself!');
            return;
        }
        const homeData = this.data.filter(row => row.title === homeTeam);
        const awayData = this.data.filter(row => row.title === awayTeam);
        if (homeData.length === 0 || awayData.length === 0) {
            this.log('❌ Insufficient data for one or both teams!');
            return;
        }
        const homeStats = this.calculateTeamStats(homeData, true);
        const awayStats = this.calculateTeamStats(awayData, false);
        const prediction = this.generateMatchPrediction(homeTeam, awayTeam, homeStats, awayStats);
        this.log(`\n🔮 MATCH PREDICTION: ${homeTeam} vs ${awayTeam}`);
        this.log('='.repeat(60));
        this.log(`Predicted xG: ${homeTeam} ${prediction.homeXG.toFixed(2)} - ${prediction.awayXG.toFixed(2)} ${awayTeam}`);
        this.log(`Most likely score: ${prediction.predictedScore}`);
        this.log(`\n📊 Win Probabilities:`);
        this.log(`${homeTeam} Win: ${prediction.homeWinProb.toFixed(1)}%`);
        this.log(`Draw: ${prediction.drawProb.toFixed(1)}%`);
        this.log(`${awayTeam} Win: ${prediction.awayWinProb.toFixed(1)}%`);
        this.log(`\n🎯 Confidence Level: ${prediction.confidence}`);
        this.log(`\n📈 Key Factors:`);
        prediction.keyFactors.forEach(factor => this.log(`  • ${factor}`));
        this.log(`\n🔍 Advanced Insights:`);
        this.log(`Over 2.5 Goals: ${prediction.over25Goals.toFixed(1)}%`);
        this.log(`Both Teams to Score: ${prediction.bothTeamsScore.toFixed(1)}%`);
        this.log(`Match Quality Rating: ${prediction.matchQuality}/10`);
    }

    async projectSeason() {
        this.log('\n📈 SEASON PROJECTION');
        this.log('='.repeat(50));
        this.showTeams();
        const teamChoice = await this.question('\nEnter team name or number for season projection: ');
        const team = this.getTeamByChoice(teamChoice);
        if (!team) {
            this.log('❌ Team not found!');
            return;
        }
        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            this.log('❌ No data found for this team!');
            return;
        }
        const projection = this.calculateSeasonProjection(team, teamData);
        this.log(`\n📈 SEASON PROJECTION FOR ${team}`);
        this.log('='.repeat(50));
        this.log(`Current Performance (${teamData.length} matches):`);
        this.log(`  Points per game: ${projection.currentPPG.toFixed(2)}`);
        this.log(`  xG per game: ${projection.avgXG.toFixed(2)}`);
        this.log(`  xGA per game: ${projection.avgXGA.toFixed(2)}`);
        this.log(`  xG Difference: ${projection.xGDiff > 0 ? '+' : ''}${projection.xGDiff.toFixed(2)}`);
        this.log(`\n🎯 Season Projections (38 games):`);
        this.log(`  Projected Points: ${projection.projectedPoints.toFixed(0)} points`);
        this.log(`  Projected Goals: ${projection.projectedGoals.toFixed(0)} goals`);
        this.log(`  Projected Goals Against: ${projection.projectedGA.toFixed(0)} goals`);
        this.log(`  Expected League Position: ${projection.expectedPosition}`);
        this.log(`\n🏆 Season Outlook: ${projection.outlook}`);
        this.log(`\n📊 Qualification Probabilities:`);
        this.log(`  Champions League: ${projection.clProbability.toFixed(1)}%`);
        this.log(`  Europa League: ${projection.elProbability.toFixed(1)}%`);
        this.log(`  Relegation: ${projection.relegationProbability.toFixed(1)}%`);
    }

    async predictGoals() {
        this.log('\n⚽ GOAL PREDICTION MODEL');
        this.log('='.repeat(50));
        this.showTeams();
        const teamChoice = await this.question('\nEnter team name or number: ');
        const team = this.getTeamByChoice(teamChoice);
        if (!team) {
            this.log('❌ Team not found!');
            return;
        }
        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            this.log('❌ No data found for this team!');
            return;
        }
        const goalModel = this.calculateGoalModel(team, teamData);
        this.log(`\n⚽ GOAL PREDICTION MODEL FOR ${team}`);
        this.log('='.repeat(50));
        this.log(`Next Match Predictions:`);
        this.log(`  Expected Goals (Home): ${goalModel.homeGoals.toFixed(2)}`);
        this.log(`  Expected Goals (Away): ${goalModel.awayGoals.toFixed(2)}`);
        this.log(`  Scoring Probability: ${goalModel.scoringProb.toFixed(1)}%`);
        this.log(`  Clean Sheet Probability: ${goalModel.cleanSheetProb.toFixed(1)}%`);
        this.log(`\n📊 Goal Patterns:`);
        this.log(`  Average goals per game: ${goalModel.avgGoals.toFixed(2)}`);
        this.log(`  Goals vs xG efficiency: ${goalModel.efficiency.toFixed(1)}%`);
        this.log(`  Most likely next match score: ${goalModel.mostLikelyScore}`);
        this.log(`\n🎯 Scoring Analysis:`);
        this.log(`  High-scoring games (3+ goals): ${goalModel.highScoringProb.toFixed(1)}%`);
        this.log(`  Goal variance: ${goalModel.consistency}`);
        this.log(`  Best goal-scoring period: ${goalModel.bestPeriod}`);
    }

    async analyzeTeamForm() {
        this.log('\n📈 TEAM FORM ANALYSIS');
        this.log('='.repeat(50));
        this.showTeams();
        const teamChoice = await this.question('\nEnter team name or number: ');
        const team = this.getTeamByChoice(teamChoice);
        if (!team) {
            this.log('❌ Team not found!');
            return;
        }
        const teamData = this.data.filter(row => row.title === team);
        if (teamData.length === 0) {
            this.log('❌ No data found for this team!');
            return;
        }
        const formAnalysis = this.analyzeForm(team, teamData);
        this.log(`\n📈 FORM ANALYSIS FOR ${team}`);
        this.log('='.repeat(50));
        this.log(`Current Form: ${formAnalysis.formRating}`);
        this.log(`Recent Performance Trend: ${formAnalysis.trend}`);
        this.log(`Momentum Score: ${formAnalysis.momentum.toFixed(1)}/10`);
        this.log(`\nLast 5 Matches Performance:`);
        this.log(`  xG: ${formAnalysis.recentXG.toFixed(2)} per game`);
        this.log(`  xGA: ${formAnalysis.recentXGA.toFixed(2)} per game`);
        this.log(`  Points per game: ${formAnalysis.recentPPG.toFixed(2)}`);
        this.log(`\n🔥 Form Insights:`);
        formAnalysis.insights.forEach(insight => this.log(`  • ${insight}`));
        this.log(`\n📊 Performance Metrics:`);
        this.log(`  Form consistency: ${formAnalysis.consistency}`);
        this.log(`  Pressure performance: ${formAnalysis.pressureRating}`);
        this.log(`  Next match confidence: ${formAnalysis.nextMatchConfidence}`);
    }

    async predictLeaguePositions() {
        this.log('\n🏆 LEAGUE POSITION PREDICTOR');
        this.log('='.repeat(50));
        this.log('\nAvailable leagues:');
        let leagueIndex = 1;
        const leagueKeys = [];
        for (const [key, config] of Object.entries(this.leagueConfigs)) {
            if (this.leagues.has(key)) {
                this.log(`${leagueIndex}. ${config.color} ${config.name}`);
                leagueKeys.push(key);
                leagueIndex++;
            }
        }
        if (leagueKeys.length === 0) {
            this.log('❌ No league data available!');
            return;
        }
        const leagueChoice = await this.question('\nSelect league number: ');
        const selectedLeagueKey = leagueKeys[parseInt(leagueChoice) - 1];
        if (!selectedLeagueKey) {
            this.log('❌ Invalid league selection!');
            return;
        }
        const leagueData = this.leagues.get(selectedLeagueKey);
        const predictions = this.predictFinalTable(selectedLeagueKey, leagueData);
        this.log(`\n🏆 PREDICTED FINAL TABLE - ${this.leagueConfigs[selectedLeagueKey].name}`);
        this.log('='.repeat(60));
        predictions.forEach((team, index) => {
            const position = index + 1;
            let emoji = '';
            if (position <= 4) emoji = '🟢';
            else if (position <= 6) emoji = '🟡';
            else if (position >= predictions.length - 2) emoji = '🔴';
            this.log(`${emoji} ${position.toString().padStart(2)}. ${team.name.padEnd(20)} ${team.projectedPoints.toFixed(0).padStart(3)} pts (${team.confidence})`);
        });
        this.log('\n🏆 Champions League: Top 4');
        this.log('🟡 Europa League: 5th-6th');
        this.log('🔴 Relegation: Bottom 3');
        this.log(`\n📊 League Insights:`);
        const leagueStats = this.calculateLeagueStats(predictions);
        this.log(`  Title race: ${leagueStats.titleRace}`);
        this.log(`  Relegation battle: ${leagueStats.relegationBattle}`);
        this.log(`  Average points gap: ${leagueStats.avgPointsGap.toFixed(1)} points`);
    }

    calculateTeamStats(teamData, isHome) {
        const stats = {
            matches: teamData.length,
            avgXG: teamData.reduce((sum, match) => sum + (match.xG || 0), 0) / teamData.length,
            avgXGA: teamData.reduce((sum, match) => sum + (match.xGA || 0), 0) / teamData.length,
            avgGoals: teamData.reduce((sum, match) => sum + (match.scored || 0), 0) / teamData.length,
            avgGA: teamData.reduce((sum, match) => sum + (match.missed || 0), 0) / teamData.length,
            ppg: teamData.reduce((sum, match) => sum + (match.pts || 0), 0) / teamData.length
        };
        if (isHome) {
            stats.avgXG *= 1.1;
            stats.avgXGA *= 0.9;
        } else {
            stats.avgXG *= 0.9;
            stats.avgXGA *= 1.1;
        }
        return stats;
    }

    generateMatchPrediction(homeTeam, awayTeam, homeStats, awayStats) {
        const homeXG = (homeStats.avgXG + awayStats.avgXGA) / 2;
        const awayXG = (awayStats.avgXG + homeStats.avgXGA) / 2;
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
        const scoreDiff = teamXG - opponentXG;
        let baseProb = 35;
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
        const scoringProb = Math.min(95, avgXG * 45);
        const cleanSheetProb = Math.max(5, (2 - avgXGA) * 30);
        const mostLikelyScore = `${Math.round(avgXG)}-${Math.round(avgXGA)}`;
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
}

// Logger setup
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./wa-logs.txt'))
logger.level = 'trace'

// Pre-configured media URLs and local files
const mediaLibrary = {
    images: {
        welcome: 'https://picsum.photos/800/600?random=1',
        logo: 'https://picsum.photos/400/400?random=2',
        meme: 'https://picsum.photos/600/600?random=3',
        nature: 'https://picsum.photos/800/600?random=4'
    },
    videos: {
        demo: 'https://www.w3schools.com/html/mov_bbb.mp4',
        intro: 'https://www.appsloveworld.com/wp-content/uploads/2018/10/640.mp4'
    },
    audio: {
        notification: 'https://www.largesound.com/ashborytour/sound/brobob.mp3',
        welcome: 'https://www.largesound.com/ashborytour/sound/brobob.mp3'
    },
    documents: {
        manual: 'https://www.africau.edu/images/default/sample.pdf',
        sample: 'https://file-examples.com/storage/fe86c96bf48ce8b1b5fd9b2/2017/10/file_example_PDF_1MB.pdf'
    },
    localFiles: {
        localImage: './assets/bot-logo.jpg',
        localVideo: './assets/demo-video.mp4',
        localAudio: './assets/notification.mp3',
        localDocument: './assets/user-manual.pdf'
    }
}

// Pre-configured contacts
const contactsLibrary = {
    support: {
        name: 'Bot Support',
        number: '+1-800-BOT-HELP',
        email: 'support@botservice.com',
        company: 'Bot Services Inc.'
    },
    admin: {
        name: 'Bot Admin',
        number: '+1-555-ADMIN',
        email: 'admin@botservice.com',
        company: 'Bot Management'
    },
    developer: {
        name: 'Bot Developer',
        number: '+1-555-DEV-BOT',
        email: 'dev@botservice.com',
        company: 'Development Team'
    }
}


// ========== RPG IMAGE MANAGEMENT SYSTEM ==========
class RPGImageManager {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp_images')
        this.imageCache = new Map()
        this.initTempDirectory()
    }

    initTempDirectory() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
            console.log(chalk.green(`Created temp directory: ${this.tempDir}`))
        }
    }

    cleanTempDirectory() {
        try {
            if (fs.existsSync(this.tempDir)) {
                const files = fs.readdirSync(this.tempDir)
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.tempDir, file))
                })
                console.log(chalk.yellow('Cleaned up temp images directory'))
            }
        } catch (error) {
            console.error(chalk.red('Error cleaning temp directory:', error.message))
        }
    }

    sanitizeFileName(text) {
        return text.replace(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu, '')
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '_')
                  .toLowerCase()
                  .substring(0, 50)
    }

    extractSearchTermFromDiagram(diagram) {
        const cleanText = diagram.replace(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu, '')

        const keywords = cleanText.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word))
            .slice(0, 3)

        return keywords.join(' ') || 'fantasy game illustration'
    }

    async downloadQuestionImage(question, location) {
        const searchTerm = this.extractSearchTermFromDiagram(question.diagram)
        const fileName = this.sanitizeFileName(`${question.id}_${location}_${searchTerm}`)
        const cacheKey = `${question.id}_${location}`

        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey)
        }

        try {
            console.log(chalk.blue(`🔍 Searching image for: "${searchTerm}"`))

            const enhancedSearchTerm = `${searchTerm} fantasy game illustration art`
            const images = await google.image(enhancedSearchTerm, {
                safe: true,
                additional_params: {
                    tbm: 'isch',
                    tbs: 'ic:color,itp:clipart'
                }
            })

            if (images.length === 0) {
                console.log(chalk.yellow(`No images found for: ${searchTerm}`))
                return null
            }

            for (let i = 0; i < Math.min(3, images.length); i++) {
                try {
                    const imageUrl = images[i].url
                    console.log(chalk.cyan(`📥 Downloading: ${imageUrl.substring(0, 50)}...`))

                    const response = await fetch(imageUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 10000
                    })

                    if (!response.ok) continue

                    const buffer = Buffer.from(await response.arrayBuffer())

                    const contentType = response.headers.get('content-type')
                    let extension = '.jpg'
                    if (contentType?.includes('png')) extension = '.png'
                    else if (contentType?.includes('gif')) extension = '.gif'
                    else if (contentType?.includes('webp')) extension = '.webp'

                    const filePath = path.join(this.tempDir, `${fileName}${extension}`)
                    fs.writeFileSync(filePath, buffer)

                    console.log(chalk.green(`✅ Image saved: ${fileName}${extension}`))

                    this.imageCache.set(cacheKey, filePath)
                    return filePath

                } catch (downloadError) {
                    console.log(chalk.yellow(`⚠️ Failed to download image ${i + 1}, trying next...`))
                    continue
                }
            }

            console.log(chalk.red(`❌ Failed to download any images for: ${searchTerm}`))
            return null

        } catch (error) {
            console.error(chalk.red(`Error fetching image for "${searchTerm}":`, error.message))
            return null
        }
    }
}

// Create global RPG image manager instance
const rpgImageManager = new RPGImageManager()


function getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getAllDatabaseItems(database) {
    const allItems = []
    Object.values(database).forEach(category => {
        allItems.push(...category)
    })
    return allItems
}

function getRandomDescription(location) {
    const database = LOCATION_DATABASES[location]
    const allItems = getAllDatabaseItems(database)
    const randomItem = getRandomFromArray(allItems)
    return randomItem.description
}

function getQuestionsByDifficulty(location, eventName) {
    const difficulties = EVENT_DIFFICULTIES[location] || {}
    const difficulty = difficulties[eventName] || 'easy'
    return LOCATION_QUESTIONS[location]?.[difficulty] || []
}

function formatChoices(choices) {
    return choices.map((choice, index) => `   ${String.fromCharCode(97 + index)}) ${choice}`).join('\n')
}



// Enhanced adventure handler for WhatsApp
async function handleRPGAdventure({ sender, location }, args, sock, sendMessageWithTyping, from) {
    const { rpg } = await findUserRpg(sender)
    const session = getUserSession(from)

    // Initialize progression if not set
    if (!rpg.currentDifficulty) {
        rpg.currentDifficulty = 'easy'
        rpg.currentLocation = 'forest'
        rpg.correctAnswersInCurrentEvent = 0
        rpg.failedAttemptsInCurrentEvent = 0
        await editRpg(sender, { rpg })
    }

    const knowledgeKey = `${location}Knowledge`

    // Initialize knowledge tracking
    if (!rpg[knowledgeKey]) {
        rpg[knowledgeKey] = {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        }
    }

    // Initialize failure tracking if not set
    if (typeof rpg.failedAttemptsInCurrentEvent === 'undefined') {
        rpg.failedAttemptsInCurrentEvent = 0
        await editRpg(sender, { rpg })
    }

    // Check if this is the current location and event
    if (location !== rpg.currentLocation) {
        return `You must complete your current adventure in ${rpg.currentLocation} first! Use adventure ${rpg.currentLocation}`
    }

    const expectedEvent = ADVENTURE_LOCATIONS[location].events[DIFFICULTY_INDEX[rpg.currentDifficulty]]

    // Check cooldown and health
    const cooldown = 50000 // 50 seconds
    const now = Date.now()
    if (rpg.health < 50) return `You need at least 50 health to adventure! Use heal to restore health.`
    if (now - rpg.lastadventure < cooldown) {
        const waitTime = Math.ceil((cooldown - (now - rpg.lastadventure)) / 1000)
        return `Please wait ${waitTime} seconds before adventuring again.`
    }

    // If no specific event, show current status
    if (args.length < 2) {
        let response = `${ADVENTURE_LOCATIONS[location].name} Adventure!\n\n`
        response += `Current Difficulty: ${rpg.currentDifficulty.charAt(0).toUpperCase() + rpg.currentDifficulty.slice(1)}\n`
        response += `Current Event: ${expectedEvent} (${rpg.currentDifficulty} difficulty)\n`
        response += `Correct Answers Needed: 5 (Current: ${rpg.correctAnswersInCurrentEvent})\n`
        response += `Failed Attempts: ${rpg.failedAttemptsInCurrentEvent}/2\n`

        // Show available blacksmith items for second chances
        const blacksmithItems = []
        if (rpg.sword > 0) blacksmithItems.push(`⚔️ Sword (${rpg.sworddurability} durability)`)
        if (rpg.armor > 0) blacksmithItems.push(`🛡️ Armor (${rpg.armordurability} durability)`)
        if (rpg.pickaxe > 0) blacksmithItems.push(`⛏️ Pickaxe (${rpg.pickaxedurability} durability)`)

        if (blacksmithItems.length > 0) {
            response += `Second Chance Items: ${blacksmithItems.join(', ')}\n`
        } else {
            response += `⚠️ No second chance items! Craft at blacksmith to avoid game reset.\n`
        }
        response += `\n`
        response += `Start the event with: adventure ${location} ${expectedEvent}\n\n`
        response += `**Knowledge Progress for ${location.charAt(0).toUpperCase() + location.slice(1)}:**\n⮕ Questions Answered: ${rpg[knowledgeKey].questionsAnswered}\n`
        response += `⮕ Accuracy: ${((rpg[knowledgeKey].correctAnswers / rpg[knowledgeKey].questionsAnswered) * 100).toFixed(1)}%`

        return response
    }

    const eventName = args[1].toLowerCase()

    if (eventName !== expectedEvent) {
        return `You must complete the current event: ${expectedEvent} (${rpg.currentDifficulty}). Use adventure ${location} ${expectedEvent}`
    }

    // Get questions
    const questions = getQuestionsByDifficulty(location, eventName)
    if (questions.length === 0) {
        return `No questions available for ${eventName} event.`
    }

    // Present new question
    const randomQuestion = getRandomFromArray(questions)
    const randomDescription = getRandomDescription(location)

    // Store current question in session
    session.awaitingRPGAnswer = true
    session.rpgActive = true
    session.currentRPGQuestion = {
        id: randomQuestion.id,
        eventName,
        location,
        correct: randomQuestion.correct,
        explanation: randomQuestion.explanation,
        diagram: randomQuestion.diagram
    }
    session.rpgContext = { sender, location, eventName }

    // Download and send image for this question
    console.log(chalk.blue(`🎨 Downloading image for question: ${randomQuestion.id}`))
    try {
        const imagePath = await rpgImageManager.downloadQuestionImage(randomQuestion, location)
        
        let response = `🎭 **${eventName.toUpperCase()} EVENT in ${ADVENTURE_LOCATIONS[location].name}**\n\n`
        response += `📖 **Guide:** ${randomDescription}\n\n`
        response += `❓ **Question:** ${randomQuestion.question}\n\n`
        response += `**Choices:**\n${formatChoices(randomQuestion.choices)}\n\n`
        response += `**Visual:** ${randomQuestion.diagram}\n\n`
        response += `Answer with: a, b, c, or d`

        // Send text message first
        await sendMessageWithTyping({ text: response }, from)

        // Send image if available
        if (imagePath && fs.existsSync(imagePath)) {
            console.log(chalk.green(`📷 Sending image: ${path.basename(imagePath)}`))
            const imageBuffer = fs.readFileSync(imagePath)
            await sendMessageWithTyping({
                image: imageBuffer,
                caption: `Visual aid for the question above 🎨`
            }, from)

            // Clean up the image after sending
            setTimeout(() => {
                rpgImageManager.cleanTempDirectory()
            }, 5000) // Clean up after 5 seconds
        }

        return null // Don't send text response as we already sent it
    } catch (error) {
        console.error(chalk.red(`Failed to download image for question ${randomQuestion.id}:`, error.message))
        
        // Send question without image
        let response = `🎭 **${eventName.toUpperCase()} EVENT in ${ADVENTURE_LOCATIONS[location].name}**\n\n`
        response += `📖 **Guide:** ${randomDescription}\n\n`
        response += `❓ **Question:** ${randomQuestion.question}\n\n`
        response += `**Choices:**\n${formatChoices(randomQuestion.choices)}\n\n`
        response += `**Visual:** ${randomQuestion.diagram}\n\n`
        response += `Answer with: a, b, c, or d`

        return response
    }
}

// Handle RPG answer
async function handleRPGAnswer(text, from, sock, sendMessageWithTyping) {
    const session = getUserSession(from)
    const { sender, location, eventName } = session.rpgContext
    const currentQuestion = session.currentRPGQuestion

    if (!currentQuestion) {
        return "No active question found. Start an adventure first!"
    }

    const userAnswer = text.toLowerCase().trim()
    
    // Validate answer format
    if (!['a', 'b', 'c', 'd'].includes(userAnswer)) {
        return "❌ Please answer with a, b, c, or d"
    }

    const { rpg } = await findUserRpg(sender)
    const knowledgeKey = `${location}Knowledge`

    // Check answer
    const isCorrect = userAnswer === currentQuestion.correct
    const rewardMultiplier = isCorrect ? 1.0 : 0.5

    // Handle incorrect answers and failure system
    if (!isCorrect) {
        rpg.failedAttemptsInCurrentEvent++

        // Check if this is the second failure
        if (rpg.failedAttemptsInCurrentEvent >= 2) {
            const hasBlacksmithItems = rpg.sword > 0 || rpg.armor > 0 || rpg.pickaxe > 0

            if (hasBlacksmithItems) {
                let itemUsed = ''
                if (rpg.sword > 0) {
                    rpg.sword = 0
                    rpg.sworddurability = 0
                    itemUsed = 'sword'
                } else if (rpg.armor > 0) {
                    rpg.armor = 0
                    rpg.armordurability = 0
                    itemUsed = 'armor'
                } else if (rpg.pickaxe > 0) {
                    rpg.pickaxe = 0
                    rpg.pickaxedurability = 0
                    itemUsed = 'pickaxe'
                }

                rpg.correctAnswersInCurrentEvent = 0
                rpg.failedAttemptsInCurrentEvent = 0
                session.awaitingRPGAnswer = false
                session.currentRPGQuestion = null
                await editRpg(sender, { rpg })

                return `❌ **Incorrect!** You've failed twice in this event!\n\n` +
                       `**Explanation:** ${currentQuestion.explanation}\n\n` +
                       `🔧 **Second Chance Used:** Your ${itemUsed} was consumed to continue!\n` +
                       `Progress reset - you need 5 correct answers again.\n\n` +
                       `Use adventure ${location} ${eventName} to try again!`
            } else {
                rpg.currentDifficulty = 'easy'
                rpg.currentLocation = 'forest'
                rpg.correctAnswersInCurrentEvent = 0
                rpg.failedAttemptsInCurrentEvent = 0
                session.awaitingRPGAnswer = false
                session.currentRPGQuestion = null
                await editRpg(sender, { rpg })

                return `💀 **GAME OVER!** You've failed twice without blacksmith items!\n\n` +
                       `**Explanation:** ${currentQuestion.explanation}\n\n` +
                       `🔄 **Game Reset:** Starting over from Forest Easy difficulty.\n` +
                       `Craft weapons, armor, or pickaxes at the blacksmith for second chances!\n\n` +
                       `Use adventure forest to restart your journey!`
            }
        }
    } else {
        rpg.failedAttemptsInCurrentEvent = 0
    }

    // Update knowledge
    rpg[knowledgeKey].questionsAnswered++
    if (isCorrect) rpg[knowledgeKey].correctAnswers++

    const category = 'general' // You might want to add category to questions
    if (!rpg[knowledgeKey].categories[category]) {
        rpg[knowledgeKey].categories[category] = { answered: 0, correct: 0 }
    }
    rpg[knowledgeKey].categories[category].answered++
    if (isCorrect) rpg[knowledgeKey].categories[category].correct++

    // Rewards
    const baseExp = 25
    const expGained = Math.floor(baseExp * rewardMultiplier)
    const moneyGained = Math.floor(20 * rewardMultiplier)

    rpg.exp = (rpg.exp || 0) + expGained
    rpg.money = (rpg.money || 0) + moneyGained
    rpg.lastadventure = Date.now()

    // Reset session state
    session.awaitingRPGAnswer = false
    session.currentRPGQuestion = null

    // Progression logic
    let progressionMessage = ''
    if (isCorrect) {
        rpg.correctAnswersInCurrentEvent++
        if (rpg.correctAnswersInCurrentEvent >= 5) {
            const currentLocIndex = LOCATION_ORDER.indexOf(rpg.currentLocation)
            if (currentLocIndex === LOCATION_ORDER.length - 1) {
                const currentDiffIndex = DIFFICULTIES.indexOf(rpg.currentDifficulty)
                if (currentDiffIndex < DIFFICULTIES.length - 1) {
                    rpg.currentDifficulty = DIFFICULTIES[currentDiffIndex + 1]
                    rpg.currentLocation = 'forest'
                    rpg.correctAnswersInCurrentEvent = 0
                    rpg.failedAttemptsInCurrentEvent = 0
                    progressionMessage = `\n🎉 **Difficulty Unlocked!** Now starting ${rpg.currentDifficulty} level in ${rpg.currentLocation}! Try adventure ${rpg.currentLocation}`
                } else {
                    progressionMessage = `\n🏆 **Game Completed!** You've mastered all difficulties!`
                }
            } else {
                rpg.currentLocation = LOCATION_ORDER[currentLocIndex + 1]
                rpg.correctAnswersInCurrentEvent = 0
                rpg.failedAttemptsInCurrentEvent = 0
                progressionMessage = `\n🎉 **Location Unlocked!** Now adventure in ${rpg.currentLocation} with ${rpg.currentDifficulty} level! Try adventure ${rpg.currentLocation}`
            }
        } else {
            progressionMessage = `\n📚 **Progress:** ${rpg.correctAnswersInCurrentEvent}/5 correct answers in ${rpg.currentDifficulty} ${rpg.currentLocation}`
        }
    }

    await editRpg(sender, { rpg })

    const resultEmoji = isCorrect ? '✅' : '❌'
    const resultText = isCorrect ? 'Correct!' : 'Incorrect!'

    let response = `${resultEmoji} **${resultText}**\n\n`
    response += `**Explanation:** ${currentQuestion.explanation}\n\n`
    response += `**Diagram:** ${currentQuestion.diagram}\n\n`
    response += `**Rewards:**\n⮕ Experience: +${expGained}\n⮕ Money: +${moneyGained}\n\n`
    response += `**Knowledge Progress for ${location.charAt(0).toUpperCase() + location.slice(1)}:**\n⮕ Questions Answered: ${rpg[knowledgeKey].questionsAnswered}\n`
    response += `⮕ Accuracy: ${((rpg[knowledgeKey].correctAnswers / rpg[knowledgeKey].questionsAnswered) * 100).toFixed(1)}%\n`
    response += `⮕ Current Event Progress: ${rpg.correctAnswersInCurrentEvent}/5 correct\n`
    response += `⮕ Failed Attempts: ${rpg.failedAttemptsInCurrentEvent}/2`
    response += progressionMessage

    return response
}


// RPG Commands implementation
const rpgCommands = {
    blacksmith: async ({ sender }, args) => {
        const { rpg } = await findUserRpg(sender)
        const command = args[0]?.toLowerCase() || 'createsword'
        const __type = command === 'createsword' ? 'sword' : command === 'createarmor' ? 'armor' : command === 'createpickaxe' ? 'pickaxe' : 'fishingrod'
        const listItems = blacksmith[command]

        if (!args[0] || !blacksmith[command]) {
            const sections = Object.keys(blacksmith).map((v) => ({
                title: v.toUpperCase(),
                rows: Object.keys(blacksmith[v]).map((item) => ({
                    title: item,
                    description: `Material: ${Object.entries(blacksmith[v][item].material).map(([k, v]) => `${v} ${k}`).join(', ')}`,
                })),
            }))
            return `*––––『 BLACKSMITHS 』––––*\nHello, welcome to the blacksmith! See the list below.\n\n${sections.map((s) => `${s.title}:\n${s.rows.map((r) => `  ${r.title} (${r.description})`).join('\n')}`).join('\n\n')}\n\nChoose an item to craft with blacksmith [command] [item]`
        }

        if (rpg[__type] !== 0 && __type !== 'fishingrod') return `You still have a ${__type}. Come back when it's destroyed.`
        if (__type === 'fishingrod' && rpg[__type]) return `You still have a fishing rod. Come back when it's destroyed.`

        const type = args[1]?.toLowerCase()
        if (!type || !listItems[type]) {
            const options = Object.keys(listItems).map((item) => `${item}`).join(', ')
            return `*––––『 BLACKSMITHS 』––––*\nChoose an item: ${options}`
        }

        for (const [material, amount] of Object.entries(listItems[type].material)) {
            if (rpg[material] < amount) return `You are short of ${material}!`
            rpg[material] -= amount
        }
        rpg[__type] = listItems[type].id
        rpg[`${__type}durability`] = listItems[type].durability
        await editRpg(sender, { rpg })
        return `👴🏽⛏️ : Successfully crafted your ${__type}!`
    },

    inventory: async ({ sender, pushName }) => {
        const { rpg } = await findUserRpg(sender)
        const tools = Object.keys(inventoryDisplay.tools)
            .map((v) => rpg[v] && `⮕ ${v}: ${typeof inventoryDisplay.tools[v] === 'object' ? inventoryDisplay.tools[v][rpg[v]?.toString()] : rpg[v] ? 'Active' : '❌'}`)
            .filter((v) => v)
            .join('\n')
        const items = Object.keys(inventoryDisplay.items)
            .map((v) => rpg[v] && `⮕ ${v}: ${rpg[v]}`)
            .filter((v) => v)
            .join('\n')
        const crates = Object.keys(inventoryDisplay.crates)
            .map((v) => rpg[v] && `⮕ ${v}: ${rpg[v]}`)
            .filter((v) => v)
            .join('\n')
        const pets = Object.keys(inventoryDisplay.pets)
            .map((v) => rpg[v] && `⮕ ${v}: ${rpg[v] >= inventoryDisplay.pets[v] ? 'Max Level' : `Level ${rpg[v]}`}`)
            .filter((v) => v)
            .join('\n')
        return `🧑🏻‍🏫 User: *${pushName}*
${Object.keys(inventoryDisplay.others).map((v) => rpg[v] && `⮕ ${v}: ${rpg[v]}`).filter((v) => v).join('\n')}
${tools ? `\n🔖 Tools:\n${tools}` : ''}
${items ? `\n🔖 Items:\n${items}` : ''}
${crates ? `\n🔖 Crates:\n${crates}` : ''}
${pets ? `\n🔖 Pets:\n${pets}` : ''}`.trim()
    },
    
    heal: async ({ sender }, args) => {
        const { rpg } = await findUserRpg(sender)
        const healAmount = 25
        const healCost = 300
        const maxHealth = 100

        if (rpg.health >= maxHealth) {
            return `You're already at full health! (${rpg.health}/${maxHealth})`
        }

        if (rpg.money < healCost) {
            return `You don't have enough money to heal! Cost: ${healCost}, You have: ${rpg.money}`
        }

        const actualHealAmount = Math.min(healAmount, maxHealth - rpg.health)
        rpg.health += actualHealAmount
        rpg.money -= healCost

        await editRpg(sender, { rpg })

        return `💊 **Healing Complete!**\n\n` +
               `⮕ Health restored: +${actualHealAmount}\n` +
               `⮕ Current health: ${rpg.health}/${maxHealth}\n` +
               `⮕ Money spent: -${healCost}\n` +
               `⮕ Remaining money: ${rpg.money}`
    },

    shop: async ({ sender }, args) => {
        const { rpg } = await findUserRpg(sender)
        const command = args[0]?.toLowerCase()

        if (!command || !shopItems[command]) {
            const sections = Object.keys(shopItems).map((category) => ({
                title: category.toUpperCase(),
                items: Object.keys(shopItems[category]).map((item) => ({
                    name: item,
                    price: shopItems[category][item].price,
                    description: shopItems[category][item].description || 'No description'
                }))
            }))

            let response = `*––––『 SHOP 』––––*\nWelcome to the shop! Here's what's available:\n\n`
            
            sections.forEach(section => {
                response += `**${section.title}:**\n`
                section.items.forEach(item => {
                    response += `  • ${item.name} - $${item.price}\n    ${item.description}\n`
                })
                response += '\n'
            })

            response += `Use: shop [category] [item]\nExample: shop buy potion`
            return response
        }

        const category = shopItems[command]
        const itemName = args[1]?.toLowerCase()

        if (!itemName || !category[itemName]) {
            const availableItems = Object.keys(category).map(item => 
                `${item} - $${category[item].price}`
            ).join(', ')
            return `*––––『 ${command.toUpperCase()} SHOP 』––––*\nAvailable items: ${availableItems}\n\nUse: shop ${command} [item]`
        }

        const item = category[itemName]
        
        if (rpg.money < item.price) {
            return `You don't have enough money! Item costs: $${item.price}, You have: $${rpg.money}`
        }

        // Handle different item types
        if (item.type === 'consumable') {
            if (!rpg[itemName]) rpg[itemName] = 0
            rpg[itemName] += item.quantity || 1
        } else if (item.type === 'permanent') {
            rpg[itemName] = item.value || 1
        }

        rpg.money -= item.price
        await editRpg(sender, { rpg })

        return `🛒 **Purchase Successful!**\n\n` +
               `⮕ Item: ${itemName}\n` +
               `⮕ Price: $${item.price}\n` +
               `⮕ Remaining money: $${rpg.money}\n\n` +
               `Item has been added to your inventory!`
    },

    transfer: async ({ sender, pushName }, args) => {
        if (args.length < 3) {
            return `Usage: transfer [type] [amount] [@user]\n\nExample: transfer money 100 @user\nTypes: money, exp`
        }

        const type = args[0].toLowerCase()
        const amount = parseInt(args[1])
        const targetUser = args[2].replace('@', '')

        if (!['money', 'exp'].includes(type)) {
            return `Invalid type! Use: money or exp`
        }

        if (isNaN(amount) || amount <= 0) {
            return `Invalid amount! Must be a positive number.`
        }

        if (!targetUser || targetUser === sender) {
            return `Invalid target user or cannot transfer to yourself!`
        }

        const { rpg: senderRpg } = await findUserRpg(sender)
        const { rpg: targetRpg } = await findUserRpg(targetUser)

        if (senderRpg[type] < amount) {
            return `You don't have enough ${type}! You have: ${senderRpg[type]}`
        }

        // Transfer
        senderRpg[type] -= amount
        targetRpg[type] = (targetRpg[type] || 0) + amount

        await editRpg(sender, { rpg: senderRpg })
        await editRpg(targetUser, { rpg: targetRpg })

        return `💸 **Transfer Successful!**\n\n` +
               `⮕ Transferred: ${amount} ${type}\n` +
               `⮕ To: @${targetUser}\n` +
               `⮕ Your remaining ${type}: ${senderRpg[type]}\n\n` +
               `Transfer completed successfully! 🎉`
    },

    profile: async ({ sender, pushName }) => {
        const { rpg } = await findUserRpg(sender)
        const totalQuestions = Object.values(LOCATION_ORDER).reduce((total, location) => {
            const knowledgeKey = `${location}Knowledge`
            return total + (rpg[knowledgeKey]?.questionsAnswered || 0)
        }, 0)

        const totalCorrect = Object.values(LOCATION_ORDER).reduce((total, location) => {
            const knowledgeKey = `${location}Knowledge`
            return total + (rpg[knowledgeKey]?.correctAnswers || 0)
        }, 0)

        const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0

        let response = `👤 **${pushName}'s RPG Profile**\n\n`
        response += `**Basic Stats:**\n`
        response += `⮕ Level: ${rpg.level || 1}\n`
        response += `⮕ Experience: ${rpg.exp || 0}\n`
        response += `⮕ Health: ${rpg.health || 100}/100\n`
        response += `⮕ Money: $${rpg.money || 0}\n\n`

        response += `**Game Progress:**\n`
        response += `⮕ Current Location: ${(rpg.currentLocation || 'forest').charAt(0).toUpperCase() + (rpg.currentLocation || 'forest').slice(1)}\n`
        response += `⮕ Current Difficulty: ${(rpg.currentDifficulty || 'easy').charAt(0).toUpperCase() + (rpg.currentDifficulty || 'easy').slice(1)}\n`
        response += `⮕ Event Progress: ${rpg.correctAnswersInCurrentEvent || 0}/5\n`
        response += `⮕ Failed Attempts: ${rpg.failedAttemptsInCurrentEvent || 0}/2\n\n`

        response += `**Knowledge Stats:**\n`
        response += `⮕ Total Questions: ${totalQuestions}\n`
        response += `⮕ Correct Answers: ${totalCorrect}\n`
        response += `⮕ Overall Accuracy: ${overallAccuracy}%\n\n`

        response += `**Equipment:**\n`
        const equipment = []
        if (rpg.sword > 0) equipment.push(`⚔️ Sword (${rpg.sworddurability} durability)`)
        if (rpg.armor > 0) equipment.push(`🛡️ Armor (${rpg.armordurability} durability)`)
        if (rpg.pickaxe > 0) equipment.push(`⛏️ Pickaxe (${rpg.pickaxedurability} durability)`)
        if (rpg.fishingrod) equipment.push(`🎣 Fishing Rod`)

        response += equipment.length > 0 ? equipment.join('\n') : 'No equipment'

        return response
    },

    leaderboard: async ({ sender }) => {
        // This would require querying all users - simplified version
        return `🏆 **Leaderboard**\n\nLeaderboard feature coming soon!\nFor now, use 'profile' to see your stats.`
    },

    reset: async ({ sender }) => {
        // Reset RPG progress (dangerous command)
        const resetRpg = {
            health: 100,
            money: 0,
            exp: 0,
            level: 1,
            currentDifficulty: 'easy',
            currentLocation: 'forest',
            correctAnswersInCurrentEvent: 0,
            failedAttemptsInCurrentEvent: 0,
            sword: 0,
            armor: 0,
            pickaxe: 0,
            fishingrod: false,
            sworddurability: 0,
            armordurability: 0,
            pickaxedurability: 0,
            lastadventure: 0
        }

        await editRpg(sender, { rpg: resetRpg })
        
        return `🔄 **RPG Profile Reset**\n\nYour RPG progress has been completely reset!\nUse 'adventure forest' to start your journey again.`
    }
}

// Enhanced Adventure handler for specific locations
async function handleSpecificAdventure(location, { sender }, args, sock, sendMessageWithTyping, from) {
    if (LOCATION_ORDER.includes(location)) {
        return await handleRPGAdventure({ sender, location }, args, sock, sendMessageWithTyping, from)
    }
    return `Unknown location: ${location}. Available locations: ${LOCATION_ORDER.join(', ')}`
}




interface QuadraticSession {
    solverType?: string
    currentStep: 'selecting_solver' | 'entering_equation' | 'entering_scenario' | 'entering_parameters' | 'generating_result'
    equation?: string
    scenario?: string
    parameters?: any
    stepData?: any
    workbook?: QuadraticMathematicalWorkbook
}



// TypeScript interfaces for football data
interface MatchData {
    HomeTeam: string;
    AwayTeam: string;
    FTHG: string;
    FTAG: string;
    Date: string;
    Referee: string;
    HS: string;
    AS: string;
    HC: string;
    AC: string;
    HY: string;
    AY: string;
    HR: string;
    AR: string;
    [key: string]: string;
}

interface TeamStats {
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}

interface LeagueInfo {
    name: string;
    emoji: string;
    season: string;
    flag: string;
    csvFile: string;
}




// User session interface for YouTube and Football functionality
interface UserSession {
     
    // YouTube session states
    awaitingYouTubeQuery: boolean
    youtubeContext: any
    awaitingYouTubeAction: boolean
    awaitingRelatedSelection: boolean

    // Multi-League session states
    awaitingEPLQuery: boolean
    awaitingLaLigaQuery: boolean
    awaitingSerieAQuery: boolean
    awaitingBundesligaQuery: boolean
    awaitingLigue1Query: boolean
    awaitingEredivisieQuery: boolean
    awaitingPrimeiraLigaQuery: boolean
    awaitingProLeagueQuery: boolean
    awaitingSPLQuery: boolean
    awaitingSuperLigQuery: boolean
    currentLeague: string | null
    leagueContext: any    

     // Spreadsheet session states
    awaitingSpreadsheetType: boolean
    awaitingSpreadsheetParams: boolean
    spreadsheetType: string | null
    spreadsheetParams: any

    // Quadratic solver session
    quadraticSession?: QuadraticSession
    awaitingQuadraticInput: boolean



    // RPG session states
    awaitingRPGAnswer: boolean
    rpgContext: any
    currentRPGQuestion: any
    rpgActive: boolean
 

    // Statistical Analysis session states
    awaitingDistributionSelection: boolean
    awaitingDistributionParameters: boolean
    awaitingDataInput: boolean
    currentDistribution: string | null
    statisticalConfig: any
    dataInputStep: 'sampleName' | 'variableName' | 'unitName' | 'scenarioDescription' | 'samples' | 'targetValue' | 'complete'


    // Calculator session states
    awaitingCalculatorInput: boolean
    calculatorInstance: GraphingCalculatorGame | null
    calculatorMode: 'equation' | 'triangle' | 'vector' | 'command' | null
    calculatorContext: any
    
    footballExplorer: FootballDataExplorer | null
    awaitingFootballInput: boolean
    pendingResolve: ((value: string) => void) | null
    outputLines: string[]
    lastActivity: number
    sessionId: string
    createdAt: number
}

// Football data storage
const footballData: { [key: string]: { data: MatchData[], teams: string[], loaded: boolean } } = {
    epl: { data: [], teams: [], loaded: false },
    laliga: { data: [], teams: [], loaded: false },
    seriea: { data: [], teams: [], loaded: false },
    bundesliga: { data: [], teams: [], loaded: false },
    ligue1: { data: [], teams: [], loaded: false },
    eredivisie: { data: [], teams: [], loaded: false },
    primeiraliga: { data: [], teams: [], loaded: false },
    proleague: { data: [], teams: [], loaded: false },
    spl: { data: [], teams: [], loaded: false },
    superlig: { data: [], teams: [], loaded: false }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// Enhanced User session management
const userSessions = new Map<string, UserSession>()
const createUserSession = (phoneNumber: string): UserSession => {
    return {

        // YouTube session states
        awaitingYouTubeQuery: false,
        youtubeContext: null,
        awaitingYouTubeAction: false,
        awaitingRelatedSelection: false,

        
        // Multi-League session states
        awaitingEPLQuery: false,
        awaitingLaLigaQuery: false,
        awaitingSerieAQuery: false,
        awaitingBundesligaQuery: false,
        awaitingLigue1Query: false,
        awaitingEredivisieQuery: false,
        awaitingPrimeiraLigaQuery: false,
        awaitingProLeagueQuery: false,
        awaitingSPLQuery: false,
        awaitingSuperLigQuery: false,
        currentLeague: null,
        leagueContext: null,

        

          // Spreadsheet session states
        awaitingSpreadsheetType: false,
        awaitingSpreadsheetParams: false,
        spreadsheetType: null,
        spreadsheetParams: null,

        // Quadratic solver session
        awaitingQuadraticInput: false,



        // RPG session states
        awaitingRPGAnswer: false,
        rpgContext: null,
        currentRPGQuestion: null,
        rpgActive: false,

        // Statistical Analysis session states
        awaitingDistributionSelection: false,
        awaitingDistributionParameters: false,
        awaitingDataInput: false,
        currentDistribution: null,
        statisticalConfig: {},
        dataInputStep: 'sampleName',

        // Calculator session states
        awaitingCalculatorInput: false,
        calculatorInstance: null,
        calculatorMode: null,
        calculatorContext: null,

        footballExplorer: null,
        awaitingFootballInput: false,
        pendingResolve: null,
        outputLines: [],
        lastActivity: Date.now(),
        sessionId: `${phoneNumber}_${Date.now()}`,
        createdAt: Date.now()
    }
}
const getUserSession = (phoneNumber: string): UserSession => {
    if (!userSessions.has(phoneNumber)) {
        userSessions.set(phoneNumber, createUserSession(phoneNumber))
        console.log(`📱 New session created for: ${phoneNumber.slice(-4)}`)
    }
    return userSessions.get(phoneNumber)!
}
const resetUserSession = (phoneNumber: string): void => {
    const session = getUserSession(phoneNumber)

    // Reset YouTube states
    session.awaitingYouTubeQuery = false
    session.youtubeContext = null
    session.awaitingYouTubeAction = false
    session.awaitingRelatedSelection = false

    
    // Reset League states
    session.awaitingEPLQuery = false
    session.awaitingLaLigaQuery = false
    session.awaitingSerieAQuery = false
    session.awaitingBundesligaQuery = false
    session.awaitingLigue1Query = false
    session.awaitingEredivisieQuery = false
    session.awaitingPrimeiraLigaQuery = false
    session.awaitingProLeagueQuery = false
    session.awaitingSPLQuery = false
    session.awaitingSuperLigQuery = false
    session.currentLeague = null
    session.leagueContext = null

     // Reset Spreadsheet states
    session.awaitingSpreadsheetType = false
    session.awaitingSpreadsheetParams = false
    session.spreadsheetType = null
    session.spreadsheetParams = null

// Reset Quadratic states
    session.awaitingQuadraticInput = false
    session.quadraticSession = undefined


    
    // Reset RPG states
    session.awaitingRPGAnswer = false
    session.rpgContext = null
    session.currentRPGQuestion = null
    session.rpgActive = false

    session.awaitingDistributionSelection = false
    session.awaitingDistributionParameters = false
    session.awaitingDataInput = false
    session.currentDistribution = null
    session.statisticalConfig = {}
    session.dataInputStep = 'sampleName'


    // Reset Calculator states
    session.awaitingCalculatorInput = false
    session.calculatorInstance = null
    session.calculatorMode = null
    session.calculatorContext = null

    session.footballExplorer = null
    session.awaitingFootballInput = false
    session.pendingResolve = null
    session.outputLines = []


    session.lastActivity = Date.now()
    console.log(`🔄 Session reset for: ${phoneNumber.slice(-4)}`)
}

// Directory setup
const downloadsDir = './downloads'
const tempDir = './temp'
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true })
}
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
}

if (!fs.existsSync('./statistical_outputs')) {
    fs.mkdirSync('./statistical_outputs', { recursive: true });
}

const statisticalOutputDir = './statistical_outputs'

const quadraticTempDir = './temp/quadratic'

if (!fs.existsSync(quadraticTempDir)) {
    fs.mkdirSync(quadraticTempDir, { recursive: true })
}




const doReplies = process.argv.includes('--do-reply')
const usePairingCode = process.argv.includes('--use-pairing-code')
const msgRetryCounterCache = new NodeCache()
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

const downloadFromUrl = async (url: string, filename?: string): Promise<Buffer> => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        return Buffer.from(response.data)
    } catch (error) {
        console.error(`Failed to download from ${url}:`, error)
        throw error
    }
}

const createTempFilePath = (extension: string) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return path.join(tempDir, `${timestamp}_${random}.${extension}`)
}
const cleanupTempFile = (filePath: string) => {
    setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }, 10000)
}
const downloadImage = (url: string, filepath: string) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath)
        https.get(url, (response) => {
            response.pipe(file)
            file.on('finish', () => {
                file.close()
                resolve(filepath)
            })
        }).on('error', (err) => {
            fs.unlink(filepath, () => {})
            reject(err)
        })
    })
}







// Generic League Functions
function getLeagueInfo(league: string): LeagueInfo {
    const leagues: { [key: string]: LeagueInfo } = {
        epl: {
            name: 'English Premier League',
            emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'epl.csv'
        },
        laliga: {
            name: 'Spanish La Liga',
            emoji: '🇪🇸',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'laliga.csv'
        },
        seriea: {
            name: 'Italian Serie A',
            emoji: '🇮🇹',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'seriea.csv'
        },
        bundesliga: {
            name: 'German Bundesliga',
            emoji: '🇩🇪',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'bundesliga.csv'
        },
        ligue1: {
            name: 'French Ligue 1',
            emoji: '🇫🇷',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'ligue1.csv'
        },
        eredivisie: {
            name: 'Dutch Eredivisie',
            emoji: '🇳🇱',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'eredivisie.csv'
        },
        primeiraliga: {
            name: 'Portuguese Primeira Liga',
            emoji: '🇵🇹',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'primeiraliga.csv'
        },
        proleague: {
            name: 'Belgian Pro League',
            emoji: '🇧🇪',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'proleague.csv'
        },
        spl: {
            name: 'Scottish Premier League',
            emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'spl.csv'
        },
        superlig: {
            name: 'Turkish Süper Lig',
            emoji: '🇹🇷',
            season: '2018/19',
            flag: '⚽',
            csvFile: 'superlig.csv'
        }
    }

    return leagues[league] || {
        name: 'Unknown League',
        emoji: '⚽',
        season: 'Unknown',
        flag: '⚽',
        csvFile: ''
    }
}

async function loadLeagueData(league: string): Promise<boolean> {
    try {
        if (footballData[league].loaded) return true

        const leagueInfo = getLeagueInfo(league)
        
        // Try different possible CSV file locations
        const possiblePaths = [
            path.join(__dirname, leagueInfo.csvFile),
            path.join(__dirname, '..', 'data', leagueInfo.csvFile),
            path.join(__dirname, '..', 'csv', leagueInfo.csvFile),
            path.join(__dirname, 'data', leagueInfo.csvFile),
            path.join(__dirname, 'csv', leagueInfo.csvFile),
            path.join(process.cwd(), 'data', leagueInfo.csvFile),
            path.join(process.cwd(), leagueInfo.csvFile)
        ]

        console.log(`Loading ${leagueInfo.name} data...`)
        
        let csvPath = ''
        let csvData = ''
        
        // Try to find the CSV file in different locations
        for (const possiblePath of possiblePaths) {
            try {
                if (fs.existsSync(possiblePath)) {
                    csvPath = possiblePath
                    csvData = await fsPromises.readFile(csvPath, { encoding: 'utf8' })
                    console.log(`✅ Found CSV at: ${csvPath}`)
                    break
                }
            } catch (error) {
                continue
            }
        }
        
        if (!csvPath || !csvData) {
            console.error(`❌ CSV file not found for ${league}. Tried paths:`)
            possiblePaths.forEach(p => console.error(`   - ${p}`))
            return false
        }

        const data = parseCSV(csvData)
        const teams = getUniqueTeams(data)

        footballData[league].data = data
        footballData[league].teams = teams
        footballData[league].loaded = true

        console.log(`✅ ${leagueInfo.name} Data loaded successfully! (${data.length} matches, ${teams.length} teams)`)
        return true
    } catch (error: any) {
        console.error(`❌ Error loading ${league} data:`, error.message)
        return false
    }
}

function parseCSV(csvData: string): MatchData[] {
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',')

    const data: MatchData[] = []
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        const row: MatchData = {} as MatchData

        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : ''
        })

        // Convert team names to lowercase for consistent matching
        if (row['HomeTeam']) row['HomeTeam'] = row['HomeTeam'].toLowerCase()
        if (row['AwayTeam']) row['AwayTeam'] = row['AwayTeam'].toLowerCase()

        data.push(row)
    }

    return data
}

function getUniqueTeams(data: MatchData[]): string[] {
    const teams = new Set<string>()
    data.forEach(row => {
        if (row['HomeTeam']) teams.add(row['HomeTeam'])
        if (row['AwayTeam']) teams.add(row['AwayTeam'])
    })
    return Array.from(teams).sort()
}

function calculateLeagueTable(data: MatchData[], teams: string[]): TeamStats[] {
    const table: Record<string, TeamStats> = {}

    // Initialize all teams
    teams.forEach(team => {
        table[team] = {
            team: team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        }
    })

    // Process each match
    data.forEach(match => {
        const homeTeam = match['HomeTeam']
        const awayTeam = match['AwayTeam']
        const homeGoals = parseInt(match['FTHG'] || '0')
        const awayGoals = parseInt(match['FTAG'] || '0')

        if (!homeTeam || !awayTeam || isNaN(homeGoals) || isNaN(awayGoals)) {
            return // Skip invalid matches
        }

        // Update matches played
        if (table[homeTeam]) table[homeTeam].played++
        if (table[awayTeam]) table[awayTeam].played++

        // Update goals
        if (table[homeTeam]) {
            table[homeTeam].goalsFor += homeGoals
            table[homeTeam].goalsAgainst += awayGoals
        }
        if (table[awayTeam]) {
            table[awayTeam].goalsFor += awayGoals
            table[awayTeam].goalsAgainst += homeGoals
        }

        // Determine result and update points/wins/draws/losses
        if (homeGoals > awayGoals) {
            if (table[homeTeam]) {
                table[homeTeam].won++
                table[homeTeam].points += 3
            }
            if (table[awayTeam]) table[awayTeam].lost++
        } else if (homeGoals < awayGoals) {
            if (table[awayTeam]) {
                table[awayTeam].won++
                table[awayTeam].points += 3
            }
            if (table[homeTeam]) table[homeTeam].lost++
        } else {
            if (table[homeTeam]) {
                table[homeTeam].drawn++
                table[homeTeam].points++
            }
            if (table[awayTeam]) {
                table[awayTeam].drawn++
                table[awayTeam].points++
            }
        }
    })

    // Calculate goal difference
    Object.keys(table).forEach(team => {
        table[team].goalDifference = table[team].goalsFor - table[team].goalsAgainst
    })

    // Convert to array and sort by points
    return Object.values(table).sort((a: TeamStats, b: TeamStats) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        return b.goalsFor - a.goalsFor
    })
}

function formatLeagueTable(table: TeamStats[], league: string): string {
    const leagueInfo = getLeagueInfo(league)
    let result = `${leagueInfo.emoji} *${leagueInfo.name.toUpperCase()} TABLE ${leagueInfo.season}*\n`
    result += "```\n"
    result += "Pos | Team              | P  | W  | D  | L  | GF | GA | GD  | Pts\n"
    result += "────┼───────────────────┼────┼────┼────┼────┼────┼────┼─────┼────\n"

    table.forEach((team, index) => {
        const pos = (index + 1).toString().padStart(2, ' ')
        const teamName = team.team.charAt(0).toUpperCase() + team.team.slice(1)
        const formattedTeam = teamName.padEnd(17, ' ')
        const played = team.played.toString().padStart(2, ' ')
        const won = team.won.toString().padStart(2, ' ')
        const drawn = team.drawn.toString().padStart(2, ' ')
        const lost = team.lost.toString().padStart(2, ' ')
        const gf = team.goalsFor.toString().padStart(2, ' ')
        const ga = team.goalsAgainst.toString().padStart(2, ' ')
        const gd = team.goalDifference.toString().padStart(3, ' ')
        const pts = team.points.toString().padStart(3, ' ')

        result += `${pos}  | ${formattedTeam} | ${played} | ${won} | ${drawn} | ${lost} | ${gf} | ${ga} | ${gd} | ${pts}\n`
    })

    result += "```\n"
    result += "_P=Played, W=Won, D=Drawn, L=Lost, GF=Goals For, GA=Goals Against, GD=Goal Difference_"

    return result
}

function listAllTeams(teams: string[], league: string): string {
    const leagueInfo = getLeagueInfo(league)
    let result = `${leagueInfo.emoji} *ALL ${leagueInfo.name.toUpperCase()} TEAMS (${leagueInfo.season})*\n\n`

    const halfwayPoint = Math.ceil(teams.length / 2)
    const firstHalf = teams.slice(0, halfwayPoint)
    const secondHalf = teams.slice(halfwayPoint)

    for (let i = 0; i < firstHalf.length; i++) {
        const team1 = firstHalf[i].charAt(0).toUpperCase() + firstHalf[i].slice(1)
        const team2 = secondHalf[i] ? secondHalf[i].charAt(0).toUpperCase() + secondHalf[i].slice(1) : ''

        const number1 = (i + 1).toString().padStart(2, ' ')
        const number2 = secondHalf[i] ? (i + halfwayPoint + 1).toString().padStart(2, ' ') : ''

        result += `${number1}. ${team1.padEnd(15, ' ')}`
        if (team2) {
            result += ` ${number2}. ${team2}`
        }
        result += '\n'
    }

    result += `\n📊 *Total: ${teams.length} teams*`
    return result
}

function findTeamsInMessage(message: string, teams: string[]): string[] {
    const foundTeams: string[] = []
    const lowerMessage = message.toLowerCase()
    
    teams.forEach(team => {
        if (lowerMessage.includes(team.toLowerCase())) {
            foundTeams.push(team)
        }
    })
    return foundTeams
}

async function processLeagueMessage(sender: string, message: string, league: string, sock: any): Promise<void> {
    const { data, teams } = footballData[league]
    const leagueInfo = getLeagueInfo(league)

    if (!footballData[league].loaded) {
        const loaded = await loadLeagueData(league)
        if (!loaded) {
            await sock.sendMessage(sender, { text: `❌ Sorry, ${leagueInfo.name} data could not be loaded. Please try again later.` })
            return
        }
    }

    const msg = message.trim().toLowerCase()

    // Handle initial league greeting
    if (msg === 'hello' || msg === league || msg === 'help') {
        await sock.sendMessage(sender, {
            text: `${leagueInfo.emoji} *Welcome to the ${leagueInfo.name} ${leagueInfo.season} Bot!*\n\n` +
            "You can ask questions like:\n\n" +
            "📊 *Match Statistics:*\n" +
            `• How many matches did ${getExampleTeam(league, 0)} play?\n` +
            `• How many goals did ${getExampleTeam(league, 1)} score?\n` +
            `• How many goals did ${getExampleTeam(league, 2)} score away from home?\n` +
            `• How many shots did ${getExampleTeam(league, 3)} concede?\n\n` +
            "🏆 *Match Results:*\n" +
            `• What was the result of ${getExampleMatchup(league)}?\n\n` +
            "📋 *Tables & Lists:*\n" +
            "• Show table (displays the league table)\n" +
            "• List teams (shows all team names)\n\n" +
            "❌ Type 'cancel' to exit league mode"
        })
        return
    }

    if (msg === 'cancel' || msg === 'exit' || msg === 'quit') {
        resetUserSession(sender)
        await sock.sendMessage(sender, { text: `❌ ${leagueInfo.name} mode cancelled. You can now use other bot commands.` })
        return
    }

    if (msg.includes('table') || msg.includes('standings') || msg.includes('league table')) {
        const table = calculateLeagueTable(data, teams)
        const formattedTable = formatLeagueTable(table, league)
        await sock.sendMessage(sender, { text: formattedTable })
        return
    }

    if (msg.includes('list teams') || msg.includes('show teams') || msg.includes('teams list') || msg === 'teams') {
        const teamsList = listAllTeams(teams, league)
        await sock.sendMessage(sender, { text: teamsList })
        return
    }

    // Find teams mentioned in the message
    const foundTeams = findTeamsInMessage(msg, teams)

    if (foundTeams.length === 0) {
        await sock.sendMessage(sender, {
            text: "❌ Sorry, we couldn't recognise any teams in your question.\n\n" +
            "💡 Type 'list teams' to see all available team names.\n" +
            "📝 Or type 'help' to see example questions."
        })
        return
    }

    if (msg.includes('matches') || msg.includes('played')) {
        const matchCount = data.filter(row =>
            row['HomeTeam'] === foundTeams[0] || row['AwayTeam'] === foundTeams[0]
        ).length

        const teamName = foundTeams[0].charAt(0).toUpperCase() + foundTeams[0].slice(1)
        await sock.sendMessage(sender, { text: `${leagueInfo.flag} *${teamName}* played *${matchCount} matches* in the ${leagueInfo.season} season.` })
        return
    }

    if (msg.includes('goals')) {
        let result = 0
        let reply = ''
        const teamName = foundTeams[0].charAt(0).toUpperCase() + foundTeams[0].slice(1)

        if (msg.includes('away')) {
            result = data
                .filter(row => row['AwayTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['FTAG'] || '0'), 0)
            reply = `${leagueInfo.flag} *${teamName}* scored *${result} goals* away from home.`
        } else if (msg.includes('home')) {
            result = data
                .filter(row => row['HomeTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['FTHG'] || '0'), 0)
            reply = `🏠 *${teamName}* scored *${result} goals* at home.`
        } else {
            const homeGoals = data
                .filter(row => row['HomeTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['FTHG'] || '0'), 0)
            const awayGoals = data
                .filter(row => row['AwayTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['FTAG'] || '0'), 0)
            result = homeGoals + awayGoals
            reply = `${leagueInfo.flag} *${teamName}* scored *${result} goals* overall (${homeGoals} home, ${awayGoals} away).`
        }

        await sock.sendMessage(sender, { text: reply })
        return
    }

    if (msg.includes('shots')) {
        let result = 0
        let reply = ''
        const teamName = foundTeams[0].charAt(0).toUpperCase() + foundTeams[0].slice(1)

        if (msg.includes('concede')) {
            const awayShots = data
                .filter(row => row['AwayTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['HS'] || '0'), 0)
            const homeShots = data
                .filter(row => row['HomeTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['AS'] || '0'), 0)
            result = awayShots + homeShots
            reply = `🎯 *${teamName}* conceded *${result} shots* in total.`
        } else {
            const homeShots = data
                .filter(row => row['HomeTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['HS'] || '0'), 0)
            const awayShots = data
                .filter(row => row['AwayTeam'] === foundTeams[0])
                .reduce((sum, row) => sum + parseInt(row['AS'] || '0'), 0)
            result = homeShots + awayShots
            reply = `🎯 *${teamName}* had *${result} shots* in total.`
        }

        await sock.sendMessage(sender, { text: reply })
        return
    }

    if (foundTeams.length === 2) {
        const matches = data.filter(row =>
            (row['HomeTeam'] === foundTeams[0] && row['AwayTeam'] === foundTeams[1]) ||
            (row['HomeTeam'] === foundTeams[1] && row['AwayTeam'] === foundTeams[0])
        )

        if (matches.length > 0) {
            let result = ''

            matches.forEach((match, index) => {
                const homeTeam = match['HomeTeam'].charAt(0).toUpperCase() + match['HomeTeam'].slice(1)
                const awayTeam = match['AwayTeam'].charAt(0).toUpperCase() + match['AwayTeam'].slice(1)

                const roundLabel = matches.length > 1 ? `*${index === 0 ? 'First' : 'Second'} Fixture:*\n` : ''

                result += `${roundLabel}🏟️ *${homeTeam} ${match['FTHG']} - ${match['FTAG']} ${awayTeam}*\n` +
                         `📅 Date: ${match['Date']}\n` +
                         `👨‍⚖️ Referee: ${match['Referee']}\n` +
                         `🎯 Shots: ${match['HS']} - ${match['AS']}\n` +
                         `🚩 Corners: ${match['HC']} - ${match['AC']}\n` +
                         `🟨 Yellow cards: ${match['HY']} - ${match['AY']}\n` +
                         `🟥 Red cards: ${match['HR']} - ${match['AR']}`

                if (index < matches.length - 1) {
                    result += '\n\n'
                }
            })

            await sock.sendMessage(sender, { text: result })
        } else {
            const team1 = foundTeams[0].charAt(0).toUpperCase() + foundTeams[0].slice(1)
            const team2 = foundTeams[1].charAt(0).toUpperCase() + foundTeams[1].slice(1)
            await sock.sendMessage(sender, { text: `❌ No matches found between *${team1}* and *${team2}*.` })
        }
        return
    }

    await sock.sendMessage(sender, {
        text: "❓ I'm sorry but I don't understand your question.\n\n" +
        "💡 Type 'help' to see example questions you can ask."
    })
}


// Helper functions for examples
function getExampleTeam(league: string, index: number): string {
    const examples: { [key: string]: string[] } = {
        epl: ['Liverpool', 'Arsenal', 'Brighton', 'West Ham'],
        laliga: ['Barcelona', 'Real Madrid', 'Valencia', 'Sevilla'],
        seriea: ['Juventus', 'AC Milan', 'Napoli', 'Roma'],
        bundesliga: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen'],
        ligue1: ['Paris Saint-Germain', 'Lyon', 'Marseille', 'Monaco'],
        eredivisie: ['Ajax', 'PSV', 'Feyenoord', 'AZ'],
        primeiraliga: ['Porto', 'Benfica', 'Sporting', 'Braga'],
        proleague: ['Club Brugge', 'Genk', 'Standard Liège', 'Anderlecht'],
        spl: ['Celtic', 'Rangers', 'Aberdeen', 'Hearts'],
        superlig: ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor']
    }
    return examples[league]?.[index] || 'Example Team'
}

function getExampleMatchup(league: string): string {
    const matchups: { [key: string]: string } = {
        epl: 'Chelsea vs Everton',
        laliga: 'Barcelona vs Real Madrid',
        seriea: 'Juventus vs Inter',
        bundesliga: 'Bayern Munich vs Borussia Dortmund',
        ligue1: 'PSG vs Lyon',
        eredivisie: 'Ajax vs PSV',
        primeiraliga: 'Porto vs Benfica',
        proleague: 'Club Brugge vs Genk',
        spl: 'Celtic vs Rangers',
        superlig: 'Galatasaray vs Fenerbahçe'
    }
    return matchups[league] || 'Team A vs Team B'
}


// Quadratic solver types mapping
const QUADRATIC_SOLVERS = {
    '1': { type: 'standard_form', name: 'Standard Form (ax² + bx + c = 0)', description: 'Solve basic quadratic equations' },
    '2': { type: 'quadratic_formula', name: 'Quadratic Formula', description: 'Demonstrate quadratic formula usage' },
    '3': { type: 'completing_square', name: 'Completing the Square', description: 'Solve by completing the square method' },
    '4': { type: 'factoring', name: 'Factoring Method', description: 'Solve by factoring quadratics' },
    '5': { type: 'vertex_form', name: 'Vertex Form Analysis', description: 'Analyze vertex form y = a(x-h)² + k' },
    '6': { type: 'discriminant', name: 'Discriminant Analysis', description: 'Analyze discriminant and root types' },
    '7': { type: 'inequality', name: 'Quadratic Inequalities', description: 'Solve quadratic inequalities' },
    '8': { type: 'projectile_motion', name: 'Projectile Motion', description: 'Solve projectile motion problems' },
    '9': { type: 'area_optimization', name: 'Area Optimization', description: 'Solve area optimization problems' },
    '10': { type: 'fractional_quadratic', name: 'Fractional Quadratics', description: 'Solve equations with 1/x terms' },
    '11': { type: 'parametric_quadratic', name: 'Parametric Quadratics', description: 'Quadratics with parameter coefficients' },
    '12': { type: 'linear_quadratic_system', name: 'Linear-Quadratic Systems', description: 'Systems with linear and quadratic equations' }
}

// Parameter validation function
const validateQuadraticParameters = (solverType: string, parameters: any): { valid: boolean, errors: string[] } => {
    const errors: string[] = []
    
    switch (solverType) {
        case 'standard_form':
        case 'completing_square':
        case 'factoring':
        case 'discriminant':
            if (parameters.a === undefined || parameters.a === null) errors.push('Parameter "a" is required')
            if (parameters.b === undefined || parameters.b === null) errors.push('Parameter "b" is required')
            if (parameters.c === undefined || parameters.c === null) errors.push('Parameter "c" is required')
            if (parameters.a === 0) errors.push('Parameter "a" cannot be zero for quadratic equations')
            break

        case 'vertex_form':
            if (parameters.a === undefined || parameters.a === null) errors.push('Parameter "a" is required')
            if (parameters.h === undefined || parameters.h === null) errors.push('Parameter "h" is required')
            if (parameters.k === undefined || parameters.k === null) errors.push('Parameter "k" is required')
            if (parameters.a === 0) errors.push('Parameter "a" cannot be zero')
            break

        case 'projectile_motion':
            if (parameters.initialVelocity === undefined) errors.push('Initial velocity is required')
            if (parameters.initialHeight === undefined) parameters.initialHeight = 0 // Default value
            if (parameters.gravity === undefined) parameters.gravity = -16 // Default value
            break

        case 'inequality':
            if (parameters.a === undefined || parameters.a === null) errors.push('Parameter "a" is required')
            if (parameters.b === undefined || parameters.b === null) errors.push('Parameter "b" is required')
            if (parameters.c === undefined || parameters.c === null) errors.push('Parameter "c" is required')
            if (parameters.operator === undefined) parameters.operator = '>' // Default operator
            break
    }

    return { valid: errors.length === 0, errors }
}

// Parse parameters from user input
const parseParameterInput = (input: string, solverType: string): any => {
    const params: any = {}
    
    // Remove extra spaces and split by common separators
    const cleanInput = input.replace(/\s+/g, ' ').trim()
    const parts = cleanInput.split(/[,;]/)

    for (const part of parts) {
        const trimmedPart = part.trim()
        
        // Match patterns like "a: 1", "a = 1", "a:1", etc.
        const match = trimmedPart.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*([+-]?\d*\.?\d+)/)
        if (match) {
            const [, key, value] = match
            params[key] = parseFloat(value)
        }
    }

    return params
}

// Generate filename for quadratic image
const generateQuadraticImagePath = (sessionId: string): string => {
    const timestamp = Date.now()
    return path.join(quadraticTempDir, `quadratic_${sessionId}_${timestamp}.png`)
}

// Clean up old quadratic images
const cleanupQuadraticImages = (): void => {
    try {
        const files = fs.readdirSync(quadraticTempDir)
        const now = Date.now()
        const maxAge = 30 * 60 * 1000 // 30 minutes

        files.forEach(file => {
            const filePath = path.join(quadraticTempDir, file)
            const stats = fs.statSync(filePath)
            
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath)
                console.log(`🗑️ Cleaned up old quadratic image: ${file}`)
            }
        })
    } catch (error) {
        console.error('Error cleaning up quadratic images:', error)
    }
}

// Set up periodic cleanup
setInterval(cleanupQuadraticImages, 10 * 60 * 1000) // Every 10 minutes

// Quadratic solver handlers
const handleQuadraticCommand = async (
    text: string,
    from: string,
    sendMessage: (msg: AnyMessageContent, jid: string) => Promise<void>
): Promise<boolean> => {
    const session = getUserSession(from)
    const lowerText = text.toLowerCase().trim()

    // Initialize quadratic solver
    if (lowerText === 'quadratic') {
        session.awaitingQuadraticInput = true
        session.quadraticSession = {
            currentStep: 'selecting_solver'
        }

        let solversList = '🧮 **QUADRATIC EQUATION SOLVERS**\n\n'
        solversList += 'Choose a solver by typing the number or name:\n\n'
        
        Object.entries(QUADRATIC_SOLVERS).forEach(([key, solver]) => {
            solversList += `${key}. **${solver.name}**\n   ${solver.description}\n\n`
        })

        solversList += '📝 Type the number (1-12) or solver name to continue\n'
        solversList += '❌ Type "cancel" to exit'

        await sendMessage({ text: solversList }, from)
        return true
    }

    // Handle quadratic session inputs
    if (session.awaitingQuadraticInput && session.quadraticSession) {
        return await handleQuadraticSessionInput(text, from, session, sendMessage)
    }
    
    return false
}

const handleQuadraticSessionInput = async (
    text: string,
    from: string,
    session: UserSession,
    sendMessage: (msg: AnyMessageContent, jid: string) => Promise<void>
): Promise<boolean> => {
    const quadSession = session.quadraticSession!
    const input = text.trim()

    // Handle cancel command
    if (input.toLowerCase() === 'cancel' || input.toLowerCase() === 'stop') {
        resetUserSession(from)
        await sendMessage({ text: '❌ Quadratic solver session cancelled.' }, from)
        return true
    }
    
    try {
        console.log(`🔍 Current step: ${quadSession.currentStep}, Input: "${input}" for user: ${from.slice(-4)}`)
        
        switch (quadSession.currentStep) {
            case 'selecting_solver':
                return await handleSolverSelection(input, from, session, sendMessage)
                
            case 'entering_equation':
                return await handleEquationInput(input, from, session, sendMessage)
                
            case 'entering_scenario':
                return await handleScenarioInput(input, from, session, sendMessage)
                
            case 'entering_parameters':
                return await handleParametersInput(input, from, session, sendMessage)
                
            default:
                console.error(`❌ Unknown step: ${quadSession.currentStep}`)
                await sendMessage({ text: '❌ Invalid session state. Type "quadratic" to start over.' }, from)
                resetUserSession(from)
                return true
        }
    } catch (error) {
        console.error('Error in quadratic session:', error)
        await sendMessage({
            text: '❌ An error occurred. Please try again or type "quadratic" to restart.'
        }, from)
        resetUserSession(from)
        return true
    }
}

const handleSolverSelection = async (
    input: string,
    from: string,
    session: UserSession,
    sendMessage: (msg: AnyMessageContent, jid: string) => Promise<void>
): Promise<boolean> => {
    const quadSession = session.quadraticSession!
    
    // Check if input is a number
    let selectedSolver = null
    if (/^\d+$/.test(input) && QUADRATIC_SOLVERS[input]) {
        selectedSolver = QUADRATIC_SOLVERS[input]
    } else {
        // Check if input matches solver name
        const solverEntry = Object.entries(QUADRATIC_SOLVERS).find(([, solver]) =>
            solver.name.toLowerCase().includes(input.toLowerCase()) ||
            solver.type === input.toLowerCase().replace(/\s+/g, '_')
        )
        if (solverEntry) {
            selectedSolver = solverEntry[1]
        }
    }
    
    if (!selectedSolver) {
        await sendMessage({
            text: '❌ Invalid selection. Please type a number (1-12) or solver name from the list above.'
        }, from)
        return true
    }
    
    quadSession.solverType = selectedSolver.type
    quadSession.currentStep = 'entering_equation'
    
    let prompt = `✅ Selected: **${selectedSolver.name}**\n\n`
    prompt += '📝 **Step 1: Enter the equation**\n\n'
    
    switch (selectedSolver.type) {
        case 'standard_form':
            prompt += 'Enter a quadratic equation in standard form:\n'
            prompt += 'Example: "x² - 5x + 6 = 0" or "2x² + 3x - 1 = 0"'
            break
        case 'vertex_form':
            prompt += 'Enter a quadratic in vertex form:\n'
            prompt += 'Example: "y = 2(x - 3)² + 1" or "y = -(x + 1)² - 4"'
            break
        case 'projectile_motion':
            prompt += 'Enter a projectile motion scenario:\n'
            prompt += 'Example: "Ball thrown from 10 feet with 30 ft/s velocity"'
            break
        default:
            prompt += 'Enter the quadratic equation or expression:\n'
            prompt += 'Example: "x² - 4x + 3 = 0"'
    }

    await sendMessage({ text: prompt }, from)
    return true
}

const handleEquationInput = async (
    input: string,
    from: string,
    session: UserSession,
    sendMessage: (msg: AnyMessageContent, jid: string) => Promise<void>
): Promise<boolean> => {
    const quadSession = session.quadraticSession!

    quadSession.equation = input
    quadSession.currentStep = 'entering_scenario'
    
    let prompt = `✅ Equation saved: "${input}"\n\n`
    prompt += '📝 **Step 2: Enter the scenario/description**\n\n'
    prompt += 'Describe what you want to solve or find:\n\n'
    
    switch (quadSession.solverType) {
        case 'standard_form':
            prompt += 'Example: "Find the roots of the quadratic equation"\n'
            prompt += 'Or: "Solve for x values where the equation equals zero"'
            break
        case 'vertex_form':
            prompt += 'Example: "Analyze the vertex and transformations"\n'
            prompt += 'Or: "Find the vertex coordinates and axis of symmetry"'
            break
        case 'projectile_motion':
            prompt += 'Example: "Find when the projectile hits the ground"\n'
            prompt += 'Or: "Calculate maximum height and time to reach it"'
            break
        default:
            prompt += 'Example: "Solve the quadratic equation"\n'
            prompt += 'Or: "Find all solutions and analyze the results"'
    }

    console.log(`📝 Moving to scenario input for ${from.slice(-4)}`)
    await sendMessage({ text: prompt }, from)
    return true
}

const handleScenarioInput = async (
    input: string,
    from: string,
    session: UserSession,
    sendMessage: (msg: AnyMessageContent, jid: string) => Promise<void>
): Promise<boolean> => {
    const quadSession = session.quadraticSession!

    quadSession.scenario = input
    quadSession.currentStep = 'entering_parameters'

    let prompt = `✅ Scenario saved: "${input}"\n\n`
    prompt += '📝 **Step 3: Enter the parameters**\n\n'
    
    switch (quadSession.solverType) {
        case 'standard_form':
        case 'completing_square':
        case 'factoring':
        case 'discriminant':
            prompt += 'Enter coefficients for ax² + bx + c = 0:\n'
            prompt += 'Format: "a: 1, b: -5, c: 6"\n'
            prompt += 'Example: "a: 2, b: -7, c: 3"'
            break
        case 'vertex_form':
            prompt += 'Enter parameters for a(x-h)² + k:\n'
            prompt += 'Format: "a: 1, h: 2, k: -3"\n'
            prompt += 'Example: "a: 2, h: 1, k: 4"'
            break
        case 'projectile_motion':
            prompt += 'Enter motion parameters:\n'
            prompt += 'Format: "initialVelocity: 30, initialHeight: 10, gravity: -16"\n'
            prompt += 'Example: "initialVelocity: 25, initialHeight: 5"'
            break
        case 'inequality':
            prompt += 'Enter coefficients and operator:\n'
            prompt += 'Format: "a: 1, b: -2, c: -3, operator: >"\n'
            prompt += 'Operators: >, <, >=, <='
            break
        default:
            prompt += 'Enter the required parameters for your problem.\n'
            prompt += 'Format: "parameter: value, parameter2: value2"'
    }

    console.log(`📊 Moving to parameters input for ${from.slice(-4)}`)
    await sendMessage({ text: prompt }, from)
    return true
}

const handleParametersInput = async (
    input: string,
    from: string,
    session: UserSession,
    sendMessage: (msg: AnyMessageContent, jid: string) => Promise<void>
): Promise<boolean> => {
    const quadSession = session.quadraticSession!

    // Parse parameters
    const parameters = parseParameterInput(input, quadSession.solverType!)
    
    // Validate parameters
    const validation = validateQuadraticParameters(quadSession.solverType!, parameters)

    if (!validation.valid) {
        let errorMsg = '❌ **Parameter validation failed:**\n\n'
        validation.errors.forEach(error => {
            errorMsg += `• ${error}\n`
        })
        errorMsg += '\nPlease correct the parameters and try again.'

        await sendMessage({ text: errorMsg }, from)
        return true
    }

    quadSession.parameters = parameters
    
    // Show processing message
    await sendMessage({ text: '🔄 Processing your quadratic problem...' }, from)

    // Generate the solution
    try {
        const workbook = new QuadraticMathematicalWorkbook({
            theme: "excel",
            includeVerificationInSteps: true,
            verificationDetail: "detailed"
        })
        
        const result = workbook.solveQuadraticProblem({
            equation: quadSession.equation!,
            scenario: quadSession.scenario!,
            parameters: parameters,
            problemType: quadSession.solverType!
        })

        // Generate image
        const imagePath = generateQuadraticImagePath(session.sessionId)
        const imageInfo = workbook.generateImage(imagePath)

        // Send result summary
        let resultMsg = '✅ **SOLUTION COMPLETED**\n\n'

        if (result.solutions) {
            resultMsg += `🔢 **Solutions:** ${Array.isArray(result.solutions) ? result.solutions.join(', ') : result.solutions}\n`
        }
        
        if (result.discriminant !== undefined) {
            resultMsg += `📊 **Discriminant:** ${result.discriminant}\n`
        }

        if (result.solutionType) {
            resultMsg += `📝 **Type:** ${result.solutionType}\n`
        }
        
        resultMsg += '\n📊 **Detailed spreadsheet solution attached below**'
        
        await sendMessage({ text: resultMsg }, from)

        // Send the spreadsheet image
        if (fs.existsSync(imagePath)) {
            await sendMessage({
                image: { url: imagePath },
                caption: `📊 Quadratic Solution Spreadsheet\n\n` +
                        `Problem: ${quadSession.solverType}\n` +
                        `Equation: ${quadSession.equation}\n` +
                        `Generated: ${new Date().toLocaleString()}`
            }, from)

            // Clean up the image after a delay
            setTimeout(() => {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath)
                    console.log(`🗑️ Cleaned up quadratic image: ${path.basename(imagePath)}`)
                }
            }, 60000) // Delete after 1 minute
        }

        // Send workbook summary
        const summary = workbook.getWorkbookSummary()
        if (summary && summary.length > 100) {
            const truncatedSummary = summary.length > 1000 ?
                summary.substring(0, 1000) + '\n...\n\n📊 Full details in the spreadsheet above!' :
                summary

            await sendMessage({ text: `📋 **SOLUTION SUMMARY:**\n\n${truncatedSummary}` }, from)
        }
        
        // Reset session
        resetUserSession(from)

        await sendMessage({
            text: '🎉 Solution complete! Type "quadratic" to solve another problem.'
        }, from)
        
    } catch (error) {
        console.error('Error generating quadratic solution:', error)
        await sendMessage({
            text: '❌ Error generating solution. Please check your parameters and try again.\n\nType "quadratic" to start over.'
        }, from)
        resetUserSession(from)
    }
    
    return true
}







// Create a distribution registry object that works with EnhancedStatisticalWorkbook
const DistributionRegistry = {
    distributions: {
        normal: {
            name: 'Normal Distribution',
            params: ['mean', 'std'],
            paramNames: ['Mean (μ)', 'Standard Deviation (σ)'],
            defaultParams: [0, 1],
            continuous: true
        },
        t: {
            name: 'T-Distribution',
            params: ['df'],
            paramNames: ['Degrees of Freedom'],
            defaultParams: [10],
            continuous: true
        },
        exponential: {
            name: 'Exponential Distribution',
            params: ['lambda'],
            paramNames: ['Rate Parameter (λ)'],
            defaultParams: [1],
            continuous: true
        },
        gamma: {
            name: 'Gamma Distribution',
            params: ['shape', 'scale'],
            paramNames: ['Shape (α)', 'Scale (β)'],
            defaultParams: [2, 1],
            continuous: true
        },
        beta: {
            name: 'Beta Distribution',
            params: ['alpha', 'beta'],
            paramNames: ['Alpha (α)', 'Beta (β)'],
            defaultParams: [2, 2],
            continuous: true
        },
        chisquare: {
            name: 'Chi-Square Distribution',
            params: ['df'],
            paramNames: ['Degrees of Freedom'],
            defaultParams: [5],
            continuous: true
        },
        f: {
            name: 'F-Distribution',
            params: ['df1', 'df2'],
            paramNames: ['Numerator DF', 'Denominator DF'],
            defaultParams: [5, 10],
            continuous: true
        },
        uniform: {
            name: 'Uniform Distribution',
            params: ['min', 'max'],
            paramNames: ['Minimum', 'Maximum'],
            defaultParams: [0, 1],
            continuous: true
        },
        binomial: {
            name: 'Binomial Distribution',
            params: ['n', 'p'],
            paramNames: ['Number of Trials (n)', 'Success Probability (p)'],
            defaultParams: [10, 0.5],
            continuous: false
        },
        bernoulli: {
            name: 'Bernoulli Distribution',
            params: ['p'],
            paramNames: ['Success Probability (p)'],
            defaultParams: [0.5],
            continuous: false
        },
        poisson: {
            name: 'Poisson Distribution',
            params: ['lambda'],
            paramNames: ['Rate Parameter (λ)'],
            defaultParams: [3],
            continuous: false
        },
        geometric: {
            name: 'Geometric Distribution',
            params: ['p'],
            paramNames: ['Success Probability (p)'],
            defaultParams: [0.3],
            continuous: false
        }
    },

    getDistribution: function(key) {
        return this.distributions[key] || null;
    },

    getAllDistributions: function() {
        return Object.keys(this.distributions);
    }
}

// Statistical Analysis Utilities
const getDistributionList = (): string => {
    const distributions = DistributionRegistry.getAllDistributions()
    let message = "📊 *Available Statistical Distributions:*\n\n"
    
    message += "*Continuous Distributions:*\n"
    const continuousDistributions = [
        { key: 'normal', name: 'Normal Distribution', desc: 'Bell curve, symmetric' },
        { key: 't', name: 'T-Distribution', desc: 'Small samples, heavy tails' },
        { key: 'exponential', name: 'Exponential Distribution', desc: 'Time between events' },
        { key: 'gamma', name: 'Gamma Distribution', desc: 'Waiting times, positive values' },
        { key: 'beta', name: 'Beta Distribution', desc: 'Proportions, rates (0-1)' },
        { key: 'chisquare', name: 'Chi-Square Distribution', desc: 'Variance testing' },
        { key: 'f', name: 'F-Distribution', desc: 'ANOVA, variance comparison' },
        { key: 'uniform', name: 'Uniform Distribution', desc: 'Equal probability' }
    ]

    continuousDistributions.forEach((dist, index) => {
        message += `${index + 1}. *${dist.name}* - ${dist.desc}\n`
    })

    message += "\n*Discrete Distributions:*\n"
    const discreteDistributions = [
        { key: 'binomial', name: 'Binomial Distribution', desc: 'Fixed trials, success count' },
        { key: 'bernoulli', name: 'Bernoulli Distribution', desc: 'Single trial (0/1)' },
        { key: 'poisson', name: 'Poisson Distribution', desc: 'Rare events count' },
        { key: 'geometric', name: 'Geometric Distribution', desc: 'Trials until success' }
    ]

    discreteDistributions.forEach((dist, index) => {
        message += `${index + 9}. *${dist.name}* - ${dist.desc}\n`
    })

    message += "\n📝 Reply with the *number* or *name* of the distribution you want to analyze."
    return message
}

const validateNumericInput = (input: string): { isValid: boolean; value?: number; error?: string } => {
    const trimmed = input.trim()
    if (!trimmed) {
        return { isValid: false, error: "Input cannot be empty" }
    }

    const num = parseFloat(trimmed)
    if (isNaN(num) || !isFinite(num)) {
        return { isValid: false, error: "Please enter a valid number" }
    }

    return { isValid: true, value: num }
}

const validateDataArray = (input: string): { isValid: boolean; values?: number[]; error?: string } => {
    try {
        // Clean the input - remove brackets, split by commas/spaces/newlines
        const cleanInput = input.replace(/[\[\]]/g, '').trim()
        const values = cleanInput.split(/[,\s\n]+/).filter(v => v.length > 0)

        if (values.length < 3) {
            return { isValid: false, error: "Please provide at least 3 data points" }
        }

        const numericValues = values.map(v => {
            const num = parseFloat(v.trim())
            if (isNaN(num) || !isFinite(num)) {
                throw new Error(`"${v}" is not a valid number`)
            }
            return num
        })

        if (numericValues.length > 1000) {
            return { isValid: false, error: "Maximum 1000 data points allowed" }
        }

        return { isValid: true, values: numericValues }
    } catch (error) {
        return { isValid: false, error: error.message }
    }
}

const getDistributionByInput = (input: string): string | null => {
    const distributionMap = {
        '1': 'normal', 'normal': 'normal',
        '2': 't', 't': 't', 't-distribution': 't',
        '3': 'exponential', 'exponential': 'exponential',
        '4': 'gamma', 'gamma': 'gamma',
        '5': 'beta', 'beta': 'beta',
        '6': 'chisquare', 'chisquare': 'chisquare', 'chi-square': 'chisquare',
        '7': 'f', 'f': 'f', 'f-distribution': 'f',
        '8': 'uniform', 'uniform': 'uniform',
        '9': 'binomial', 'binomial': 'binomial',
        '10': 'bernoulli', 'bernoulli': 'bernoulli',
        '11': 'poisson', 'poisson': 'poisson',
        '12': 'geometric', 'geometric': 'geometric'
    }

    return distributionMap[input.toLowerCase()] || null
}

const getParameterPrompt = (distribution: string): string => {
    const dist = DistributionRegistry.getDistribution(distribution)
    if (!dist) return "Invalid distribution"

    let prompt = `📋 *${dist.name} - Parameter Setup*\n\n`
    prompt += "You'll need to provide the following information:\n\n"
    prompt += "1. *Sample Name* (e.g., 'Quality Control Data')\n"
    prompt += "2. *Variable Name* (e.g., 'Temperature')\n"
    prompt += "3. *Unit Name* (e.g., '°C', 'mm', 'seconds')\n"
    prompt += "4. *Description* (brief scenario description)\n"
    prompt += "5. *Data Points* (your actual measurements/observations)\n"
    prompt += "6. *Target Value* (optional - specific value to analyze)\n\n"

    if (dist.params.length > 0) {
        prompt += "*Distribution Parameters:*\n"
        dist.params.forEach((param, index) => {
            prompt += `• ${dist.paramNames[index]}: ${dist.defaultParams[index]}\n`
        })
        prompt += "\n(Parameters will be estimated from your data if not specified)\n\n"
    }

    prompt += "Let's start! Please provide your *Sample Name*:"
    return prompt
}

// Statistical Analysis Handler
const handleStatisticalAnalysis = async (
    message: string,
    from: string,
    sock: any,
    sendMessageWithTyping: Function
) => {
    const session = getUserSession(from)

    try {
        if (session.awaitingDistributionSelection) {
            const distribution = getDistributionByInput(message)
            if (!distribution) {
                await sendMessageWithTyping(
                    { text: "❌ Invalid distribution selection. Please choose a number (1-12) or distribution name from the list above." },
                    from
                )
                return
            }

            session.currentDistribution = distribution
            session.awaitingDistributionSelection = false
            session.awaitingDataInput = true
            session.dataInputStep = 'sampleName'
            session.statisticalConfig = { distribution }

            const prompt = getParameterPrompt(distribution)
            await sendMessageWithTyping({ text: prompt }, from)
            return
        }

        if (session.awaitingDataInput) {
            await handleDataInput(message, from, session, sock, sendMessageWithTyping)
            return
        }

    } catch (error) {
        console.error('Statistical analysis error:', error)
        await sendMessageWithTyping(
            { text: "❌ An error occurred during statistical analysis. Please try again or contact support." },
            from
        )
        resetUserSession(from)
    }
}

const handleDataInput = async (
    message: string,
    from: string,
    session: UserSession,
    sock: any,
    sendMessageWithTyping: Function
) => {
    const config = session.statisticalConfig

    switch (session.dataInputStep) {
        case 'sampleName':
            if (message.trim().length < 2) {
                await sendMessageWithTyping(
                    { text: "❌ Sample name must be at least 2 characters long. Please try again:" },
                    from
                )
                return
            }
            config.sampleName = message.trim()
            session.dataInputStep = 'variableName'
            await sendMessageWithTyping(
                { text: "✅ Sample name saved!\n\nNow provide your *Variable Name* (what you're measuring):" },
                from
            )
            break

        case 'variableName':
            if (message.trim().length < 1) {
                await sendMessageWithTyping(
                    { text: "❌ Variable name cannot be empty. Please try again:" },
                    from
                )
                return
            }
            config.variableName = message.trim()
            session.dataInputStep = 'unitName'
            await sendMessageWithTyping(
                { text: "✅ Variable name saved!\n\nNow provide your *Unit Name* (e.g., 'mm', '°C', 'seconds', 'count'):" },
                from
            )
            break

        case 'unitName':
            config.unitName = message.trim() || 'units'
            session.dataInputStep = 'scenarioDescription'
            await sendMessageWithTyping(
                { text: "✅ Unit name saved!\n\nNow provide a *brief description* of your scenario or study:" },
                from
            )
            break

        case 'scenarioDescription':
            config.scenarioDescription = message.trim() || 'Statistical analysis'
            session.dataInputStep = 'samples'
            await sendMessageWithTyping(
                { text: "✅ Description saved!\n\nNow provide your *data points*. You can:\n• List numbers separated by commas: `1.2, 3.4, 5.6, 7.8`\n• List numbers separated by spaces: `1.2 3.4 5.6 7.8`\n• Put each number on a new line\n\n*Minimum 3 data points required*:" },
                from
            )
            break

        case 'samples':
            const dataValidation = validateDataArray(message)
            if (!dataValidation.isValid) {
                await sendMessageWithTyping(
                    { text: `❌ ${dataValidation.error}\n\nPlease provide your data points again:` },
                    from
                )
                return
            }
            config.samples = dataValidation.values
            session.dataInputStep = 'targetValue'
            await sendMessageWithTyping(
                { text: `✅ Data saved! Found ${dataValidation.values.length} data points.\n\nFinally, provide a *target value* for analysis (optional). This could be:\n• A specification limit\n• A target performance value\n• A threshold to analyze\n\nType 'skip' to skip this step:` },
                from
            )
            break

        case 'targetValue':
            if (message.toLowerCase().trim() !== 'skip') {
                const targetValidation = validateNumericInput(message)
                if (!targetValidation.isValid) {
                    await sendMessageWithTyping(
                        { text: `❌ ${targetValidation.error}\n\nPlease enter a target value or type 'skip':` },
                        from
                    )
                    return
                }
                config.targetValue = targetValidation.value
                config.targetAnalysisType = 'value'
            }
            
            session.dataInputStep = 'complete'
            await performStatisticalAnalysis(config, from, session, sock, sendMessageWithTyping)
            break
    }
}

// Simple statistical calculation functions using StatisticalDistributions
const calculateBasicStats = (data: number[]) => {
    const n = data.length
    const mean = data.reduce((sum, x) => sum + x, 0) / n
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1)
    const standardDeviation = Math.sqrt(variance)
    const min = Math.min(...data)
    const max = Math.max(...data)
    
    // Sort data for percentiles
    const sorted = [...data].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(n * 0.25)]
    const median = sorted[Math.floor(n * 0.5)]
    const q3 = sorted[Math.floor(n * 0.75)]
    
    return {
        n,
        mean,
        variance,
        standardDeviation,
        min,
        max,
        q1,
        median,
        q3
    }
}

const performStatisticalAnalysis = async (
    config: any,
    from: string,
    session: UserSession,
    sock: any,
    sendMessageWithTyping: Function
) => {
    try {
        console.log('🔄 Starting statistical analysis for user:', from.slice(-4));
        console.log('📊 Config:', JSON.stringify(config, null, 2));

        await sendMessageWithTyping(
            { text: "🔄 *Processing Statistical Analysis...*\n\nThis may take a few moments. Analyzing your data and generating reports..." },
            from
        );

        // Step 1: Test basic statistics first
        console.log('📈 Calculating basic statistics...');
        const stats = calculateBasicStats(config.samples);
        console.log('📈 Basic stats calculated:', stats);

        await sendMessageWithTyping(
            { text: `✅ *Basic Statistics Calculated*\n\n• Mean: ${stats.mean.toFixed(4)}\n• Std Dev: ${stats.standardDeviation.toFixed(4)}\n• Sample Size: ${stats.n}\n\n⏳ Creating workbook...` },
            from
        );

        // Step 2: Try creating workbook
        console.log('📊 Creating workbook instance...');
        let workbook;
        try {
            workbook = new EnhancedStatisticalWorkbook({
                width: 1200,
                height: 2000,
                theme: 'excel'
            });
            console.log('✅ Workbook created successfully');
        } catch (error) {
            console.error('❌ Workbook creation failed:', error);
            throw new Error(`Workbook creation failed: ${error.message}`);
        }

        await sendMessageWithTyping(
            { text: "✅ *Workbook Created*\n\n⏳ Analyzing distribution..." },
            from
        );

        // Step 3: Add comparison distributions
        if (!config.compareDistributions) {
            const baseDistributions = [config.distribution];
            switch (config.distribution) {
                case 'normal':
                    baseDistributions.push('t');
                    break;
                case 'exponential':
                    baseDistributions.push('gamma');
                    break;
                case 'gamma':
                    baseDistributions.push('exponential');
                    break;
                case 'beta':
                    baseDistributions.push('uniform');
                    break;
                default:
                    baseDistributions.push('normal');
            }
            config.compareDistributions = baseDistributions;
        }

        // Step 4: Try distribution analysis
        console.log('📊 Running distribution analysis...');
        try {
            workbook.analyzeDistribution(config);
            console.log('✅ Distribution analysis completed');
        } catch (error) {
            console.error('❌ Distribution analysis failed:', error);
            throw new Error(`Distribution analysis failed: ${error.message}`);
        }

        await sendMessageWithTyping(
            { text: "✅ *Distribution Analysis Complete*\n\n⏳ Generating files..." },
            from
        );

        // Step 5: Generate files
        const timestamp = Date.now();
        const userIdentifier = from.replace(/[^a-zA-Z0-9]/g, '_').slice(-8);
        
        const imageFilename = `statistical_analysis_${userIdentifier}_${timestamp}.png`;
        const xlsxFilename = `statistical_analysis_${userIdentifier}_${timestamp}.xlsx`;
        
        const imagePath = path.join(statisticalOutputDir, imageFilename);
        const xlsxPath = path.join(statisticalOutputDir, xlsxFilename);

        console.log('📊 Generating image:', imagePath);
        try {
            await workbook.generateImage(imagePath);
            console.log('✅ Image generated successfully');
        } catch (error) {
            console.error('❌ Image generation failed:', error);
            // Continue without image
        }

        console.log('📊 Generating Excel file:', xlsxPath);
        try {
            await workbook.generateXLSX(xlsxPath);
            console.log('✅ Excel file generated successfully');
        } catch (error) {
            console.error('❌ Excel generation failed:', error);
            // Continue without Excel file
        }

        // Step 6: Generate summary message
        const workbookStats = workbook.statistics || stats;
        const dist = DistributionRegistry.getDistribution(config.distribution);
        
        let summaryMessage = `📊 *Statistical Analysis Complete!*\n\n`;
        summaryMessage += `*Dataset:* ${config.sampleName}\n`;
        summaryMessage += `*Variable:* ${config.variableName} (${config.unitName})\n`;
        summaryMessage += `*Distribution:* ${dist.name}\n`;
        summaryMessage += `*Sample Size:* ${workbookStats.n}\n\n`;
        summaryMessage += `*Key Statistics:*\n`;
        summaryMessage += `• Mean: ${workbookStats.mean.toFixed(4)} ${config.unitName}\n`;
        summaryMessage += `• Std Dev: ${workbookStats.standardDeviation.toFixed(4)} ${config.unitName}\n`;
        summaryMessage += `• Min: ${workbookStats.min.toFixed(4)} ${config.unitName}\n`;
        summaryMessage += `• Max: ${workbookStats.max.toFixed(4)} ${config.unitName}\n`;

        if (config.targetValue) {
            try {
                const targetAnalysis = workbook.targetAnalysis;
                if (targetAnalysis && targetAnalysis.probabilities) {
                    summaryMessage += `\n*Target Analysis (${config.targetValue} ${config.unitName}):*\n`;
                    summaryMessage += `• P(X ≤ ${config.targetValue}) = ${(targetAnalysis.probabilities.lessThan * 100).toFixed(2)}%\n`;
                    summaryMessage += `• P(X > ${config.targetValue}) = ${(targetAnalysis.probabilities.greaterThan * 100).toFixed(2)}%\n`;
                }
            } catch (error) {
                console.error('Target analysis error:', error);
                // Continue without target analysis
            }
        }

        // Send summary message first
        await sendMessageWithTyping({ text: summaryMessage }, from);

        // Step 7: Send files if they exist
        if (fs.existsSync(imagePath)) {
            console.log('📤 Sending image file...');
            try {
                await sendMessageWithTyping({
                    image: { url: imagePath },
                    caption: `📊 Statistical Analysis Visualization\n${config.sampleName} - ${config.variableName}`
                }, from);
                console.log('✅ Image sent successfully');
            } catch (error) {
                console.error('❌ Failed to send image:', error);
            }
        } else {
            console.log('⚠️ Image file not found, skipping...');
        }

        if (fs.existsSync(xlsxPath)) {
            console.log('📤 Sending Excel file...');
            try {
                await sendMessageWithTyping({
                    document: { url: xlsxPath },
                    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    fileName: xlsxFilename,
                    caption: `📋 Complete Statistical Analysis Workbook\n${config.sampleName} - Detailed Results`
                }, from);
                console.log('✅ Excel file sent successfully');
            } catch (error) {
                console.error('❌ Failed to send Excel file:', error);
            }
        } else {
            console.log('⚠️ Excel file not found, skipping...');
        }

        // Step 8: Clean up files after 10 minutes
        setTimeout(() => {
            [imagePath, xlsxPath].forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Cleaned up: ${filePath}`);
                    } catch (error) {
                        console.error(`❌ Failed to clean up ${filePath}:`, error);
                    }
                }
            });
        }, 10 * 60 * 1000);

        // Reset session
        resetUserSession(from);
        
        await sendMessageWithTyping(
            { text: "✅ *Analysis Complete!*\n\nType 'distribution' to analyze another dataset or 'help' for other commands." },
            from
        );

        console.log('✅ Statistical analysis completed successfully for user:', from.slice(-4));

    } catch (error) {
        console.error('❌ Statistical analysis error for user:', from.slice(-4), error);
        console.error('Stack trace:', error.stack);
        
        await sendMessageWithTyping(
            { text: `❌ *Analysis Failed*\n\nThere was an error processing your statistical analysis:\n\n*Error:* ${error.message}\n\nPlease check your data and try again, or contact support if the issue persists.` },
            from
        );
        resetUserSession(from);
    }
};



// Calculator-specific helper functions
const createTempGraphPath = (type: string, identifier: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return path.join(tempDir, `${type}_${identifier}_${timestamp}_${random}.png`)
}

const cleanupTempFiles = (filePaths: string[], delay: number = 30000): void => {
    setTimeout(() => {
        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath)
                    console.log(`🧹 Cleaned up temp file: ${path.basename(filePath)}`)
                } catch (error) {
                    console.error(`❌ Failed to cleanup temp file ${filePath}:`, error)
                }
            }
        })
    }, delay)
}



// Calculator session handlers
const startCalculatorSession = async (sock: any, from: string, sendMessageWithTyping: Function) => {
    const session = getUserSession(from)

    // Initialize calculator instance
    session.calculatorInstance = new GraphingCalculatorGame()
    session.awaitingCalculatorInput = true
    session.calculatorMode = 'command'
    session.lastActivity = Date.now()

    const welcomeMessage = `🧮 *Advanced Graphing Calculator*

📊 *Available Operations:*

📈 *Equations:* Enter any mathematical function
• Linear: y=2x+3, y=-x+5
• Quadratic: y=x**2+2x+1, y=-2x**2+4x
• Trigonometric: y=sin(x), y=cos(2x)
• Exponential: y=2**x, y=e**(-x)
• And many more!

🔺 *Triangles:* Analyze geometric properties
• triangle A(0,0) B(4,0) C(2,3)
• triangle (1,1) (5,1) (3,4)
• Complete geometric analysis included

➡️ *Vectors:* Vector operations and analysis
• vector A(1,2) B(5,4) - displacement
• vector <3,4> - component form
• vectors A(1,1) B(4,3) C(6,5) - multiple vectors

🎛️ *Commands:*
• *formulas* - Show all available functions
• *help* - Calculator help menu
• *status* - Current calculator status
• *history* - Show equation/triangle/vector history
• *clear* - Clear all data
• *exit* - Exit calculator

💡 *Examples:*
• y=x**2 (parabola)
• triangle A(0,0) B(3,0) C(1.5,2.6)
• vector A(2,1) B(5,4)

🎯 *Just type your equation, triangle, or vector to get started!*
📊 *Each input generates detailed analysis + graph image*

✨ Reply with your mathematical input or command:`

    await sendMessageWithTyping({ text: welcomeMessage }, from)
}

const handleCalculatorInput = async (sock: any, from: string, input: string, sendMessageWithTyping: Function): Promise<boolean> => {
    const session = getUserSession(from)

    if (!session.calculatorInstance || !session.awaitingCalculatorInput) {
        return false
    }

    const cleanInput = input.trim().toLowerCase()

    // Handle calculator commands first
    if (cleanInput === 'exit' || cleanInput === 'quit') {
        session.awaitingCalculatorInput = false
        session.calculatorInstance = null
        session.calculatorMode = null

        await sendMessageWithTyping({
            text: '👋 Calculator session ended. Type *calculator* to start again.'
        }, from)
        return true
    }

    if (cleanInput === 'formulas') {
        const formulasText = generateFormulasText()
        await sendMessageWithTyping({ text: formulasText }, from)
        return true
    }

    if (cleanInput === 'help') {
        const helpText = generateCalculatorHelpText()
        await sendMessageWithTyping({ text: helpText }, from)
        return true
    }

    if (cleanInput === 'status') {
        const statusText = generateCalculatorStatus(session.calculatorInstance)
        await sendMessageWithTyping({ text: statusText }, from)
        return true
    }

    if (cleanInput === 'history') {
        const historyText = generateCalculatorHistory(session.calculatorInstance)
        await sendMessageWithTyping({ text: historyText }, from)
        return true
    }

    if (cleanInput === 'clear') {
        session.calculatorInstance = new GraphingCalculatorGame()
        await sendMessageWithTyping({
            text: '🗑️ Calculator cleared! All equations, triangles, and vectors removed.'
        }, from)
        return true
    }

    // Process mathematical input
    await sendMessageWithTyping({
        text: '🔄 Processing your input... Generating analysis and graph...'
    }, from)

    try {
        let result: CalculatorResult | null = null

        // Try to parse as vector first
        if (input.toLowerCase().includes('vector')) {
            result = await processVectorInput(session.calculatorInstance, input, from)
        }
        // Then try triangle
        else if (input.toLowerCase().includes('triangle')) {
            result = await processTriangleInput(session.calculatorInstance, input, from)
        }
        // Finally try equation
        else {
            result = await processEquationInput(session.calculatorInstance, input, from)
        }

        if (result && result.success) {
            // Send analysis text
            await sendMessageWithTyping({ text: result.analysisText }, from)

            // Send graph image if available
            if (result.imagePath && fs.existsSync(result.imagePath)) {
                await sock.sendMessage(from, {
                    image: fs.readFileSync(result.imagePath),
                    caption: `📊 ${result.type} Graph Generated\n🎯 ${result.description}`
                })

                // Schedule cleanup
                cleanupTempFiles([result.imagePath])
            }

            session.lastActivity = Date.now()
        } else {
            await sendMessageWithTyping({
                text: result?.error || '❌ Invalid input! Please check your format and try again.\n\n💡 Type *help* for examples or *formulas* for available functions.'
            }, from)
        }

    } catch (error) {
        console.error('Calculator processing error:', error)
        await sendMessageWithTyping({
            text: '❌ Error processing your input. Please check the format and try again.'
        }, from)
    }

    return true
}

// Calculator processing functions
interface CalculatorResult {
    success: boolean
    type: 'equation' | 'triangle' | 'vector'
    analysisText: string
    imagePath?: string
    description: string
    error?: string
}

// FIXED: Properly create graphs using the GraphingCalculator's methods
const processEquationInput = async (calculator: GraphingCalculatorGame, input: string, userPhone: string): Promise<CalculatorResult> => {
    try {
        const tempImagePath = createTempGraphPath('equation', userPhone.slice(-4))

        // Create a fresh calculator instance for this equation
        const freshCalc = calculator.createFreshCalculator()
        
        // Add the equation to the fresh calculator
        const success = freshCalc.addEquation(input)

        if (!success) {
            return {
                success: false,
                type: 'equation',
                analysisText: '',
                description: '',
                error: '❌ Invalid equation format! Please check your syntax.\n\n💡 Examples: y=x**2, y=sin(x), y=2x+3'
            }
        }

        // Generate the graph buffer
        const buffer = await freshCalc.buffer('image/png')
        
        // Create enhanced version with coordinate points
        const enhancedBuffer = await createEquationGraphWithPoints(input, freshCalc, calculator)
        
        // Save the enhanced graph
        fs.writeFileSync(tempImagePath, enhancedBuffer)

        // Update the main calculator counter
        calculator.equationCounter++
        calculator.equationHistory.push(`${calculator.equationCounter}. ${input}`)

        console.log(`📊 Equation graph saved to temp: ${path.basename(tempImagePath)}`)

        // Generate analysis text
        const analysisText = generateEquationAnalysis(calculator, input)

        return {
            success: true,
            type: 'equation',
            analysisText,
            imagePath: tempImagePath,
            description: `Mathematical function: ${input}`
        }

    } catch (error) {
        console.error('Equation processing error:', error)
        return {
            success: false,
            type: 'equation',
            analysisText: '',
            description: '',
            error: `❌ Error processing equation: ${error}`
        }
    }
}

const processTriangleInput = async (calculator: GraphingCalculatorGame, input: string, userPhone: string): Promise<CalculatorResult> => {
    try {
        const tempImagePath = createTempGraphPath('triangle', userPhone.slice(-4))

        // Parse triangle input
        const points = calculator.parseTriangleInput(input)
        if (!points) {
            return {
                success: false,
                type: 'triangle',
                analysisText: '',
                description: '',
                error: '❌ Invalid triangle format!\n\n💡 Examples:\n• triangle A(0,0) B(4,0) C(2,3)\n• triangle (1,1) (5,1) (3,4)'
            }
        }

        // Validate and create triangle
        const { A, B, C } = points
        if ([A.x, A.y, B.x, B.y, C.x, C.y].some(val => isNaN(val))) {
            return {
                success: false,
                type: 'triangle',
                analysisText: '',
                description: '',
                error: '❌ Invalid coordinates! Please use numbers only.'
            }
        }

        if (calculator.areCollinear(A, B, C)) {
            return {
                success: false,
                type: 'triangle',
                analysisText: '',
                description: '',
                error: '❌ Points are collinear! Cannot form a triangle.'
            }
        }

        // Calculate triangle properties
        const triangleProps = calculator.calculateTriangleProperties(A, B, C)

        // Create triangle graph
        const buffer = await createTriangleGraph(triangleProps, calculator)
        fs.writeFileSync(tempImagePath, buffer)

        // Update calculator state
        calculator.triangleCounter++
        calculator.triangleHistory.push({
            id: calculator.triangleCounter,
            input: input,
            properties: triangleProps
        })

        console.log(`🔺 Triangle graph saved to temp: ${path.basename(tempImagePath)}`)

        const analysisText = generateTriangleAnalysis(calculator)

        return {
            success: true,
            type: 'triangle',
            analysisText,
            imagePath: tempImagePath,
            description: `Geometric triangle analysis`
        }

    } catch (error) {
        console.error('Triangle processing error:', error)
        return {
            success: false,
            type: 'triangle',
            analysisText: '',
            description: '',
            error: `❌ Error processing triangle: ${error}`
        }
    }
}

const processVectorInput = async (calculator: GraphingCalculatorGame, input: string, userPhone: string): Promise<CalculatorResult> => {
    try {
        const tempImagePath = createTempGraphPath('vector', userPhone.slice(-4))

        // Parse vector input
        const parsed = calculator.parseVectorInput(input)
        if (!parsed) {
            return {
                success: false,
                type: 'vector',
                analysisText: '',
                description: '',
                error: '❌ Invalid vector format!\n\n💡 Examples:\n• vector A(1,2) B(5,4)\n• vector <3,4>\n• vectors A(1,1) B(4,3) C(6,5)'
            }
        }

        // Process vector data
        let vectorData = { vectors: [], operations: {} }

        if (parsed.type === 'displacement' || parsed.type === 'displacement3d') {
            const vector = calculator.calculateDisplacementVector(parsed.points[0], parsed.points[1])
            vectorData.vectors.push(vector)
        } else if (parsed.type === 'component') {
            const vector = {
                components: parsed.components,
                startPoint: { x: 0, y: 0, label: 'Origin' },
                endPoint: { x: parsed.components.x, y: parsed.components.y, label: 'End' },
                magnitude: Math.sqrt(parsed.components.x ** 2 + parsed.components.y ** 2),
                is3D: false
            }
            vector.direction = calculator.calculateVectorDirection(vector.components)
            vector.unitVector = {
                x: vector.components.x / vector.magnitude,
                y: vector.components.y / vector.magnitude
            }
            vectorData.vectors.push(vector)
        } else if (parsed.type === 'multiple') {
            for (let i = 0; i < parsed.points.length - 1; i++) {
                const vector = calculator.calculateDisplacementVector(parsed.points[i], parsed.points[i + 1])
                vectorData.vectors.push(vector)
            }

            if (vectorData.vectors.length >= 2) {
                const v1 = vectorData.vectors[0]
                const v2 = vectorData.vectors[1]
                vectorData.operations = {
                    'Sum': calculator.addVectors(v1, v2),
                    'Difference': calculator.subtractVectors(v1, v2),
                    'Dot Product': calculator.dotProduct(v1, v2),
                    'Cross Product': calculator.crossProduct(v1, v2),
                    'Angle Between': calculator.angleBetweenVectors(v1, v2),
                    'Orthogonal': calculator.areVectorsOrthogonal(v1, v2),
                    'Parallel': calculator.areVectorsParallel(v1, v2)
                }
                vectorData.resultant = vectorData.operations['Sum']
            }
        }

        // Create vector graph
        const buffer = await createVectorGraph(vectorData, calculator)
        fs.writeFileSync(tempImagePath, buffer)

        // Update calculator state
        calculator.vectorCounter++
        calculator.vectorHistory.push({
            id: calculator.vectorCounter,
            input: input,
            data: vectorData
        })

        console.log(`➡️ Vector graph saved to temp: ${path.basename(tempImagePath)}`)

        const analysisText = generateVectorAnalysis(calculator)

        return {
            success: true,
            type: 'vector',
            analysisText,
            imagePath: tempImagePath,
            description: `Vector analysis and operations`
        }

    } catch (error) {
        console.error('Vector processing error:', error)
        return {
            success: false,
            type: 'vector',
            analysisText: '',
            description: '',
            error: `❌ Error processing vector: ${error}`
        }
    }
}

// FIXED: Graph creation functions using direct canvas creation
const createEquationGraphWithPoints = async (equation: string, freshCalc: any, calculator: GraphingCalculatorGame): Promise<Buffer> => {
    const canvas = createCanvas(freshCalc.width, freshCalc.height)
    const ctx = canvas.getContext('2d')

    // Draw the basic graph
    await freshCalc.drawGraph(ctx)

    // Add coordinate points and enhanced drawing
    markCoordinatePoints(ctx, equation, freshCalc, calculator)

    return canvas.toBuffer('image/png')
}

const createTriangleGraph = async (triangleProps: any, calculator: GraphingCalculatorGame): Promise<Buffer> => {
    const canvas = createCanvas(calculator.calculator.width, calculator.calculator.height)
    const ctx = canvas.getContext('2d')

    // Draw basic grid and axes
    calculator.calculator.drawGrid(ctx)

    // Draw triangle with all details
    drawTriangle(ctx, triangleProps, calculator)

    return canvas.toBuffer('image/png')
}

const createVectorGraph = async (vectorData: any, calculator: GraphingCalculatorGame): Promise<Buffer> => {
    const canvas = createCanvas(calculator.calculator.width, calculator.calculator.height)
    const ctx = canvas.getContext('2d')

    // Draw vector analysis
    calculator.drawVectorAnalysis(ctx, vectorData)

    return canvas.toBuffer('image/png')
}

// Enhanced coordinate point marking
const markCoordinatePoints = (ctx: any, equation: string, freshCalc: any, calculator: GraphingCalculatorGame): void => {
    // Check for quadratic first
    const quadraticInfo = calculator.parseQuadratic(equation)
    if (quadraticInfo.isQuadratic) {
        drawQuadraticPoints(ctx, equation, quadraticInfo, freshCalc)
        return
    }

    // Check for linear
    const linearInfo = calculator.parseLinear(equation)
    if (linearInfo.isLinear) {
        drawLinearPoints(ctx, equation, linearInfo, freshCalc)
        return
    }

    // For other functions, draw general curve
    console.log(`📊 Standard function visualization for: ${equation}`)
}

const drawLinearPoints = (ctx: any, equation: string, linearInfo: any, freshCalc: any): void => {
    const { slope, intercept } = linearInfo

    // Generate points across the viewing window
    const points = []
    const xMin = freshCalc.xMin
    const xMax = freshCalc.xMax

    // Create more points for smoother line
    const numPoints = 50
    for (let i = 0; i <= numPoints; i++) {
        const x = xMin + (xMax - xMin) * i / numPoints
        const y = slope * x + intercept

        if (y >= freshCalc.yMin && y <= freshCalc.yMax) {
            const [screenX, screenY] = freshCalc.graphToScreen(x, y)
            points.push({ x, y, screenX, screenY })
        }
    }

    // Draw the connecting line first
    if (points.length > 1) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(points[0].screenX, points[0].screenY)

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].screenX, points[i].screenY)
        }
        ctx.stroke()
    }

    // Mark specific coordinate points
    const keyXValues = [-3, -2, -1, 0, 1, 2, 3]
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'

    keyXValues.forEach(x => {
        const y = slope * x + intercept

        if (x >= freshCalc.xMin && x <= freshCalc.xMax &&
            y >= freshCalc.yMin && y <= freshCalc.yMax) {

            const [screenX, screenY] = freshCalc.graphToScreen(x, y)

            // Draw point circle
            ctx.fillStyle = '#ff0000'
            ctx.beginPath()
            ctx.arc(screenX, screenY, 4, 0, 2 * Math.PI)
            ctx.fill()

            // Draw coordinate label with background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            const text = `(${x},${y})`
            const metrics = ctx.measureText(text)
            ctx.fillRect(screenX - metrics.width/2 - 2, screenY - 20, metrics.width + 4, 16)
            
            ctx.fillStyle = 'black'
            ctx.fillText(text, screenX, screenY - 8)
        }
    })

    // Highlight y-intercept with different color
    if (intercept >= freshCalc.yMin && intercept <= freshCalc.yMax &&
        0 >= freshCalc.xMin && 0 <= freshCalc.xMax) {
        const [screenX, screenY] = freshCalc.graphToScreen(0, intercept)
        ctx.fillStyle = '#0066ff'
        ctx.beginPath()
        ctx.arc(screenX, screenY, 6, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        const text = `Y-int: (0,${intercept})`
        const metrics = ctx.measureText(text)
        ctx.fillRect(screenX - metrics.width/2 - 2, screenY - 25, metrics.width + 4, 16)
        
        ctx.fillStyle = '#0066ff'
        ctx.font = 'bold 12px Arial'
        ctx.fillText(text, screenX, screenY - 12)
    }
}

const drawQuadraticPoints = (ctx: any, equation: string, quadraticInfo: any, freshCalc: any): void => {
    const { a, h, k } = quadraticInfo

    // Generate points for smooth parabola
    const points = []
    const xMin = freshCalc.xMin
    const xMax = freshCalc.xMax

    const numPoints = 100
    for (let i = 0; i <= numPoints; i++) {
        const x = xMin + (xMax - xMin) * i / numPoints
        const y = a * (x - h) * (x - h) + k

        if (y >= freshCalc.yMin && y <= freshCalc.yMax) {
            const [screenX, screenY] = freshCalc.graphToScreen(x, y)
            points.push({ x, y, screenX, screenY })
        }
    }

    // Draw the parabola curve
    if (points.length > 1) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(points[0].screenX, points[0].screenY)

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].screenX, points[i].screenY)
        }
        ctx.stroke()
    }

    // Mark specific coordinate points around vertex
    const keyXOffsets = [-2, -1, 0, 1, 2]
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'

    keyXOffsets.forEach(offset => {
        const x = h + offset
        const y = a * (x - h) * (x - h) + k

        if (x >= freshCalc.xMin && x <= freshCalc.xMax &&
            y >= freshCalc.yMin && y <= freshCalc.yMax) {

            const [screenX, screenY] = freshCalc.graphToScreen(x, y)

            if (offset === 0) {
                // Vertex point - special highlighting
                ctx.fillStyle = '#8B008B'
                ctx.beginPath()
                ctx.arc(screenX, screenY, 7, 0, 2 * Math.PI)
                ctx.fill()

                // Vertex label with background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                const text = `Vertex: (${x},${y})`
                const metrics = ctx.measureText(text)
                ctx.fillRect(screenX - metrics.width/2 - 2, screenY - 25, metrics.width + 4, 16)
                
                ctx.fillStyle = '#8B008B'
                ctx.font = 'bold 14px Arial'
                ctx.fillText(text, screenX, screenY - 12)
            } else {
                // Regular points
                ctx.fillStyle = '#228B22'
                ctx.beginPath()
                ctx.arc(screenX, screenY, 4, 0, 2 * Math.PI)
                ctx.fill()

                // Point label with background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                const text = `(${x},${y})`
                const metrics = ctx.measureText(text)
                ctx.fillRect(screenX - metrics.width/2 - 2, screenY - 20, metrics.width + 4, 16)
                
                ctx.fillStyle = 'black'
                ctx.font = '12px Arial'
                ctx.fillText(text, screenX, screenY - 8)
            }
        }
    })

    // Draw axis of symmetry
    if (h >= freshCalc.xMin && h <= freshCalc.xMax) {
        const [axisScreenX1, axisScreenY1] = freshCalc.graphToScreen(h, freshCalc.yMin)
        const [axisScreenX2, axisScreenY2] = freshCalc.graphToScreen(h, freshCalc.yMax)

        ctx.strokeStyle = '#8B008B'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.beginPath()
        ctx.moveTo(axisScreenX1, axisScreenY1)
        ctx.lineTo(axisScreenX2, axisScreenY2)
        ctx.stroke()
        ctx.setLineDash([])

        // Axis label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        const axisText = `x = ${h}`
        const axisMetrics = ctx.measureText(axisText)
        ctx.fillRect(axisScreenX1 + 5, 15, axisMetrics.width + 4, 16)
        
        ctx.fillStyle = '#8B008B'
        ctx.font = '11px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(axisText, axisScreenX1 + 7, 27)
    }
}

const drawTriangle = (ctx: any, triangleProps: any, calculator: GraphingCalculatorGame): void => {
    const { vertices, sides, angles, classifications } = triangleProps
    const { A, B, C } = vertices

    // Convert coordinates to screen coordinates
    const screenA = calculator.calculator.graphToScreen(A.x, A.y)
    const screenB = calculator.calculator.graphToScreen(B.x, B.y)
    const screenC = calculator.calculator.graphToScreen(C.x, C.y)

    // Draw triangle outline with gradient fill
    const gradient = ctx.createLinearGradient(screenA[0], screenA[1], screenC[0], screenC[1])
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)')
    gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.1)')
    gradient.addColorStop(1, 'rgba(0, 0, 255, 0.1)')

    // Fill triangle with gradient
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(screenA[0], screenA[1])
    ctx.lineTo(screenB[0], screenB[1])
    ctx.lineTo(screenC[0], screenC[1])
    ctx.closePath()
    ctx.fill()

    // Draw triangle outline
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(screenA[0], screenA[1])
    ctx.lineTo(screenB[0], screenB[1])
    ctx.lineTo(screenC[0], screenC[1])
    ctx.closePath()
    ctx.stroke()

    // Draw vertices as circles with different colors
    const drawVertex = (screen: number[], label: string, coords: any, color: string) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(screen[0], screen[1], 8, 0, 2 * Math.PI)
        ctx.fill()

        // White border around vertex
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(screen[0], screen[1], 8, 0, 2 * Math.PI)
        ctx.stroke()

        // Label with background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        const text = `${label}(${coords.x}, ${coords.y})`
        const metrics = ctx.measureText(text)
        ctx.fillRect(screen[0] - metrics.width/2 - 2, screen[1] - 25, metrics.width + 4, 16)

        ctx.fillStyle = 'black'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(text, screen[0], screen[1] - 12)
    }

    drawVertex(screenA, 'A', A, '#ff0000')
    drawVertex(screenB, 'B', B, '#00aa00')
    drawVertex(screenC, 'C', C, '#0066ff')

    // Draw side length labels
    const drawSideLabel = (screen1: number[], screen2: number[], length: number, label: string, color: string = '#666666') => {
        const midX = (screen1[0] + screen2[0]) / 2
        const midY = (screen1[1] + screen2[1]) / 2

        // Calculate perpendicular offset for label positioning
        const dx = screen2[0] - screen1[0]
        const dy = screen2[1] - screen1[1]
        const length2d = Math.sqrt(dx * dx + dy * dy)
        const perpX = -dy / length2d * 15  // Perpendicular offset
        const perpY = dx / length2d * 15

        const labelX = midX + perpX
        const labelY = midY + perpY

        // Background for label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        const text = `${label}: ${length.toFixed(2)}`
        const metrics = ctx.measureText(text)
        ctx.fillRect(labelX - metrics.width/2 - 2, labelY - 8, metrics.width + 4, 16)

        ctx.fillStyle = color
        ctx.font = '11px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(text, labelX, labelY + 4)
    }

    drawSideLabel(screenA, screenB, sides.AB, 'AB', '#ff6600')
    drawSideLabel(screenB, screenC, sides.BC, 'BC', '#ff6600')
    drawSideLabel(screenC, screenA, sides.CA, 'CA', '#ff6600')

    // Draw angle labels at vertices
    const drawAngleLabel = (screen: number[], angle: number, label: string, offset: number[] = [20, 20]) => {
        const labelX = screen[0] + offset[0]
        const labelY = screen[1] + offset[1]

        // Background for angle
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)'
        const text = `∠${label} = ${angle.toFixed(1)}°`
        const metrics = ctx.measureText(text)
        ctx.fillRect(labelX - metrics.width/2 - 2, labelY - 8, metrics.width + 4, 16)

        ctx.fillStyle = '#333333'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(text, labelX, labelY + 4)
    }

    drawAngleLabel(screenA, angles.A, 'A', [20, -20])
    drawAngleLabel(screenB, angles.B, 'B', [-20, -20])
    drawAngleLabel(screenC, angles.C, 'C', [0, 25])

    // Draw title and classification at the top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(10, 10, 350, 120)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(10, 10, 350, 120)

    ctx.fillStyle = 'black'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`${classifications.full} Triangle Analysis`, 20, 30)

    // Draw properties
    ctx.font = '12px Arial'
    const props = [
        `📊 Area: ${triangleProps.area.toFixed(3)} square units`,
        `📏 Perimeter: ${triangleProps.perimeter.toFixed(3)} units`,
        `📐 Angles: A=${angles.A.toFixed(1)}°, B=${angles.B.toFixed(1)}°, C=${angles.C.toFixed(1)}°`,
        `📏 Sides: AB=${sides.AB.toFixed(2)}, BC=${sides.BC.toFixed(2)}, CA=${sides.CA.toFixed(2)}`,
        `🏷️ Classification: ${classifications.sides} by sides, ${classifications.angles} by angles`
    ]

    props.forEach((prop, index) => {
        ctx.fillText(prop, 20, 50 + index * 15)
    })

    // Draw special properties if any
    const specialProps = getTriangleSpecialProperties(triangleProps)
    if (specialProps.length > 0) {
        ctx.font = 'bold 11px Arial'
        ctx.fillStyle = '#0066cc'
        ctx.fillText('⭐ Special Properties:', 20, 50 + props.length * 15 + 10)
        
        ctx.font = '10px Arial'
        ctx.fillStyle = '#333333'
        specialProps.slice(0, 2).forEach((prop, index) => {
            ctx.fillText(`  • ${prop}`, 25, 65 + props.length * 15 + index * 12)
        })
    }

    // Draw coordinate grid lines to vertices (optional - for better visibility)
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])

    // Vertical lines from vertices to x-axis
    const yAxis = calculator.calculator.graphToScreen(0, 0)[1]
    ctx.beginPath()
    ctx.moveTo(screenA[0], screenA[1])
    ctx.lineTo(screenA[0], yAxis)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(screenB[0], screenB[1])
    ctx.lineTo(screenB[0], yAxis)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(screenC[0], screenC[1])
    ctx.lineTo(screenC[0], yAxis)
    ctx.stroke()

    ctx.setLineDash([]) // Reset line dash
}

// Helper function to get special triangle properties
const getTriangleSpecialProperties = (props: any): string[] => {
    const { sides, angles, classifications } = props
    const specialProps: string[] = []

    // Check for right triangle properties
    if (classifications.angles === "Right") {
        const sortedSides = Object.values(sides).sort((a: any, b: any) => a - b)
        const [a, b, c] = sortedSides as number[]
        const pythagorean = Math.abs(c * c - (a * a + b * b))

        if (pythagorean < 0.001) {
            specialProps.push(`Pythagorean theorem: ${a.toFixed(2)}² + ${b.toFixed(2)}² = ${c.toFixed(2)}²`)
        }

        // Check for special right triangles
        if (Math.abs(a - b) < 0.001 && Math.abs(c - a * Math.sqrt(2)) < 0.001) {
            specialProps.push("45-45-90 Triangle (isosceles right triangle)")
        }

        const ratio1 = c / a
        const ratio2 = b / a
        if (Math.abs(ratio1 - 2) < 0.001 && Math.abs(ratio2 - Math.sqrt(3)) < 0.001) {
            specialProps.push("30-60-90 Triangle")
        }
    }

    // Check for equilateral properties
    if (classifications.sides === "Equilateral") {
        specialProps.push("All angles are exactly 60°")
        specialProps.push("All sides are equal in length")
        specialProps.push("Has 3 lines of symmetry")
    }

    // Check for isosceles properties
    if (classifications.sides === "Isosceles") {
        const anglesArray = Object.values(angles)
        const baseAngles = anglesArray.filter((angle: any, index: any, arr: any) =>
            arr.findIndex((a: any) => Math.abs(a - angle) < 0.001) !== index ||
            arr.filter((a: any) => Math.abs(a - angle) < 0.001).length > 1
        )
        if (baseAngles.length >= 2) {
            specialProps.push(`Base angles are equal: ${(baseAngles[0] as number).toFixed(1)}°`)
        }
        specialProps.push("Has 1 line of symmetry")
    }

    return specialProps
}

// Analysis text generators
const generateEquationAnalysis = (calculator: GraphingCalculatorGame, equation: string): string => {
    const description = calculator.getFormulaDescription(equation)
    
    return `📊 *Equation Analysis*

🔢 *Function:* ${equation}
📝 *Description:* ${description}
📈 *Graph Generated:* ✅
🎯 *Equation #:* ${calculator.equationCounter}

✨ *Key Features:*
• Coordinate points marked
• Mathematical analysis included
• Individual graph created

💡 *Tip:* Try more equations like y=sin(x), y=x**3, y=2**x`
}

const generateTriangleAnalysis = (calculator: GraphingCalculatorGame): string => {
    const lastTriangle = calculator.triangleHistory[calculator.triangleHistory.length - 1]
    if (!lastTriangle) return "No triangle data found"

    const props = lastTriangle.properties
    
    return `🔺 *Triangle Analysis*

📍 *Vertices:*
• A: (${props.vertices.A.x}, ${props.vertices.A.y})
• B: (${props.vertices.B.x}, ${props.vertices.B.y})
• C: (${props.vertices.C.x}, ${props.vertices.C.y})

📏 *Side Lengths:*
• AB = ${props.sides.AB.toFixed(3)} units
• BC = ${props.sides.BC.toFixed(3)} units
• CA = ${props.sides.CA.toFixed(3)} units

📐 *Angles:*
• ∠A = ${props.angles.A.toFixed(1)}°
• ∠B = ${props.angles.B.toFixed(1)}°
• ∠C = ${props.angles.C.toFixed(1)}°

📊 *Properties:*
• Area: ${props.area.toFixed(3)} sq units
• Perimeter: ${props.perimeter.toFixed(3)} units
• Type: ${props.classifications.full} Triangle

🎯 *Triangle #:* ${calculator.triangleCounter}`
}

const generateVectorAnalysis = (calculator: GraphingCalculatorGame): string => {
    const lastVector = calculator.vectorHistory[calculator.vectorHistory.length - 1]
    if (!lastVector) return "No vector data found"

    const vectorData = lastVector.data
    const vector = vectorData.vectors[0]
    
    let analysisText = `➡️ *Vector Analysis*

📐 *Components:* <${vector.components.x.toFixed(3)}, ${vector.components.y.toFixed(3)}>
📏 *Magnitude:* ${vector.magnitude.toFixed(4)} units
📊 *Direction:* ${vector.direction.angle?.toFixed(1)}°`

    if (vector.direction.bearing) {
        analysisText += `\n🧭 *Bearing:* ${vector.direction.bearing}`
    }

    if (vectorData.operations && Object.keys(vectorData.operations).length > 0) {
        analysisText += `\n\n🔧 *Operations:*`
        Object.entries(vectorData.operations).forEach(([op, result]) => {
            if (typeof result === 'object' && result.x !== undefined) {
                analysisText += `\n• ${op}: <${result.x.toFixed(3)}, ${result.y.toFixed(3)}>`
            } else if (typeof result === 'number') {
                analysisText += `\n• ${op}: ${result.toFixed(3)}${op.includes('Angle') ? '°' : ''}`
            } else if (typeof result === 'boolean') {
                analysisText += `\n• ${op}: ${result ? '✅ Yes' : '❌ No'}`
            }
        })
    }

    analysisText += `\n\n🎯 *Vector #:* ${calculator.vectorCounter}`
    return analysisText
}

const generateFormulasText = (): string => {
    return `📊 *Mathematical Formulas Reference*

📏 *Linear Functions:*
• y=2x+3, y=x+1, y=-x+5

📈 *Quadratic Functions:*
• y=x**2, y=-x**2, y=x**2+2x+1

🌊 *Trigonometric:*
• y=sin(x), y=cos(x), y=tan(x)

📊 *Exponential:*
• y=2**x, y=e**x, y=e**(-x)

📉 *Logarithmic:*
• y=log(x), y=log(x,2)

🔺 *Triangle Examples:*
• triangle A(0,0) B(4,0) C(2,3)
• triangle (1,1) (5,1) (3,4)

➡️ *Vector Examples:*
• vector A(1,2) B(5,4)
• vector <3,4>
• vectors A(1,1) B(4,3) C(6,5)

💡 *Just type any equation, triangle, or vector!*`
}

const generateCalculatorHelpText = (): string => {
    return `🧮 *Calculator Help*

📊 *Commands:*
• *formulas* - Show available functions
• *status* - Calculator statistics  
• *history* - Show all entries
• *clear* - Reset calculator
• *exit* - End session

📈 *Input Examples:*
• y=x**2+2x+1
• triangle A(0,0) B(3,0) C(1.5,2.6)
• vector A(2,1) B(5,4)

✨ *Features:*
• Real-time graph generation
• Detailed mathematical analysis
• Coordinate point marking
• Geometric property calculations
• Vector operations

🎯 *Just type your mathematical expression!*`
}

const generateCalculatorStatus = (calculator: GraphingCalculatorGame): string => {
    return `📊 *Calculator Status*

📈 *Equations:* ${calculator.equationCounter}
🔺 *Triangles:* ${calculator.triangleCounter}  
➡️ *Vectors:* ${calculator.vectorCounter}
📊 *Total Operations:* ${calculator.equationCounter + calculator.triangleCounter + calculator.vectorCounter}

🎨 *Settings:*
• Theme: Standard
• Viewing Window: [-10, 10] x [-10, 10]
• Grid: Enabled
• Axes: Enabled

✅ *Status:* Active & Ready`
}

const generateCalculatorHistory = (calculator: GraphingCalculatorGame): string => {
    let historyText = `📜 *Calculator History*\n\n`

    if (calculator.equationHistory.length > 0) {
        historyText += `📈 *Equations (${calculator.equationHistory.length}):*\n`
        calculator.equationHistory.slice(-5).forEach(eq => {
            historyText += `• ${eq}\n`
        })
        historyText += `\n`
    }

    if (calculator.triangleHistory.length > 0) {
        historyText += `🔺 *Triangles (${calculator.triangleHistory.length}):*\n`
        calculator.triangleHistory.slice(-3).forEach(tri => {
            historyText += `• ${tri.input}\n`
        })
        historyText += `\n`
    }

    if (calculator.vectorHistory.length > 0) {
        historyText += `➡️ *Vectors (${calculator.vectorHistory.length}):*\n`
        calculator.vectorHistory.slice(-3).forEach(vec => {
            historyText += `• ${vec.input}\n`
        })
    }

    if (calculator.equationCounter === 0 && calculator.triangleCounter === 0 && calculator.vectorCounter === 0) {
        historyText += `📝 No operations yet. Start by entering an equation, triangle, or vector!`
    }

    return historyText
}



// Updated spreadsheet handler functions with shopping list integration

// Updated spreadsheet handler functions with normal distribution integration

const handleSpreadsheetStart = async (sock: any, from: string) => {
    const sendMessageWithTyping = async (msg: AnyMessageContent) => {
        await sock.presenceSubscribe(from);
        await delay(500);
        await sock.sendPresenceUpdate('composing', from);
        await delay(1500);
        await sock.sendPresenceUpdate('paused', from);
        await sock.sendMessage(from, msg);
    };

    const session = getUserSession(from);
    session.awaitingSpreadsheetType = true;
    session.lastActivity = Date.now();

    const spreadsheetMenu = `📊 *Spreadsheet Calculator Menu*

Choose a calculation type:
1. 📊 *Normal Distribution* - Comprehensive statistical analysis
2. 📈 *Custom Normal* - Custom normal distribution with your data
3. 🎲 *Betting Analysis* - Comprehensive betting probability
4. 📉 *Linear Function* - Analyze y = mx + b
5. 🔄 *Custom Linear* - Parse custom linear equation
6. 📐 *Quadratic Formula* - Solve ax² + bx + c = 0
7. 🔄 *Custom Quadratic* - Parse custom quadratic equation
8. 💰 *Compound Interest* - Calculate future value
9. 🛒 *Shopping List* - Comprehensive shopping analysis
10. 🛍️ *Custom Shopping* - Parse custom shopping data

Reply with number (1-10) or type:
• normal_distribution
• custom_normal
• bet_analysis
• linearfunction
• customlinear
• quadraticformula
• customquadratic
• compoundinterest
• shopping_list
• custom_shopping

❌ Reply "cancel" to exit`;

    await sendMessageWithTyping({ text: spreadsheetMenu });
};

const handleSpreadsheetType = async (sock: any, from: string, text: string) => {
    const sendMessageWithTyping = async (msg: AnyMessageContent) => {
        await sock.presenceSubscribe(from);
        await delay(500);
        await sock.sendPresenceUpdate('composing', from);
        await delay(1500);
        await sock.sendPresenceUpdate('paused', from);
        await sock.sendMessage(from, msg);
    };

    const session = getUserSession(from);
    const cleanText = text.toLowerCase().trim();

    const typeMap = {
        '1': 'normal_distribution',
        '2': 'custom_normal',
        '3': 'bet_analysis',
        '4': 'linearfunction',
        '5': 'customlinear',
        '6': 'quadraticformula',
        '7': 'customquadratic',
        '8': 'compoundinterest',
        '9': 'shopping_list',
        '10': 'custom_shopping',
        'normal_distribution': 'normal_distribution',
        'normal': 'normal_distribution',
        'distribution': 'normal_distribution',
        'statistics': 'normal_distribution',
        'custom_normal': 'custom_normal',
        'customnormal': 'custom_normal',
        'bet_analysis': 'bet_analysis',
        'betting': 'bet_analysis',
        'linearfunction': 'linearfunction',
        'linear': 'linearfunction',
        'customlinear': 'customlinear',
        'quadraticformula': 'quadraticformula',
        'quadratic': 'quadraticformula',
        'customquadratic': 'customquadratic',
        'compoundinterest': 'compoundinterest',
        'interest': 'compoundinterest',
        'shopping_list': 'shopping_list',
        'shopping': 'shopping_list',
        'custom_shopping': 'custom_shopping',
        'customshopping': 'custom_shopping'
    };

    const selectedType = typeMap[cleanText];

    if (selectedType) {
        session.spreadsheetType = selectedType;
        session.awaitingSpreadsheetType = false;
        session.awaitingSpreadsheetParams = true;
        session.lastActivity = Date.now();

        let paramsPrompt = `📝 *Enter parameters for ${selectedType.toUpperCase()}:*\n\n`;

        switch (selectedType) {
            case 'normal_distribution':
                paramsPrompt += `*Default normal distribution will be used, or customize with:*\n\n`;
                paramsPrompt += `Format: mean:100, standardDeviation:15, sampleSize:1000, confidenceLevel:0.95\n\n`;
                paramsPrompt += `Example: mean:75, standardDeviation:10, sampleSize:500, confidenceLevel:0.99\n\n`;
                paramsPrompt += `*Or type "default" for default normal distribution (μ=100, σ=15)*\n\n❌ Reply "cancel" to exit`;
                break;
            case 'custom_normal':
                paramsPrompt += `*Multiple formats supported:*\n\n`;
                paramsPrompt += `**Simple Format:** mean:100, standardDeviation:15, sampleSize:1000\n\n`;
                paramsPrompt += `**Comma Separated:** 100, 15, 1000, 0.95\n\n`;
                paramsPrompt += `**Object Format:** {mean:100, standardDeviation:15, sampleSize:1000, confidenceLevel:0.95}\n\n`;
                paramsPrompt += `**Parameters:**\n• mean: Population mean (any number)\n• standardDeviation: Population std dev (positive)\n• sampleSize: Sample size (10-10000)\n• confidenceLevel: Confidence level (0.8-0.99)\n\n`;
                paramsPrompt += `❌ Reply "cancel" to exit`;
                break;
            case 'bet_analysis':
                paramsPrompt += `Format: betAmount:100, odds:2.5, oddsFormat:decimal, winProbability:0.45, bankroll:1000\n\nExample: betAmount:50, odds:1.8, oddsFormat:decimal, winProbability:0.55, bankroll:500\n\n❌ Reply "cancel" to exit`;
                break;
            case 'linearfunction':
                paramsPrompt += `Format: m:2, b:3\n\nExample: m:1.5, b:-2\n\n❌ Reply "cancel" to exit`;
                break;
            case 'customlinear':
                paramsPrompt += `Format: equation:y=2x+3\n\nExample: equation:3x - y = 6\n\n❌ Reply "cancel" to exit`;
                break;
            case 'quadraticformula':
                paramsPrompt += `Format: a:1, b:-5, c:6\n\nExample: a:2, b:3, c:-4\n\n❌ Reply "cancel" to exit`;
                break;
            case 'customquadratic':
                paramsPrompt += `Format: equation:y=x^2-4x+3\n\nExample: equation:2x^2 + 3x - 4 = 0\n\n❌ Reply "cancel" to exit`;
                break;
            case 'compoundinterest':
                paramsPrompt += `Format: P:1000, r:0.05, n:12, t:5\n\nExample: P:5000, r:0.03, n:4, t:10\n\n❌ Reply "cancel" to exit`;
                break;
            case 'shopping_list':
                paramsPrompt += `*Default shopping list will be used, or customize with:*\n\n`;
                paramsPrompt += `Format: currency:USD, taxRate:0.08, discountRate:0.05\n\n`;
                paramsPrompt += `Example: currency:EUR, taxRate:0.1, discountRate:0.0\n\n`;
                paramsPrompt += `*Or type "default" for default shopping list*\n\n❌ Reply "cancel" to exit`;
                break;
            case 'custom_shopping':
                paramsPrompt += `*Multiple formats supported:*\n\n`;
                paramsPrompt += `**Simple List:** Rice:2 12.00, Oil:3 5.00, Bread:4 2.50\n\n`;
                paramsPrompt += `**Table Format:**\nRice | 2 | 12.00 | Grains\nOil | 3 | 5.00 | Cooking\n\n`;
                paramsPrompt += `**Parameter Format:** currency:USD, taxRate:0.08, items:Rice 2 12|Oil 3 5\n\n`;
                paramsPrompt += `**JSON Format:** {"items":[{"name":"Rice","quantity":2,"unitPrice":12,"category":"Grains"}],"currency":"USD"}\n\n`;
                paramsPrompt += `❌ Reply "cancel" to exit`;
                break;
        }

        await sendMessageWithTyping({ text: paramsPrompt });
    } else if (cleanText === 'cancel') {
        resetUserSession(from);
        await sendMessageWithTyping({ text: '❌ Spreadsheet operation cancelled.' });
    } else {
        await sendMessageWithTyping({ text: '❌ Invalid selection. Please choose 1-10 or a valid type.' });
    }
};

// Updated parameter parsing function
const parseParamsString = (paramsStr: string, type: string): any => {
    const params: any = {};

    // Handle normal distribution special cases
    if (type === 'normal_distribution' || type === 'custom_normal') {
        return parseNormalDistributionParams(paramsStr, type);
    }

    // Handle shopping list special cases
    if (type === 'shopping_list' || type === 'custom_shopping') {
        return parseShoppingParams(paramsStr, type);
    }

    // Handle other types (existing logic)
    const pairs = paramsStr.split(',');
    pairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
            params[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
        }
    });

    return params;
};

// New function to parse normal distribution parameters
const parseNormalDistributionParams = (paramsStr: string, type: string): any => {
    const cleanStr = paramsStr.trim();

    // Handle default case for normal_distribution
    if (type === 'normal_distribution' && (cleanStr.toLowerCase() === 'default' || cleanStr === '')) {
        return {
            mean: 100,
            standardDeviation: 15,
            sampleSize: 1000,
            confidenceLevel: 0.95,
            dataPoints: null
        };
    }

    // Try to parse JSON format
    if (cleanStr.startsWith('{') && cleanStr.endsWith('}')) {
        try {
            const parsed = JSON.parse(cleanStr);
            return validateNormalDistributionParams(parsed);
        } catch (e) {
            // Fall through to other parsing methods
        }
    }

    // Parse comma-separated values (mean, stdDev, sampleSize, confidenceLevel)
    if (!cleanStr.includes(':') && cleanStr.includes(',')) {
        const values = cleanStr.split(',').map(v => v.trim());
        if (values.length >= 2) {
            return validateNormalDistributionParams({
                mean: parseFloat(values[0]) || 100,
                standardDeviation: parseFloat(values[1]) || 15,
                sampleSize: parseInt(values[2]) || 1000,
                confidenceLevel: parseFloat(values[3]) || 0.95
            });
        }
    }

    // Parse parameter format (key:value pairs)
    if (cleanStr.includes(':')) {
        const result = {
            mean: 100,
            standardDeviation: 15,
            sampleSize: 1000,
            confidenceLevel: 0.95,
            dataPoints: null
        };

        const pairs = cleanStr.split(',').map(s => s.trim());
        for (const pair of pairs) {
            if (pair.includes(':')) {
                const [key, value] = pair.split(':').map(s => s.trim());
                const lowerKey = key.toLowerCase();

                switch (lowerKey) {
                    case 'mean':
                    case 'mu':
                    case 'μ':
                        result.mean = parseFloat(value) || result.mean;
                        break;
                    case 'standarddeviation':
                    case 'stddev':
                    case 'sigma':
                    case 'σ':
                        result.standardDeviation = Math.max(0.01, parseFloat(value) || result.standardDeviation);
                        break;
                    case 'samplesize':
                    case 'n':
                    case 'size':
                        result.sampleSize = Math.max(10, Math.min(10000, parseInt(value) || result.sampleSize));
                        break;
                    case 'confidencelevel':
                    case 'confidence':
                    case 'cl':
                        result.confidenceLevel = Math.max(0.8, Math.min(0.99, parseFloat(value) || result.confidenceLevel));
                        break;
                }
            }
        }

        return result;
    }

    // Try to extract numbers from text
    const numbers = cleanStr.match(/[\d.-]+/g);
    if (numbers && numbers.length >= 2) {
        return validateNormalDistributionParams({
            mean: parseFloat(numbers[0]) || 100,
            standardDeviation: parseFloat(numbers[1]) || 15,
            sampleSize: parseInt(numbers[2]) || 1000,
            confidenceLevel: parseFloat(numbers[3]) || 0.95
        });
    }

    // Default fallback
    return parseNormalDistributionParams('default', 'normal_distribution');
};

// Helper function to validate normal distribution parameters
const validateNormalDistributionParams = (params: any): any => {
    const result = {
        mean: typeof params.mean === 'number' ? params.mean : 100,
        standardDeviation: Math.max(0.01, parseFloat(params.standardDeviation) || 15),
        sampleSize: Math.max(10, Math.min(10000, parseInt(params.sampleSize) || 1000)),
        confidenceLevel: Math.max(0.8, Math.min(0.99, parseFloat(params.confidenceLevel) || 0.95)),
        dataPoints: params.dataPoints || null
    };

    return result;
};

// New function to parse shopping parameters (existing function)
const parseShoppingParams = (paramsStr: string, type: string): any => {
    const cleanStr = paramsStr.trim();

    // Handle default case for shopping_list
    if (type === 'shopping_list' && (cleanStr.toLowerCase() === 'default' || cleanStr === '')) {
        return {
            items: [
                { name: 'Rice', quantity: 2, unitPrice: 12.00, category: 'Grains' },
                { name: 'Oil', quantity: 3, unitPrice: 5.00, category: 'Cooking' },
                { name: 'Bread', quantity: 4, unitPrice: 2.50, category: 'Bakery' },
                { name: 'Milk', quantity: 2, unitPrice: 3.00, category: 'Dairy' },
                { name: 'Sugar', quantity: 1, unitPrice: 4.50, category: 'Baking' }
            ],
            currency: 'USD',
            taxRate: 0.08,
            discountRate: 0.00
        };
    }

    // Try to parse JSON format
    if (cleanStr.startsWith('{') && cleanStr.endsWith('}')) {
        try {
            const parsed = JSON.parse(cleanStr);
            return validateShoppingParams(parsed);
        } catch (e) {
            // Fall through to other parsing methods
        }
    }

    // Parse table format (contains |)
    if (cleanStr.includes('|') && cleanStr.includes('\n')) {
        return parseTableFormatShopping(cleanStr);
    }

    // Parse simple list format (contains :)
    if (cleanStr.includes(':') && !cleanStr.includes(',')) {
        return parseSimpleListShopping(cleanStr);
    }

    // Parse parameter format (contains currency, tax, etc.)
    if (cleanStr.toLowerCase().includes('currency') || cleanStr.toLowerCase().includes('tax')) {
        return parseParameterFormatShopping(cleanStr);
    }

    // Parse simple list with commas
    if (cleanStr.includes(':') && cleanStr.includes(',')) {
        return parseCommaSeparatedShopping(cleanStr);
    }

    // Default fallback
    return parseShoppingParams('default', 'shopping_list');
};

// Helper functions for shopping parameter parsing (existing functions)
const parseTableFormatShopping = (text: string): any => {
    const items = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
        if (line.includes('|')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 3) {
                items.push({
                    name: parts[0] || 'Item',
                    quantity: parseFloat(parts[1]) || 1,
                    unitPrice: parseFloat(parts[2]) || 0,
                    category: parts[3] || 'General'
                });
            }
        }
    }

    return {
        items: items.length > 0 ? items : getDefaultShoppingItems(),
        currency: 'USD',
        taxRate: 0.08,
        discountRate: 0.00
    };
};

const parseSimpleListShopping = (text: string): any => {
    const items = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
        if (line.includes(':')) {
            const [name, details] = line.split(':');
            const parts = details.trim().split(/\s+/);
            items.push({
                name: name.trim(),
                quantity: parseFloat(parts[0]) || 1,
                unitPrice: parseFloat(parts[1]) || 0,
                category: parts[2] || 'General'
            });
        }
    }

    return {
        items: items.length > 0 ? items : getDefaultShoppingItems(),
        currency: 'USD',
        taxRate: 0.08,
        discountRate: 0.00
    };
};

const parseCommaSeparatedShopping = (text: string): any => {
    const items = [];
    const entries = text.split(',').filter(entry => entry.trim());

    for (const entry of entries) {
        if (entry.includes(':')) {
            const [name, details] = entry.split(':');
            const parts = details.trim().split(/\s+/);
            items.push({
                name: name.trim(),
                quantity: parseFloat(parts[0]) || 1,
                unitPrice: parseFloat(parts[1]) || 0,
                category: parts[2] || 'General'
            });
        }
    }

    return {
        items: items.length > 0 ? items : getDefaultShoppingItems(),
        currency: 'USD',
        taxRate: 0.08,
        discountRate: 0.00
    };
};

const parseParameterFormatShopping = (text: string): any => {
    const result = {
        items: getDefaultShoppingItems(),
        currency: 'USD',
        taxRate: 0.08,
        discountRate: 0.00
    };

    const pairs = text.split(',').map(s => s.trim());
    for (const pair of pairs) {
        if (pair.includes(':')) {
            const [key, value] = pair.split(':').map(s => s.trim());
            const lowerKey = key.toLowerCase();

            switch (lowerKey) {
                case 'currency':
                    result.currency = value.toUpperCase();
                    break;
                case 'taxrate':
                case 'tax':
                    result.taxRate = parseFloat(value) || 0;
                    break;
                case 'discountrate':
                case 'discount':
                    result.discountRate = parseFloat(value) || 0;
                    break;
                case 'items':
                    result.items = parseItemsString(value);
                    break;
            }
        }
    }

    return result;
};

const parseItemsString = (itemsStr: string): any[] => {
    const items = [];
    const entries = itemsStr.split('|').filter(entry => entry.trim());

    for (const entry of entries) {
        const parts = entry.trim().split(/\s+/);
        if (parts.length >= 3) {
            items.push({
                name: parts[0],
                quantity: parseFloat(parts[1]) || 1,
                unitPrice: parseFloat(parts[2]) || 0,
                category: parts[3] || 'General'
            });
        }
    }

    return items.length > 0 ? items : getDefaultShoppingItems();
};

const getDefaultShoppingItems = (): any[] => {
    return [
        { name: 'Rice', quantity: 2, unitPrice: 12.00, category: 'Grains' },
        { name: 'Oil', quantity: 3, unitPrice: 5.00, category: 'Cooking' },
        { name: 'Bread', quantity: 4, unitPrice: 2.50, category: 'Bakery' },
        { name: 'Milk', quantity: 2, unitPrice: 3.00, category: 'Dairy' },
        { name: 'Sugar', quantity: 1, unitPrice: 4.50, category: 'Baking' }
    ];
};

const validateShoppingParams = (params: any): any => {
    const result = {
        items: Array.isArray(params.items) ? params.items : getDefaultShoppingItems(),
        currency: params.currency || 'USD',
        taxRate: parseFloat(params.taxRate) || 0.08,
        discountRate: parseFloat(params.discountRate) || 0.00
    };

    // Validate items
    result.items = result.items.map((item: any) => ({
        name: item.name || 'Item',
        quantity: Math.max(0, parseFloat(item.quantity) || 1),
        unitPrice: Math.max(0, parseFloat(item.unitPrice) || 0),
        category: item.category || 'General'
    }));

    return result;
};

// Updated parameter validation function
const handleSpreadsheetParams = async (sock: any, from: string, text: string) => {
    const sendMessageWithTyping = async (msg: AnyMessageContent) => {
        await sock.presenceSubscribe(from);
        await delay(500);
        await sock.sendPresenceUpdate('composing', from);
        await delay(1500);
        await sock.sendPresenceUpdate('paused', from);
        await sock.sendMessage(from, msg);
    };

    const session = getUserSession(from);
    const cleanText = text.toLowerCase().trim();

    if (cleanText === 'cancel') {
        resetUserSession(from);
        await sendMessageWithTyping({ text: '❌ Spreadsheet operation cancelled.' });
        return;
    }

    const params = parseParamsString(text, session.spreadsheetType);
    session.spreadsheetParams = params;
    session.awaitingSpreadsheetParams = false;
    session.lastActivity = Date.now();

    // Validate parameters based on type
    let isValid = true;
    let validationMessage = '';

    switch (session.spreadsheetType) {
        case 'normal_distribution':
        case 'custom_normal':
            isValid = params.mean !== undefined && params.standardDeviation > 0 && 
                     params.sampleSize >= 10 && params.confidenceLevel > 0 && params.confidenceLevel < 1;
            validationMessage = 'Invalid normal distribution parameters. Check mean, standard deviation (>0), sample size (≥10), and confidence level (0-1)';
            break;
        case 'bet_analysis':
            isValid = params.betAmount && params.odds && params.oddsFormat && params.winProbability && params.bankroll;
            validationMessage = 'Missing required betting parameters';
            break;
        case 'linearfunction':
            isValid = params.m !== undefined && params.b !== undefined;
            validationMessage = 'Missing m or b parameters';
            break;
        case 'customlinear':
            isValid = params.equation;
            validationMessage = 'Missing equation parameter';
            break;
        case 'quadraticformula':
            isValid = params.a !== undefined && params.b !== undefined && params.c !== undefined;
            validationMessage = 'Missing a, b, or c parameters';
            break;
        case 'customquadratic':
            isValid = params.equation;
            validationMessage = 'Missing equation parameter';
            break;
        case 'compoundinterest':
            isValid = params.P !== undefined && params.r !== undefined && params.n !== undefined && params.t !== undefined;
            validationMessage = 'Missing P, r, n, or t parameters';
            break;
        case 'shopping_list':
        case 'custom_shopping':
            isValid = params.items && Array.isArray(params.items) && params.items.length > 0;
            validationMessage = 'Invalid shopping list data';
            break;
    }

    if (!isValid) {
        await sendMessageWithTyping({ text: `❌ ${validationMessage}. Please check the format and try again.` });
        session.awaitingSpreadsheetParams = true;
        return;
    }

    await sendMessageWithTyping({ text: '🔄 Processing your calculation...' });

    try {
        const calc = new SpreadsheetCalculator();
        const spreadsheet = calc.generateSpreadsheet(session.spreadsheetType, params);

        // Generate temp files
        const pngPath = createTempFilePath('png');
        const xlsxPath = createTempFilePath('xlsx');

        // Render PNG
        calc.renderSpreadsheet(pngPath);

        // Export XLSX
        calc.exportToXLSX(xlsxPath);

        // Send PNG as image
        await sock.sendMessage(from, {
            image: fs.readFileSync(pngPath),
            caption: `📊 Spreadsheet for ${session.spreadsheetType.toUpperCase()}`
        });

        // Send XLSX as document
        await sock.sendMessage(from, {
            document: fs.readFileSync(xlsxPath),
            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            fileName: `${session.spreadsheetType}_spreadsheet.xlsx`
        });

        // Generate and send statistics
        const stats = calc.generateStatistics();
        const statsText = `📈 *Calculation Statistics:*\n\n${stats.join('\n')}`;
        await sendMessageWithTyping({ text: statsText });

        // Send additional insights for normal distribution
        if (session.spreadsheetType === 'normal_distribution' || session.spreadsheetType === 'custom_normal') {
            const insights = generateNormalDistributionInsights(params, calc.calculateNormalDistributionMetrics(params));
            const insightsText = `🔍 *Statistical Insights:*\n\n${insights.join('\n')}`;
            await sendMessageWithTyping({ text: insightsText });
        }

        // Cleanup temp files
        await new Promise(resolve => setTimeout(() => {
            cleanupTempFile(pngPath);
            cleanupTempFile(xlsxPath);
            resolve(null);
        }, 5000));

        resetUserSession(from);
        await sendMessageWithTyping({ text: '✅ Calculation complete! Start a new one with "spreadsheet".' });
    } catch (error) {
        console.error('Error processing spreadsheet:', error);
        await sendMessageWithTyping({ text: `❌ Error processing calculation: ${error.message}. Please try again or use "cancel" to exit.` });
        resetUserSession(from);
    }
};


// Helper function to generate insights for normal distribution
const generateNormalDistributionInsights = (params: any, metrics: any): string[] => {
    const insights = [];

    // Sample quality assessment
    const meanDifference = Math.abs(metrics.sampleMean - params.mean);
    if (meanDifference < params.standardDeviation * 0.1) {
        insights.push('✅ Sample mean very close to population mean - Excellent quality');
    } else if (meanDifference < params.standardDeviation * 0.2) {
        insights.push('✅ Sample mean reasonably close to population mean - Good quality');
    } else {
        insights.push('⚠️ Sample mean differs significantly - Consider larger sample');
    }

    // Normality assessment
    if (Math.abs(metrics.skewness) < 0.5 && Math.abs(metrics.kurtosis - 3) < 1) {
        insights.push('✅ Data appears normally distributed - Good for statistical inference');
    } else {
        let issues = [];
        if (Math.abs(metrics.skewness) >= 0.5) {
            issues.push(`${metrics.skewness > 0 ? 'right' : 'left'}-skewed`);
        }
        if (Math.abs(metrics.kurtosis - 3) >= 1) {
            issues.push(`${metrics.kurtosis > 3 ? 'heavy' : 'light'}-tailed`);
        }
        insights.push(`⚠️ Data shows ${issues.join(' and ')} characteristics`);
    }

    // Sample size adequacy
    if (params.sampleSize >= 1000) {
        insights.push('✅ Large sample - Excellent statistical power');
    } else if (params.sampleSize >= 100) {
        insights.push('✅ Good sample size for most analyses');
    } else if (params.sampleSize >= 30) {
        insights.push('✅ Adequate for basic normal distribution analyses');
    } else {
        insights.push('⚠️ Small sample - Consider increasing for reliability');
    }

    // Confidence interval precision
    const precisionPercentage = (metrics.marginOfError / params.mean * 100);
    if (precisionPercentage <= 5) {
        insights.push(`✅ Excellent precision - Margin of error ${precisionPercentage.toFixed(1)}% of mean`);
    } else if (precisionPercentage <= 10) {
        insights.push(`✅ Good precision - Margin of error ${precisionPercentage.toFixed(1)}% of mean`);
    } else {
        insights.push(`⚠️ Limited precision - Margin of error ${precisionPercentage.toFixed(1)}% of mean`);
    }

    // Practical recommendations
    if (Math.abs(metrics.skewness) >= 1.0) {
        insights.push('📊 Consider data transformation to reduce skewness');
    }

    if (params.sampleSize < 100) {
        insights.push('📈 Increase sample size for more robust statistical inferences');
    }

    // Range analysis
    const theoreticalRange = 6 * params.standardDeviation; // ±3σ covers ~99.7%
    const rangeRatio = metrics.range / theoreticalRange;

    if (rangeRatio >= 0.8 && rangeRatio <= 1.2) {
        insights.push('✅ Data range consistent with normal distribution expectations');
    } else if (rangeRatio < 0.8) {
        insights.push('⚠️ Data range smaller than expected - May indicate limited variability');
    } else {
        insights.push('⚠️ Data range larger than expected - Check for outliers');
    }

    // Outlier detection insight
    const lowerFence = params.mean - 3 * params.standardDeviation;
    const upperFence = params.mean + 3 * params.standardDeviation;
    const outlierCount = Math.max(0, Math.floor(params.sampleSize * 0.003)); // Expected ~0.3% outliers

    if (outlierCount === 0) {
        insights.push('✅ No extreme outliers expected within ±3σ');
    } else {
        insights.push(`⚠️ ~${outlierCount} outliers expected - Review for data quality`);
    }

    // Central Limit Theorem applicability
    if (params.sampleSize >= 30) {
        insights.push('✅ Sample size adequate for Central Limit Theorem');
    } else {
        insights.push('⚠️ Small sample - Central Limit Theorem may not fully apply');
    }

    // Statistical power insight
    const effectSize = Math.abs(metrics.sampleMean - params.mean) / params.standardDeviation;
    if (effectSize < 0.2) {
        insights.push('📐 Small effect size detected - May need larger sample for significance');
    } else if (effectSize < 0.5) {
        insights.push('📐 Medium effect size detected - Good for statistical testing');
    } else {
        insights.push('📐 Large effect size detected - High statistical power');
    }

    // Confidence level interpretation
    insights.push(`🎯 ${(params.confidenceLevel * 100).toFixed(1)}% confident population mean is within confidence interval`);

    // Practical interpretation
    const standardError = params.standardDeviation / Math.sqrt(params.sampleSize);
    insights.push(`📏 Standard error: ${standardError.toFixed(4)} - Measures sampling variability`);

    return insights;
};





// YouTube Handlers
const handleYouTubeSearch = async (sock: any, from: string, query: string) => {
    try {
        const session = getUserSession(from)
        if (query.toLowerCase() === 'cancel') {
            resetUserSession(from)
            return await sock.sendMessage(from, { text: '❌ YouTube search cancelled.' })
        }

        await sock.sendMessage(from, { text: '🔍 Searching YouTube...' })
        const videoInfo = await getYoutubeVideoInfo(query)

        if (videoInfo.error) {
            resetUserSession(from)
            return await sock.sendMessage(from, { text: `❌ ${videoInfo.error}` })
        }

        const info = videoInfo.result
        const infoText = `🎬 *YouTube Video Found*\n\n` +
            `📝 *Title:* ${info.title}\n` +
            `⏱️ *Duration:* ${info.durationFormatted}\n` +
            `📺 *Channel:* ${info.channelId}\n` +
            `👀 *Views:* ${info.viewCount ? info.viewCount.toLocaleString() : 'N/A'}\n` +
            `👍 *Likes:* ${info.likeCount ? info.likeCount.toLocaleString() : 'N/A'}\n` +
            `🆔 *Video ID:* ${info.videoId}\n` +
            `📝 *Description:* ${info.shortDescription.substring(0, 200)}${info.shortDescription.length > 200 ? '...' : ''}`

        await sock.sendMessage(from, { text: infoText })

        // Send thumbnail
        if (info.thumbnail) {
            try {
                const thumbnailPath = createTempFilePath('jpg')
                await downloadImage(info.thumbnail, thumbnailPath)
                const thumbnailBuffer = fs.readFileSync(thumbnailPath)
                await sock.sendMessage(from, {
                    image: thumbnailBuffer,
                    caption: '🖼️ Video Thumbnail'
                })
                cleanupTempFile(thumbnailPath)
            } catch (error) {
                console.error('Error downloading thumbnail:', error)
            }
        }

        // Get related videos
        const relatedVideos = (await getRelatedVideos(info.videoId)).result || []

        // Store context and set state
        session.youtubeContext = { videoInfo: info, relatedVideos }
        session.awaitingYouTubeAction = true
        session.awaitingYouTubeQuery = false
        session.lastActivity = Date.now()

        // Send action options
        await sock.sendMessage(from, {
            text: `🎯 *Choose an action:*\n\n` +
                  `🎵 *mp3* - Download Audio\n` +
                  `🎬 *mp4* - Download Video\n` +
                  `🔗 *related* - Show Related Videos\n` +
                  `🖼️ *thumbnail* - Extract Thumbnail\n` +
                  `❌ *cancel* - Cancel Operation\n\n` +
                  `Reply with your choice:`
        })

    } catch (error) {
        console.error('YouTube search error:', error)
        resetUserSession(from)
        await sock.sendMessage(from, { text: '❌ Error searching YouTube. Please try again.' })
    }
}

const extractThumbnail = async (sock: any, from: string, videoInfo: any) => {
    try {
        await sock.sendMessage(from, { text: '🖼️ Extracting thumbnail...' })
        if (!videoInfo.thumbnail) {
            return await sock.sendMessage(from, { text: '❌ No thumbnail available for this video.' })
        }

        const thumbnailPath = createTempFilePath('jpg')
        await downloadImage(videoInfo.thumbnail, thumbnailPath)
        const thumbnailBuffer = fs.readFileSync(thumbnailPath)
        
        await sock.sendMessage(from, {
            image: thumbnailBuffer,
            caption: `🖼️ *Thumbnail Extracted*\n\n📝 *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.channelId}`
        })
        cleanupTempFile(thumbnailPath)

        // Reset session after successful operation
        resetUserSession(from)
        await sock.sendMessage(from, { text: '✅ Operation completed. Type "youtube" to search for another video.' })
    } catch (error) {
        console.error('Thumbnail extraction error:', error)
        await sock.sendMessage(from, { text: '❌ Error extracting thumbnail. Please try again.' })
    }
}

const downloadYouTubeAudio = async (sock: any, from: string, videoInfo: any) => {
    try {
        await sock.sendMessage(from, { text: '🎵 Downloading audio... Please wait.' })
        const audioResult = await getYoutubeMP3(`https://www.youtube.com/watch?v=${videoInfo.videoId}`)

        if (audioResult.error) {
            return await sock.sendMessage(from, { text: `❌ Error downloading audio: ${audioResult.error}` })
        }

        const tempFilePath = createTempFilePath('mp3')
        fs.writeFileSync(tempFilePath, audioResult.result)
        
        const audioBuffer = fs.readFileSync(tempFilePath)
        await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${videoInfo.title}.mp3`
        })
        
        await sock.sendMessage(from, { text: `🎵 *${videoInfo.title}*\n✅ Audio downloaded successfully!` })
        cleanupTempFile(tempFilePath)

        // Reset session after successful operation
        resetUserSession(from)
        await sock.sendMessage(from, { text: '✅ Operation completed. Type "youtube" to search for another video.' })
    } catch (error) {
        console.error('Audio download error:', error)
        await sock.sendMessage(from, { text: '❌ Error downloading audio. Please try again.' })
    }
}

const downloadYouTubeVideo = async (sock: any, from: string, videoInfo: any) => {
    try {
        await sock.sendMessage(from, { text: '🎬 Downloading video... Please wait (this may take a while).' })
        const videoResult = await getYoutubeMP4(`https://www.youtube.com/watch?v=${videoInfo.videoId}`)

        if (videoResult.error) {
            return await sock.sendMessage(from, { text: `❌ Error downloading video: ${videoResult.error}` })
        }

        const tempFilePath = createTempFilePath('mp4')
        fs.writeFileSync(tempFilePath, videoResult.result)
        const fileSizeMB = fs.statSync(tempFilePath).size / (1024 * 1024)

        if (fileSizeMB > 64) {
            await sock.sendMessage(from, {
                text: `❌ Video is too large (${fileSizeMB.toFixed(1)}MB). WhatsApp limit is 64MB.\n\n` +
                      `Would you like to download as audio instead? Reply with "mp3" or "cancel".`
            })
            cleanupTempFile(tempFilePath)
            return
        }

        const videoBuffer = fs.readFileSync(tempFilePath)
        await sock.sendMessage(from, {
            video: videoBuffer,
            caption: `🎬 *${videoInfo.title}*\n✅ Video downloaded successfully!`,
            fileName: `${videoInfo.title}.mp4`
        })
        cleanupTempFile(tempFilePath)

        // Reset session after successful operation
        resetUserSession(from)
        await sock.sendMessage(from, { text: '✅ Operation completed. Type "youtube" to search for another video.' })
    } catch (error) {
        console.error('Video download error:', error)
        await sock.sendMessage(from, { text: '❌ Error downloading video. Please try again.' })
    }
}

const showRelatedVideos = async (sock: any, from: string, relatedVideos: any[]) => {
    try {
        if (!relatedVideos || relatedVideos.length === 0) {
            return await sock.sendMessage(from, { text: '❌ No related videos found.' })
        }

        const session = getUserSession(from)
        session.awaitingRelatedSelection = true
        session.awaitingYouTubeAction = false
        session.lastActivity = Date.now()

        const relatedVideosText = relatedVideos
            .slice(0, 5)
            .map((video, index) =>
                `*${index + 1}.* ${video.title}\n` +
                `   ⏱️ Duration: ${video.durationFormatted}\n` +
                `   📺 Channel: ${video.channelId}\n` +
                `   🆔 Video ID: ${video.videoId}`
            )
            .join('\n\n')

        await sock.sendMessage(from, { text: `🔗 *Related Videos:*\n\n${relatedVideosText}` })
        await sock.sendMessage(from, { 
            text: `📱 *Select a video:*\n\nReply with the number (1-5) of the video you want to select.\n\n` +
                  `🔙 Reply with "back" to return to previous video\n` +
                  `❌ Reply with "cancel" to exit`
        })

    } catch (error) {
        console.error('Error showing related videos:', error)
        await sock.sendMessage(from, { text: '❌ Error retrieving related videos. Please try again.' })
    }
}

const handleRelatedVideoSelection = async (sock: any, from: string, selection: string) => {
    try {
        const session = getUserSession(from)

        if (selection.toLowerCase() === 'cancel') {
            resetUserSession(from)
            return await sock.sendMessage(from, { text: '❌ Operation cancelled.' })
        }

        if (selection.toLowerCase() === 'back') {
            session.awaitingRelatedSelection = false
            session.awaitingYouTubeAction = true
            session.lastActivity = Date.now()

            await sock.sendMessage(from, {
                text: `🎯 *Choose an action:*\n\n` +
                      `🎵 *mp3* - Download Audio\n` +
                      `🎬 *mp4* - Download Video\n` +
                      `🔗 *related* - Show Related Videos\n` +
                      `🖼️ *thumbnail* - Extract Thumbnail\n` +
                      `❌ *cancel* - Cancel Operation\n\n` +
                      `Reply with your choice:`
            })
            return
        }

        const videoIndex = parseInt(selection) - 1
        if (isNaN(videoIndex) || videoIndex < 0 || videoIndex >= session.youtubeContext.relatedVideos.length) {
            return await sock.sendMessage(from, {
                text: '❌ Invalid selection. Please reply with a number (1-5) or "back" to return.'
            })
        }

        const selectedVideo = session.youtubeContext.relatedVideos[videoIndex]

        // Get full video info for the selected video
        await sock.sendMessage(from, { text: '🔍 Loading selected video...' })
        const videoInfo = await getYoutubeVideoInfo(selectedVideo.videoId)

        if (videoInfo.error) {
            return await sock.sendMessage(from, { text: `❌ Error loading video: ${videoInfo.error}` })
        }

        // Update session with new video
        session.youtubeContext.videoInfo = videoInfo.result
        session.awaitingRelatedSelection = false
        session.awaitingYouTubeAction = true
        session.lastActivity = Date.now()

        const info = videoInfo.result
        const infoText = `🎬 *Selected Video*\n\n` +
            `📝 *Title:* ${info.title}\n` +
            `⏱️ *Duration:* ${info.durationFormatted}\n` +
            `📺 *Channel:* ${info.channelId}\n` +
            `👀 *Views:* ${info.viewCount ? info.viewCount.toLocaleString() : 'N/A'}\n` +
            `👍 *Likes:* ${info.likeCount ? info.likeCount.toLocaleString() : 'N/A'}`

        await sock.sendMessage(from, { text: infoText })

        // Send thumbnail if available
        if (info.thumbnail) {
            try {
                const thumbnailPath = createTempFilePath('jpg')
                await downloadImage(info.thumbnail, thumbnailPath)
                const thumbnailBuffer = fs.readFileSync(thumbnailPath)
                await sock.sendMessage(from, {
                    image: thumbnailBuffer,
                    caption: '🖼️ Video Thumbnail'
                })
                cleanupTempFile(thumbnailPath)
            } catch (error) {
                console.error('Error downloading thumbnail:', error)
            }
        }

        // Send action options
        await sock.sendMessage(from, {
            text: `🎯 *Choose an action:*\n\n` +
                  `🎵 *mp3* - Download Audio\n` +
                  `🎬 *mp4* - Download Video\n` +
                  `🔗 *related* - Show Related Videos\n` +
                  `🖼️ *thumbnail* - Extract Thumbnail\n` +
                  `❌ *cancel* - Cancel Operation\n\n` +
                  `Reply with your choice:`
        })

    } catch (error) {
        console.error('Error handling related video selection:', error)
        await sock.sendMessage(from, { text: '❌ Error processing selection. Please try again.' })
    }
}




// Send welcome package with multiple media types
const sendWelcomePackage = async (sock: any, from: string) => {
    const sendMessageWithTyping = async (msg: AnyMessageContent) => {
        await sock.presenceSubscribe(from)
        await delay(500)
        await sock.sendPresenceUpdate('composing', from)
        await delay(1500)
        await sock.sendPresenceUpdate('paused', from)
        await sock.sendMessage(from, msg)
    }

    try {
        // Welcome text
        await sendMessageWithTyping({
            text: `🎉 *Welcome Package Loading...*

📦 Preparing your welcome gifts:
• 🖼️ Welcome Image
• 🎥 Demo Video
• 🎵 Welcome Audio
• 📄 Bot Manual
• 📞 Contact Info

Please wait while we prepare everything for you! ✨`
        })

        // Send welcome image
        await delay(1000)
        const imageBuffer = await downloadFromUrl(mediaLibrary.images.welcome)
        await sendMessageWithTyping({
            image: imageBuffer,
            caption: '🖼️ *Welcome Image*\n\nHere\'s a beautiful image to welcome you to our bot service! This image is dynamically loaded from our media library.'
        })

        // Send demo video
        await delay(2000)
        await sendMessageWithTyping({
            text: '🎥 Loading demo video... Please wait!'
        })

        try {
            const videoBuffer = await downloadFromUrl(mediaLibrary.videos.demo)
            await sendMessageWithTyping({
                video: videoBuffer,
                caption: '🎥 *Demo Video*\n\nThis is a sample video from our media library. Perfect for demonstrations and testing!',
                gifPlayback: false
            })
        } catch (error) {
            await sendMessageWithTyping({
                text: '❌ Video temporarily unavailable. Continuing with other media...'
            })
        }

        // Send contact card
        await delay(2000)
        await sendMessageWithTyping({
            contacts: {
                displayName: contactsLibrary.support.name,
                contacts: [{
                    displayName: contactsLibrary.support.name,
                    vcard: `BEGIN:VCARD
VERSION:3.0
FN:${contactsLibrary.support.name}
ORG:${contactsLibrary.support.company}
TEL:${contactsLibrary.support.number}
EMAIL:${contactsLibrary.support.email}
END:VCARD`
                }]
            }
        })

        // Final welcome message
        await delay(1000)
        await sendMessageWithTyping({
            text: `✅ *Welcome Package Complete!*

🎁 You've received:
• ✅ Welcome image
• ✅ Demo video
• ✅ Support contact
• ✅ Full bot access

🤖 *Ready to explore more?*
Type *help* or *menu* to see all available commands!

*Happy chatting!* 🚀`
        })

    } catch (error) {
        console.error('Error sending welcome package:', error)
        await sock.sendMessage(from, {
            text: '❌ Sorry, there was an error preparing your welcome package. Please try again later!'
        })
    }
}

// Send gallery options
const sendGalleryOptions = async (sock: any, from: string) => {
    try {
        const galleryText = `🖼️ *Image Gallery*

Choose from our pre-configured image collection:

🎯 *Available Images:*
• *welcome* - Beautiful welcome image
• *logo* - Bot service logo
• *meme* - Random funny meme
• *nature* - Scenic nature photo

📱 *Usage:* Reply with the image name you want!`

        await sock.sendMessage(from, { text: galleryText })

        // Send a sample image
        await delay(1000)
        const imageBuffer = await downloadFromUrl(mediaLibrary.images.logo)
        await sock.sendMessage(from, {
            image: imageBuffer,
            caption: '🖼️ *Sample from Gallery*\n\nThis is our bot logo! Type the name of any image from the list above to get it.'
        })
    } catch (error) {
        console.error('Error sending gallery:', error)
        await sock.sendMessage(from, { text: '❌ Gallery temporarily unavailable.' })
    }
}

// Send pre-configured video
const sendPreConfiguredVideo = async (sock: any, from: string) => {
    try {
        await sock.sendMessage(from, { text: '🎥 Loading video... Please wait!' })

        const videoBuffer = await downloadFromUrl(mediaLibrary.videos.demo)
        await sock.sendMessage(from, {
            video: videoBuffer,
            caption: '🎥 *Demo Video*\n\nHere\'s a sample video from our media library. Great for testing and demonstrations!',
            gifPlayback: false
        })
    } catch (error) {
        console.error('Error sending video:', error)
        await sock.sendMessage(from, {
            text: '❌ Video temporarily unavailable. Our media servers might be busy. Please try again later!'
        })
    }
}

// Send pre-configured audio
const sendPreConfiguredAudio = async (sock: any, from: string) => {
    try {
        await sock.sendMessage(from, { text: '🎵 Loading audio... Please wait!' })

        const audioBuffer = await downloadFromUrl(mediaLibrary.audio.notification)
        await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mp3',
            ptt: false // Set to true for voice note
        })

        await sock.sendMessage(from, {
            text: '🎵 *Audio Sent!*\n\nThis is a sample audio file from our media library. Perfect for notifications and alerts!'
        })
    } catch (error) {
        console.error('Error sending audio:', error)
        await sock.sendMessage(from, {
            text: '❌ Audio temporarily unavailable. Please try again later!'
        })
    }
}

// Send pre-configured document
const sendPreConfiguredDocument = async (sock: any, from: string) => {
    try {
        await sock.sendMessage(from, { text: '📄 Loading document... Please wait!' })

        const docBuffer = await downloadFromUrl(mediaLibrary.documents.manual)
        await sock.sendMessage(from, {
            document: docBuffer,
            mimetype: 'application/pdf',
            fileName: 'Bot_Manual.pdf',
            caption: '📄 *Bot Manual*\n\nHere\'s the complete user manual for our bot service. This document contains all the information you need!'
        })
    } catch (error) {
        console.error('Error sending document:', error)
        await sock.sendMessage(from, {
            text: '❌ Document temporarily unavailable. Please try again later!'
        })
    }
}

// Send full media demonstration
const sendFullMediaDemo = async (sock: any, from: string) => {
    await sock.sendMessage(from, {
        text: `🎬 *Full Media Demo Starting...*

📋 Demo includes:
• 🖼️ Images (4 types)
• 🎥 Videos (2 samples)
• 🎵 Audio files
• 📄 Documents
• 📞 Contact cards
• 📍 Location data

⏳ This will take about 30 seconds...`
    })

    // Send images
    for (const [key, url] of Object.entries(mediaLibrary.images)) {
        try {
            await delay(2000)
            const buffer = await downloadFromUrl(url)
            await sock.sendMessage(from, {
                image: buffer,
                caption: `🖼️ *${key.toUpperCase()} Image*\n\nFrom our ${key} collection`
            })
        } catch (error) {
            console.log(`Skipping ${key} image due to error`)
        }
    }

    // Send contact demo
    await delay(2000)
    await sock.sendMessage(from, {
        contacts: {
            displayName: 'Demo Contact',
            contacts: [{
                displayName: 'Demo Contact',
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:Demo Contact
ORG:Demo Company
TEL:+1-555-DEMO
EMAIL:demo@example.com
END:VCARD`
            }]
        }
    })

    // Final message
    await delay(1000)
    await sock.sendMessage(from, {
        text: `✅ *Media Demo Complete!*

🎯 You've seen our full media capabilities!
All content is pre-configured and ready to use.

Type *help* for the full command list! 🚀`
    })
}

// Send contact directory
const sendContactDirectory = async (sock: any, from: string) => {
    const contactText = `📞 *Contact Directory*

Choose a contact to receive their details:

👥 *Available Contacts:*
• *support* - Customer Support Team
• *admin* - Bot Administrator
• *developer* - Development Team

📱 *Usage:* Reply with the contact name you want!`

    await sock.sendMessage(from, { text: contactText })
}

// Send location demo
const sendLocationDemo = async (sock: any, from: string) => {
    await sock.sendMessage(from, {
        location: {
            degreesLatitude: 40.7128,
            degreesLongitude: -74.0060,
            name: 'Demo Location',
            address: 'New York City, NY, USA'
        }
    })

    await sock.sendMessage(from, {
        text: '📍 *Location Demo*\n\nThis is a sample location share. You can configure any location coordinates in the bot!'
    })
}



// Create demo poll
const createDemoPoll = async (sock: any, from: string) => {
    await sock.sendMessage(from, {
        poll: {
            name: '🗳️ Demo Poll - What\'s your favorite feature?',
            values: [
                '🖼️ Image Gallery',
                '🎥 Video Library', 
                '🎵 Audio Collection',
                '📄 Document Sharing',
                '📞 Contact Directory',
                '🤖 Auto Responses'
            ],
            selectableCount: 1
        }
    })
    
    await sock.sendMessage(from, {
        text: '🗳️ *Poll Created!*\n\nThis is a sample poll. You can create polls on any topic with custom options!'
    })
}

// Send image from URL
const sendImageFromUrl = async (sock: any, from: string, url: string) => {
    try {
        await sock.sendMessage(from, { text: '🖼️ Loading image from URL...' })
        const buffer = await downloadFromUrl(url)
        await sock.sendMessage(from, {
            image: buffer,
            caption: `🖼️ *Image from URL*\n\nSource: ${url}`
        })
    } catch (error) {
        await sock.sendMessage(from, { text: '❌ Failed to load image from URL!' })
    }
}

// Send video from URL
const sendVideoFromUrl = async (sock: any, from: string, url: string) => {
    try {
        await sock.sendMessage(from, { text: '🎥 Loading video from URL...' })
        const buffer = await downloadFromUrl(url)
        await sock.sendMessage(from, {
            video: buffer,
            caption: `🎥 *Video from URL*\n\nSource: ${url}`
        })
    } catch (error) {
        await sock.sendMessage(from, { text: '❌ Failed to load video from URL!' })
    }
}

// Send audio from URL
const sendAudioFromUrl = async (sock: any, from: string, url: string) => {
    try {
        await sock.sendMessage(from, { text: '🎵 Loading audio from URL...' })
        const buffer = await downloadFromUrl(url)
        await sock.sendMessage(from, {
            audio: buffer,
            mimetype: 'audio/mp3'
        })
        await sock.sendMessage(from, { text: `🎵 *Audio from URL*\n\nSource: ${url}` })
    } catch (error) {
        await sock.sendMessage(from, { text: '❌ Failed to load audio from URL!' })
    }
}

// Send document from URL
const sendDocumentFromUrl = async (sock: any, from: string, url: string) => {
    try {
        await sock.sendMessage(from, { text: '📄 Loading document from URL...' })
        const buffer = await downloadFromUrl(url)
        const fileName = url.split('/').pop() || 'document.pdf'
        await sock.sendMessage(from, {
            document: buffer,
            mimetype: 'application/pdf',
            fileName: fileName,
            caption: `📄 *Document from URL*\n\nSource: ${url}`
        })
    } catch (error) {
        await sock.sendMessage(from, { text: '❌ Failed to load document from URL!' })
    }
}

// Download media from message
const downloadMedia = async (sock: any, msg: any, from: string) => {
    try {
        await sock.sendMessage(from, { text: '⬇️ Downloading media...' })
        
        const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
                logger,
                reuploadRequest: sock.updateMediaMessage
            }
        )
        
        // Save to downloads directory
        const timestamp = Date.now()
        const extension = msg.message?.imageMessage ? 'jpg' :
                         msg.message?.videoMessage ? 'mp4' :
                         msg.message?.audioMessage ? 'mp3' : 'bin'
        
        const filename = `download_${timestamp}.${extension}`
        const filepath = path.join(downloadsDir, filename)
        
        fs.writeFileSync(filepath, buffer as Buffer)
        
        await sock.sendMessage(from, { 
            text: `✅ *Media Downloaded!*
            
📁 File: ${filename}
💾 Size: ${(buffer as Buffer).length} bytes
📂 Location: ${filepath}
⏰ Downloaded: ${new Date().toLocaleString()}` 
        })
        
    } catch (error) {
        console.error('Download error:', error)
        await sock.sendMessage(from, { text: '❌ Failed to download media!' })
    }
}

// Convert image to sticker
const convertToSticker = async (sock: any, msg: any, from: string) => {
    try {
        await sock.sendMessage(from, { text: '🎨 Converting to sticker...' })
        
        const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
                logger,
                reuploadRequest: sock.updateMediaMessage
            }
        )
        
        await sock.sendMessage(from, {
            sticker: buffer as Buffer
        })
        
        await sock.sendMessage(from, { text: '✅ Sticker created! 🎉' })
        
    } catch (error) {
        console.error('Sticker conversion error:', error)
        await sock.sendMessage(from, { text: '❌ Failed to create sticker!' })
    }
}


// Heartbeat variables
let lastHeartbeat = Date.now()
let isConnected = false

// Heartbeat function to check connection health
const startHeartbeat = (sock: any) => {
    setInterval(async () => {
        if (isConnected && Date.now() - lastHeartbeat > 30000) { // 30 seconds
            console.log('💓 Sending heartbeat...')
            try {
                await sock.sendPresenceUpdate('available')
                lastHeartbeat = Date.now()
                console.log('✅ Heartbeat sent')
            } catch (error) {
                console.error('❌ Heartbeat failed:', error.message)
            }
        }
    }, 15000) // Check every 15 seconds
}

// Main socket connection function
const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

    // Fetch latest WhatsApp Web version
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: !usePairingCode,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        getMessage: async (key: WAMessageKey): Promise<WAMessageContent | undefined> => {
            return { conversation: 'Hello' }
        }
    })

    // Helper function to send message with typing indicator
    const sendMessageWithTyping = async (msg: AnyMessageContent, jid: string) => {
        await sock.presenceSubscribe(jid)
        await delay(500)

        await sock.sendPresenceUpdate('composing', jid)
        await delay(2000)

        await sock.sendPresenceUpdate('paused', jid)
        await sock.sendMessage(jid, msg)
    }

    // Event handlers
    sock.ev.process(async (events) => {

        // Connection updates
        if (events['connection.update']) {
            const update = events['connection.update']
            const { connection, lastDisconnect, qr } = update

            if (qr && !usePairingCode) {
                console.log('\n📱 QR Code:')
                QRCode.generate(qr, { small: true })
                console.log('Scan the QR code above with WhatsApp on your phone\n')
            }

            if (connection === 'close') {
                isConnected = false // Update heartbeat status
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

                if (shouldReconnect) {
                    console.log('Connection closed, reconnecting...')
                    setTimeout(() => startSock(), 3000)
                } else {
                    console.log('❌ Connection closed. You are logged out.')
                    process.exit(0)
                }
            } else if (connection === 'open') {
                console.log('✅ Connected to WhatsApp!')
                isConnected = true // Update heartbeat status
                lastHeartbeat = Date.now() // Reset heartbeat timer
                
                // Start heartbeat monitoring
                startHeartbeat(sock)
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...')
                isConnected = false // Update heartbeat status
            }

            console.log('Connection update:', { connection, lastDisconnect: lastDisconnect?.error })
        }

        // Handle pairing code
        if (events['connection.update'] && usePairingCode && !sock.authState.creds.registered) {
            try {
                const phoneNumber = await question('📞 Please enter your phone number (with country code, e.g., +1234567890): ')
                const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')

                if (cleanNumber.length < 10) {
                    console.log('❌ Invalid phone number format')
                    return
                }

                console.log('🔄 Requesting pairing code...')
                const code = await sock.requestPairingCode(cleanNumber)
                console.log(`\n🔐 Pairing code: ${code}`)
                console.log('Enter this code in WhatsApp > Linked Devices > Link a Device > Link with Phone Number\n')
            } catch (error) {
                console.error('❌ Error requesting pairing code:', error)
                console.log('Falling back to QR code method...')
                process.argv = process.argv.filter(arg => arg !== '--use-pairing-code')
                setTimeout(() => startSock(), 2000)
            }
        }

        if (events['creds.update']) {
            await saveCreds()
            console.log('💾 Credentials saved')
        }

        // Handle incoming messages and poll responses
        if (events['messages.upsert']) {
            const upsert = events['messages.upsert']

            // Update heartbeat on message activity
            if (isConnected) {
                lastHeartbeat = Date.now()
            }

            if (upsert.type === 'notify') {
                for (const msg of upsert.messages) {
                    // Handle poll responses
                    if (msg.message?.pollUpdateMessage) {
                        const pollUpdate = msg.message.pollUpdateMessage
                        const selectedOptions = pollUpdate.vote?.selectedOptions || []

                        if (selectedOptions.length > 0) {
                            const from = msg.key.remoteJid
                            if (from) {
                                // Map poll option to command
                                const optionIndex = selectedOptions[0]
                                const pollCommands = [
                                    'help', 'time', 'info', 'random', 'ping',
                                    'image', 'video', 'audio', 'document', 'contact', 'location', 'welcome'
                                ]

                                if (optionIndex < pollCommands.length) {
                                    const command = pollCommands[optionIndex]
                                    console.log(`🗳️ Poll response: ${command} from ${from}`)
                                    await handleCommand(command, from, msg, sock, sendMessageWithTyping)
                                }
                            }
                        }
                        continue
                    }

                    // Handle regular text messages
                    const text = msg.message?.conversation ||
                                msg.message?.extendedTextMessage?.text ||
                                ''

                    if (text) {
                        const from = msg.key.remoteJid
                        const isFromMe = msg.key.fromMe

                        console.log(`📨 ${isFromMe ? 'You' : from}: ${text}`)

                        if (!isFromMe && from) {
                            await sock.readMessages([msg.key])

                            const isCommand = await handleCommand(text, from, msg, sock, sendMessageWithTyping)

                            if (!isCommand && doReplies) {
                                console.log('🤖 Sending auto-reply...')
                                await sendMessageWithTyping(
                                    { text: '👋 Hello! This is an automated response. Type "help" for available commands.' },
                                    from
                                )
                            }
                        }
                    }
                }
            }
        }

        // Handle other events
        if (events['messages.update']) {
            console.log('📬 Message updates:', events['messages.update'].length)
        }

        if (events['message-receipt.update']) {
            console.log('📨 Receipt updates:', events['message-receipt.update'].length)
        }

        if (events['messages.reaction']) {
            console.log('😊 Reactions:', events['messages.reaction'].length)
        }

        if (events['presence.update']) {
            const presence = events['presence.update']
            console.log(`👤 ${presence.id} is ${presence.presences?.[presence.id]?.lastKnownPresence || 'unknown'}`)
            
            // Update heartbeat on presence activity
            if (isConnected) {
                lastHeartbeat = Date.now()
            }
        }

        if (events['chats.update']) {
            console.log('💬 Chat updates:', events['chats.update'].length)
        }

        if (events['contacts.update']) {
            console.log('👥 Contact updates:', events['contacts.update'].length)
        }
    })

    return sock
}



// Enhanced Command handler function with YouTube, Football, Statistical Analysis, Calculator, and Quadratic support
const handleCommand = async (text: string, from: string, msg: any, sock: any, sendMessageWithTyping: Function): Promise<boolean> => {
    const cleanText = text.toLowerCase().trim()
    const command = cleanText.startsWith('/') ? cleanText.split(' ')[0] : cleanText.split(' ')[0]
    const args = text.split(' ').slice(1)
    
    // Get user session for all functionality
    const session = getUserSession(from)
 
    if (session.awaitingRPGAnswer) {
        const result = await handleRPGAnswer(text, from, sock, sendMessageWithTyping)
        if (result) {
            await sendMessageWithTyping({ text: result }, from)
        }
        return true
    }



        // Handle Multi-League Football session states (PRIORITY: Check league-specific sessions first)
    if (session.awaitingEPLQuery) {
        await processLeagueMessage(from, text, 'epl', sock)
        return true
    }
    if (session.awaitingLaLigaQuery) {
        await processLeagueMessage(from, text, 'laliga', sock)
        return true
    }
    if (session.awaitingSerieAQuery) {
        await processLeagueMessage(from, text, 'seriea', sock)
        return true
    }
    if (session.awaitingBundesligaQuery) {
        await processLeagueMessage(from, text, 'bundesliga', sock)
        return true
    }
    if (session.awaitingLigue1Query) {
        await processLeagueMessage(from, text, 'ligue1', sock)
        return true
    }
    if (session.awaitingEredivisieQuery) {
        await processLeagueMessage(from, text, 'eredivisie', sock)
        return true
    }
    if (session.awaitingPrimeiraLigaQuery) {
        await processLeagueMessage(from, text, 'primeiraliga', sock)
        return true
    }
    if (session.awaitingProLeagueQuery) {
        await processLeagueMessage(from, text, 'proleague', sock)
        return true
    }
    if (session.awaitingSPLQuery) {
        await processLeagueMessage(from, text, 'spl', sock)
        return true
    }
    if (session.awaitingSuperLigQuery) {
        await processLeagueMessage(from, text, 'superlig', sock)
        return true
    }
   
    // Handle Statistical Analysis session states FIRST (highest priority after cancel)
    if (session.awaitingDistributionSelection || session.awaitingDataInput) {
        if (command === 'cancel' || command === 'stop') {
            resetUserSession(from)
            await sendMessageWithTyping(
                { text: "🚫 Statistical analysis cancelled. Type 'help' for available commands." },
                from
            )
            return true
        }
        await handleStatisticalAnalysis(text, from, sock, sendMessageWithTyping)
        return true
    }
    
    // Handle Quadratic session states (second priority)
    // Handle Quadratic session states (second priority)
    if (session.awaitingQuadraticInput) {
        if (command === 'cancel' || command === 'stop') {
            resetUserSession(from)
            await sendMessageWithTyping(
                { text: "❌ Quadratic solver session cancelled. Type 'help' for available commands." },
                from
            )
            return true
        }
        // Call the quadratic session handler directly
        const handled = await handleQuadraticSessionInput(text, from, session, sendMessageWithTyping)
        if (handled) return true
    }


    
    // Handle Calculator session states (third priority)
    if (session.awaitingCalculatorInput) {
        const handled = await handleCalculatorInput(sock, from, text, sendMessageWithTyping)
        if (handled) return true
    }
    
    // Handle pending resolves for Football questions
    if (session.pendingResolve) {
        session.pendingResolve(text)
        session.pendingResolve = null
        return true
    }
    
    // Handle YouTube session states
    if (session.awaitingYouTubeQuery) {
        await handleYouTubeSearch(sock, from, text)
        return true
    }
    
    if (session.awaitingYouTubeAction) {
        const action = cleanText
        const { videoInfo, relatedVideos } = session.youtubeContext
        
        switch (action) {
            case 'mp3':
            case 'audio':
                await downloadYouTubeAudio(sock, from, videoInfo)
                break
                
            case 'mp4':
            case 'video':
                await downloadYouTubeVideo(sock, from, videoInfo)
                break

            case 'related':
                await showRelatedVideos(sock, from, relatedVideos)
                break
                
            case 'thumbnail':
            case 'thumb':
                await extractThumbnail(sock, from, videoInfo)
                break
                
            case 'cancel':
                resetUserSession(from)
                await sendMessageWithTyping({ text: '❌ YouTube operation cancelled.' }, from)
                break
                
            default:
                await sendMessageWithTyping({
                    text: `❌ Invalid option. Please choose:\n\n` +
                          `🎵 *mp3* - Download Audio\n` +
                          `🎬 *mp4* - Download Video\n` +
                          `🔗 *related* - Show Related Videos\n` +
                          `🖼️ *thumbnail* - Extract Thumbnail\n` +
                          `❌ *cancel* - Cancel Operation`
                }, from)
        }
        return true
    }

    if (session.awaitingRelatedSelection) {
        await handleRelatedVideoSelection(sock, from, text)
        return true
    }
    
    // Handle spreadsheet session states
    if (session.awaitingSpreadsheetType) {
        await handleSpreadsheetType(sock, from, text)
        return true
    }

    if (session.awaitingSpreadsheetParams) {
        await handleSpreadsheetParams(sock, from, text)
        return true
    }

    // Handle Football input if awaiting
    if (session.awaitingFootballInput) {
        const choice = text.trim()
        const explorer = session.footballExplorer
        session.outputLines = []
        let exit = false
        
        switch (choice) {
            case '1':
                await explorer.showTeams()
                break
            case '2':
                await explorer.analyzeTeam()
                break
            case '3':
                await explorer.compareTeams()
                break
            case '4':
                await explorer.showTopPerformers()
                break
            case '5':
                await sendMessageWithTyping({ text: 'Filter matches not implemented.' }, from)
                break
            case '6':
                await explorer.compareLeagues()
                break
            case '7':
                await explorer.showMatchDetails()
                break
            case '8':
                await explorer.statisticsSummary()
                break
            case '9':
                await explorer.showFormTable()
                break
            case '10':
                await explorer.showPerformanceTrends()
                break
            case '11':
                await explorer.showPredictions()
                break
            case '0':
                exit = true
                break
            default:
                await sendMessageWithTyping({ text: 'Invalid choice. Please choose from the menu.' }, from)
                break
        }
        
        if (session.outputLines.length > 0) {
            await sendMessageWithTyping({ text: session.outputLines.join('\n') }, from)
            session.outputLines = []
        }
        
        if (exit) {
            session.awaitingFootballInput = false
            session.footballExplorer = null
            await sendMessageWithTyping({ text: 'Exited Football Data Explorer.' }, from)
        } else {
            session.outputLines = []
            await explorer.showMenu()
            await sendMessageWithTyping({ text: session.outputLines.join('\n') }, from)
            session.outputLines = []
            await sendMessageWithTyping({ text: 'Enter your choice:' }, from)
        }
        return true
    }

    // Define valid commands including Statistical Analysis and Quadratic
    const validCommands = [
        'help', 'menu', 'time', 'echo', 'info', 'status', 'random', 'ping',
        'sticker', 'contact', 'image', 'video', 'audio', 'document', 'file',
        'location', 'poll', 'download', 'gallery', 'media', 'welcome', 'demo',
        'youtube', 'yt', 'ytdl', 'music', 'songs', 'football',
        'spreadsheet', 'calc', 'sheet',
        // Calculator commands
        'calculator', 'graph', 'math', 'equation', 'triangle', 'vector',
        'formulas', 'calchelp', 'calcstatus', 'calchistory', 'calcclear', 'calcexit',
        // Statistical Analysis commands
        'distribution', 'distributions', 'statistics', 'stats', 'analysis', 'analyze',
        // Quadratic commands
        'quadratic', 'quad', 'quadratics', 'equation-solver', 'solver',
        // RPG commands
        'adventure', 'rpg', 'blacksmith', 'inventory', 'heal', 'shop', 'transfer', 
        'profile', 'leaderboard', 'reset',
        // RPG location commands
        'forest', 'desert', 'mountain', 'ocean', 'cave', 'city',
        // Chess commands
        'chess', 'chessgame', 'play', 'move', 'board', 'history', 'resign',
        // Multi-League Football commands
        'epl', 'premierleague', 'premier', 'english',
        'laliga', 'liga', 'spanish', 'spain',
        'seriea', 'seria', 'italian', 'italy',
        'bundesliga', 'bundes', 'german', 'germany',
        'ligue1', 'ligue', 'french', 'france',
        'eredivisie', 'erediv', 'dutch', 'netherlands',
        'primeiraliga', 'primeira', 'portuguese', 'portugal',
        'proleague', 'belgian', 'belgium',
        'spl', 'scottish', 'scotland',
        'superlig', 'super', 'turkish', 'turkey'
    ]
    
    const isValidCommand = validCommands.includes(command.replace('/', ''))
    
    if (!isValidCommand) {
        return false
    }

    // Update heartbeat on command activity
    if (isConnected) {
        lastHeartbeat = Date.now()
    }

    
    console.log(`🎯 Command received: ${command} from ${from.slice(-4)}`)
    
    const cleanCommand = command.replace('/', '')



    const sender = from.split('@')[0]
    const pushName = msg.pushName || 'User'
    
    
    switch (cleanCommand) {

        // RPG Commands
        case 'rpg':
        case 'adventure':
            if (args.length === 0) {
                const { rpg } = await findUserRpg(sender)
                let response = `🎮 **RPG Game System**\n\n`
                response += `Welcome to the Adventure RPG! Test your knowledge across different locations and difficulties.\n\n`
                response += `**Your Progress:**\n`
                response += `⮕ Current Location: ${(rpg.currentLocation || 'forest').charAt(0).toUpperCase() + (rpg.currentLocation || 'forest').slice(1)}\n`
                response += `⮕ Current Difficulty: ${(rpg.currentDifficulty || 'easy').charAt(0).toUpperCase() + (rpg.currentDifficulty || 'easy').slice(1)}\n`
                response += `⮕ Health: ${rpg.health || 100}/100\n`
                response += `⮕ Money: $${rpg.money || 0}\n`
                response += `⮕ Experience: ${rpg.exp || 0}\n\n`
                response += `**Available Commands:**\n`
                response += `• *adventure [location]* - Start adventure\n`
                response += `• *inventory* - View your items\n`
                response += `• *blacksmith* - Craft equipment\n`
                response += `• *heal* - Restore health ($300)\n`
                response += `• *shop* - Browse items\n`
                response += `• *profile* - View full profile\n`
                response += `• *transfer* - Transfer money/exp\n\n`
                response += `**Locations:** ${LOCATION_ORDER.join(', ')}\n\n`
                response += `Start with: *adventure ${rpg.currentLocation || 'forest'}*`
                await sendMessageWithTyping({ text: response }, from)
            } else {
                const location = args[0].toLowerCase()
                if (LOCATION_ORDER.includes(location)) {
                    const result = await handleRPGAdventure({ sender, location }, args, sock, sendMessageWithTyping, from)
                    if (result) {
                        await sendMessageWithTyping({ text: result }, from)
                    }
                } else {
                    await sendMessageWithTyping({ 
                        text: `Unknown location: ${location}. Available: ${LOCATION_ORDER.join(', ')}` 
                    }, from)
                }
            }
            break
            
        case 'blacksmith':
            const blacksmithResult = await rpgCommands.blacksmith({ sender }, args)
            await sendMessageWithTyping({ text: blacksmithResult }, from)
            break
            
        case 'inventory':
            const inventoryResult = await rpgCommands.inventory({ sender, pushName })
            await sendMessageWithTyping({ text: inventoryResult }, from)
            break
            
        case 'heal':
            const healResult = await rpgCommands.heal({ sender }, args)
            await sendMessageWithTyping({ text: healResult }, from)
            break
            
        case 'shop':
            const shopResult = await rpgCommands.shop({ sender }, args)
            await sendMessageWithTyping({ text: shopResult }, from)
            break
            
        case 'transfer':
            const transferResult = await rpgCommands.transfer({ sender, pushName }, args)
            await sendMessageWithTyping({ text: transferResult }, from)
            break
            
        case 'profile':
            const profileResult = await rpgCommands.profile({ sender, pushName })
            await sendMessageWithTyping({ text: profileResult }, from)
            break
            
        case 'leaderboard':
            const leaderboardResult = await rpgCommands.leaderboard({ sender })
            await sendMessageWithTyping({ text: leaderboardResult }, from)
            break
            
        case 'reset':
            const resetResult = await rpgCommands.reset({ sender })
            await sendMessageWithTyping({ text: resetResult }, from)
            break
            
        // RPG Location shortcuts
        case 'forest':
        case 'desert':
        case 'mountain':
        case 'ocean':
        case 'cave':
        case 'city':
            const locationResult = await handleSpecificAdventure(cleanCommand, { sender }, args, sock, sendMessageWithTyping, from)
            if (locationResult) {
                await sendMessageWithTyping({ text: locationResult }, from)
            }
            break
        case 'help':
        case 'menu':
            const pollMessage = {
                poll: {
                    name: '🤖 Bot Menu - Choose an option:',
                    values: [
                        '📝 Help & Commands',
                        '🕒 Current Time',
                        '📊 Bot Info & Status',
                        '🎲 Random Number',
                        '🏓 Ping Test',
                        '🖼️ Image Gallery',
                        '🎥 Video Library',
                        '🎵 Audio Collection',
                        '📄 Document Library',
                        '📞 Contact Directory',
                        '📍 Location Demo',
                        '🎁 Welcome Package',
                        '🎬 YouTube Downloader',
                        '⚽ Football Data Explorer',
                        '📊 Spreadsheet Calculator',
                        '🧮 Graphing Calculator',
                        '📈 Statistical Analysis',
                        '🧮 Quadratic Solver'
                    ],
                    selectableCount: 1
                }
            }
            await sendMessageWithTyping(pollMessage, from)
            
            const helpText = `🤖 *Bot Menu & Commands:*

*📝 Basic Commands:*
• *help/menu* - Show this menu
• *time* - Get current time
• *info* - Get chat information
• *status* - Check bot status
• *random* - Random number (1-100)
• *ping* - Test response time

*🧮 Quadratic Equation Solver:*
• *quadratic* - Start quadratic equation solver
• *quad* - Same as quadratic
• *quadratics* - Same as quadratic
• *equation-solver* - Same as quadratic
• *solver* - Same as quadratic
  - Supports 12+ solver types (Standard Form, Quadratic Formula, Completing Square, etc.)
  - Generates step-by-step solutions with visualizations
  - Creates comprehensive Excel workbooks
  - Handles projectile motion, area optimization, and inequality problems


*🎮 RPG Adventure Game:*
• *rpg/adventure* - Start RPG game
• *adventure [location]* - Adventure in specific location
• *inventory* - View your items
• *blacksmith* - Craft weapons and armor
• *heal* - Restore health ($300)
• *shop* - Browse and buy items
• *profile* - View detailed profile
• *transfer* - Transfer money/exp to others
• *leaderboard* - View top players
• *reset* - Reset RPG progress
- Available locations: forest, desert, mountain, ocean, cave, city
- Progress through difficulties: easy → medium → hard → nightmare
- Answer questions correctly to advance and earn rewards
- Craft equipment at blacksmith for second chances

*📈 Statistical Analysis:*
• *distribution* - Start statistical distribution analysis
• *distributions* - Same as distribution
• *statistics* - Same as distribution
• *stats* - Same as distribution
• *analysis* - Same as distribution
• *analyze* - Same as distribution
  - Supports 12+ distributions (Normal, T, Exponential, Gamma, Beta, etc.)
  - Generates comprehensive statistical reports
  - Creates visualizations and Excel workbooks
  - Provides probability calculations and confidence intervals

*🧮 Graphing Calculator:*
• *calculator* - Start advanced graphing calculator
• *graph* - Same as calculator
• *math* - Same as calculator
• *equation [function]* - Direct equation input
• *triangle [coordinates]* - Direct triangle analysis
• *vector [points]* - Direct vector analysis
• *formulas* - Show mathematical formulas reference
• *calchelp* - Calculator help menu
• *calcstatus* - Calculator statistics
• *calchistory* - Show calculation history
• *calcclear* - Clear calculator data
• *calcexit* - Exit calculator session

*🎬 YouTube Features:*
• *youtube* - Start YouTube search
• *yt [query]* - Direct YouTube search
• *ytdl [url]* - Download from YouTube URL
• *music [query]* - Search & download music
• *songs [query]* - Same as music command

**♟️ Chess Game:**
• **chess** - Start a new chess game
• **move** [from] [to] - Make a chess move (e.g., move e2 e4)
• **board** - Show current chess position
• **history** - Show game move history
• **status** - Check chess game status
• **resign** - End current game
  - Play as White against computer (Black)
  - Real-time board visualization
  - Move annotations and game analysis


*📊 Spreadsheet Calculator:*
• *spreadsheet* - Start spreadsheet calculation
• *calc* - Same as spreadsheet
• *sheet* - Same as spreadsheet
  - Options: bet_analysis, linearfunction, customlinear, quadraticformula, customquadratic, compoundinterest
  - Example: Enter "1" for Betting Analysis, then "betAmount:100, odds:2.5, oddsFormat:decimal, winProbability:0.45, bankroll:1000"

*⚽ Football Data Explorer:*
• *football* - Start Football Data Explorer
  - Analyze teams, compare leagues, view stats
  - Form tables, performance trends, predictions

*🎁 Pre-loaded Media:*
• *welcome* - Welcome package with media
• *gallery* - View image gallery
• *image* - Send random image from gallery
• *video* - Send demo video
• *audio* - Send notification sound
• *document* - Send sample document
• *demo* - Full media demonstration

*🏆 Football League Analysis (2018/19 Season):*
• *epl/premierleague* - English Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿
• *laliga/liga* - Spanish La Liga 🇪🇸
• *seriea/seria* - Italian Serie A 🇮🇹
• *bundesliga/bundes* - German Bundesliga 🇩🇪
• *ligue1/ligue* - French Ligue 1 🇫🇷
• *eredivisie/erediv* - Dutch Eredivisie 🇳🇱
• *primeiraliga/primeira* - Portuguese Primeira Liga 🇵🇹
• *proleague* - Belgian Pro League 🇧🇪
• *spl/scottish* - Scottish Premier League 🏴󠁧󠁢󠁳󠁣󠁴󠁿
• *superlig/turkish* - Turkish Süper Lig 🇹🇷


*📞 Contacts & Location:*
• *contact* - Browse contact directory
• *location* - Send demo location

*🎯 Interactive Features:*
• *poll* - Create a demo poll
• *sticker* - Convert image to sticker (reply to image)
• *download* - Download media (reply to media message)

✨ *All media is pre-configured by the bot owner!*
📱 *Tap poll options above for quick access!*
🎬 *YouTube downloads support MP3/MP4 formats!*
⚽ *Football Explorer provides detailed team/league analysis!*
🧮 *Calculator generates graphs with detailed mathematical analysis!*
📈 *Statistical Analysis supports 12+ probability distributions with comprehensive reporting!*
🧮 *Quadratic Solver handles 12+ equation types with step-by-step solutions and Excel reports!*`
            
            await sendMessageWithTyping({ text: helpText }, from)
            break
            
        // Quadratic Solver Commands
        // Quadratic Solver Commands
        case 'quadratic':
        case 'quad':
        case 'quadratics':
        case 'equation-solver':
        case 'solver':
            if (!session.awaitingQuadraticInput) {
                // Start new quadratic solver session
                console.log(`🧮 Starting new quadratic solver session for ${from.slice(-4)}`)
                const handled = await handleQuadraticCommand('quadratic', from, sendMessageWithTyping)
                return handled
            } else {
                // Already in session, inform user
                await sendMessageWithTyping(
                    { text: "🧮 Quadratic solver session already in progress. Please complete the current problem or type 'cancel' to start over." },
                    from
                )
                return true
            }
            break

        // Multi-League Football Commands
        case 'epl':
        case 'premierleague':
        case 'premier':
        case 'english':
            resetUserSession(from) // Clear any existing sessions
            session.awaitingEPLQuery = true
            session.currentLeague = 'epl'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'epl', sock)
            break

        case 'laliga':
        case 'liga':
        case 'spanish':
        case 'spain':
            resetUserSession(from)
            session.awaitingLaLigaQuery = true
            session.currentLeague = 'laliga'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'laliga', sock)
            break

        case 'seriea':
        case 'seria':
        case 'italian':
        case 'italy':
            resetUserSession(from)
            session.awaitingSerieAQuery = true
            session.currentLeague = 'seriea'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'seriea', sock)
            break

        case 'bundesliga':
        case 'bundes':
        case 'german':
        case 'germany':
            resetUserSession(from)
            session.awaitingBundesligaQuery = true
            session.currentLeague = 'bundesliga'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'bundesliga', sock)
            break

        case 'ligue1':
        case 'ligue':
        case 'french':
        case 'france':
            resetUserSession(from)
            session.awaitingLigue1Query = true
            session.currentLeague = 'ligue1'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'ligue1', sock)
            break

        case 'eredivisie':
        case 'erediv':
        case 'dutch':
        case 'netherlands':
            resetUserSession(from)
            session.awaitingEredivisieQuery = true
            session.currentLeague = 'eredivisie'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'eredivisie', sock)
            break

        case 'primeiraliga':
        case 'primeira':
        case 'portuguese':
        case 'portugal':
            resetUserSession(from)
            session.awaitingPrimeiraLigaQuery = true
            session.currentLeague = 'primeiraliga'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'primeiraliga', sock)
            break

        case 'proleague':
        case 'belgian':
        case 'belgium':
            resetUserSession(from)
            session.awaitingProLeagueQuery = true
            session.currentLeague = 'proleague'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'proleague', sock)
            break

        case 'spl':
        case 'scottish':
        case 'scotland':
            resetUserSession(from)
            session.awaitingSPLQuery = true
            session.currentLeague = 'spl'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'spl', sock)
            break

        case 'superlig':
        case 'super':
        case 'turkish':
        case 'turkey':
            resetUserSession(from)
            session.awaitingSuperLigQuery = true
            session.currentLeague = 'superlig'
            session.lastActivity = Date.now()
            await processLeagueMessage(from, 'hello', 'superlig', sock)
            break



            
        // Statistical Analysis Commands
        case 'distribution':
        case 'distributions':
        case 'statistics':
        case 'stats':
        case 'analysis':
        case 'analyze':
            if (!session.awaitingDistributionSelection && !session.awaitingDataInput) {
                // Start new statistical analysis session
                resetUserSession(from) // Clear any existing sessions
                session.awaitingDistributionSelection = true
                session.lastActivity = Date.now()
                
                const distributionList = getDistributionList()
                await sendMessageWithTyping({
                    text: `📈 *Statistical Distribution Analysis*\n\n` +
                          `Welcome to the Enhanced Statistical Workbook! This tool provides comprehensive analysis of your data using various probability distributions.\n\n` +
                          `✨ *Features:*\n` +
                          `• 12+ probability distributions\n` +
                          `• Parameter estimation from data\n` +
                          `• Probability calculations\n` +
                          `• Confidence intervals\n` +
                          `• Goodness-of-fit testing\n` +
                          `• Visual charts and graphs\n` +
                          `• Complete Excel workbook output\n\n` +
                          distributionList
                }, from)
            } else {
                await sendMessageWithTyping(
                    { text: "📈 Statistical analysis session already in progress. Please complete the current analysis or type 'cancel' to start over." },
                    from
                )
            }
            break

        // Calculator Commands
        case 'calculator':
        case 'graph':
        case 'math':
            await startCalculatorSession(sock, from, sendMessageWithTyping)
            break
            
        case 'equation':
            if (args.length > 0) {
                const equation = args.join(' ')
                // Start calculator session if not active
                if (!session.calculatorInstance) {
                    session.calculatorInstance = new GraphingCalculatorGame()
                    session.awaitingCalculatorInput = true
                    session.calculatorMode = 'equation'
                }
                await handleCalculatorInput(sock, from, equation, sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ Please provide an equation.\n\n*Usage:* equation y=x**2\n\n💡 *Examples:*\n• equation y=sin(x)\n• equation y=2x+3\n• equation y=x**2+2x+1'
                }, from)
            }
            break

        case 'triangle':
            if (args.length > 0) {
                const triangleInput = 'triangle ' + args.join(' ')
                // Start calculator session if not active
                if (!session.calculatorInstance) {
                    session.calculatorInstance = new GraphingCalculatorGame()
                    session.awaitingCalculatorInput = true
                    session.calculatorMode = 'triangle'
                }
                await handleCalculatorInput(sock, from, triangleInput, sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ Please provide triangle coordinates.\n\n*Usage:* triangle A(0,0) B(4,0) C(2,3)\n\n💡 *Examples:*\n• triangle A(0,0) B(3,0) C(1.5,2.6)\n• triangle (1,1) (5,1) (3,4)'
                }, from)
            }
            break
            
        case 'vector':
            if (args.length > 0) {
                const vectorInput = 'vector ' + args.join(' ')
                // Start calculator session if not active
                if (!session.calculatorInstance) {
                    session.calculatorInstance = new GraphingCalculatorGame()
                    session.awaitingCalculatorInput = true
                    session.calculatorMode = 'vector'
                }
                await handleCalculatorInput(sock, from, vectorInput, sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ Please provide vector information.\n\n*Usage:* vector A(1,2) B(5,4)\n\n💡 *Examples:*\n• vector A(2,1) B(5,4)\n• vector <3,4>\n• vectors A(1,1) B(4,3) C(6,5)'
                }, from)
            }
            break
            
        case 'formulas':
            if (session.calculatorInstance) {
                await handleCalculatorInput(sock, from, 'formulas', sendMessageWithTyping)
            } else {
                const formulasText = generateFormulasText()
                await sendMessageWithTyping({ text: formulasText }, from)
            }
            break
            
        case 'calchelp':
            if (session.calculatorInstance) {
                await handleCalculatorInput(sock, from, 'help', sendMessageWithTyping)
            } else {
                const helpText = generateCalculatorHelpText()
                await sendMessageWithTyping({ text: helpText }, from)
            }
            break
            
        case 'calcstatus':
            if (session.calculatorInstance) {
                await handleCalculatorInput(sock, from, 'status', sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ No active calculator session. Type *calculator* to start.'
                }, from)
            }
            break
            
        case 'calchistory':
            if (session.calculatorInstance) {
                await handleCalculatorInput(sock, from, 'history', sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ No active calculator session. Type *calculator* to start.'
                }, from)
            }
            break
            
        case 'calcclear':
            if (session.calculatorInstance) {
                await handleCalculatorInput(sock, from, 'clear', sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ No active calculator session. Type *calculator* to start.'
                }, from)
            }
            break
            
        case 'calcexit':
            if (session.calculatorInstance) {
                await handleCalculatorInput(sock, from, 'exit', sendMessageWithTyping)
            } else {
                await sendMessageWithTyping({
                    text: '❌ No active calculator session to exit.'
                }, from)
            }
            break

        case 'football':
            if (!session.footballExplorer) {
                session.footballExplorer = new FootballDataExplorer()
                session.footballExplorer.log = (...args) => session.outputLines.push(args.join(' '))
                session.footballExplorer.question = async (prompt) => {
                    if (session.outputLines.length > 0) {
                        await sendMessageWithTyping({ text: session.outputLines.join('\n') }, from)
                        session.outputLines = []
                    }
                    await sendMessageWithTyping({ text: prompt }, from)
                    return new Promise(resolve => {
                        session.pendingResolve = resolve
                    })
                }
                session.awaitingFootballInput = true
                await session.footballExplorer.loadDefaultLeagues()
                await sendMessageWithTyping({ text: '⚽ Football Data Explorer loaded!' }, from)
            }
            session.outputLines = []
            await session.footballExplorer.showMenu()
            await sendMessageWithTyping({ text: session.outputLines.join('\n') }, from)
            session.outputLines = []
            await sendMessageWithTyping({ text: 'Enter your choice:' }, from)
            break
            
        case 'youtube':
        case 'yt':
            if (args.length > 0) {
                const query = args.join(' ')
                await handleYouTubeSearch(sock, from, query)
            } else {
                session.awaitingYouTubeQuery = true
                session.lastActivity = Date.now()
                await sendMessageWithTyping({
                    text: `🎬 *YouTube Downloader*\n\n` +
                          `🔍 Please send me what you want to search for:\n` +
                          `• Song name and artist\n` +
                          `• Video title\n` +
                          `• Any search term\n\n` +
                          `💡 *Example:* "Imagine Dragons Believer"\n\n` +
                          `❌ Reply with "cancel" to exit`
                }, from)
            }
            break
            
        case 'ytdl':
            if (args.length > 0) {
                const url = args[0]
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
                    if (videoIdMatch) {
                        await handleYouTubeSearch(sock, from, videoIdMatch[1])
                    } else {
                        await sendMessageWithTyping({
                            text: '❌ Invalid YouTube URL format. Please provide a valid YouTube link.'
                        }, from)
                    }
                } else {
                    await sendMessageWithTyping({
                        text: '❌ Please provide a valid YouTube URL.\n\n*Example:* ytdl https://youtube.com/watch?v=...'
                    }, from)
                }
            } else {
                await sendMessageWithTyping({
                    text: '❌ Please provide a YouTube URL.\n\n*Usage:* ytdl [YouTube URL]'
                }, from)
            }
            break
            
        case 'music':
        case 'songs':
            if (args.length > 0) {
                const query = args.join(' ')
                await sendMessageWithTyping({
                    text: `🎵 Searching for music: "${query}"`
                }, from)
                await handleYouTubeSearch(sock, from, query)
            } else {
                session.awaitingYouTubeQuery = true
                session.lastActivity = Date.now()
                await sendMessageWithTyping({
                    text: `🎵 *Music Downloader*\n\n` +
                          `🔍 Please send me the song you want to download:\n` +
                          `• Song title and artist\n` +
                          `• Album name\n` +
                          `• Any music search term\n\n` +
                          `💡 *Example:* "The Weeknd Blinding Lights"\n\n` +
                          `❌ Reply with "cancel" to exit`
                }, from)
            }
            break
            
        // Spreadsheet Command
        case 'spreadsheet':
        case 'calc':
        case 'sheet':
            await handleSpreadsheetStart(sock, from);
            break;
            
        case 'time':
            const now = new Date()
            const timeText = `🕒 *Current Time:*

📅 Date: ${now.toDateString()}
⏰ Time: ${now.toLocaleTimeString()}
🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
📊 Unix: ${Math.floor(now.getTime() / 1000)}`
            
            await sendMessageWithTyping({ text: timeText }, from)
            break
            
        case 'echo':
            if (args.length > 0) {
                const echoMessage = `🔊 *Echo Response:*\n\n"${args.join(' ')}"`
                await sendMessageWithTyping({ text: echoMessage }, from)
            } else {
                await sendMessageWithTyping({ text: '❌ Please provide a message to echo!\n\n*Usage:* echo your message here' }, from)
            }
            break

        case 'info':
            const chatInfo = `📊 *Chat Information:*

👤 *Chat ID:* ${from}
📱 *Platform:* WhatsApp Web Bot
🕒 *Message Time:* ${new Date(msg.messageTimestamp * 1000).toLocaleString()}
🆔 *Message ID:* ${msg.key.id}
📨 *From Me:* ${msg.key.fromMe ? 'Yes' : 'No'}
🔢 *Message Type:* Text Message
🎬 *YouTube Session:* ${session.awaitingYouTubeQuery || session.awaitingYouTubeAction || session.awaitingRelatedSelection ? 'Active' : 'Inactive'}
⚽ *Football Session:* ${session.awaitingFootballInput ? 'Active' : 'Inactive'}
🧮 *Calculator Session:* ${session.awaitingCalculatorInput ? 'Active' : 'Inactive'}
📈 *Statistical Session:* ${session.awaitingDistributionSelection || session.awaitingDataInput ? 'Active' : 'Inactive'}
🧮 *Quadratic Session:* ${session.awaitingQuadraticInput ? 'Active' : 'Inactive'}`
            
            await sendMessageWithTyping({ text: chatInfo }, from)
            break
            
        case 'status':
            const uptime = process.uptime()
            const totalSessions = userSessions.size
            const activeYouTubeSessions = Array.from(userSessions.values()).filter(
                s => s.awaitingYouTubeQuery || s.awaitingYouTubeAction || s.awaitingRelatedSelection
            ).length
            const activeFootballSessions = Array.from(userSessions.values()).filter(
                s => s.awaitingFootballInput
            ).length
            const activeCalculatorSessions = Array.from(userSessions.values()).filter(
                s => s.awaitingCalculatorInput
            ).length
            const activeStatisticalSessions = Array.from(userSessions.values()).filter(
                s => s.awaitingDistributionSelection || s.awaitingDataInput
            ).length
            const activeQuadraticSessions = Array.from(userSessions.values()).filter(
                s => s.awaitingQuadraticInput
            ).length
            
            const statusText = `✅ *Bot Status: Online*

🚀 *Uptime:* ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s
💾 *Memory:* ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
🔗 *Connection:* Stable & Active
⚡ *Performance:* Optimal
📱 *Platform:* WhatsApp Web
🤖 *Version:* 2.0.0

👥 *Total Sessions:* ${totalSessions}
🎬 *Active YouTube Sessions:* ${activeYouTubeSessions}
⚽ *Active Football Sessions:* ${activeFootballSessions}
🧮 *Active Calculator Sessions:* ${activeCalculatorSessions}
📈 *Active Statistical Sessions:* ${activeStatisticalSessions}
🧮 *Active Quadratic Sessions:* ${activeQuadraticSessions}

All systems operational! 🎯`
            
            await sendMessageWithTyping({ text: statusText }, from)
            break

        case 'random':
            const randomNum = Math.floor(Math.random() * 100) + 1
            const randomText = `🎲 *Random Number Generator*

🔢 Your number: *${randomNum}*
📊 Range: 1-100
🎯 Generated at: ${new Date().toLocaleTimeString()}`
            
            await sendMessageWithTyping({ text: randomText }, from)
            break
            
        case 'ping':
            const startTime = Date.now()
            await sendMessageWithTyping({ text: '🏓 Calculating ping...' }, from)
            const endTime = Date.now()
            const pingTime = endTime - startTime

            await sendMessageWithTyping({
                text: `🏓 *Pong!*

⚡ *Response Time:* ${pingTime}ms
🔗 *Status:* ${pingTime < 1000 ? 'Excellent' : pingTime < 3000 ? 'Good' : 'Slow'}
📡 *Connection:* Active`
            }, from)
            break
            
        case 'welcome':
            await sendWelcomePackage(sock, from)
            break
            
        case 'gallery':
            await sendGalleryOptions(sock, from)
            break
            
        case 'image':
            if (args.length > 0 && args[0].startsWith('http')) {
                await sendImageFromUrl(sock, from, args[0])
            } else {
                await sendGalleryOptions(sock, from)
            }
            break
            
        case 'video':
            if (args.length > 0 && args[0].startsWith('http')) {
                await sendVideoFromUrl(sock, from, args[0])
            } else {
                await sendPreConfiguredVideo(sock, from)
            }
            break
            
        case 'audio':
            if (args.length > 0 && args[0].startsWith('http')) {
                await sendAudioFromUrl(sock, from, args[0])
            } else {
                await sendPreConfiguredAudio(sock, from)
            }
            break
            
        case 'document':
        case 'file':
            if (args.length > 0 && args[0].startsWith('http')) {
                await sendDocumentFromUrl(sock, from, args[0])
            } else {
                await sendPreConfiguredDocument(sock, from)
            }
            break

        case 'demo':
            await sendFullMediaDemo(sock, from)
            break

        case 'contact':
            await sendContactDirectory(sock, from)
            break

        case 'location':
            await sendLocationDemo(sock, from)
            break

        case 'poll':
            await createDemoPoll(sock, from)
            break

        case 'download':
            if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage) {
                await downloadMedia(sock, msg, from)
            } else {
                await sendMessageWithTyping({ text: '❌ Please reply to a media message (image/video/audio/document) with "download"!' }, from)
            }
            break

        case 'sticker':
            if (msg.message?.imageMessage) {
                await convertToSticker(sock, msg, from)
            } else {
                await sendMessageWithTyping({ text: '❌ Please reply to an image with "sticker" to convert it!' }, from)
            }
            break

        default:
            return false // Not a recognized command
    }

    return true // Command was handled
}


console.log('🚀 Starting WhatsApp Bot with Pairing Code...')
console.log('📋 Available commands:')
console.log('  --do-reply        : Enable auto-replies to messages')
console.log('📱 This bot will ONLY use pairing codes (no QR codes)')
console.log('')

startSock().catch(error => {
    console.error('❌ Failed to start bot:', error)
    process.exit(1)
})

app.listen(PORT, () => {
  console.log('App listened on port:', PORT)
})


