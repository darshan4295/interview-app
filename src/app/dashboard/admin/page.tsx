// src/app/dashboard/admin/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type UserCount = {
  candidates: number;
  interviewers: number;
  admins: number;
};

type ActivityCount = {
  pendingInterviews: number;
  completedInterviews: number;
  pendingAssessments: number;
  completedAssessments: number;
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [userCounts, setUserCounts] = useState<UserCount>({
    candidates: 0,
    interviewers: 0,
    admins: 0,
  });
  const [activityCounts, setActivityCounts] = useState<ActivityCount>({
    pendingInterviews: 0,
    completedInterviews: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user counts
        const userResponse = await fetch("/api/admin/users/count");
        const userData = await userResponse.json();
        
        // Fetch activity counts
        const activityResponse = await fetch("/api/admin/activity/count");
        const activityData = await activityResponse.json();
        
        // Fetch recent users
        const recentUsersResponse = await fetch("/api/admin/users/recent");
        const recentUsersData = await recentUsersResponse.json();
        
        setUserCounts(userData);
        setActivityCounts(activityData);
        setRecentUsers(recentUsersData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Admin Dashboard
        </h1>
        <div className="flex space-x-3">
          <Link 
            href="/dashboard/admin/users/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add User
          </Link>
          <Link 
            href="/dashboard/admin/interviews/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Schedule Interview
          </Link>
        </div>
      </div>
      
      {/* User Stats */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">User Statistics</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Candidates
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {userCounts.candidates}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Interviewers
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {userCounts.interviewers}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Admins
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {userCounts.admins}
              </dd>
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity Stats */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">Activity Overview</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending Interviews
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {activityCounts.pendingInterviews}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Completed Interviews
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {activityCounts.completedInterviews}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending Assessments
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {activityCounts.pendingAssessments}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Completed Assessments
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {activityCounts.completedAssessments}
              </dd>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="mt-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h2 className="text-lg font-medium text-gray-900">Recently Added Users</h2>
          </div>
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "ADMIN" 
                                ? "bg-purple-100 text-purple-800" 
                                : user.role === "INTERVIEWER" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/dashboard/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-900">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Link
              href="/dashboard/admin/users"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all users →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}