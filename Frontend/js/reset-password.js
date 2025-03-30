document.addEventListener("DOMContentLoaded", function () {
    // Get the token from the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        alert("Invalid password reset link.");
        window.location.href = "../html/login.html"; // Redirect if no token
        return;
    }

    //Gets the token from local storage.
    document.getElementById("token").value = token; // Store token in hidden input

    document.getElementById("resetPasswordForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        const newPassword = document.getElementById("newPassword").value;
        
        //Post request to server to get new password.
        try {
            const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Password successfully reset! Please log in.");
                window.location.href = "../html/login.html";
            } else {
                alert(data.error || "Password reset failed.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server error. Try again later.");
        }
    });
});
