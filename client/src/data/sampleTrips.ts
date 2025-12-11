export interface SampleTrip {
  id: number;
  operatorName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  vehicleType: string;
  rating: string;
  totalSeats: number;
  amenities: string[];
}

export const sampleTrips: SampleTrip[] = [
  {
    id: 101,
    operatorName: "NeuBus Premium",
    source: "Mumbai",
    destination: "Bengaluru",
    departureTime: "2025-12-13T08:00:00.000Z",
    arrivalTime: "2025-12-13T14:00:00.000Z",
    duration: "6h 00m",
    price: "1800.00",
    vehicleType: "Volvo 9600 Multi-Axle",
    rating: "4.80",
    totalSeats: 40,
    amenities: ["WiFi", "Water Bottle", "Blanket", "Charging Point"],
  },
  {
    id: 102,
    operatorName: "SkyLine Express",
    source: "Delhi",
    destination: "Jaipur",
    departureTime: "2025-12-13T10:00:00.000Z",
    arrivalTime: "2025-12-13T15:30:00.000Z",
    duration: "5h 30m",
    price: "1200.00",
    vehicleType: "Scania A/C Sleeper",
    rating: "4.50",
    totalSeats: 36,
    amenities: ["WiFi", "Charging Point", "Reading Light"],
  },
  {
    id: 103,
    operatorName: "InterCity Gold",
    source: "Chennai",
    destination: "Hyderabad",
    departureTime: "2025-12-13T14:00:00.000Z",
    arrivalTime: "2025-12-13T21:00:00.000Z",
    duration: "7h 00m",
    price: "2200.00",
    vehicleType: "Mercedes Benz Glider",
    rating: "4.90",
    totalSeats: 42,
    amenities: ["WiFi", "Snacks", "Water Bottle", "Blanket", "Personal TV"],
  },
  {
    id: 104,
    operatorName: "Raj Travels",
    source: "Mumbai",
    destination: "Pune",
    departureTime: "2025-12-14T06:00:00.000Z",
    arrivalTime: "2025-12-14T10:00:00.000Z",
    duration: "4h 00m",
    price: "800.00",
    vehicleType: "Volvo B11R",
    rating: "4.60",
    totalSeats: 40,
    amenities: ["WiFi", "Water Bottle"],
  },
  {
    id: 105,
    operatorName: "Royal Cruiser",
    source: "Bengaluru",
    destination: "Chennai",
    departureTime: "2025-12-13T22:00:00.000Z",
    arrivalTime: "2025-12-14T04:00:00.000Z",
    duration: "6h 00m",
    price: "1500.00",
    vehicleType: "Sleeper Coach",
    rating: "4.40",
    totalSeats: 36,
    amenities: ["Blanket", "Charging Point"],
  },
];

export function filterTrips(
  trips: SampleTrip[],
  from: string,
  to: string,
  date?: string
): SampleTrip[] {
  return trips
    .filter((trip) => {
      const sourceMatch = trip.source.toLowerCase() === from.toLowerCase();
      const destMatch = trip.destination.toLowerCase() === to.toLowerCase();
      
      if (!sourceMatch || !destMatch) return false;
      
      if (date && trip.departureTime) {
        const tripDate = trip.departureTime.split("T")[0];
        return tripDate === date;
      }
      
      return true;
    })
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
}
