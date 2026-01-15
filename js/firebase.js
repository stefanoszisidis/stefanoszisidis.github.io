// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, runTransaction, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6FvRcQGf29BEvuTlzTB8qBZL1OYu5r_4",
  authDomain: "runthecode-web.firebaseapp.com",
  projectId: "runthecode-web",
  storageBucket: "runthecode-web.firebasestorage.app",
  messagingSenderId: "280047508385",
  appId: "1:280047508385:web:78828a08c2e2f7b75789e0",
  databaseURL: "https://runthecode-web-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * Increment global visitor counter
 * Should be called once per session (or page load)
 */
export function initVisitorCounter(elementId) {
  const visitorsRef = ref(db, 'stats/visitors');

  // Listen for updates
  onValue(visitorsRef, (snapshot) => {
    const count = snapshot.val() || 0;
    const el = document.getElementById(elementId);
    if (el) el.innerText = count.toLocaleString();
  });

  // Increment counter (simple implementation, increments on every load)
  // In a real app, you might check localStorage to only increment unique sessions
  const sessionKey = 'rtc_visited';
  if (!sessionStorage.getItem(sessionKey)) {
    runTransaction(visitorsRef, (currentScore) => {
      return (currentScore || 0) + 1;
    });
    sessionStorage.setItem(sessionKey, 'true');
  }
}

/**
 * Increment play counter for a specific playlist
 * @param {string} playlistName 
 */
export function trackPlay(playlistName) {
  if (!playlistName) return;

  // Sanitize playlist name for Firebase path (no ., #, $, [, ])
  const safeName = playlistName.replace(/[.#$[\]]/g, '_');

  // Increment total plays
  const totalPlaysRef = ref(db, 'stats/total_plays');
  runTransaction(totalPlaysRef, (count) => (count || 0) + 1);

  // Increment playlist specific plays
  const playlistRef = ref(db, `stats/playlists/${safeName}`);
  runTransaction(playlistRef, (data) => {
    if (!data) return { name: playlistName, plays: 1 };
    data.plays = (data.plays || 0) + 1;
    data.name = playlistName; // Ensure name is stored
    return data;
  });
}

/**
 * Initialize Music Stats UI
 */
export function initMusicStats() {
  // Total Plays Listener
  const totalPlaysRef = ref(db, 'stats/total_plays');
  onValue(totalPlaysRef, (snapshot) => {
    const count = snapshot.val() || 0;
    const el = document.getElementById('total-plays-count');
    if (el) el.innerText = count.toLocaleString();
  });

  // Top Playlists Listener
  const playlistsRef = query(ref(db, 'stats/playlists'), orderByChild('plays'), limitToLast(3));
  onValue(playlistsRef, (snapshot) => {
    const topList = [];
    snapshot.forEach((child) => {
      topList.push(child.val());
    });

    // Firebase returns ascending order, so reverse it
    topList.reverse();

    const container = document.getElementById('top-playlists-list');
    if (container) {
      container.innerHTML = topList.map((item, index) => `
        <li class="stat-item clickable" onclick="if(window.playPlaylistByName) window.playPlaylistByName('${item.name.replace(/'/g, "\\'")}')">
          <span class="stat-rank">#${index + 1}</span>
          <span class="stat-name">${item.name}</span>
          <span class="stat-value">${item.plays} plays</span>
        </li>
      `).join('');
    }
  });
}
