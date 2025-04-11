// src/app/dashboard/admin/interviews/create/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function ScheduleInterviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<User[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch candidates
        const candidatesResponse = await fetch("/api/admin/users?role=CANDIDATE");
        if (!candidatesResponse.ok) {
          throw new Error("Failed to fetch candidates");
        }
        const candidatesData = await candidatesResponse.json();
        setCandidates(candidatesData);

        // Fetch interviewers
        const interviewersResponse = await fetch("/api/admin/users?role=INTERVIEWER");
        if (!interviewersResponse.ok) {
          throw new Error("Failed to fetch interviewers");
        }
        const interviewersData = await interviewersResponse.json();
        setInterviewers(interviewersData);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again later.");
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    } else {
      setError("You do not have permission to access this page.");
      setIsLoading(false);
    }
  }, [session]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          type: data.type,
          candidateId: data.candidateId,
          interviewerId: data.interviewerId,
          scheduledAt: new Date(data.date + "T" + data.time).toISOString(),
          duration: parseInt(data.duration),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule interview");
      }

      router.push("/dashboard/admin/interviews?scheduled=true");
    } catch (error) {
      console.error("Error scheduling interview:", error);
      setError("Failed to schedule interview. Please try again.");
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Schedule New Interview</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interview Title
                </label>
                <input
                  type="text"
                  {...register("title", { required: "Title is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., Frontend Developer Interview"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interview Type
                </label>
                <select
                  {...register("type", { required: "Type is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select interview type</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="MANAGERIAL">Managerial</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.type.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Candidate
                </label>
                <select
                  {...register("candidateId", { required: "Candidate is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.email})
                    </option>
                  ))}
                </select>
                {errors.candidateId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.candidateId.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interviewer
                </label>
                <select
                  {...register("interviewerId", { required: "Interviewer is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select interviewer</option>
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name} ({interviewer.email})
                    </option>
                  ))}
                </select>
                {errors.interviewerId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.interviewerId.message as string}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register("date", { required: "Date is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.date.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    {...register("time", { required: "Time is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.time.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  {...register("duration", {
                    required: "Duration is required",
                    min: { value: 15, message: "Minimum duration is 15 minutes" },
                    max: { value: 120, message: "Maximum duration is 120 minutes" },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="60"
                  min="15"
                  max="120"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.duration.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => router.push("/dashboard/admin/interviews")}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Interview"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}