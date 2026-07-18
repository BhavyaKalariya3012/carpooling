"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/rides/find", label: "Find a Ride" },
  { href: "/rides/offer", label: "Offer a Ride" },
  { href: "/rides/mine", label: "My Rides" },
  { href: "/vehicles", label: "My Vehicles" },
  { href: "/trips", label: "My Trips" },
];

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          CommuteShare
        </Link>

        {!loading && user && (
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-zinc-900">
                {link.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link href="/admin" className="hover:text-zinc-900">
                Admin
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="text-sm text-zinc-500">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
