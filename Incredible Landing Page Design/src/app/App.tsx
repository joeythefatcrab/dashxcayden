import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { ProductDemo } from "./components/ProductDemo";
import { Testimonial } from "./components/Testimonial";
import { CTA } from "./components/CTA";

export default function App() {
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