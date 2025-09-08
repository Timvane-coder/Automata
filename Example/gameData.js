import chalk from 'chalk';
import moment from 'moment-timezone';
import readline from 'readline';
import google from 'googlethis';
import fs from 'fs';
import path from 'path';
import { findUserRpg, editRpg, findUser, expUpdate } from './schema.js';



// Utility Functions
export const isNumber = (number) => {
    if (!number) return false;
    number = parseInt(number);
    return typeof number === 'number' && !isNaN(number);
};



// Blacksmith Items
export const blacksmith = {
    createsword: {
        wooden: { id: 1, material: { wood: 10, string: 4 }, durability: 60 },
        stone: { id: 2, material: { wood: 5, rock: 7, string: 4 }, durability: 90 },
        iron: { id: 3, material: { wood: 5, iron: 7, string: 4 }, durability: 125 },
        gold: { id: 4, material: { wood: 5, string: 4, gold: 7 }, durability: 150 },
        diamond: { id: 6, material: { wood: 5, string: 4, diamond: 7 }, durability: 200 },
        emerald: { id: 7, material: { wood: 5, string: 4, emerald: 7 }, durability: 175 },
    },
    createarmor: {
        wooden: { id: 1, material: { wood: 10, string: 4 }, durability: 60 },
        stone: { id: 2, material: { wood: 5, rock: 7, string: 4 }, durability: 90 },
        iron: { id: 3, material: { wood: 5, iron: 7, string: 4 }, durability: 125 },
        gold: { id: 4, material: { wood: 5, string: 4, gold: 7 }, durability: 150 },
        diamond: { id: 6, material: { wood: 5, string: 4, diamond: 7 }, durability: 200 },
        emerald: { id: 7, material: { wood: 5, string: 4, emerald: 7 }, durability: 175 },
    },
    createpickaxe: {
        wooden: { id: 1, material: { wood: 10, string: 4 }, durability: 60 },
        stone: { id: 2, material: { wood: 5, rock: 7, string: 4 }, durability: 90 },
        iron: { id: 3, material: { wood: 5, iron: 7, string: 4 }, durability: 125 },
        gold: { id: 4, material: { wood: 5, string: 4, gold: 7 }, durability: 150 },
        diamond: { id: 6, material: { wood: 5, string: 4, diamond: 7 }, durability: 200 },
        emerald: { id: 7, material: { wood: 5, string: 4, emerald: 7 }, durability: 175 },
    },
    createfishingrod: {
        fishingrod: { id: true, material: { wood: 10, string: 15 }, durability: 150 },
    },
};

// Shop Items
export const shopItems = {
    buy: {
        limit: { exp: 999 },
        potion: { money: 1250 },
        trash: { money: 4 },
    },
    sell: {
        potion: { money: 1250 },
        trash: { money: 4 },
    },
};

// Create Rewards
export const createRewards = {
    common: {
        money: 101,
        exp: 201,
        trash: 11,
        potion: [0, 1, 0, 1, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    uncommon: {
        money: 201,
        exp: 401,
        trash: 31,
        potion: [0, 1, 0, 0, 0, 0, 0],
        diamond: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 0, 0, 0, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        mythic: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        wood: [0, 1, 0, 0, 0, 0],
        rock: [0, 1, 0, 0, 0, 0],
        string: [0, 1, 0, 0, 0, 0],
    },
    mythic: {
        money: 301,
        exp: 551,
        trash: 61,
        potion: [0, 1, 0, 0, 0, 0],
        emerald: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        diamond: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        gold: [0, 1, 0, 0, 0, 0, 0, 0, 0],
        iron: [0, 1, 0, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 0, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0, 0, 0],
        mythic: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        legendary: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        pet: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        wood: [0, 1, 0, 0, 0],
        rock: [0, 1, 0, 0, 0],
        string: [0, 1, 0, 0, 0],
    },
    legendary: {
        money: 401,
        exp: 601,
        trash: 101,
        potion: [0, 1, 0, 0, 0],
        emerald: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        diamond: [0, 1, 0, 0, 0, 0, 0, 0, 0],
        gold: [0, 1, 0, 0, 0, 0, 0, 0],
        iron: [0, 1, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0],
        mythic: [0, 1, 0, 0, 0, 0, 0, 0, 0],
        legendary: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        pet: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        wood: [0, 1, 0, 0],
        rock: [0, 1, 0, 0],
        string: [0, 1, 0, 0],
    },
    pet: {
        pet: 5,
    },
};

// Inventory Display Configuration
export const inventoryDisplay = {
    others: { health: true, money: true, exp: true },
    items: { potion: true, trash: true, wood: true, rock: true, string: true, emerald: true, diamond: true, gold: true, iron: true },
    tools: {
        armor: { '0': '❌', '1': 'Wooden Armor', '2': 'Stone Armor', '3': 'Iron Armor', '4': 'Gold Armor', '6': 'Diamond Armor', '7': 'Emerald Armor' },
        sword: { '0': '❌', '1': 'Wooden Sword', '2': 'Stone Sword', '3': 'Iron Sword', '4': 'Gold Sword', '6': 'Diamond Sword', '7': 'Emerald Sword' },
        pickaxe: { '0': '❌', '1': 'Wooden Pickaxe', '2': 'Stone Pickaxe', '3': 'Iron Pickaxe', '4': 'Gold Pickaxe', '6': 'Diamond Pickaxe', '7': 'Emerald Pickaxe' },
        fishingrod: true,
    },
    crates: { common: true, uncommon: true, mythic: true, legendary: true, pet: true },
    pets: { horse: 10, cat: 10, fox: 10, dog: 10 },
};

// ========== LOCATION DATABASES ==========
export const LOCATION_DATABASES = {
    forest: {
        glossary: [
            {
                id: 'lumina_tree',
                term: 'Lumina Tree 🌳',
                definition: 'A tree that glows at night and recharges nearby spells.',
                description: 'Adventurers camp near the Lumina Tree to recover spell energy before a battle.',
                difficulty: 'easy'
            },
            {
                id: 'shadow_moss',
                term: 'Shadow Moss 🌿',
                definition: 'A moss that grows only in the darkest parts of the forest and absorbs light.',
                description: 'Alchemists harvest Shadow Moss during new moon nights to create invisibility potions.',
                difficulty: 'medium'
            },
            {
                id: 'spirit_oak',
                term: 'Spirit Oak 🌰',
                definition: 'An ancient oak tree inhabited by forest spirits that offers wisdom.',
                description: 'The Spirit Oak has stood for over 1000 years, serving as a meeting place for forest guardians.',
                difficulty: 'hard'
            },
            {
                id: 'moonbell_flower',
                term: 'Moonbell Flower 🌸',
                definition: 'A rare flower that only blooms under moonlight and chimes softly in the wind.',
                description: 'The Moonbell\'s chimes can calm aggressive forest creatures and guide lost travelers.',
                difficulty: 'easy'
            }
        ],

        laws: [
            {
                id: 'law_of_balance',
                name: 'Law of Balance ⚖️',
                rule: 'Every spell cast must take equal energy from the caster and the forest.',
                description: 'Casting a healing spell drains the forest slightly; mages must replant herbs to restore balance.',
                difficulty: 'easy'
            },
            {
                id: 'conservation_of_magic',
                name: 'Conservation of Magic 🔄',
                rule: 'Magic energy cannot be created or destroyed, only transformed from one form to another.',
                description: 'When a mage transforms fire magic into healing energy, the total magical force remains constant.',
                difficulty: 'medium'
            },
            {
                id: 'spirit_binding_law',
                name: 'Spirit Binding Law 👻',
                rule: 'Forest spirits can only be bound with their consent and must be released at sunrise.',
                description: 'Ancient contracts show that forced spirit binding leads to forest corruption and magical disasters.',
                difficulty: 'hard'
            }
        ],

        theorems: [
            {
                id: 'magical_resonance',
                name: 'Magical Resonance Theorem 🎵',
                principle: 'Similar magical frequencies amplify each other when in proximity.',
                description: 'Two healing crystals placed together produce stronger healing effects than when used separately.',
                difficulty: 'medium'
            },
            {
                id: 'elemental_interference',
                name: 'Elemental Interference Principle ⚡',
                principle: 'Opposing elements cancel each other\'s magical properties.',
                description: 'Fire spells become weaker near water sources, while ice magic fails in volcanic regions.',
                difficulty: 'easy'
            },
            {
                id: 'temporal_magic_decay',
                name: 'Temporal Magic Decay Theory ⏰',
                principle: 'All magical effects naturally decay over time unless continuously renewed.',
                description: 'Enchanted weapons lose their power after decades, requiring re-enchantment by skilled mages.',
                difficulty: 'hard'
            }
        ],

        conversions: [
            {
                id: 'mana_to_health',
                name: 'Mana-Health Conversion 💙❤️',
                formula: '1 Mana Point = 2 Health Points',
                description: 'Healing spells convert magical energy directly into life force at a 1:2 ratio.',
                difficulty: 'easy'
            },
            {
                id: 'spell_duration',
                name: 'Spell Duration Formula ⌛',
                formula: 'Duration (minutes) = Mana Used × Caster Level ÷ 10',
                description: 'A level 20 mage using 50 mana creates a spell lasting 100 minutes.',
                difficulty: 'medium'
            }
        ],

        examples: [
            {
                id: 'potion_brewing',
                name: 'Potion of Night Vision 👁️',
                application: 'Combine Shadow Moss + Lumina Tree sap + Moonwater',
                description: 'This potion allows adventurers to see clearly in complete darkness for 3 hours.',
                difficulty: 'easy'
            },
            {
                id: 'barrier_spell',
                name: 'Forest Protection Barrier 🛡️',
                application: 'Channel 100 mana through Spirit Oak to create area protection',
                description: 'Creates a magical dome protecting a 50-meter radius from hostile creatures.',
                difficulty: 'hard'
            }
        ],

        history: [
            {
                id: 'great_awakening',
                name: 'The Great Awakening 🌟',
                event: 'When the first Lumina Tree gained consciousness 500 years ago',
                description: 'This event marked the beginning of tree-human communication and forest magic.',
                difficulty: 'medium'
            },
            {
                id: 'shadow_war',
                name: 'The Shadow War ⚔️',
                event: 'A century-long conflict between light and shadow magic users',
                description: 'The war ended when both sides realized they needed balance, leading to the Law of Balance.',
                difficulty: 'hard'
            }
        ],

        exceptions: [
            {
                id: 'null_magic_zones',
                name: 'Null Magic Zones 🚫',
                limitation: 'Areas where no magic can function due to ancient curses',
                description: 'These rare zones require adventurers to rely purely on physical skills and mundane tools.',
                difficulty: 'medium'
            }
        ],

        references: [
            {
                id: 'ancient_codex',
                name: 'Ancient Codex of Forest Lore 📚',
                source: 'Written by Archmage Silvanus in the year 1247',
                description: 'The definitive guide to forest magic, containing over 1000 spells and rituals.',
                difficulty: 'hard'
            }
        ],

        proofs: [
            {
                id: 'balance_proof',
                name: 'Mathematical Proof of Magical Balance 📐',
                derivation: 'Energy In = Energy Out + Energy Stored',
                description: 'This equation proves why magical balance is necessary to prevent forest degradation.',
                difficulty: 'hard'
            }
        ],

        relationships: [
            {
                id: 'symbiotic_connection',
                name: 'Tree-Spirit Symbiosis 🤝',
                connection: 'Forest spirits provide consciousness to trees in exchange for magical energy',
                description: 'This relationship explains why ancient trees can communicate and make decisions.',
                difficulty: 'medium'
            }
        ]
    },
    dungeon: {
        glossary: [
            {
                id: 'trap_mechanism',
                term: 'Trap Mechanism 🪤',
                definition: 'Hidden devices designed to protect ancient treasures from intruders.',
                description: 'Common in dungeons, these include pressure plates and dart shooters.',
                difficulty: 'easy'
            },
            {
                id: 'ancient_rune',
                term: 'Ancient Rune 🔮',
                definition: 'Magical symbols etched in stone that activate spells or traps.',
                description: 'Scholars study runes to unlock forgotten knowledge of past civilizations.',
                difficulty: 'medium'
            },
            {
                id: 'golem_guardian',
                term: 'Golem Guardian 🤖',
                definition: 'Animated stone statues that defend dungeon chambers.',
                description: 'Created by ancient mages, golems activate when intruders approach.',
                difficulty: 'hard'
            },
            {
                id: 'treasure_vault',
                term: 'Treasure Vault 💰',
                definition: 'Secure rooms containing valuable artifacts and gold.',
                description: 'Often protected by multiple layers of traps and puzzles.',
                difficulty: 'easy'
            }
        ],
        laws: [
            {
                id: 'law_of_traps',
                name: 'Law of Traps ⚠️',
                rule: 'Every trap must have a detectable trigger and a possible disarm method.',
                description: 'Ancient builders followed this to allow worthy adventurers passage.',
                difficulty: 'easy'
            },
            {
                id: 'conservation_of_energy',
                name: 'Conservation of Dungeon Energy 🔋',
                rule: 'Magical energy in dungeons recycles through runes and artifacts.',
                description: 'Destroying a rune may disable traps but release unbound energy.',
                difficulty: 'medium'
            },
            {
                id: 'guardian_binding',
                name: 'Guardian Binding Law ⛓️',
                rule: 'Guardians can only be summoned with proper rituals and dismissed after service.',
                description: 'Improper binding leads to rampant guardians terrorizing explorers.',
                difficulty: 'hard'
            }
        ],
        theorems: [
            {
                id: 'puzzle_resonance',
                name: 'Puzzle Resonance Theorem 🧩',
                principle: 'Matching puzzle elements create harmonic solutions.',
                description: 'Aligning similar runes amplifies their effects in dungeon mechanisms.',
                difficulty: 'medium'
            },
            {
                id: 'trap_interference',
                name: 'Trap Interference Principle 🛑',
                principle: 'Overlapping trap fields can cancel or enhance effects.',
                description: 'Two pressure plates near each other may create safe zones.',
                difficulty: 'easy'
            },
            {
                id: 'artifact_decay',
                name: 'Artifact Decay Theory 🕰️',
                principle: 'Artifacts lose power over centuries unless recharged.',
                description: 'Ancient treasures require periodic magical infusions to maintain potency.',
                difficulty: 'hard'
            }
        ],
        conversions: [
            {
                id: 'rune_to_power',
                name: 'Rune-Power Conversion ⚡',
                formula: '1 Rune Charge = 3 Power Units',
                description: 'Runes convert ambient magic into usable power for traps.',
                difficulty: 'easy'
            },
            {
                id: 'puzzle_time',
                name: 'Puzzle Solution Time Formula ⏱️',
                formula: 'Time (seconds) = Complexity Level × Adventurer Skill ÷ 5',
                description: 'A level 10 puzzle solved by a skill 20 adventurer takes 10 seconds.',
                difficulty: 'medium'
            }
        ],
        examples: [
            {
                id: 'disarm_trap',
                name: 'Disarming Dart Trap 🎯',
                application: 'Locate pressure plate + Use tool to jam mechanism',
                description: 'Prevents darts from firing, allowing safe passage.',
                difficulty: 'easy'
            },
            {
                id: 'activate_portal',
                name: 'Portal Activation 🚪',
                application: 'Align three runes in sequence',
                description: 'Opens a gateway to hidden chambers.',
                difficulty: 'hard'
            }
        ],
        history: [
            {
                id: 'dungeon_fall',
                name: 'Fall of the Empire 🏛️',
                event: 'Collapse of ancient civilization 800 years ago',
                description: 'Led to the creation of protected dungeons for knowledge preservation.',
                difficulty: 'medium'
            },
            {
                id: 'guardian_war',
                name: 'Guardian War 🛡️',
                event: 'Conflict between summoned guardians and invaders',
                description: 'Ended with new binding laws to control guardians.',
                difficulty: 'hard'
            }
        ],
        exceptions: [
            {
                id: 'magic_null_rooms',
                name: 'Magic Null Rooms ❌',
                limitation: 'Chambers where magic fails due to anti-magic fields',
                description: 'Requires pure mechanical solutions to puzzles.',
                difficulty: 'medium'
            }
        ],
        references: [
            {
                id: 'dungeon_tome',
                name: 'Tome of Dungeon Lore 📖',
                source: 'Authored by Explorer Thorne in 1350',
                description: 'Comprehensive guide to dungeon architecture and traps.',
                difficulty: 'hard'
            }
        ],
        proofs: [
            {
                id: 'energy_proof',
                name: 'Proof of Energy Conservation 📏',
                derivation: 'Input Energy = Output Energy + Stored Energy',
                description: 'Demonstrates why dungeon magic remains stable over time.',
                difficulty: 'hard'
            }
        ],
        relationships: [
            {
                id: 'rune_guardian_link',
                name: 'Rune-Guardian Link 🔗',
                connection: 'Runes power guardians in exchange for protection',
                description: 'Explains the symbiotic defense systems in dungeons.',
                difficulty: 'medium'
            }
        ]
    },
    mountains: {
        glossary: [
            {
                id: 'crystal峭',
                term: 'Crystal Vein 💎',
                definition: 'Natural deposits of magical crystals in mountain rock.',
                description: 'Miners seek these for their energy-storing properties.',
                difficulty: 'easy'
            },
            {
                id: 'dragon_scale',
                term: 'Dragon Scale 🐉',
                definition: 'Shed scales from mountain dragons with protective qualities.',
                description: 'Used in armor crafting for superior defense.',
                difficulty: 'medium'
            },
            {
                id: 'peak_spirit',
                term: 'Peak Spirit 🏔️',
                definition: 'Ethereal beings that inhabit mountain summits.',
                description: 'They control weather and offer guidance to climbers.',
                difficulty: 'hard'
            },
            {
                id: 'avalanche_path',
                term: 'Avalanche Path ❄️',
                definition: 'Natural routes where snow and rock slides occur.',
                description: 'Adventurers must navigate carefully to avoid triggers.',
                difficulty: 'easy'
            }
        ],
        laws: [
            {
                id: 'law_of_ascent',
                name: 'Law of Ascent ⬆️',
                rule: 'Higher altitudes require proportional energy expenditure.',
                description: 'Climbers must pace themselves to avoid exhaustion.',
                difficulty: 'easy'
            },
            {
                id: 'conservation_of_altitude',
                name: 'Conservation of Altitude 🏞️',
                rule: 'Gained height must be balanced with safe descent paths.',
                description: 'Ignoring this leads to dangerous falls.',
                difficulty: 'medium'
            },
            {
                id: 'dragon_pact',
                name: 'Dragon Pact Law 🤝',
                rule: 'Dragons can only be approached with offerings and released unharmed.',
                description: 'Breaking pacts causes mountain-wide catastrophes.',
                difficulty: 'hard'
            }
        ],
        theorems: [
            {
                id: 'crystal_resonance',
                name: 'Crystal Resonance Theorem 📡',
                principle: 'Similar crystals vibrate in harmony when near.',
                description: 'Used to detect hidden veins in mountains.',
                difficulty: 'medium'
            },
            {
                id: 'weather_interference',
                name: 'Weather Interference Principle 🌩️',
                principle: 'Opposing weather forces create storms.',
                description: 'Wind and snow combine to form blizzards.',
                difficulty: 'easy'
            },
            {
                id: 'summit_decay',
                name: 'Summit Decay Theory 🌋',
                principle: 'Mountain magic erodes over time without renewal.',
                description: 'Requires rituals to maintain peak stability.',
                difficulty: 'hard'
            }
        ],
        conversions: [
            {
                id: 'altitude_to_energy',
                name: 'Altitude-Energy Conversion 🏔️⚡',
                formula: '1 Meter Altitude = 0.5 Energy Units',
                description: 'Higher climbs drain more stamina.',
                difficulty: 'easy'
            },
            {
                id: 'climb_time',
                name: 'Climb Duration Formula 🕒',
                formula: 'Time (hours) = Height × Difficulty ÷ Climber Strength',
                description: 'A 100m climb at difficulty 5 by strength 10 takes 5 hours.',
                difficulty: 'medium'
            }
        ],
        examples: [
            {
                id: 'mine_crystal',
                name: 'Mining Crystal Vein ⛏️',
                application: 'Use pickaxe on resonant spots',
                description: 'Yields high-quality crystals for crafting.',
                difficulty: 'easy'
            },
            {
                id: 'summon_spirit',
                name: 'Summon Peak Spirit 📯',
                application: 'Offer gem at summit altar',
                description: 'Grants weather control for safe descent.',
                difficulty: 'hard'
            }
        ],
        history: [
            {
                id: 'dragon_awakening',
                name: 'Dragon Awakening 🔥',
                event: 'First dragon emergence 600 years ago',
                description: 'Marked the beginning of mountain pacts.',
                difficulty: 'medium'
            },
            {
                id: 'peak_war',
                name: 'Peak War ⚔️',
                event: 'Conflict between climbers and spirits',
                description: 'Led to laws governing mountain interactions.',
                difficulty: 'hard'
            }
        ],
        exceptions: [
            {
                id: 'storm_null_zones',
                name: 'Storm Null Zones 🌤️',
                limitation: 'Areas unaffected by mountain weather magic',
                description: 'Safe havens during blizzards.',
                difficulty: 'medium'
            }
        ],
        references: [
            {
                id: 'mountain_chronicle',
                name: 'Chronicle of Peaks 📜',
                source: 'Penned by Mountaineer Elara in 1400',
                description: 'Detailed accounts of mountain lore and climbs.',
                difficulty: 'hard'
            }
        ],
        proofs: [
            {
                id: 'altitude_proof',
                name: 'Proof of Altitude Conservation 📐',
                derivation: 'Upward Force = Downward Force + Potential Stored',
                description: 'Explains mountain climbing physics.',
                difficulty: 'hard'
            }
        ],
        relationships: [
            {
                id: 'crystal_spirit_bond',
                name: 'Crystal-Spirit Bond 💎👻',
                connection: 'Spirits charge crystals in exchange for protection',
                description: 'This relationship maintains the mountain magical ecosystem.',
                difficulty: 'medium'
            }
        ]
    },
    island: {
        glossary: [
            {
                id: 'coral_reef',
                term: 'Coral Reef 🪸',
                definition: 'Underwater structures built by marine organisms.',
                description: 'Homes to diverse sea life and hidden treasures.',
                difficulty: 'easy'
            },
            {
                id: 'pirate_map',
                term: 'Pirate Map 🗺️',
                definition: 'Charts leading to buried treasures on islands.',
                description: 'Often encrypted with riddles and symbols.',
                difficulty: 'medium'
            },
            {
                id: 'sea_serpent',
                term: 'Sea Serpent 🌊',
                definition: 'Mythical water creatures guarding island shores.',
                description: 'Known for their immense size and protective nature.',
                difficulty: 'hard'
            },
            {
                id: 'tropical_storm',
                term: 'Tropical Storm ⛈️',
                definition: 'Intense weather systems common in island regions.',
                description: 'Bring heavy rain and winds, affecting navigation.',
                difficulty: 'easy'
            }
        ],
        laws: [
            {
                id: 'law_of_tides',
                name: 'Law of Tides 🌙',
                rule: 'Tides rise and fall in cycles influenced by the moon.',
                description: 'Adventurers time beach explorations accordingly.',
                difficulty: 'easy'
            },
            {
                id: 'conservation_of_waves',
                name: 'Conservation of Waves 🌊',
                rule: 'Wave energy transfers but dont  disappear.',
                description: 'Used in understanding coastal erosion.',
                difficulty: 'medium'
            },
            {
                id: 'serpent_binding',
                name: 'Serpent Binding Law 🐍',
                rule: 'Sea serpents can only be summoned with sea offerings.',
                description: 'Forced summons lead to tsunamis.',
                difficulty: 'hard'
            }
        ],
        theorems: [
            {
                id: 'reef_resonance',
                name: 'Reef Resonance Theorem 🐠',
                principle: 'Similar marine frequencies attract sea life.',
                description: 'Used to locate hidden underwater caves.',
                difficulty: 'medium'
            },
            {
                id: 'storm_interference',
                name: 'Storm Interference Principle 🌪️',
                principle: 'Opposing winds create calm eyes in storms.',
                description: 'Safe spots during hurricanes.',
                difficulty: 'easy'
            },
            {
                id: 'treasure_decay',
                name: 'Treasure Decay Theory 🏴‍☠️',
                principle: 'Buried items degrade unless preserved.',
                description: 'Requires magical seals for long-term storage.',
                difficulty: 'hard'
            }
        ],
        conversions: [
            {
                id: 'tide_to_depth',
                name: 'Tide-Depth Conversion 📏',
                formula: '1 Tide Cycle = 2 Meter Depth Change',
                description: 'Affects accessible areas on shores.',
                difficulty: 'easy'
            },
            {
                id: 'navigation_time',
                name: 'Navigation Time Formula 🧭',
                formula: 'Time (hours) = Distance × Wind Factor ÷ Ship Speed',
                description: 'A 50km trip with wind 2 and speed 10 takes 10 hours.',
                difficulty: 'medium'
            }
        ],
        examples: [
            {
                id: 'decode_map',
                name: 'Decoding Pirate Map 🔍',
                application: 'Solve riddles + Follow coordinates',
                description: 'Leads to buried chests.',
                difficulty: 'easy'
            },
            {
                id: 'calm_serpent',
                name: 'Calming Sea Serpent 🎶',
                application: 'Play ancient sea melody',
                description: 'Allows safe passage through waters.',
                difficulty: 'hard'
            }
        ],
        history: [
            {
                id: 'pirate_golden_age',
                name: 'Golden Age of Pirates 🏴‍☠️',
                event: 'Peak piracy 400 years ago',
                description: 'Led to numerous hidden treasures.',
                difficulty: 'medium'
            },
            {
                id: 'serpent_war',
                name: 'Serpent War ⚓',
                event: 'Battles between sailors and serpents',
                description: 'Resulted in binding laws.',
                difficulty: 'hard'
            }
        ],
        exceptions: [
            {
                id: 'calm_water_zones',
                name: 'Calm Water Zones 🏝️',
                limitation: 'Areas unaffected by tides or storms',
                description: 'Perfect for safe anchoring.',
                difficulty: 'medium'
            }
        ],
        references: [
            {
                id: 'island_log',
                name: 'Log of Island Voyages ⚓',
                source: 'Captained by Voyager Mira in 1500',
                description: 'Maps and tales of island explorations.',
                difficulty: 'hard'
            }
        ],
        proofs: [
            {
                id: 'wave_proof',
                name: 'Proof of Wave Conservation 📊',
                derivation: 'Incoming Waves = Reflected + Absorbed',
                description: 'Explains coastal dynamics.',
                difficulty: 'hard'
            }
        ],
        relationships: [
            {
                id: 'reef_serpent_symbiosis',
                name: 'Reef-Serpent Symbiosis 🪸🐉',
                connection: 'Serpents protect reefs for breeding grounds',
                description: 'Maintains marine balance.',
                difficulty: 'medium'
            }
        ]
    },
    hauntedhouse: {
        glossary: [
            {
                id: 'ghost_apparition',
                term: 'Ghost Apparition 👻',
                definition: 'Visible manifestations of spirits in haunted places.',
                description: 'Often tied to unresolved past events.',
                difficulty: 'easy'
            },
            {
                id: 'cursed_artifact',
                term: 'Cursed Artifact 🏺',
                definition: 'Objects imbued with negative energy causing misfortune.',
                description: 'Handled carefully to avoid spreading curses.',
                difficulty: 'medium'
            },
            {
                id: 'poltergeist',
                term: 'Poltergeist Activity 📦',
                definition: 'Spirits that move objects and create disturbances.',
                description: 'Known for chaotic energy in haunted houses.',
                difficulty: 'hard'
            },
            {
                id: 'ectoplasm',
                term: 'Ectoplasm Residue 💦',
                definition: 'Spectral substance left by ghostly presences.',
                description: 'Used in rituals to communicate with spirits.',
                difficulty: 'easy'
            }
        ],
        laws: [
            {
                id: 'law_of_haunting',
                name: 'Law of Haunting 🕯️',
                rule: 'Spirits are bound to locations of emotional significance.',
                description: 'They manifest stronger at night.',
                difficulty: 'easy'
            },
            {
                id: 'conservation_of_spirits',
                name: 'Conservation of Spectral Energy 👻',
                rule: 'Ghostly energy transforms but persists.',
                description: 'Banishing a spirit relocates its energy.',
                difficulty: 'medium'
            },
            {
                id: 'curse_binding',
                name: 'Curse Binding Law 🔒',
                rule: 'Curses require anchors and can only be lifted with counter-rituals.',
                description: 'Ignoring anchors perpetuates the curse.',
                difficulty: 'hard'
            }
        ],
        theorems: [
            {
                id: 'spectral_resonance',
                name: 'Spectral Resonance Theorem 🔊',
                principle: 'Similar emotional energies attract ghosts.',
                description: 'Fear amplifies apparitions.',
                difficulty: 'medium'
            },
            {
                id: 'energy_interference',
                name: 'Energy Interference Principle ⚡',
                principle: 'Positive energy disrupts ghostly manifestations.',
                description: 'Light sources weaken apparitions.',
                difficulty: 'easy'
            },
            {
                id: 'haunt_decay',
                name: 'Haunt Decay Theory ⏳',
                principle: 'Hauntings fade without emotional fuel.',
                description: 'Resolving past traumas weakens spirits.',
                difficulty: 'hard'
            }
        ],
        conversions: [
            {
                id: 'fear_to_energy',
                name: 'Fear-Energy Conversion 😱⚡',
                formula: '1 Fear Unit = 2 Spectral Power',
                description: 'Adventurer fear strengthens ghosts.',
                difficulty: 'easy'
            },
            {
                id: 'ritual_time',
                name: 'Ritual Duration Formula 🕰️',
                formula: 'Time (minutes) = Curse Strength × Participant Will ÷ 8',
                description: 'A strength 40 curse with will 10 takes 50 minutes.',
                difficulty: 'medium'
            }
        ],
        examples: [
            {
                id: 'banish_ghost',
                name: 'Banishing Minor Ghost 🧂',
                application: 'Use salt circle + Chant incantation',
                description: 'Sends the spirit to rest.',
                difficulty: 'easy'
            },
            {
                id: 'lift_curse',
                name: 'Lifting House Curse 📜',
                application: 'Destroy anchor + Perform exorcism',
                description: 'Frees the house from haunting.',
                difficulty: 'hard'
            }
        ],
        history: [
            {
                id: 'great_haunting',
                name: 'The Great Haunting 🌑',
                event: 'Mass spirit awakening 300 years ago',
                description: 'Caused by a catastrophic event.',
                difficulty: 'medium'
            },
            {
                id: 'curse_war',
                name: 'Curse War 🧙',
                event: 'Conflicts involving dark magic',
                description: 'Led to binding laws for curses.',
                difficulty: 'hard'
            }
        ],
        exceptions: [
            {
                id: 'neutral_zones',
                name: 'Neutral Spirit Zones 🛡️',
                limitation: 'Areas where hauntings cannot occur',
                description: 'Protected by ancient wards.',
                difficulty: 'medium'
            }
        ],
        references: [
            {
                id: 'haunt_grimoire',
                name: 'Grimoire of Haunts 📕',
                source: 'Written by Occultist Vesper in 1600',
                description: 'Guide to spectral phenomena.',
                difficulty: 'hard'
            }
        ],
        proofs: [
            {
                id: 'spectral_proof',
                name: 'Proof of Spectral Conservation 📊',
                derivation: 'Manifest Energy = Latent + Released',
                description: 'Shows why hauntings persist.',
                difficulty: 'hard'
            }
        ],
        relationships: [
            {
                id: 'ghost_artifact_tie',
                name: 'Ghost-Artifact Tie 👻🏺',
                connection: 'Artifacts anchor ghosts for mutual power',
                description: 'Explains persistent hauntings.',
                difficulty: 'medium'
            }
        ]
    }
};

// ========== QUESTION DATABASES ==========
export const LOCATION_QUESTIONS = {
    forest: {
        easy: [
            {
                id: 'q1',
                question: 'Which of the following is described as a glowing tree that restores spell energy?',
                choices: [
                    'a) Potion of Night Vision',
                    'b) Lumina Tree',
                    'c) Law of Balance',
                    'd) Shadow Moss'
                ],
                correct: 'b',
                explanation: 'The Lumina Tree glows at night and recharges nearby spells.',
                diagram: 'A glowing tree',
                difficulty: 'easy',
                category: 'glossary'
            },
            {
                id: 'q2',
                question: 'What is the mana-to-health conversion ratio in forest magic?',
                choices: [
                    'a) 1 Mana = 1 Health',
                    'b) 1 Mana = 2 Health',
                    'c) 2 Mana = 1 Health',
                    'd) 1 Mana = 3 Health'
                ],
                correct: 'b',
                explanation: 'Healing spells convert magical energy to life force at a 1:2 ratio.',
                diagram: 'hearts',
                difficulty: 'easy',
                category: 'conversions'
            },
            {
                id: 'q3',
                question: 'Which flower chimes softly and can calm aggressive creatures?',
                choices: [
                    'a) Shadow Moss',
                    'b) Spirit Oak',
                    'c) Moonbell Flower',
                    'd) Lumina Tree'
                ],
                correct: 'c',
                explanation: 'The Moonbell Flower chimes in the wind and has calming effects.',
                diagram: ' A flower',
                difficulty: 'easy',
                category: 'glossary'
            }
        ],
        fundamental: [
            {
                id: 'q_fund1',
                question: 'What is the primary function of Shadow Moss in alchemy?',
                choices: [
                    'a) To create light',
                    'b) To absorb light for potions',
                    'c) To heal wounds',
                    'd) To summon spirits'
                ],
                correct: 'b',
                explanation: 'Shadow Moss absorbs light and is used in invisibility potions.',
                diagram: '🌿🌑 Moss absorbing moonlight in a dark forest',
                difficulty: 'fundamental',
                category: 'glossary'
            },
            {
                id: 'q_fund2',
                question: 'How does the Conservation of Magic affect spell casting?',
                choices: [
                    'a) Magic can be created from nothing',
                    'b) Magic is transformed, not created or destroyed',
                    'c) Magic decreases over time',
                    'd) Magic is unlimited'
                ],
                correct: 'b',
                explanation: 'Magic energy is transformed from one form to another.',
                diagram: '🔄⚡ Magic cycle in a loop',
                difficulty: 'fundamental',
                category: 'laws'
            }
        ],
        medium: [
            {
                id: 'q4',
                question: 'According to the Magical Resonance Theorem, what happens when similar magical frequencies meet?',
                choices: [
                    'a) They cancel each other out',
                    'b) They amplify each other',
                    'c) They create explosions',
                    'd) Nothing happens'
                ],
                correct: 'b',
                explanation: 'Similar magical frequencies amplify each other when in proximity.',
                diagram: '🔮🔮➡️💥✨ Two crystals creating amplified magical energy waves',
                difficulty: 'medium',
                category: 'theorems'
            },
            {
                id: 'q5',
                question: 'What historical event led to the establishment of the Law of Balance?',
                choices: [
                    'a) The Great Awakening',
                    'b) The Shadow War',
                    'c) First tree consciousness',
                    'd) Ancient curse creation'
                ],
                correct: 'b',
                explanation: 'The Shadow War ended when both sides realized balance was necessary.',
                diagram: '⚔️⚖️🕊️ War symbols transforming into balance and peace',
                difficulty: 'medium',
                category: 'history'
            }
        ],
        hard: [
            {
                id: 'q6',
                question: 'What is the mathematical proof for magical balance in the forest?',
                choices: [
                    'a) Energy In = Energy Out',
                    'b) Energy In = Energy Out + Energy Stored',
                    'c) Magic = Force × Distance',
                    'd) Power = Magic ÷ Time'
                ],
                correct: 'b',
                explanation: 'The equation proves why magical balance prevents forest degradation.',
                diagram: '📐⚡🌲 Mathematical equation floating above a healthy forest ecosystem',
                difficulty: 'hard',
                category: 'proofs'
            },
            {
                id: 'q7',
                question: 'According to the Spirit Binding Law, when must bound spirits be released?',
                choices: [
                    'a) At midnight',
                    'b) At sunrise',
                    'c) At sunset',
                    'd) During full moon'
                ],
                correct: 'b',
                explanation: 'Forest spirits must be released at sunrise to prevent corruption.',
                diagram: '👻🌅🆓 A spirit being released as the sun rises over the forest',
                difficulty: 'hard',
                category: 'laws'
            }
        ],
        advance: [
            {
                id: 'q_adv1',
                question: 'What is the derivation of the balance proof in forest magic?',
                choices: [
                    'a) Energy In = Energy Out',
                    'b) Energy In = Energy Out + Energy Stored',
                    'c) Energy = Magic × Time',
                    'd) Balance = Force - Decay'
                ],
                correct: 'b',
                explanation: 'The equation ensures no degradation in the forest.',
                diagram: '📐🌳 Equation with forest elements',
                difficulty: 'advance',
                category: 'proofs'
            },
            {
                id: 'q_adv2',
                question: 'How do tree-spirit relationships affect forest decisions?',
                choices: [
                    'a) Trees control spirits',
                    'b) Symbiotic exchange of energy and consciousness',
                    'c) Spirits destroy trees',
                    'd) No effect'
                ],
                correct: 'b',
                explanation: 'Spirits provide consciousness for energy.',
                diagram: '🤝🌳👻 Tree and spirit connected',
                difficulty: 'advance',
                category: 'relationships'
            }
        ]
    },
    dungeon: {
        easy: [
            {
                id: 'dq1',
                question: 'What is a hidden device designed to catch intruders in dungeons?',
                choices: [
                    'a) Ancient Rune',
                    'b) Trap Mechanism',
                    'c) Golem Guardian',
                    'd) Treasure Vault'
                ],
                correct: 'b',
                explanation: 'Trap Mechanisms include pressure plates and are common protections.',
                diagram: '🪤🏰 A pressure plate triggering arrows in a dungeon corridor',
                difficulty: 'easy',
                category: 'glossary'
            },
            {
                id: 'dq2',
                question: 'What is the rune-to-power conversion ratio?',
                choices: [
                    'a) 1 Rune = 1 Power',
                    'b) 1 Rune = 3 Power',
                    'c) 3 Rune = 1 Power',
                    'd) 1 Rune = 5 Power'
                ],
                correct: 'b',
                explanation: 'Runes convert to power at 1:3 ratio for traps.',
                diagram: '🔮➡️⚡⚡⚡ One rune transforming into three power bolts',
                difficulty: 'easy',
                category: 'conversions'
            },
            {
                id: 'dq3',
                question: 'Which law states every trap must have a disarm method?',
                choices: [
                    'a) Law of Traps',
                    'b) Conservation of Energy',
                    'c) Guardian Binding Law',
                    'd) Puzzle Resonance'
                ],
                correct: 'a',
                explanation: 'Allows worthy adventurers to pass.',
                diagram: '⚠️🛠️ A trap being disarmed with tools',
                difficulty: 'easy',
                category: 'laws'
            }
        ],
        fundamental: [
            {
                id: 'dq_fund1',
                question: 'What activates most trap mechanisms in dungeons?',
                choices: [
                    'a) Magic spells',
                    'b) Pressure plates or triggers',
                    'c) Guardian commands',
                    'd) Treasure removal'
                ],
                correct: 'b',
                explanation: 'Triggers like pressure plates activate traps.',
                diagram: '🪤📏 Pressure plate mechanism',
                difficulty: 'fundamental',
                category: 'glossary'
            },
            {
                id: 'dq_fund2',
                question: 'According to the Law of Traps, what must every trap have?',
                choices: [
                    'a) No disarm method',
                    'b) A detectable trigger and disarm method',
                    'c) Multiple layers',
                    'd) Magical components'
                ],
                correct: 'b',
                explanation: 'Allows worthy adventurers to pass.',
                diagram: '⚠️🛠️ Trap with visible trigger',
                difficulty: 'fundamental',
                category: 'laws'
            }
        ],
        medium: [
            {
                id: 'dq4',
                question: 'According to Puzzle Resonance Theorem, what happens with matching elements?',
                choices: [
                    'a) They cancel out',
                    'b) They create harmony',
                    'c) They explode',
                    'd) Nothing'
                ],
                correct: 'b',
                explanation: 'Matching creates harmonic solutions.',
                diagram: '🧩🧩➡️🔓 Puzzles aligning to open a door',
                difficulty: 'medium',
                category: 'theorems'
            },
            {
                id: 'dq5',
                question: 'What event led to protected dungeons?',
                choices: [
                    'a) Fall of the Empire',
                    'b) Guardian War',
                    'c) Rune Discovery',
                    'd) Treasure Hunt'
                ],
                correct: 'a',
                explanation: 'Collapse led to knowledge preservation.',
                diagram: '🏛️⬇️🏰 Empire ruins transforming into dungeons',
                difficulty: 'medium',
                category: 'history'
            }
        ],
        hard: [
            {
                id: 'dq6',
                question: 'What is the proof for energy conservation in dungeons?',
                choices: [
                    'a) Input = Output',
                    'b) Input = Output + Stored',
                    'c) Energy = Mass × Speed',
                    'd) Power = Energy / Time'
                ],
                correct: 'b',
                explanation: 'Demonstrates stability of dungeon magic.',
                diagram: '📏⚡🏰 Equation over a glowing dungeon',
                difficulty: 'hard',
                category: 'proofs'
            },
            {
                id: 'dq7',
                question: 'According to Guardian Binding Law, what happens with improper binding?',
                choices: [
                    'a) Guardians sleep',
                    'b) Rampant terror',
                    'c) Treasure reveal',
                    'd) Trap disable'
                ],
                correct: 'b',
                explanation: 'Leads to uncontrolled guardians.',
                diagram: '⛓️🤖😡 Broken chains on a raging golem',
                difficulty: 'hard',
                category: 'laws'
            }
        ],
        advance: [
            {
                id: 'dq_adv1',
                question: 'What happens when artifact decay is not renewed?',
                choices: [
                    'a) Power increases',
                    'b) Artifacts lose power',
                    'c) Traps deactivate',
                    'd) Runes multiply'
                ],
                correct: 'b',
                explanation: 'Requires recharging over time.',
                diagram: '🕰️🏺 Fading artifact glow',
                difficulty: 'advance',
                category: 'theorems'
            },
            {
                id: 'dq_adv2',
                question: 'What is the connection in rune-guardian symbiosis?',
                choices: [
                    'a) Runes power guardians for protection',
                    'b) Guardians destroy runes',
                    'c) No connection',
                    'd) Runes control treasures'
                ],
                correct: 'a',
                explanation: 'Symbiotic defense system.',
                diagram: '🔗🔮🤖 Rune linked to golem',
                difficulty: 'advance',
                category: 'relationships'
            }
        ]
    },
    mountains: {
        easy: [
            {
                id: 'mq1',
                question: 'What are natural deposits of magical crystals in mountains?',
                choices: [
                    'a) Dragon Scale',
                    'b) Crystal Vein',
                    'c) Peak Spirit',
                    'd) Avalanche Path'
                ],
                correct: 'b',
                explanation: 'Sought for energy-storing properties.',
                diagram: '💎⛰️ Crystals embedded in mountain rock',
                difficulty: 'easy',
                category: 'glossary'
            },
            {
                id: 'mq2',
                question: 'What is the altitude-to-energy conversion?',
                choices: [
                    'a) 1m = 0.5 Energy',
                    'b) 1m = 1 Energy',
                    'c) 1m = 2 Energy',
                    'd) 1m = 0.1 Energy'
                ],
                correct: 'a',
                explanation: 'Higher climbs drain more.',
                diagram: '🏔️➡️⚡ Half energy unit per meter',
                difficulty: 'easy',
                category: 'conversions'
            },
            {
                id: 'mq3',
                question: 'Which law requires pacing in climbs?',
                choices: [
                    'a) Law of Ascent',
                    'b) Conservation of Altitude',
                    'c) Dragon Pact',
                    'd) Crystal Resonance'
                ],
                correct: 'a',
                explanation: 'Proportional energy for heights.',
                diagram: '⬆️🏃 A climber pacing up a slope',
                difficulty: 'easy',
                category: 'laws'
            }
        ],
        fundamental: [
            {
                id: 'mq_fund1',
                question: 'What properties do dragon scales have?',
                choices: [
                    'a) Decorative only',
                    'b) Protective for armor',
                    'c) Energy draining',
                    'd) Weather control'
                ],
                correct: 'b',
                explanation: 'Used in superior defense armor.',
                diagram: '🐉🛡️ Scale in armor',
                difficulty: 'fundamental',
                category: 'glossary'
            },
            {
                id: 'mq_fund2',
                question: 'What does the Law of Ascent require?',
                choices: [
                    'a) Unlimited energy',
                    'b) Proportional energy for altitude',
                    'c) No pacing',
                    'd) Downward focus'
                ],
                correct: 'b',
                explanation: 'Pacing to avoid exhaustion.',
                diagram: '⬆️⚡ Energy meter rising with height',
                difficulty: 'fundamental',
                category: 'laws'
            }
        ],
        medium: [
            {
                id: 'mq4',
                question: 'What does Crystal Resonance Theorem do?',
                choices: [
                    'a) Cancel crystals',
                    'b) Detect veins',
                    'c) Cause avalanches',
                    'd) Summon dragons'
                ],
                correct: 'b',
                explanation: 'Vibrations locate hidden crystals.',
                diagram: '📡💎 Crystals vibrating in harmony',
                difficulty: 'medium',
                category: 'theorems'
            },
            {
                id: 'mq5',
                question: 'What event marked mountain pacts?',
                choices: [
                    'a) Dragon Awakening',
                    'b) Peak War',
                    'c) Crystal Discovery',
                    'd) Summit Climb'
                ],
                correct: 'a',
                explanation: 'First dragon emergence.',
                diagram: '🔥🐉 Dragon emerging from peak',
                difficulty: 'medium',
                category: 'history'
            }
        ],
        hard: [
            {
                id: 'mq6',
                question: 'What is the proof for altitude conservation?',
                choices: [
                    'a) Up = Down',
                    'b) Up = Down + Potential',
                    'c) Force = Mass × Gravity',
                    'd) Speed = Distance / Time'
                ],
                correct: 'b',
                explanation: 'Explains climbing physics.',
                diagram: '📐🏔️ Equation on a mountain backdrop',
                difficulty: 'hard',
                category: 'proofs'
            },
            {
                id: 'mq7',
                question: 'What happens if Dragon Pact is broken?',
                choices: [
                    'a) Peace',
                    'b) Catastrophes',
                    'c) Treasure',
                    'd) Clear weather'
                ],
                correct: 'b',
                explanation: 'Causes mountain disasters.',
                diagram: '🤝🐉💥 Broken pact causing avalanche',
                difficulty: 'hard',
                category: 'laws'
            }
        ],
        advance: [
            {
                id: 'mq_adv1',
                question: 'What is the principle of summit decay?',
                choices: [
                    'a) Magic increases',
                    'b) Erodes without renewal',
                    'c) Stable forever',
                    'd) Weather independent'
                ],
                correct: 'b',
                explanation: 'Requires rituals for stability.',
                diagram: '🌋⏳ Eroding peak',
                difficulty: 'advance',
                category: 'theorems'
            },
            {
                id: 'mq_adv2',
                question: 'What is the crystal-spirit bond?',
                choices: [
                    'a) Spirits charge crystals for protection',
                    'b) Crystals destroy spirits',
                    'c) No bond',
                    'd) Spirits ignore crystals'
                ],
                correct: 'a',
                explanation: 'Maintains ecosystem.',
                diagram: '💎👻 Bonded crystal and spirit',
                difficulty: 'advance',
                category: 'relationships'
            }
        ]
    },
    island: {
        easy: [
            {
                id: 'iq1',
                question: 'What are underwater structures home to sea life?',
                choices: [
                    'a) Pirate Map',
                    'b) Coral Reef',
                    'c) Sea Serpent',
                    'd) Tropical Storm'
                ],
                correct: 'b',
                explanation: 'Built by marine organisms.',
                diagram: '🪸🐟 Colorful reef with fish',
                difficulty: 'easy',
                category: 'glossary'
            },
            {
                id: 'iq2',
                question: 'What is the tide-to-depth change?',
                choices: [
                    'a) 1 Cycle = 1m',
                    'b) 1 Cycle = 2m',
                    'c) 1 Cycle = 3m',
                    'd) 1 Cycle = 0.5m'
                ],
                correct: 'b',
                explanation: 'Affects shore access.',
                diagram: '🌙➡️📏 Water level changing',
                difficulty: 'easy',
                category: 'conversions'
            },
            {
                id: 'iq3',
                question: 'Which law governs tide cycles?',
                choices: [
                    'a) Law of Tides',
                    'b) Conservation of Waves',
                    'c) Serpent Binding',
                    'd) Reef Resonance'
                ],
                correct: 'a',
                explanation: 'Influenced by moon.',
                diagram: '🌙🌊 Tides rising and falling',
                difficulty: 'easy',
                category: 'laws'
            }
        ],
        fundamental: [
            {
                id: 'iq_fund1',
                question: 'What do pirate maps often contain?',
                choices: [
                    'a) Weather forecasts',
                    'b) Riddles and symbols',
                    'c) Sea serpent locations',
                    'd) Storm patterns'
                ],
                correct: 'b',
                explanation: 'Encrypted with riddles.',
                diagram: '🗺️🔍 Map with symbols',
                difficulty: 'fundamental',
                category: 'glossary'
            },
            {
                id: 'iq_fund2',
                question: 'What influences tides according to the Law of Tides?',
                choices: [
                    'a) Wind',
                    'b) The moon',
                    'c) Serpents',
                    'd) Reefs'
                ],
                correct: 'b',
                explanation: 'Cycles influenced by the moon.',
                diagram: '🌙🌊 Moon pulling tides',
                difficulty: 'fundamental',
                category: 'laws'
            }
        ],
        medium: [
            {
                id: 'iq4',
                question: 'What attracts sea life per Reef Resonance?',
                choices: [
                    'a) Opposing forces',
                    'b) Similar frequencies',
                    'c) Storms',
                    'd) Maps'
                ],
                correct: 'b',
                explanation: 'Locates underwater caves.',
                diagram: '🐠🪸 Frequencies drawing fish',
                difficulty: 'medium',
                category: 'theorems'
            },
            {
                id: 'iq5',
                question: 'What era led to hidden treasures?',
                choices: [
                    'a) Golden Age of Pirates',
                    'b) Serpent War',
                    'c) Tide Discovery',
                    'd) Storm Season'
                ],
                correct: 'a',
                explanation: 'Peak piracy period.',
                diagram: '🏴‍☠️💰 Pirates burying treasure',
                difficulty: 'medium',
                category: 'history'
            }
        ],
        hard: [
            {
                id: 'iq6',
                question: 'What is the proof for wave conservation?',
                choices: [
                    'a) Incoming = Reflected',
                    'b) Incoming = Reflected + Absorbed',
                    'c) Wave = Height × Speed',
                    'd) Energy = Wave / Time'
                ],
                correct: 'b',
                explanation: 'Explains coastal dynamics.',
                diagram: '📊🌊 Equation on waves',
                difficulty: 'hard',
                category: 'proofs'
            },
            {
                id: 'iq7',
                question: 'What occurs with forced serpent summons?',
                choices: [
                    'a) Calm seas',
                    'b) Tsunamis',
                    'c) Treasure reveal',
                    'd) Clear skies'
                ],
                correct: 'b',
                explanation: 'Leads to disasters.',
                diagram: '🐍🌊 Summon causing waves',
                difficulty: 'hard',
                category: 'laws'
            }
        ],
        advance: [
            {
                id: 'iq_adv1',
                question: 'What is the principle of treasure decay?',
                choices: [
                    'a) Degrades unless preserved',
                    'b) Increases value over time',
                    'c) Unaffected by time',
                    'd) Attracts serpents'
                ],
                correct: 'a',
                explanation: 'Requires seals for storage.',
                diagram: '🏴‍☠️⏳ Decaying treasure',
                difficulty: 'advance',
                category: 'theorems'
            },
            {
                id: 'iq_adv2',
                question: 'What is the reef-serpent symbiosis?',
                choices: [
                    'a) Serpents protect reefs for breeding',
                    'b) Reefs harm serpents',
                    'c) No symbiosis',
                    'd) Reefs control storms'
                ],
                correct: 'a',
                explanation: 'Maintains marine balance.',
                diagram: '🪸🐉 Serpent guarding reef',
                difficulty: 'advance',
                category: 'relationships'
            }
        ]
    },
    hauntedhouse: {
        easy: [
            {
                id: 'hq1',
                question: 'What are visible spirit manifestations?',
                choices: [
                    'a) Cursed Artifact',
                    'b) Ghost Apparition',
                    'c) Poltergeist',
                    'd) Ectoplasm'
                ],
                correct: 'b',
                explanation: 'Tied to past events.',
                diagram: '👻🏠 Ghost in a room',
                difficulty: 'easy',
                category: 'glossary'
            },
            {
                id: 'hq2',
                question: 'What is the fear-to-energy conversion?',
                choices: [
                    'a) 1 Fear = 1 Power',
                    'b) 1 Fear = 2 Power',
                    'c) 2 Fear = 1 Power',
                    'd) 1 Fear = 3 Power'
                ],
                correct: 'b',
                explanation: 'Strengthens ghosts.',
                diagram: '😱➡️⚡⚡ Fear turning to power',
                difficulty: 'easy',
                category: 'conversions'
            },
            {
                id: 'hq3',
                question: 'Which law binds spirits to locations?',
                choices: [
                    'a) Law of Haunting',
                    'b) Conservation of Spirits',
                    'c) Curse Binding',
                    'd) Spectral Resonance'
                ],
                correct: 'a',
                explanation: 'Emotional significance.',
                diagram: '🕯️👻 Spirit bound to house',
                difficulty: 'easy',
                category: 'laws'
            }
        ],
        fundamental: [
            {
                id: 'hq_fund1',
                question: 'What causes cursed artifacts to bring misfortune?',
                choices: [
                    'a) Positive energy',
                    'b) Negative energy',
                    'c) Neutral energy',
                    'd) No energy'
                ],
                correct: 'b',
                explanation: 'Imbued with negative energy.',
                diagram: '🏺😈 Cursed vase emitting dark aura',
                difficulty: 'fundamental',
                category: 'glossary'
            },
            {
                id: 'hq_fund2',
                question: 'What binds spirits to locations per Law of Haunting?',
                choices: [
                    'a) Random chance',
                    'b) Emotional significance',
                    'c) Physical chains',
                    'd) Magical spells only'
                ],
                correct: 'b',
                explanation: 'Tied to emotional events.',
                diagram: '🕯️👻 Spirit in significant room',
                difficulty: 'fundamental',
                category: 'laws'
            }
        ],
        medium: [
            {
                id: 'hq4',
                question: 'What attracts ghosts per Spectral Resonance?',
                choices: [
                    'a) Positive energy',
                    'b) Similar emotions',
                    'c) Light',
                    'd) Salt'
                ],
                correct: 'b',
                explanation: 'Fear amplifies.',
                diagram: '🔊👻 Emotions drawing spirits',
                difficulty: 'medium',
                category: 'theorems'
            },
            {
                id: 'hq5',
                question: 'What event caused mass awakenings?',
                choices: [
                    'a) Great Haunting',
                    'b) Curse War',
                    'c) Artifact Discovery',
                    'd) Night Vigil'
                ],
                correct: 'a',
                explanation: 'Catastrophic event.',
                diagram: '🌑👻 Spirits awakening',
                difficulty: 'medium',
                category: 'history'
            }
        ],
        hard: [
            {
                id: 'hq6',
                question: 'What is the proof for spectral conservation?',
                choices: [
                    'a) Manifest = Latent',
                    'b) Manifest = Latent + Released',
                    'c) Energy = Fear × Will',
                    'd) Power = Spirit / Time'
                ],
                correct: 'b',
                explanation: 'Why hauntings persist.',
                diagram: '📈👻 Equation on ghosts',
                difficulty: 'hard',
                category: 'proofs'
            },
            {
                id: 'hq7',
                question: 'What is required to lift curses?',
                choices: [
                    'a) Ignore anchors',
                    'b) Counter-rituals',
                    'c) More curses',
                    'd) Darkness'
                ],
                correct: 'b',
                explanation: 'With anchors.',
                diagram: '🔒📜 Curse being lifted',
                difficulty: 'hard',
                category: 'laws'
            }
        ],
        advance: [
            {
                id: 'hq_adv1',
                question: 'What disrupts ghostly manifestations?',
                choices: [
                    'a) Darkness',
                    'b) Positive energy',
                    'c) Fear',
                    'd) Salt'
                ],
                correct: 'b',
                explanation: 'Positive energy interferes.',
                diagram: '⚡👻 Positive light weakening ghost',
                difficulty: 'advance',
                category: 'theorems'
            },
            {
                id: 'hq_adv2',
                question: 'What ties ghosts to artifacts?',
                choices: [
                    'a) No tie',
                    'b) Artifacts anchor ghosts for power',
                    'c) Ghosts destroy artifacts',
                    'd) Artifacts repel ghosts'
                ],
                correct: 'b',
                explanation: 'Explains persistent hauntings.',
                diagram: '👻🏺 Ghost anchored to artifact',
                difficulty: 'advance',
                category: 'relationships'
            }
        ]
    }
};

// ========== ADVENTURE LOCATIONS ==========
export const ADVENTURE_LOCATIONS = {
    forest: {
        name: "🌲 Mystic Forest",
        minLevel: 1,
        baseRewards: { money: [10, 50], exp: [15, 45], wood: [1, 3] },
        specialRewards: { uncommon: 0.3, mythic: 0.05 },
        healthCost: [5, 15],
        armorCost: [2, 8],
        events: ["treespirit", "hiddenchest", "wolfpack", "ancientrune", "enchantedgrove"]
    },
    dungeon: {
        name: "🏰 Ancient Dungeon",
        minLevel: 1,
        baseRewards: { money: [50, 150], exp: [30, 80], rock: [1, 4] },
        specialRewards: { uncommon: 0.4, mythic: 0.1, legendary: 0.02 },
        healthCost: [15, 30],
        armorCost: [5, 15],
        events: ["traproom", "pressurehall", "treasurevault", "bossencounter", "secretcrypt"]
    },
    mountains: {
        name: "⛰️ Dragon Peaks",
        minLevel: 1,
        baseRewards: { money: [100, 300], exp: [50, 120], diamond: [0, 2] },
        specialRewards: { mythic: 0.15, legendary: 0.05, diamond: 0.2 },
        healthCost: [20, 40],
        armorCost: [8, 20],
        events: ["avalanche", "mountainpass", "crystalcave", "dragonencounter", "summitascend"]
    },
    island: {
        name: "🏝️ Tropical Island",
        minLevel: 1,
        baseRewards: { money: [30, 100], exp: [20, 60], string: [1, 5] },
        specialRewards: { uncommon: 0.35, mythic: 0.07 },
        healthCost: [10, 20],
        armorCost: [3, 10],
        events: ["buriedtreasure", "pirateambush", "losttemple", "seacreature", "stormyweather"]
    },
    hauntedhouse: {
        name: "👻 Haunted House",
        minLevel: 1,
        baseRewards: { money: [70, 200], exp: [40, 100], potion: [1, 3] },
        specialRewards: { mythic: 0.12, legendary: 0.03 },
        healthCost: [18, 35],
        armorCost: [7, 18],
        events: ["ghostapparition", "secretpassage", "cursedroom", "poltergeist", "ancientcurse"]
    }
};

// ========== EVENT DIFFICULTIES ==========
export const EVENT_DIFFICULTIES = {
    forest: {
        'treespirit': 'easy',
        'hiddenchest': 'fundamental',
        'wolfpack': 'medium',
        'ancientrune': 'hard',
        'enchantedgrove': 'advance'
    },
    dungeon: {
        'traproom': 'easy',
        'pressurehall': 'fundamental',
        'treasurevault': 'medium',
        'bossencounter': 'hard',
        'secretcrypt': 'advance'
    },
    mountains: {
        'avalanche': 'easy',
        'mountainpass': 'fundamental',
        'crystalcave': 'medium',
        'dragonencounter': 'hard',
        'summitascend': 'advance'
    },
    island: {
        'buriedtreasure': 'easy',
        'pirateambush': 'fundamental',
        'losttemple': 'medium',
        'seacreature': 'hard',
        'stormyweather': 'advance'
    },
    hauntedhouse: {
        'ghostapparition': 'easy',
        'secretpassage': 'fundamental',
        'cursedroom': 'medium',
        'poltergeist': 'hard',
        'ancientcurse': 'advance'
    }
};

// Progression Order
export const LOCATION_ORDER = ['forest', 'dungeon', 'island', 'hauntedhouse', 'mountains'];
export const DIFFICULTIES = ['easy', 'fundamental', 'medium', 'hard', 'advance'];
export const DIFFICULTY_INDEX = {
    easy: 0,
    fundamental: 1,
    medium: 2,
    hard: 3,
    advance: 4
};

