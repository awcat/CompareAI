async function fetchOpenAIResults(category) {
    const placeholders = ['result-1', 'result-2', 'result-3'];

    placeholders.forEach(id => {
        document.getElementById(id).textContent = "Loading...";
    });

    try {
        const responses = await Promise.all([
            fetch(`https://api.openai.com/v1/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer YOUR_OPENAI_API_KEY`
                },
                body: JSON.stringify({
                    model: "text-davinci-003",
                    prompt: `Generate content for ${category}`,
                    max_tokens: 50
                })
            }),
            // Repeat for additional calls as needed
        ]);

        const data = await Promise.all(responses.map(res => res.json()));

        placeholders.forEach((id, index) => {
            document.getElementById(id).textContent = data[index]?.choices[0]?.text || "No data available";
        });
    } catch (error) {
        placeholders.forEach(id => {
            document.getElementById(id).textContent = "Error loading data";
        });
        console.error(error);
    }
}
