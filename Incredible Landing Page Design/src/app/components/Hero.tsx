import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8DCC4] via-[#D4C4B5] to-[#C7BAAC]">
      {/* Animated floating orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-[#D4A5A5] rounded-full blur-3xl opacity-40"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-[#B8C5AA] rounded-full blur-3xl opacity-40"
        animate={{
          y: [0, 40, 0],
          x: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#C8A99A] rounded-full blur-3xl opacity-30"
        animate={{
          y: [0, -20, 0],
          x: [0, 30, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge with sparkle animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.2 
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#A8B5A1]/50 mb-8 shadow-lg shadow-[#B8C5AA]/30"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-[#7A9B76]" />
          </motion.div>
          <span className="text-sm text-[#5A7B52]">Built for homeschool families</span>
        </motion.div>

        {/* Main heading with character animation */}
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-6xl md:text-7xl lg:text-8xl tracking-tight"
          >
            {"Homeschool Made".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 50, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.05,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                style={{ display: "inline-block" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            delay: 0.8,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          className="text-6xl md:text-7xl lg:text-8xl tracking-tight mb-8"
        >
          <motion.span
            className="bg-gradient-to-r from-[#A8B5A1] via-[#C8A99A] to-[#D4A5A5] bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Simple & Joyful
          </motion.span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-2xl text-[#5A5A4E] max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          A thoughtful platform that helps your children learn at their own pace,
          while giving you clarity and confidence as their teacher.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group px-8 py-4 bg-gradient-to-r from-[#7A9B76] to-[#A8B5A1] text-white rounded-full text-lg flex items-center gap-2 shadow-2xl shadow-[#A8B5A1]/50 hover:shadow-[#7A9B76]/60"
          >
            Start Free Today
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="px-8 py-4 bg-white/80 backdrop-blur-sm text-[#5A5A4E] rounded-full text-lg border border-[#C8A99A] shadow-xl shadow-[#D4C4B5]/50 hover:border-[#A8B5A1]"
          >
            Sign In
          </motion.button>
        </motion.div>

        {/* Social proof with bounce animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="flex flex-wrap justify-center items-center gap-8 mt-16 text-sm text-gray-600"
        >
          {[
            { emoji: "👥", text: "Trusted by 1,000+ families" },
            { emoji: "⭐", text: "4.9/5 rating" },
            { emoji: "🎯", text: "Free to start" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 + i * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, delay: 2.5 + i * 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="text-2xl"
              >
                {item.emoji}
              </motion.span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-[#A8B5A1] rounded-full flex items-start justify-center p-2"
        >
          <motion.div 
            className="w-1.5 h-1.5 bg-[#7A9B76] rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}