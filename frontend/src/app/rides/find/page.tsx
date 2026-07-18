"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import AddressAutocomplete from "@/components/address-autocomplete";
import type { PlaceSuggestion } from "@/lib/ola-maps";
import type { Ride } from "@/lib/types";

export default function FindRidePage() {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [date, setDate] = useState("");
  const [seatsNeeded, setSeatsNeeded] = useState(1);

  const [results, setResults] = useState<Ride[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookedRideId, setBookedRideId] = useState<string | null>(null);

  function handlePickupSelect(place: PlaceSuggestion) {
    setPickupAddress(place.description);
    setPickupCoords({ lat: place.lat, lng: place.lng });
  }

  function handleDestinationSelect(place: PlaceSuggestion) {
    setDestinationAddress(place.description);
    setDestinationCoords({ lat: place.lat, lng: place.lng });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pickupCoords || !destinationCoords) {
      setError("Please select both pickup and destination from the suggestions list.");
      return;
    }

    setSearching(true);
    setResults(null);
    try {
      const data = await apiFetch<Ride[]>("/api/v1/rides/search", {
        method: "POST",
        body: JSON.stringify({
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          destination_lat: destinationCoords.lat,
          destination_lng: destinationCoords.lng,
          date: date ? new Date(date).toISOString() : null,
          seats_needed: seatsNeeded,
        }),
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleBook(rideId: string) {
    setBookingId(rideId);
    setError(null);
    try {
      await apiFetch("/api/v1/bookings", {
        method: "POST",
        body: JSON.stringify({ ride_id: rideId, seats_booked: seatsNeeded }),
      });
      setBookedRideId(rideId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Booking failed");
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Find a Ride</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Search by pickup, destination, date, and seats needed. Results are limited to
          rides from your organization.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AddressAutocomplete label="Pickup location" value={pickupAddress} onSelect={handlePickupSelect} required />
          <AddressAutocomplete
            label="Destination location"
            value={destinationAddress}
            onSelect={handleDestinationSelect}
            required
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Seats needed
            <input
              type="number"
              min={1}
              max={20}
              value={seatsNeeded}
              onChange={(e) => setSeatsNeeded(Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={searching}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search rides"}
        </button>
      </form>

      {results !== null && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            {results.length === 0 ? "No matching rides found" : `${results.length} ride(s) found`}
          </h2>
          <ul className="flex flex-col gap-2">
            {results.map((ride) => (
              <li
                key={ride.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {ride.pickup_address} → {ride.destination_address}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(ride.departure_time).toLocaleString()} · {ride.seats_available} seat(s)
                    available · ₹{ride.fare_per_seat}/seat
                  </p>
                </div>
                <button
                  onClick={() => handleBook(ride.id)}
                  disabled={bookingId === ride.id || bookedRideId === ride.id}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {bookedRideId === ride.id
                    ? "Booked"
                    : bookingId === ride.id
                      ? "Booking..."
                      : "Book"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
