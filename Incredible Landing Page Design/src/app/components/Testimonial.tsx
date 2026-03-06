import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Quote } from "lucide-react";

export function Testimonial() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 bg-gradient-to-br from-[#C7BAAC] via-[#E8DCC4] to-[#D4C4B5] overflow-hidden relative">
      {/* Animated background orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-72 h-72 bg-[#A8B5A1] rounded-full blur-3xl opacity-30"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4A5A5] rounded-full blur-3xl opacity-30"
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative bg-white/60 backdrop-blur-xl rounded-[3rem] p-12 md:p-16 shadow-2xl shadow-[#C8A99A]/50 border border-white/50"
        >
          {/* Decorative quote icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180, x: 0, y: 0 }}
            animate={
              isInView
                ? { scale: 1, rotate: 0, x: -40, y: -40 }
                : { scale: 0, rotate: -180, x: 0, y: 0 }
            }
            transition={{ 
              duration: 1.2, 
              delay: 0.3,
              type: "spring",
              stiffness: 150
            }}
            className="absolute -top-8 -left-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#A8B5A1] to-[#C8A99A] rounded-3xl flex items-center justify-center shadow-xl">
              <Quote className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex justify-center gap-3 mb-8"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -360 }}
                animate={
                  isInView
                    ? { scale: 1, rotate: 0 }
                    : { scale: 0, rotate: -360 }
                }
                transition={{
                  duration: 0.8,
                  delay: 0.6 + i * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                whileHover={{
                  scale: 1.3,
                  rotate: 180,
                  transition: { duration: 0.3 },
                }}
              >
                <svg className="w-8 h-8 text-[#C8A99A]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial text with word animation */}
          <motion.blockquote
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-3xl md:text-4xl text-center leading-relaxed mb-12 text-gray-800"
          >
            {`"This platform transformed our homeschool. My kids look forward to lessons, and I can track their progress effortlessly. It's like having a patient, tireless teaching partner."`
              .split(" ")
              .map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.3,
                    delay: 1 + i * 0.03,
                  }}
                  style={{ display: "inline-block", marginRight: "0.3em" }}
                >
                  {word}
                </motion.span>
              ))}
          </motion.blockquote>

          {/* Author with entrance animation */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={
              isInView
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 30, scale: 0.8 }
            }
            transition={{ duration: 0.8, delay: 2, type: "spring", stiffness: 150 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-[#A8B5A1] to-[#C8A99A] rounded-full flex items-center justify-center text-white text-2xl shadow-lg"
            >
              ST
            </motion.div>
            <div className="text-left">
              <p className="text-lg text-gray-900">Sarah Thompson</p>
              <p className="text-gray-600">Homeschool mom of 3</p>
            </div>
          </motion.div>

          {/* Floating decorative elements */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 right-12 w-4 h-4 bg-[#D4A5A5] rounded-full blur-sm"
          />
          <motion.div
            animate={{
              y: [0, 15, 0],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute bottom-24 left-16 w-3 h-3 bg-[#A8B5A1] rounded-full blur-sm"
          />
        </motion.div>
      </div>
    </section>
  );
}