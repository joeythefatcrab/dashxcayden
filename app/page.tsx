import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Mail, FileSpreadsheet, CheckCircle2, Calendar, Star, Heart, Sparkles, Users, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - Warm & Friendly */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4 py-24">
        {/* Decorative elements */}
        <div className="absolute left-10 top-20 h-32 w-32 animate-pulse rounded-full bg-orange-200/30 blur-2xl" />
        <div className="absolute bottom-10 right-10 h-40 w-40 animate-pulse rounded-full bg-yellow-200/30 blur-3xl" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
              <Sparkles className="h-4 w-4" />
              Made with love for homeschool families
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 sm:text-6xl md:text-7xl">
              Learning That Adapts to
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Your Child
              </span>
            </h1>

            {/* Subheading */}
            <p className="mb-10 max-w-2xl text-xl leading-relaxed text-gray-700">
              A joyful homeschool platform that celebrates progress, encourages curiosity,
              and makes learning an adventure—not a chore.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  Start Free Today
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-2 border-orange-300 px-8 text-lg font-semibold text-orange-700 transition-all hover:bg-orange-50"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-500" />
                <span>Loved by 1,000+ families</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>100% free to start</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Everything Your Family Needs
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools that feel simple, because learning should be joyful
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-2 border-orange-100 transition-all hover:border-orange-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 p-4">
                  <BookOpen className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Easy Upload</h3>
                <p className="leading-relaxed text-gray-600">
                  Drop in your curriculum files (PDF, DOCX, CSV) and we'll organize everything into beautiful, interactive lessons.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-amber-100 transition-all hover:border-amber-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 p-4">
                  <Brain className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personalized Pacing</h3>
                <p className="leading-relaxed text-gray-600">
                  Each child moves forward at their own speed. Lessons unlock when they're ready—no rushing, no waiting.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-yellow-100 transition-all hover:border-yellow-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-2xl bg-gradient-to-br from-yellow-100 to-lime-100 p-4">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Instant Feedback</h3>
                <p className="leading-relaxed text-gray-600">
                  Questions are graded automatically so kids get immediate encouragement and know exactly what to review.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-blue-100 transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 p-4">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Interactive Glossary</h3>
                <p className="leading-relaxed text-gray-600">
                  Hover over any term to see definitions, word origins, and helpful images—learning vocabulary made fun!
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-purple-100 transition-all hover:border-purple-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 p-4">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Parent Updates</h3>
                <p className="leading-relaxed text-gray-600">
                  Get cheerful daily or weekly emails celebrating wins and highlighting what your child is exploring.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-green-100 transition-all hover:border-green-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 p-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Progress Reports</h3>
                <p className="leading-relaxed text-gray-600">
                  Export beautiful reports for your records or to share with supervisors—compliance made simple.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="mb-6 text-2xl font-medium italic leading-relaxed text-gray-800">
            "This platform has been a game-changer for our family. My kids actually look forward to their lessons now, and I can see their progress in real-time. It's like having a teaching assistant that never gets tired!"
          </blockquote>
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400" />
            <div>
              <p className="font-semibold text-gray-900">Sarah Thompson</p>
              <p className="text-sm text-gray-600">Homeschool mom of 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-4 py-24 text-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-20" />

        <div className="container relative mx-auto max-w-4xl">
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
            Start Your Journey Today
          </h2>
          <p className="mb-10 text-xl text-white/90">
            Join thousands of families making homeschool magical
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-14 rounded-full bg-white px-10 text-lg font-bold text-orange-600 shadow-2xl transition-all hover:scale-105 hover:bg-gray-50"
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
                className="h-14 rounded-full border-2 border-white bg-transparent px-10 text-lg font-bold text-white transition-all hover:bg-white/10"
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

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-12 text-gray-400">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-center gap-6 text-center">
            <div className="text-2xl font-bold text-white">
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                HomeschoolHub
              </span>
            </div>
            <p className="max-w-md text-sm">
              Making homeschool education joyful, personalized, and effective for families everywhere.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 HomeschoolHub. Made with ❤️ for homeschool families.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
