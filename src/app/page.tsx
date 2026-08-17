import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { JobListSection } from "@/components/site/JobListSection";
import { AboutSection } from "@/components/site/AboutSection";
import { CoreValuesSection } from "@/components/site/CoreValuesSection";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <JobListSection />
        <AboutSection />
        <CoreValuesSection />
      </main>
      <Footer />
    </>
  );
}
