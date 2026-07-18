export interface User {
  id: string;
  full_name: string;
  email: string;
  organization_id: string;
  role: string;
}

export interface Vehicle {
  id: string;
  model: string;
  registration_number: string;
  seating_capacity: number;
}

export interface Ride {
  id: string;
  driver_id: string;
  vehicle_id: string;
  pickup_address: string;
  destination_address: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  fare_per_seat: number;
  status: string;
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: string;
  amount?: number | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
}

export interface AdminStats {
  total_users: number;
  total_drivers: number;
  total_vehicles: number;
  total_rides: number;
  active_rides: number;
  total_bookings: number;
  completed_bookings: number;
  total_revenue: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface AdminRide {
  id: string;
  driver_id: string;
  pickup_address: string;
  destination_address: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  fare_per_seat: number;
  status: string;
}

export interface AdminBooking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: string;
  amount: number | null;
}

export interface LocationResponse {
  ride_id: string;
  is_sharing_location: boolean;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
}
