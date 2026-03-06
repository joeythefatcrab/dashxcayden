"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 bg-gradient-to-br from-[#C8A99A] via-[#D4A5A5] to-[#B8C5AA] overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A8B5A1] rounded-full blur-3xl opacity-25" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4A5A5] rounded-full blur-3xl opacity-25" />

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center gap-6 mb-8"
        >
          {[...Array(3)].map((_, i) => (
            <Sparkles key={i} className="w-7 h-7 text-[#5A7B52] opacity-80" />
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl text-gray-900 mb-6 tracking-tight"
        >
          Start Your Journey Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-700 mb-10 leading-relaxed"
        >
          Join thousands of families making homeschool simple and joyful
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <Link href="/signup-gate">
            <motion.div
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="px-8 py-4 bg-gradient-to-r from-[#7A9B76] to-[#A8B5A1] text-white rounded-full text-lg flex items-center gap-2 shadow-lg cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </Link>

          <a href="https://calendly.com/cc283-rice/30min?month=2025-11" target="_blank" rel="noopener noreferrer">
            <motion.div
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full text-lg border-2 border-[#C8A99A] shadow-md hover:bg-white flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              Book a Demo
            </motion.div>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-700"
        >
          {["No credit card required", "Set up in 5 minutes", "Cancel anytime"].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#7A9B76] rounded-full" />
              {text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
