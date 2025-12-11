import { storage } from "./storage";
import { log } from "./index";

export function startExpiryWorker() {
  const INTERVAL = 10000;

  setInterval(async () => {
    try {
      const expiredCount = await storage.expireOldBookings();
      if (expiredCount > 0) {
        log(`Expired ${expiredCount} pending bookings`, "expiry-worker");
      }
    } catch (error: any) {
      log(`Error expiring bookings: ${error.message}`, "expiry-worker");
    }
  }, INTERVAL);

  log("Expiry worker started", "expiry-worker");
}
