"use client"

import { useMemo, useState, useEffect } from "react"
import { Calendar, Cake, Timer, Hourglass, CalendarDays, Heart, Wind, Eye, Bed, UtensilsCrossed, Droplet, Smile, Footprints, History, Music, Cpu, Star, Trophy, Target, RefreshCw } from "lucide-react"
import { FinancialCalculatorTemplate, ResultCard } from "@/components/calculators/templates/FinancialCalculatorTemplate"
import { AgeSeoContent } from "@/components/calculators/seo/MiscSeo"
import { VoiceDateInput } from "@/components/ui/VoiceDateInput"
import { VoiceTimeInput } from "@/components/ui/VoiceTimeInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR
const DAYS_PER_YEAR_AVG = 365.2425

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatNumber(n: number) {
  try {
    return n.toLocaleString('en-IN')
  } catch {
    return n.toLocaleString()
  }
}

function roundTo(n: number, decimals: number) {
  const p = Math.pow(10, decimals)
  return Math.round(n * p) / p
}

function parseDateTimeLocal(dateStr: string, timeStr: string) {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])

  let hh = 0, mm = 0, ss = 0
  const t = timeStr.trim()
  if (t) {
    const tm = /^([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(t)
    if (!tm) return null
    hh = Number(tm[1])
    mm = Number(tm[2])
    ss = Number(tm[3] ?? '0')
  }

  const dt = new Date(y, mo, d, hh, mm, ss, 0)
  if (!Number.isFinite(dt.getTime())) return null
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}


function countLeapDaysLived(birth: Date, now: Date) {
  const startYear = birth.getFullYear()
  const endYear = now.getFullYear()
  let count = 0
  for (let y = startYear; y <= endYear; y++) {
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)
    if (!isLeap) continue
    const feb29 = new Date(y, 1, 29, 0, 0, 0, 0)
    if (feb29.getTime() >= birth.getTime() && feb29.getTime() <= now.getTime()) {
      count++
    }
  }
  return count
}

function getNextBirthday(birth: Date, now: Date) {
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate(), birth.getHours(), birth.getMinutes(), birth.getSeconds(), 0)
  if (next.getTime() <= now.getTime()) next.setFullYear(next.getFullYear() + 1)
  if (birth.getMonth() === 1 && birth.getDate() === 29) {
    const y = next.getFullYear()
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)
    if (!isLeap) next.setMonth(1, 28)
  }
  return next
}

function diffYMDDateOnly(birth: Date, now: Date) {
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  return { years, months, days }
}

type AgeCalcResult =
  | { kind: 'error'; error: string }
  | {
      kind: 'ok'
      birthDate: Date
      now: Date
      ymd: { years: number; months: number; days: number }
      totalMonthsCompleted: number
      totalWeeks: number
      totalDays: number
      totalHours: number
      totalMinutes: number
      totalSeconds: number
      totalMilliseconds: number
      liveDaysClock: string
      liveYmdClock: string
      nextBirthday: Date
      daysToBirthday: number
      hrsToBirthday: number
      minsToBirthday: number
      secsToBirthday: number
      dayBorn: string
      leapDays: number

      // Extra insights (estimates)
      earthAgeYears: number
      galacticAge: {
        mercuryYears: number
        venusYears: number
        marsYears: number
        jupiterYears: number
      }
      biologicalEstimates: {
        heartbeats: number
        breathsTaken: number
        timesBlinked: number
        hoursSlept: number
        mealsEaten: number
        waterDrunkLiters: number
        timesSmiled: number
        stepsWalkedApprox: number
      }

      milestones: Array<{
        days: number
        label: string
        emoji: string
        achieved: boolean
        achievedDate: Date | null
      }>
      birthdayHistory: {
        famousEvent: string
        popularSong: string
        technology: string
        famousBirthday: string
      }
      birthYear: number
    }

export function AdvancedAgeCalculator() {
  const [dob, setDob] = useState('2000-01-01')
  const [tob, setTob] = useState('00:00')
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0])
  const [asOfTime, setAsOfTime] = useState('00:00')
  const [now, setNow] = useState(() => new Date())
  const [useLiveMode, setUseLiveMode] = useState(true)

  const resetAll = () => {
    setDob('2000-01-01')
    setTob('00:00')
    setAsOfDate(new Date().toISOString().split('T')[0])
    setAsOfTime('00:00')
    setNow(new Date())
    setUseLiveMode(true)
  }

  const calculateAge = () => {
    if (useLiveMode) {
      setNow(new Date())
    } else {
      const asOf = parseDateTimeLocal(asOfDate, asOfTime)
      if (asOf) {
        setNow(asOf)
      }
    }
  }

  useEffect(() => {
    if (useLiveMode) {
      const interval = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(interval)
    }
  }, [useLiveMode])

  const result: AgeCalcResult = useMemo(() => {
    const birthDate = parseDateTimeLocal(dob, tob)
    if (!birthDate) return { kind: 'error', error: 'Please enter a valid date/time.' }
    if (birthDate.getTime() > now.getTime()) {
      return { kind: 'error', error: 'Date of birth cannot be in the future.' }
    }

    const ymd = diffYMDDateOnly(birthDate, now)
    const totalMs = now.getTime() - birthDate.getTime()
    const totalSeconds = Math.floor(totalMs / MS_PER_SECOND)
    const totalMinutes = Math.floor(totalMs / MS_PER_MINUTE)
    const totalHours = Math.floor(totalMs / MS_PER_HOUR)
    const totalDays = Math.floor(totalMs / MS_PER_DAY)
    const totalWeeks = Math.floor(totalDays / 7)

    const days = totalDays
    const hours = Math.floor((totalMs % MS_PER_DAY) / MS_PER_HOUR)
    const minutes = Math.floor((totalMs % MS_PER_HOUR) / MS_PER_MINUTE)
    const seconds = Math.floor((totalMs % MS_PER_MINUTE) / MS_PER_SECOND)

    const nextBirthday = getNextBirthday(birthDate, now)
    const msToBirthday = nextBirthday.getTime() - now.getTime()
    const daysToBirthday = Math.max(0, Math.floor(msToBirthday / MS_PER_DAY))
    const hrsToBirthday = Math.max(0, Math.floor((msToBirthday % MS_PER_DAY) / MS_PER_HOUR))
    const minsToBirthday = Math.max(0, Math.floor((msToBirthday % MS_PER_HOUR) / MS_PER_MINUTE))
    const secsToBirthday = Math.max(0, Math.floor((msToBirthday % MS_PER_MINUTE) / MS_PER_SECOND))

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayBorn = daysOfWeek[birthDate.getDay()]
    const leapDays = countLeapDaysLived(birthDate, now)

    const totalMonthsCompleted = ymd.years * 12 + ymd.months

    const earthAgeYears = totalMs / (DAYS_PER_YEAR_AVG * MS_PER_DAY)
    // Orbital periods in Earth years (approx)
    const mercuryOrbital = 0.2408467
    const venusOrbital = 0.61519726
    const marsOrbital = 1.8808158
    const jupiterOrbital = 11.862615

    // Biological estimate assumptions (kept intentionally simple + labeled as estimates)
    const avgHeartRateBpm = 72
    const avgBreathsPerMin = 16
    const avgBlinksPerMinAwake = 15
    const sleepHoursPerDay = 8
    const mealsPerDay = 3
    const waterLitersPerDay = 2
    const smilesPerDay = 20
    const stepsPerDay = 7500

    const totalMinutesLived = totalMinutes
    const totalMinutesAwake = Math.max(0, totalMinutesLived - totalDays * sleepHoursPerDay * 60)

    return {
      kind: 'ok',
      birthDate,
      now,
      ymd,
      totalMonthsCompleted,
      totalWeeks,
      totalDays,
      totalHours,
      totalMinutes,
      totalSeconds,
      totalMilliseconds: totalMs,
      liveDaysClock: `${formatNumber(days)}:${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`,
      liveYmdClock: `${formatNumber(ymd.years)}Y ${formatNumber(ymd.months)}M ${formatNumber(ymd.days)}D ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`,
      nextBirthday,
      daysToBirthday,
      hrsToBirthday,
      minsToBirthday,
      secsToBirthday,
      dayBorn,
      leapDays,

      earthAgeYears,
      galacticAge: {
        mercuryYears: earthAgeYears / mercuryOrbital,
        venusYears: earthAgeYears / venusOrbital,
        marsYears: earthAgeYears / marsOrbital,
        jupiterYears: earthAgeYears / jupiterOrbital,
      },
      biologicalEstimates: {
        heartbeats: Math.floor(totalMinutesLived * avgHeartRateBpm),
        breathsTaken: Math.floor(totalMinutesLived * avgBreathsPerMin),
        timesBlinked: Math.floor(totalMinutesAwake * avgBlinksPerMinAwake),
        hoursSlept: Math.floor(totalDays * sleepHoursPerDay),
        mealsEaten: Math.floor(totalDays * mealsPerDay),
        waterDrunkLiters: Math.floor(totalDays * waterLitersPerDay),
        timesSmiled: Math.floor(totalDays * smilesPerDay),
        stepsWalkedApprox: Math.floor(totalDays * stepsPerDay),
      },
      milestones: [
        { days: 1000, label: '1,000 Days Milestone', emoji: '🏆' },
        { days: 5000, label: '5,000 Days Milestone', emoji: '🌟' },
        { days: 7500, label: '7,500 Days Milestone', emoji: '⭐' },
        { days: 10000, label: '10,000 Days Milestone', emoji: '💫' },
        { days: 15000, label: '15,000 Days Milestone', emoji: '✨' },
        { days: 20000, label: '20,000 Days Milestone', emoji: '🎯' },
      ].map(m => {
        const achieved = totalDays >= m.days
        let achievedDate = null
        if (achieved) {
          const ms = birthDate.getTime() + (m.days * MS_PER_DAY)
          achievedDate = new Date(ms)
        }
        return { ...m, achieved, achievedDate }
      }),
      birthdayHistory: {
        famousEvent: `Historical event from ${birthDate.getFullYear()}`,
        popularSong: 'Popular song of the year',
        technology: `Tech innovation from ${birthDate.getFullYear()}`,
        famousBirthday: 'Famous person born on this date',
      },
      birthYear: birthDate.getFullYear(),
    }
  }, [dob, tob, now])

  useEffect(() => {
    if (useLiveMode) {
      setNow(new Date())
    } else {
      const asOf = parseDateTimeLocal(asOfDate, asOfTime)
      if (asOf) {
        setNow(asOf)
      }
    }
  }, [dob, tob, asOfDate, asOfTime, useLiveMode])

  return (
    <FinancialCalculatorTemplate
      title="Advanced Age Calculator"
      description="Live age tracker with ultra-detailed breakdown: years/months/days + total days/hours/minutes/seconds, next birthday countdown, and leap-day stats."
      icon={Calendar}
      calculate={calculateAge}
      calculateLabel="Analyze My Life"
      defaultAutoCalculate
      values={[dob, tob, asOfDate, asOfTime, useLiveMode]}
      onClear={resetAll}
      seoContent={<AgeSeoContent />}
      inputs={
        <div className="space-y-6">
          <div className="flex items-start justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetAll}
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Reload"
              aria-label="Reload"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Date of Birth (Type or Select)</Label>
            <VoiceDateInput
              label=""
              value={dob}
              onChangeAction={setDob}
              inputClassName="p-4 rounded-xl bg-secondary/20 border border-transparent hover:border-primary/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Time of Birth (Optional)</Label>
            <VoiceTimeInput value={tob} onChange={setTob} showSeconds />
            <p className="text-xs text-muted-foreground">Leave as 00:00 if you don't know the exact time.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Calculate As Of</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => {
                setAsOfDate(e.target.value)
                setUseLiveMode(false)
              }}
              className="w-full p-4 rounded-xl bg-secondary/20 border border-transparent hover:border-primary/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-lg"
            />
            <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground mt-3 block">Time (Optional)</Label>
            <VoiceTimeInput
              value={asOfTime}
              onChange={(next) => {
                setAsOfTime(next)
                setUseLiveMode(false)
              }}
              disabled={useLiveMode}
              showSeconds
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="liveMode"
                checked={useLiveMode}
                onChange={(e) => setUseLiveMode(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="liveMode" className="text-xs text-muted-foreground cursor-pointer">
                Use current time (live updates)
              </Label>
            </div>
          </div>
        </div>
      }
      result={(
        <div className="mt-8 space-y-6 animate-fadeIn">
          {result.kind === 'error' ? (
            <div className="p-6 bg-destructive/10 rounded-xl border border-destructive/20 text-center">
              <p className="font-semibold text-destructive">{result.error}</p>
            </div>
          ) : (
            <>
              <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                  <Timer className="w-4 h-4" />
                  LIVE AGE TRACKER
                </div>
                <p className="text-3xl md:text-5xl font-bold text-primary tracking-tight">
                  {result.liveYmdClock}
                </p>
                <p className="text-sm text-muted-foreground">
                  Days clock: <span className="font-semibold text-primary">{result.liveDaysClock}</span> • Alive for <span className="font-semibold text-primary">{formatNumber(result.totalSeconds)}</span> seconds
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard
                  label="Chronological Age"
                  value={`${result.ymd.years}Y ${result.ymd.months}M ${result.ymd.days}D`}
                  type="highlight"
                  icon={CalendarDays}
                  subtext={`Total completed months: ${formatNumber(result.totalMonthsCompleted)}`}
                />
                <ResultCard
                  label="Day You Were Born"
                  value={result.dayBorn}
                  type="default"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard
                  label="Next Birthday"
                  value={result.nextBirthday.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  type="success"
                  icon={Cake}
                  subtext={`${result.daysToBirthday}d ${pad2(result.hrsToBirthday)}h ${pad2(result.minsToBirthday)}m ${pad2(result.secsToBirthday)}s`}
                />
                <ResultCard
                  label="Leap Days Experienced"
                  value={formatNumber(result.leapDays)}
                  type="default"
                  icon={Hourglass}
                  subtext="Extra Feb 29 days lived"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Weeks</p>
                  <p className="font-bold">{formatNumber(result.totalWeeks)}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Days</p>
                  <p className="font-bold">{formatNumber(result.totalDays)}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                  <p className="font-bold">{formatNumber(result.totalHours)}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Minutes</p>
                  <p className="font-bold">{formatNumber(result.totalMinutes)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResultCard
                  label="Total Seconds"
                  value={formatNumber(result.totalSeconds)}
                  type="highlight"
                />
                <ResultCard
                  label="Total Milliseconds"
                  value={formatNumber(result.totalMilliseconds)}
                  type="default"
                />
                <ResultCard
                  label="Birth Date & Time"
                  value={result.birthDate.toLocaleString()}
                  type="default"
                />
              </div>

              {/* Biological Estimates Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <p className="text-sm font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">Biological Estimates</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4 text-red-500" />
                        Heartbeats
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.heartbeats)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wind className="w-4 h-4 text-cyan-500" />
                        Breaths Taken
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.breathsTaken)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4 text-blue-500" />
                        Times Blinked
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.timesBlinked)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bed className="w-4 h-4 text-purple-500" />
                        Hours Slept
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.hoursSlept)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                        Meals Eaten
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.mealsEaten)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Droplet className="w-4 h-4 text-blue-400" />
                        Water Drunk (Liters)
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.waterDrunkLiters)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2 transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Smile className="w-4 h-4 text-yellow-500" />
                        Times Smiled
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.timesSmiled)}</span>
                    </div>
                    <div className="flex items-center justify-between transition-all hover:bg-rose-100/30 dark:hover:bg-rose-900/20 px-2 rounded">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Footprints className="w-4 h-4 text-green-500" />
                        Steps Walked (approx)
                      </span>
                      <span className="font-semibold">{formatNumber(result.biologicalEstimates.stepsWalkedApprox)}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground italic">
                    ⚠️ Estimates based on averages (72 bpm, 16 breaths/min, 8h sleep, 2L water/day). Real values vary.
                  </p>
                </div>

                {/* Galactic Age Section */}
                <div className="p-6 rounded-2xl border bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Galactic Age</p>
                    </div>
                    <p className="text-xs text-muted-foreground">🌍 {roundTo(result.earthAgeYears, 2)} Earth years</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-center transition-all hover:scale-105 hover:shadow-md">
                      <p className="text-2xl mb-1">☿️</p>
                      <p className="text-xs text-muted-foreground mb-1">Mercury</p>
                      <p className="font-bold text-lg">{roundTo(result.galacticAge.mercuryYears, 2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-200 dark:from-orange-900 dark:to-yellow-800 text-center transition-all hover:scale-105 hover:shadow-md">
                      <p className="text-2xl mb-1">♀️</p>
                      <p className="text-xs text-muted-foreground mb-1">Venus</p>
                      <p className="font-bold text-lg">{roundTo(result.galacticAge.venusYears, 2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-100 to-orange-200 dark:from-red-900 dark:to-orange-800 text-center transition-all hover:scale-105 hover:shadow-md">
                      <p className="text-2xl mb-1">♂️</p>
                      <p className="text-xs text-muted-foreground mb-1">Mars</p>
                      <p className="font-bold text-lg">{roundTo(result.galacticAge.marsYears, 2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900 dark:to-orange-800 text-center transition-all hover:scale-105 hover:shadow-md">
                      <p className="text-2xl mb-1">♃</p>
                      <p className="text-xs text-muted-foreground mb-1">Jupiter</p>
                      <p className="font-bold text-lg">{roundTo(result.galacticAge.jupiterYears, 2)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground italic">
                    🪐 Your age differs on other planets due to their orbital periods around the Sun.
                  </p>
                </div>
              </div>

              {/* Birthday in History Section */}
              <div className="mt-8 p-6 rounded-2xl border bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20 border-violet-200 dark:border-violet-800 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-6">
                  <History className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-lg font-bold text-violet-700 dark:text-violet-300">🎂 YOUR BIRTHDAY IN HISTORY</h3>
                  <span className="sm:ml-auto text-sm text-muted-foreground">{result.birthYear}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 transition-all hover:scale-105 hover:shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm sm:text-base">Famous Event</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{result.birthYear}: {result.birthdayHistory.famousEvent}</p>
                  </div>

                  <div className="p-4 rounded-xl border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 transition-all hover:scale-105 hover:shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="w-5 h-5 text-cyan-600" />
                      <p className="font-semibold text-cyan-700 dark:text-cyan-400 text-sm sm:text-base">Popular Song</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{result.birthdayHistory.popularSong}</p>
                  </div>

                  <div className="p-4 rounded-xl border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 transition-all hover:scale-105 hover:shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-green-700 dark:text-green-400 text-sm sm:text-base">Technology</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{result.birthYear}: {result.birthdayHistory.technology}</p>
                  </div>

                  <div className="p-4 rounded-xl border-l-4 border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 transition-all hover:scale-105 hover:shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-rose-600" />
                      <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm sm:text-base">Famous Birthdays</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{result.birthdayHistory.famousBirthday}</p>
                  </div>
                </div>
              </div>

              {/* Life Milestones Section */}
              <div className="mt-8 p-6 rounded-2xl border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300">🏅 LIFE MILESTONES & ACHIEVEMENTS</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.milestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-xl border-l-4 transition-all hover:scale-105 hover:shadow-lg ${
                        milestone.achieved
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30'
                          : 'border-gray-400 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl sm:text-3xl">{milestone.emoji}</span>
                        <div className="flex-1">
                          <p className={`font-bold text-sm sm:text-base ${
                            milestone.achieved
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {milestone.label}
                          </p>
                          {milestone.achieved && milestone.achievedDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Achieved on {milestone.achievedDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          {!milestone.achieved && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatNumber(milestone.days - result.totalDays)} days to go
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    />
  )
}
