import { db } from "./db";
import { shows, seats } from "@shared/schema";
import { addHours, addMinutes } from "date-fns";

async function seed() {
  console.log("Seeding database...");

  const now = new Date();
  const tomorrow = addHours(now, 24);

  const show1Dept = addHours(tomorrow, 8);
  const show1Arr = addHours(tomorrow, 12);
  const show2Dept = addHours(tomorrow, 10);
  const show2Arr = addHours(tomorrow, 14);
  const show3Dept = addHours(tomorrow, 14);
  const show3Arr = addHours(tomorrow, 18);

  const createdShows = await db.insert(shows).values([
    {
      operatorName: "NeuBus Premium",
      source: "New York",
      destination: "Boston",
      departureTime: show1Dept,
      arrivalTime: show1Arr,
      duration: "4h 00m",
      price: "45.00",
      vehicleType: "Volvo 9600 Multi-Axle",
      rating: "4.8",
      totalSeats: 40,
      amenities: ["WiFi", "Water Bottle", "Blanket", "Charging Point"],
    },
    {
      operatorName: "SkyLine Express",
      source: "New York",
      destination: "Boston",
      departureTime: show2Dept,
      arrivalTime: show2Arr,
      duration: "4h 10m",
      price: "38.00",
      vehicleType: "Scania A/C Sleeper",
      rating: "4.5",
      totalSeats: 36,
      amenities: ["WiFi", "Charging Point", "Reading Light"],
    },
    {
      operatorName: "InterCity Gold",
      source: "New York",
      destination: "Washington DC",
      departureTime: show3Dept,
      arrivalTime: show3Arr,
      duration: "4h 00m",
      price: "55.00",
      vehicleType: "Mercedes Benz Glider",
      rating: "4.9",
      totalSeats: 42,
      amenities: ["WiFi", "Snacks", "Water Bottle", "Blanket", "Personal TV"],
    },
  ]).returning();

  console.log(`Created ${createdShows.length} shows`);

  for (const show of createdShows) {
    const seatsToCreate = [];
    
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
    console.log(`Created ${seatsToCreate.length} seats for show ${show.id}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
