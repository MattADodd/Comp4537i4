document.querySelector("form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from reloading the page

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include" // Ensures cookies (JWT) are stored
        });

        const data = await response.json();

        if (response.ok) {
            // Store the token in localStorage
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            window.location.href = "/Comp4537i4/Frontend/userLanding.html"; // Redirect to dashboard for regular users
        } else {
            alert(data.error || "Login failed!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Try again later.");
    }
});