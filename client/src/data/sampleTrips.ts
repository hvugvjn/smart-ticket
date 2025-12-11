export interface PickupPoint {
  id: string;
  label: string;
  time?: string;
}

export interface DropPoint {
  id: string;
  label: string;
  time?: string;
}

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
  pickupPoints: PickupPoint[];
  dropPoints: DropPoint[];
}

export const sampleTrips: SampleTrip[] = [
  {
    id: 1,
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
    pickupPoints: [
      { id: "p1", label: "Dadar Bus Depot", time: "08:00" },
      { id: "p2", label: "Borivali Station", time: "08:30" },
      { id: "p3", label: "Thane Toll Plaza", time: "09:00" },
    ],
    dropPoints: [
      { id: "d1", label: "Majestic Bus Stand", time: "14:00" },
      { id: "d2", label: "Electronic City", time: "14:30" },
      { id: "d3", label: "Whitefield", time: "15:00" },
    ],
  },
  {
    id: 2,
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
    pickupPoints: [
      { id: "p1", label: "ISBT Kashmere Gate", time: "10:00" },
      { id: "p2", label: "Dhaula Kuan", time: "10:30" },
      { id: "p3", label: "Gurugram Toll", time: "11:00" },
    ],
    dropPoints: [
      { id: "d1", label: "Sindhi Camp Bus Stand", time: "15:30" },
      { id: "d2", label: "Railway Station", time: "16:00" },
    ],
  },
  {
    id: 3,
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
    pickupPoints: [
      { id: "p1", label: "Koyambedu Bus Stand", time: "14:00" },
      { id: "p2", label: "Tambaram", time: "14:30" },
    ],
    dropPoints: [
      { id: "d1", label: "MGBS Bus Stand", time: "21:00" },
      { id: "d2", label: "Secunderabad", time: "21:30" },
      { id: "d3", label: "Gachibowli", time: "22:00" },
    ],
  },
  {
    id: 4,
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
    pickupPoints: [
      { id: "p1", label: "Dadar Bus Depot", time: "06:00" },
      { id: "p2", label: "Vashi Toll", time: "06:30" },
    ],
    dropPoints: [
      { id: "d1", label: "Shivaji Nagar", time: "10:00" },
      { id: "d2", label: "Swargate", time: "10:15" },
    ],
  },
  {
    id: 5,
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
    pickupPoints: [
      { id: "p1", label: "Majestic Bus Stand", time: "22:00" },
      { id: "p2", label: "Silk Board", time: "22:30" },
    ],
    dropPoints: [
      { id: "d1", label: "Koyambedu Bus Stand", time: "04:00" },
      { id: "d2", label: "T Nagar", time: "04:30" },
    ],
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
