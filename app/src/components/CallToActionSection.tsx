import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Shield, ShoppingCart } from "lucide-react";

const CallToActionSection = () => {
  const userTypes = [
    {
      icon: Users,
      title: "I'm a Farmer",
      description: "Get immediate cash for your harvest",
      buttonText: "Find an Agent",
      variant: "farmer" as const,
      features: ["Same-day cash", "Fair prices", "Secure storage"]
    },
    {
      icon: TrendingUp,
      title: "Become an Agent",
      description: "Join our network and earn fees",
      buttonText: "Apply Now",
      variant: "agent" as const,
      features: ["Earn fees", "Digital tools", "Certification"]
    },
    {
      icon: Shield,
      title: "Learn About Investing",
      description: "Support agricultural finance",
      buttonText: "Learn More",
      variant: "accent" as const,
      features: ["Impact investing", "Blockchain verified", "Agricultural growth"]
    },
    {
      icon: ShoppingCart,
      title: "Access Verified Grain",
      description: "Purchase quality grain",
      buttonText: "Browse Grain",
      variant: "outline" as const,
      features: ["Quality verified", "Transparent pricing", "Direct from farmers"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Join the Real-World Asset{" "}
            <span className="bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent">
              Revolution
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're farming the land or farming yields, start building the future of agriculture finance today
          </p>
        </div>
        
        {/* Primary CTAs */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-agricultural-green/10 to-golden-accent/10 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">🚜</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Start Farming</h3>
            <p className="text-muted-foreground mb-6">Get instant liquidity for your harvest with same-day cash advances</p>
            <Button variant="farmer" size="lg" className="w-full">
              Find an Agent Near You
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-trust-blue/10 to-agricultural-green/10 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">📈</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Start Investing</h3>
            <p className="text-muted-foreground mb-6">Earn sustainable yields backed by real agricultural assets</p>
            <Button variant="agent" size="lg" className="w-full">
              View Investment Dashboard
            </Button>
          </div>
        </div>
        
        {/* Secondary CTAs */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
            <div className="text-3xl mb-3">🤝</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Become an Agent</h4>
            <p className="text-sm text-muted-foreground mb-4">Earn fees for connecting farmers to liquidity</p>
            <Button variant="accent" className="w-full">
              Join Agent Network
            </Button>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
            <div className="text-3xl mb-3">🌾</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Access Verified Grain</h4>
            <p className="text-sm text-muted-foreground mb-4">Buy from transparent, certified sources</p>
            <Button variant="outline" className="w-full">
              Browse Marketplace
            </Button>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-agricultural-green/10 via-trust-blue/10 to-golden-accent/10 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Questions? We're here to help
            </h3>
            <p className="text-muted-foreground mb-6">
              Contact our team to learn more about how Hedarvest can transform your agricultural business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg">
                Contact Support
              </Button>
              <Button variant="ghost" size="lg">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
