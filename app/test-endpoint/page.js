"use client";

export default function TestEndpoint() {
  const testEndpoint = async () => {
    const email = "neumang+nocode@gmail.com";
    const url = `/api/user/profile?email=${encodeURIComponent(email)}`;

    console.log("Testing URL:", url);

    try {
      const response = await fetch(url);
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log("Response data:", data);

      document.getElementById("result").innerHTML = `
        <h3>Status: ${response.status}</h3>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    } catch (error) {
      console.error("Error:", error);
      document.getElementById(
        "result"
      ).innerHTML = `<p>Error: ${error.message}</p>`;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Endpoint</h1>
      <button
        onClick={testEndpoint}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test /api/user/profile
      </button>
      <div id="result" className="mt-4"></div>
    </div>
  );
}
