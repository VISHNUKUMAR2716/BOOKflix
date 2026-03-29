
import React, { useEffect, useState } from "react";
import axios from "axios";

const BookApproval = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [selectedBookForSchedule, setSelectedBookForSchedule] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
  const fetchPendingBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/books/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBooks(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load pending books");
      setMessageType("error");
      setBooks([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBooks();
  }, []);

  /* ================= APPROVE ================= */
  const handleApprove = async (id) => {
    setActionInProgress(id);
    try {
      await axios.put(
        `http://localhost:5000/api/admin/books/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Book approved successfully");
      setMessageType("success");
      fetchPendingBooks();
    } catch {
      setMessage("Approval failed");
      setMessageType("error");
    }
    setActionInProgress(null);
  };

  /* ================= REJECT ================= */
  const handleReject = async (id) => {
    setActionInProgress(id);
    try {
      await axios.put(
        `http://localhost:5000/api/admin/books/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Book rejected successfully");
      setMessageType("success");
      fetchPendingBooks();
    } catch {
      setMessage("Reject failed");
      setMessageType("error");
    }
    setActionInProgress(null);
  };

  /* ================= SCHEDULE ================= */
  const handleSchedule = async (id) => {
    if (!scheduleDate) {
      alert("Please select a release date");
      return;
    }
    setActionInProgress(id);
    try {
      await axios.put(
        `http://localhost:5000/api/admin/books/${id}/schedule`,
        { releaseDate: scheduleDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Book scheduled for release");
      setMessageType("success");
      setScheduleDate("");
      setSelectedBookForSchedule(null);
      fetchPendingBooks();
    } catch {
      setMessage("Scheduling failed");
      setMessageType("error");
    }
    setActionInProgress(null);
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          📚 Book Approval Queue
        </h1>
        <p className="text-gray-500">
          Review and approve or reject books submitted by users
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            messageType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Pending Books</p>
          <p className="text-3xl font-bold text-yellow-600">
            {books.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Approvals Today</p>
          <p className="text-3xl font-bold text-green-600">
            {books.filter((b) => b.status === "approved").length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Rejected Today</p>
          <p className="text-3xl font-bold text-red-600">
            {books.filter((b) => b.status === "rejected").length}
          </p>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No pending books to review
          </div>
        ) : (
          <table className="w-full">

            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Title</th>
                <th className="px-6 py-4 text-left">Author</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Uploaded By</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>

              {books.map((book) => (
                <tr
                  key={book._id}
                  className="border-b hover:bg-gray-50 transition"
                >

                  <td className="px-6 py-4 font-medium text-gray-800">
                    {book.title}
                  </td>

                  <td className="px-6 py-4">{book.author}</td>

                  <td className="px-6 py-4 text-gray-500">
                    {book.category?.name || "N/A"}
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {book.uploadedBy?.name || "Unknown"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                      Pending
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">
                    {selectedBookForSchedule === book._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input 
                          type="datetime-local" 
                          className="px-2 py-1 text-xs border rounded"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                        <button
                          onClick={() => handleSchedule(book._id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setSelectedBookForSchedule(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          disabled={actionInProgress !== null}
                          onClick={() => handleApprove(book._id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          {actionInProgress === book._id ? "Processing..." : "Approve"}
                        </button>

                        <button
                          disabled={actionInProgress !== null}
                          onClick={() => setSelectedBookForSchedule(book._id)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                        >
                          Schedule
                        </button>

                        <button
                          disabled={actionInProgress !== null}
                          onClick={() => handleReject(book._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          {actionInProgress === book._id ? "Processing..." : "Reject"}
                        </button>
                      </>
                    )}
                  </td>


                </tr>
              ))}

            </tbody>

          </table>
        )}
      </div>
    </div>
  );
};

export default BookApproval;