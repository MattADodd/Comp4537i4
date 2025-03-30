import messages from "../lang/messages/en/messages";

document.addEventListener("DOMContentLoaded", function () {
    // Get the token from the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        alert(messages.resetPassword.invalidLink);
        window.location.href = "../html/login.html"; // Redirect if no token
        return;
    }

    // Store token in hidden input field
    document.getElementById("token").value = token;

    document.getElementById("resetPasswordForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        const newPassword = document.getElementById("newPassword").value;

        try {
            const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(messages.resetPassword.success);
                window.location.href = "../html/login.html";
            } else {
                alert(data.error || messages.resetPassword.failed);
            }
        } catch (error) {
            console.error("Error:", error);
            alert(messages.login.serverError);
        }
    });
});
