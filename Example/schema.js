import fs from 'fs/promises';
import path from 'path';

// WhatsApp RPG database - adapted for WhatsApp phone numbers
const DATA_DIR = './whatsapp_rpg_data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RPG_FILE = path.join(DATA_DIR, 'rpg.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Load data from file
async function loadData(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Save data to file
async function saveData(filename, data) {
    await ensureDataDir();
    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
}

// WhatsApp phone number sanitization
function sanitizePhoneNumber(phoneNumber) {
    // Remove any non-digits and normalize WhatsApp format
    return phoneNumber.replace(/\D/g, '').replace('@s.whatsapp.net', '');
}

// Initialize default user data (adapted for WhatsApp)
function createDefaultUser(phoneNumber) {
    const sanitized = sanitizePhoneNumber(phoneNumber);
    return {
        id: sanitized,
        phoneNumber: sanitized,
        displayName: `User_${sanitized.slice(-4)}`, // Last 4 digits as default name
        created: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        // WhatsApp specific fields
        whatsappId: phoneNumber,
        messageCount: 0,
        lastCommand: null
    };
}

// Initialize default RPG data (updated for WhatsApp progression system)
function createDefaultRpg(phoneNumber) {
    const sanitized = sanitizePhoneNumber(phoneNumber);
    return {
        userId: sanitized,
        phoneNumber: sanitized,
        
        // Basic stats
        level: 1,
        exp: 0,
        health: 100,
        money: 100,

        // WhatsApp RPG progression system
        currentDifficulty: 'easy',           // easy, medium, hard, nightmare
        currentLocation: 'forest',          // forest, dungeon, island, hauntedhouse, mountains
        correctAnswersInCurrentEvent: 0,    // Progress toward location completion (need 5)
        failedAttemptsInCurrentEvent: 0,    // Failure tracking (max 2 before reset/item use)

        // Resources (same as terminal)
        wood: 10,
        rock: 5,
        string: 8,
        iron: 0,
        gold: 0,
        diamond: 0,
        emerald: 0,
        trash: 0,
        potion: 3,

        // Equipment
        sword: 0,
        armor: 0,
        pickaxe: 0,
        fishingrod: false,

        // Equipment durability
        sworddurability: 0,
        armordurability: 0,
        pickaxedurability: 0,
        fishingroddurability: 0,

        // Crates
        common: 1,
        uncommon: 0,
        mythic: 0,
        legendary: 0,
        pet: 0,

        // Pets
        horse: 0,
        cat: 0,
        fox: 0,
        dog: 0,
        horseexp: 0,
        catexp: 0,
        foxexp: 0,
        dogexp: 0,

        // Timestamps
        lastadventure: 0,
        lastfishing: 0,

        // Knowledge systems for your actual gameData.js locations
        forestKnowledge: {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        },
        dungeonKnowledge: {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        },
        islandKnowledge: {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        },
        hauntedhouseKnowledge: {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        },
        mountainsKnowledge: {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        },

        // Current question tracking (WhatsApp session based)
        currentQuestion: null,
        awaitingAnswer: false,

        // WhatsApp specific progression tracking
        completedLocations: {
            forest: { easy: false, medium: false, hard: false, nightmare: false },
            dungeon: { easy: false, medium: false, hard: false, nightmare: false },
            island: { easy: false, medium: false, hard: false, nightmare: false },
            hauntedhouse: { easy: false, medium: false, hard: false, nightmare: false },
            mountains: { easy: false, medium: false, hard: false, nightmare: false }
        },

        // Session management
        lastSessionId: null,
        sessionStartTime: null,

        // Statistics
        totalAdventures: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        achievements: [],
        
        // WhatsApp engagement stats
        commandsUsed: 0,
        sessionsStarted: 0,
        itemsCrafted: 0,
        moneySpent: 0,
        
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
}

// Find or create user (WhatsApp adapted)
export async function findUser(phoneNumber) {
    const sanitized = sanitizePhoneNumber(phoneNumber);
    const users = await loadData(USERS_FILE);

    if (!users[sanitized]) {
        users[sanitized] = createDefaultUser(phoneNumber);
        await saveData(USERS_FILE, users);
    } else {
        // Update last seen
        users[sanitized].lastSeen = new Date().toISOString();
        users[sanitized].messageCount = (users[sanitized].messageCount || 0) + 1;
        await saveData(USERS_FILE, users);
    }

    return { user: users[sanitized] };
}

// Find or create user RPG data (WhatsApp adapted)
export async function findUserRpg(phoneNumber) {
    const sanitized = sanitizePhoneNumber(phoneNumber);
    const rpgData = await loadData(RPG_FILE);

    if (!rpgData[sanitized]) {
        rpgData[sanitized] = createDefaultRpg(phoneNumber);
        await saveData(RPG_FILE, rpgData);
    }

    return { rpg: rpgData[sanitized] };
}

// Edit/update user RPG data (WhatsApp adapted)
export async function editRpg(phoneNumber, updates) {
    const sanitized = sanitizePhoneNumber(phoneNumber);
    const rpgData = await loadData(RPG_FILE);

    if (!rpgData[sanitized]) {
        rpgData[sanitized] = createDefaultRpg(phoneNumber);
    }

    // Merge updates
    if (updates.rpg) {
        rpgData[sanitized] = { ...rpgData[sanitized], ...updates.rpg };
        rpgData[sanitized].updated = new Date().toISOString();
    }

    await saveData(RPG_FILE, rpgData);
    return { rpg: rpgData[sanitized] };
}

// Experience update with level calculation (enhanced for WhatsApp)
export async function expUpdate(phoneNumber, expGained = 0, context = '') {
    const { rpg } = await findUserRpg(phoneNumber);

    if (expGained <= 0) return '';

    const oldLevel = rpg.level;
    rpg.exp += expGained;
    rpg.totalQuestionsAnswered = (rpg.totalQuestionsAnswered || 0) + 1;

    // Enhanced level calculation for WhatsApp: every 500 exp = 1 level (faster progression)
    const newLevel = Math.floor(rpg.exp / 500) + 1;

    let levelUpMessage = '';
    if (newLevel > oldLevel) {
        rpg.level = newLevel;
        rpg.health = 100; // Full heal on level up
        const moneyReward = newLevel * 50; // Bonus money on level up
        rpg.money += moneyReward;
        
        await editRpg(phoneNumber, { rpg });

        levelUpMessage = `\n🎉 **LEVEL UP!** You are now level ${newLevel}!\n` +
                        `⮕ Health restored to 100\n` +
                        `⮕ Bonus money: +$${moneyReward}`;
    } else {
        await editRpg(phoneNumber, { rpg });
        levelUpMessage = `\n⭐ **EXP Gained:** +${expGained} (Total: ${rpg.exp})`;
    }

    return levelUpMessage;
}

// Get user stats (WhatsApp adapted with all locations)
export async function getUserStats(phoneNumber) {
    const { user } = await findUser(phoneNumber);
    const { rpg } = await findUserRpg(phoneNumber);

    const locations = ['forest', 'dungeon', 'island', 'hauntedhouse', 'mountains'];
    const knowledge = {};
    
    locations.forEach(location => {
        const knowledgeKey = `${location}Knowledge`;
        const locationData = rpg[knowledgeKey] || { questionsAnswered: 0, correctAnswers: 0 };
        
        knowledge[location] = {
            questionsAnswered: locationData.questionsAnswered,
            accuracy: locationData.questionsAnswered > 0
                ? ((locationData.correctAnswers / locationData.questionsAnswered) * 100).toFixed(1) + '%'
                : '0%'
        };
    });

    return {
        user,
        rpg,
        summary: {
            level: rpg.level,
            exp: rpg.exp,
            health: rpg.health,
            money: rpg.money,
            currentProgress: {
                location: rpg.currentLocation,
                difficulty: rpg.currentDifficulty,
                eventProgress: `${rpg.correctAnswersInCurrentEvent || 0}/5`,
                failures: `${rpg.failedAttemptsInCurrentEvent || 0}/2`
            },
            knowledge,
            engagement: {
                commandsUsed: rpg.commandsUsed || 0,
                sessionsStarted: rpg.sessionsStarted || 0,
                itemsCrafted: rpg.itemsCrafted || 0,
                totalAdventures: rpg.totalAdventures || 0
            }
        }
    };
}

// WhatsApp specific helper functions
export async function updateUserCommand(phoneNumber, command) {
    const { user } = await findUser(phoneNumber);
    const { rpg } = await findUserRpg(phoneNumber);
    
    user.lastCommand = command;
    rpg.commandsUsed = (rpg.commandsUsed || 0) + 1;
    
    const userData = await loadData(USERS_FILE);
    const rpgData = await loadData(RPG_FILE);
    
    const sanitized = sanitizePhoneNumber(phoneNumber);
    userData[sanitized] = user;
    rpgData[sanitized] = rpg;
    
    await saveData(USERS_FILE, userData);
    await saveData(RPG_FILE, rpgData);
}

// Progress tracking for WhatsApp RPG
export async function updateProgressionSystem(phoneNumber, location, difficulty, success) {
    const { rpg } = await findUserRpg(phoneNumber);
    
    if (success) {
        rpg.correctAnswersInCurrentEvent = (rpg.correctAnswersInCurrentEvent || 0) + 1;
        rpg.failedAttemptsInCurrentEvent = 0; // Reset failures on success
        
        // Mark location/difficulty as completed if 5 correct answers
        if (rpg.correctAnswersInCurrentEvent >= 5) {
            if (!rpg.completedLocations[location]) {
                rpg.completedLocations[location] = {};
            }
            rpg.completedLocations[location][difficulty] = true;
        }
    } else {
        rpg.failedAttemptsInCurrentEvent = (rpg.failedAttemptsInCurrentEvent || 0) + 1;
    }
    
    await editRpg(phoneNumber, { rpg });
    return rpg;
}

// Get leaderboard data (WhatsApp specific)
export async function getLeaderboardData(limit = 10) {
    const rpgData = await loadData(RPG_FILE);
    const userData = await loadData(USERS_FILE);
    
    const players = Object.values(rpgData)
        .map(rpg => ({
            phoneNumber: rpg.phoneNumber,
            displayName: userData[rpg.userId]?.displayName || `User_${rpg.phoneNumber.slice(-4)}`,
            level: rpg.level,
            exp: rpg.exp,
            totalCorrect: rpg.totalCorrectAnswers || 0,
            accuracy: rpg.totalQuestionsAnswered > 0 
                ? ((rpg.totalCorrectAnswers || 0) / rpg.totalQuestionsAnswered * 100).toFixed(1)
                : 0
        }))
        .sort((a, b) => {
            if (a.level !== b.level) return b.level - a.level;
            return b.exp - a.exp;
        })
        .slice(0, limit);
    
    return players;
}

// Data cleanup function for WhatsApp (remove inactive users after 30 days)
export async function cleanupInactiveUsers(daysThreshold = 30) {
    const userData = await loadData(USERS_FILE);
    const rpgData = await loadData(RPG_FILE);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    
    let removedCount = 0;
    
    for (const [userId, user] of Object.entries(userData)) {
        const lastSeen = new Date(user.lastSeen || user.created);
        
        if (lastSeen < cutoffDate) {
            delete userData[userId];
            delete rpgData[userId];
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        await saveData(USERS_FILE, userData);
        await saveData(RPG_FILE, rpgData);
        console.log(`Cleaned up ${removedCount} inactive users`);
    }
    
    return removedCount;
}
