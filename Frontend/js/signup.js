signupForm.addEventListener("submit", async (event) => {
    event.preventDefault(); 


    //Saves info from the form
    const firstName = document.getElementById("firstName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    //Input validation
    if (!firstName || !email || !password || !confirmPassword) {
        alert("Please fill out all fields!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    //stores userdata in 1 object
    const userData = { firstName, email, password };
    console.log("Sending data:", userData);  // Log data before sending


    //Post request sending user data to server
    try {
        const response = await fetch("https://whale-app-2-zoykf.ondigitalocean.app/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log("Response received:", data); // Log server response

        //If sign up works, redirects to login
        if (response.ok) {
            alert("Registration successful!");
            window.location.href = "../html/login.html";
        } else {
            alert(data.error || "Registration failed!");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server error. Try again later.");
    }
});
