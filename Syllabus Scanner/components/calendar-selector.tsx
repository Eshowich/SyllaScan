"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Calendar {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

interface CalendarSelectorProps {
  onSelect: (calendarId: string) => void
  selectedCalendarId?: string
  className?: string
}

export function CalendarSelector({ onSelect, selectedCalendarId = "primary", className }: CalendarSelectorProps) {
  const [open, setOpen] = useState(false)
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCalendars = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/google-calendar/list")

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch calendars")
        }

        const data = await response.json()
        setCalendars(data.calendars || [])
      } catch (err) {
        console.error("Error fetching calendars:", err)
        setError(err.message || "Failed to load calendars")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendars()
  }, [])

  // Find the selected calendar
  const selectedCalendar =
    calendars.find((cal) => cal.id === selectedCalendarId) ||
    (selectedCalendarId === "primary" ? { id: "primary", summary: "Primary Calendar" } : null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading calendars...</span>
            </div>
          ) : error ? (
            <span className="text-destructive">Error loading calendars</span>
          ) : selectedCalendar ? (
            <div className="flex items-center gap-2">
              {selectedCalendar.backgroundColor && (
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedCalendar.backgroundColor }} />
              )}
              <span>{selectedCalendar.summary}</span>
            </div>
          ) : (
            <span>Select a calendar</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search calendars..." />
          <CommandList>
            <CommandEmpty>No calendar found.</CommandEmpty>
            <CommandGroup>
              {calendars.map((calendar) => (
                <CommandItem
                  key={calendar.id}
                  value={calendar.id}
                  onSelect={(value) => {
                    onSelect(value)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    {calendar.backgroundColor && (
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.backgroundColor }} />
                    )}
                    <span>{calendar.summary}</span>
                    {calendar.primary && <span className="text-xs text-muted-foreground ml-auto">(Primary)</span>}
                  </div>
                  <Check
                    className={cn("ml-auto h-4 w-4", selectedCalendarId === calendar.id ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
