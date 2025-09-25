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
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl">
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-agricultural-green/10 text-agricultural-green text-sm font-medium">
              Powered by Hedera Network
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Real-World Yields Meet{" "}
            <span className="bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent">
              DeFi Innovation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            The first institutional-grade platform connecting agricultural assets with decentralized finance. 
            Farmers access instant liquidity while investors earn sustainable, real-asset-backed yields.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button variant="farmer" size="lg" className="text-lg px-8 py-4">
              🚜 Farmer Solutions
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="agent" size="lg" className="text-lg px-8 py-4" asChild>
              <a href="/investor-dashboard">
                📈 Investor Dashboard
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>
          
          {/* Live Metrics Bar */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-agricultural-green">8.2%</div>
                <div className="text-sm text-muted-foreground">Current APY</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-trust-blue">$2.4M</div>
                <div className="text-sm text-muted-foreground">TVL</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-golden-accent">165%</div>
                <div className="text-sm text-muted-foreground">Collateral Ratio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">142</div>
                <div className="text-sm text-muted-foreground">Live Transactions Today</div>
              </div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-agricultural-green"></div>
              <span>Same-day cash advances</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-trust-blue"></div>
              <span>Blockchain verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-golden-accent"></div>
              <span>Fair market prices</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
