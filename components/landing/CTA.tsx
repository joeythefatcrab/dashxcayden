"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 bg-gradient-to-br from-[#C8A99A] via-[#D4A5A5] to-[#B8C5AA] overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, 180, 360], x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#A8B5A1] rounded-full blur-3xl opacity-40"
        />
        <motion.div
          animate={{ scale: [1.5, 1, 1.5], rotate: [360, 180, 0], x: [0, -100, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4A5A5] rounded-full blur-3xl opacity-40"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 100, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#C8A99A] rounded-full blur-3xl opacity-30"
        />
      </div>

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center gap-8 mb-8"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -20, 0], rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            >
              <Sparkles className="w-8 h-8 text-[#5A7B52]" />
            </motion.div>
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.8 }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-5xl md:text-6xl text-gray-900 mb-6 tracking-tight"
        >
          Start Your Journey Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl text-gray-700 mb-12 leading-relaxed"
        >
          Join thousands of families making homeschool simple and joyful
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <Link href="/signup-gate">
            <motion.div
              whileHover={{ scale: 1.1, y: -10, rotateZ: 2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#7A9B76] to-[#A8B5A1] text-white rounded-full text-lg flex items-center gap-2 shadow-2xl shadow-[#A8B5A1]/50 hover:shadow-[#7A9B76]/60 overflow-hidden cursor-pointer"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                animate={{ x: [-200, 200] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10">Get Started Free</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.div>
          </Link>

          <a href="https://calendly.com/cc283-rice/30min?month=2025-11" target="_blank" rel="noopener noreferrer">
            <motion.div
              whileHover={{ scale: 1.1, y: -10, rotateZ: -2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full text-lg border-2 border-[#C8A99A] shadow-xl hover:bg-white flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              Book a Demo
            </motion.div>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-700"
        >
          {["No credit card required", "Set up in 5 minutes", "Cancel anytime"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 1 + i * 0.1 }}
              whileHover={{ scale: 1.1, y: -3 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="w-1.5 h-1.5 bg-[#7A9B76] rounded-full"
              />
              {text}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
