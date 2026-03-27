"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const {
    isAdminAuthenticated,
    adminLogout,
    isOrganiserAuthenticated,
    organiser,
    organiserLogout,
    isSiteUserAuthenticated,
    siteUser,
    siteUserLogout,
  } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allNavLinks = [
    { path: "/", label: "Home" },
    { path: "/events", label: "Find Events" },
    { path: "/list-event", label: "List Your Event" },
    { path: "/about", label: "About Us" },
    { path: "/contact", label: "Contact Us" },
  ];

  // Hide "List Your Event" for site users
  const navLinks = isSiteUserAuthenticated
    ? allNavLinks.filter((link) => link.path !== "/list-event")
    : allNavLinks;

  const isActive = (path: string) => pathname === path;

  const activeUserName = isOrganiserAuthenticated
    ? organiser?.name
    : isSiteUserAuthenticated
      ? siteUser?.name
      : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-tight">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="EDUVENTS"
              className="h-41 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-base font-medium transition-colors hover:text-primary font-league-gothic tracking-wide ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin logged in */}
            {isAdminAuthenticated &&
              !isOrganiserAuthenticated &&
              !isSiteUserAuthenticated && (
                <button
                  onClick={adminLogout}
                  className="text-base font-medium text-red-500 hover:text-red-600 transition-colors font-league-gothic tracking-wide"
                >
                  Logout
                </button>
              )}

            {/* Organiser logged in - Account dropdown */}
            {isOrganiserAuthenticated && organiser && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic tracking-wide"
                >
                  <User className="h-4 w-4" />
                  {organiser.name}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/organiser/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Dashboard
                    </Link>
                    <Link
                      href="/organiser/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Events
                    </Link>
                    <Link
                      href="/organiser/account"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Account Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        organiserLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Site User logged in - Account dropdown */}
            {isSiteUserAuthenticated && siteUser && !isOrganiserAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic tracking-wide"
                >
                  <User className="h-4 w-4" />
                  {siteUser.name}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/site-user/favourites"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Favourites
                    </Link>
                    <Link
                      href="/site-user/booked-events"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Booked Events
                    </Link>
                    <Link
                      href="/site-user/account"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Account Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        siteUserLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Not logged in - Show Register & Login */}
            {!isOrganiserAuthenticated &&
              !isSiteUserAuthenticated &&
              !isAdminAuthenticated && (
                <>
                  <Link
                    href="/register"
                    className="text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic tracking-wide"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="text-base font-medium bg-primary text-white px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-league-gothic tracking-wide"
                  >
                    Login
                  </Link>
                </>
              )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-medium transition-colors hover:text-primary font-league-gothic uppercase tracking-wide ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Admin - mobile */}
              {isAdminAuthenticated &&
                !isOrganiserAuthenticated &&
                !isSiteUserAuthenticated && (
                  <button
                    onClick={() => {
                      adminLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-base font-medium text-red-500 hover:text-red-600 transition-colors text-left font-league-gothic uppercase tracking-wide"
                  >
                    Logout
                  </button>
                )}

              {/* Organiser - mobile */}
              {isOrganiserAuthenticated && organiser && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Signed in as{" "}
                    <span className="font-medium text-foreground">
                      {organiser.name}
                    </span>
                  </p>
                  <Link href="/organiser/dashboard" onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic uppercase tracking-wide mb-3">
                    My Dashboard
                  </Link>
                  <Link href="/organiser/account" onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic uppercase tracking-wide mb-3">
                    Account Settings
                  </Link>
                  <button
                    onClick={() => { organiserLogout(); setIsMenuOpen(false); }}
                    className="text-base font-medium text-red-500 hover:text-red-600 transition-colors text-left font-league-gothic uppercase tracking-wide">
                    Logout
                  </button>
                </div>
              )}

              {/* Site User - mobile */}
              {isSiteUserAuthenticated && siteUser && !isOrganiserAuthenticated && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Signed in as{" "}
                    <span className="font-medium text-foreground">
                      {siteUser.name}
                    </span>
                  </p>
                  <Link href="/site-user/favourites" onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic uppercase tracking-wide mb-3">
                    My Favourites
                  </Link>
                  <Link href="/site-user/booked-events" onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic uppercase tracking-wide mb-3">
                    My Booked Events
                  </Link>
                  <Link href="/site-user/account" onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic uppercase tracking-wide mb-3">
                    Account Settings
                  </Link>
                  <button
                    onClick={() => { siteUserLogout(); setIsMenuOpen(false); }}
                    className="text-base font-medium text-red-500 hover:text-red-600 transition-colors text-left font-league-gothic uppercase tracking-wide">
                    Logout
                  </button>
                </div>
              )}

              {/* Not logged in - mobile */}
              {!isOrganiserAuthenticated &&
                !isSiteUserAuthenticated &&
                !isAdminAuthenticated && (
                  <div className="border-t border-border pt-4 flex flex-col space-y-3">
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}
                      className="text-base font-medium text-muted-foreground hover:text-primary transition-colors font-league-gothic uppercase tracking-wide">
                      Register
                    </Link>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}
                      className="text-base font-medium text-primary hover:text-primary/80 transition-colors font-league-gothic uppercase tracking-wide">
                      Login
                    </Link>
                  </div>
                )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
