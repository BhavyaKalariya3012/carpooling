"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const appLinks = [
  { href: "/rides/find", label: "Find a Ride" },
  { href: "/rides/offer", label: "Offer a Ride" },
  { href: "/rides/mine", label: "My Rides" },
  { href: "/vehicles", label: "My Vehicles" },
  { href: "/trips", label: "My Trips" },
];

const marketingLinks = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#features", label: "Features" },
  { href: "/#enterprise", label: "Enterprise" },
  { href: "/#about", label: "About" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
        C
      </span>
      <span className="text-lg font-bold text-zinc-900">
        Commute<span className="text-emerald-600">Share</span>
      </span>
    </Link>
  );
}

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Logo />

        {!loading && user ? (
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
            {appLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-emerald-600">
                {link.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link href="/admin" className="hover:text-emerald-600">
                Admin
              </Link>
            )}
          </nav>
        ) : (
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            {marketingLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-emerald-600">
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm text-zinc-500 sm:inline">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
