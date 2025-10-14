"use client";

import { useState, useEffect } from 'react';

interface EnrollmentRequest {
  id: number;
  parentName: string;
  childName: string;
  childAge: number;
  email: string;
  phone?: string;
  preferredStartDate?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [message, setMessage] = useState(''); // For success/error messages after updates

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setTableError('');
      const response = await fetch('/api/enrollment-requests', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const { data } = await response.json();
        setRequests(data);
      } else {
        setTableError('Failed to fetch requests');
      }
    } catch (err) {
      setTableError('An error occurred while fetching requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/enrollment-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        setMessage(`${newStatus === 'approved' ? 'Approved' : 'Rejected'} successfully!`);
        fetchRequests(); // Refresh table
        setTimeout(() => setMessage(''), 3000); // Clear message after 3s
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Update failed');
      }
    } catch (err) {
      setMessage('An error occurred while updating status');
    }
  };

  const handleRefresh = () => {
    fetchRequests();
  };

  // Auto-fetch on mount (no login required)
  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Logout button removed since no login */}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Your existing dashboard content can go here, e.g., stats cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome to Dashboard</h2>
          {/* Add other sections like total enrollments, charts, etc. */}
        </div>

        {/* Enrollment Requests Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Enrollment Requests</h2>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-md ${
              message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {loading && <div className="flex justify-center items-center h-32">Loading requests...</div>}
          {tableError && (
            <div className="text-red-600 text-center mt-4">
              {tableError} <button onClick={handleRefresh} className="ml-2 underline">Retry</button>
            </div>
          )}
          {!loading && !tableError && (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.parentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.childName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.childAge}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.preferredStartDate ? new Date(request.preferredStartDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.status === 'pending' ? (
                          <div className="space-x-2">
                            <button
                              onClick={() => updateStatus(request.id, 'approved')}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(request.id, 'rejected')}
                              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={request.notes || 'N/A'}>
                        {request.notes || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {requests.length === 0 && !loading && <p className="text-center text-gray-500 mt-4">No requests yet.</p>}
        </div>
      </div>
    </div>
  );
}