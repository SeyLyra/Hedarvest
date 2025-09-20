import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const SecurityTrustSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Enterprise-Grade{" "}
            <span className="bg-gradient-to-r from-trust-blue to-agricultural-green bg-clip-text text-transparent">
              Security
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built with institutional standards for transparency, security, and reliability
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-trust-blue to-agricultural-green rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Hedera Network</h3>
            <p className="text-muted-foreground leading-relaxed">
              Enterprise-grade blockchain with near-zero fees and institutional adoption
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-trust-blue/10 text-trust-blue text-xs font-medium">
              ✓ Council Governed
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-agricultural-green to-golden-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <FileCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Smart Contract Audits</h3>
            <p className="text-muted-foreground leading-relaxed">
              Third-party verified smart contracts ensuring security and reliability
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-agricultural-green/10 text-agricultural-green text-xs font-medium">
              ✓ Audited Q4 2024
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-golden-accent to-trust-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Insurance Protection</h3>
            <p className="text-muted-foreground leading-relaxed">
              Collateral protection program safeguarding investor assets
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-golden-accent/10 text-golden-accent text-xs font-medium">
              ✓ $1M Coverage
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-trust-blue to-golden-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Full Transparency</h3>
            <p className="text-muted-foreground leading-relaxed">
              All transactions immutable on HCS with real-time verification
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-trust-blue/10 text-trust-blue text-xs font-medium">
              ✓ Immutable Records
            </div>
          </div>
        </div>
        
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-8 flex-wrap justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-trust-blue"></div>
              <span>SOC 2 Type II Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-agricultural-green"></div>
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-golden-accent"></div>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityTrustSection;
