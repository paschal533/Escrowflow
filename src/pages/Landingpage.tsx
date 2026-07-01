import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/sections/Hero";
import HowItWorks from "../components/sections/HowItWorks";
import Features from "../components/sections/Features";
import Testimonials from "../components/sections/Testimonials";
import Pricing from "../components/sections/Pricing";
import FAQ from "../components/sections/FAQ";
import FinalCTA from "../components/sections/FinalCTA";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-navy-900 antialiased dark:bg-navy-950 dark:text-white">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}