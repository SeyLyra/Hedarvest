import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Shield, Zap } from "lucide-react";

const ValuePropositionSection = () => {
  return (
    <section className="py-20">
      <div className="w-full px-8">
        {/* Bridge Between Physical and Digital Assets */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Bridge Between{" "}
            <span className="bg-gradient-to-r from-agricultural-green to-trust-blue bg-clip-text text-transparent">
              Physical and Digital Assets
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
              <div className="w-16 h-16 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🚜</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">For Farmers</h3>
              <p className="text-muted-foreground">Instant liquidity against stored crops - no credit checks, no delays</p>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
              <div className="w-16 h-16 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">For Investors</h3>
              <p className="text-muted-foreground">Sustainable yields backed by tangible agricultural collateral</p>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
              <div className="w-16 h-16 bg-gradient-to-r from-golden-accent to-trust-blue rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Technology</h3>
              <p className="text-muted-foreground">Fully transparent operations secured by Hedera blockchain</p>
            </div>
          </div>
        </div>

        {/* For Agents Section */}
        <div id="for-agents" className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-trust-blue/5 to-agricultural-green/5 rounded-3xl p-8">
                <div className="bg-card rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Agent Benefits</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-trust-blue"></div>
                      <span className="text-sm">Earn fees on every transaction</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-agricultural-green"></div>
                      <span className="text-sm">Digital tools for inventory management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-golden-accent"></div>
                      <span className="text-sm">Verified storage and handling certification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <span className="text-sm">Network of trusted buyers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-trust-blue/10 text-trust-blue text-sm font-medium">
                  For Agents
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Join our network and{" "}
                <span className="bg-gradient-to-r from-trust-blue to-agricultural-green bg-clip-text text-transparent">
                  grow your business
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Earn fees for helping farmers access capital while building a sustainable 
                agricultural business. Our platform provides digital tools and connects 
                you with verified buyers.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-trust-blue" />
                  <span className="text-foreground">Access to network of farmers and buyers</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-trust-blue" />
                  <span className="text-foreground">Certification and training provided</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-trust-blue" />
                  <span className="text-foreground">Grow your agricultural business</span>
                </div>
              </div>
              <Button variant="agent" size="lg">
                Become an Agent
              </Button>
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
