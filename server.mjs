import dotenv from 'dotenv';
import fetch from 'node-fetch';
import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';

const app = express();
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./queries.db', (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(
            `CREATE TABLE IF NOT EXISTS queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            (tableErr) => {
                if (tableErr) {
                    console.error('Failed to create table:', tableErr.message);
                } else {
                    console.log('Table "queries" is ready.');
                }
            }
        );
    }
});

// Save query to database
app.post('/api/save-query', (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    db.run('INSERT INTO queries (query) VALUES (?)', [query], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to save query' });
        }
        res.status(200).json({ message: 'Query saved successfully' });
    });
});

// Fetch results from external APIs
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

// Check if the database is running
app.get('/api/check-db', (req, res) => {
    db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="queries"', (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (row) {
            res.status(200).json({ message: 'Database is running and table exists.' });
        } else {
            res.status(404).json({ message: 'Table "queries" does not exist.' });
        }
    });
});

// Health check for the server
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
