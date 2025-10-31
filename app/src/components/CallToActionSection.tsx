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
    <section className="py-20 animated-bg">
      <div className="w-full px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Join the Real-World Asset{" "}
            <span className="gradient-text">
              Revolution
            </span>
          </h2>
          <p className="text-xl text-muted-foreground w-full">
            Whether you're farming the land or farming yields, start building the future of agriculture finance today
          </p>
        </div>
        
        {/* All CTAs in one grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-16">
          <div className="bg-gradient-to-br from-agricultural-green/10 to-golden-accent/10 rounded-3xl p-8 text-center card-hover group">
            <div className="text-6xl mb-6 group-hover:animate-bounce">🚜</div>
            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-agricultural-green transition-colors">Farmer Login</h3>
            <p className="text-muted-foreground mb-6 group-hover:text-foreground transition-colors">Access your farming dashboard and manage your crops</p>
            <Button variant="farmer" size="lg" className="w-full group" asChild>
              <a href="/farmer">
                <span className="group-hover:animate-bounce">🚜</span>
                Login as Farmer
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-trust-blue/10 to-agricultural-green/10 rounded-3xl p-8 text-center card-hover group">
            <div className="text-6xl mb-6 group-hover:animate-bounce">📈</div>
            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-trust-blue transition-colors">Start Investing</h3>
            <p className="text-muted-foreground mb-6 group-hover:text-foreground transition-colors">Earn sustainable yields backed by real agricultural assets</p>
            <Button variant="agent" size="lg" className="w-full group">
              <span className="group-hover:animate-bounce">📈</span>
              View Investment Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-agricultural-green/10 to-golden-accent/10 rounded-3xl p-8 text-center card-hover group">
            <div className="text-6xl mb-6 group-hover:animate-bounce">🌾</div>
            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-agricultural-green transition-colors">Access Verified Grain</h3>
            <p className="text-muted-foreground mb-6 group-hover:text-foreground transition-colors">Buy from transparent, certified sources</p>
            <Button variant="outline" size="lg" className="w-full group">
              <span className="group-hover:animate-bounce">🌾</span>
              Browse Marketplace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-3xl p-8 text-center card-hover group">
            <div className="text-6xl mb-6 group-hover:animate-bounce">🪙</div>
            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-emerald-600 transition-colors">Test Token Faucet</h3>
            <p className="text-muted-foreground mb-6 group-hover:text-foreground transition-colors">Get free USDC tokens for testing on Hedera testnet</p>
            <Button variant="outline" size="lg" className="w-full group" asChild>
              <a href="/faucet">
                <span className="group-hover:animate-bounce">🪙</span>
                Get Test Tokens
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
            <div className="glass rounded-2xl p-8 w-full card-hover">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Questions? We're here to help
            </h3>
            <p className="text-muted-foreground mb-6">
              Contact our team to learn more about how Hedarvest can transform your agricultural business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="group">
                <span className="group-hover:animate-bounce">💬</span>
                Contact Support
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" size="lg" className="group">
                <span className="group-hover:animate-bounce">📅</span>
                Schedule a Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
