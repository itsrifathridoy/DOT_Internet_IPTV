const fs = require('fs');
const http = require('http');  // Use 'https' if your link starts with 'https://'

// Function to generate token
function tokenGenerate() {
    const testUrl = "http://172.16.172.236/player.php?stream=bk/1";
    
    return new Promise((resolve, reject) => {
        http.get(testUrl, (res) => {
            if (res.statusCode === 302) { // 302 Found status code for redirection
                const location = res.headers.location;
                const token = location.split("&").find(param => param.startsWith("token=")).split("token=")[1];
                resolve(token);
            } else {
                reject(new Error('Failed to get redirect, status code: ' + res.statusCode));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Function to check if the link is working
function checkLink(liveLink) {
    return new Promise((resolve) => {
        http.get(liveLink, (res) => {
            if (res.statusCode === 200) {
                resolve(true); // Link is working
            } else {
                resolve(false); // Link is not working
            }
        }).on('error', () => {
            resolve(false); // Link is not working
        });
    });
}

// Main function
(async () => {
    try {
        const token = await tokenGenerate();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Initial delay

        const link = "http://172.16.172.236:8080/roarzone/bk/";
        const m3u = "#EXTINF:-1, Channel ";

        let playlistContent = "";
        const checkPromises = [];
        const channelStatuses = []; // Array to hold channel status information

        console.log(token);

        for (let i = 1; i < 200; i++) {
            const liveLink = `${link}${i}/tracks-v1a1/mono.m3u8?token=${token}`;
            
            // Create a promise for each checkLink
            const checkPromise = checkLink(liveLink).then(isWorking => {
                const status = {
                    channel: i,
                    url: liveLink,
                    working: isWorking
                };

                channelStatuses.push(status); // Add the status to the array

                if (isWorking) {
                    playlistContent += `${m3u}${i}\n${liveLink}\n`;
                    console.log(`Channel ${i} is working and added to the playlist.`);
                } else {
                    console.log(`Channel ${i} is not working.`);
                }
            });

            checkPromises.push(checkPromise);
        }

        // Wait for all link checks to complete
        await Promise.all(checkPromises);

        // Sort channelStatuses by channel number
        channelStatuses.sort((a, b) => a.channel - b.channel);

        // Write the playlist to the file
        fs.writeFile('playlist.m3u', playlistContent, (err) => {
            if (err) throw err;
            console.log('Playlist saved as playlist.m3u');
        });

        // Write the JSON file
        fs.writeFile('channelStatuses.json', JSON.stringify(channelStatuses, null, 2), (err) => {
            if (err) throw err;
            console.log('Channel statuses saved as channelStatuses.json');
        });

    } catch (err) {
        console.error('Error generating token:', err);
    }
})();
