import messages from "../lang/messages/en/messages";

async function getResponse() {
    const userPrompt = document.getElementById("prompt").value;
    if (!userPrompt) {
        alert(messages.aiResponse.emptyPrompt);
        return;
    }

    const prompt = "Please write me a short story about " + userPrompt;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 360000); // 2-minute timeout

    try {
        const response = await fetch(
            `https://whale-app-2-zoykf.ondigitalocean.app/ai-response?prompt=${encodeURIComponent(prompt)}`,
            {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            }
        );

        clearTimeout(timeout); // Prevent timeout from triggering

        const data = await response.json();
        let answerText = data.answer.replace(/<think>[\s\S]*<\/think>/, "").trim();

        document.getElementById("response").value = answerText;
        textToSpeech(answerText);
    } catch (error) {
        if (error.name === "AbortError") {
            console.error("Request timed out!");
            document.getElementById("response").value = messages.aiResponse.timeout;
        } else {
            console.error("Error fetching response:", error);
            document.getElementById("response").value = messages.aiResponse.error;
        }
    }
}

function textToSpeech(text) {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = speechSynthesis.getVoices();
    utterance.voice = voices[0] || null; // Default voice
    utterance.lang = "en-US";

    speechSynthesis.speak(utterance);
}

// Fetch API Calls Left
fetch("https://whale-app-2-zoykf.ondigitalocean.app/dashboard", {
    method: "GET",
    credentials: "include",
})
    .then((response) => response.json())
    .then((data) => {
        if (data.api_calls !== undefined) {
            document.getElementById("apiCallsText").textContent = messages.apiCalls.remaining(20 - data.api_calls);
        } else {
            console.error("Unexpected response:", data);
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        document.getElementById("apiCallsText").textContent = messages.apiCalls.failed;
    });
