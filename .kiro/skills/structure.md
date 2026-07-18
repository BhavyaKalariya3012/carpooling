---
inclusion: always
name: structure
description: CommuteShare build order and phasing — what to implement first, second, and last. Consult before starting any new feature to confirm it's in scope for the current phase.
---

# Development Priorities

Build in this order. Don't jump ahead to a later phase's features while an
earlier phase has open gaps — the AI layer and polish assume the MVP
underneath them is solid.

## Phase 1 — Core MVP
- Auth + org scoping
- Vehicle registration
- Offer a Ride
- Find a Ride, with route confirmation
- Basic booking + My Trips

## Phase 2 — AI Layer
- Natural Language Ride Search (gemini API)
- Intelligent Ride Matching (gemini API re-rank / scoring)
- Live trip tracking
- Chat (in-trip communication)
- Payments / wallet (Razorpay Test Mode)

## Phase 3 — Polish
- AI Cost & Sustainability Insights
- Reports & analytics dashboard
- Ride notifications / cancellation
- UX refinement
- Edge cases: no matches found, cancelled drivers, payment failures

## When starting a new spec or task
1. Check which phase the requested feature belongs to (above).
2. Confirm its prerequisites from earlier phases actually exist in the
   codebase — e.g. don't build Live Trip Tracking before a trip can reach
   "In Progress" status via Trip Management.
3. Cross-check against the constraints in `product.md` before writing
   requirements or code — multi-tenant scoping, vehicle-first publishing,
   and location-privacy rules apply regardless of phase.
