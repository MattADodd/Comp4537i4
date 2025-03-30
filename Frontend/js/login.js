import messages from "../lang/messages/en/messages.js";

// Login Form Submission
document.querySelector("form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from reloading

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            alert(messages.login.success);
            window.location.href = "../html/userLanding.html";
        } else {
            alert(data.error || messages.login.failed);
        }
    } catch (error) {
        console.error("Error:", error);
        alert(messages.login.serverError);
    }
});

// Forgot Password Button Click Handler
document.getElementById("forgot-password").addEventListener("click", async function () {
    const email = document.getElementById("email").value;

    if (!email) {
        alert(messages.forgotPassword.prompt);
        return;
    }

    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(messages.forgotPassword.success);
        } else {
            alert(data.error || messages.forgotPassword.failed);
        }
    } catch (error) {
        console.error("Error:", error);
        alert(messages.login.serverError);
    }
});
