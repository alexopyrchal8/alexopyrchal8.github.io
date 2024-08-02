const clientId = "16d807650a134e54ae7cf5830863ab50"; // Replace with your actual client ID
const redirectUri = "https://alexopyrchal8.github.io/index.html"; // Update this with your actual redirect URI

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

getAccessToken(clientId, code);

async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    localStorage.setItem("access_token", access_token);
    window.location.href = "app.html";
}