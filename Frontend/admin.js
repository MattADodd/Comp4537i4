fetch("https://whale-app-2-zoykf.ondigitalocean.app/admin/api-data", {
  method: "GET",
  credentials: "include", // Ensures cookies are sent with the request
})
.then((response) => response.json())
.then((data) => {
  console.log("API Data:", data); // Log the data to inspect its structure

  // Access the userStats array from the response object
  if (data.userStats && Array.isArray(data.userStats)) {
      const tableBody = document.getElementById("userStatsTable");

      // Loop through the 'userStats' array and create a row for each user
      data.userStats.forEach(user => {
          const row = document.createElement("tr");

          const usernameCell = document.createElement("td");
          usernameCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
          usernameCell.textContent = user.firstName; // Using firstName instead of username
          row.appendChild(usernameCell);

          const emailCell = document.createElement("td");
          emailCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
          emailCell.textContent = user.email; // Assuming the user object has an 'email' property
          row.appendChild(emailCell);

          const requestsCell = document.createElement("td");
          requestsCell.classList.add("px-6", "py-4", "text-sm", "font-medium", "text-gray-900");
          requestsCell.textContent = user.api_calls; // Assuming the user object has 'api_calls' property
          row.appendChild(requestsCell);

          // Append the row to the table body

        //NEW CODE> DELETE IF DOESNT WORK
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("px-4","py-2","bg-red-500","text-white","rounded", "hover:bg-red-700");
        deleteButton.addEventListener("click", () => {
          fetch(
            `https://whale-app-2-zoykf.ondigitalocean.app/admin/delete-user/${user.id}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to delete user");
              }
              return response.json();
            })
            .then(() => {
              row.remove(); // Remove the row from the table on success
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        });

        const deleteCell = document.createElement("td");
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        tableBody.appendChild(row);
      });
  } else {
      console.error("UserStats data is not in the expected format:", data);
  }
})
.catch((error) => {
  console.error("Error:", error);
});
