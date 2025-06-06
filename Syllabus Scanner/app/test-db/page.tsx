"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDatabasePage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDatabase = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addResult("🔍 Testing database connection...")
      
      // Test 1: Try to save a test syllabus
      addResult("📝 Testing save syllabus API...")
      const saveResponse = await fetch('/api/dashboard/save-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusName: 'Test Syllabus',
          events: [{
            id: 'test-1',
            title: 'Test Event',
            description: 'Test Description',
            date: '2025-01-01',
            eventType: 'lecture',
            confidence: 0.9
          }],
          courseInfo: {
            courseName: 'Test Course',
            courseCode: 'TEST'
          }
        })
      })
      
      const saveResult = await saveResponse.json()
      
      if (saveResponse.ok) {
        addResult("✅ Save API works! Saved test syllabus.")
        addResult(`📊 Save result: ${JSON.stringify(saveResult, null, 2)}`)
      } else {
        addResult(`❌ Save API failed: ${saveResult.error}`)
        if (saveResult.details) {
          addResult(`📋 Details: ${saveResult.details}`)
        }
      }
      
      // Test 2: Try to retrieve syllabi
      addResult("📖 Testing get syllabi API...")
      const getResponse = await fetch('/api/dashboard/get-syllabi')
      const getResult = await getResponse.json()
      
      if (getResponse.ok) {
        addResult("✅ Get API works!")
        addResult(`📊 Found ${getResult.syllabi?.length || 0} syllabi`)
        if (getResult.syllabi?.length > 0) {
          addResult(`📋 Sample: ${JSON.stringify(getResult.syllabi[0], null, 2)}`)
        }
      } else {
        addResult(`❌ Get API failed: ${getResult.error}`)
      }
      
    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testDatabase} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Database'}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Click "Test Database" to check your setup...</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>First run the database-setup.sql script in your Supabase SQL Editor</li>
              <li>Then click "Test Database" to verify everything works</li>
              <li>If you see errors, check your Supabase connection and table setup</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 