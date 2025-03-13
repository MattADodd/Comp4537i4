async function getResponse() {
    const prompt = document.getElementById("prompt").value;
    if (!prompt) {
        alert("Please enter a prompt");
        return;
    }

    try {
        const response = await fetch("/ai-response?prompt=" + encodeURIComponent(prompt));
        const data = await response.json();
        document.getElementById("response").value = data.answer || "No response received";
    } catch (error) {
        console.error("Error fetching response:", error);
        document.getElementById("response").value = "Error retrieving response";
    }
}