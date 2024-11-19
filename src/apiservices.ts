// src/apiService.ts
export async function fetchData() {
    const response = await fetch("https://api.spacexdata.com/v4/launches/latest"); // Example API
    return response.json();
  }
  