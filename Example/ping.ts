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
import P from 'pino'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

// Logger setup
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./wa-logs.txt'))
logger.level = 'trace'

const doReplies = process.argv.includes('--do-reply')
// Force pairing code to always be true
const usePairingCode = true

// Cache for message retry counts
const msgRetryCounterCache = new NodeCache()

// Add connection monitoring
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

// Readline interface for input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

const handleCommand = async (
    text: string,
    from: string,
    msg: any,
    sock: any,
    sendMessageWithTyping: (msg: AnyMessageContent, jid: string, retries?: number) => Promise<any>
): Promise<boolean> => {
    const command = text.toLowerCase().trim()
    console.log(`🎯 Handling command: "${command}" from ${from}`)
    
    try {
        switch (command) {
            case 'help':
                await sendMessageWithTyping({
                    text: `🤖 *Available Commands:*\n\n` +
                          `• help - Show this menu\n` +
                          `• time - Get current time\n` +
                          `• info - Bot information\n` +
                          `• random - Random number\n` +
                          `• ping - Check bot status\n` +
                          `• status - Connection status\n` +
                          `• poll - Create a sample poll`
                }, from)
                return true
                
            case 'time':
                await sendMessageWithTyping({
                    text: `🕐 Current time: ${new Date().toLocaleString()}`
                }, from)
                return true
                
            case 'info':
                await sendMessageWithTyping({
                    text: `ℹ️ *Bot Information:*\n\n` +
                          `• Name: WhatsApp Bot\n` +
                          `• Version: 1.0.0\n` +
                          `• Status: Active\n` +
                          `• Uptime: ${Math.floor(process.uptime())} seconds\n` +
                          `• Powered by Baileys`
                }, from)
                return true
                
            case 'random':
                const randomNum = Math.floor(Math.random() * 100) + 1
                await sendMessageWithTyping({
                    text: `🎲 Random number: ${randomNum}`
                }, from)
                return true
                
            case 'ping':
            case 'test':
                const pingTime = Date.now()
                await sendMessageWithTyping({
                    text: `🏓 Pong! Bot is active and running.\n⏱️ Response time: ${Date.now() - pingTime}ms`
                }, from)
                return true
                
            case 'status':
                await sendMessageWithTyping({
                    text: `📊 *Bot Status:*\n\n` +
                          `• Connection: ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}\n` +
                          `• Last heartbeat: ${Math.floor((Date.now() - lastHeartbeat) / 1000)}s ago\n` +
                          `• Uptime: ${Math.floor(process.uptime())} seconds\n` +
                          `• Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
                }, from)
                return true
                
            case 'poll':
                await sock.sendMessage(from, {
                    poll: {
                        name: "🤖 Bot Commands Menu",
                        values: [
                            "help", "time", "info", "random", "ping",
                            "status", "test", "poll", "document", "contact"
                        ],
                        selectableCount: 1
                    }
                })
                return true
                
            default:
                return false
        }
    } catch (error) {
        console.error(`❌ Error in handleCommand:`, error)
        try {
            await sendMessageWithTyping({
                text: `❌ Sorry, there was an error processing your command. Please try again.`
            }, from)
        } catch (sendError) {
            console.error(`❌ Failed to send error message:`, sendError)
        }
        return true // Return true to prevent auto-reply
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
        // Removed deprecated printQRInTerminal option
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
    
    // Helper function to send message with typing indicator and retry logic
    const sendMessageWithTyping = async (msg: AnyMessageContent, jid: string, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`📤 Attempting to send message (attempt ${attempt}/${retries}) to ${jid}`)
                
                await sock.presenceSubscribe(jid)
                await delay(500)
                await sock.sendPresenceUpdate('composing', jid)
                await delay(1500)  // Reduced delay
                await sock.sendPresenceUpdate('paused', jid)
                
                const result = await sock.sendMessage(jid, msg)
                console.log(`✅ Message sent successfully to ${jid}`)
                return result
            } catch (error) {
                console.error(`❌ Send attempt ${attempt} failed:`, error.message)
                if (attempt === retries) {
                    throw error
                }
                await delay(1000 * attempt) // Exponential backoff
            }
        }
    }
    
    // Event handlers
    sock.ev.process(async (events) => {
        // Connection updates
        if (events['connection.update']) {
            const update = events['connection.update']
            const { connection, lastDisconnect, qr } = update
            
            // QR code handling removed - only using pairing codes
            if (qr) {
                console.log('🔄 QR code received but pairing code method is preferred...')
            }
            
            if (connection === 'close') {
                isConnected = false
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
                isConnected = true
                lastHeartbeat = Date.now()
                
                // Start heartbeat monitoring
                startHeartbeat(sock)
                
                // Send presence to indicate we're online
                setTimeout(async () => {
                    try {
                        await sock.sendPresenceUpdate('available')
                        console.log('📱 Presence updated to available')
                    } catch (error) {
                        console.log('⚠️ Failed to update presence:', error.message)
                    }
                }, 1000)
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...')
                isConnected = false
            }
            
            console.log('Connection update:', { connection, lastDisconnect: lastDisconnect?.error })
        }
        
        // Handle pairing code automatically
        if (events['connection.update'] && !sock.authState.creds.registered) {
            const update = events['connection.update']
            
            // Only request pairing code when we get a QR or when connecting
            if (update.qr || (update.connection === 'connecting' && !update.qr)) {
                try {
                    console.log('📞 Pairing code method selected')
                    const phoneNumber = await question('Please enter your phone number (with country code, e.g., +1234567890): ')
                    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
                    
                    if (cleanNumber.length < 10) {
                        console.log('❌ Invalid phone number format. Please try again.')
                        return
                    }
                    
                    console.log('🔄 Requesting pairing code...')
                    const code = await sock.requestPairingCode(cleanNumber)
                    console.log(`\n🔐 Your pairing code: ${code}`)
                    console.log('📱 Go to WhatsApp > Settings > Linked Devices > Link a Device > Link with Phone Number')
                    console.log('📝 Enter the pairing code above\n')
                } catch (error) {
                    console.error('❌ Error requesting pairing code:', error)
                    console.log('Please restart the bot and try again.')
                    process.exit(1)
                }
            }
        }
        
        if (events['creds.update']) {
            await saveCreds()
            console.log('💾 Credentials saved')
        }
        
        // Handle incoming messages and poll responses
        if (events['messages.upsert']) {
            const upsert = events['messages.upsert']
            console.log(`📥 Received ${upsert.messages.length} messages, type: ${upsert.type}`)
            
            if (upsert.type === 'notify') {
                for (const msg of upsert.messages) {
                    try {
                        console.log(`🔍 Processing message:`, {
                            key: msg.key,
                            messageType: Object.keys(msg.message || {}),
                            fromMe: msg.key.fromMe
                        })

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
                        
                        // Handle regular text messages with better extraction
                        const text = msg.message?.conversation ||
                                   msg.message?.extendedTextMessage?.text ||
                                   msg.message?.imageMessage?.caption ||
                                   msg.message?.videoMessage?.caption ||
                                   msg.message?.documentMessage?.caption ||
                                   ''
                                   
                        console.log(`📝 Extracted text: "${text}"`)
                        
                        if (text && text.trim()) {
                            const from = msg.key.remoteJid
                            const isFromMe = msg.key.fromMe
                            
                            console.log(`📨 ${isFromMe ? 'You' : from}: ${text}`)
                            
                            // Skip messages from self and groups if not intended
                            if (!isFromMe && from && !from.includes('@g.us')) {
                                console.log(`✅ Processing message from: ${from}`)
                                
                                try {
                                    await sock.readMessages([msg.key])
                                    console.log(`✅ Marked message as read`)
                                } catch (readError) {
                                    console.log(`⚠️ Failed to mark as read:`, readError.message)
                                }

                                try {
                                    const isCommand = await handleCommand(text, from, msg, sock, sendMessageWithTyping)
                                    console.log(`🔍 Command handled: ${isCommand}`)
                                    
                                    if (!isCommand && doReplies) {
                                        console.log('🤖 Sending auto-reply...')
                                        await sendMessageWithTyping(
                                            { text: '👋 Hello! This is an automated response. Type "help" for available commands.' },
                                            from
                                        )
                                        console.log('✅ Auto-reply sent')
                                    }
                                } catch (commandError) {
                                    console.error(`❌ Error handling command:`, commandError)
                                }
                            } else {
                                console.log(`⏭️ Skipping message: fromMe=${isFromMe}, isGroup=${from?.includes('@g.us')}`)
                            }
                        } else {
                            console.log(`⏭️ No text content found in message`)
                        }
                    } catch (msgError) {
                        console.error(`❌ Error processing individual message:`, msgError)
                    }
                }
            } else {
                console.log(`⏭️ Skipping non-notify message type: ${upsert.type}`)
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

console.log('🚀 Starting WhatsApp Bot with Pairing Code...')
console.log('📋 Available commands:')
console.log('  --do-reply        : Enable auto-replies to messages')
console.log('📱 This bot will ONLY use pairing codes (no QR codes)')
console.log('')

startSock().catch(error => {
    console.error('❌ Failed to start bot:', error)
    process.exit(1)
})
