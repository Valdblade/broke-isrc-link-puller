document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('isrc-form');
    const feedback = document.getElementById('feedback');
    const trackDetails = document.getElementById('track-details');
    const trackName = document.getElementById('track-name');
    const trackArtist = document.getElementById('track-artist');
    const trackImage = document.getElementById('track-image');
    const linkList = document.getElementById('link-list');
    const downloadButton = document.getElementById('download-button');
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const searchHistoryList = document.getElementById('search-history');
  
    // Load search history on page load
    loadSearchHistory();
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const isrc = document.getElementById('isrc').value;
  
      feedback.textContent = 'Fetching data...';
      feedback.classList.remove('hidden');
      trackDetails.classList.add('hidden');
      linkList.innerHTML = ''; // Clear previous links
      audioPlayer.classList.add('hidden');
  
      try {
        const response = await fetch('/fetch-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isrc })
        });
  
        if (response.ok) {
          const result = await response.json();
          feedback.textContent = 'Links fetched successfully!';
          feedback.style.color = 'green';
  
          if (result && result.trackName) {
            // Display track details
            trackName.textContent = result.trackName;
            trackArtist.textContent = result.artist;
            trackImage.src = result.image;
            trackDetails.classList.remove('hidden');
  
            // Display links per platform
            if (result.links && Object.keys(result.links).length > 0) {
              for (const [platform, link] of Object.entries(result.links)) {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${platform}:</strong> <a href="${link}" target="_blank">${link}</a>`;
                linkList.appendChild(listItem);
              }
              downloadButton.classList.remove('hidden');
            }
  
            // Handle audio preview if available
            if (result.previewUrl) {
              audioSource.src = result.previewUrl;
              audioPlayer.load(); // Load the new source
              audioPlayer.classList.remove('hidden'); // Show the player
            } else {
              audioPlayer.classList.add('hidden'); // Hide if no preview available
            }
  
            // Save the search to local storage
            saveSearchToHistory(isrc, result.trackName);
  
            // Scroll back to the top of the page
            scrollToTop();
          }
        } else {
          feedback.textContent = 'Failed to fetch DSP links. Please check the ISRC.';
          feedback.style.color = 'red';
          downloadButton.classList.add('hidden');
        }
      } catch (error) {
        feedback.textContent = 'An error occurred. Please try again later.';
        feedback.style.color = 'red';
        downloadButton.classList.add('hidden');
      }
    });
  
    // Save a search to local storage and update the history display
    function saveSearchToHistory(isrc, trackName) {
      const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
      searchHistory.push({ isrc, trackName });
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      loadSearchHistory();
    }
  
    // Load and display the search history from local storage
    function loadSearchHistory() {
      const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
      searchHistoryList.innerHTML = '';
  
      searchHistory.forEach((entry) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${entry.trackName} (ISRC: ${entry.isrc})`;
        listItem.addEventListener('click', () => {
          document.getElementById('isrc').value = entry.isrc;
          form.dispatchEvent(new Event('submit'));
        });
        searchHistoryList.appendChild(listItem);
      });
    }
  
    // Function to scroll the page to the top
    function scrollToTop() {
      // Scroll to the top smoothly, even if the page is zoomed or viewport is different
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  
    // Event listener for the download button
    downloadButton.addEventListener('click', () => {
      window.location.href = '/download-links';
    });
  });
  