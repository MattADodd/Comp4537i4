// Function to fetch data from the server and populate the tables
async function fetchData() {
  try {
    const response = await fetch("/admin/api-data", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Use token for authentication
      },
    });
    const data = await response.json();

    // Populate API Stats Table
    const apiStatsTable = document.getElementById("apiStatsTable");
    apiStatsTable.innerHTML = data.apiStats
      .map(
        (stat) => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.method}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.endpoint}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.request_count}</td>
        </tr>
      `
      )
      .join("");

    // Populate User Stats Table
    const userStatsTable = document.getElementById("userStatsTable");
    userStatsTable.innerHTML = data.userStats
      .map(
        (user) => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.firstName}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.api_calls}</td>
        </tr>
      `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Fetch data when the page loads
fetchData();
