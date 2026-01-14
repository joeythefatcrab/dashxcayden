import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, CheckCircle2, Calendar, Star, Heart, Sparkles, TrendingUp, Award, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero Section - Clean Blue & Warm */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 px-4 py-24">
        {/* Subtle decorative elements */}
        <div className="absolute left-10 top-20 h-32 w-32 animate-pulse rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-40 w-40 animate-pulse rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            {/* Minimalist Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Built for homeschool families
            </div>

            {/* Clean Main Heading */}
            <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 sm:text-6xl md:text-7xl">
              Homeschool Made
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Simple & Joyful
              </span>
            </h1>

            {/* Clean Subheading */}
            <p className="mb-10 max-w-2xl text-xl leading-relaxed text-gray-600">
              A thoughtful platform that helps your children learn at their own pace,
              while giving you clarity and confidence as their teacher.
            </p>

            {/* Minimal CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup-gate">
                <Button
                  size="lg"
                  className="h-12 rounded-lg bg-blue-600 px-8 text-base font-semibold shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                  Start Free Today
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-lg border-2 border-blue-200 bg-white px-8 text-base font-semibold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-50"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Clean Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Trusted by 1,000+ families</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-500" />
                <span>4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <span>Free to start</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Minimalist */}
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              Simple tools that work beautifully together
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-xl bg-blue-50 p-3">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Easy Upload</h3>
                <p className="leading-relaxed text-gray-600">
                  Upload your curriculum (PDF, DOCX, CSV) and we'll transform it into interactive, organized lessons.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-xl bg-sky-50 p-3">
                  <Brain className="h-7 w-7 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Self-Paced Learning</h3>
                <p className="leading-relaxed text-gray-600">
                  Each child progresses at their own speed. Lessons unlock naturally as they're ready.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-xl bg-indigo-50 p-3">
                  <Award className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Instant Feedback</h3>
                <p className="leading-relaxed text-gray-600">
                  Automatic grading gives kids immediate encouragement and shows them what to review.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-xl bg-cyan-50 p-3">
                  <Sparkles className="h-7 w-7 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Interactive Glossary</h3>
                <p className="leading-relaxed text-gray-600">
                  Hover over terms to see definitions, origins, and images. Vocabulary made engaging.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-xl bg-blue-50 p-3">
                  <Heart className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Parent Updates</h3>
                <p className="leading-relaxed text-gray-600">
                  Receive gentle daily or weekly emails celebrating progress and highlighting achievements.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-xl bg-sky-50 p-3">
                  <TrendingUp className="h-7 w-7 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Progress Reports</h3>
                <p className="leading-relaxed text-gray-600">
                  Generate beautiful reports for your records or supervisor submissions with one click.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section - Soft Blue Background */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-7 w-7 fill-blue-400 text-blue-400" />
            ))}
          </div>
          <blockquote className="mb-6 text-2xl font-medium leading-relaxed text-gray-800">
            "This platform transformed our homeschool. My kids look forward to lessons, and I can track their progress effortlessly. It's like having a patient, tireless teaching partner."
          </blockquote>
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400" />
            <div>
              <p className="font-semibold text-gray-900">Sarah Thompson</p>
              <p className="text-sm text-gray-600">Homeschool mom of 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Clean Blue Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-24 text-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-10" />

        <div className="container relative mx-auto max-w-4xl">
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
            Start Your Journey Today
          </h2>
          <p className="mb-10 text-xl text-white/90">
            Join thousands of families making homeschool simple and joyful
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup-gate">
              <Button
                size="lg"
                className="h-12 rounded-lg bg-white px-10 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
              >
                Get Started Free
              </Button>
            </Link>
            <a
              href="https://calendly.com/cc283-rice/30min?month=2025-11"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-lg border-2 border-white bg-transparent px-10 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a Demo
              </Button>
            </a>
          </div>
          <p className="mt-8 text-sm text-white/80">
            No credit card required • Set up in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer - Dark with Blue Accent */}
      <footer className="bg-gray-900 px-4 py-12 text-gray-400">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-center gap-6 text-center">
            <div className="text-2xl font-bold text-white">
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                HomeschoolHub
              </span>
            </div>
            <p className="max-w-md text-sm">
              Making homeschool education simple, personalized, and joyful for families everywhere.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 HomeschoolHub. Made with care for homeschool families.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
