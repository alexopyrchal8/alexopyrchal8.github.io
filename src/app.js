document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const data = await fetchProfileAndTracks(token);
        populateUI(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error (e.g., redirect to login if token is invalid)
    }
});

async function fetchProfileAndTracks(token) {
    const profile = await fetchProfile(token);
    const topTracks = await getTopTracks(token);
    const recommendations = await getRecommendations(token, topTracks);
    return { profile, topTracks, recommendations };
}

async function fetchWebApi(endpoint, method, token, body) {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method,
        body: JSON.stringify(body)
    });
    return await res.json();
}

async function fetchProfile(token) {
    return await fetchWebApi('v1/me', 'GET', token);
}

async function getTopTracks(token) {
    const response = await fetchWebApi(
        'v1/me/top/tracks?time_range=short_term&limit=5', 'GET', token
    );
    return response.items;
}

async function getRecommendations(token, topTracks) {
    const topTracksIds = topTracks.map(track => track.id).join(',');
    const response = await fetchWebApi(
        `v1/recommendations?limit=5&seed_tracks=${topTracksIds}`, 'GET', token
    );
    return response.tracks;
}

function populateUI(data) {
    const { profile, topTracks, recommendations } = data;

    document.getElementById("displayName").innerText = profile.display_name;
    document.getElementById("id").innerText = `User ID: ${profile.id}`;
    document.getElementById("date").innerText = new Date().toLocaleDateString();

    const topTracksList = document.getElementById("topTracksList");
    populateTrackList(topTracksList, topTracks, "Your Top Tracks");

    const recommendedTracksList = document.getElementById("recommendedTracksList");
    populateTrackList(recommendedTracksList, recommendations, "Recommended Tracks");
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