const messages = {
    errors: {
        fetchUserData: "Failed to fetch user data",
        fetchApiStats: "Failed to fetch API stats",
        updateUser: "Failed to update user",
        deleteUser: "Failed to delete user",
        unexpectedData: "Received data in unexpected format"
    },
    success: {
        userUpdated: "User updated successfully",
        userDeleted: (name) => `User ${name} deleted successfully`
    },
    buttons: {
        update: "Update",
        updating: "Updating...",
        delete: "Delete",
        deleting: "Deleting...",
        login: "Logging in...",
        forgotPassword: "Processing...",
        resetPassword: "Resetting password...",
        signup: "Signing up..."
    },
    confirmations: {
        deleteUser: (name) => `Are you sure you want to delete ${name}?`
    },
    login: {
        success: "Login successful!",
        failed: "Login failed!",
        serverError: "Server error. Try again later."
    },
    forgotPassword: {
        prompt: "Please enter your email to reset your password.",
        success: "Password reset link sent! Check your email.",
        failed: "Failed to send reset email."
    },
    resetPassword: {
        invalidLink: "Invalid password reset link.",
        success: "Password successfully reset! Please log in.",
        failed: "Password reset failed."
    },
    signup: {
        emptyFields: "Please fill out all fields!",
        passwordMismatch: "Passwords do not match!",
        success: "Registration successful!",
        failed: "Registration failed!"
    },
    aiResponse: {
        emptyPrompt: "Please enter a prompt.",
        timeout: "Request timed out. Try again.",
        error: "Error retrieving response."
    },
    apiCalls: {
        failed: "Failed to load API calls data.",
        loading: "Loading... Please Wait",
        remaining: (callsLeft) => `API Calls Left: ${callsLeft}`
    }
};

export default messages;
