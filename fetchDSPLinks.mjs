// Import `dotenv` and `node-fetch` using ES module syntax
import fetch from 'node-fetch';
import 'dotenv/config'; // Automatically loads .env variables

async function fetchDSPLinks(isrc) {
  const token = process.env.MUSICFETCH_TOKEN; // Access the token from environment variables
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

    // Log the full response for troubleshooting
    console.log("API Response:", JSON.stringify(data, null, 2));

    if (data && data.links && Object.keys(data.links).length > 0) {
      console.log("Fetched DSP Links:");
      for (const [service, link] of Object.entries(data.links)) {
        console.log(`${service}: ${link}`);
      }
    } else {
      console.log("No links found for this ISRC.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example ISRC to test the function
const isrc = 'CA5KR2491719'; // Replace with an actual ISRC if available
fetchDSPLinks(isrc);
