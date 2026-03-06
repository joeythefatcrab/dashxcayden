import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { BookOpen, TrendingUp, MessageSquare, Sparkles, Heart, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Upload Content",
    description: "Upload your curriculum (PDF, DOCX, CSV) and we'll transform it into interactive, organized lessons.",
    color: "from-[#D4A5A5] to-[#C9A29E]",
  },
  {
    icon: TrendingUp,
    title: "Paced Learning",
    description: "Each child progresses at their own speed. Unlock lessons naturally as they're ready.",
    color: "from-[#A8B5A1] to-[#8FA388]",
  },
  {
    icon: MessageSquare,
    title: "Instant Feedback",
    description: "Automatic grading gives kids immediate encouragement and shows them where to review.",
    color: "from-[#C8A99A] to-[#B89888]",
  },
  {
    icon: Sparkles,
    title: "Interactive Quizzes",
    description: "Hover over terms to see definitions, origins, and images. Vocabulary made engaging.",
    color: "from-[#E8DCC4] to-[#D4C4B5]",
  },
  {
    icon: Heart,
    title: "Parent Updates",
    description: "Receive gentle daily or weekly emails celebrating progress and highlighting achievements.",
    color: "from-[#D4A5A5] to-[#C9A29E]",
  },
  {
    icon: BarChart3,
    title: "Progress Reports",
    description: "Generate beautiful reports for your records or supervisor submissions with one click.",
    color: "from-[#B8C5AA] to-[#A8B5A1]",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, rotateX: 90, scale: 0.5 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, rotateX: 0, scale: 1 }
          : { opacity: 0, y: 100, rotateX: 90, scale: 0.5 }
      }
      transition={{
        duration: 1,
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className="group"
    >
      <motion.div
        whileHover={{ 
          y: -20, 
          rotateZ: 2,
          scale: 1.05,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
        className="h-full p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-gray-100 hover:border-[#A8B5A1] transition-all shadow-xl shadow-[#D4C4B5]/50 hover:shadow-2xl hover:shadow-[#C8A99A]/50 relative overflow-hidden"
      >
        {/* Animated background gradient */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        />

        <motion.div
          whileHover={{ 
            scale: 1.2, 
            rotate: 360,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            rotate: { duration: 0.6 }
          }}
          className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
        >
          <Icon className="w-7 h-7 text-white" />
        </motion.div>
        
        <h3 className="text-2xl mb-3 relative">{feature.title}</h3>
        <p className="text-gray-600 leading-relaxed relative">{feature.description}</p>

        {/* Floating particles on hover */}
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 bg-[#A8B5A1] rounded-full"
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
        <motion.div
          className="absolute bottom-8 right-8 w-1.5 h-1.5 bg-[#D4A5A5] rounded-full"
          animate={{
            y: [0, -8, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.3,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-[#D4C4B5] to-[#E8DCC4] rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-20 -right-32 w-96 h-96 bg-gradient-to-br from-[#B8C5AA] to-[#A8B5A1] rounded-full blur-3xl opacity-30"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div ref={ref} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0, rotateZ: -180 }}
            animate={
              isInView
                ? { opacity: 1, scale: 1, rotateZ: 0 }
                : { opacity: 0, scale: 0, rotateZ: -180 }
            }
            transition={{ duration: 1, type: "spring", stiffness: 150 }}
            className="inline-block px-4 py-2 bg-[#D8E5D3] rounded-full border border-[#A8B5A1] mb-6"
          >
            <span className="text-sm text-[#5A7B52]">Powerful features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={
              isInView
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 50, scale: 0.8 }
            }
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-5xl md:text-6xl tracking-tight mb-6"
          >
            Everything You Need
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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