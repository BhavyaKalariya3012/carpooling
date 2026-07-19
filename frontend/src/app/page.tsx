"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(user ? "/rides/find" : "/signup");
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              🌱 Verified colleagues only
            </span>
            <h1 className="text-4xl font-bold leading-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Commute Smarter,
              <br />
              <span className="text-emerald-600">Together.</span>
            </h1>
            <p className="max-w-md text-lg text-zinc-600">
              Share rides, save costs, and meet your community on your daily journey — with
              verified colleagues from your own organization.
            </p>

            <form
              onSubmit={handleHeroSearch}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:rounded-full sm:p-2"
            >
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  placeholder="Pickup location"
                  className="min-w-0 flex-1 rounded-full px-4 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none"
                />
                <span className="hidden text-zinc-300 sm:inline">→</span>
                <input
                  placeholder="Destination"
                  className="min-w-0 flex-1 rounded-full px-4 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Find Rides
              </button>
            </form>

            {!loading && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {user ? (
                  <Link
                    href="/rides/offer"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Offer a ride instead →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/organizations/register"
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Register your organization →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hero illustration card */}
          <div className="relative">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-500">Ride Matched!</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Live
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
                <div className="flex -space-x-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white ring-2 ring-white">
                    S
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white ring-2 ring-white">
                    D
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Sarah &amp; David</p>
                  <p className="text-xs text-zinc-500">Sharing a ride to the office</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  Pickup · MG Road
                </div>
                <div className="ml-1 h-6 border-l-2 border-dashed border-zinc-200" />
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  Drop · Tech Park
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 text-white">
                <span className="text-sm">Split fare</span>
                <span className="text-lg font-bold">₹60 each</span>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 -z-10 h-full w-full rounded-3xl bg-emerald-200/40" />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-zinc-900">How it Works</h2>
          <p className="mt-2 text-zinc-600">Simple &amp; safe: Post. Match. Commute.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Post Your Trip",
              body: "Sign up, then define your route and schedule in seconds.",
              icon: "📍",
            },
            {
              step: "2",
              title: "Match & Connect",
              body: "See verified colleagues on the same route and book instantly.",
              icon: "💬",
            },
            {
              step: "3",
              title: "Commute & Save",
              body: "Share the ride, split the cost, track live, and rate the trip.",
              icon: "💸",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                {s.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                <span className="text-emerald-600">{s.step}.</span> {s.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why CommuteShare */}
      <section id="features" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Why CommuteShare?</h2>
            <p className="mt-2 text-zinc-600">
              Built for organizations that care about cost, safety, and sustainability.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Smart Profiles",
                body: "Ride only with verified members of your own organization.",
                icon: "🛡️",
              },
              {
                title: "Smart Route Matching",
                body: "Geospatial matching finds colleagues already on your route.",
                icon: "🗺️",
              },
              {
                title: "Cost Savings",
                body: "Split fares automatically and cut your daily commute cost.",
                icon: "💰",
              },
              {
                title: "Reduce Carbon Footprint",
                body: "Fewer cars on the road means lower emissions for everyone.",
                icon: "🌍",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise band */}
      <section id="enterprise" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-emerald-600 px-8 py-14 text-center text-white">
          <h2 className="max-w-2xl text-3xl font-bold">
            Bring verified carpooling to your whole organization
          </h2>
          <p className="max-w-xl text-emerald-50">
            Register your company domain and let every employee discover, offer, and track
            shared commutes — safely within your network.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/organizations/register"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Register your organization
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-white/60 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="about" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Loved by daily commuters</h2>
            <p className="mt-2 text-zinc-600">Real colleagues, real shared journeys.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Sarah T.",
                role: "Product Designer",
                quote:
                  "I book a colleague's ride in under a minute and split the fare automatically. My commute cost dropped by half.",
              },
              {
                name: "Rajesh H.",
                role: "Engineer",
                quote:
                  "Offering my empty seats covers most of my fuel. Managing bookings is effortless.",
              },
              {
                name: "Anita M.",
                role: "HR Operations",
                quote:
                  "Onboarding our organization took minutes, and the admin dashboard gives me the participation view I need.",
              },
            ].map((t) => (
              <figure key={t.name} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-600">“{t.quote}”</p>
                <figcaption className="mt-auto flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900">{t.name}</span>
                    <span className="block text-xs text-zinc-500">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
