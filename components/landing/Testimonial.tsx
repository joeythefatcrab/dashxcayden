"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Quote } from "lucide-react";

export function Testimonial() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-gradient-to-br from-[#C7BAAC] via-[#E8DCC4] to-[#D4C4B5] overflow-hidden relative">
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#A8B5A1] rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4A5A5] rounded-full blur-3xl opacity-20" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white/60 backdrop-blur-xl rounded-[3rem] p-12 md:p-16 shadow-xl border border-white/50"
        >
          {/* Quote icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute -top-8 -left-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#A8B5A1] to-[#C8A99A] rounded-3xl flex items-center justify-center shadow-lg">
              <Quote className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center gap-3 mb-8"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
              >
                <svg className="w-8 h-8 text-[#C8A99A]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </motion.div>
            ))}
          </motion.div>

          {/* Quote */}
          <motion.blockquote
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl md:text-3xl text-center leading-relaxed mb-10 text-gray-800"
          >
            "This platform transformed our homeschool. My kids look forward to lessons, and I can track their progress effortlessly. It&apos;s like having a patient, tireless teaching partner."
          </motion.blockquote>

          {/* Author */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#A8B5A1] to-[#C8A99A] rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              ST
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Sarah Thompson</p>
              <p className="text-gray-600">Homeschool mom of 3</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
