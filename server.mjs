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
app.use(express.static('public'));

// Store the path of the generated .txt file
let filePath = '';

// API route to fetch DSP links and generate a .txt file
app.post('/fetch-links', async (req, res) => {
  const isrc = req.body.isrc;
  const token = process.env.MUSICFETCH_TOKEN;
  const url = `https://api.musicfetch.io/isrc?isrc=${isrc}&services=amazon,amazonMusic,anghami,appleMusic,audiomack,audius,awa,bandcamp,boomplay,deezer,flo,gaana,iHeartRadio,instagram,jioSaavn,joox,kkbox,lineMusic,napster,netease,pandora,qobuz,qqMusic,sevenDigital,shazam,soundcloud,spotify,tidal,tiktok,tiktokMusic,trebel,wynkMusic,yandex,youtube,youtubeMusic`;

  const options = {
    method: 'GET',
    headers: {
      'x-token': token
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.result && data.result.services) {
      // Prepare file content and JSON response
      let output = `ISRC: ${isrc}\n\nDSP Links:\n`;
      const links = {};
      for (const [service, serviceDetails] of Object.entries(data.result.services)) {
        if (serviceDetails.link) {
          output += `${service}: ${serviceDetails.link}\n`;
          links[service] = serviceDetails.link;
        }
      }

      filePath = path.join(__dirname, 'public', 'dsp-links.txt');
      fs.writeFileSync(filePath, output, 'utf8');

      // Send JSON response with additional details and links
      res.json({
        trackName: data.result.name,
        artist: data.result.artists ? data.result.artists[0].name : 'Unknown Artist',
        image: data.result.image ? data.result.image.url : '',
        links,
        previewUrl: data.result.previewUrl || '',
        fullTrackUrl: data.result.fullTrackUrl || '', // Ensure full track URL is provided if available
        duration: data.result.duration || 0, // Track duration in milliseconds if available
        message: 'Links fetched successfully'
      });
    } else {
      res.status(404).json({ message: 'No links found for this ISRC.' });
    }
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
