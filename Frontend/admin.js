// Check if the user is logged in
const token = localStorage.getItem("token");

if (!token) {
  alert("You are not logged in. Redirecting to login page...");
  window.location.href = "/login.html"; // Redirect to the login page
} else {
  // Fetch data if the user is logged in
  fetchData();
}

async function fetchData() {
  try {
    const response = await fetch("/admin/api-data", {
      headers: {
        Authorization: `Bearer ${token}`, // Use the token from localStorage
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("You are not authorized to view this page.");
        window.location.href = "/login.html"; // Redirect to login page
        return;
      }
      throw new Error("Failed to fetch data");
    }

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
    alert("An error occurred. Please try again later.");
  }
}