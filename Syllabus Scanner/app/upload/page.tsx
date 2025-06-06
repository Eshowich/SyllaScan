"use client"

import { useState, useEffect } from 'react'
import { TextPasteUploader } from '@/components/text-paste-uploader'
import { ExtractedEventsDisplay } from '@/components/extracted-events-display'
import { ExtractedEvent } from '@/lib/types'

export default function UploadPage() {
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([])
  const [extractedText, setExtractedText] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleEventsExtracted = (events: ExtractedEvent[], text: string) => {
    setExtractedEvents(events)
    setExtractedText(text)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Simple background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/15 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-100/15 via-transparent to-transparent"></div>
      </div>

      <div className={`container mx-auto px-4 py-8 max-w-4xl relative z-20 transform transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        {extractedEvents.length === 0 ? (
          <TextPasteUploader onEventsExtracted={handleEventsExtracted} />
        ) : (
          <ExtractedEventsDisplay 
            events={extractedEvents} 
            onReset={() => {
              setExtractedEvents([])
              setExtractedText('')
            }}
          />
        )}
      </div>
    </div>
  )
}
