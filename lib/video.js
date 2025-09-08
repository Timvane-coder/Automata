// lib/video.js - Convert to ES6 modules
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs-extra'
import axios from 'axios'
import { getTemporaryPath } from './util.js'

/**
 * Converts MP4 video to MP3 audio
 * @param {Buffer} videoBuffer - Input video as a buffer
 * @returns {Promise<{result?: Buffer, error?: string}>}
 */
export const convertMp4ToMp3 = (videoBuffer) => {
    return new Promise((resolve, reject) => {
        try {
            let response = {}
            let videoPath = getTemporaryPath('mp4')
            fs.writeFileSync(videoPath, videoBuffer)
            let audioOutput = getTemporaryPath('mp3')
            
            ffmpeg(videoPath)
                .outputOptions(['-vn', '-codec:a libmp3lame', '-q:a 3'])
                .save(audioOutput)
                .on('end', () => {
                    let audioBuffer = fs.readFileSync(audioOutput)
                    fs.unlinkSync(videoPath)
                    fs.unlinkSync(audioOutput)
                    response.result = audioBuffer
                    resolve(response)
                })
                .on("error", (err) => {
                    fs.unlinkSync(videoPath)
                    response.error = 'There was an error converting to MP3.'
                    reject(response)
                })
        } catch (err) {
            console.log(`API convertMp4ToMp3 - ${err.message}`)
            reject({ error: "There was an error converting to MP3." })
        }
    })
}

/**
 * Generates a video thumbnail from MP4
 * @param {string | Buffer} media - Input media (file path, buffer, or URL)
 * @param {string} [type="file"] - Media type: "file", "buffer", or "url"
 * @returns {Promise<{result?: string, error?: string}>}
 */
export const getVideoThumbnail = async (media, type = "file") => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = {}
            let inputPath = ''
            let thumbnailOutput = getTemporaryPath('jpg')

            if (type === "file") {
                inputPath = media
            } else if (type === "buffer") {
                inputPath = getTemporaryPath('mp4')
                fs.writeFileSync(inputPath, media)
            } else if (type === "url") {
                let urlResponse = await axios.get(media, { responseType: 'arraybuffer' })
                let bufferUrl = Buffer.from(urlResponse.data, "utf-8")
                inputPath = getTemporaryPath('mp4')
                fs.writeFileSync(inputPath, bufferUrl)
            }

            ffmpeg(inputPath)
                .addOption("-y")
                .inputOptions(["-ss 00:00:00"])
                .outputOptions(["-vf scale=32:-1", "-vframes 1", "-f image2"])
                .save(thumbnailOutput)
                .on('end', () => {
                    if (type !== 'file') fs.unlinkSync(inputPath)
                    let thumbBase64 = fs.readFileSync(thumbnailOutput).toString('base64')
                    fs.unlinkSync(thumbnailOutput)
                    response.result = thumbBase64
                    resolve(response)
                })
                .on('error', (err) => {
                    response.error = 'There was an error obtaining the video thumbnail.'
                    reject(response)
                })
        } catch (err) {
            console.log(`API getVideoThumbnail - ${err.message}`)
            reject({ error: "There was an error obtaining the video thumbnail." })
        }
    })
}
