import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, User, ShieldCheck } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 bg-background/0 backdrop-blur-sm border-b border-white/5 transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <span className="font-display font-bold text-background text-xl tracking-tighter">N</span>
        </div>
        <Link href="/">
          <span className="font-display font-bold text-2xl tracking-tight text-foreground cursor-pointer hover:text-primary transition-colors">
            NexTravel
          </span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Book Tickets</span></Link>
        <Link href="/admin"><span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Admin</span></Link>
        <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">My Trips</span>
        <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Support</span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5">
          <ShieldCheck className="w-5 h-5" />
        </Button>
        <Button className="rounded-full px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-foreground font-medium backdrop-blur-md">
          <User className="w-4 h-4 mr-2" />
          Login
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </nav>
  );
}
