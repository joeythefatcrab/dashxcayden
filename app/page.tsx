import { Hero } from "@/components/landing/Hero";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { Features } from "@/components/landing/Features";
import { Testimonial } from "@/components/landing/Testimonial";
import { CTA } from "@/components/landing/CTA";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Hero />
      <ProductDemo />
      <Features />
      <Testimonial />
      <CTA />
    </div>
  );
}
