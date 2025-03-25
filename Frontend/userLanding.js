async function getResponse() {
    const prompt = document.getElementById("prompt").value;
    if (!prompt) {
        alert("Please enter a prompt");
        return;
    }

    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/ai-response?prompt=" + encodeURIComponent(prompt), {
            method: "GET",
            credentials: "include"
        });
        const data = await response.json();

        const answerText = data.answer?.content || "No response received";

        document.getElementById("response").value = answerText;
    } catch (error) {
        console.error("Error fetching response:", error);
        document.getElementById("response").value = "Error retrieving response";
    }
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
