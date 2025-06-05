/**
 * Google Gemini AI Service
 * Free tier: 15 requests per minute, 1 million tokens per month
 * Very accurate for document analysis
 */

import { ExtractedEvent } from './types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  Google Gemini API key not found. Get one free at: https://aistudio.google.com/app/apikey');
    }
  }

  async extractEvents(text: string, fileName: string): Promise<ExtractedEvent[]> {
    if (!this.apiKey) {
      console.log('🔄 No Gemini API key, using fallback extraction...');
      return this.fallbackExtraction(text, fileName);
    }

    try {
      console.log('🤖 Extracting events using Google Gemini...');
      
      const prompt = this.createExtractionPrompt(text, fileName);
      const response = await this.callGemini(prompt);
      
      return this.parseEvents(response, fileName);
    } catch (error) {
      console.error('Gemini AI extraction failed:', error);
      return this.fallbackExtraction(text, fileName);
    }
  }

  private createExtractionPrompt(text: string, fileName: string): string {
    return `You are an expert academic assistant specializing in syllabus analysis. Extract ALL important academic events from this syllabus.

SYLLABUS CONTENT:
"""
${text}
"""

FILE: ${fileName}

TASK: Extract every date, deadline, exam, assignment, lecture, and important event.

INSTRUCTIONS:
1. Find ALL dates mentioned in the syllabus
2. Classify each event accurately as: lecture, homework, exam, project, or other
3. Extract clear titles and descriptions
4. Use the current academic year for dates that don't specify a year
5. Return ONLY valid JSON in this exact format:

{
  "events": [
    {
      "title": "Clear, descriptive title",
      "date": "YYYY-MM-DD",
      "description": "Detailed description from syllabus",
      "eventType": "lecture|homework|exam|project|other",
      "confidence": 0.95
    }
  ]
}

RULES:
- Return ONLY the JSON, no other text
- Use ISO date format (YYYY-MM-DD) or full ISO datetime if time is specified
- Be highly accurate with date extraction
- Include partial dates (like "Week 3" or "Mid-semester") as approximate dates
- Set confidence based on how clear the date and event description are
- If no specific date is given, estimate based on typical semester timing

JSON:`;
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No response from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private parseEvents(response: string, fileName: string): ExtractedEvent[] {
    try {
      // Clean the response to extract JSON
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      // Find JSON object
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON found in response');
      }

      jsonStr = jsonStr.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.events || !Array.isArray(parsed.events)) {
        throw new Error('Invalid events format');
      }

      return parsed.events.map((event: any, index: number) => ({
        id: `gemini-${Date.now()}-${index}`,
        title: event.title || 'Untitled Event',
        date: this.parseDate(event.date),
        description: event.description || '',
        eventType: this.validateEventType(event.eventType),
        confidence: Math.min(Math.max(event.confidence || 0.8, 0), 1)
      }));

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', response);
      return this.fallbackExtraction(response, fileName);
    }
  }

  private parseDate(dateStr: string): string {
    try {
      // Handle various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // Try parsing academic date patterns
      return this.parseAcademicDate(dateStr);
    } catch {
      // Default to reasonable future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      return futureDate.toISOString();
    }
  }

  private parseAcademicDate(dateStr: string): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lowerStr = dateStr.toLowerCase();
    
    // Handle semester timing
    if (lowerStr.includes('week')) {
      const weekMatch = lowerStr.match(/week\s*(\d+)/);
      if (weekMatch) {
        const weekNum = parseInt(weekMatch[1]);
        const semesterStart = new Date(currentYear, 8, 1); // Sept 1st
        semesterStart.setDate(semesterStart.getDate() + (weekNum - 1) * 7);
        return semesterStart.toISOString();
      }
    }
    
    if (lowerStr.includes('midterm') || lowerStr.includes('mid-semester')) {
      const midterm = new Date(currentYear, 9, 15); // Mid October
      return midterm.toISOString();
    }
    
    if (lowerStr.includes('final')) {
      const finals = new Date(currentYear, 11, 10); // Early December
      return finals.toISOString();
    }
    
    // Default fallback
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toISOString();
  }

  private validateEventType(type: string): 'lecture' | 'homework' | 'exam' | 'project' | 'other' {
    const validTypes = ['lecture', 'homework', 'exam', 'project', 'other'];
    const lowerType = type?.toLowerCase();
    
    if (validTypes.includes(lowerType)) {
      return lowerType as any;
    }
    
    // Smart mapping
    if (/assignment|hw|quiz|submission/.test(lowerType)) return 'homework';
    if (/test|midterm|final|assessment/.test(lowerType)) return 'exam';
    if (/class|lecture|session/.test(lowerType)) return 'lecture';
    if (/project|presentation|paper/.test(lowerType)) return 'project';
    
    return 'other';
  }

  private fallbackExtraction(text: string, fileName: string): ExtractedEvent[] {
    console.log('🔄 Using smart rule-based fallback extraction...');
    
    const events: ExtractedEvent[] = [];
    const lines = text.split(/[\n\r]+/);
    
    // Enhanced patterns for academic events
    const eventPatterns = [
      { regex: /exam|test|midterm|final|quiz|assessment/i, type: 'exam' as const, confidence: 0.9 },
      { regex: /assignment|homework|hw|due|submit|turn.?in|deadline/i, type: 'homework' as const, confidence: 0.85 },
      { regex: /lecture|class|session|meeting|discussion/i, type: 'lecture' as const, confidence: 0.7 },
      { regex: /project|presentation|paper|report|essay/i, type: 'project' as const, confidence: 0.8 },
    ];

    // Enhanced date patterns
    const datePatterns = [
      { regex: /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, format: 'MM/DD/YYYY' },
      { regex: /(\d{1,2}-\d{1,2}-\d{2,4})/g, format: 'MM-DD-YYYY' },
      { regex: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}/gi, format: 'Month DD, YYYY' },
      { regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?/gi, format: 'Mon DD' },
      { regex: /week\s*(\d+)/gi, format: 'Week N' },
    ];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) return;

      // Check for date patterns
      let foundDate = false;
      let extractedDate = '';
      
      for (const datePattern of datePatterns) {
        const matches = Array.from(trimmedLine.matchAll(datePattern.regex));
        if (matches.length > 0) {
          foundDate = true;
          extractedDate = this.smartDateParsing(matches[0][0]);
          break;
        }
      }

      if (!foundDate) return;

      // Determine event type and confidence
      let eventType: 'lecture' | 'homework' | 'exam' | 'project' | 'other' = 'other';
      let confidence = 0.5;
      
      for (const pattern of eventPatterns) {
        if (pattern.regex.test(trimmedLine)) {
          eventType = pattern.type;
          confidence = pattern.confidence;
          break;
        }
      }

      // Extract title
      const title = this.smartTitleExtraction(trimmedLine);
      
      if (title.length > 3) {
        events.push({
          id: `smart-fallback-${Date.now()}-${index}`,
          title: title,
          date: extractedDate,
          description: trimmedLine,
          eventType: eventType,
          confidence: confidence
        });
      }
    });

    return events.slice(0, 15); // Limit results
  }

  private smartDateParsing(dateStr: string): string {
    try {
      const currentYear = new Date().getFullYear();
      
      // Handle week format
      if (/week\s*(\d+)/i.test(dateStr)) {
        const weekMatch = dateStr.match(/week\s*(\d+)/i);
        if (weekMatch) {
          const weekNum = parseInt(weekMatch[1]);
          const semesterStart = new Date(currentYear, 8, 1); // September 1st
          semesterStart.setDate(semesterStart.getDate() + (weekNum - 1) * 7);
          return semesterStart.toISOString();
        }
      }
      
      // Try standard date parsing
      let parsedDate = new Date(dateStr);
      
      // If no year specified, assume current academic year
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < currentYear) {
        // Try adding current year
        const withYear = `${dateStr} ${currentYear}`;
        parsedDate = new Date(withYear);
      }
      
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
      
      // Fallback to future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      return futureDate.toISOString();
      
    } catch {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      return futureDate.toISOString();
    }
  }

  private smartTitleExtraction(line: string): string {
    // Remove common prefixes
    let title = line
      .replace(/^\d+\.\s*/, '') // "1. Title"
      .replace(/^[•\-\*]\s*/, '') // "• Title" or "- Title"
      .replace(/^(week\s*\d+:?\s*)/gi, '') // "Week 5: Title"
      .replace(/^\d{1,2}\/\d{1,2}\/?\d{0,4}:?\s*/, '') // "10/15: Title"
      .trim();
    
    // Extract content before common separators
    const separators = [' - ', ': ', ' – ', ' | '];
    for (const sep of separators) {
      const sepIndex = title.indexOf(sep);
      if (sepIndex > 5 && sepIndex < 60) {
        title = title.substring(0, sepIndex);
        break;
      }
    }
    
    // Clean up and capitalize
    title = title
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 80);
    
    // Capitalize first letter
    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    return title;
  }

  async checkAPIKey(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }]
        }),
      });
      
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }
}

export const geminiAI = new GeminiAIService(); 