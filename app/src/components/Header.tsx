'use client';

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-border/50 glass sticky top-0 z-50">
      <div className="w-full px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 group cursor-pointer">
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="Hedarvest Logo" 
                width={32} 
                height={32} 
                className="h-8 w-8 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <span className="text-2xl font-bold text-foreground group-hover:gradient-text transition-all duration-300">Hedarvest</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              How It Works
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-agricultural-green to-trust-blue group-hover:w-full transition-all duration-300"></div>
            </a>
            <a href="#for-farmers" className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              For Farmers
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-agricultural-green to-trust-blue group-hover:w-full transition-all duration-300"></div>
            </a>
          </nav>
          
          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/warehouse">Warehouse Portal</a>
            </Button>
            <Button variant="farmer" size="sm" asChild>
              <a href="/farmer">Login as Farmer</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col space-y-4 pt-4">
              <a 
                href="#how-it-works" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#for-farmers" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                For Farmers
              </a>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/warehouse" onClick={() => setIsMobileMenuOpen(false)}>Warehouse Portal</a>
              </Button>
              <Button variant="farmer" size="sm" className="w-full" asChild>
                <a href="/farmer">Login as Farmer</a>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
