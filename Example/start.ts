


import { Boom } from '@hapi/boom'
import NodeCache from '@cacheable/node-cache'
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
        intro: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    audio: {
        notification: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
        welcome: 'https://www.soundjay.com/misc/sounds/beep-07a.mp3'
    },
    documents: {
        manual: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        sample: 'https://file-examples.com/storage/fe86c96bf48ce8b1b5fd9b2/2017/10/file_example_PDF_1MB.pdf'
    },
    localFiles: {
        // Add your local files here (make sure they exist in your project)
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

const downloadsDir = './downloads'
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true })
}

const doReplies = process.argv.includes('--do-reply')
const usePairingCode = process.argv.includes('--use-pairing-code')

// Cache for message retry counts
const msgRetryCounterCache = new NodeCache()

// Readline interface for input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

// Helper function to download media from URL
const downloadFromUrl = async (url: string, filename?: string): Promise<Buffer> => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        return Buffer.from(response.data)
    } catch (error) {
        console.error(`Failed to download from ${url}:`, error)
        throw error
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
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...')
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

// Command handler function
const handleCommand = async (text: string, from: string, msg: any, sock: any, sendMessageWithTyping: Function): Promise<boolean> => {
    const cleanText = text.toLowerCase().trim()
    const command = cleanText.startsWith('/') ? cleanText.split(' ')[0] : cleanText.split(' ')[0]
    const args = text.split(' ').slice(1)
    
    const validCommands = [
        'help', 'menu', 'time', 'echo', 'info', 'status', 'random', 'ping', 
        'sticker', 'contact', 'image', 'video', 'audio', 'document', 'file',
        'location', 'poll', 'download', 'gallery', 'media', 'welcome', 'demo'
    ]
    
    const isValidCommand = validCommands.includes(command.replace('/', ''))
    
    if (!isValidCommand) {
        return false
    }
    
    console.log(`🎯 Command received: ${command} from ${from}`)
    
    const cleanCommand = command.replace('/', '')
    
    switch (cleanCommand) {
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
                        '🎁 Welcome Package'
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

*🎁 Pre-loaded Media:*
• *welcome* - Welcome package with media
• *gallery* - View image gallery
• *image* - Send random image from gallery
• *video* - Send demo video
• *audio* - Send notification sound
• *document* - Send sample document
• *demo* - Full media demonstration

*📞 Contacts & Location:*
• *contact* - Browse contact directory
• *location* - Send demo location

*🎯 Interactive Features:*
• *poll* - Create a demo poll
• *sticker* - Convert image to sticker (reply to image)
• *download* - Download media (reply to media message)

✨ *All media is pre-configured by the bot owner!*
📱 *Tap poll options above for quick access!*`
            
            await sendMessageWithTyping({ text: helpText }, from)
            break
            
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
🔢 *Message Type:* Text Message`
            
            await sendMessageWithTyping({ text: chatInfo }, from)
            break
            
        case 'status':
            const uptime = process.uptime()
            const statusText = `✅ *Bot Status: Online*
            
🚀 *Uptime:* ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s
💾 *Memory:* ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
🔗 *Connection:* Stable & Active
⚡ *Performance:* Optimal
📱 *Platform:* WhatsApp Web
🤖 *Version:* 2.0.0

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
        case 'image':
            await sendGalleryOptions(sock, from)
            break
            
        case 'video':
            await sendPreConfiguredVideo(sock, from)
            break
            
        case 'audio':
            await sendPreConfiguredAudio(sock, from)
            break
            
        case 'document':
            await sendPreConfiguredDocument(sock, from)
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


console.log('🚀 Starting WhatsApp Bot...')
console.log('📋 Available commands:')
console.log('  --use-pairing-code : Use pairing code instead of QR code')
console.log('  --do-reply        : Enable auto-replies to messages')
console.log('')

startSock().catch(error => {
    console.error('❌ Failed to start bot:', error)
    process.exit(1)
})
