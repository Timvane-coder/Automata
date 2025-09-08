//lib/util.js - Convert to ES6 modules

import moment from "moment-timezone"
import crypto from 'node:crypto'
import { tmpdir } from 'node:os'
import path from "node:path"
import fs from 'fs-extra'

// Converts a timestamp to a formatted date and time (DD/MM HH:mm:ss)
export const timestampToDate = (timestampMsg) => {
    return moment(timestampMsg).format('DD/MM HH:mm:ss');
};

// Formats seconds into minutes and seconds (mm:ss)
export const formatSeconds = (seconds) => {
    return moment(seconds * 1000).format('mm:ss');
};

// Returns the current date and time (DD/MM HH:mm:ss)
export const currentDateTime = () => {
    return moment(Date.now()).format('DD/MM HH:mm:ss');
};

// Capitalizes the first letter of a word
export const capitalizeFirstLetter = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
};

// Generates a random name with a given extension
export const getRandomName = (extension) => {
    return `${Math.floor(Math.random() * 10000)}.${extension}`;
};

// Generates a path for a temporary file with a given extension
export const getTemporaryPath = (extension) => {
    const tempDir = path.join(tmpdir(), 'lbot-api-midias');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    return path.join(tempDir, `${crypto.randomBytes(20).toString('hex')}.${extension}`);
};
