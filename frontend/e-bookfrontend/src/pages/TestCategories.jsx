import React, { useState } from "react";
import axios from "axios";

const TestCategories = () => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testCategories = async () => {
    setLoading(true);
    setResult("Testing categories endpoint...");
    try {
      const response = await axios.get(
        "https://bookflix-1-o3od.onrender.com/api/books/categories",
      );
      console.log("Categories Response:", response.data);
      setResult(`SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.error("Error:", error);
      setResult(
        `ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Test Categories API</h1>
        <button
          onClick={testCategories}
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded mb-4 disabled:bg-gray-400"
        >
          {loading ? "Testing..." : "Test Categories Endpoint"}
        </button>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {result}
        </pre>
      </div>
    </div>
  );
};

export default TestCategories;
