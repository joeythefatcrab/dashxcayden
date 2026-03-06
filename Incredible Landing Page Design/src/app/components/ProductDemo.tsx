import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { BookOpen, CheckCircle2, Play } from "lucide-react";

const lessons = [
  { id: 1, title: "Introduction to Photosynthesis", progress: 100, status: "complete" },
  { id: 2, title: "The Role of Chloroplasts", progress: 100, status: "complete" },
  { id: 3, title: "Light and Dark Reactions", progress: 60, status: "inProgress" },
  { id: 4, title: "Factors Affecting Photosynthesis", progress: 0, status: "locked" },
  { id: 5, title: "Quiz: Photosynthesis Mastery", progress: 0, status: "locked" },
];

export function ProductDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-32 bg-gradient-to-br from-[#D4C4B5] via-[#E8DCC4] to-[#C7BAAC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.34, 1.56, 0.64, 1]
            }}
            className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[#A8B5A1] mb-6"
          >
            <span className="text-sm text-[#5A7B52]">See it in action</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-5xl md:text-6xl tracking-tight mb-6"
          >
            Watch Learning Come Alive
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
          >
            Click on a course to see how lessons unfold naturally
          </motion.p>
        </div>

        {/* Interactive Demo */}
        <div className="max-w-5xl mx-auto perspective-1000">
          <motion.div
            initial={{ opacity: 0, y: 100, rotateX: 45 }}
            animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: 45 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            {/* Course Card */}
            <motion.div
              whileHover={!isExpanded ? { scale: 1.02, y: -10 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="cursor-pointer"
            >
              <motion.div
                layout
                className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#C8A99A]/50 overflow-hidden border border-[#D4C4B5]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Course Header */}
                <motion.div 
                  layout="position"
                  className="relative p-8 bg-gradient-to-br from-[#A8B5A1] via-[#B8C5AA] to-[#C8A99A]"
                >
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                    style={{
                      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                    }}
                  />
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={isExpanded ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
                        transition={{ duration: 0.8 }}
                        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                      >
                        <BookOpen className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="text-white">
                        <motion.h3 layout="position" className="text-2xl mb-1">
                          Biology: Plant Science
                        </motion.h3>
                        <motion.p layout="position" className="text-white/80">
                          5 Lessons • 2 hours
                        </motion.p>
                      </div>
                    </div>

                    {!isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                      >
                        <Play className="w-5 h-5 text-white ml-1" />
                      </motion.div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <motion.div layout="position" className="mt-6">
                    <div className="flex justify-between text-sm text-white/90 mb-2">
                      <span>Overall Progress</span>
                      <span>52%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: isExpanded ? "52%" : "52%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Lessons List - Expands when clicked */}
                <motion.div
                  layout="position"
                  initial={false}
                  animate={{
                    height: isExpanded ? "auto" : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="p-8 space-y-3">
                    {lessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -50, rotateY: -90 }}
                        animate={
                          isExpanded
                            ? { opacity: 1, x: 0, rotateY: 0 }
                            : { opacity: 0, x: -50, rotateY: -90 }
                        }
                        transition={{
                          duration: 0.6,
                          delay: isExpanded ? index * 0.1 : 0,
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                        whileHover={{
                          x: 10,
                          scale: 1.02,
                          transition: { duration: 0.2 },
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          lesson.status === "complete"
                            ? "bg-[#D8E5D3] border-[#A8B5A1]"
                            : lesson.status === "inProgress"
                            ? "bg-[#E8DCC4] border-[#C8A99A]"
                            : "bg-gray-50 border-gray-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <motion.div
                              animate={
                                lesson.status === "complete"
                                  ? { scale: [1, 1.2, 1], rotate: [0, 360] }
                                  : {}
                              }
                              transition={{
                                duration: 0.5,
                                delay: isExpanded ? index * 0.1 + 0.3 : 0,
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                lesson.status === "complete"
                                  ? "bg-[#7A9B76]"
                                  : lesson.status === "inProgress"
                                  ? "bg-[#C8A99A]"
                                  : "bg-gray-300"
                              }`}
                            >
                              {lesson.status === "complete" ? (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              ) : (
                                <span className="text-white text-sm">{lesson.id}</span>
                              )}
                            </motion.div>
                            <div>
                              <h4 className="text-gray-900 mb-1">{lesson.title}</h4>
                              {lesson.progress > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full ${
                                        lesson.status === "complete"
                                          ? "bg-[#7A9B76]"
                                          : "bg-[#C8A99A]"
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={
                                        isExpanded
                                          ? { width: `${lesson.progress}%` }
                                          : { width: 0 }
                                      }
                                      transition={{
                                        duration: 1,
                                        delay: isExpanded ? index * 0.1 + 0.5 : 0,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {lesson.progress}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Click hint */}
                {!isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-6 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-[#A8B5A1]"
                    >
                      <span className="text-[#5A7B52]">Click to explore lessons →</span>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Decorative floating elements */}
            {isExpanded && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: -100, y: -50 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute -left-20 top-20 w-16 h-16 bg-[#D4A5A5] rounded-2xl blur-xl opacity-60"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: 100, y: 100 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.1 }}
                  className="absolute -right-16 bottom-20 w-20 h-20 bg-[#B8C5AA] rounded-full blur-xl opacity-60"
                />
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}