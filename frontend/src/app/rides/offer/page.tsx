"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import AddressAutocomplete from "@/components/address-autocomplete";
import type { PlaceSuggestion } from "@/lib/ola-maps";
import type { Ride, Vehicle } from "@/lib/types";

export default function OfferRidePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(1);
  const [farePerSeat, setFarePerSeat] = useState(50);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Ride | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    apiFetch<Vehicle[]>("/api/v1/vehicles")
      .then((data) => {
        setVehicles(data);
        if (data.length > 0) setVehicleId(data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load vehicles"))
      .finally(() => setLoadingVehicles(false));
  }, []);

  function handlePickupSelect(place: PlaceSuggestion) {
    setPickupAddress(place.description);
    setPickupCoords({ lat: place.lat, lng: place.lng });
  }

  function handleDestinationSelect(place: PlaceSuggestion) {
    setDestinationAddress(place.description);
    setDestinationCoords({ lat: place.lat, lng: place.lng });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!pickupCoords || !destinationCoords) {
      setError("Please select both pickup and destination from the suggestions list.");
      return;
    }

    setSubmitting(true);
    try {
      const ride = await apiFetch<Ride>("/api/v1/rides", {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: vehicleId,
          pickup_address: pickupAddress,
          destination_address: destinationAddress,
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          destination_lat: destinationCoords.lat,
          destination_lng: destinationCoords.lng,
          departure_time: new Date(departureTime).toISOString(),
          seats_total: seatsTotal,
          fare_per_seat: farePerSeat,
        }),
      });
      setSuccess(ride);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to publish ride");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loadingVehicles && vehicles.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Register a vehicle first</h1>
        <p className="text-sm text-zinc-600">
          You need at least one registered vehicle before you can offer a ride.
        </p>
        <Link
          href="/vehicles"
          className="mx-auto rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Register a vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Offer a Ride</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Publish your route, date/time, seats, and fare.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Vehicle
          <select
            required
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.model} ({v.registration_number}) · {v.seating_capacity} seats
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AddressAutocomplete label="Pickup location" value={pickupAddress} onSelect={handlePickupSelect} required />
          <AddressAutocomplete
            label="Destination location"
            value={destinationAddress}
            onSelect={handleDestinationSelect}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Departure time
            <input
              required
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Seats offered
            <input
              required
              type="number"
              min={1}
              max={20}
              value={seatsTotal}
              onChange={(e) => setSeatsTotal(Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Fare per seat (₹)
            <input
              required
              type="number"
              min={1}
              step="0.01"
              value={farePerSeat}
              onChange={(e) => setFarePerSeat(Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-700">
            Ride published for {new Date(success.departure_time).toLocaleString()}.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Publishing..." : "Publish ride"}
        </button>
      </form>
    </div>
  );
}
