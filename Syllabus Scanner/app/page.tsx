'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, FileText, Upload, Star, Sparkles, BookOpen, Zap, CheckCircle, Users, Trophy, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Simple background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-100/20 via-transparent to-transparent"></div>
      </div>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative">
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className={`flex flex-col justify-center space-y-8 transform transition-all duration-1000 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Academic Assistant</span>
                </div>
                
                <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                    Never Miss a
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Deadline Again
                  </span>
                </h1>
                
                <p className="max-w-[600px] text-xl text-gray-600 md:text-2xl dark:text-gray-300 leading-relaxed">
                  Upload your syllabi and let our 
                  <span className="font-semibold text-blue-600 dark:text-blue-400"> AI-powered system </span>
                  automatically extract important dates and sync them with your Google Calendar.
                </p>
              </div>

              <div className="flex flex-col gap-4 min-[400px]:flex-row">
                <Link href="/upload">
                  <Button 
                    size="lg" 
                    className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="group border-2 border-blue-200 hover:border-blue-600 bg-white/50 backdrop-blur-sm hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      View Dashboard
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Feature highlights */}
              <div className="flex flex-wrap gap-6 pt-8">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Free to use</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <span className="font-medium">AI-powered</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Instant extraction</span>
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div 
              className={`relative transform transition-all duration-1000 delay-300 ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <div className="relative mx-auto w-full max-w-lg">
                {/* Main card */}
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-500 group cursor-pointer">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">CS 101 Syllabus</h3>
                        <p className="text-sm text-gray-500">Uploaded just now</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Midterm Exam</span>
                        </div>
                        <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Oct 15</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Assignment 3</span>
                        </div>
                        <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Oct 8</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Final Project</span>
                        </div>
                        <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">Dec 1</span>
                      </div>
                    </div>
                    
                    <div className="text-center pt-4">
                      <div className="inline-flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Synced to Calendar</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating indicators */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:scale-125 transition-transform duration-300 cursor-pointer">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                
                <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-125 transition-transform duration-300 cursor-pointer">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                
                {/* Floating calendar */}
                <div className="absolute top-8 -left-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">3 events</div>
                  <div className="text-xs text-gray-500">this week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm relative">
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300 cursor-pointer">
                <Star className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Simple 3-Step Process</span>
              </div>
              
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-gray-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="max-w-[900px] text-xl text-gray-600 md:text-2xl/relaxed dark:text-gray-300">
                Our AI-powered system makes it incredibly easy to keep track of all your important academic dates.
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <Card className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">Upload Syllabi</CardTitle>
                <CardDescription className="text-base">Upload your course syllabi in PDF, Word, or image format.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Our system accepts multiple file formats and can process multiple syllabi at once with advanced OCR technology.</p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-purple-600 transition-colors">AI Extracts Dates</CardTitle>
                <CardDescription className="text-base">Our advanced AI scans and identifies all important dates and deadlines.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Machine learning algorithms detect assignments, exams, projects, and other important events with 95% accuracy.</p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-green-600 transition-colors">Sync to Calendar</CardTitle>
                <CardDescription className="text-base">Connect with Google Calendar to automatically add all your events.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Events are perfectly organized by course with detailed descriptions, locations, and smart reminders.</p>
              </CardContent>
            </Card>
          </div>

          {/* Call to action */}
          <div className="text-center mt-16">
            <Link href="/upload">
              <Button 
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-12 py-4 text-xl font-bold shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-110"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  Try SyllaScan Now
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200/50 py-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SyllaScan
            </span>
          </div>
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2024 SyllaScan. Making academic life easier with AI. ✨
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              Privacy
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  )
}
