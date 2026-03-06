"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8DCC4] via-[#D4C4B5] to-[#C7BAAC]">
      {/* Background orbs - subtle */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4A5A5] rounded-full blur-3xl opacity-25" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B8C5AA] rounded-full blur-3xl opacity-25" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#A8B5A1]/50 mb-8 shadow-md"
        >
          <Sparkles className="w-4 h-4 text-[#7A9B76]" />
          <span className="text-sm text-[#5A7B52]">Built for homeschool families</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-6xl md:text-7xl lg:text-8xl tracking-tight mb-4"
        >
          Homeschool Made
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-6xl md:text-7xl lg:text-8xl tracking-tight mb-8"
        >
          <span className="bg-gradient-to-r from-[#A8B5A1] via-[#C8A99A] to-[#D4A5A5] bg-clip-text text-transparent">
            Simple & Joyful
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xl md:text-2xl text-[#5A5A4E] max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          A thoughtful platform that helps your children learn at their own pace,
          while giving you clarity and confidence as their teacher.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/signup-gate">
            <motion.div
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="px-8 py-4 bg-gradient-to-r from-[#7A9B76] to-[#A8B5A1] text-white rounded-full text-lg flex items-center gap-2 shadow-lg cursor-pointer"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </Link>

          <Link href="/sign-in">
            <motion.div
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-[#5A5A4E] rounded-full text-lg border border-[#C8A99A] shadow-md cursor-pointer"
            >
              Sign In
            </motion.div>
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-wrap justify-center items-center gap-8 mt-14 text-sm text-gray-600"
        >
          {[
            { emoji: "👥", text: "Trusted by 1,000+ families" },
            { emoji: "⭐", text: "4.9/5 rating" },
            { emoji: "🎯", text: "Free to start" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xl">{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-[#A8B5A1] rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-1.5 bg-[#7A9B76] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
