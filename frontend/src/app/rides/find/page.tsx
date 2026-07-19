"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch, ApiError } from "@/lib/api";
import AddressAutocomplete from "@/components/address-autocomplete";
import { fetchPlaceSuggestions, type PlaceSuggestion } from "@/lib/ola-maps";
import type { Ride } from "@/lib/types";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });

interface NLSearchResult {
  pickup: string | null;
  destination: string | null;
  date: string | null;
  time: string | null;
  seats_needed: number;
}

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

  const [nlText, setNlText] = useState("");
  const [nlBusy, setNlBusy] = useState(false);
  const [nlNote, setNlNote] = useState<string | null>(null);

  function handlePickupSelect(place: PlaceSuggestion) {
    setPickupAddress(place.description);
    setPickupCoords({ lat: place.lat, lng: place.lng });
  }

  function handleDestinationSelect(place: PlaceSuggestion) {
    setDestinationAddress(place.description);
    setDestinationCoords({ lat: place.lat, lng: place.lng });
  }

  async function runSearch(
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    dateStr: string,
    seats: number
  ) {
    setSearching(true);
    setResults(null);
    try {
      const data = await apiFetch<Ride[]>("/api/v1/rides/search", {
        method: "POST",
        body: JSON.stringify({
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          date: dateStr ? new Date(dateStr).toISOString() : null,
          seats_needed: seats,
        }),
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pickupCoords || !destinationCoords) {
      setError("Please select both pickup and destination from the suggestions list.");
      return;
    }

    await runSearch(pickupCoords, destinationCoords, date, seatsNeeded);
  }

  // Natural Language Search: parse free text via Gemini, resolve the place
  // names to coordinates through the map autocomplete, fill the form, and
  // run the search automatically.
  async function handleSmartSearch(e: React.FormEvent) {
    e.preventDefault();
    const text = nlText.trim();
    if (!text || nlBusy) return;

    setNlBusy(true);
    setNlNote(null);
    setError(null);
    try {
      const parsed = await apiFetch<NLSearchResult>("/api/v1/ai/parse-search", {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      let pCoords: { lat: number; lng: number } | null = null;
      let dCoords: { lat: number; lng: number } | null = null;

      if (parsed.pickup) {
        const [best] = await fetchPlaceSuggestions(parsed.pickup);
        if (best) {
          pCoords = { lat: best.lat, lng: best.lng };
          setPickupAddress(best.description);
          setPickupCoords(pCoords);
        }
      }
      if (parsed.destination) {
        const [best] = await fetchPlaceSuggestions(parsed.destination);
        if (best) {
          dCoords = { lat: best.lat, lng: best.lng };
          setDestinationAddress(best.description);
          setDestinationCoords(dCoords);
        }
      }

      const parsedDate = parsed.date ?? "";
      if (parsedDate) setDate(parsedDate);
      const seats = parsed.seats_needed > 0 ? parsed.seats_needed : 1;
      setSeatsNeeded(seats);

      const bits: string[] = [];
      if (parsed.pickup) bits.push(`from ${parsed.pickup}`);
      if (parsed.destination) bits.push(`to ${parsed.destination}`);
      if (parsed.date) bits.push(`on ${parsed.date}`);
      if (parsed.time) bits.push(`around ${parsed.time}`);
      bits.push(`${seats} seat(s)`);
      setNlNote(`Understood: ${bits.join(", ")}. Review below and adjust if needed.`);

      if (pCoords && dCoords) {
        await runSearch(pCoords, dCoords, parsedDate, seats);
      } else if (!parsed.pickup && !parsed.destination) {
        setNlNote("I couldn't find a pickup or destination in that. Try naming both places.");
      }
    } catch (err) {
      setNlNote(
        err instanceof ApiError ? err.message : "The AI search is unavailable right now."
      );
    } finally {
      setNlBusy(false);
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

      <form
        onSubmit={handleSmartSearch}
        className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <label className="text-sm font-semibold text-emerald-800">
            Search in plain English
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            placeholder='e.g. "ride to Nirma University tomorrow 9am, 2 seats"'
            className="min-w-0 flex-1 rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={nlBusy || !nlText.trim()}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {nlBusy ? "Understanding…" : "Smart search"}
          </button>
        </div>
        {nlNote && <p className="text-xs text-emerald-800">{nlNote}</p>}
      </form>

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

        {(pickupCoords || destinationCoords) && (
          <RouteMap pickup={pickupCoords} destination={destinationCoords} />
        )}

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
