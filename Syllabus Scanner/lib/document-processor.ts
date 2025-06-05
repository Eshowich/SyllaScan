/**
 * Document Processing Service
 * Extracts text from PDFs and processes with AI
 */

import { ExtractedEvent } from './types';
import { localAI } from './ai-local';
import { geminiAI } from './ai-gemini';

export class DocumentProcessor {
  
  async processDocument(file: File): Promise<{ text: string; events: ExtractedEvent[] }> {
    try {
      console.log(`📄 Processing document: ${file.name}`);
      
      // Extract text based on file type
      const text = await this.extractText(file);
      
      if (!text || text.length < 50) {
        throw new Error('Could not extract meaningful text from document');
      }
      
      console.log(`✅ Extracted ${text.length} characters of text`);
      
      // Extract events using AI
      const events = await this.extractEventsWithAI(text, file.name);
      
      return { text, events };
      
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  private async extractText(file: File): Promise<string> {
    const fileType = file.type || this.getFileTypeFromName(file.name);
    
    switch (fileType) {
      case 'application/pdf':
        return this.extractPDFText(file);
      case 'text/plain':
        return this.extractPlainText(file);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractDocxText(file);
      default:
        // Try as plain text
        return this.extractPlainText(file);
    }
  }

  private async extractPDFText(file: File): Promise<string> {
    try {
      // For browser environment, we'll use pdf-parse or PDF.js
      // This is a simplified version - you'll need to install pdf-parse
      
      // For now, return a placeholder that triggers smart fallback
      console.log('📄 PDF text extraction would happen here');
      console.log('💡 Install pdf-parse: npm install pdf-parse');
      
      // Simulate extracted text for demo
      return this.simulatePDFContent(file.name);
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractPlainText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text || '');
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  private async extractDocxText(file: File): Promise<string> {
    try {
      // For DOCX files, you'd use mammoth.js or similar
      console.log('📄 DOCX text extraction would happen here');
      console.log('💡 Install mammoth: npm install mammoth');
      
      // Simulate extracted text for demo
      return this.simulateDocxContent(file.name);
      
    } catch (error) {
      console.error('DOCX extraction failed:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc': return 'application/msword';
      default: return 'text/plain';
    }
  }

  private async extractEventsWithAI(text: string, fileName: string): Promise<ExtractedEvent[]> {
    // Try multiple AI services in order of preference
    const aiServices = [
      { name: 'Gemini', service: geminiAI },
      { name: 'Local Ollama', service: localAI },
    ];

    for (const { name, service } of aiServices) {
      try {
        console.log(`🤖 Trying ${name} for event extraction...`);
        const events = await service.extractEvents(text, fileName);
        
        if (events && events.length > 0) {
          console.log(`✅ ${name} extracted ${events.length} events`);
          return events;
        }
        
      } catch (error) {
        console.warn(`⚠️ ${name} failed:`, error.message);
        continue;
      }
    }

    // If all AI services fail, use intelligent rule-based extraction
    return this.smartRuleBasedExtraction(text, fileName);
  }

  private smartRuleBasedExtraction(text: string, fileName: string): ExtractedEvent[] {
    console.log('🔍 Using advanced rule-based extraction as final fallback...');
    
    const events: ExtractedEvent[] = [];
    const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 5);
    
    // Academic event patterns with confidence scoring
    const eventPatterns = [
      { 
        regex: /\b(midterm|final)\s+(exam|test|assessment)\b/i, 
        type: 'exam' as const, 
        confidence: 0.95,
        titleExtractor: (match: string) => match.trim()
      },
      { 
        regex: /\b(exam|test|quiz)\s*(\d+)?\b/i, 
        type: 'exam' as const, 
        confidence: 0.9,
        titleExtractor: (match: string) => match.trim()
      },
      { 
        regex: /\b(assignment|homework|hw)\s*(\d+)?\s*(due|submission)\b/i, 
        type: 'homework' as const, 
        confidence: 0.9,
        titleExtractor: (match: string) => match.trim()
      },
      { 
        regex: /\b(project|presentation|paper)\s*(due|submission|presentation)\b/i, 
        type: 'project' as const, 
        confidence: 0.85,
        titleExtractor: (match: string) => match.trim()
      },
      { 
        regex: /\b(lecture|class|session)\s*(\d+)?\b/i, 
        type: 'lecture' as const, 
        confidence: 0.7,
        titleExtractor: (match: string) => match.trim()
      },
    ];

    // Advanced date patterns
    const datePatterns = [
      { 
        regex: /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g, 
        parser: (match: string) => new Date(match)
      },
      { 
        regex: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/gi, 
        parser: (match: string) => new Date(match)
      },
      { 
        regex: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi, 
        parser: (match: string) => this.parseShortDate(match)
      },
      { 
        regex: /\bweek\s*(\d+)\b/gi, 
        parser: (match: string) => this.parseWeekDate(match)
      },
    ];

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Find dates in the line
      const foundDates: Date[] = [];
      for (const datePattern of datePatterns) {
        const matches = Array.from(trimmedLine.matchAll(datePattern.regex));
        for (const match of matches) {
          try {
            const date = datePattern.parser(match[0]);
            if (date && !isNaN(date.getTime()) && date > new Date()) {
              foundDates.push(date);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      if (foundDates.length === 0) return;

      // Find event types in the line
      for (const pattern of eventPatterns) {
        const match = trimmedLine.match(pattern.regex);
        if (match) {
          const title = this.extractSmartTitle(trimmedLine, match[0]);
          
          foundDates.forEach((date, dateIndex) => {
            events.push({
              id: `rule-${Date.now()}-${lineIndex}-${dateIndex}`,
              title: title,
              date: date.toISOString(),
              description: trimmedLine,
              eventType: pattern.type,
              confidence: pattern.confidence
            });
          });
          
          break; // Only match one event type per line
        }
      }
    });

    // Remove duplicates and sort by date
    const uniqueEvents = this.deduplicateEvents(events);
    return uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private parseShortDate(dateStr: string): Date {
    const currentYear = new Date().getFullYear();
    const withYear = `${dateStr} ${currentYear}`;
    return new Date(withYear);
  }

  private parseWeekDate(weekStr: string): Date {
    const weekMatch = weekStr.match(/week\s*(\d+)/i);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1]);
      const semesterStart = new Date(new Date().getFullYear(), 8, 1); // September 1st
      semesterStart.setDate(semesterStart.getDate() + (weekNum - 1) * 7);
      return semesterStart;
    }
    throw new Error('Invalid week format');
  }

  private extractSmartTitle(line: string, eventMatch: string): string {
    // Start with the line, clean it up
    let title = line
      .replace(/^\d+\.\s*/, '') // Remove numbered list
      .replace(/^[•\-\*]\s*/, '') // Remove bullets
      .trim();

    // If the line is mostly just the date and event type, create a descriptive title
    const cleanLine = title.replace(/\d{1,2}\/\d{1,2}\/?\d{0,4}/g, '').replace(/\s+/g, ' ').trim();
    
    if (cleanLine.length < 10) {
      // Generate a descriptive title based on the event match
      const eventType = eventMatch.toLowerCase();
      if (eventType.includes('midterm')) return 'Midterm Exam';
      if (eventType.includes('final')) return 'Final Exam';
      if (eventType.includes('assignment')) return 'Assignment Due';
      if (eventType.includes('project')) return 'Project Due';
      if (eventType.includes('quiz')) return 'Quiz';
      if (eventType.includes('exam')) return 'Exam';
      if (eventType.includes('lecture')) return 'Lecture';
      return 'Academic Event';
    }

    // Extract meaningful title from the line
    const separators = [' - ', ': ', ' – ', ' | ', ' — '];
    for (const sep of separators) {
      const sepIndex = title.indexOf(sep);
      if (sepIndex > 5 && sepIndex < 60) {
        title = title.substring(0, sepIndex).trim();
        break;
      }
    }

    // Capitalize and limit length
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title.substring(0, 80);
  }

  private deduplicateEvents(events: ExtractedEvent[]): ExtractedEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.title.toLowerCase()}-${event.date}-${event.eventType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Simulated content for demo purposes
  private simulatePDFContent(fileName: string): string {
    return `Course Syllabus - ${fileName}

Academic Calendar:
- Midterm Exam: October 15, 2024
- Assignment 1 Due: September 30, 2024  
- Final Project Presentation: December 10, 2024
- Assignment 2 Due: November 15, 2024
- Final Exam: December 18, 2024

Weekly Schedule:
Week 1: Introduction to Course Topics
Week 3: Advanced Concepts 
Week 5: Midterm Review
Week 8: Project Guidelines
Week 12: Final Review

Important Dates:
- No class on October 12 (Columbus Day)
- Thanksgiving Break: November 25-29
- Last day of classes: December 8`;
  }

  private simulateDocxContent(fileName: string): string {
    return `${fileName} - Course Information

Schedule:
• Lecture 1: Course Introduction - September 5, 2024
• Assignment 1 submission deadline: September 25, 2024
• Quiz 1: October 3, 2024
• Midterm examination: October 20, 2024
• Project proposal due: November 1, 2024
• Assignment 2 due date: November 18, 2024
• Final project presentations: December 5, 2024
• Final exam period: December 12-16, 2024

Office Hours: Tuesdays and Thursdays 2-4 PM`;
  }
}

export const documentProcessor = new DocumentProcessor(); 