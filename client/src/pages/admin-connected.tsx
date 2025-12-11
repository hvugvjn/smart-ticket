/**
 * admin-connected.tsx
 * Modifications:
 * - Changed all "Show/Shows" terminology to "Trip/Trips"
 * - Changed currency from USD to INR
 * - Updated labels and default values
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, type Show } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Bus, Plus } from "lucide-react";
import { format } from "date-fns";
import { formatINR } from "@/lib/currency";
import { LocationSelect, INDIAN_CITIES } from "@/components/LocationSelect";

export default function AdminConnected() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [source, setSource] = useState("Mumbai");
  const [destination, setDestination] = useState("Bengaluru");
  const queryClient = useQueryClient();

  const { data: trips = [] } = useQuery({
    queryKey: ["shows"],
    queryFn: () => api.getShows(),
  });

  const createTripMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const departureTime = new Date(formData.get("departureTime") as string);
      const arrivalTime = new Date(formData.get("arrivalTime") as string);

      const res = await fetch("/api/admin/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorName: formData.get("operatorName"),
          source,
          destination,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          duration: formData.get("duration"),
          price: formData.get("price"),
          vehicleType: formData.get("vehicleType"),
          rating: formData.get("rating") || "4.5",
          totalSeats: parseInt(formData.get("totalSeats") as string) || 40,
          amenities: (formData.get("amenities") as string).split(",").map(a => a.trim()),
        }),
      });

      if (!res.ok) throw new Error("Failed to create trip");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      setIsCreateOpen(false);
      toast({
        title: "Trip Created",
        description: "New trip has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTrip = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTripMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage trips and view operations.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-trip" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operatorName">Operator / Route Name</Label>
                    <Input id="operatorName" name="operatorName" required placeholder="NeuBus Premium" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Input id="vehicleType" name="vehicleType" required placeholder="Volvo 9600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source City</Label>
                    <LocationSelect
                      value={source}
                      onChange={setSource}
                      placeholder="Select source"
                      excludeCity={destination}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination City</Label>
                    <LocationSelect
                      value={destination}
                      onChange={setDestination}
                      placeholder="Select destination"
                      excludeCity={source}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureTime">Departure Time</Label>
                    <Input id="departureTime" name="departureTime" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalTime">Arrival Time</Label>
                    <Input id="arrivalTime" name="arrivalTime" type="datetime-local" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" name="duration" required placeholder="6h 00m" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (INR)</Label>
                    <Input id="price" name="price" type="number" step="1" required placeholder="1800" defaultValue="1800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalSeats">Total Seats</Label>
                    <Input id="totalSeats" name="totalSeats" type="number" defaultValue="40" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                  <Input id="amenities" name="amenities" placeholder="WiFi, Water Bottle, Charging Point" />
                </div>

                <Button type="submit" className="w-full" disabled={createTripMutation.isPending}>
                  {createTripMutation.isPending ? "Creating..." : "Create Trip"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Bus className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{trips.length}</div>
              <p className="text-xs text-muted-foreground">Active routes available</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold">All Trips</h3>
          <div className="grid grid-cols-1 gap-4">
            {trips.map((trip) => (
              <Card key={trip.id} className="glass-card border-white/5" data-testid={`trip-card-${trip.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{trip.operatorName}</CardTitle>
                      <CardDescription>
                        {trip.source} → {trip.destination}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatINR(trip.price)}</p>
                      <p className="text-xs text-muted-foreground">{trip.totalSeats} seats</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Departure</p>
                      <p className="font-medium">{format(new Date(trip.departureTime), "PPp")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Arrival</p>
                      <p className="font-medium">{format(new Date(trip.arrivalTime), "PPp")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{trip.duration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vehicle</p>
                      <p className="font-medium">{trip.vehicleType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
