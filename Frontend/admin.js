// fetch("https://whale-app-2-zoykf.ondigitalocean.app/admin/api-data", {
//   method: "GET",
//   credentials: "include", // Ensures cookies are sent with the request
// })
// .then((response) => response.json())
// .then((data) => {
//   console.log("API Data:", data); // Log the data to inspect its structure

//   // Access the userStats array from the response object
//   if (data.userStats && Array.isArray(data.userStats)) {
//       const tableBody = document.getElementById("userStatsTable");

//       // Loop through the 'userStats' array and create a row for each user
//       data.userStats.forEach(user => {
//           const row = document.createElement("tr");

//           const usernameCell = document.createElement("td");
//           usernameCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
//           usernameCell.textContent = user.firstName; // Using firstName instead of username
//           row.appendChild(usernameCell);

//           const emailCell = document.createElement("td");
//           emailCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
//           emailCell.textContent = user.email; // Assuming the user object has an 'email' property
//           row.appendChild(emailCell);

//           const requestsCell = document.createElement("td");
//           requestsCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
//           requestsCell.textContent = user.api_calls; // Assuming the user object has 'api_calls' property
//           row.appendChild(requestsCell);

//           // Append the row to the table body

//         //NEW CODE> DELETE IF DOESNT WORK
//         const deleteButton = document.createElement("button");
//         deleteButton.textContent = "Delete";
//         deleteButton.classList.add("px-4","py-2","bg-red-500","text-white","rounded", "hover:bg-red-700");
//         deleteButton.addEventListener("click", () => {
//           fetch(
//             `https://whale-app-2-zoykf.ondigitalocean.app/admin/delete-user/${user.id}`,
//             {
//               method: "DELETE",
//               credentials: "include",
//             }
//           )
//             .then((response) => {
//               if (!response.ok) {
//                 throw new Error("Failed to delete user");
//               }
//               return response.json();
//             })
//             .then(() => {
//               row.remove(); // Remove the row from the table on success
//             })
//             .catch((error) => {
//               console.error("Error:", error);
//             });
//         });

//         const deleteCell = document.createElement("td");
//         deleteCell.appendChild(deleteButton);
//         row.appendChild(deleteCell);

//         tableBody.appendChild(row);
//       });
//   } else {
//       console.error("UserStats data is not in the expected format:", data);
//   }
// })
// .catch((error) => {
//   console.error("Error:", error);
// });

// Wait for DOM to load before executing
document.addEventListener('DOMContentLoaded', function() {
  // Fetch and display user stats when page loads
  fetchUserStats();
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
  
  // Clear existing table rows
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

      // API Calls Cell
      const requestsCell = document.createElement("td");
      requestsCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
      requestsCell.textContent = user.api_calls || 0;
      row.appendChild(requestsCell);

      // Delete Button Cell
      const deleteCell = document.createElement("td");
      const deleteButton = createDeleteButton(user, row);
      deleteCell.appendChild(deleteButton);
      row.appendChild(deleteCell);

      tableBody.appendChild(row);
    });
  } else {
    console.error("UserStats data is not in the expected format:", data);
    showError("Received data in unexpected format");
  }
}

function createDeleteButton(user, row) {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add(
    "px-4", "py-2", "bg-red-500", "text-white", 
    "rounded", "hover:bg-red-700", "transition-colors"
  );

  deleteButton.addEventListener("click", () => handleDeleteUser(user, row, deleteButton));

  return deleteButton;
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

// Notification functions
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