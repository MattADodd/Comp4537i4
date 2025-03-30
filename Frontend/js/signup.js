import messages from "../lang/messages/en/messages.js";

document.getElementById("signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Collect form values
    const firstName = document.getElementById("firstName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Input validation
    if (!firstName || !email || !password || !confirmPassword) {
        alert(messages.signup.emptyFields);
        return;
    }

    if (password !== confirmPassword) {
        alert(messages.signup.passwordMismatch);
        return;
    }

    // Create user data object
    const userData = { firstName, email, password };
    console.log("Sending data:", userData);  // Log data before sending

    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        console.log("Response received:", data); // Log server response

        if (response.ok) {
            alert(messages.signup.success);
            window.location.href = "../html/login.html";
        } else {
            alert(data.error || messages.signup.failed);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert(messages.login.serverError);
    }
});
