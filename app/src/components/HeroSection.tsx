import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import heroImage from "@/assets/hero-farming.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={heroImage} 
          alt="Agricultural landscape with farmers harvesting grain" 
          fill
          className="object-cover scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60"></div>
        {/* Animated particles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-agricultural-green/30 rounded-full float"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-trust-blue/30 rounded-full float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-golden-accent/40 rounded-full float" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-60 right-1/3 w-2 h-2 bg-agricultural-green/20 rounded-full float" style={{animationDelay: '1s'}}></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full px-8 py-20">
        <div className="max-w-4xl">
          <div className="mb-6 animate-fade-in">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-agricultural-green/10 text-agricultural-green text-sm font-medium border border-agricultural-green/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-agricultural-green rounded-full mr-2 animate-pulse"></div>
              Powered by Hedera Network
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight text-reveal">
            <span style={{animationDelay: '0.1s'}}>Real-World Yields Meet{" "}</span>
            <span className="gradient-text" style={{animationDelay: '0.3s'}}>
              DeFi Innovation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl leading-relaxed animate-fade-in" style={{animationDelay: '0.5s'}}>
            The first institutional-grade platform connecting agricultural assets with decentralized finance. 
            Farmers access instant liquidity while investors earn sustainable, real-asset-backed yields.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in" style={{animationDelay: '0.7s'}}>
            <Button variant="farmer" size="xl" className="text-lg px-8 py-4 group" asChild>
              <a href="/farmer-solution">
                <span className="group-hover:animate-bounce">🚜</span>
                Farmer Solutions
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="agent" size="xl" className="text-lg px-8 py-4 group" asChild>
              <a href="/investor-login">
                <span className="group-hover:animate-bounce">📈</span>
                Login as Investor
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
          
          {/* Live Metrics Bar */}
          <div className="glass rounded-2xl p-8 border border-white/20 mb-12 card-hover animate-fade-in" style={{animationDelay: '0.9s'}}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="group">
                <div className="text-3xl font-bold text-agricultural-green group-hover:scale-110 transition-transform">8.2%</div>
                <div className="text-sm text-muted-foreground">Current APY</div>
                <div className="w-full h-1 bg-agricultural-green/20 rounded-full mt-2">
                  <div className="h-full bg-agricultural-green rounded-full w-4/5 animate-pulse"></div>
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-trust-blue group-hover:scale-110 transition-transform">$2.4M</div>
                <div className="text-sm text-muted-foreground">TVL</div>
                <div className="w-full h-1 bg-trust-blue/20 rounded-full mt-2">
                  <div className="h-full bg-trust-blue rounded-full w-3/4 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-golden-accent group-hover:scale-110 transition-transform">165%</div>
                <div className="text-sm text-muted-foreground">Collateral Ratio</div>
                <div className="w-full h-1 bg-golden-accent/20 rounded-full mt-2">
                  <div className="h-full bg-golden-accent rounded-full w-full animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-foreground group-hover:scale-110 transition-transform">142</div>
                <div className="text-sm text-muted-foreground">Live Transactions Today</div>
                <div className="w-full h-1 bg-foreground/20 rounded-full mt-2">
                  <div className="h-full bg-foreground rounded-full w-2/3 animate-pulse" style={{animationDelay: '1.5s'}}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{animationDelay: '1.1s'}}>
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-agricultural-green group-hover:scale-150 transition-transform animate-pulse"></div>
              <span className="group-hover:text-agricultural-green transition-colors">Same-day cash advances</span>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-trust-blue group-hover:scale-150 transition-transform animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span className="group-hover:text-trust-blue transition-colors">Blockchain verified</span>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-golden-accent group-hover:scale-150 transition-transform animate-pulse" style={{animationDelay: '1s'}}></div>
              <span className="group-hover:text-golden-accent transition-colors">Fair market prices</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
