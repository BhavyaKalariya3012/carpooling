"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  async function loadVehicles() {
    try {
      const data = await apiFetch<Vehicle[]>("/api/v1/vehicles");
      setVehicles(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch<Vehicle>("/api/v1/vehicles", {
        method: "POST",
        body: JSON.stringify({
          model,
          registration_number: registrationNumber,
          seating_capacity: seatingCapacity,
        }),
      });
      setModel("");
      setRegistrationNumber("");
      setSeatingCapacity(4);
      await loadVehicles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to register vehicle");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/v1/vehicles/${id}`, { method: "DELETE" });
      await loadVehicles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove vehicle");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">My Vehicles</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Register at least one vehicle before you can offer a ride.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Register a new vehicle</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Model
            <input
              required
              placeholder="Honda City"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Registration number
            <input
              required
              placeholder="KA01AB1234"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Seating capacity
            <input
              type="number"
              required
              min={1}
              max={20}
              value={seatingCapacity}
              onChange={(e) => setSeatingCapacity(Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Registering..." : "Register vehicle"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Registered vehicles</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-sm text-zinc-500">No vehicles registered yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{v.model}</p>
                  <p className="text-xs text-zinc-500">
                    {v.registration_number} · {v.seating_capacity} seats
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
