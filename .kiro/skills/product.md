---
inclusion: always
name: product
description: CommuteShare product overview, target users, core features, AI-powered enhancements, and hard business constraints. Always load for any work on this codebase.
---

# CommuteShare — Enterprise Carpooling Platform

## What it is
CommuteShare is an enterprise carpooling platform for employees of registered
organizations. It lets colleagues discover, offer, book, and track shared
daily commutes within their own company network, reducing transportation
cost, traffic congestion, and fuel/environmental waste caused by employees
independently driving similar routes.

## Target Users & Personas

### Primary: Priya — Daily Commuter (Employee, rider)
- Commutes 12km each way, owns a car but doesn't always drive.
- Wants to spend less on fuel/parking, ride with a verified same-org
  colleague rather than a stranger from a public carpool app.
- Success = book a verified colleague's ride in under a minute, track it
  live, pay seamlessly.

### Secondary: Raj — Driver (Employee offering rides)
- Drives to office daily with empty seats, wants to offset fuel cost.
- Success = publish a ride quickly (route, seats, fare) and manage
  bookings with minimal friction.

### Tertiary: Anita — Company Administrator (HR/Admin ops)
- Owns the org's carpool program.
- Success = manage employee/vehicle records, configure fuel/travel cost
  settings, monitor participation — **without ever touching live ride
  operations.**

Design every feature and every screen around one of these three personas.
When in doubt about scope for a feature, ask "which persona does this serve,
and does it match their stated success criteria above?"

## Core Features (build these; do not invent scope beyond this list without confirming)

1. **Authentication & Profiles** — org-scoped employee login/signup and
   profile management. Only verified employees of a registered organization
   may access the platform.
2. **Find a Ride** — search by pickup, destination, date, time, seats
   needed. System confirms the route first, then shows matching rides with
   driver, fare, and seat details.
3. **Offer a Ride** — drivers publish a ride with route, date/time, seats,
   and fare. Requires at least one registered vehicle. Route must be
   confirmed before the ride goes live.
4. **Trip Management** — "My Trips" shows booked/published rides through
   their full lifecycle:
   `Booked → Started → In Progress → Completed → Payment Pending → Payment Completed`
5. **Live Trip Tracking** — real-time map of vehicle location, route, ETA,
   pickup/destination markers. **Active only while a trip is "In
   Progress."**
6. **In-Trip Communication** — chat and voice call between driver and
   passengers, for pickup coordination and delay updates.
7. **Payments & Wallet** — Cash, Card, UPI, and Wallet; wallet recharge and
   balance view; Razorpay Test Mode (sandbox only, no real money).
8. **Vehicle Management** — drivers register/manage multiple vehicles
   (model, registration number, seating capacity). Only registered vehicles
   can be used to publish rides.
9. **Ride History & Reports** — history of completed rides plus an
   analytics dashboard: total trips, distance, fuel consumption, cost/km,
   vehicle-wise cost, fuel efficiency trends.
10. **Company Administration** — admin console for employee/vehicle
    records, org-wide carpooling settings, and cost configuration.
    Configuration-only — never touches live ride/trip state.
11. **Saved Places & Settings** — save frequent locations (Home, Office)
    for faster search/publish; quick access to trips, vehicles, payment
    methods, history, and support.

## AI-Powered Enhancements
These extend the base spec — implement after the corresponding core
features are stable (see `structure.md` for phasing).

1. **Intelligent Ride Matching** — rank available rides by a learned
   compatibility score (detour tolerance, punctuality history, mutual
   colleague overlap), not just route/time overlap. Backend scoring
   service: geospatial route-overlap (mapping API) combined with a
   lightweight ranking model — a weighted feature score, or an
   LLM-assisted re-rank via the gemini API given structured ride/user JSON.
2. **Natural Language Ride Search** — parse free text/speech like "ride to
   Whitefield tomorrow 9am, 1 seat" into structured pickup, destination,
   date, time, seat fields via the gemini API (function-calling / structured
   JSON output), then feed the result into the existing Find a Ride search.
3. **AI Cost & Sustainability Insights** — a batch job aggregates
   trip/vehicle data; the gemini API turns the aggregated stats into a short
   natural-language monthly summary of savings, CO2 avoided, and fuel cost
   trends, rendered alongside the charts.

## Hard Constraints (never violate these)
- **Multi-tenant isolation:** every user, vehicle, and ride belongs to
  exactly one registered organization. Enforce this at the query/auth
  level on every read and write — never trust a client-supplied org ID
  alone.
- **Capacity:** one driver, one-or-more passengers per ride, bounded by the
  vehicle's registered seating capacity.
- **Vehicle-first:** vehicle registration is mandatory before a user can
  publish a ride. Do not allow "Offer a Ride" to complete without it.
- **Location privacy:** live location sharing is active *only* while a
  trip's status is "In Progress" — never before or after.
- **Payments are sandbox-only:** Razorpay Test Mode. Never wire in real
  payment credentials or move real money for this build.
- **Admin is read/config-only:** admin actions must never mutate live
  ride/trip state.

## Reference
UI direction mockup: https://link.excalidraw.com/l/65VNwvy7c4X/4OqWfsLBtnt
