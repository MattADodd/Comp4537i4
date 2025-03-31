// ChatGPT was used to help write some of the code
import messages from "../lang/messages/en/messages.js";

document.addEventListener("DOMContentLoaded", function () {
  fetchUserStats();
  fetchApiStats();
});

function fetchUserStats() {
  fetch("https://whale-app-2-zoykf.ondigitalocean.app/admin/api-data", {
    method: "GET",
    credentials: "include",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errData) => {
          throw new Error(errData.error || messages.errors.fetchUserData);
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
  tableBody.innerHTML = "";

  if (data.userStats && Array.isArray(data.userStats)) {
    data.userStats.forEach((user) => {
      const row = document.createElement("tr");

      const usernameCell = document.createElement("td");
      usernameCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
      usernameCell.textContent = user.firstName || "N/A";
      row.appendChild(usernameCell);

      const emailCell = document.createElement("td");
      emailCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
      emailCell.textContent = user.email || "N/A";
      row.appendChild(emailCell);

      const requestsCell = document.createElement("td");
      requestsCell.classList.add("px-6", "py-4");

      const apiCallsInput = document.createElement("input");
      apiCallsInput.type = "number";
      apiCallsInput.value = user.api_calls || 0;
      apiCallsInput.classList.add("w-20", "p-2", "border", "rounded", "text-sm", "font-medium", "text-gray-900");
      requestsCell.appendChild(apiCallsInput);
      row.appendChild(requestsCell);

      const actionCell = document.createElement("td");
      actionCell.classList.add("px-6", "py-4", "space-x-2");

      const updateButton = document.createElement("button");
      updateButton.textContent = messages.buttons.update;
      updateButton.classList.add("px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-700", "transition-colors");
      updateButton.addEventListener("click", () => handleUpdateUser(user.id, apiCallsInput.value, updateButton));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = messages.buttons.delete;
      deleteButton.classList.add("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-700", "transition-colors");
      deleteButton.addEventListener("click", () => handleDeleteUser(user, row, deleteButton));

      actionCell.appendChild(updateButton);
      actionCell.appendChild(deleteButton);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  } else {
    console.error("UserStats data is not in the expected format:", data);
    showError(messages.errors.unexpectedData);
  }
}

function handleUpdateUser(userId, newApiCalls, button) {
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = messages.buttons.updating;
  button.classList.add("opacity-50");

  fetch(`https://whale-app-2-zoykf.ondigitalocean.app/admin/update-user/${userId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify({ api_calls: parseInt(newApiCalls) }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errData) => {
          throw new Error(errData.error || messages.errors.updateUser);
        });
      }
      return response.json();
    })
    .then(() => {
      showSuccess(messages.success.userUpdated);
    })
    .catch((error) => {
      console.error("Update error:", error);
      showError(error.message);
    })
    .finally(() => {
      button.disabled = false;
      button.textContent = originalText;
      button.classList.remove("opacity-50");
    });
}

function handleDeleteUser(user, row, button) {
  if (!confirm(messages.confirmations.deleteUser(user.firstName))) {
    return;
  }

  button.disabled = true;
  button.textContent = messages.buttons.deleting;
  button.classList.add("opacity-50");

  fetch(`https://whale-app-2-zoykf.ondigitalocean.app/admin/delete-user/${user.id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errData) => {
          throw new Error(errData.error || messages.errors.deleteUser);
        });
      }
      return response.json();
    })
    .then(() => {
      row.remove();
      showSuccess(messages.success.userDeleted(user.firstName));
    })
    .catch((error) => {
      console.error("Delete error:", error);
      showError(error.message);
      button.disabled = false;
      button.textContent = messages.buttons.delete;
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
