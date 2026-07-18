"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold text-zinc-900">CommuteShare</h1>
      <p className="max-w-lg text-lg text-zinc-600">
        Discover, offer, book, and track shared daily commutes with verified colleagues
        from your own organization.
      </p>

      {!loading && (
        <div className="flex gap-4">
          {user ? (
            <>
              <Link
                href="/rides/find"
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Find a Ride
              </Link>
              <Link
                href="/rides/offer"
                className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Offer a Ride
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
