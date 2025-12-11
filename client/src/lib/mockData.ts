import { addMinutes, format } from "date-fns";

export interface Seat {
  id: string;
  row: number;
  col: number;
  type: "standard" | "sleeper" | "ladies" | "xl";
  status: "available" | "booked" | "locked" | "selected";
  price: number;
  label: string;
  deck: "lower" | "upper";
  features?: string[];
}

export interface Trip {
  id: string;
  operator: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  type: string;
  rating: number;
  seatsAvailable: number;
  totalSeats: number;
  amenities: string[];
}

export const generateSeats = (tripId: string): Seat[] => {
  const seats: Seat[] = [];
  const rows = 10;
  const cols = 4; // 2 + 2 layout

  // Lower Deck (Seater)
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      // Skip aisle
      if (c === 3) continue;
      
      const isLadies = r < 3;
      const isBooked = Math.random() > 0.7;
      const isLocked = !isBooked && Math.random() > 0.9;
      
      seats.push({
        id: `L-${r}-${c}`,
        row: r,
        col: c > 2 ? c - 1 : c,
        type: isLadies ? "ladies" : "standard",
        status: isBooked ? "booked" : isLocked ? "locked" : "available",
        price: isLadies ? 550 : 500,
        label: `L${r}${String.fromCharCode(64 + c)}`,
        deck: "lower",
        features: isLadies ? ["Ladies Only"] : []
      });
    }
  }

  // Upper Deck (Sleeper)
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= 3; c++) {
       // 1 + 2 layout
       const isBooked = Math.random() > 0.6;
       
       seats.push({
        id: `U-${r}-${c}`,
        row: r,
        col: c,
        type: "sleeper",
        status: isBooked ? "booked" : "available",
        price: 800,
        label: `U${r}${String.fromCharCode(64 + c)}`,
        deck: "upper",
        features: ["Power Outlet", "Reading Light"]
      });
    }
  }

  return seats;
};

export const trips: Trip[] = [
  {
    id: "T-101",
    operator: "NeuBus Premium",
    source: "New York",
    destination: "Boston",
    departureTime: format(new Date(), "HH:mm"),
    arrivalTime: format(addMinutes(new Date(), 240), "HH:mm"),
    duration: "4h 00m",
    price: 45,
    type: "Volvo 9600 Multi-Axle",
    rating: 4.8,
    seatsAvailable: 12,
    totalSeats: 40,
    amenities: ["WiFi", "Water Bottle", "Blanket", "Charging Point"]
  },
  {
    id: "T-102",
    operator: "SkyLine Express",
    source: "New York",
    destination: "Boston",
    departureTime: format(addMinutes(new Date(), 60), "HH:mm"),
    arrivalTime: format(addMinutes(new Date(), 310), "HH:mm"),
    duration: "4h 10m",
    price: 38,
    type: "Scania A/C Sleeper",
    rating: 4.5,
    seatsAvailable: 28,
    totalSeats: 36,
    amenities: ["WiFi", "Charging Point", "Reading Light"]
  },
  {
    id: "T-103",
    operator: "InterCity Gold",
    source: "New York",
    destination: "Washington DC",
    departureTime: format(addMinutes(new Date(), 120), "HH:mm"),
    arrivalTime: format(addMinutes(new Date(), 360), "HH:mm"),
    duration: "4h 00m",
    price: 55,
    type: "Mercedes Benz Glider",
    rating: 4.9,
    seatsAvailable: 5,
    totalSeats: 42,
    amenities: ["WiFi", "Snacks", "Water Bottle", "Blanket", "Personal TV"]
  }
];

export const getSmartRecommendations = (seats: Seat[], count: number) => {
  // Simple logic to find adjacent available seats
  const available = seats.filter(s => s.status === "available");
  // Sort by price or row
  return available.slice(0, count); 
};
