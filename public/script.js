document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('fetch-form');
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
    const upcDisplay = document.getElementById('track-upc');
    const isrcDisplay = document.getElementById('track-isrc');

    // Helper function to format DSP platform names
    function formatPlatformName(platform) {
        return platform
            .replace(/([a-z])([A-Z])/g, '$1 $2')  // Insert space before uppercase letters
            .replace(/\b\w/g, char => char.toUpperCase());  // Capitalize first letter of each word
    }

    // Load search history on page load
    loadSearchHistory();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const isrc = document.getElementById('isrc').value.trim();
        const spotifyUrl = document.getElementById('spotify-url').value.trim();
        const query = isrc ? { isrc } : { spotifyUrl };

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
                body: JSON.stringify(query)
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

                    // Display UPC and ISRC
                    upcDisplay.textContent = result.upc || 'N/A';
                    isrcDisplay.textContent = result.isrc || 'N/A';

                    // Display links per platform with formatted names
                    if (result.links && Object.keys(result.links).length > 0) {
                        for (const [platform, serviceDetails] of Object.entries(result.links)) {
                            if (serviceDetails && serviceDetails.link) {
                                const listItem = document.createElement('li');
                                const formattedPlatform = formatPlatformName(platform);
                                listItem.innerHTML = `<a href="${serviceDetails.link}" target="_blank"><strong>${formattedPlatform}</strong></a>`;
                                linkList.appendChild(listItem);
                            }
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
                    saveSearchToHistory(isrc || spotifyUrl, result.trackName);

                    // Scroll back to the top of the page
                    scrollToTop();
                }
            } else {
                feedback.textContent = 'Failed to fetch DSP links. Please check the ISRC or Spotify URL.';
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
    function saveSearchToHistory(identifier, trackName) {
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        searchHistory.push({ identifier, trackName });
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        loadSearchHistory();
    }

    // Load and display the search history from local storage
    function loadSearchHistory() {
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        searchHistoryList.innerHTML = '';

        searchHistory.forEach((entry) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${entry.trackName} (${entry.identifier})`;
            listItem.addEventListener('click', () => {
                if (entry.identifier.startsWith('https://')) {
                    document.getElementById('spotify-url').value = entry.identifier;
                } else {
                    document.getElementById('isrc').value = entry.identifier;
                }
                form.dispatchEvent(new Event('submit'));
            });
            searchHistoryList.appendChild(listItem);
        });
    }

    // Function to scroll the page to the top
    function scrollToTop() {
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
