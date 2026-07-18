"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Booking } from "@/lib/types";
import type { RazorpaySuccessResponse } from "@/lib/razorpay";

interface PaymentOrderResponse {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount_paise: number;
  currency: string;
}

const statusLabels: Record<string, string> = {
  booked: "Booked",
  started: "Started",
  in_progress: "In Progress",
  completed: "Completed",
  payment_pending: "Payment Pending",
  payment_completed: "Payment Completed",
  cancelled: "Cancelled",
};

export default function MyTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function loadTrips() {
    try {
      const data = await apiFetch<Booking[]>("/api/v1/bookings/my-trips");
      setTrips(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await apiFetch(`/api/v1/bookings/${id}/cancel`, { method: "POST" });
      await loadTrips();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel trip");
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePay(bookingId: string) {
    setError(null);
    setPayingId(bookingId);
    try {
      const order = await apiFetch<PaymentOrderResponse>(
        `/api/v1/payments/bookings/${bookingId}/order`,
        { method: "POST" }
      );

      if (typeof window === "undefined" || !window.Razorpay) {
        setError("Payment widget failed to load. Please refresh and try again.");
        return;
      }

      const checkout = new window.Razorpay({
        key: order.razorpay_key_id,
        amount: order.amount_paise,
        currency: order.currency,
        order_id: order.razorpay_order_id,
        name: "CommuteShare",
        description: "Ride fare payment",
        prefill: { name: user?.full_name, email: user?.email },
        theme: { color: "#18181b" },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await apiFetch("/api/v1/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                booking_id: bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            await loadTrips();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Payment verification failed");
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
      checkout.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start payment");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">My Trips</h1>
        <p className="mt-1 text-sm text-zinc-600">Track your booked rides through their lifecycle.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-zinc-500">No trips booked yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {trip.seats_booked} seat(s) booked
                  {trip.amount != null && ` · ₹${trip.amount}`}
                </p>
                <p className="text-xs text-zinc-500">
                  Status: {statusLabels[trip.status] ?? trip.status}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {trip.status === "booked" && (
                  <button
                    onClick={() => handleCancel(trip.id)}
                    disabled={cancellingId === trip.id}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {cancellingId === trip.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
                {(trip.status === "started" || trip.status === "in_progress") && (
                  <Link href={`/rides/${trip.ride_id}/track`} className="text-xs font-medium text-zinc-700 hover:underline">
                    Track ride
                  </Link>
                )}
                {trip.status === "payment_pending" && (
                  <button
                    onClick={() => handlePay(trip.id)}
                    disabled={payingId === trip.id}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {payingId === trip.id ? "Opening..." : "Pay Now"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
