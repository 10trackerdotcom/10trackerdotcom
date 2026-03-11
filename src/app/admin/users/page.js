"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import MetaDataJobs from "@/components/Seo";
import { Search, Users, AlertCircle, Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [areaFilter, setAreaFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && isAdmin) {
      const load = async () => {
        setFetching(true);
        setError(null);
        try {
          const res = await fetch("/api/admin/users");
          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.error || "Failed to load users");
          }
          setUsers(data.users || []);
          setFiltered(data.users || []);
        } catch (err) {
          console.error(err);
          setError(err.message || "Failed to load users");
        } finally {
          setFetching(false);
        }
      };
      load();
    }
  }, [loading, isAdmin]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    const area = areaFilter;

    let next = users;

    if (area !== "all") {
      next = next.filter((u) =>
        u.usage?.areas?.some((a) => a.area === area)
      );
    }

    if (q) {
      next = next.filter((u) => {
        const email = (u.email || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const id = (u.id || "").toLowerCase();
        return (
          email.includes(q) ||
          name.includes(q) ||
          id.includes(q)
        );
      });
    }

    setFiltered(next);
  }, [search, users, areaFilter]);

  const title = useMemo(
    () => "Admin – User usage analytics",
    []
  );

  const allAreas = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      u.usage?.areas?.forEach((a) => {
        if (a.area) set.add(a.area);
      });
    });
    return Array.from(set).sort();
  }, [users]);

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <MetaDataJobs seoTitle={title} seoDescription="Admin users panel" />
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-neutral-900 mb-1">
            Admin access only
          </h1>
          <p className="text-sm text-neutral-600">
            You don&apos;t have permission to view the users panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MetaDataJobs
        seoTitle={title}
        seoDescription="Admin panel listing all registered users from Clerk."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-700" />
              Registered users
            </h1>
            <p className="text-sm text-neutral-600">
              Usage based on Supabase <code className="font-mono text-xs">user_progress</code> table.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-center">
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Clerk user id..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
              />
            </div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
            >
              <option value="all">All categories</option>
              {allAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-100 px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm text-neutral-600">
            <span>
              {fetching
                ? "Loading users..."
                : `${filtered.length} user${
                    filtered.length === 1 ? "" : "s"
                  } found`}
            </span>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-neutral-700 animate-spin mr-2" />
              <span className="text-sm text-neutral-700">Fetching users...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-600">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
                      Clerk user id
                    </th>
                    <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
                      Categories / areas
                    </th>
                    <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden md:table-cell">
                      Total questions
                    </th>
                    <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden md:table-cell">
                      Correct
                    </th>
                    <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden lg:table-cell">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60"
                    >
                      <td className="px-4 sm:px-6 py-3 align-top">
                        <p className="text-xs font-mono text-neutral-800 break-all max-w-xs">
                          {u.id}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell">
                        {u.usage?.areas?.length ? (
                          <div className="space-y-1">
                            {u.usage.areas.map((a) => (
                              <p
                                key={a.area}
                                className="text-xs text-neutral-800"
                              >
                                <span className="font-medium">{a.area}</span>
                                <span className="text-neutral-500">
                                  {" "}
                                  – {a.topicsCount} topics, {a.completed} done,{" "}
                                  {a.correct} correct
                                </span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500">
                            No activity yet
                          </p>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell">
                        <p className="text-xs text-neutral-800">
                          {u.usage?.totalCompleted ?? 0}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell">
                        <p className="text-xs text-neutral-600">
                          {u.usage?.totalCorrect ?? 0}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 align-top hidden lg:table-cell">
                        <p className="text-xs text-neutral-600">
                          {u.usage?.totalPoints ?? 0}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

