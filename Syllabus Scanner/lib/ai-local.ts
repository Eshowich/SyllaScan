/**
 * Local AI Service using Ollama
 * Completely free, runs on your machine
 * Install: https://ollama.ai
 */

import { ExtractedEvent } from './types';

interface OllamaResponse {
  response: string;
  done: boolean;
}

export class LocalAIService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.1:8b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async extractEvents(text: string, fileName: string): Promise<ExtractedEvent[]> {
    try {
      console.log('🤖 Extracting events using local Ollama...');
      
      const prompt = this.createExtractionPrompt(text, fileName);
      const response = await this.callOllama(prompt);
      
      return this.parseEvents(response, fileName);
    } catch (error) {
      console.error('Local AI extraction failed:', error);
      // Fallback to rule-based extraction
      return this.fallbackExtraction(text, fileName);
    }
  }

  private createExtractionPrompt(text: string, fileName: string): string {
    return `You are an expert at extracting academic events from syllabus documents. 

TASK: Extract all important dates and events from this syllabus text.

SYLLABUS TEXT:
${text}

FILENAME: ${fileName}

INSTRUCTIONS:
1. Find ALL dates and deadlines mentioned in the text
2. Classify each as: lecture, homework, exam, project, or other
3. Extract the title, date, and description
4. Return ONLY valid JSON in this exact format:

{
  "events": [
    {
      "title": "Event Title",
      "date": "YYYY-MM-DD",
      "description": "Brief description",
      "eventType": "exam|homework|lecture|project|other",
      "confidence": 0.95
    }
  ]
}

IMPORTANT: 
- Return ONLY the JSON, no other text
- Use ISO date format (YYYY-MM-DD)
- Be conservative with confidence scores
- Include time if mentioned (use ISO datetime format)

JSON:`;
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistency
          num_predict: 2000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  }

  private parseEvents(response: string, fileName: string): ExtractedEvent[] {
    try {
      // Clean the response to extract JSON
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = response.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.events || !Array.isArray(parsed.events)) {
        throw new Error('Invalid events format');
      }

      return parsed.events.map((event: any, index: number) => ({
        id: `local-${Date.now()}-${index}`,
        title: event.title || 'Untitled Event',
        date: this.parseDate(event.date),
        description: event.description || '',
        eventType: this.validateEventType(event.eventType),
        confidence: Math.min(Math.max(event.confidence || 0.5, 0), 1)
      }));

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.fallbackExtraction(response, fileName);
    }
  }

  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try to parse relative dates like "next Monday"
        return this.parseRelativeDate(dateStr);
      }
      return date.toISOString();
    } catch {
      // Default to 2 weeks from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      return futureDate.toISOString();
    }
  }

  private parseRelativeDate(dateStr: string): string {
    const now = new Date();
    const lowerStr = dateStr.toLowerCase();
    
    if (lowerStr.includes('next week')) {
      now.setDate(now.getDate() + 7);
    } else if (lowerStr.includes('next month')) {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setDate(now.getDate() + 7); // Default to next week
    }
    
    return now.toISOString();
  }

  private validateEventType(type: string): 'lecture' | 'homework' | 'exam' | 'project' | 'other' {
    const validTypes = ['lecture', 'homework', 'exam', 'project', 'other'];
    return validTypes.includes(type) ? type as any : 'other';
  }

  private fallbackExtraction(text: string, fileName: string): ExtractedEvent[] {
    console.log('🔄 Using rule-based fallback extraction...');
    
    const events: ExtractedEvent[] = [];
    const lines = text.split('\n');
    
    // Common patterns for academic events
    const patterns = [
      { regex: /exam|test|midterm|final/i, type: 'exam' as const },
      { regex: /assignment|homework|hw|due|submit/i, type: 'homework' as const },
      { regex: /lecture|class|session/i, type: 'lecture' as const },
      { regex: /project|presentation|paper/i, type: 'project' as const },
    ];

    // Date patterns (MM/DD, DD/MM, Month DD, etc.)
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/?\d{0,4})/g,
      /(\d{1,2}-\d{1,2}-?\d{0,4})/g,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}/gi,
    ];

    lines.forEach((line, index) => {
      // Skip empty lines or headers
      if (line.trim().length < 10) return;

      // Check if line contains date patterns
      let hasDate = false;
      for (const pattern of datePatterns) {
        if (pattern.test(line)) {
          hasDate = true;
          break;
        }
      }

      if (!hasDate) return;

      // Determine event type
      let eventType: 'lecture' | 'homework' | 'exam' | 'project' | 'other' = 'other';
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          eventType = pattern.type;
          break;
        }
      }

      // Extract potential date
      const date = this.extractDateFromLine(line);
      
      events.push({
        id: `fallback-${Date.now()}-${index}`,
        title: this.extractTitle(line),
        date: date,
        description: line.trim(),
        eventType: eventType,
        confidence: 0.6 // Lower confidence for rule-based
      });
    });

    return events.slice(0, 20); // Limit to 20 events
  }

  private extractDateFromLine(line: string): string {
    // Simple date extraction - you can make this more sophisticated
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/);
    if (dateMatch) {
      try {
        const currentYear = new Date().getFullYear();
        const dateStr = `${dateMatch[1]}/${currentYear}`;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {}
    }
    
    // Default to future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.random() * 60); // Random future date
    return futureDate.toISOString();
  }

  private extractTitle(line: string): string {
    // Remove common prefixes and clean up
    let title = line
      .replace(/^\d+\.\s*/, '') // Remove numbered list
      .replace(/^-\s*/, '')     // Remove dash
      .replace(/^\*\s*/, '')    // Remove asterisk
      .trim();
    
    // Take first part before colon or dash
    const colonIndex = title.indexOf(':');
    if (colonIndex > 0 && colonIndex < 50) {
      title = title.substring(0, colonIndex);
    }
    
    const dashIndex = title.indexOf(' - ');
    if (dashIndex > 0 && dashIndex < 50) {
      title = title.substring(0, dashIndex);
    }
    
    return title.substring(0, 100); // Limit length
  }

  async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch {
      return [];
    }
  }
}

export const localAI = new LocalAIService(); 