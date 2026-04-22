/**
 * YouTube Playlist Sync Script (API Version)
 * 
 * This script reads playlists.json, fetches the latest video titles
 * from each YouTube playlist using the official YouTube Data API v3.
 */

const fs = require('fs');
const path = require('path');

const PLAYLISTS_PATH = path.join(__dirname, '..', 'data', 'playlists.json');
const COMPILATIONS_PATH = path.join(__dirname, '..', 'data', 'compilations.json');
const API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Fetch video titles from a YouTube playlist using the official API
 * @param {string} playlistId - The YouTube playlist ID
 * @returns {Promise<string[]>} Array of video titles
 */
async function fetchPlaylistTracks(playlistId) {
    if (!API_KEY) {
        throw new Error('YOUTUBE_API_KEY environment variable is not set');
    }

    let allTitles = [];
    let nextPageToken = '';
    
    try {
        console.log(`  Fetching playlist: ${playlistId}`);
        
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            
            const response = await fetch(url);
            const data = await response.json();
            console.log(`DEBUG: API Response for ${playlistId}:`, JSON.stringify(data).substring(0, 100));

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.items) {
                const titles = data.items.map(item => item.snippet.title);
                allTitles = allTitles.concat(titles);
            }

            nextPageToken = data.nextPageToken;
        } while (nextPageToken);

        console.log(`  Found ${allTitles.length} tracks`);
        return allTitles;

    // } catch (error) {
    //     console.error(`  Error fetching playlist ${playlistId}:`, error.message);
    //     return null; // Return null to indicate failure (preserve existing data)
    // }

    } catch (error) {
    console.error(`  ❌ Error fetching playlist ${playlistId}:`, error.message);
    throw error; // This will make the GitHub Action actually turn RED so you know it failed
}
}

/**
 * Recursively process playlist objects and update tracks
 * @param {object} obj - The playlist object to process
 * @param {string} pathStr - Current path for logging
 */
async function processPlaylists(obj, pathStr = '') {
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        const currentPath = pathStr ? `${pathStr}.${key}` : key;
        
        if (value && typeof value === 'object' && value.id && Array.isArray(value.tracks)) {
            console.log(`Processing: ${currentPath}`);
            
            const newTracks = await fetchPlaylistTracks(value.id);
            
            if (newTracks !== null && newTracks.length > 0) {
                const oldCount = value.tracks.length;
                value.tracks = newTracks;
                console.log(`  Updated: ${oldCount} → ${newTracks.length} tracks`);
            } else if (newTracks !== null && newTracks.length === 0) {
                console.log(`  Warning: Playlist appears empty on YouTube, keeping existing data.`);
            } else {
                console.log(`  Keeping existing ${value.tracks.length} tracks (API fetch failed)`);
            }
        } else if (value && typeof value === 'object') {
            await processPlaylists(value, currentPath);
        }
    }
}

/**
 * Sync a single JSON file
 */
async function syncFile(filePath, rootKeys) {
    const dir = path.dirname(filePath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}
    
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
            await processPlaylists(data[key], key);
        }
    }

    console.log(`\nWriting updated ${filePath}...`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
        console.log('Done!');
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
    }
}

async function main() {
    console.log('=== YouTube API Playlist Sync ===\n');
    if (!API_KEY) {
        console.error('ERROR: YOUTUBE_API_KEY environment variable is missing.');
        process.exit(1);
    }
    
    await syncFile(PLAYLISTS_PATH, ['quarterly', 'genres']);
    await syncFile(COMPILATIONS_PATH, ['compilations']);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
