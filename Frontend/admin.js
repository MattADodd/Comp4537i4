fetch("http://localhost:3000/admin/api-data", {
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
          tableBody.appendChild(row);
      });
  } else {
      console.error("UserStats data is not in the expected format:", data);
  }
})
.catch((error) => {
  console.error("Error:", error);
});
