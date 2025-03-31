import messages from "../lang/messages/en/messages.js";

// Function to create and show the loading modal
function showLoadingModal() {
    const modal = document.createElement('div');
    modal.id = "loadingModal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000"; // Ensure it sits on top of other content

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = "#fff";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "5px";
    modalContent.style.textAlign = "center";

    const loadingText = document.createElement('p');
    loadingText.innerText = messages.apiCalls.loading;
    modalContent.appendChild(loadingText);

    const spinner = document.createElement('div');
    spinner.style.border = "4px solid #f3f3f3"; /* Light grey */
    spinner.style.borderTop = "4px solid #3498db"; /* Blue */
    spinner.style.borderRadius = "50%";
    spinner.style.width = "40px";
    spinner.style.height = "40px";
    spinner.style.animation = "spin 1s linear infinite"; // Spinner animation

    modalContent.appendChild(spinner);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    return modal;
}

// Function to remove the loading modal
function removeLoadingModal(modal) {
    document.body.removeChild(modal);
}

// Function to create the spinner animation (for CSS)
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Main function to get AI response
async function getResponse() {
    const userPrompt = document.getElementById("prompt").value;
    if (!userPrompt) {
        alert(messages.aiResponse.emptyPrompt);
        return;
    }

    const prompt = "Please write me a short story about " + userPrompt;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 360000); // 2-minute timeout

    // Show loading modal while the request is in progress
    const modal = showLoadingModal();

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
    } finally {
        // Remove the loading modal after the request finishes
        removeLoadingModal(modal);
    }
}

// Attach event listener for the button
document.getElementById("submit-btn").addEventListener("click", getResponse);

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
