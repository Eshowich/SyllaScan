"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Play, 
  Pause, 
  Square, 
  Coffee,
  Target,
  Clock,
  CheckCircle,
  TrendingUp,
  Brain,
  Flame,
  Timer,
  RotateCcw,
  Plus,
  BookOpen,
  Zap,
  Settings,
  Volume2
} from "lucide-react"

interface StudySession {
  id: string
  subject: string
  duration: number
  startTime: Date
  endTime: Date
  isCompleted: boolean
  focusScore: number
}

const FOCUS_DURATIONS = [
  { value: 15, label: "15 minutes", icon: "⚡" },
  { value: 25, label: "25 minutes (Pomodoro)", icon: "🍅" },
  { value: 30, label: "30 minutes", icon: "⏰" },
  { value: 45, label: "45 minutes", icon: "📚" },
  { value: 60, label: "1 hour", icon: "🎯" },
  { value: 90, label: "1.5 hours", icon: "🔥" }
]

const BREAK_DURATIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" }
]

export function StudySessionTracker() {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [time, setTime] = useState(25 * 60) // Default 25 minutes in seconds
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus')
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [currentSubject, setCurrentSubject] = useState('General Study')
  const [totalStudyTime, setTotalStudyTime] = useState(0)
  const [streak, setStreak] = useState(3)
  const [focusDuration, setFocusDuration] = useState(25) // minutes
  const [breakDuration, setBreakDuration] = useState(5) // minutes
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime(time => {
          if (time <= 0) {
            handleSessionComplete()
            return sessionType === 'focus' ? breakDuration * 60 : focusDuration * 60
          }
          return time - 1
        })
      }, 1000)
    } else {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused, sessionType, focusDuration, breakDuration])

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleReset = () => {
    setIsActive(false)
    setIsPaused(false)
    setTime(sessionType === 'focus' ? focusDuration * 60 : breakDuration * 60)
  }

  const handleSessionComplete = () => {
    if (sessionType === 'focus') {
      const newSession: StudySession = {
        id: Date.now().toString(),
        subject: currentSubject,
        duration: focusDuration,
        startTime: new Date(Date.now() - focusDuration * 60 * 1000),
        endTime: new Date(),
        isCompleted: true,
        focusScore: Math.random() * 30 + 70 // Mock focus score 70-100%
      }
      setSessions(prev => [newSession, ...prev])
      setTotalStudyTime(prev => prev + focusDuration)
      setSessionType('break')
      setTime(breakDuration * 60)
    } else {
      setSessionType('focus')
      setTime(focusDuration * 60)
    }
    setIsActive(false)
    setIsPaused(false)
  }

  const handleDurationChange = (newDuration: number) => {
    if (sessionType === 'focus') {
      setFocusDuration(newDuration)
      if (!isActive) {
        setTime(newDuration * 60)
      }
    } else {
      setBreakDuration(newDuration)
      if (!isActive) {
        setTime(newDuration * 60)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = sessionType === 'focus' 
    ? ((focusDuration * 60 - time) / (focusDuration * 60)) * 100
    : ((breakDuration * 60 - time) / (breakDuration * 60)) * 100

  const todaySessions = sessions.filter(session => 
    session.startTime.toDateString() === new Date().toDateString()
  )

  const avgFocusScore = sessions.length > 0 
    ? sessions.reduce((acc, session) => acc + session.focusScore, 0) / sessions.length
    : 0

  const currentDuration = sessionType === 'focus' ? focusDuration : breakDuration
  const availableDurations = sessionType === 'focus' ? FOCUS_DURATIONS : BREAK_DURATIONS

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Session Settings
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Focus Duration</label>
                  <Select 
                    value={focusDuration.toString()} 
                    onValueChange={(value) => handleDurationChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOCUS_DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {duration.icon} {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Break Duration</label>
                  <Select 
                    value={breakDuration.toString()} 
                    onValueChange={(value) => setBreakDuration(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BREAK_DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          ⏱️ {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Timer */}
      <Card className={`
        shadow-xl transition-all duration-500 overflow-hidden
        ${sessionType === 'focus' 
          ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800' 
          : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
        }
      `}>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="opacity-70 hover:opacity-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <CardTitle className="flex items-center gap-2 text-2xl">
              {sessionType === 'focus' ? (
                <>
                  <Target className="h-6 w-6 text-blue-500" />
                  Focus Session
                </>
              ) : (
                <>
                  <Coffee className="h-6 w-6 text-green-500" />
                  Break Time
                </>
              )}
            </CardTitle>

            <Button
              variant="ghost"
              size="sm"
              className="opacity-70 hover:opacity-100"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          
          <CardDescription className="text-lg">
            {sessionType === 'focus' 
              ? `Studying: ${currentSubject} (${currentDuration} min session)` 
              : `Take a well-deserved break (${currentDuration} min)`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-8 px-8 pb-8">
          {/* Timer Display */}
          <div className="relative flex items-center justify-center">
            <div className="text-8xl md:text-9xl font-mono font-bold text-gray-900 dark:text-gray-100 relative z-10">
              {formatTime(time)}
            </div>
            <div className={`
              absolute inset-0 flex items-center justify-center
              ${isActive ? 'animate-pulse' : ''}
            `}>
              <div className="w-80 h-80 rounded-full border-4 border-gray-200 dark:border-gray-700 opacity-20"></div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className={`h-4 ${sessionType === 'focus' ? 'bg-blue-100' : 'bg-green-100'}`}
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>0:00</span>
              <span>{Math.round(progress)}% complete</span>
              <span>{formatTime(currentDuration * 60)}</span>
            </div>
          </div>

          {/* Quick Duration Selector */}
          {!isActive && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quick select duration:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {availableDurations.map((duration) => (
                  <Button
                    key={duration.value}
                    onClick={() => handleDurationChange(duration.value)}
                    variant={currentDuration === duration.value ? 'default' : 'outline'}
                    size="sm"
                    className={`
                      text-xs transition-all duration-200 hover:scale-105
                      ${currentDuration === duration.value ? 
                        (sessionType === 'focus' ? 'bg-blue-500' : 'bg-green-500') : 
                        ''
                      }
                    `}
                  >
                    {'icon' in duration ? duration.icon : '⏱️'} {duration.label.replace(' (Pomodoro)', '')}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isActive ? (
              <Button 
                onClick={handleStart}
                size="lg"
                className={`
                  px-10 py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-200
                  ${sessionType === 'focus' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-green-600 hover:bg-green-700'
                  }
                `}
              >
                <Play className="h-6 w-6 mr-3" />
                Start {sessionType === 'focus' ? 'Focus' : 'Break'}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handlePause}
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleReset}
                  size="lg"
                  variant="destructive"
                  className="px-8 py-4 text-lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
            <Button 
              onClick={handleReset}
              size="lg"
              variant="ghost"
              className="px-8 py-4 text-lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Subject Selection */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { name: 'Mathematics', emoji: '📊', color: 'bg-blue-500' },
              { name: 'Computer Science', emoji: '💻', color: 'bg-purple-500' },
              { name: 'Physics', emoji: '⚛️', color: 'bg-green-500' },
              { name: 'General Study', emoji: '📚', color: 'bg-gray-500' }
            ].map((subject) => (
              <Button
                key={subject.name}
                onClick={() => setCurrentSubject(subject.name)}
                variant={currentSubject === subject.name ? 'default' : 'outline'}
                size="sm"
                className={`
                  ${currentSubject === subject.name ? subject.color : ''}
                  transition-all duration-200 hover:scale-105
                `}
              >
                {subject.emoji} {subject.name.split(' ')[0]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Study Streak</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Today</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{todaySessions.length} sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Time</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalStudyTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Focus Score</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{Math.round(avgFocusScore)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Study Sessions
          </CardTitle>
          <CardDescription>Your latest completed focus sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Timer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No sessions yet</p>
              <p className="text-sm">Start your first focus session above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      <p className="text-sm text-gray-500">
                        {session.duration} min • {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {Math.round(session.focusScore)}%
                    </Badge>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Productivity Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Study Pattern</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Morning (6-12 PM)</span>
                  <span className="font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>Afternoon (12-6 PM)</span>
                  <span className="font-medium">30%</span>
                </div>
                <Progress value={30} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>Evening (6-11 PM)</span>
                  <span className="font-medium">25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Subject Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>📊 Mathematics</span>
                  <span className="font-medium">40%</span>
                </div>
                <Progress value={40} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>💻 Computer Science</span>
                  <span className="font-medium">35%</span>
                </div>
                <Progress value={35} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>⚛️ Physics</span>
                  <span className="font-medium">25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">AI Recommendation</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your focus score is highest during morning sessions (8-10 AM). 
                  Consider scheduling your most challenging subjects during this time window.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 