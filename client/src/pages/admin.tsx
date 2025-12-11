import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, DollarSign, Bus, TrendingUp, AlertCircle, Activity, ShieldX } from "lucide-react";

const data = [
  { name: 'Mon', revenue: 4000, bookings: 240 },
  { name: 'Tue', revenue: 3000, bookings: 139 },
  { name: 'Wed', revenue: 2000, bookings: 980 },
  { name: 'Thu', revenue: 2780, bookings: 390 },
  { name: 'Fri', revenue: 1890, bookings: 480 },
  { name: 'Sat', revenue: 2390, bookings: 380 },
  { name: 'Sun', revenue: 3490, bookings: 430 },
];

const occupancyData = [
  { name: 'Booked', value: 400 },
  { name: 'Available', value: 300 },
  { name: 'Locked', value: 50 },
  { name: 'Blocked', value: 20 },
];

const COLORS = ['#06b6d4', '#1e293b', '#f59e0b', '#ef4444'];

export default function Admin() {
  const { isAdmin, isAuthenticated, setShowOtpModal } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAdmin && isAuthenticated) {
      setLocation("/");
    }
  }, [isAdmin, isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Navbar />
        <div className="main-content max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold">Admin Access Only</h1>
          <p className="text-muted-foreground">
            This page is restricted to administrators. Please log in with an admin account to continue.
          </p>
          <Button 
            onClick={() => setShowOtpModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Login as Admin
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Navbar />
        <div className="main-content max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin dashboard. Please contact an administrator if you believe this is an error.
          </p>
          <Button 
            onClick={() => setLocation("/")}
            variant="outline"
            className="bg-white/5 border-white/10"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <div className="main-content max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Real-time overview of fleet operations and revenue.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/5 border-white/10">Export Report</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Add Trip</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">$45,231.89</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">+2350</div>
              <p className="text-xs text-muted-foreground">+180.1% from last month</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Bus className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">12</div>
              <p className="text-xs text-muted-foreground">4 trips completing soon</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-green-500">99.9%</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          <Card className="col-span-1 lg:col-span-4 glass-card border-white/5">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: "#06b6d4" }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3 glass-card border-white/5">
            <CardHeader>
              <CardTitle>Current Occupancy</CardTitle>
              <CardDescription>Real-time seat status across fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-4">
                 {occupancyData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                       {entry.name}
                    </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Alerts */}
        <div className="space-y-4">
           <h3 className="text-xl font-display font-bold">Live Alerts</h3>
           <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                 <h4 className="font-bold text-destructive">High Concurrency Detected</h4>
                 <p className="text-sm text-muted-foreground">Trip T-103 is experiencing unusual traffic (200+ concurrent requests). Auto-scaling initiated.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
