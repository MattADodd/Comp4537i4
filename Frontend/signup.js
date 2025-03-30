signupForm.addEventListener("submit", async (event) => {
    event.preventDefault(); 

    const firstName = document.getElementById("firstName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!firstName || !email || !password || !confirmPassword) {
        alert("Please fill out all fields!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const userData = { firstName, email, password };
    console.log("Sending data:", userData);  // Log data before sending

    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log("Response received:", data); // Log server response

        if (response.ok) {
            alert("Registration successful!");
            window.location.href = "./login.html";
        } else {
            alert(data.error || "Registration failed!");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server error. Try again later.");
    }
});
