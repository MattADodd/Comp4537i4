document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent page reload

        const firstName = document.getElementById("firstName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful!");
                window.location.href = "/login.html"; // Redirect to login page
            } else {
                alert(data.error || "Registration failed!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server error. Try again later.");
        }
    });
});