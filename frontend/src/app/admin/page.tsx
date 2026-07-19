"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminStats, AdminUser, AdminRide, AdminBooking } from "@/lib/types";
import { BarChart, DonutChart, UtilizationBar, type ChartPoint } from "@/components/charts";

interface AdminAnalytics {
  rides_by_status: ChartPoint[];
  bookings_by_status: ChartPoint[];
  rides_per_day: ChartPoint[];
  revenue_per_day: ChartPoint[];
  seats_offered: number;
  seats_booked: number;
}

const statusLabels: Record<string, string> = {
  booked: "Booked",
  started: "Started",
  in_progress: "In Progress",
  completed: "Completed",
  payment_pending: "Payment Pending",
  payment_completed: "Payment Completed",
  cancelled: "Cancelled",
  published: "Published",
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadAll() {
    setError(null);
    try {
      const [s, an, u, r, b] = await Promise.all([
        apiFetch<AdminStats>("/api/v1/admin/stats"),
        apiFetch<AdminAnalytics>("/api/v1/admin/analytics"),
        apiFetch<AdminUser[]>("/api/v1/admin/users"),
        apiFetch<AdminRide[]>("/api/v1/admin/rides"),
        apiFetch<AdminBooking[]>("/api/v1/admin/bookings"),
      ]);
      setStats(s);
      setAnalytics(an);
      setUsers(u);
      setRides(r);
      setBookings(b);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function handleToggleActive(targetUser: AdminUser) {
    setBusyUserId(targetUser.id);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/users/${targetUser.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handlePromote(targetUser: AdminUser) {
    setBusyUserId(targetUser.id);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/users/${targetUser.id}/promote`, { method: "POST" });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to promote user");
    } finally {
      setBusyUserId(null);
    }
  }

  if (authLoading || (loading && !error)) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-zinc-500">Loading admin dashboard...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Organization-wide overview. Data here is scoped to your organization only.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Users" value={stats.total_users} />
          <StatCard label="Drivers" value={stats.total_drivers} />
          <StatCard label="Vehicles" value={stats.total_vehicles} />
          <StatCard label="Rides" value={stats.total_rides} />
          <StatCard label="Active Rides" value={stats.active_rides} />
          <StatCard label="Bookings" value={stats.total_bookings} />
          <StatCard label="Completed Bookings" value={stats.completed_bookings} />
          <StatCard label="Total Revenue" value={`₹${stats.total_revenue.toFixed(2)}`} />
        </div>
      )}

      {analytics && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-900">Analytics</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Rides by status">
              <DonutChart data={analytics.rides_by_status} />
            </ChartCard>
            <ChartCard title="Bookings by status">
              <DonutChart data={analytics.bookings_by_status} />
            </ChartCard>
            <ChartCard title="Rides per day (last 14 days)">
              <BarChart data={analytics.rides_per_day} color="#059669" />
            </ChartCard>
            <ChartCard title="Revenue per day (last 14 days)">
              <BarChart data={analytics.revenue_per_day} color="#f97316" valuePrefix="₹" />
            </ChartCard>
            <ChartCard title="Seat utilization">
              <UtilizationBar offered={analytics.seats_offered} booked={analytics.seats_booked} />
            </ChartCard>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Users</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">{u.full_name}</td>
                  <td className="px-4 py-2 text-zinc-600">{u.email}</td>
                  <td className="px-4 py-2 capitalize text-zinc-600">{u.role}</td>
                  <td className="px-4 py-2">
                    <span className={u.is_active ? "text-green-700" : "text-red-600"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handlePromote(u)}
                          disabled={busyUserId === u.id}
                          className="text-xs font-medium text-zinc-700 hover:underline disabled:opacity-50"
                        >
                          Promote
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busyUserId === u.id || u.id === user.id}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Rides</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Departure</th>
                <th className="px-4 py-2">Seats</th>
                <th className="px-4 py-2">Fare</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">
                    {r.pickup_address} → {r.destination_address}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">{new Date(r.departure_time).toLocaleString()}</td>
                  <td className="px-4 py-2 text-zinc-600">
                    {r.seats_available}/{r.seats_total}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">₹{r.fare_per_seat}</td>
                  <td className="px-4 py-2 text-zinc-600">{statusLabels[r.status] ?? r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Bookings</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Seats</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">{b.seats_booked}</td>
                  <td className="px-4 py-2 text-zinc-600">{b.amount != null ? `₹${b.amount}` : "—"}</td>
                  <td className="px-4 py-2 text-zinc-600">{statusLabels[b.status] ?? b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="flex-1">{children}</div>
    </div>
  );
}
