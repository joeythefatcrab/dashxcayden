"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { BookOpen, TrendingUp, MessageSquare, Sparkles, Heart, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Upload Content",
    description: "Upload your curriculum (PDF, DOCX, CSV) and we'll transform it into interactive, organized lessons.",
    from: "#D4A5A5",
    to: "#C9A29E",
  },
  {
    icon: TrendingUp,
    title: "Paced Learning",
    description: "Each child progresses at their own speed. Unlock lessons naturally as they're ready.",
    from: "#A8B5A1",
    to: "#8FA388",
  },
  {
    icon: MessageSquare,
    title: "Instant Feedback",
    description: "Automatic grading gives kids immediate encouragement and shows them where to review.",
    from: "#C8A99A",
    to: "#B89888",
  },
  {
    icon: Sparkles,
    title: "Interactive Quizzes",
    description: "Hover over terms to see definitions, origins, and images. Vocabulary made engaging.",
    from: "#B8C5AA",
    to: "#A8B5A1",
  },
  {
    icon: Heart,
    title: "Parent Updates",
    description: "Receive gentle daily or weekly emails celebrating progress and highlighting achievements.",
    from: "#D4A5A5",
    to: "#C9A29E",
  },
  {
    icon: BarChart3,
    title: "Progress Reports",
    description: "Generate beautiful reports for your records or supervisor submissions with one click.",
    from: "#A8B5A1",
    to: "#8FA388",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="h-full p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-gray-100 hover:border-[#A8B5A1] transition-colors shadow-lg hover:shadow-xl relative overflow-hidden"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md"
          style={{ background: `linear-gradient(135deg, ${feature.from}, ${feature.to})` }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 bg-[#D8E5D3] rounded-full border border-[#A8B5A1] mb-6"
          >
            <span className="text-sm text-[#5A7B52]">Powerful features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl tracking-tight mb-6"
          >
            Everything You Need
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Simple tools that work beautifully together
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
