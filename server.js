const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

const YOUTUBE_API_KEY = 'AIzaSyABtLDcJdC0rhGEQrSwD6_6QRPNh6bFSDU'; // Replace with your API key

app.use(express.static('public'));

app.get('/api/youtube/search', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch YouTube data' });
    }
});

app.get('/api/youtube/suggestions', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        const suggestions = data.items.map(item => item.snippet.title);
        res.json(suggestions);
    } catch (error) {
        console.error('Suggestions API error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));