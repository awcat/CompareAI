async function fetchHuggingFaceResults(category) {
    const placeholders = ['result-1', 'result-2', 'result-3'];

    placeholders.forEach(id => {
        document.getElementById(id).textContent = "Loading...";
    });

    try {
        const responses = await Promise.all([
            fetch(`https://api-inference.huggingface.co/models/gpt2`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer YOUR_HUGGING_FACE_API_KEY`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: `Generate content for ${category}` })
            }),
            // Repeat for additional calls as needed
        ]);

        const data = await Promise.all(responses.map(res => res.json()));

        placeholders.forEach((id, index) => {
            document.getElementById(id).textContent = data[index]?.generated_text || "No data available";
        });
    } catch (error) {
        placeholders.forEach(id => {
            document.getElementById(id).textContent = "Error loading data";
        });
        console.error(error);
    }
}
