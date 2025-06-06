'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { documentProcessor } from '@/lib/document-processor'
import { ExtractedEvent } from '@/lib/types'
import { AlertCircle, Copy, Zap, Clock, Users, Sparkles, FileText, Calendar } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TextPasteUploaderProps {
  onEventsExtracted: (events: ExtractedEvent[], text: string) => void;
}

export function TextPasteUploader({ onEventsExtracted }: TextPasteUploaderProps) {
  const [syllabusText, setSyllabusText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProcess = async () => {
    if (!syllabusText.trim()) {
      setError('Please paste your syllabus text first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      console.log('📄 Processing pasted syllabus text...')
      
      // Create a fake file object for the processor
      const textFile = new File([syllabusText], 'syllabus.txt', { type: 'text/plain' })
      
      const result = await documentProcessor.processDocument(textFile)
      
      console.log(`✅ Extracted ${result.events.length} events from pasted text`)
      onEventsExtracted(result.events, result.text)
      
    } catch (err) {
      console.error('❌ Processing failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to process syllabus text')
    } finally {
      setIsProcessing(false)
    }
  }

  const exampleText = `CS 301 - Data Structures & Algorithms
Summer 2024 Syllabus
Professor Johnson | Section 002

COURSE SCHEDULE & IMPORTANT DATES:

Week 1 (Jun 3-7)
• Monday, Jun 3 - Course Introduction, Big O Notation
• Wednesday, Jun 5 - Array & Linked List Review
• Friday, Jun 7 - Problem Set 1 DUE by 11:59 PM

Week 2 (Jun 10-14)  
• Monday, Jun 10 - Stacks and Queues
• Wednesday, Jun 12 - Trees and Binary Search Trees
• Friday, Jun 14 - Lab 1: BST Implementation DUE

Week 3 (Jun 17-21)
• Monday, Jun 17 - Hash Tables and Collision Resolution
• Wednesday, Jun 19 - Quiz 1: Arrays, Linked Lists, Stacks (in class)
• Friday, Jun 21 - Graph Representations

Week 4 (Jun 24-28)
• Monday, Jun 24 - Graph Traversal: DFS and BFS  
• Wednesday, Jun 26 - Dijkstra's Algorithm
• Friday, Jun 28 - Problem Set 2 DUE by 11:59 PM

Week 5 (Jul 1-5)
• Monday, Jul 1 - Sorting Algorithms: Bubble, Selection, Insertion
• Wednesday, Jul 3 - MIDTERM EXAM (7:00-9:00 PM, Room 203)
• Friday, Jul 5 - No class (Independence Day)

Week 6 (Jul 8-12)
• Monday, Jul 8 - Merge Sort and Quick Sort
• Wednesday, Jul 10 - Heap Sort and Priority Queues
• Friday, Jul 12 - Programming Project 1 Proposals DUE

Week 7 (Jul 15-19)
• Monday, Jul 15 - Dynamic Programming Introduction
• Wednesday, Jul 17 - Dynamic Programming Examples
• Friday, Jul 19 - Quiz 2: Sorting and Trees (in class)

Week 8 (Jul 22-26)
• Monday, Jul 22 - Greedy Algorithms
• Wednesday, Jul 24 - Advanced Graph Algorithms
• Friday, Jul 26 - Lab 2: Graph Implementation DUE

Week 9 (Jul 29 - Aug 2)
• Monday, Jul 29 - String Algorithms
• Wednesday, Jul 31 - Programming Project 1 DUE by 11:59 PM
• Friday, Aug 2 - Problem Set 3 DUE by 11:59 PM

Week 10 (Aug 5-9)
• Monday, Aug 5 - Advanced Data Structures
• Wednesday, Aug 7 - Algorithm Analysis and Optimization
• Friday, Aug 9 - Quiz 3: Dynamic Programming (in class)

Finals Week (Aug 12-16)
• Wednesday, Aug 14 - FINAL EXAM (2:00-5:00 PM, Room 203)
• Friday, Aug 16 - Programming Project 2 DUE by 11:59 PM

ADDITIONAL DEADLINES:
• Course Evaluation: Due Aug 13 by 11:59 PM
• Extra Credit Assignment: Due Aug 11 by 11:59 PM (optional)`

  const handleTryExample = () => {
    setSyllabusText(exampleText)
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-200 dark:border-blue-800 rounded-full px-6 py-3 hover:scale-105 transition-transform duration-300 cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-white animate-pulse" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SyllaScan
          </span>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
            Turn any syllabus into your personal calendar in 
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            30 seconds
          </span>
        </h1>
        
        {/* Value Props */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="font-medium">30 second setup</span>
          </div>
          <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Works with any syllabus</span>
          </div>
          <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
            <span className="font-medium">AI-powered</span>
          </div>
        </div>
      </div>

      {/* Instructions with glass morphism */}
      <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <CardHeader className="pb-4 relative">
          <CardTitle className="text-xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Copy className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How it works</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold">1</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Copy className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Copy your syllabus</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open your PDF/document and press Ctrl+A, then Ctrl+C</p>
              </div>
            </div>
            
            <div className="group flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all duration-300 cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FileText className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Paste it below</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paste the text in the box and click "Extract Events"</p>
              </div>
            </div>
            
            <div className="group flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-all duration-300 cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Calendar className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Add to calendar</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get all assignments, exams & deadlines in your Google Calendar!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Input with enhanced design */}
      <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
        <CardHeader className="relative">
          <CardTitle className="text-xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span>Paste Your Syllabus Text</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <Textarea
            placeholder="Paste your entire syllabus text here..."
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            rows={12}
            className="text-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-700/20 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
          />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTryExample}
                disabled={isProcessing}
                className="group bg-white/50 backdrop-blur-sm hover:bg-blue-50 border-blue-200 hover:border-blue-400 transition-all duration-300"
              >
                <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Try Example
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {syllabusText.length} characters
              </span>
            </div>
            
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !syllabusText.trim()}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 group-hover:animate-pulse" />
                  Extract Events
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 