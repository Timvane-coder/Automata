// lib/youtube.js - Fixed for Heroku deployment

import fs from 'fs-extra'
import { getTemporaryPath, formatSeconds } from './util.js'
import { convertMp4ToMp3 } from './video.js'

// Fix youtube-sr import for Heroku
let Youtube;
try {
    // Try different import methods
    const youtubeModule = await import('youtube-sr');
    Youtube = youtubeModule.default || youtubeModule;
    
    // If still no luck, try accessing methods directly
    if (!Youtube || typeof Youtube.searchOne !== 'function') {
        Youtube = youtubeModule;
    }
} catch (error) {
    console.error('Failed to import youtube-sr:', error.message);
    // Fallback: create a mock object to prevent crashes
    Youtube = {
        searchOne: async () => { throw new Error('YouTube search not available'); },
        search: async () => { throw new Error('YouTube search not available'); }
    };
}

import ytdl from '@distube/ytdl-core'
import axios from 'axios'

// Enhanced agent configuration for Heroku
const yt_agent = ytdl.createAgent([
    { 
        name: 'cookie1', 
        value: 'GPS=1; YSC=CkypMSpfgiI; VISITOR_INFO1_LIVE=4nF8vxPW1gU; VISITOR_PRIVACY_METADATA=CgJCUhIEGgAgZA%3D%3D; PREF=f6=40000000&tz=America.Sao_Paulo;' 
    }
], {
    // Add timeout and other options for Heroku
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
})

// Fallback search using YouTube API or alternative method
const fallbackSearch = async (query) => {
    try {
        // Alternative: Use YouTube's search suggest API
        const searchUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, { timeout: 10000 });
        
        // This is a basic fallback - you might want to implement a more robust solution
        // For now, we'll construct a likely video ID pattern
        const searchTerm = query.replace(/\s+/g, '+');
        throw new Error(`Search fallback not fully implemented. Try using direct YouTube URL instead of: ${query}`);
        
    } catch (error) {
        throw new Error(`Fallback search failed: ${error.message}`);
    }
};

// Debug function to check Youtube import
console.log('Youtube import check:', {
    Youtube: typeof Youtube,
    hasSearchOne: typeof Youtube?.searchOne,
    hasSearch: typeof Youtube?.search,
    methods: Youtube ? Object.getOwnPropertyNames(Youtube) : 'No Youtube object'
})

// Enhanced function to get YouTube video information
export const getYoutubeVideoInfo = async (text) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = {}, video_id = ''

            console.log('🔍 Searching for:', text)

            // Check if the URL is valid first
            const VALID_URL = ytdl.validateURL(text)
            if (VALID_URL) {
                video_id = ytdl.getVideoID(text)
                console.log('✅ Valid URL detected, video ID:', video_id)
            } else {
                console.log('🔍 Not a URL, attempting search...')
                
                try {
                    let videoSearch;
                    
                    // Try multiple search methods
                    if (Youtube && typeof Youtube.searchOne === 'function') {
                        console.log('Using Youtube.searchOne method')
                        videoSearch = await Youtube.searchOne(text, { type: 'video' })
                    } else if (Youtube.default && typeof Youtube.default.searchOne === 'function') {
                        console.log('Using Youtube.default.searchOne method')
                        videoSearch = await Youtube.default.searchOne(text, { type: 'video' })
                    } else {
                        console.log('youtube-sr not available, trying fallback...')
                        await fallbackSearch(text); // This will throw an error with instructions
                    }
                    
                    if (videoSearch && videoSearch.id) {
                        video_id = videoSearch.id
                        console.log('✅ Search successful, video ID:', video_id)
                    } else {
                        throw new Error('No video found in search results')
                    }
                } catch (searchError) {
                    console.error('Search error:', searchError.message)
                    response.error = `Search failed: ${searchError.message}. Please provide a direct YouTube URL instead.`
                    return reject(response)
                }
            }

            if (!video_id) {
                response.error = 'Could not extract video ID. Please provide a valid YouTube URL.'
                return reject(response)
            }

            console.log('📺 Getting video info for ID:', video_id)

            // Enhanced ytdl options for Heroku
            const ytdlOptions = {
                playerClients: ["WEB", "WEB_EMBEDDED", "ANDROID"],
                agent: yt_agent,
                requestOptions: {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    }
                }
            };

            // Get video information with better error handling
            ytdl.getInfo(video_id, ytdlOptions).then(videoInfo => {
                console.log('✅ Video info retrieved successfully')
                
                const formats = ytdl.filterFormats(videoInfo.formats, "videoandaudio")
                const format = ytdl.chooseFormat(formats, { quality: 'highest' })

                // Extract thumbnails safely
                const videoDetails = videoInfo.player_response?.videoDetails || videoInfo.videoDetails || {}
                const thumbnails = videoDetails.thumbnail?.thumbnails || []
                const highestThumbnail = thumbnails.length > 0 ? 
                    thumbnails.reduce((prev, current) =>
                        (prev.width * prev.height > current.width * current.height) ? prev : current
                    ) : null

                response.result = {
                    videoId: videoDetails.videoId,
                    title: videoDetails.title || 'Unknown Title',
                    shortDescription: videoDetails.shortDescription || '',
                    lengthSeconds: videoDetails.lengthSeconds || '0',
                    keywords: videoDetails.keywords || [],
                    channelId: videoDetails.channelId || '',
                    author: videoDetails.author || 'Unknown Author',
                    viewCount: parseInt(videoDetails.viewCount) || 0,
                    isOwnerViewing: videoDetails.isOwnerViewing || false,
                    isCrawlable: videoDetails.isCrawlable || false,
                    durationFormatted: formatSeconds(parseInt(videoDetails.lengthSeconds) || 0), 
                    thumbnail: highestThumbnail ? highestThumbnail.url : `https://img.youtube.com/vi/${video_id}/maxresdefault.jpg`,
                    thumbnails: thumbnails,
                    publishDate: videoInfo.player_response?.microformat?.playerMicroformatRenderer?.publishDate || null,
                    uploadDate: videoInfo.player_response?.microformat?.playerMicroformatRenderer?.uploadDate || null,
                    category: videoInfo.player_response?.microformat?.playerMicroformatRenderer?.category || null,
                    format
                }
                resolve(response)
            }).catch((err) => {
                console.error('ytdl.getInfo error:', err.message)
                
                let errorMessage = 'There was an error retrieving the video information.'
                
                if (err.message.includes('Status code: 410')) {
                    errorMessage = 'This video is unavailable (possibly age-restricted or deleted).'
                } else if (err.message.includes('not a bot')) {
                    errorMessage = 'YouTube is blocking requests. Try again later or use a different video.'
                } else if (err.message.includes('Video unavailable')) {
                    errorMessage = 'This video is not available (private, deleted, or region-blocked).'
                } else if (err.message.includes('timeout')) {
                    errorMessage = 'Request timed out. Please try again.'
                }
                
                response.error = errorMessage
                reject(response)
            })
        } catch (err) {
            console.error(`API getYoutubeVideoInfo - ${err.message}`)
            reject({ 
                error: `Server error: ${err.message}. Please try using a direct YouTube URL.` 
            })
        }
    })
}

// Simplified related videos function
export const getRelatedVideos = async (videoId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // For Heroku compatibility, we'll provide a basic implementation
            // that doesn't rely heavily on youtube-sr
            let response = { result: [] }
            
            console.log('Getting related videos for:', videoId)
            
            try {
                // Try to get video info first
                const { result: videoInfo } = await getYoutubeVideoInfo(`https://youtube.com/watch?v=${videoId}`)
                
                if (!videoInfo) {
                    throw new Error('Could not get video information')
                }

                // Since youtube-sr might not work reliably on Heroku,
                // we'll return an empty array or basic suggestions
                const relatedVideos = []
                
                response.result = relatedVideos
                resolve(response)
                
            } catch (error) {
                console.log('Related videos fetch failed:', error.message)
                // Return empty array instead of failing
                response.result = []
                resolve(response)
            }

        } catch (err) {
            console.error(`API getRelatedVideos - ${err.message}`)
            // Don't reject, just return empty results
            resolve({ result: [] })
        }
    })
}

// Enhanced MP4 download function
export const getYoutubeMP4 = async (text, progressCallback) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = {}
            let videoOutput = getTemporaryPath('mp4')
            
            // Get video info first
            const videoInfoResponse = await getYoutubeVideoInfo(text)
            const videoInfo = videoInfoResponse.result
            
            if (!videoInfo) {
                return reject({ error: "Failed to retrieve video information." })
            }

            console.log('Downloading video:', videoInfo.title)

            // Enhanced download options for Heroku
            const downloadOptions = {
                format: videoInfo.format,
                agent: yt_agent,
                requestOptions: {
                    timeout: 60000, // Increased timeout for Heroku
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            }

            let videoStream = ytdl(videoInfo.videoId, downloadOptions)
            let totalSize = 0
            let downloadedSize = 0

            // Enhanced progress tracking
            videoStream.on('response', (response) => {
                totalSize = parseInt(response.headers['content-length']) || 0
                console.log('Download started, total size:', totalSize)
            })

            videoStream.on('data', (chunk) => {
                downloadedSize += chunk.length
                if (totalSize > 0 && progressCallback) {
                    const progress = Math.round((downloadedSize / totalSize) * 100)
                    progressCallback(progress)
                }
            })

            const writeStream = fs.createWriteStream(videoOutput)
            videoStream.pipe(writeStream)

            videoStream.on("end", () => {
                console.log('Download completed')
                try {
                    let videoBuffer = fs.readFileSync(videoOutput)
                    fs.unlinkSync(videoOutput)
                    response.result = videoBuffer
                    resolve(response)
                } catch (fileError) {
                    console.error('File read error:', fileError.message)
                    reject({ error: "Error reading downloaded file." })
                }
            })

            videoStream.on('error', (error) => {
                console.error('Video download error:', error.message)
                
                // Clean up file if it exists
                if (fs.existsSync(videoOutput)) {
                    fs.unlinkSync(videoOutput)
                }
                
                let errorMessage = "Server error while downloading the YouTube video."
                if (error.message.includes('403')) {
                    errorMessage = "Access denied. The video might be restricted."
                } else if (error.message.includes('404')) {
                    errorMessage = "Video not found."
                }
                
                response.error = errorMessage
                reject(response)
            })

        } catch (err) {
            console.error(`API getYoutubeMP4 - ${err.message}`)
            reject({ error: `Download error: ${err.message}` })
        }
    })
}

// Enhanced MP3 conversion function
export const getYoutubeMP3 = async (text, progressCallback) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Starting MP3 conversion for:', text)
            
            // Wrap progress callback to show download vs conversion progress
            const downloadProgressCallback = progressCallback ? 
                (progress) => progressCallback(Math.round(progress * 0.7)) : null // 70% for download
            
            let response = {}
            const { result: videoBuffer } = await getYoutubeMP4(text, downloadProgressCallback)
            
            if (progressCallback) progressCallback(70) // Download complete, starting conversion
            
            const { result: audioBuffer } = await convertMp4ToMp3(videoBuffer)
            
            if (progressCallback) progressCallback(100) // Conversion complete
            
            response.result = audioBuffer
            resolve(response)
        } catch (err) {
            console.error(`API getYoutubeMP3 - ${err.message}`)
            reject({ error: `MP3 conversion error: ${err.message}` })
        }
    })
}
