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

export default function AdminConnected() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: shows = [] } = useQuery({
    queryKey: ["shows"],
    queryFn: () => api.getShows(),
  });

  const createShowMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const departureTime = new Date(formData.get("departureTime") as string);
      const arrivalTime = new Date(formData.get("arrivalTime") as string);

      const res = await fetch("/api/admin/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorName: formData.get("operatorName"),
          source: formData.get("source"),
          destination: formData.get("destination"),
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

      if (!res.ok) throw new Error("Failed to create show");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      setIsCreateOpen(false);
      toast({
        title: "Show Created",
        description: "New show has been added successfully",
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

  const handleCreateShow = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createShowMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage shows and view operations.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-show" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Show</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateShow} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operatorName">Operator Name</Label>
                    <Input id="operatorName" name="operatorName" required placeholder="NeuBus Premium" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Input id="vehicleType" name="vehicleType" required placeholder="Volvo 9600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input id="source" name="source" required placeholder="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input id="destination" name="destination" required placeholder="Boston" />
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
                    <Input id="duration" name="duration" required placeholder="4h 00m" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input id="price" name="price" type="number" step="0.01" required placeholder="45.00" />
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

                <Button type="submit" className="w-full" disabled={createShowMutation.isPending}>
                  {createShowMutation.isPending ? "Creating..." : "Create Show"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
              <Bus className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{shows.length}</div>
              <p className="text-xs text-muted-foreground">Active trips available</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold">All Shows</h3>
          <div className="grid grid-cols-1 gap-4">
            {shows.map((show) => (
              <Card key={show.id} className="glass-card border-white/5" data-testid={`show-card-${show.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{show.operatorName}</CardTitle>
                      <CardDescription>
                        {show.source} → {show.destination}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${show.price}</p>
                      <p className="text-xs text-muted-foreground">{show.totalSeats} seats</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Departure</p>
                      <p className="font-medium">{format(new Date(show.departureTime), "PPp")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Arrival</p>
                      <p className="font-medium">{format(new Date(show.arrivalTime), "PPp")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{show.duration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vehicle</p>
                      <p className="font-medium">{show.vehicleType}</p>
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
