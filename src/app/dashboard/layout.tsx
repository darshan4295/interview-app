// src/app/dashboard/layout.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"CANDIDATE" | "INTERVIEWER" | "ADMIN" | null>(null);

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role);
    }
  }, [session]);

  // Navigation links based on user role
  const navigation = [
    { name: "Dashboard", href: `/dashboard/${userRole?.toLowerCase()}`, current: pathname.includes(`/dashboard/${userRole?.toLowerCase()}`) },
  ];

  // Add role-specific navigation items
  if (userRole === "CANDIDATE") {
    navigation.push(
      { name: "My Interviews", href: "/dashboard/candidate/interviews", current: pathname.includes("/dashboard/candidate/interviews") },
      { name: "Coding Assessments", href: "/dashboard/candidate/assessments", current: pathname.includes("/dashboard/candidate/assessments") },
      { name: "My Reports", href: "/dashboard/candidate/reports", current: pathname.includes("/dashboard/candidate/reports") }
    );
  } else if (userRole === "INTERVIEWER") {
    navigation.push(
      { name: "Scheduled Interviews", href: "/dashboard/interviewer/interviews", current: pathname.includes("/dashboard/interviewer/interviews") },
      { name: "Assessments to Review", href: "/dashboard/interviewer/assessments", current: pathname.includes("/dashboard/interviewer/assessments") },
      { name: "Candidate Reports", href: "/dashboard/interviewer/reports", current: pathname.includes("/dashboard/interviewer/reports") }
    );
  } else if (userRole === "ADMIN") {
    navigation.push(
      { name: "All Interviews", href: "/dashboard/admin/interviews", current: pathname.includes("/dashboard/admin/interviews") },
      { name: "All Assessments", href: "/dashboard/admin/assessments", current: pathname.includes("/dashboard/admin/assessments") },
      { name: "All Reports", href: "/dashboard/admin/reports", current: pathname.includes("/dashboard/admin/reports") },
      { name: "Manage Users", href: "/dashboard/admin/users", current: pathname.includes("/dashboard/admin/users") }
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-indigo-600 pb-32">
        <nav className="border-b border-indigo-500 border-opacity-25 bg-indigo-600">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link href="/" className="text-white font-bold text-xl">
                    InterviewAI
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          item.current
                            ? "bg-indigo-700 text-white"
                            : "text-white hover:bg-indigo-500 hover:bg-opacity-75"
                        } rounded-md px-3 py-2 text-sm font-medium`}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <div className="relative ml-3">
                    <div className="flex items-center">
                      <span className="text-white mr-4">{session?.user?.name}</span>
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="inline-flex items-center bg-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:bg-indigo-800"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 p-2 text-indigo-200 hover:bg-indigo-500 hover:bg-opacity-75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`${isMobileMenuOpen ? "block" : "hidden"} md:hidden`}>
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? "bg-indigo-700 text-white"
                      : "text-white hover:bg-indigo-500 hover:bg-opacity-75"
                  } block rounded-md px-3 py-2 text-base font-medium`}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-indigo-700 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="ml-3">
                  <div className="text-base font-medium text-white">
                    {session?.user?.name}
                  </div>
                  <div className="text-sm font-medium text-indigo-300">
                    {session?.user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-indigo-500 hover:bg-opacity-75"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <main className="-mt-32">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white px-5 py-6 shadow sm:px-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}