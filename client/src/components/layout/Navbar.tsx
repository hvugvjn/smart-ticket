/**
 * Navbar.tsx
 * Modifications:
 * - Updated for email-based authentication
 * - Shows user email when authenticated
 * - Added mobile menu toggle functionality
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, User, ShieldCheck, LogOut, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SupportModal } from "@/components/modules/SupportModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, currentUser, setShowOtpModal, logout, isAdmin } = useAuth();
  const [showSupport, setShowSupport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function updateHeaderHeight() {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty("--site-header-height", `${height}px`);
      }
    }
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        mobileButtonRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !mobileButtonRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    console.log(`menu toggle => ${mobileMenuOpen ? "open" : "closed"}`);
  }, [mobileMenuOpen]);

  const handleMobileToggle = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <>
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 bg-background/0 backdrop-blur-sm border-b border-white/5 transition-all duration-300">
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
              {t("nav.home")}
            </span>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                {t("nav.admin")}
              </span>
            </Link>
          )}
          <Link href="/my-trips">
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              {t("nav.myTrips")}
            </span>
          </Link>
          <button
            onClick={() => setShowSupport(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            Support
          </button>
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
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

          <Button
            ref={mobileButtonRef}
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleMobileToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleMobileToggle();
              }
            }}
            aria-haspopup="true"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label="Open menu"
            data-testid="button-mobile-menu"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          role="menu"
          aria-hidden={!mobileMenuOpen}
          className={`
            absolute right-4 top-16 md:hidden
            bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[180px]
            transition-all duration-200 ease-out z-[9999]
            ${mobileMenuOpen 
              ? "opacity-100 translate-y-0 pointer-events-auto" 
              : "opacity-0 -translate-y-2 pointer-events-none"
            }
          `}
        >
          <ul className="py-2">
            <li role="menuitem">
              <Link href="/my-trips" onClick={() => setMobileMenuOpen(false)}>
                <span className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors cursor-pointer">
                  My Trips
                </span>
              </Link>
            </li>
            <li role="menuitem">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSupport(true);
                }}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
              >
                Support
              </button>
            </li>
            {isAdmin && (
              <li role="menuitem">
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors cursor-pointer">
                    Admin
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <SupportModal open={showSupport} onOpenChange={setShowSupport} />
    </>
  );
}
