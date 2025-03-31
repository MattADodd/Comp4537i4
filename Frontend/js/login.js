import messages from "../lang/messages/en/messages.js";

// Function to create and show the loading modal
function showLoadingModal() {
    const modal = document.createElement('div');
    modal.id = "loadingModal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000"; // Ensure it sits on top of other content

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = "#fff";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "5px";
    modalContent.style.textAlign = "center";

    const message = document.createElement('p');
    message.innerText = messages.apiCalls.loading;
    modalContent.appendChild(message);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    return modal;
}

// Function to remove the loading modal
function removeLoadingModal(modal) {
    document.body.removeChild(modal);
}

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

    // Show loading modal
    const modal = showLoadingModal();

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
    } finally {
        // Hide the modal after the process is finished
        removeLoadingModal(modal);
    }
});
