import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ValuePropositionSection from "@/components/ValuePropositionSection";
import DualPathwaySection from "@/components/DualPathwaySection";
import InvestorAdvantageSection from "@/components/InvestorAdvantageSection";
import SecurityTrustSection from "@/components/SecurityTrustSection";
import TestimonialSection from "@/components/TestimonialSection";
import ComparisonSection from "@/components/ComparisonSection";
import CallToActionSection from "@/components/CallToActionSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ValuePropositionSection />
        <DualPathwaySection />
        <InvestorAdvantageSection />
        <SecurityTrustSection />
        <TestimonialSection />
        <ComparisonSection />
        <CallToActionSection />
      </main>
      <Footer />
    </div>
  );
}
