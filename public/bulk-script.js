document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bulk-isrc-form');
    const feedback = document.getElementById('bulk-feedback');
    const bulkLinksSection = document.getElementById('bulk-links-section');
    const bulkOutput = document.getElementById('bulk-output');
    const downloadCsvButton = document.getElementById('download-csv-button');
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const isrcInput = document.getElementById('bulk-isrc').value;
      const isrcList = isrcInput.split(/[\s,]+/).filter(isrc => isrc.trim() !== '');
  
      if (isrcList.length === 0) {
        feedback.textContent = 'Please enter at least one ISRC.';
        feedback.style.color = 'red';
        feedback.classList.remove('hidden');
        return;
      }
  
      feedback.textContent = 'Fetching data...';
      feedback.style.color = 'white';
      feedback.classList.remove('hidden');
      bulkOutput.textContent = ''; // Clear previous output
      bulkLinksSection.classList.add('hidden');
  
      const results = [];
  
      // Fetching data for each ISRC
      for (let isrc of isrcList) {
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
            if (result && result.trackName) {
              results.push({
                isrc,
                name: result.trackName,
                artist: result.artist,
                links: result.links || {}
              });
            } else {
              results.push({ isrc, error: 'No data found for this ISRC.' });
            }
          } else {
            results.push({ isrc, error: 'Failed to fetch data.' });
          }
        } catch (error) {
          results.push({ isrc, error: 'Error occurred while fetching data.' });
        }
      }
  
      feedback.classList.add('hidden');
      formatResults(results);
    });
  
    function formatResults(results) {
      let csvContent = 'ISRC,Track Name,Artist,Platform,Link\n';
      results.forEach((result) => {
        if (result.error) {
          csvContent += `${result.isrc},Error,${result.error}\n`;
        } else {
          for (const [platform, link] of Object.entries(result.links)) {
            csvContent += `"${result.isrc}","${result.name}","${result.artist}","${platform}","${link}"\n`;
          }
        }
      });
  
      bulkOutput.textContent = csvContent;
      bulkLinksSection.classList.remove('hidden');
  
      downloadCsvButton.removeEventListener('click', downloadCSV);
      downloadCsvButton.addEventListener('click', () => {
        downloadCSV(csvContent);
      });
    }
  
    function downloadCSV(csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'dsp-links.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  });
  