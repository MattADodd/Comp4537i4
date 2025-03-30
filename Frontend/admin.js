document.addEventListener('DOMContentLoaded', function() {
  fetchUserStats();
  fetchApiStats();
});

function fetchUserStats() {
  fetch("https://whale-app-2-zoykf.ondigitalocean.app/admin/api-data", {
    method: "GET",
    credentials: "include",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
    }
  })
  .then((response) => {
    if (!response.ok) {
      return response.json().then(errData => {
        throw new Error(errData.error || "Failed to fetch user data");
      });
    }
    return response.json();
  })
  .then((data) => {
    console.log("API Data:", data);
    populateUserTable(data);
  })
  .catch((error) => {
    console.error("Error:", error);
    showError(error.message);
  });
}

function populateUserTable(data) {
  const tableBody = document.getElementById("userStatsTable");
  tableBody.innerHTML = '';

  if (data.userStats && Array.isArray(data.userStats)) {
    data.userStats.forEach(user => {
      const row = document.createElement("tr");

      // Username Cell
      const usernameCell = document.createElement("td");
      usernameCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
      usernameCell.textContent = user.firstName || 'N/A';
      row.appendChild(usernameCell);

      // Email Cell
      const emailCell = document.createElement("td");
      emailCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
      emailCell.textContent = user.email || 'N/A';
      row.appendChild(emailCell);

      // API Calls Cell (now editable)
      const requestsCell = document.createElement("td");
      requestsCell.classList.add("px-6", "py-4");
      
      const apiCallsInput = document.createElement("input");
      apiCallsInput.type = "number";
      apiCallsInput.value = user.api_calls || 0;
      apiCallsInput.classList.add(
        "w-20", "p-2", "border", "rounded", 
        "text-sm", "font-medium", "text-gray-900"
      );
      requestsCell.appendChild(apiCallsInput);
      row.appendChild(requestsCell);

      // Action Buttons Cell
      const actionCell = document.createElement("td");
      actionCell.classList.add("px-6", "py-4", "space-x-2");

      // Update Button
      const updateButton = document.createElement("button");
      updateButton.textContent = "Update";
      updateButton.classList.add(
        "px-4", "py-2", "bg-blue-500", "text-white",
        "rounded", "hover:bg-blue-700", "transition-colors"
      );
      updateButton.addEventListener("click", () => 
        handleUpdateUser(user.id, apiCallsInput.value, updateButton)
      );

      // Delete Button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.classList.add(
        "px-4", "py-2", "bg-red-500", "text-white", 
        "rounded", "hover:bg-red-700", "transition-colors"
      );
      deleteButton.addEventListener("click", () => 
        handleDeleteUser(user, row, deleteButton)
      );

      actionCell.appendChild(updateButton);
      actionCell.appendChild(deleteButton);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  } else {
    console.error("UserStats data is not in the expected format:", data);
    showError("Received data in unexpected format");
  }
}

function handleUpdateUser(userId, newApiCalls, button) {
  const originalText = button.textContent;
  
  // Set loading state
  button.disabled = true;
  button.textContent = "Updating...";
  button.classList.add("opacity-50");

  fetch(`https://whale-app-2-zoykf.ondigitalocean.app/admin/update-user/${userId}`, {
    method: "PUT", // or "PATCH" depending on your backend
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
    },
    body: JSON.stringify({
      api_calls: parseInt(newApiCalls)
    })
  })
  .then((response) => {
    if (!response.ok) {
      return response.json().then(errData => {
        throw new Error(errData.error || "Failed to update user");
      });
    }
    return response.json();
  })
  .then(() => {
    showSuccess("User updated successfully");
  })
  .catch((error) => {
    console.error("Update error:", error);
    showError(error.message);
  })
  .finally(() => {
    // Reset button state
    button.disabled = false;
    button.textContent = originalText;
    button.classList.remove("opacity-50");
  });
}

function handleDeleteUser(user, row, button) {
  if (!confirm(`Are you sure you want to delete ${user.firstName}?`)) {
    return;
  }

  // Set loading state
  button.disabled = true;
  button.textContent = "Deleting...";
  button.classList.add("opacity-50");

  fetch(`https://whale-app-2-zoykf.ondigitalocean.app/admin/delete-user/${user.id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
    }
  })
  .then((response) => {
    if (!response.ok) {
      return response.json().then(errData => {
        throw new Error(errData.error || "Failed to delete user");
      });
    }
    return response.json();
  })
  .then(() => {
    row.remove();
    showSuccess(`User ${user.firstName} deleted successfully`);
  })
  .catch((error) => {
    console.error("Delete error:", error);
    showError(error.message);
    // Reset button state
    button.disabled = false;
    button.textContent = "Delete";
    button.classList.remove("opacity-50");
  });
}








function showError(message) {
  const notification = document.createElement("div");
  notification.className = "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}



// Function to fetch and display API stats for the admin
function fetchApiStats() {
  

  fetch("https://whale-app-2-zoykf.ondigitalocean.app/admin/api-stats", {
    method: "GET",
    credentials: "include",
    headers: {
      
      "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
    }
  })
  .then((response) => {
    if (!response.ok) {
      return response.json().then(errData => {
        console.error("Error response text:", errData);
        throw new Error(errData.error || "Failed to fetch API stats");
      });
    }
    return response.json();
  })
  .then((data) => {
    console.log("API Stats:", data);
    populateApiStatsTable(data.apiStats);
  })
  .catch((error) => {
    console.error("Error:", error);
    showError(error.message);
  });
}

// Function to populate the API stats table
function populateApiStatsTable(stats) {
  console.log("inside populateAPI")
  const tableBody = document.querySelector("#apiStatsTable tbody");

  // Clear existing table rows
  tableBody.innerHTML = '';

  stats.forEach(stat => {
    const row = document.createElement("tr");

    // Method Cell
    const methodCell = document.createElement("td");
    methodCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
    methodCell.textContent = stat.method || 'N/A';
    row.appendChild(methodCell);

    // Endpoint Cell
    const endpointCell = document.createElement("td");
    endpointCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
    endpointCell.textContent = stat.endpoint || 'N/A';
    row.appendChild(endpointCell);

    // Request Count Cell
    const requestCountCell = document.createElement("td");
    requestCountCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
    requestCountCell.textContent = stat.requests || 0;
    row.appendChild(requestCountCell);

    // Append row to the table body
    tableBody.appendChild(row);
})
}