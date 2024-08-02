const clientId = "";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
  redirectToAuthCodeFlow(clientId);
} else {
  const accessToken = await getAccessToken(clientId, code);
  console.log("Access Token:", accessToken); // Debug log
  const data = await fetchProfile(accessToken);
  console.log("Fetched Data:", data); // Debug log
  populateUI(data);
}


export async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("scope", "user-read-private user-read-email user-top-read");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}


export async function getAccessToken(clientId, code) {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token) {
  const profileResult = await fetch("https://api.spotify.com/v1/me", {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
  });
  const profile = await profileResult.json();

  const topTracks = await getTopTracks(token);
  const recommendations = await getRecommendations(token, topTracks);

  return { profile, topTracks, recommendations };
}

function populateTrackList(listElement, tracks, title) {
  const headerLi = document.createElement("li");
  headerLi.classList.add("list-header");
  headerLi.textContent = title;
  listElement.appendChild(headerLi);

  tracks.forEach((track, index) => {
      const li = document.createElement("li");
      li.classList.add("track-item");
      li.innerHTML = `
          <span class="track-name">${index + 1}. ${track.name}</span><br>
          <span class="track-artist">by ${track.artists.map(artist => artist.name).join(', ')}</span>
      `;
      listElement.appendChild(li);
  });
}

function populateUI(data) {
  const { profile, topTracks, recommendations } = data;

  // Set user name and ID
  document.getElementById("displayName").innerText = profile.display_name;
  document.getElementById("id").innerText = `User ID: ${profile.id}`;

  // Set current date
  const currentDate = new Date().toLocaleDateString();
  document.getElementById("date").innerText = currentDate;

  // Populate top tracks
  const topTracksList = document.getElementById("topTracksList");
  populateTrackList(topTracksList, topTracks, "Your Top Tracks");

  // Populate recommended tracks
  const recommendedTracksList = document.getElementById("recommendedTracksList");
  populateTrackList(recommendedTracksList, recommendations, "Recommended Tracks");
}

async function fetchWebApi(endpoint, method, token, body = null) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`https://api.spotify.com/${endpoint}`, config);
  return await res.json();
}

async function getTopTracks(token) {
  return (await fetchWebApi(
      'v1/me/top/tracks?time_range=short_term&limit=5', 'GET', token
  )).items;
}

async function getRecommendations(token, topTracks){
  const topTracksIds = topTracks.map(track => track.id);
  return (await fetchWebApi(
      `v1/recommendations?limit=5&seed_tracks=${topTracksIds.join(',')}`, 'GET', token
  )).tracks;
}