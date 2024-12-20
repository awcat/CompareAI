require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

const queries = []; // Temporary storage; replace with a database later

// Save query
app.post('/api/save-query', (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }
    queries.push({ query, timestamp: new Date() });
    res.status(200).json({ message: 'Query saved successfully' });
});

// Get results
app.post('/api/get-results', async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const [openAIResponse, huggingFaceResponse] = await Promise.all([
            fetch('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'text-davinci-003',
                    prompt: query,
                    max_tokens: 50
                })
            }),
            fetch('https://api-inference.huggingface.co/models/gpt2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: query })
            })
        ]);

        const openAIData = await openAIResponse.json();
        const huggingFaceData = await huggingFaceResponse.json();

        res.status(200).json({
            result1: openAIData.choices?.[0]?.text || 'No data available',
            result2: huggingFaceData.generated_text || 'No data available',
            result3: `Summary: ${openAIData.choices?.[0]?.text || 'Not available'}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
