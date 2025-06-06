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
    this.apiKey = apiKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || '';
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
    return `Extract all academic events from this syllabus and return them as valid JSON.

SYLLABUS:
${text}

Return ONLY this exact JSON format with NO extra text:

{
  "events": [
    {
      "title": "Event name here",
      "date": "2025-01-15",
      "description": "Event details",
      "eventType": "lecture",
      "confidence": 0.95
    }
  ]
}

RULES:
- eventType must be one of: lecture, homework, exam, quiz, project, other
- date format: YYYY-MM-DD (use 2025 for missing years)
- Extract ALL events: assignments, exams, lectures, due dates, etc.
- Keep property names complete: "title", "date", "description", "eventType", "confidence"
- Quote ALL string values properly
- No trailing commas
- Valid JSON only

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
      console.log('🔍 Parsing Gemini response...');
      
      // Clean the response more aggressively
      let jsonStr = response.trim();
      
      // Remove any text before JSON
      const jsonStart = jsonStr.indexOf('{');
      if (jsonStart > 0) {
        console.log(`🔧 Removed ${jsonStart} characters before JSON start`);
        jsonStr = jsonStr.substring(jsonStart);
      }
      
      // Remove any text after JSON
      const lastBrace = jsonStr.lastIndexOf('}');
      if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
        console.log(`🔧 Removed ${jsonStr.length - lastBrace - 1} characters after JSON end`);
        jsonStr = jsonStr.substring(0, lastBrace + 1);
      }
      
      // Remove markdown code blocks
      const beforeMarkdown = jsonStr.length;
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
      if (jsonStr.length !== beforeMarkdown) {
        console.log('🔧 Removed markdown code blocks');
      }
      
      // Clean up common JSON formatting issues
      const beforeCleaning = jsonStr.length;
      jsonStr = this.cleanJsonString(jsonStr);
      
      console.log(`📝 JSON cleaning: ${beforeCleaning} → ${jsonStr.length} characters`);
      console.log(`📝 First 200 chars: ${jsonStr.substring(0, 200)}`);
      console.log(`📝 Last 200 chars: ${jsonStr.substring(Math.max(0, jsonStr.length - 200))}`);
      
      // Try parsing with detailed error info
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError: any) {
        console.error('❌ Initial JSON parse failed:', parseError.message);
        console.log(`🔍 Error at position ${parseError.message.match(/position (\d+)/)?.[1] || 'unknown'}`);
        
        // Show context around error position if available
        const posMatch = parseError.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const start = Math.max(0, pos - 100);
          const end = Math.min(jsonStr.length, pos + 100);
          console.log(`🔍 Context around error: "${jsonStr.substring(start, end)}"`);
          console.log(`🔍 Error character: "${jsonStr[pos] || 'EOF'}"`);
        }
        
        throw parseError;
      }
      
      if (!parsed.events || !Array.isArray(parsed.events)) {
        console.warn('⚠️ Invalid events format, using fallback');
        return this.fallbackExtraction(response, fileName);
      }

      console.log(`✅ Successfully parsed ${parsed.events.length} events from Gemini`);
      
      return parsed.events.map((event: any, index: number) => ({
        id: `gemini-${Date.now()}-${index}`,
        title: this.cleanTitle(event.title) || 'Untitled Event',
        date: this.parseDate(event.date),
        description: this.cleanDescription(event.description) || '',
        eventType: this.validateEventType(event.eventType),
        confidence: Math.min(Math.max(event.confidence || 0.8, 0), 1)
      }));

    } catch (error: any) {
      console.error('❌ Failed to parse Gemini response:', error.message);
      console.log('🔍 Response length:', response.length);
      console.log('🔍 First 300 chars:', response.substring(0, 300));
      console.log('🔍 Last 300 chars:', response.substring(Math.max(0, response.length - 300)));
      
      // Try to extract partial JSON or use fallback
      return this.tryPartialJsonParse(response, fileName);
    }
  }

  private cleanJsonString(jsonStr: string): string {
    // Remove any non-JSON text at the beginning or end
    jsonStr = jsonStr.trim();
    
    // First, fix specific known patterns that Gemini commonly breaks
    jsonStr = this.fixCommonGeminiPatterns(jsonStr);
    
    // Then apply general JSON fixes
    jsonStr = jsonStr
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove control characters that might break JSON
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Remove any markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove newlines and multiple spaces that might break JSON
      .replace(/\s+/g, ' ')
      // Fix missing commas between objects in arrays
      .replace(/}\s*{/g, '}, {');
    
    // Fix mixed quote/number types for confidence values
    jsonStr = jsonStr.replace(/"confidence":\s*"([\d.]+)"/g, '"confidence": $1');
    
    // Additional pass to fix structural issues
    jsonStr = this.fixJsonStructure(jsonStr);
    
    return jsonStr;
  }

  private fixCommonGeminiPatterns(jsonStr: string): string {
    // Fix truncated property names that Gemini sometimes generates
    jsonStr = jsonStr
      .replace(/"titl":/g, '"title":')
      .replace(/"dat":/g, '"date":')
      .replace(/"descriptio":/g, '"description":')
      .replace(/"eventTyp":/g, '"eventType":')
      .replace(/"confidenc":/g, '"confidence":');
    
    // Fix unquoted string values - look for patterns like: "key": value, next
    // where value should be quoted
    jsonStr = jsonStr.replace(/"(\w+)":\s*([^",\{\}\[\]]+?)(\s*[,\}\]])/g, (match, key, value, ending) => {
      // Don't quote numbers, booleans, or null
      const trimmedValue = value.trim();
      if (/^(true|false|null|\d+(\.\d+)?)$/.test(trimmedValue)) {
        return `"${key}": ${trimmedValue}${ending}`;
      }
      // Quote everything else
      return `"${key}": "${trimmedValue}"${ending}`;
    });
    
    // Fix broken time formats like "11: "59 PM"" → "11:59 PM"
    jsonStr = jsonStr.replace(/(\d{1,2}):\s*"(\d{2})\s+(AM|PM)"/gi, '$1:$2 $3');
    
    // Fix broken dates like "May: "8"" → "May 8"
    jsonStr = jsonStr.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec):\s*"(\d{1,2})"/gi, '$1 $2');
    
    // Fix broken room numbers like "Room: "203"" → "Room 203"
    jsonStr = jsonStr.replace(/Room:\s*"(\d+)"/gi, 'Room $1');
    
    // Fix broken course codes like "CS: "301"" → "CS 301"
    jsonStr = jsonStr.replace(/([A-Z]{2,4}):\s*"(\d+)"/g, '$1 $2');
    
    // Fix broken page numbers like "page: "15"" → "page 15"
    jsonStr = jsonStr.replace(/page:\s*"(\d+)"/gi, 'page $1');
    
    // Fix broken percentages like "95: "%"" → "95%"
    jsonStr = jsonStr.replace(/(\d+):\s*"%"/g, '$1%');
    
    // Fix broken version numbers like "v1: "2"" → "v1.2"
    jsonStr = jsonStr.replace(/v(\d+):\s*"(\d+)"/gi, 'v$1.$2');
    
    // Fix the specific pattern from the error: "Due by 11: "59 PM""
    jsonStr = jsonStr.replace(/"([^"]*?)(\d{1,2}):\s*"(\d{2})\s+(AM|PM)""/gi, '"$1$2:$3 $4"');
    
    // Fix malformed string values that aren't properly quoted
    // Pattern: "key": text, something → "key": "text", something
    jsonStr = jsonStr.replace(/"(\w+)":\s*([^",\{\}\[\]]*?),\s*([a-zA-Z])/g, '"$1": "$2", "$3');
    
    // Handle comma-separated values that should be in one string
    // Pattern: "title": "Course Introduction", Big O Notation → "title": "Course Introduction, Big O Notation"
    jsonStr = jsonStr.replace(/"(title|description)":\s*"([^"]+)",\s*([^"{}\[\],]+)/g, '"$1": "$2, $3"');
    
    return jsonStr;
  }

  private fixUnescapedQuotes(jsonStr: string): string {
    // Simplified approach that focuses on the most common issues
    let result = '';
    let i = 0;
    let inString = false;
    let escapeNext = false;
    
    while (i < jsonStr.length) {
      const char = jsonStr[i];
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        i++;
        continue;
      }
      
      if (char === '\\') {
        result += char;
        escapeNext = true;
        i++;
        continue;
      }
      
      if (char === '"') {
        if (!inString) {
          // Starting a string
          inString = true;
          result += char;
        } else {
          // Potentially ending a string - look ahead to determine
          let j = i + 1;
          while (j < jsonStr.length && /\s/.test(jsonStr[j])) j++; // Skip whitespace
          
          const nextChar = jsonStr[j];
          
          // If next char suggests end of string (comma, brace, bracket, colon for next key)
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
            inString = false;
            result += char;
          } else if (nextChar === '"') {
            // Two quotes in a row - this might be an empty string or escaped quote
            inString = false;
            result += char;
          } else {
            // This is likely an unescaped quote inside the string, escape it
            result += '\\"';
          }
        }
      } else {
        result += char;
      }
      
      i++;
    }
    
    return result;
  }

  private fixJsonStructure(jsonStr: string): string {
    try {
      // Try to fix common structural issues
      let fixed = jsonStr;
      
      // Ensure proper object/array structure
      if (!fixed.startsWith('{') && !fixed.startsWith('[')) {
        fixed = '{' + fixed;
      }
      
      if (!fixed.endsWith('}') && !fixed.endsWith(']')) {
        if (fixed.startsWith('{')) {
          fixed = fixed + '}';
        } else if (fixed.startsWith('[')) {
          fixed = fixed + ']';
        }
      }
      
      // Fix incomplete strings at the end - be more careful about this
      const lines = fixed.split('\n');
      let lastLine = lines[lines.length - 1] || '';
      
      // Only fix if we're clearly missing a closing quote at the very end
      if (lastLine.includes('"') && !lastLine.match(/.*"[\s\}\]]*$/)) {
        const openQuotes = (fixed.match(/"/g) || []).length;
        if (openQuotes % 2 !== 0) {
          // Find the last position before a closing brace/bracket
          const lastBrace = Math.max(fixed.lastIndexOf('}'), fixed.lastIndexOf(']'));
          if (lastBrace > 0) {
            fixed = fixed.substring(0, lastBrace) + '"' + fixed.substring(lastBrace);
          }
        }
      }
      
      // Try to parse and catch specific errors
      try {
        JSON.parse(fixed);
        return fixed;
      } catch (parseError) {
        // If we still have errors, try more aggressive fixes
        return this.aggressiveJsonFix(fixed);
      }
      
    } catch (error) {
      return jsonStr; // Return original if fixing fails
    }
  }

  private aggressiveJsonFix(jsonStr: string): string {
    try {
      // Last resort fixes for malformed JSON
      let fixed = jsonStr;
      
      // Remove any incomplete objects/arrays at the end by tracking bracket depth
      let depth = 0;
      let lastValidPosition = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{' || char === '[') {
            depth++;
          } else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0) {
              lastValidPosition = i + 1;
            }
          }
        }
      }
      
      if (lastValidPosition > 0 && lastValidPosition < fixed.length) {
        fixed = fixed.substring(0, lastValidPosition);
      }
      
      // Final cleanup of common issues
      fixed = fixed
        // Remove dangling commas
        .replace(/,\s*([}\]])/g, '$1')
        // Fix missing quotes on unquoted values (but be careful not to break numbers)
        .replace(/:\s*([^",{\[\]}\s][^,}\]]*?)(?=\s*[,}])/g, (match, value) => {
          // Don't quote numbers, booleans, or null
          if (/^(true|false|null|\d+(\.\d+)?)$/.test(value.trim())) {
            return match;
          }
          return `: "${value.trim()}"`;
        })
        // Remove any trailing content after final brace
        .replace(/^(.+[}\]]).*$/, '$1');
      
      return fixed;
      
    } catch (error) {
      return jsonStr;
    }
  }

  private tryPartialJsonParse(response: string, fileName: string): ExtractedEvent[] {
    console.log('🔄 Attempting partial JSON recovery...');
    
    try {
      // Strategy 1: Try to find and extract individual event objects
      const eventMatches = response.matchAll(/{[^{}]*"title"[^{}]*}/g);
      const events: ExtractedEvent[] = [];
      
      for (const match of eventMatches) {
        try {
          const eventStr = this.cleanJsonString(match[0]);
          const event = JSON.parse(eventStr);
          
          if (event.title && event.date) {
            events.push({
              id: `recovered-${Date.now()}-${events.length}`,
              title: this.cleanTitle(event.title),
              date: this.parseDate(event.date),
              description: this.cleanDescription(event.description) || '',
              eventType: this.validateEventType(event.eventType),
              confidence: Math.min(Math.max(event.confidence || 0.6, 0), 1)
            });
          }
        } catch (e) {
          // Skip this event if it can't be parsed
          continue;
        }
      }
      
      if (events.length > 0) {
        console.log(`✅ Strategy 1: Recovered ${events.length} events from individual objects`);
        return events;
      }
      
      // Strategy 2: Try to extract from partial events array
      const eventsArrayMatch = response.match(/"events"\s*:\s*\[([^\]]*)/);
      if (eventsArrayMatch) {
        try {
          const partialArray = eventsArrayMatch[1];
          // Split by }, { pattern to get individual events
          const eventStrings = partialArray.split(/},\s*{/);
          
          for (let i = 0; i < eventStrings.length; i++) {
            let eventStr = eventStrings[i].trim();
            
            // Add missing braces
            if (!eventStr.startsWith('{')) eventStr = '{' + eventStr;
            if (!eventStr.endsWith('}')) eventStr = eventStr + '}';
            
            try {
              const cleanedEventStr = this.cleanJsonString(eventStr);
              const event = JSON.parse(cleanedEventStr);
              
              if (event.title && event.date) {
                events.push({
                  id: `recovered-array-${Date.now()}-${i}`,
                  title: this.cleanTitle(event.title),
                  date: this.parseDate(event.date),
                  description: this.cleanDescription(event.description) || '',
                  eventType: this.validateEventType(event.eventType),
                  confidence: Math.min(Math.max(event.confidence || 0.6, 0), 1)
                });
              }
            } catch (e) {
              continue;
            }
          }
          
          if (events.length > 0) {
            console.log(`✅ Strategy 2: Recovered ${events.length} events from partial array`);
            return events;
          }
        } catch (e) {
          console.log('⚠️ Strategy 2 failed');
        }
      }
      
      // Strategy 3: Extract using regex patterns for common event structures
      const titleDatePattern = /"title"\s*:\s*"([^"]+)"\s*,\s*"date"\s*:\s*"([^"]+)"/g;
      const titleDateMatches = Array.from(response.matchAll(titleDatePattern));
      
      if (titleDateMatches.length > 0) {
        titleDateMatches.forEach((match, index) => {
          const title = match[1];
          const date = match[2];
          
          if (title && date) {
            // Try to extract more context around this match
            const fullMatchIndex = response.indexOf(match[0]);
            const contextStart = Math.max(0, fullMatchIndex - 200);
            const contextEnd = Math.min(response.length, fullMatchIndex + 500);
            const context = response.substring(contextStart, contextEnd);
            
            // Extract event type and description if available
            const eventTypeMatch = context.match(/"eventType"\s*:\s*"([^"]+)"/);
            const descriptionMatch = context.match(/"description"\s*:\s*"([^"]+)"/);
            const confidenceMatch = context.match(/"confidence"\s*:\s*([\d.]+)/);
            
            // Smart event type classification based on title content
            let eventType: 'lecture' | 'homework' | 'exam' | 'quiz' | 'project' | 'other' = 'other';
            const titleLower = title.toLowerCase();
            
            if (/^(problem set|ps|homework|hw|assignment|lab \d+.*due|.*due by)/i.test(title)) {
              eventType = 'homework';
            } else if (/^(quiz|quizzes|q\d+)/i.test(title)) {
              eventType = 'quiz';
            } else if (/(exam|test|midterm|final)/i.test(title) && !/review/i.test(title)) {
              eventType = 'exam';
            } else if (/(project|presentation|proposal)/i.test(title)) {
              eventType = 'project';
            } else if (/(lecture|class|introduction|review|algorithm|data structure|programming|analysis)/i.test(title) || 
                      /^(course|array|linked|stack|queue|tree|hash|graph|sort|heap|dynamic|greedy|string|advanced)/i.test(title)) {
              eventType = 'lecture';
            } else if (/(break|holiday|no class|evaluation|extra credit)/i.test(title)) {
              eventType = 'other';
            } else {
              // Default classification based on context
              eventType = eventTypeMatch?.[1] as any || 'lecture';
            }
            
            events.push({
              id: `recovered-regex-${Date.now()}-${index}`,
              title: this.cleanTitle(title),
              date: this.parseDate(date),
              description: this.cleanDescription(descriptionMatch?.[1]) || title,
              eventType: eventType,
              confidence: Math.min(Math.max(parseFloat(confidenceMatch?.[1] || '0.7'), 0), 1)
            });
          }
        });
        
        if (events.length > 0) {
          console.log(`✅ Strategy 3: Recovered ${events.length} events using regex patterns`);
          return events;
        }
      }
      
    } catch (error) {
      console.log('⚠️ All partial JSON recovery strategies failed');
    }
    
    console.log('🔄 Using fallback extraction as last resort');
    return this.fallbackExtraction(response, fileName);
  }

  private cleanTitle(title: any): string {
    if (typeof title !== 'string') return 'Untitled Event';
    return title.trim().replace(/^[•\-\*\s]+/, '').replace(/[•\-\*\s]+$/, '');
  }

  private cleanDescription(description: any): string {
    if (typeof description !== 'string') return '';
    return description.trim().substring(0, 500); // Limit length to prevent issues
  }

  private parseDate(dateStr: string): string {
    try {
      // Handle MM/DD format specifically (like "1/9", "2/4", etc.)
      const mmddMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (mmddMatch) {
        const month = parseInt(mmddMatch[1]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(mmddMatch[2]);
        const currentYear = new Date().getFullYear();
        
        // Create as local date to avoid timezone issues
        const localDate = new Date(currentYear, month, day);
        return this.formatDateToLocal(localDate);
      }
      
      // Handle YYYY-MM-DD format specifically to avoid timezone issues
      const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (yyyymmddMatch) {
        const year = parseInt(yyyymmddMatch[1]);
        const month = parseInt(yyyymmddMatch[2]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(yyyymmddMatch[3]);
        
        // Create as local date to avoid timezone issues
        const localDate = new Date(year, month, day);
        return this.formatDateToLocal(localDate);
      }
      
      // Handle various other date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Return YYYY-MM-DD format to avoid timezone issues
        return this.formatDateToLocal(date);
      }

      // Try parsing academic date patterns
      return this.parseAcademicDate(dateStr);
    } catch {
      // Default to reasonable future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      return this.formatDateToLocal(futureDate);
    }
  }

  private formatDateToLocal(date: Date): string {
    // Format as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        return this.formatDateToLocal(semesterStart);
      }
    }
    
    if (lowerStr.includes('midterm') || lowerStr.includes('mid-semester')) {
      const midterm = new Date(currentYear, 9, 15); // Mid October
      return this.formatDateToLocal(midterm);
    }
    
    if (lowerStr.includes('final')) {
      const finals = new Date(currentYear, 11, 10); // Early December
      return this.formatDateToLocal(finals);
    }
    
    // Default fallback
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return this.formatDateToLocal(futureDate);
  }

  private validateEventType(type: string): 'lecture' | 'homework' | 'exam' | 'project' | 'quiz' | 'other' {
    const validTypes = ['lecture', 'homework', 'exam', 'project', 'quiz', 'other'];
    const lowerType = type?.toLowerCase();
    
    if (validTypes.includes(lowerType)) {
      return lowerType as any;
    }
    
    // Smart mapping
    if (/assignment|hw|homework|submission|due/.test(lowerType)) return 'homework';
    if (/quiz|quizzes/.test(lowerType)) return 'quiz';
    if (/test|midterm|final|assessment|exam/.test(lowerType)) return 'exam';
    if (/class|lecture|session|discussion/.test(lowerType)) return 'lecture';
    if (/project|presentation|paper|report|essay/.test(lowerType)) return 'project';
    
    return 'other';
  }

  private fallbackExtraction(text: string, fileName: string): ExtractedEvent[] {
    console.log('🔄 Using comprehensive rule-based fallback extraction...');
    
    const events: ExtractedEvent[] = [];
    const lines = text.split(/[\n\r]+/);
    
    // Enhanced patterns for academic events with more variations
    const eventPatterns = [
      { regex: /exam|test|midterm|final|assessment|evaluation/i, type: 'exam' as const, confidence: 0.9 },
      { regex: /quiz|quizzes|q\d+/i, type: 'quiz' as const, confidence: 0.85 },
      { regex: /assignment|homework|hw|problem set|ps|lab|due|submit|turn.?in|deadline|deliverable/i, type: 'homework' as const, confidence: 0.85 },
      { regex: /lecture|class|session|meeting|discussion|seminar|workshop|tutorial/i, type: 'lecture' as const, confidence: 0.7 },
      { regex: /project|presentation|paper|report|essay|thesis|proposal|research/i, type: 'project' as const, confidence: 0.8 },
      { regex: /break|holiday|no class|cancelled|vacation/i, type: 'other' as const, confidence: 0.6 },
      { regex: /review|study|office hours|extra credit|optional/i, type: 'other' as const, confidence: 0.6 },
    ];

    // Comprehensive date patterns to catch everything
    const datePatterns = [
      // Standard formats
      { regex: /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, format: 'MM/DD/YYYY' },
      { regex: /(\d{1,2}-\d{1,2}-\d{2,4})/g, format: 'MM-DD-YYYY' },
      { regex: /(\d{1,2}\.\d{1,2}\.\d{2,4})/g, format: 'MM.DD.YYYY' },
      
      // Month formats
      { regex: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}/gi, format: 'Month DD, YYYY' },
      { regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}/gi, format: 'Mon DD, YYYY' },
      { regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?/gi, format: 'Mon DD' },
      { regex: /\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi, format: 'DD Month' },
      
      // Week formats
      { regex: /week\s*(\d+)/gi, format: 'Week N' },
      { regex: /week\s*of\s+(\w+\s+\d{1,2})/gi, format: 'Week of Date' },
      
      // Day formats
      { regex: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{1,2}/gi, format: 'Day, Mon DD' },
      { regex: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*\d{1,2}\/\d{1,2}/gi, format: 'Day, MM/DD' },
      
      // By dates
      { regex: /by\s+(\d{1,2}\/\d{1,2})/gi, format: 'by MM/DD' },
      { regex: /due\s+(\d{1,2}\/\d{1,2})/gi, format: 'due MM/DD' },
      { regex: /due\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{1,2}/gi, format: 'due Mon DD' },
    ];

    // Special pattern for ranges like "March 5-9"
    const rangePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})-(\d{1,2})/gi;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) return;

      // Check for date ranges first
      const rangeMatches = Array.from(trimmedLine.matchAll(rangePattern));
      rangeMatches.forEach(match => {
        const month = match[1];
        const startDay = parseInt(match[2]);
        const endDay = parseInt(match[3]);
        
        // Create events for each day in range (if reasonable range)
        if (endDay - startDay <= 7 && endDay > startDay) {
          for (let day = startDay; day <= endDay; day++) {
            const dateStr = `${month} ${day}`;
            const parsedDate = this.smartDateParsing(dateStr);
            
            // Determine event type and confidence
            let eventType: 'lecture' | 'homework' | 'exam' | 'quiz' | 'project' | 'other' = 'other';
            let confidence = 0.6;
            
            for (const pattern of eventPatterns) {
              if (pattern.regex.test(trimmedLine)) {
                eventType = pattern.type;
                confidence = pattern.confidence;
                break;
              }
            }
            
            const title = this.smartTitleExtraction(trimmedLine) || `Event on ${month} ${day}`;
            
            events.push({
              id: `range-fallback-${Date.now()}-${index}-${day}`,
              title: title,
              date: parsedDate,
              description: trimmedLine,
              eventType: eventType,
              confidence: confidence
            });
          }
        }
      });

      // Check for individual date patterns
      let foundDate = false;
      let extractedDate = '';
      let matchedPattern = '';
      
      for (const datePattern of datePatterns) {
        const matches = Array.from(trimmedLine.matchAll(datePattern.regex));
        if (matches.length > 0) {
          foundDate = true;
          matchedPattern = matches[0][0];
          extractedDate = this.smartDateParsing(matchedPattern);
          break;
        }
      }

      if (!foundDate) return;

      // Determine event type and confidence based on keywords
      let eventType: 'lecture' | 'homework' | 'exam' | 'quiz' | 'project' | 'other' = 'other';
      let confidence = 0.5;
      
      for (const pattern of eventPatterns) {
        if (pattern.regex.test(trimmedLine)) {
          eventType = pattern.type;
          confidence = pattern.confidence;
          break;
        }
      }

      // Boost confidence for explicit due dates
      if (/due|deadline|submit|turn.?in/i.test(trimmedLine)) {
        confidence = Math.min(confidence + 0.1, 1.0);
      }

      // Extract title
      const title = this.smartTitleExtraction(trimmedLine);
      
      if (title.length > 2) {
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

    // Remove duplicates based on title and date
    const uniqueEvents = events.filter((event, index, self) => 
      index === self.findIndex(e => e.title === event.title && e.date === event.date)
    );

    console.log(`✅ Fallback extraction found ${uniqueEvents.length} unique events`);
    return uniqueEvents.slice(0, 25); // Limit results but allow more than before
  }

  private smartDateParsing(dateStr: string): string {
    try {
      const currentYear = 2025; // Use 2025 for the academic year
      
      // Handle MM/DD format specifically (like "1/19", "2/14", etc.)
      const mmddMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
      if (mmddMatch) {
        const month = parseInt(mmddMatch[1]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(mmddMatch[2]);
        
        // Create as local date to avoid timezone issues
        const localDate = new Date(currentYear, month, day);
        return this.formatDateToLocal(localDate);
      }
      
      // Handle "by MM/DD" or "due MM/DD" formats
      const byDueMatch = dateStr.match(/(?:by|due)\s+(\d{1,2})\/(\d{1,2})/i);
      if (byDueMatch) {
        const month = parseInt(byDueMatch[1]) - 1;
        const day = parseInt(byDueMatch[2]);
        const localDate = new Date(currentYear, month, day);
        return this.formatDateToLocal(localDate);
      }
      
      // Handle month day format (like "Jan 15", "Feb 14", "May 8")
      const monthDayMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})/i);
      if (monthDayMatch) {
        const monthMap: {[key: string]: number} = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const month = monthMap[monthDayMatch[1].toLowerCase()];
        const day = parseInt(monthDayMatch[2]);
        
        if (month !== undefined) {
          const localDate = new Date(currentYear, month, day);
          return this.formatDateToLocal(localDate);
        }
      }
      
      // Handle week format more accurately for Spring 2025
      if (/week\s*(\d+)/i.test(dateStr)) {
        const weekMatch = dateStr.match(/week\s*(\d+)/i);
        if (weekMatch) {
          const weekNum = parseInt(weekMatch[1]);
          // Spring 2025 starts January 15, 2025 (Wednesday)
          const semesterStart = new Date(2025, 0, 15); // January 15, 2025
          // Calculate week start (Monday of each week)
          const weekStart = new Date(semesterStart);
          weekStart.setDate(semesterStart.getDate() + (weekNum - 1) * 7);
          // Adjust to Monday if semester doesn't start on Monday
          const dayOfWeek = weekStart.getDay();
          if (dayOfWeek !== 1) { // If not Monday
            weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
          }
          return this.formatDateToLocal(weekStart);
        }
      }
      
      // Handle full month names
      const fullMonthMatch = dateStr.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
      if (fullMonthMatch) {
        const monthMap: {[key: string]: number} = {
          'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
          'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
        };
        const month = monthMap[fullMonthMatch[1].toLowerCase()];
        const day = parseInt(fullMonthMatch[2]);
        
        if (month !== undefined) {
          const localDate = new Date(currentYear, month, day);
          return this.formatDateToLocal(localDate);
        }
      }
      
      // Handle day, month day format (like "Friday, Jan 19")
      const dayMonthMatch = dateStr.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})/i);
      if (dayMonthMatch) {
        const monthMap: {[key: string]: number} = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const month = monthMap[dayMonthMatch[1].toLowerCase()];
        const day = parseInt(dayMonthMatch[2]);
        
        if (month !== undefined) {
          const localDate = new Date(currentYear, month, day);
          return this.formatDateToLocal(localDate);
        }
      }
      
      // Try standard date parsing with current year
      let parsedDate = new Date(dateStr);
      
      // If no year specified or parsed incorrectly, try adding current year
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < currentYear) {
        const withYear = `${dateStr} ${currentYear}`;
        parsedDate = new Date(withYear);
      }
      
      if (!isNaN(parsedDate.getTime())) {
        return this.formatDateToLocal(parsedDate);
      }
      
      // Fallback to reasonable future date
      const futureDate = new Date(2025, 1, 15); // Feb 15, 2025
      return this.formatDateToLocal(futureDate);
      
    } catch {
      const futureDate = new Date(2025, 1, 15); // Feb 15, 2025
      return this.formatDateToLocal(futureDate);
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