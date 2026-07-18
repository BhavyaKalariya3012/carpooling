"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { Ride } from "@/lib/types";

const statusLabels: Record<string, string> = {
  published: "Published",
  started: "Started",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MyOfferedRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadRides() {
    try {
      const data = await apiFetch<Ride[]>("/api/v1/rides");
      setRides(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRides();
  }, []);

  async function handleStart(rideId: string) {
    setBusyId(rideId);
    setError(null);
    try {
      await apiFetch(`/api/v1/rides/${rideId}/start`, { method: "POST" });
      await loadRides();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start ride");
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(rideId: string) {
    setBusyId(rideId);
    setError(null);
    try {
      await apiFetch(`/api/v1/rides/${rideId}/complete`, { method: "POST" });
      await loadRides();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to complete ride");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">My Offered Rides</h1>
        <p className="mt-1 text-sm text-zinc-600">Start, track, and complete the rides you're driving.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : rides.length === 0 ? (
        <p className="text-sm text-zinc-500">You haven't offered any rides yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rides.map((ride) => (
            <li key={ride.id} className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {ride.pickup_address} → {ride.destination_address}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(ride.departure_time).toLocaleString()} · {ride.seats_available}/{ride.seats_total} seats ·{" "}
                  {statusLabels[ride.status] ?? ride.status}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {ride.status === "published" && (
                  <button
                    onClick={() => handleStart(ride.id)}
                    disabled={busyId === ride.id}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Start
                  </button>
                )}
                {(ride.status === "started" || ride.status === "in_progress") && (
                  <>
                    <Link
                      href={`/rides/${ride.id}/track`}
                      className="text-xs font-medium text-zinc-700 hover:underline"
                    >
                      Track
                    </Link>
                    <button
                      onClick={() => handleComplete(ride.id)}
                      disabled={busyId === ride.id}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Complete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
