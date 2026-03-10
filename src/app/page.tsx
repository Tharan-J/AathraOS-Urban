import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import OpportunityDomains from "@/components/landing/OpportunityDomains";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <OpportunityDomains />
      <HowItWorks />
      <Footer />
    </main>
  );
}
