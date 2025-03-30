
//Adds avent listener to submit button to log in.
document.querySelector("form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from reloading the page

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    //Post method to server to try logging in
    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include" // Ensures cookies (JWT) are stored
        });

        //waits for response from server
        const data = await response.json();

        //Saves the returned token to local storage
        if (response.ok) {
            // Store the token in localStorage
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            window.location.href = "../html/userLanding.html"; // Redirect to dashboard for regular users
        } else {
            alert(data.error || "Login failed!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Try again later.");
    }
});

// Forgot Password Button Click Handler
document.getElementById("forgot-password").addEventListener("click", async function () {
    const email = document.getElementById("email").value;

    if (!email) {
        alert("Please enter your email to reset your password.");
        return;
    }

    //Posts email to server to reset password
    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password reset link sent! Check your email.");
        } else {
            alert(data.error || "Failed to send reset email.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Try again later.");
    }
});