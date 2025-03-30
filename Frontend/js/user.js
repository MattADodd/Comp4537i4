async function getResponse() {
   
   //Basic prompt for AI
    const prompt = "Please write me a short story about" + document.getElementById("prompt").value;
    if (!prompt) {
        alert("Please enter a prompt");
        return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 360000); // 2-minute timeout

    //Get request to server for prompt response
    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/ai-response?prompt=" + encodeURIComponent(prompt), {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
        });

        clearTimeout(timeout); // Prevent timeout from triggering

        const data = await response.json();
        let answerText = data.answer
        const regex = /<think>[\s\S]*<\/think>/;
        answerText = answerText.replace(regex, "").trim();
        document.getElementById("response").value = answerText;
        textToSpeech(answerText);
    } catch (error) {
        if (error.name === "AbortError") {
            console.error("Request timed out!");
            document.getElementById("response").value = "Request timed out. Try again.";
        } else {
            console.error("Error fetching response:", error);
            document.getElementById("response").value = "Error retrieving response";
        }
    }
}

function textToSpeech(text) {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // Optional: set the voice and language
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices[0]; // Default voice
    utterance.lang = 'en-US'; // Set the language to English (US)

    // Speak the text
    speechSynthesis.speak(utterance);
}

// Send a GET request to the "/dashboard" endpoint
fetch("https://whale-app-2-zoykf.ondigitalocean.app/dashboard", {
    method: "GET",
    credentials: "include", // Ensure cookies are sent with the request
})
.then((response) => response.json())
.then((data) => {
    // Check if the response contains 'api_calls' data
    if (data.api_calls !== undefined) {
        // Update the DOM with the number of API calls
        const apiCallsText = document.getElementById("apiCallsText");
        apiCallsText.textContent = `API Calls Left: ${20-data.api_calls}`;
    } else {
        // Handle unexpected response format
        console.error("Unexpected response:", data);
    }
})
.catch((error) => {
    console.error("Error:", error);
    const apiCallsText = document.getElementById("apiCallsText");
    apiCallsText.textContent = "Failed to load API calls data.";
});
