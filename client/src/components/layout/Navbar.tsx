/**
 * Navbar.tsx
 * Modifications:
 * - Updated for email-based authentication
 * - Shows user email when authenticated
 */
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, User, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SupportModal } from "@/components/modules/SupportModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { isAuthenticated, currentUser, setShowOtpModal, logout, isAdmin } = useAuth();
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
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
          <Link href="/">
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              Book Tickets
            </span>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                Admin
              </span>
            </Link>
          )}
          <Link href="/my-trips">
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              My Trips
            </span>
          </Link>
          <button
            onClick={() => setShowSupport(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            Support
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                aria-label={isAuthenticated ? "Verified account" : "Unverified account"}
              >
                <ShieldCheck className={`w-5 h-5 ${isAuthenticated ? "text-green-500" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isAuthenticated ? "Verified account" : "Login to verify your account"}
            </TooltipContent>
          </Tooltip>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-full px-6 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-foreground font-medium backdrop-blur-md"
                  data-testid="button-user-menu"
                >
                  <User className="w-4 h-4 mr-2" />
                  {currentUser?.email?.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  {currentUser?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link href="/my-trips">
                  <DropdownMenuItem className="cursor-pointer">My Trips</DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => setShowSupport(true)} className="cursor-pointer">
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setShowOtpModal(true)}
              className="rounded-full px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-foreground font-medium backdrop-blur-md"
              data-testid="button-login"
            >
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </nav>

      <SupportModal open={showSupport} onOpenChange={setShowSupport} />
    </>
  );
}
