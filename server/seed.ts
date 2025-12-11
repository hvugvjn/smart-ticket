/**
 * seed.ts
 * Modifications:
 * - Updated with Indian cities (Mumbai, Bengaluru, Delhi, Chennai, etc.)
 * - Changed pricing to INR
 */
import { db } from "./db";
import { shows, seats } from "@shared/schema";
import { addHours, addMinutes } from "date-fns";

async function seed() {
  console.log("Seeding database with Indian routes...");

  const now = new Date();
  const tomorrow = addHours(now, 24);

  const show1Dept = addHours(tomorrow, 8);
  const show1Arr = addHours(tomorrow, 14);
  const show2Dept = addHours(tomorrow, 10);
  const show2Arr = addHours(tomorrow, 16);
  const show3Dept = addHours(tomorrow, 14);
  const show3Arr = addHours(tomorrow, 20);

  const createdShows = await db.insert(shows).values([
    {
      operatorName: "NeuBus Premium",
      source: "Mumbai",
      destination: "Bengaluru",
      departureTime: show1Dept,
      arrivalTime: show1Arr,
      duration: "6h 00m",
      price: "1800.00",
      vehicleType: "Volvo 9600 Multi-Axle",
      rating: "4.8",
      totalSeats: 40,
      amenities: ["WiFi", "Water Bottle", "Blanket", "Charging Point"],
    },
    {
      operatorName: "SkyLine Express",
      source: "Delhi",
      destination: "Jaipur",
      departureTime: show2Dept,
      arrivalTime: show2Arr,
      duration: "5h 30m",
      price: "1200.00",
      vehicleType: "Scania A/C Sleeper",
      rating: "4.5",
      totalSeats: 36,
      amenities: ["WiFi", "Charging Point", "Reading Light"],
    },
    {
      operatorName: "InterCity Gold",
      source: "Chennai",
      destination: "Hyderabad",
      departureTime: show3Dept,
      arrivalTime: show3Arr,
      duration: "7h 00m",
      price: "2200.00",
      vehicleType: "Mercedes Benz Glider",
      rating: "4.9",
      totalSeats: 42,
      amenities: ["WiFi", "Snacks", "Water Bottle", "Blanket", "Personal TV"],
    },
  ]).returning();

  console.log(`Created ${createdShows.length} trips`);

  for (const show of createdShows) {
    const seatsToCreate = [];
    
    // Lower deck seats (INR pricing)
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 4; c++) {
        if (c === 3) continue;
        
        const isLadies = r < 3;
        seatsToCreate.push({
          showId: show.id,
          seatNumber: `L${r}${String.fromCharCode(64 + c)}`,
          deck: "lower",
          row: r,
          col: c > 2 ? c - 1 : c,
          type: isLadies ? "ladies" : "standard",
          price: isLadies ? "550.00" : "500.00",
          features: isLadies ? ["Ladies Only"] : [],
        });
      }
    }

    // Upper deck seats (INR pricing)
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 3; c++) {
        seatsToCreate.push({
          showId: show.id,
          seatNumber: `U${r}${String.fromCharCode(64 + c)}`,
          deck: "upper",
          row: r,
          col: c,
          type: "sleeper",
          price: "800.00",
          features: ["Power Outlet", "Reading Light"],
        });
      }
    }

    await db.insert(seats).values(seatsToCreate);
    console.log(`Created ${seatsToCreate.length} seats for trip ${show.id}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
