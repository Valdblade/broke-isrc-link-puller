import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to parse JSON and URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Store the path of the generated .txt file
let filePath = path.join(__dirname, 'public', 'dsp-links.txt');

// List of DSPs
const dspList = [
  "amazon", "amazonMusic", "anghami", "appleMusic", "audiomack", "audius", "awa",
  "bandcamp", "boomplay", "deezer", "flo", "gaana", "iHeartRadio", "instagram",
  "jioSaavn", "joox", "kkbox", "lineMusic", "napster", "netease", "pandora",
  "qobuz", "qqMusic", "sevenDigital", "shazam", "soundcloud", "spotify", "tidal",
  "tiktok", "tiktokMusic", "trebel", "wynkMusic", "yandex", "youtube", "youtubeMusic"
];
const services = dspList.join(',');

// Helper function to fetch data from the MusicFetch API
async function fetchData(url, token) {
  const options = {
    method: 'GET',
    headers: {
      'x-token': token
    }
  };
  const response = await fetch(url, options);
  return response.json();
}

// API route to fetch DSP links and generate a .txt file for ISRC or Spotify URL
app.post('/fetch-links', async (req, res) => {
  const { isrc, spotifyUrl } = req.body;
  const token = process.env.MUSICFETCH_TOKEN;
  let url;
  let isrcData = {};
  let upcData = {};

  try {
    if (isrc) {
      // ISRC API endpoint
      url = `https://api.musicfetch.io/isrc?isrc=${isrc}&services=${services}`;
      isrcData = await fetchData(url, token);
    } else if (spotifyUrl) {
      if (spotifyUrl.includes("/track/")) {
        // If it's a track link, fetch ISRC
        url = `https://api.musicfetch.io/url?url=${encodeURIComponent(spotifyUrl)}&services=${services}`;
        isrcData = await fetchData(url, token);

        // If album information is available, fetch album data for UPC
        const albumUrl = isrcData.result?.album?.url;
        if (albumUrl) {
          const albumApiUrl = `https://api.musicfetch.io/url?url=${encodeURIComponent(albumUrl)}&services=${services}`;
          upcData = await fetchData(albumApiUrl, token);
        }
      } else if (spotifyUrl.includes("/album/")) {
        // If it's an album link, fetch UPC
        url = `https://api.musicfetch.io/url?url=${encodeURIComponent(spotifyUrl)}&services=${services}`;
        upcData = await fetchData(url, token);

        // If a highlighted track is specified, fetch ISRC for that track
        const trackHighlight = spotifyUrl.match(/highlight=spotify:track:(\w+)/);
        if (trackHighlight) {
          const trackUrl = `https://open.spotify.com/track/${trackHighlight[1]}`;
          const trackApiUrl = `https://api.musicfetch.io/url?url=${encodeURIComponent(trackUrl)}&services=${services}`;
          isrcData = await fetchData(trackApiUrl, token);
        }
      }
    }

    // Consolidate results
    const trackInfo = isrcData.result || upcData.result || {};
    const links = trackInfo.services || {};
    const trackName = trackInfo.name || 'Unknown Track';
    const artist = trackInfo.artists ? trackInfo.artists[0].name : 'Unknown Artist';
    const image = trackInfo.image ? trackInfo.image.url : '';
    const previewUrl = trackInfo.previewUrl || '';
    const fullTrackUrl = trackInfo.fullTrackUrl || '';
    const duration = trackInfo.duration || 0;
    const upc = upcData.result?.upc || 'N/A';
    const isrcCode = isrcData.result?.isrc || isrc || 'N/A';

    // Prepare .txt output
    let output = `${isrc ? `ISRC: ${isrc}` : `Spotify URL: ${spotifyUrl}`}\n\nDSP Links:\n`;
    for (const [service, serviceDetails] of Object.entries(links)) {
      if (serviceDetails.link) {
        output += `${service}: ${serviceDetails.link}\n`;
      }
    }
    fs.writeFileSync(filePath, output, 'utf8');

    // Send JSON response with all details
    res.json({
      trackName,
      artist,
      image,
      links,
      previewUrl,
      fullTrackUrl,
      duration,
      upc,
      isrc: isrcCode,
      message: 'Links fetched successfully'
    });
  } catch (error) {
    console.error("Error fetching DSP links:", error.message);
    res.status(500).json({ message: "Failed to fetch DSP links." });
  }
});

// Endpoint to download the .txt file
app.get('/download-links', (req, res) => {
  if (filePath) {
    res.download(filePath, 'dsp-links.txt', (err) => {
      if (err) {
        console.error("File download error:", err);
        res.status(500).send("Error downloading file.");
      }
    });
  } else {
    res.status(404).send("No file available for download.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
