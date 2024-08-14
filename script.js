document.addEventListener('DOMContentLoaded', async () => {
    // Function to detect if the browser is Chrome
    function isChrome() {
        // Check if the user agent string contains 'Chrome' but not 'Chromium' or 'Edge'
        return /Chrome/.test(navigator.userAgent) && !/Chromium/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    }

    if(isChrome())
        document.getElementById("switch-player").style.display = "none"

    async function switchPlayer(){
        const channel = document.getElementById('video-source').src.split("bk/")[1].split(/([^\d]*)/)
        const index = channel.indexOf("/tracks-v")
        if(index>=0)
            loadChannel(`http://172.16.172.236/player.php?stream=bk/${channel.slice(0,index).join('')}`);
        else
        {
            const index = channel.join('')
            const channels = await fetchChannelStatuses();
            const url = channels.find(e => e.channel == index).url; // Assuming `channel` is a number or string
            loadChannel(url)
        }
    }
    document.getElementById("switch-player").addEventListener("click",()=>{
        switchPlayer()
    })
    

    // Function to fetch channel statuses from JSON file
    async function fetchChannelStatuses() {
        try {
            // Set the URL based on whether the browser is Chrome
            const url = 'channelStatuses.json';
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch channel statuses');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching channel statuses:', error);
        }
    }

    // Function to create a button for each channel and add it to the nav
    function createChannelButtons(channels) {
        const nav = document.getElementById('channel-nav');
        channels.forEach(channel => {
            if (channel.working) {
                const button = document.createElement('button');
                button.textContent = `Channel ${channel.channel}`;
                const channelUrl = isChrome() ? `http://172.16.172.236/player.php?stream=bk/${channel.channel}`:channel.url
                button.addEventListener('click', () => loadChannel(channelUrl));
                nav.appendChild(button);
            }
        });
    }

    // Function to load a specific channel based on its URL
    function loadChannel(url) {
        const iframe = document.getElementById('video-source');
        iframe.src = url;
    }

    // Main execution
    try {
        const channels = await fetchChannelStatuses();
        createChannelButtons(channels);

        // Optionally, set a default channel if you want
        const firstChannel = channels.find(c => c.working);
        if (firstChannel) {
            loadChannel(isChrome()?`http://172.16.172.236/player.php?stream=bk/${firstChannel.channel}`:firstChannel.url);
        }
    } catch (error) {
        console.error('Error initializing channels:', error);
    }
});
