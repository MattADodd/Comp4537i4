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