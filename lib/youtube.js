// lib/youtube.js - Heroku Compatible with Better Bot Detection Avoidance

import fs from 'fs-extra'
import { getTemporaryPath, formatSeconds } from './util.js'
import { convertMp4ToMp3 } from './video.js'
import ytdl from '@distube/ytdl-core'
import axios from 'axios'

// Remove youtube-sr dependency for Heroku - it's causing issues
// We'll use alternative search methods or require direct URLs

// Enhanced cookie and agent setup to avoid bot detection
const createEnhancedAgent = () => {
    const cookies = [
        'CONSENT=YES+cb.20210328-17-p0.en+FX+{consent_version}',
        'GPS=1',
        'YSC=' + Math.random().toString(36).substring(2, 15),
        'VISITOR_INFO1_LIVE=' + Math.random().toString(36).substring(2, 15),
        'VISITOR_PRIVACY_METADATA=CgJVUxIEGgAgXg%3D%3D',
        'PREF=f6=40000000&tz=America.New_York&f1=50000000',
        '_gcl_au=' + Math.random().toString(36).substring(2, 15)
    ];
    
    return ytdl.createAgent(cookies.map(cookie => ({ 
        name: 'session', 
        value: cookie 
    })), {
        localAddress: undefined,
        family: 4,
        timeout: 30000
    });
};

const yt_agent = createEnhancedAgent();

// Alternative search using regex to extract video ID from various YouTube URL formats
const extractVideoId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// Simple YouTube search using YouTube's suggest API (doesn't require API key)
const searchYouTube = async (query) => {
    try {
        console.log('🔍 Searching YouTube for:', query);
        
        // Use YouTube's autocomplete/suggest API to find videos
        const searchUrl = `http://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        });

        // This is a basic search - for production, consider using YouTube Data API v3
        // For now, we'll ask users to provide direct URLs
        throw new Error('Search functionality requires direct YouTube URLs. Please provide a YouTube link instead of search terms.');

    } catch (error) {
        throw new Error(`YouTube search unavailable on this server. Please provide a direct YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID)`);
    }
};

// Enhanced video info function with better bot detection avoidance
export const getYoutubeVideoInfo = async (text) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = {}, video_id = '';

            console.log('🔍 Processing:', text);

            // First try to extract video ID directly
            video_id = extractVideoId(text);
            
            if (!video_id && ytdl.validateURL(text)) {
                video_id = ytdl.getVideoID(text);
            }

            if (!video_id) {
                // If not a URL, try search
                try {
                    await searchYouTube(text);
                } catch (searchError) {
                    return reject({ error: searchError.message });
                }
            }

            if (!video_id) {
                return reject({ 
                    error: 'Please provide a valid YouTube URL. Search by title is not available on this server.' 
                });
            }

            console.log('📺 Getting video info for ID:', video_id);

            // Enhanced options to avoid bot detection
            const ytdlOptions = {
                playerClients: ['WEB', 'ANDROID', 'IOS'],
                agent: yt_agent,
                requestOptions: {
                    timeout: 45000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Origin': 'https://www.youtube.com',
                        'Referer': 'https://www.youtube.com/',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }
            };

            // Add random delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

            ytdl.getInfo(video_id, ytdlOptions).then(videoInfo => {
                console.log('✅ Video info retrieved successfully');
                
                try {
                    const formats = ytdl.filterFormats(videoInfo.formats, "videoandaudio");
                    const format = ytdl.chooseFormat(formats, { quality: 'highest' });

                    const videoDetails = videoInfo.player_response?.videoDetails || videoInfo.videoDetails || {};
                    const thumbnails = videoDetails.thumbnail?.thumbnails || [];
                    const highestThumbnail = thumbnails.length > 0 ? 
                        thumbnails.reduce((prev, current) =>
                            ((prev.width || 0) * (prev.height || 0) > (current.width || 0) * (current.height || 0)) ? prev : current
                        ) : null;

                    response.result = {
                        videoId: videoDetails.videoId || video_id,
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
                    };
                    resolve(response);
                } catch (parseError) {
                    console.error('Error parsing video info:', parseError.message);
                    reject({ error: 'Error parsing video information.' });
                }
            }).catch((err) => {
                console.error('ytdl.getInfo error:', err.message);
                
                let errorMessage = 'Unable to retrieve video information.';
                
                if (err.message.includes('Sign in to confirm')) {
                    errorMessage = '🤖 YouTube is blocking requests from this server. This is common on shared hosting. Try again in a few minutes, or consider upgrading to a dedicated server.';
                } else if (err.message.includes('410') || err.message.includes('Video unavailable')) {
                    errorMessage = 'This video is unavailable (possibly age-restricted, private, or deleted).';
                } else if (err.message.includes('403')) {
                    errorMessage = 'Access denied to this video (possibly region-restricted).';
                } else if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
                    errorMessage = 'Request timed out. The server may be under heavy load.';
                } else if (err.message.includes('429')) {
                    errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
                }
                
                response.error = errorMessage;
                reject(response);
            });
        } catch (err) {
            console.error(`API getYoutubeVideoInfo - ${err.message}`);
            reject({ 
                error: `Server error: ${err.message}` 
            });
        }
    });
};

// Simplified related videos - disabled for Heroku compatibility
export const getRelatedVideos = async (videoId) => {
    return new Promise((resolve) => {
        console.log('Related videos feature disabled on this server for stability.');
        resolve({ result: [] });
    });
};

// Enhanced download with retry mechanism
export const getYoutubeMP4 = async (text, progressCallback, retryCount = 0) => {
    const maxRetries = 2;
    
    return new Promise(async (resolve, reject) => {
        try {
            let response = {};
            let videoOutput = getTemporaryPath('mp4');
            
            const videoInfoResponse = await getYoutubeVideoInfo(text);
            const videoInfo = videoInfoResponse.result;
            
            if (!videoInfo || !videoInfo.format) {
                return reject({ error: "Failed to retrieve video information or no suitable format found." });
            }

            console.log('📥 Downloading:', videoInfo.title);

            const downloadOptions = {
                format: videoInfo.format,
                agent: yt_agent,
                requestOptions: {
                    timeout: 120000, // 2 minutes timeout for Heroku
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Origin': 'https://www.youtube.com',
                        'Referer': 'https://www.youtube.com/',
                        'DNT': '1',
                        'Connection': 'keep-alive'
                    }
                }
            };

            // Add delay before download
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

            let videoStream = ytdl(videoInfo.videoId, downloadOptions);
            let totalSize = 0;
            let downloadedSize = 0;
            let hasStarted = false;

            const timeout = setTimeout(() => {
                if (!hasStarted) {
                    videoStream.destroy();
                    if (fs.existsSync(videoOutput)) {
                        fs.unlinkSync(videoOutput);
                    }
                    reject({ error: 'Download timeout - video took too long to start.' });
                }
            }, 60000); // 1 minute to start

            videoStream.on('response', (response) => {
                hasStarted = true;
                clearTimeout(timeout);
                totalSize = parseInt(response.headers['content-length']) || 0;
                console.log('📥 Download started, size:', totalSize);
            });

            videoStream.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize > 0 && progressCallback) {
                    const progress = Math.round((downloadedSize / totalSize) * 100);
                    progressCallback(progress);
                }
            });

            const writeStream = fs.createWriteStream(videoOutput);
            videoStream.pipe(writeStream);

            videoStream.on('end', () => {
                console.log('✅ Download completed');
                clearTimeout(timeout);
                try {
                    if (fs.existsSync(videoOutput)) {
                        const videoBuffer = fs.readFileSync(videoOutput);
                        fs.unlinkSync(videoOutput);
                        response.result = videoBuffer;
                        resolve(response);
                    } else {
                        reject({ error: 'Downloaded file not found.' });
                    }
                } catch (fileError) {
                    console.error('File read error:', fileError.message);
                    reject({ error: 'Error reading downloaded file.' });
                }
            });

            videoStream.on('error', async (error) => {
                console.error('Download error:', error.message);
                clearTimeout(timeout);
                
                if (fs.existsSync(videoOutput)) {
                    fs.unlinkSync(videoOutput);
                }
                
                // Retry logic for certain errors
                if (retryCount < maxRetries && (
                    error.message.includes('timeout') || 
                    error.message.includes('ECONNRESET') ||
                    error.message.includes('socket hang up')
                )) {
                    console.log(`Retrying download (${retryCount + 1}/${maxRetries})...`);
                    setTimeout(() => {
                        getYoutubeMP4(text, progressCallback, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, (retryCount + 1) * 3000); // Exponential backoff
                    return;
                }
                
                let errorMessage = 'Failed to download video.';
                if (error.message.includes('Sign in to confirm')) {
                    errorMessage = '🤖 YouTube blocked the download. Server IP may be flagged. Try again later.';
                } else if (error.message.includes('403')) {
                    errorMessage = 'Access denied - video may be restricted or unavailable.';
                } else if (error.message.includes('404')) {
                    errorMessage = 'Video not found or has been removed.';
                }
                
                reject({ error: errorMessage });
            });

        } catch (err) {
            console.error(`API getYoutubeMP4 - ${err.message}`);
            reject({ error: `Download preparation failed: ${err.message}` });
        }
    });
};

// Enhanced MP3 function
export const getYoutubeMP3 = async (text, progressCallback) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('🎵 Converting to MP3:', text);
            
            const downloadProgress = progressCallback ? 
                (progress) => progressCallback(Math.round(progress * 0.8)) : null;
            
            const { result: videoBuffer } = await getYoutubeMP4(text, downloadProgress);
            
            if (progressCallback) progressCallback(80);
            console.log('🔄 Converting video to audio...');
            
            const { result: audioBuffer } = await convertMp4ToMp3(videoBuffer);
            
            if (progressCallback) progressCallback(100);
            console.log('✅ MP3 conversion completed');
            
            resolve({ result: audioBuffer });
        } catch (err) {
            console.error(`API getYoutubeMP3 - ${err.message}`);
            reject({ error: `MP3 conversion failed: ${err.message}` });
        }
    });
};
