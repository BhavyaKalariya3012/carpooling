"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { LocationResponse, Ride } from "@/lib/types";

const RideMap = dynamic(() => import("@/components/ride-map"), { ssr: false });

const POLL_INTERVAL_MS = 5000;

export default function TrackRidePage() {
  const params = useParams<{ rideId: string }>();
  const rideId = params.rideId;
  const { user } = useAuth();

  const [ride, setRide] = useState<Ride | null>(null);
  const [location, setLocation] = useState<LocationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const isDriver = ride != null && user != null && ride.driver_id === user.id;

  const loadLocation = useCallback(async () => {
    try {
      const data = await apiFetch<LocationResponse>(`/api/v1/rides/${rideId}/location`);
      setLocation(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load location");
    }
  }, [rideId]);

  useEffect(() => {
    apiFetch<Ride>(`/api/v1/rides/${rideId}`)
      .then(setRide)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load ride"))
      .finally(() => setLoading(false));
  }, [rideId]);

  useEffect(() => {
    loadLocation();
    const interval = setInterval(loadLocation, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadLocation]);

  function startSharing() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser");
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const data = await apiFetch<LocationResponse>(`/api/v1/rides/${rideId}/location`, {
            method: "PUT",
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          setLocation(data);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Failed to share location");
        }
      },
      () => setError("Failed to read device location"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
  }

  function stopSharing() {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-12 text-sm text-zinc-500">Loading ride...</div>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Live Ride Tracking</h1>
        {ride && (
          <p className="mt-1 text-sm text-zinc-600">
            {ride.pickup_address} → {ride.destination_address}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isDriver && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
          <p className="flex-1 text-sm text-zinc-600">
            {sharing ? "Sharing your live location with passengers." : "Share your live location so passengers can track this ride."}
          </p>
          {sharing ? (
            <button
              onClick={stopSharing}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Stop sharing
            </button>
          ) : (
            <button
              onClick={startSharing}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Start sharing
            </button>
          )}
        </div>
      )}

      {location && location.is_sharing_location && location.current_lat != null && location.current_lng != null ? (
        <div className="flex flex-col gap-2">
          <RideMap lat={location.current_lat} lng={location.current_lng} popupText="Driver's current location" />
          <p className="text-xs text-zinc-500">
            Last updated:{" "}
            {location.location_updated_at ? new Date(location.location_updated_at).toLocaleTimeString() : "—"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          {isDriver
            ? "Location sharing is off. Click \"Start sharing\" to broadcast your position."
            : "The driver hasn't started sharing their location yet."}
        </p>
      )}
    </div>
  );
}
