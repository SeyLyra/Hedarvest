import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Shield, Zap, ArrowRight } from "lucide-react";

const ValuePropositionSection = () => {
  return (
    <section className="py-20">
      <div className="w-full px-8">
        {/* Bridge Between Physical and Digital Assets */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Bridge Between{" "}
            <span className="gradient-text">
              Physical and Digital Assets
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 card-hover group">
              <div className="w-16 h-16 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-bounce">🚜</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-agricultural-green transition-colors">For Farmers</h3>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors">Instant liquidity against stored crops - no credit checks, no delays</p>
              <div className="mt-4 w-full h-1 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 card-hover group">
              <div className="w-16 h-16 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-bounce">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-trust-blue transition-colors">For Investors</h3>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors">Sustainable yields backed by tangible agricultural collateral</p>
              <div className="mt-4 w-full h-1 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 card-hover group">
              <div className="w-16 h-16 bg-gradient-to-r from-golden-accent to-trust-blue rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-bounce">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-golden-accent transition-colors">Technology</h3>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors">Fully transparent operations secured by Hedera blockchain</p>
              <div className="mt-4 w-full h-1 bg-gradient-to-r from-golden-accent to-trust-blue rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>


        {/* Technology Highlight */}
        <div className="text-center bg-gradient-to-r from-trust-blue/5 via-agricultural-green/5 to-golden-accent/5 rounded-3xl p-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-trust-blue/10 text-trust-blue text-sm font-medium">
                Powered by Hedera Network
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Every transaction is{" "}
              <span className="bg-gradient-to-r from-trust-blue to-agricultural-green bg-clip-text text-transparent">
                securely recorded and verifiable
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Built on the Hedera Network, our platform ensures complete transparency and 
              immutable records of all transactions, storage, and grain movements. Trust through technology.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
