async function getResponse() {
    const prompt = document.getElementById("prompt").value;
    if (!prompt) {
        alert("Please enter a prompt");
        return;
    }

    try {
        // CHANGE THE URL TO SERVER WHEN IT IS HOSTED!
        // IMPORTANT ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        const response = await fetch("http://localhost:3000/ai-response?prompt=" + encodeURIComponent(prompt));
        const data = await response.json();

        const answerText = data.answer?.content || "No response received";

        document.getElementById("response").value = answerText;
    } catch (error) {
        console.error("Error fetching response:", error);
        document.getElementById("response").value = "Error retrieving response";
    }
}

// Send a GET request to the "/dashboard" endpoint
fetch("http://localhost:3000/dashboard", {
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
