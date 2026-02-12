/**
 * YouTube Playlist Sync Script
 * 
 * This script reads playlists.json, fetches the latest video titles
 * from each YouTube playlist using yt-dlp, and updates the tracks arrays.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLAYLISTS_PATH = path.join(__dirname, '..', 'data', 'playlists.json');
const COMPILATIONS_PATH = path.join(__dirname, '..', 'data', 'compilations.json');

/**
 * Fetch video titles from a YouTube playlist using yt-dlp
 * @param {string} playlistId - The YouTube playlist ID
 * @returns {string[]} Array of video titles
 */
function fetchPlaylistTracks(playlistId) {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    
    try {
        console.log(`  Fetching playlist: ${playlistId}`);
        
        // Use yt-dlp to get video titles
        // --flat-playlist: Don't download videos, just list them
        // --print title: Print only the title
        // --ignore-errors: Skip unavailable videos
        const output = execSync(
            `yt-dlp --flat-playlist --print title --ignore-errors "${playlistUrl}"`,
            { 
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large playlists
                timeout: 120000 // 2 minute timeout per playlist
            }
        );
        
        const titles = output
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        console.log(`  Found ${titles.length} tracks`);
        return titles;
        
    } catch (error) {
        console.error(`  Error fetching playlist ${playlistId}:`, error.message);
        return null; // Return null to indicate failure (preserve existing data)
    }
}

/**
 * Recursively process playlist objects and update tracks
 * @param {object} obj - The playlist object to process
 * @param {string} pathStr - Current path for logging
 */
function processPlaylists(obj, pathStr = '') {
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        const currentPath = pathStr ? `${pathStr}.${key}` : key;
        
        // Check if this is a playlist entry (has 'id' and 'tracks' properties)
        if (value && typeof value === 'object' && value.id && Array.isArray(value.tracks)) {
            console.log(`Processing: ${currentPath}`);
            
            const newTracks = fetchPlaylistTracks(value.id);
            
            if (newTracks !== null && newTracks.length > 0) {
                // Update tracks only if we successfully fetched new ones
                const oldCount = value.tracks.length;
                value.tracks = newTracks;
                
                if (newTracks.length !== oldCount) {
                    console.log(`  Updated: ${oldCount} → ${newTracks.length} tracks`);
                } else {
                    console.log(`  Track count unchanged: ${newTracks.length}`);
                }
            } else if (newTracks !== null && newTracks.length === 0) {
                console.log(`  Warning: Playlist appears empty, keeping existing tracks`);
            } else {
                console.log(`  Keeping existing ${value.tracks.length} tracks (fetch failed)`);
            }
        } else if (value && typeof value === 'object') {
            // Recurse into nested objects
            processPlaylists(value, currentPath);
        }
    }
}

/**
 * Sync a single JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {string[]} rootKeys - Root keys to process
 */
function syncFile(filePath, rootKeys) {
    console.log(`\nReading: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found: ${filePath}`);
        return;
    }

    let data;
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(content);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return;
    }

    for (const key of rootKeys) {
        if (data[key]) {
            console.log(`\n--- ${key} ---`);
            processPlaylists(data[key], key);
        }
    }

    console.log(`\nWriting updated ${filePath}...`);
    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2) + '\n',
            'utf-8'
        );
        console.log('Done!');
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
    }
}

/**
 * Main function
 */
function main() {
    console.log('=== YouTube Playlist Sync ===\n');
    
    // Sync playlists.json
    syncFile(PLAYLISTS_PATH, ['quarterly', 'genres']);
    
    // Sync compilations.json
    syncFile(COMPILATIONS_PATH, ['compilations']);
}

main();
