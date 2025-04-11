// src/app/dashboard/admin/interviews/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Interview = {
  id: string;
  title: string;
  type: "TECHNICAL" | "MANAGERIAL";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduledAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  interviewer: {
    id: string;
    name: string;
    email: string;
  };
};

export default function InterviewsListPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("scheduled") === "true";
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filterStatus !== "all") {
          queryParams.append("status", filterStatus);
        }
        if (filterType !== "all") {
          queryParams.append("type", filterType);
        }

        // Fetch interviews
        const response = await fetch(`/api/interviews?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }
        const data = await response.json();
        setInterviews(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching interviews:", error);
        setError("Failed to load interviews. Please try again later.");
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchInterviews();
    } else {
      setError("You do not have permission to access this page.");
      setIsLoading(false);
    }
  }, [session, filterStatus, filterType]);

  const handleCancelInterview = async (id: string) => {
    try {
      const response = await fetch(`/api/interviews/${id}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel interview");
      }
      
      // Update the interview status in the UI
      setInterviews(interviews.map(interview => 
        interview.id === id 
          ? { ...interview, status: "CANCELLED" as const } 
          : interview
      ));
    } catch (error) {
      console.error("Error cancelling interview:", error);
      alert("Failed to cancel interview. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <Link
          href="/dashboard/admin/interviews/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Schedule New Interview
        </Link>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Interview scheduled successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-0">Filter Interviews</h2>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  id="type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="MANAGERIAL">Managerial</option>
                </select>
              </div>
            </div>
          </div>

          {interviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interviewer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled For
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviews.map((interview) => (
                    <tr key={interview.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{interview.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          interview.type === "TECHNICAL" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {interview.type === "TECHNICAL" ? "Technical" : "Managerial"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{interview.candidate.name}</div>
                        <div className="text-sm text-gray-500">{interview.candidate.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{interview.interviewer.name}</div>
                        <div className="text-sm text-gray-500">{interview.interviewer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(interview.scheduledAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          interview.status === "SCHEDULED" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : interview.status === "COMPLETED" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {interview.status === "SCHEDULED" 
                            ? "Scheduled" 
                            : interview.status === "COMPLETED" 
                            ? "Completed" 
                            : "Cancelled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link
                            href={`/dashboard/admin/interviews/${interview.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                          {interview.status === "SCHEDULED" && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleCancelInterview(interview.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by scheduling a new interview.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/admin/interviews/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Schedule New Interview
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}