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

        {/* For Agents Section */}
        <div id="for-agents" className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-trust-blue/5 to-agricultural-green/5 rounded-3xl p-8 card-hover">
                <div className="bg-card rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Agent Benefits</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-trust-blue group-hover:scale-150 transition-transform animate-pulse"></div>
                      <span className="text-sm group-hover:text-trust-blue transition-colors">Earn fees on every transaction</span>
                    </div>
                    <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-agricultural-green group-hover:scale-150 transition-transform animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <span className="text-sm group-hover:text-agricultural-green transition-colors">Digital tools for inventory management</span>
                    </div>
                    <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-golden-accent group-hover:scale-150 transition-transform animate-pulse" style={{animationDelay: '1s'}}></div>
                      <span className="text-sm group-hover:text-golden-accent transition-colors">Verified storage and handling certification</span>
                    </div>
                    <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-accent group-hover:scale-150 transition-transform animate-pulse" style={{animationDelay: '1.5s'}}></div>
                      <span className="text-sm group-hover:text-accent transition-colors">Network of trusted buyers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-trust-blue/10 text-trust-blue text-sm font-medium border border-trust-blue/20 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-trust-blue rounded-full mr-2 animate-pulse"></div>
                  For Agents
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Join our network and{" "}
                <span className="gradient-text">
                  grow your business
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Earn fees for helping farmers access capital while building a sustainable 
                agricultural business. Our platform provides digital tools and connects 
                you with verified buyers.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 group cursor-pointer">
                  <Users className="w-5 h-5 text-trust-blue group-hover:scale-110 transition-transform" />
                  <span className="text-foreground group-hover:text-trust-blue transition-colors">Access to network of farmers and buyers</span>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer">
                  <Shield className="w-5 h-5 text-trust-blue group-hover:scale-110 transition-transform" />
                  <span className="text-foreground group-hover:text-trust-blue transition-colors">Certification and training provided</span>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer">
                  <TrendingUp className="w-5 h-5 text-trust-blue group-hover:scale-110 transition-transform" />
                  <span className="text-foreground group-hover:text-trust-blue transition-colors">Grow your agricultural business</span>
                </div>
              </div>
              <Button variant="agent" size="lg" className="group">
                <span className="group-hover:animate-bounce">📈</span>
                Become an Agent
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
