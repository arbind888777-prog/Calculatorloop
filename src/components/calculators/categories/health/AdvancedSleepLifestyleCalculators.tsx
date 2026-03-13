"use client"

import { useState } from "react"
import { Moon, Coffee, Clock, Sun, Activity, Brain, Eye, Wind, AlertCircle, Heart } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function r2(n: number) { return Math.round(n * 100) / 100 }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

function NumInput({ label, val, set, min, max, step, suffix }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}{suffix && <span className="text-muted-foreground ml-1">({suffix})</span>}</label>
      <input type="number" value={val} onChange={e => set(Number(e.target.value))} min={min} max={max} step={step ?? 1}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

function SelectInput({ label, val, set, options }: { label: string; val: string; set: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select value={val} onChange={e => set(e.target.value)}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function TimeInput({ label, val, set }: { label: string; val: string; set: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input type="time" value={val} onChange={e => set(e.target.value)}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

const fmtTime = (totalMin: number) => {
  const m = ((totalMin % 1440) + 1440) % 1440
  const hh = Math.floor(m / 60)
  const mm = m % 60
  const ampm = hh >= 12 ? "PM" : "AM"
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// ─── 1. Sleep Calculator (Optimal Sleep Timing Engine) ─────────────────────────
export function SleepTimingCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [latency, setLatency] = useState(15)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(wakeTime)
    const lat = clamp(latency, 0, 90)
    const a = clamp(age, 1, 100)

    const cycleLen = 90
    const recHours = a < 3 ? 14 : a < 6 ? 12 : a < 13 ? 10 : a < 18 ? 9 : a < 65 ? 8 : 7.5
    const minHours = a < 3 ? 11 : a < 6 ? 10 : a < 13 ? 8 : a < 18 ? 7 : a < 65 ? 6 : 5.5

    const cycles = [4, 5, 6]
    const bedtimes = cycles.map(c => {
      const sleepMin = c * cycleLen
      const bed = wake - sleepMin - lat
      return { cycles: c, hours: r1(sleepMin / 60), bedtime: fmtTime(bed), bedMin: bed }
    })

    const optimalCycles = r0(recHours * 60 / cycleLen)
    const optBed = wake - optimalCycles * cycleLen - lat

    const sleepDeficit = recHours - (cycles[1] * cycleLen / 60)
    const deprivationRisk = sleepDeficit > 1.5 ? "High" : sleepDeficit > 0.5 ? "Moderate" : "Low"
    const depStatus: 'good' | 'warning' | 'danger' = sleepDeficit > 1.5 ? "danger" : sleepDeficit > 0.5 ? "warning" : "good"

    const remAdequacy = optimalCycles >= 5 ? "Excellent" : optimalCycles >= 4 ? "Adequate" : "Insufficient"
    const remStatus: 'good' | 'warning' | 'danger' = optimalCycles >= 5 ? "good" : optimalCycles >= 4 ? "warning" : "danger"

    const consistencyTip = lat > 30 ? "High sleep latency suggests anxiety or poor sleep hygiene. Consider relaxation techniques 30 min before bed." : "Good sleep latency — you fall asleep within a healthy timeframe."

    setResult({
      primaryMetric: { label: "Recommended Bedtime", value: fmtTime(optBed), status: "good", description: `${optimalCycles} cycles × 90 min + ${lat} min latency = ${r1(optimalCycles * 1.5)} hrs sleep` },
      healthScore: Math.max(0, Math.min(100, r0(100 - sleepDeficit * 20))),
      metrics: [
        { label: "Optimal Bedtime", value: fmtTime(optBed), status: "good" },
        { label: "Recommended Sleep", value: recHours, unit: "hours", status: "good" },
        { label: "Minimum Sleep", value: minHours, unit: "hours", status: "warning" },
        ...bedtimes.map(b => ({ label: `${b.cycles} Cycles (${b.hours} hrs)`, value: b.bedtime, status: (b.cycles >= 5 ? "good" : b.cycles === 4 ? "warning" : "danger") as 'good' | 'warning' | 'danger' })),
        { label: "Sleep Latency", value: lat, unit: "min", status: lat <= 15 ? "good" : lat <= 30 ? "warning" : "danger" },
        { label: "Sleep Deprivation Risk", value: deprivationRisk, status: depStatus },
        { label: "REM Cycle Adequacy", value: remAdequacy, status: remStatus }
      ],
      recommendations: [
        { title: "Circadian Alignment", description: `For age ${a}, ${recHours} hrs sleep is recommended (${r0(recHours * 60 / cycleLen)} full 90-min cycles). Go to bed at ${fmtTime(optBed)} to wake naturally at ${fmtTime(wake)}. Waking between cycles causes grogginess (sleep inertia).`, priority: "high", category: "Timing" },
        { title: "Sleep Hygiene", description: consistencyTip + " Maintain a consistent schedule — even 30 min variation disrupts circadian rhythm. Avoid screens 60 min before bed. Keep bedroom 65-68°F (18-20°C).", priority: "high", category: "Hygiene" },
        { title: "Sleep Deficit Correction", description: `${deprivationRisk} deprivation risk. ${sleepDeficit > 0.5 ? "Add 15-30 min to sleep gradually over 1-2 weeks. Avoid weekend oversleeping >1 hr — causes social jet lag." : "Your sleep duration is well-aligned with age requirements."}`, priority: "medium", category: "Recovery" },
        { title: "REM Optimization", description: `REM adequacy: ${remAdequacy}. REM sleep concentrates in later cycles (cycles 4-6). Getting only 4 cycles cuts REM time by ~50%. REM is critical for memory consolidation, emotional regulation, and learning.`, priority: "medium", category: "REM" }
      ],
      detailedBreakdown: {
        "Wake Time": fmtTime(wake),
        "Sleep Latency": `${lat} min`,
        "4 Cycles Bedtime": bedtimes[0].bedtime,
        "5 Cycles Bedtime": bedtimes[1].bedtime,
        "6 Cycles Bedtime": bedtimes[2].bedtime,
        "Optimal Cycles": optimalCycles,
        "Age Recommendation": `${recHours} hrs`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-calculator" title="Sleep Calculator — Optimal Sleep Timing Engine"
      description="Calculate bedtime and wake-up times based on natural 90-minute sleep cycles. Includes circadian alignment, sleep deprivation risk, and REM adequacy."
      icon={Moon} calculate={calculate} onClear={() => { setWakeTime("07:00"); setLatency(15); setAge(30); setResult(null) }}
      values={[wakeTime, latency, age]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Calculator" description="Find optimal bedtime based on sleep cycles." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <TimeInput label="Desired Wake-Up Time" val={wakeTime} set={setWakeTime} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Latency" val={latency} set={setLatency} min={0} max={90} suffix="minutes" />
          <NumInput label="Age" val={age} set={setAge} min={1} max={100} suffix="years" />
        </div>
      </div>} />
  )
}

// ─── 2. Sleep Cycle Calculator (REM Optimization Model) ──────────────────────
export function SleepCycleREMCalculator() {
  const [bedtime, setBedtime] = useState("23:00")
  const [latency, setLatency] = useState(14)
  const [wakeTime, setWakeTime] = useState("07:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bed = timeToMin(bedtime)
    const wake = timeToMin(wakeTime)
    const lat = clamp(latency, 0, 90)

    let totalSleep = wake - bed - lat
    if (totalSleep <= 0) totalSleep += 1440

    const cycleLen = 90
    const fullCycles = Math.floor(totalSleep / cycleLen)
    const partialMin = totalSleep - fullCycles * cycleLen
    const fragIndex = partialMin > 30 ? r1(partialMin / cycleLen * 100) : 0

    // Sleep stage estimates per cycle
    const lightPct = 50
    const deepPct = fullCycles <= 2 ? 25 : fullCycles <= 4 ? 20 : 15
    const remPct = 100 - lightPct - deepPct

    const deepMin = r0(totalSleep * deepPct / 100)
    const remMin = r0(totalSleep * remPct / 100)
    const lightMin = totalSleep - deepMin - remMin

    const sleepOnset = bed + lat
    const deepWindow = `${fmtTime(sleepOnset)} – ${fmtTime(sleepOnset + r0(totalSleep * 0.4))}`
    const remWindow = `${fmtTime(sleepOnset + r0(totalSleep * 0.6))} – ${fmtTime(wake)}`

    let quality: 'good' | 'warning' | 'danger' = fullCycles >= 5 ? "good" : fullCycles >= 4 ? "warning" : "danger"
    const qualityLabel = fullCycles >= 5 ? "Excellent" : fullCycles >= 4 ? "Good" : fullCycles >= 3 ? "Fair" : "Poor"

    setResult({
      primaryMetric: { label: "Complete Sleep Cycles", value: fullCycles, status: quality, description: `${r1(totalSleep / 60)} hrs total — ${qualityLabel} sleep architecture` },
      healthScore: Math.min(100, r0(fullCycles * 18 + (partialMin < 15 ? 10 : 0))),
      metrics: [
        { label: "Total Sleep Time", value: r1(totalSleep / 60), unit: "hours", status: totalSleep >= 420 ? "good" : totalSleep >= 360 ? "warning" : "danger" },
        { label: "Full Cycles", value: fullCycles, status: quality },
        { label: "Partial Cycle", value: partialMin, unit: "min", status: partialMin < 15 ? "good" : "warning" },
        { label: "Light Sleep (N1+N2)", value: lightMin, unit: "min", status: "normal" },
        { label: "Deep Sleep (N3)", value: deepMin, unit: "min", status: deepMin >= 60 ? "good" : deepMin >= 40 ? "warning" : "danger" },
        { label: "REM Sleep", value: remMin, unit: "min", status: remMin >= 90 ? "good" : remMin >= 60 ? "warning" : "danger" },
        { label: "Deep Sleep Window", value: deepWindow, status: "normal" },
        { label: "REM Window", value: remWindow, status: "normal" },
        { label: "Sleep Fragmentation Index", value: r1(fragIndex), unit: "%", status: fragIndex < 10 ? "good" : fragIndex < 30 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Sleep Stage Analysis", description: `${fullCycles} complete cycles with ${partialMin} min partial. Deep sleep (N3) peaks in first 2 cycles — critical for physical recovery and growth hormone. REM increases in later cycles — essential for memory and emotional processing.`, priority: "high", category: "Architecture" },
        { title: "Wake Timing", description: `${partialMin > 30 ? "You're waking mid-cycle which causes grogginess. Shift wake time by " + (cycleLen - partialMin) + " min later or " + partialMin + " min earlier." : "Good wake timing — near cycle boundary minimizes sleep inertia."}`, priority: "high", category: "Optimization" },
        { title: "Sleep Architecture Trend", description: `Target: 5-6 cycles nightly. Deep sleep declines with age (20% at 20 → 5% at 60). REM should be 20-25% of total sleep. Track for 7 days to identify patterns.`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Bedtime": fmtTime(bed), "Sleep Onset": fmtTime(sleepOnset), "Wake": fmtTime(wake), "Total Sleep": `${r1(totalSleep / 60)} hrs`, "Cycles": fullCycles, "Partial": `${partialMin} min`, "Deep Sleep": `${deepMin} min`, "REM": `${remMin} min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-cycle-calculator" title="Sleep Cycle Calculator — REM Optimization"
      description="Analyze sleep stage transitions, deep sleep windows, REM adequacy, and sleep fragmentation. Find best wake-up moments."
      icon={Moon} calculate={calculate} onClear={() => { setBedtime("23:00"); setLatency(14); setWakeTime("07:00"); setResult(null) }}
      values={[bedtime, latency, wakeTime]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Cycle Calculator" description="Analyze REM cycles and sleep architecture." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Bedtime" val={bedtime} set={setBedtime} />
          <TimeInput label="Wake-Up Time" val={wakeTime} set={setWakeTime} />
        </div>
        <NumInput label="Sleep Latency" val={latency} set={setLatency} min={0} max={90} suffix="minutes to fall asleep" />
      </div>} />
  )
}

// ─── 3. Caffeine Calculator (Sleep Disruption Predictor) ─────────────────────
export function CaffeineSleepCalculator() {
  const [caffeineMg, setCaffeineMg] = useState(200)
  const [consumeTime, setConsumeTime] = useState("14:00")
  const [age, setAge] = useState(35)
  const [smoking, setSmoking] = useState("no")
  const [bedtime, setBedtime] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const mg = clamp(caffeineMg, 10, 1000)
    const a = clamp(age, 10, 90)
    const consume = timeToMin(consumeTime)
    const bed = timeToMin(bedtime)

    let hoursTobed = (bed - consume) / 60
    if (hoursTobed <= 0) hoursTobed += 24

    // Half-life: ~5 hrs average, smokers ~3 hrs, age >50 ~7 hrs
    let halfLife = 5
    if (smoking === "yes") halfLife = 3
    else if (a > 60) halfLife = 7
    else if (a > 50) halfLife = 6

    const halvings = hoursTobed / halfLife
    const remainingMg = r1(mg * Math.pow(0.5, halvings))
    const remainingPct = r1(remainingMg / mg * 100)

    // Sleep disruption: >100mg at bedtime = significant, >50mg = mild
    let disruption: 'good' | 'warning' | 'danger' = "good"
    let disruptLabel = "Minimal"
    if (remainingMg > 100) { disruption = "danger"; disruptLabel = "Significant" }
    else if (remainingMg > 50) { disruption = "warning"; disruptLabel = "Moderate" }
    else if (remainingMg > 25) { disruption = "warning"; disruptLabel = "Mild" }

    const cutoffHrs = r1(halfLife * Math.log2(mg / 25))
    const cutoffTime = bed - r0(cutoffHrs * 60)

    const sleepLatencyIncrease = r0(Math.max(0, (remainingMg - 20) * 0.5))
    const deepSleepReduction = r0(Math.min(50, remainingMg * 0.3))

    setResult({
      primaryMetric: { label: "Caffeine at Bedtime", value: `${remainingMg} mg`, status: disruption, description: `${disruptLabel} sleep disruption — ${remainingPct}% remaining after ${r1(hoursTobed)} hrs` },
      healthScore: Math.max(0, Math.min(100, r0(100 - remainingMg * 0.8))),
      metrics: [
        { label: "Initial Caffeine", value: mg, unit: "mg", status: "normal" },
        { label: "Remaining at Bedtime", value: remainingMg, unit: "mg", status: disruption },
        { label: "Caffeine Half-Life", value: halfLife, unit: "hours", status: "normal" },
        { label: "Hours Until Bedtime", value: r1(hoursTobed), unit: "hrs", status: "normal" },
        { label: "Sleep Disruption Risk", value: disruptLabel, status: disruption },
        { label: "Sleep Latency Increase", value: `+${sleepLatencyIncrease}`, unit: "min", status: sleepLatencyIncrease > 20 ? "danger" : sleepLatencyIncrease > 10 ? "warning" : "good" },
        { label: "Deep Sleep Reduction", value: deepSleepReduction, unit: "%", status: deepSleepReduction > 20 ? "danger" : deepSleepReduction > 10 ? "warning" : "good" },
        { label: "Recommended Cutoff", value: fmtTime(cutoffTime), status: "good" }
      ],
      recommendations: [
        { title: "Caffeine Clearance", description: `${mg}mg caffeine consumed at ${fmtTime(consume)}. With half-life of ${halfLife} hrs (${smoking === "yes" ? "smoker — faster metabolism" : a > 50 ? "age >50 — slower metabolism" : "average metabolism"}), ${remainingMg}mg remains at bedtime. Caffeine blocks adenosine receptors for ${r0(halfLife * 5)} hours.`, priority: "high", category: "Pharmacology" },
        { title: "Cutoff Recommendation", description: `Stop caffeine by ${fmtTime(cutoffTime)} to have <25mg at bedtime. This is ${r1(cutoffHrs)} hrs before bed. Even 25mg can reduce deep sleep by 10%. Consider switching to decaf after ${fmtTime(cutoffTime)}.`, priority: "high", category: "Timing" },
        { title: "Caffeine Sources", description: "Coffee (8 oz): 80-100mg. Espresso: 63mg. Black tea: 47mg. Green tea: 28mg. Cola: 22mg. Dark chocolate (1 oz): 23mg. Pre-workout: 150-300mg. Energy drink: 80-300mg.", priority: "medium", category: "Reference" }
      ],
      detailedBreakdown: { "Intake": `${mg}mg at ${fmtTime(consume)}`, "Half-life": `${halfLife} hrs`, "At Bedtime": `${remainingMg}mg (${remainingPct}%)`, "Cutoff Time": fmtTime(cutoffTime), "Latency +": `${sleepLatencyIncrease} min`, "Deep Sleep −": `${deepSleepReduction}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="caffeine-calculator" title="Caffeine Sleep Disruption Calculator"
      description="Predict how caffeine impacts your sleep. Calculates remaining caffeine at bedtime, sleep latency increase, and optimal cutoff time."
      icon={Coffee} calculate={calculate} onClear={() => { setCaffeineMg(200); setConsumeTime("14:00"); setAge(35); setSmoking("no"); setBedtime("23:00"); setResult(null) }}
      values={[caffeineMg, consumeTime, age, smoking, bedtime]} result={result}
      seoContent={<SeoContentGenerator title="Caffeine Sleep Calculator" description="Calculate caffeine impact on sleep quality." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Caffeine Amount" val={caffeineMg} set={setCaffeineMg} min={10} max={1000} suffix="mg" />
          <TimeInput label="Time Consumed" val={consumeTime} set={setConsumeTime} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Smoker" val={smoking} set={setSmoking} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
      </div>} />
  )
}

// ─── 4. Stress Level Calculator (Psychophysiological Load Index) ─────────────
export function StressLevelCalculator() {
  const [sleepHrs, setSleepHrs] = useState(7)
  const [workHrs, setWorkHrs] = useState(8)
  const [exerciseFreq, setExerciseFreq] = useState(3)
  const [mood, setMood] = useState(6)
  const [socialHrs, setSocialHrs] = useState(2)
  const [caffeine, setCaffeine] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sleep = clamp(sleepHrs, 0, 16)
    const work = clamp(workHrs, 0, 20)
    const exercise = clamp(exerciseFreq, 0, 7)
    const m = clamp(mood, 1, 10)
    const social = clamp(socialHrs, 0, 12)
    const caf = clamp(caffeine, 0, 15)

    // Stress scoring (0-100, higher = more stress)
    let stress = 50
    stress += (work > 10 ? 15 : work > 8 ? 8 : 0)
    stress -= (sleep >= 7 ? 15 : sleep >= 6 ? 5 : -10)
    stress -= (exercise >= 4 ? 12 : exercise >= 2 ? 6 : -5)
    stress -= (m >= 7 ? 10 : m >= 5 ? 3 : -8)
    stress -= (social >= 2 ? 5 : social >= 1 ? 2 : -3)
    stress += (caf > 4 ? 8 : caf > 2 ? 3 : 0)
    stress = clamp(r0(stress), 0, 100)

    const burnoutProb = stress > 75 ? r0(80 + (stress - 75) * 0.8) : stress > 50 ? r0(30 + (stress - 50) * 2) : r0(stress * 0.6)
    const cortisolDisruption = stress > 70 ? "High" : stress > 45 ? "Moderate" : "Low"

    let status: 'good' | 'warning' | 'danger' = stress < 35 ? "good" : stress < 65 ? "warning" : "danger"
    const label = stress < 25 ? "Low Stress" : stress < 45 ? "Moderate" : stress < 65 ? "Elevated" : stress < 80 ? "High" : "Critical"

    setResult({
      primaryMetric: { label: "Stress Level", value: `${stress}/100`, status, description: `${label} — Burnout probability: ${burnoutProb}%` },
      healthScore: Math.max(0, 100 - stress),
      metrics: [
        { label: "Composite Stress Score", value: stress, unit: "/100", status },
        { label: "Stress Category", value: label, status },
        { label: "Burnout Probability", value: burnoutProb, unit: "%", status: burnoutProb > 60 ? "danger" : burnoutProb > 30 ? "warning" : "good" },
        { label: "Cortisol Disruption", value: cortisolDisruption, status: cortisolDisruption === "High" ? "danger" : cortisolDisruption === "Moderate" ? "warning" : "good" },
        { label: "Sleep Quality", value: sleep >= 7 ? "Good" : sleep >= 6 ? "Fair" : "Poor", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" },
        { label: "Work-Life Balance", value: work <= 8 ? "Balanced" : work <= 10 ? "Busy" : "Overwork", status: work <= 8 ? "good" : work <= 10 ? "warning" : "danger" },
        { label: "Exercise Effect", value: exercise >= 3 ? "Protective" : exercise >= 1 ? "Moderate" : "Insufficient", status: exercise >= 3 ? "good" : exercise >= 1 ? "warning" : "danger" },
        { label: "Mood Score", value: m, unit: "/10", status: m >= 7 ? "good" : m >= 5 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Stress Assessment", description: `Score ${stress}/100: ${label}. ${stress > 65 ? "Critical stress levels. Cortisol rhythm is likely disrupted — elevated evening cortisol impairs sleep, immunity, and cognition. Consider professional support." : stress > 45 ? "Elevated stress. Focus on recovery activities: nature exposure (20 min reduces cortisol 23%), social connection, and sleep optimization." : "Manageable stress level. Maintain current habits and monitor trends."}`, priority: "high", category: "Assessment" },
        { title: "Burnout Prevention", description: `Burnout probability: ${burnoutProb}%. ${burnoutProb > 50 ? "High risk — implement boundaries: work hours cap, mandatory breaks, 1 rest day/week, delegate tasks." : "Monitor work hours and ensure recovery periods between high-demand periods."} Key burnout signs: emotional exhaustion, depersonalization, reduced accomplishment.`, priority: "high", category: "Prevention" },
        { title: "Cortisol Optimization", description: `Cortisol rhythm: ${cortisolDisruption}. Healthy cortisol peaks at 6-8 AM and drops by evening. To normalize: morning sunlight (10 min), exercise before 2 PM, avoid late caffeine, practice 4-7-8 breathing, cold exposure (30s shower).`, priority: "medium", category: "Hormonal" }
      ],
      detailedBreakdown: { "Sleep": `${sleep} hrs`, "Work": `${work} hrs`, "Exercise": `${exercise}x/week`, "Mood": `${m}/10`, "Social": `${social} hrs`, "Caffeine": `${caf} cups`, "Stress Score": stress, "Burnout %": burnoutProb }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stress-level-calculator" title="Stress Level Calculator"
      description="Assess psychophysiological stress load from lifestyle factors. Includes burnout probability, cortisol disruption estimate, and intervention recommendations."
      icon={Brain} calculate={calculate} onClear={() => { setSleepHrs(7); setWorkHrs(8); setExerciseFreq(3); setMood(6); setSocialHrs(2); setCaffeine(2); setResult(null) }}
      values={[sleepHrs, workHrs, exerciseFreq, mood, socialHrs, caffeine]} result={result}
      seoContent={<SeoContentGenerator title="Stress Level Calculator" description="Calculate composite stress score and burnout risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Hours" val={sleepHrs} set={setSleepHrs} min={0} max={16} step={0.5} suffix="hrs/night" />
          <NumInput label="Work Hours" val={workHrs} set={setWorkHrs} min={0} max={20} suffix="hrs/day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Exercise Frequency" val={exerciseFreq} set={setExerciseFreq} min={0} max={7} suffix="days/week" />
          <NumInput label="Mood Score" val={mood} set={setMood} min={1} max={10} suffix="1-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Social Time" val={socialHrs} set={setSocialHrs} min={0} max={12} step={0.5} suffix="hrs/day" />
          <NumInput label="Caffeine Intake" val={caffeine} set={setCaffeine} min={0} max={15} suffix="cups/day" />
        </div>
      </div>} />
  )
}

// ─── 5. Screen Time Calculator (Digital Exposure Analyzer) ───────────────────
export function ScreenTimeCalculator() {
  const [phoneHrs, setPhoneHrs] = useState(4)
  const [computerHrs, setComputerHrs] = useState(6)
  const [tvHrs, setTvHrs] = useState(2)
  const [eveningHrs, setEveningHrs] = useState(3)
  const [distance, setDistance] = useState(50)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const phone = clamp(phoneHrs, 0, 18)
    const computer = clamp(computerHrs, 0, 18)
    const tv = clamp(tvHrs, 0, 18)
    const evening = clamp(eveningHrs, 0, 8)
    const dist = clamp(distance, 10, 200)

    const totalHrs = r1(phone + computer + tv)

    // Blue light exposure score (0-100, higher = more exposure)
    const blueLight = r0(clamp(phone * 9 + computer * 7 + tv * 4 + evening * 8, 0, 100))

    // Eye strain risk
    const eyeStrain = dist < 30 ? "High" : dist < 50 ? "Moderate" : "Low"
    const eyeStatus: 'good' | 'warning' | 'danger' = dist < 30 ? "danger" : dist < 50 ? "warning" : "good"

    // Sleep suppression from evening screen use
    const sleepSuppression = r0(clamp(evening * 15 + (evening > 2 ? 10 : 0), 0, 80))
    const sleepStatus: 'good' | 'warning' | 'danger' = sleepSuppression > 40 ? "danger" : sleepSuppression > 20 ? "warning" : "good"

    const digitalHygiene = Math.max(0, r0(100 - blueLight * 0.5 - (totalHrs > 10 ? 20 : totalHrs > 6 ? 10 : 0) - (evening > 2 ? 15 : 0)))

    let status: 'good' | 'warning' | 'danger' = totalHrs < 6 ? "good" : totalHrs < 10 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Total Screen Time", value: `${totalHrs} hrs`, status, description: `Blue light score: ${blueLight}/100 — Sleep suppression: ${sleepSuppression}%` },
      healthScore: digitalHygiene,
      metrics: [
        { label: "Total Screen Time", value: totalHrs, unit: "hrs/day", status },
        { label: "Phone", value: phone, unit: "hrs", status: phone < 3 ? "good" : phone < 5 ? "warning" : "danger" },
        { label: "Computer", value: computer, unit: "hrs", status: computer < 6 ? "good" : computer < 9 ? "warning" : "danger" },
        { label: "TV", value: tv, unit: "hrs", status: tv < 2 ? "good" : tv < 4 ? "warning" : "danger" },
        { label: "Blue Light Score", value: blueLight, unit: "/100", status: blueLight < 40 ? "good" : blueLight < 70 ? "warning" : "danger" },
        { label: "Evening Screen Use", value: evening, unit: "hrs", status: evening < 1 ? "good" : evening < 2 ? "warning" : "danger" },
        { label: "Eye Strain Risk", value: eyeStrain, status: eyeStatus },
        { label: "Sleep Suppression", value: sleepSuppression, unit: "%", status: sleepStatus },
        { label: "Digital Hygiene Score", value: digitalHygiene, unit: "/100", status: digitalHygiene > 60 ? "good" : digitalHygiene > 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Screen Exposure", description: `${totalHrs} hrs daily screen time (avg adult: 7 hrs). ${totalHrs > 10 ? "Excessive — associated with increased myopia, sleep disruption, and reduced physical activity." : totalHrs > 6 ? "Above average. Schedule screen-free breaks every 20 min (20-20-20 rule: 20 sec, 20 feet, every 20 min)." : "Within reasonable range. Maintain breaks."}`, priority: "high", category: "Exposure" },
        { title: "Blue Light & Sleep", description: `Evening screen use (${evening} hrs) suppresses melatonin by up to ${sleepSuppression}%. Blue light (380-500nm) is the strongest circadian disruptor. Use Night Shift/f.lux after sunset, wear blue-light glasses, or switch to warm lighting 2 hrs before bed.`, priority: "high", category: "Sleep" },
        { title: "Eye Health", description: `Viewing distance: ${dist}cm — ${eyeStrain} strain risk. Optimal: 50-65cm for computers, arms-length for phones. Blink rate drops 66% during screen use. Use artificial tears, adjust brightness to match surroundings, increase font size.`, priority: "medium", category: "Eyes" }
      ],
      detailedBreakdown: { "Phone": `${phone} hrs`, "Computer": `${computer} hrs`, "TV": `${tv} hrs`, "Total": `${totalHrs} hrs`, "Evening": `${evening} hrs`, "Blue Light Score": blueLight, "Sleep Impact": `${sleepSuppression}%`, "Eye Distance": `${dist} cm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="screen-time-calculator" title="Screen Time Calculator — Digital Exposure Analyzer"
      description="Analyze daily screen exposure across devices. Calculates blue-light score, sleep suppression probability, eye strain risk, and digital hygiene score."
      icon={Eye} calculate={calculate} onClear={() => { setPhoneHrs(4); setComputerHrs(6); setTvHrs(2); setEveningHrs(3); setDistance(50); setResult(null) }}
      values={[phoneHrs, computerHrs, tvHrs, eveningHrs, distance]} result={result}
      seoContent={<SeoContentGenerator title="Screen Time Calculator" description="Calculate screen time impact on health and sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Phone Screen Time" val={phoneHrs} set={setPhoneHrs} min={0} max={18} step={0.5} suffix="hrs/day" />
          <NumInput label="Computer Screen Time" val={computerHrs} set={setComputerHrs} min={0} max={18} step={0.5} suffix="hrs/day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="TV Screen Time" val={tvHrs} set={setTvHrs} min={0} max={18} step={0.5} suffix="hrs/day" />
          <NumInput label="Evening Screen Use" val={eveningHrs} set={setEveningHrs} min={0} max={8} step={0.5} suffix="hrs after 7PM" />
        </div>
        <NumInput label="Avg Screen Distance" val={distance} set={setDistance} min={10} max={200} suffix="cm" />
      </div>} />
  )
}

// ─── 6. Sleep Debt Calculator (Recovery Deficit Model) ───────────────────────
export function SleepDebtCalculator() {
  const [actualSleep, setActualSleep] = useState(6.5)
  const [idealSleep, setIdealSleep] = useState(8)
  const [days, setDays] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const actual = clamp(actualSleep, 0, 16)
    const ideal = clamp(idealSleep, 4, 14)
    const d = clamp(days, 1, 30)

    const dailyDebt = r1(Math.max(0, ideal - actual))
    const totalDebt = r1(dailyDebt * d)
    const recoverySleep = r1(totalDebt * 1.3)   // need 30% more than debt to recover
    const recoveryDays = r0(Math.ceil(recoverySleep / 1.5))   // add 1.5 hrs/night

    // Cognitive impairment based on debt
    const cogImpair = totalDebt > 20 ? "Severe" : totalDebt > 10 ? "Significant" : totalDebt > 5 ? "Mild" : "Minimal"
    const cogStatus: 'good' | 'warning' | 'danger' = totalDebt > 10 ? "danger" : totalDebt > 5 ? "warning" : "good"

    // Performance equivalent
    const beerEquiv = r1(totalDebt * 0.3)   // rough: 1 hr debt ≈ 0.3 drinks impairment
    const reactionPct = r0(Math.min(50, totalDebt * 2.5))

    let status: 'good' | 'warning' | 'danger' = totalDebt < 3 ? "good" : totalDebt < 10 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Total Sleep Debt", value: `${totalDebt} hrs`, status, description: `${dailyDebt} hrs/day deficit × ${d} days — ${cogImpair} cognitive impact` },
      healthScore: Math.max(0, r0(100 - totalDebt * 5)),
      metrics: [
        { label: "Daily Sleep Deficit", value: dailyDebt, unit: "hrs", status: dailyDebt < 0.5 ? "good" : dailyDebt < 1.5 ? "warning" : "danger" },
        { label: "Total Sleep Debt", value: totalDebt, unit: "hrs", status },
        { label: "Recovery Sleep Needed", value: recoverySleep, unit: "hrs", status: "normal" },
        { label: "Recovery Time", value: recoveryDays, unit: "days (+1.5 hrs/night)", status: "normal" },
        { label: "Cognitive Impairment", value: cogImpair, status: cogStatus },
        { label: "Reaction Time Slowed", value: `+${reactionPct}%`, status: reactionPct > 20 ? "danger" : reactionPct > 10 ? "warning" : "good" },
        { label: "Impairment Equivalent", value: `~${beerEquiv} drinks`, status: beerEquiv > 3 ? "danger" : beerEquiv > 1 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleep Debt Impact", description: `${totalDebt} hrs debt over ${d} days. Research shows 6 hrs/night for 14 days = same impairment as 2 nights of total sleep deprivation. Reaction time slows by ~${reactionPct}%. Risk of accidents doubles with >10 hr debt.`, priority: "high", category: "Impact" },
        { title: "Recovery Strategy", description: `Need ${recoverySleep} hrs recovery sleep over ~${recoveryDays} days. Strategy: Sleep 1-1.5 hrs extra each night. Avoid sleeping in >2 hrs on weekends (causes social jet lag). Recovery from chronic debt takes 2-4 weeks of consistent sleep.`, priority: "high", category: "Recovery" },
        { title: "Debt Prevention", description: `Target ${ideal} hrs nightly. Set a non-negotiable bedtime. Sleep debt accumulates invisibly — you may feel "fine" but cognitive testing shows measurable decline. The brain does not fully adapt to sleep restriction.`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Actual Sleep": `${actual} hrs/night`, "Ideal Sleep": `${ideal} hrs/night`, "Daily Deficit": `${dailyDebt} hrs`, "Period": `${d} days`, "Total Debt": `${totalDebt} hrs`, "Recovery Needed": `${recoverySleep} hrs`, "Recovery Days": `${recoveryDays} days` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-debt-calculator" title="Sleep Debt Calculator — Recovery Deficit Model"
      description="Quantify weekly sleep deficit and cognitive impairment. Calculates recovery time needed and performance equivalence."
      icon={Moon} calculate={calculate} onClear={() => { setActualSleep(6.5); setIdealSleep(8); setDays(7); setResult(null) }}
      values={[actualSleep, idealSleep, days]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Debt Calculator" description="Calculate accumulated sleep debt and recovery plan." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Actual Sleep" val={actualSleep} set={setActualSleep} min={0} max={16} step={0.5} suffix="hrs/night" />
          <NumInput label="Ideal Sleep Need" val={idealSleep} set={setIdealSleep} min={4} max={14} step={0.5} suffix="hrs/night" />
        </div>
        <NumInput label="Number of Days" val={days} set={setDays} min={1} max={30} suffix="days" />
      </div>} />
  )
}

// ─── 7. Nap Calculator (Daytime Recovery Optimizer) ──────────────────────────
export function NapTimingCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [fatigue, setFatigue] = useState("moderate")
  const [nextBedtime, setNextBedtime] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(wakeTime)
    const bed = timeToMin(nextBedtime)

    let awakeHrs = (bed - wake) / 60
    if (awakeHrs <= 0) awakeHrs += 24

    // Ideal nap window: 7-8 hrs after wake (post-lunch dip = circadian trough)
    const napStart = wake + 420  // +7 hrs
    const napEnd = wake + 510    // +8.5 hrs

    const napOptions = [
      { duration: 10, label: "Micro Nap", benefit: "Alertness boost, reduced fatigue", inertia: "None" },
      { duration: 20, label: "Power Nap", benefit: "Memory consolidation, mood improvement, alertness", inertia: "Minimal" },
      { duration: 30, label: "Short Nap", benefit: "More recovery but may enter deep sleep", inertia: "Moderate — groggy for 10-15 min" },
      { duration: 90, label: "Full Cycle", benefit: "Complete sleep cycle — REM + deep sleep recovery", inertia: "Low — wakes at cycle end" }
    ]

    // Sleep inertia probability
    const inertiaRisk = fatigue === "severe" ? "High" : fatigue === "moderate" ? "Moderate" : "Low"
    const bestNap = fatigue === "severe" ? 90 : fatigue === "moderate" ? 20 : 10
    const bestNapTime = fmtTime(napStart)
    const latestNap = bed - 480  // no napping within 8 hrs of bedtime

    const napTooLate = napStart > latestNap

    setResult({
      primaryMetric: { label: "Best Nap", value: `${bestNap} min at ${bestNapTime}`, status: napTooLate ? "warning" : "good", description: `${fatigue === "severe" ? "Full cycle recommended for severe fatigue" : fatigue === "moderate" ? "Power nap ideal for moderate fatigue" : "Micro nap sufficient for mild fatigue"}` },
      healthScore: r0(80 - (fatigue === "severe" ? 30 : fatigue === "moderate" ? 10 : 0)),
      metrics: [
        { label: "Optimal Nap Window", value: `${fmtTime(napStart)} – ${fmtTime(napEnd)}`, status: "good" },
        { label: "Recommended Duration", value: bestNap, unit: "min", status: "good" },
        { label: "Latest Safe Nap", value: fmtTime(latestNap), status: "normal" },
        { label: "Sleep Inertia Risk", value: inertiaRisk, status: fatigue === "severe" ? "warning" : "good" },
        ...napOptions.map(n => ({ label: n.label + ` (${n.duration} min)`, value: n.benefit, status: "normal" as const })),
        { label: "Nap Too Late Warning", value: napTooLate ? "Yes — may delay bedtime" : "No — safe window", status: napTooLate ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Nap Timing Science", description: `Best nap: 1-3 PM (post-lunch circadian dip). Your window: ${fmtTime(napStart)}-${fmtTime(napEnd)}. Napping after 3 PM risks delayed bedtime. Even 6-min naps improve declarative memory. NASA study: 26-min nap = 34% improved alertness + 54% improved performance.`, priority: "high", category: "Timing" },
        { title: "Nap Duration Guide", description: `Fatigue level: ${fatigue}. 10 min: quick refresh. 20 min (power nap): ideal cost-benefit ratio. 30 min: risk of deep sleep inertia. 60 min: deep sleep benefits but heavy grogginess. 90 min: full cycle — best for severe sleep debt.`, priority: "high", category: "Duration" },
        { title: "Coffee Nap Technique", description: "Drink coffee immediately before a 20-min nap. Caffeine takes ~20 min to absorb, so you wake as it kicks in. Studies show this is more effective than either alone for alertness and reaction time.", priority: "medium", category: "Advanced" }
      ],
      detailedBreakdown: { "Wake Time": fmtTime(wake), "Nap Window": `${fmtTime(napStart)} – ${fmtTime(napEnd)}`, "Best Duration": `${bestNap} min`, "Latest Nap": fmtTime(latestNap), "Bedtime": fmtTime(bed), "Awake Hours": `${r1(awakeHrs)} hrs` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="nap-calculator" title="Nap Calculator — Daytime Recovery Optimizer"
      description="Calculate ideal nap timing and duration based on circadian rhythm. Includes power nap, full cycle, and coffee nap recommendations."
      icon={Sun} calculate={calculate} onClear={() => { setWakeTime("07:00"); setFatigue("moderate"); setNextBedtime("23:00"); setResult(null) }}
      values={[wakeTime, fatigue, nextBedtime]} result={result}
      seoContent={<SeoContentGenerator title="Nap Calculator" description="Find optimal nap timing and duration." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Wake-Up Time Today" val={wakeTime} set={setWakeTime} />
          <TimeInput label="Next Bedtime" val={nextBedtime} set={setNextBedtime} />
        </div>
        <SelectInput label="Current Fatigue Level" val={fatigue} set={setFatigue} options={[{ value: "mild", label: "Mild — slightly tired" }, { value: "moderate", label: "Moderate — need a boost" }, { value: "severe", label: "Severe — exhausted" }]} />
      </div>} />
  )
}

// ─── 8. Jet Lag Calculator (Circadian Shift Model) ───────────────────────────
export function JetLagRecoveryCalculator() {
  const [timeZoneDiff, setTimeZoneDiff] = useState(6)
  const [direction, setDirection] = useState("east")
  const [normalBed, setNormalBed] = useState("23:00")
  const [normalWake, setNormalWake] = useState("07:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const diff = clamp(Math.abs(timeZoneDiff), 1, 12)
    const east = direction === "east"

    // Adaptation rate: ~1 hr/day east, ~1.5 hrs/day west
    const adaptRate = east ? 1.0 : 1.5
    const adaptDays = r0(Math.ceil(diff / adaptRate))

    const bed = timeToMin(normalBed)
    const wake = timeToMin(normalWake)

    // Shifted times at destination
    const shiftMin = diff * 60 * (east ? 1 : -1)
    const destBed = bed + shiftMin
    const destWake = wake + shiftMin

    // Melatonin timing: take 0.5-3mg at destination bedtime-30min
    const melatoninTime = ((destBed - 30) % 1440 + 1440) % 1440

    // Light exposure strategy
    const lightSeek = east ? "morning" : "evening"
    const lightAvoid = east ? "evening" : "morning"

    const severity = diff > 8 ? "Severe" : diff > 5 ? "Moderate" : "Mild"
    const status: 'good' | 'warning' | 'danger' = diff > 8 ? "danger" : diff > 5 ? "warning" : "good"

    // Pre-travel adjustment schedule
    const preAdjust = Math.min(3, r0(diff / 2))
    const preShiftDir = east ? "earlier" : "later"

    setResult({
      primaryMetric: { label: "Adaptation Time", value: `${adaptDays} days`, status, description: `${severity} jet lag — ${diff} hr ${east ? "eastward" : "westward"} shift` },
      healthScore: Math.max(0, r0(100 - diff * 8)),
      metrics: [
        { label: "Time Zone Difference", value: diff, unit: "hours", status },
        { label: "Direction", value: east ? "Eastward (harder)" : "Westward (easier)", status: east ? "warning" : "good" },
        { label: "Adaptation Days", value: adaptDays, status: "normal" },
        { label: "Destination Bedtime", value: fmtTime(destBed), status: "normal" },
        { label: "Destination Wake Time", value: fmtTime(destWake), status: "normal" },
        { label: "Melatonin Timing", value: fmtTime(melatoninTime), status: "good" },
        { label: "Seek Light", value: `${lightSeek} at destination`, status: "good" },
        { label: "Avoid Light", value: `${lightAvoid} at destination`, status: "warning" },
        { label: "Pre-Travel Adjustment", value: `${preAdjust} days ${preShiftDir}`, status: "normal" },
        { label: "Jet Lag Severity", value: severity, status }
      ],
      recommendations: [
        { title: "Circadian Shift Plan", description: `${diff}-hr ${east ? "eastward" : "westward"} shift requires ~${adaptDays} days to fully adapt. Eastward travel is harder (advancing the clock). Start adjusting ${preAdjust} days before: shift bedtime 30-60 min ${preShiftDir} each day. On arrival, immediately adopt local schedule.`, priority: "high", category: "Adaptation" },
        { title: "Light Therapy", description: `Seek bright light in the ${lightSeek} at destination to shift your clock ${east ? "earlier" : "later"}. Avoid light in the ${lightAvoid}. First 2-3 days are most critical. Outdoor sunlight (10,000 lux) is 10x more effective than indoor lighting.`, priority: "high", category: "Light" },
        { title: "Melatonin Protocol", description: `Take 0.5-3mg melatonin at ${fmtTime(melatoninTime)} (30 min before destination bedtime) for ${adaptDays} days. Low dose (0.5mg) is as effective as high dose for most people. Avoid caffeine and alcohol on travel day — both worsen jet lag.`, priority: "medium", category: "Supplement" }
      ],
      detailedBreakdown: { "Shift": `${diff} hrs ${east ? "east" : "west"}`, "Adapt Rate": `${adaptRate} hrs/day`, "Adapt Days": adaptDays, "Home Bed": fmtTime(bed), "Dest Bed": fmtTime(destBed), "Melatonin": fmtTime(melatoninTime), "Pre-adjust": `${preAdjust} days` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="jet-lag-calculator" title="Jet Lag Calculator — Circadian Shift Model"
      description="Plan circadian realignment after time zone travel. Includes adaptation timeline, melatonin timing, light exposure strategy, and pre-travel preparation."
      icon={Sun} calculate={calculate} onClear={() => { setTimeZoneDiff(6); setDirection("east"); setNormalBed("23:00"); setNormalWake("07:00"); setResult(null) }}
      values={[timeZoneDiff, direction, normalBed, normalWake]} result={result}
      seoContent={<SeoContentGenerator title="Jet Lag Calculator" description="Plan jet lag recovery with circadian shift model." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Time Zone Difference" val={timeZoneDiff} set={setTimeZoneDiff} min={1} max={12} suffix="hours" />
          <SelectInput label="Travel Direction" val={direction} set={setDirection} options={[{ value: "east", label: "Eastward" }, { value: "west", label: "Westward" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Normal Bedtime" val={normalBed} set={setNormalBed} />
          <TimeInput label="Normal Wake Time" val={normalWake} set={setNormalWake} />
        </div>
      </div>} />
  )
}

// ─── 9. Circadian Rhythm Planner (Chronobiology Scheduler) ──────────────────
export function CircadianRhythmPlanner() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [workStart, setWorkStart] = useState("09:00")
  const [chronotype, setChronotype] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(wakeTime)
    const work = timeToMin(workStart)
    const shift = chronotype === "morning" ? -60 : chronotype === "evening" ? 60 : 0

    // Cortisol peak: 30-45 min after wake
    const cortisolPeak = wake + 45 + shift / 2
    // Optimal focus: 2-4 hrs after wake
    const focusStart = wake + 120 + shift
    const focusEnd = wake + 240 + shift
    // Second focus window (afternoon)
    const focus2Start = wake + 540 + shift
    const focus2End = wake + 660 + shift
    // Optimal exercise: 4-6 hrs after wake OR late afternoon
    const exerciseAM = wake + 270 + shift
    const exercisePM = wake + 600 + shift
    // Meals aligned with circadian
    const breakfast = wake + 60
    const lunch = wake + 360
    const dinner = wake + 660
    const lastMeal = wake + 720  // no eating within 3 hrs of bed
    // Melatonin onset: ~14 hrs after wake
    const melatoninOnset = wake + 840
    // Wind-down
    const windDown = wake + 900
    // Bedtime: 16-17 hrs after wake
    const bedtime = wake + 960 + (chronotype === "evening" ? 60 : chronotype === "morning" ? -60 : 0)

    const alignment = Math.abs(work - focusStart) < 120 ? "Good" : "Misaligned"
    const alignStatus: 'good' | 'warning' | 'danger' = alignment === "Good" ? "good" : "warning"

    setResult({
      primaryMetric: { label: "Chronotype", value: chronotype === "morning" ? "Morning Lark" : chronotype === "evening" ? "Night Owl" : "Intermediate", status: "good", description: `Schedule aligned to ${chronotype} chronotype — Wake ${fmtTime(wake)}` },
      healthScore: alignment === "Good" ? 85 : 60,
      metrics: [
        { label: "Cortisol Peak", value: fmtTime(cortisolPeak), status: "good" },
        { label: "Peak Focus Window", value: `${fmtTime(focusStart)} – ${fmtTime(focusEnd)}`, status: "good" },
        { label: "Second Focus Window", value: `${fmtTime(focus2Start)} – ${fmtTime(focus2End)}`, status: "good" },
        { label: "Best Exercise AM", value: fmtTime(exerciseAM), status: "good" },
        { label: "Best Exercise PM", value: fmtTime(exercisePM), status: "good" },
        { label: "Breakfast", value: fmtTime(breakfast), status: "good" },
        { label: "Lunch", value: fmtTime(lunch), status: "good" },
        { label: "Dinner", value: fmtTime(dinner), status: "good" },
        { label: "Last Meal By", value: fmtTime(lastMeal), status: "warning" },
        { label: "Melatonin Onset", value: fmtTime(melatoninOnset), status: "normal" },
        { label: "Wind Down", value: fmtTime(windDown), status: "normal" },
        { label: "Optimal Bedtime", value: fmtTime(bedtime), status: "good" },
        { label: "Work-Circadian Alignment", value: alignment, status: alignStatus }
      ],
      recommendations: [
        { title: "Circadian Schedule", description: `Based on ${chronotype} chronotype waking at ${fmtTime(wake)}. Peak cognitive performance: ${fmtTime(focusStart)}-${fmtTime(focusEnd)} (schedule demanding tasks here). Creative thinking peaks during off-peak hours. Physical performance peaks mid-afternoon.`, priority: "high", category: "Schedule" },
        { title: "Hormonal Alignment", description: `Cortisol peaks at ${fmtTime(cortisolPeak)} — this is your "cortisol awakening response." Delay caffeine until after this natural peak (don't override your body's wake signal). Melatonin onset at ~${fmtTime(melatoninOnset)} — avoid bright light after this.`, priority: "high", category: "Hormones" },
        { title: "Meal Timing", description: `Eating aligned with circadian rhythm improves metabolism 20-30%. Eat within a 10-12 hr window. Breakfast: ${fmtTime(breakfast)}, Lunch: ${fmtTime(lunch)}, Last meal: ${fmtTime(lastMeal)}. Late eating delays circadian clock and impairs glucose tolerance.`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Wake": fmtTime(wake), "Focus 1": `${fmtTime(focusStart)}-${fmtTime(focusEnd)}`, "Focus 2": `${fmtTime(focus2Start)}-${fmtTime(focus2End)}`, "Exercise": `${fmtTime(exerciseAM)} or ${fmtTime(exercisePM)}`, "Last Meal": fmtTime(lastMeal), "Melatonin": fmtTime(melatoninOnset), "Bedtime": fmtTime(bedtime) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="circadian-rhythm-calculator" title="Circadian Rhythm Planner"
      description="Align daily routine with your biological clock. Optimal timing for meals, exercise, focus work, and sleep based on chronotype."
      icon={Clock} calculate={calculate} onClear={() => { setWakeTime("07:00"); setWorkStart("09:00"); setChronotype("moderate"); setResult(null) }}
      values={[wakeTime, workStart, chronotype]} result={result}
      seoContent={<SeoContentGenerator title="Circadian Rhythm Planner" description="Optimize daily schedule with chronobiology." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Wake-Up Time" val={wakeTime} set={setWakeTime} />
          <TimeInput label="Work Start Time" val={workStart} set={setWorkStart} />
        </div>
        <SelectInput label="Chronotype" val={chronotype} set={setChronotype} options={[{ value: "morning", label: "Morning Lark (early riser)" }, { value: "moderate", label: "Intermediate (average)" }, { value: "evening", label: "Night Owl (late riser)" }]} />
      </div>} />
  )
}

// ─── 10. Blue Light Schedule (Sleep Protection Planner) ─────────────────────
export function BlueLightScheduleCalculator() {
  const [bedtime, setBedtime] = useState("23:00")
  const [screenHrs, setScreenHrs] = useState(3)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bed = timeToMin(bedtime)
    const screen = clamp(screenHrs, 0, 12)

    // Blue light cutoff: 2-3 hrs before bed
    const cutoff2hr = bed - 120
    const cutoff3hr = bed - 180
    const nightMode = bed - 180  // enable night shift 3 hrs before bed
    const dimLights = bed - 120
    const noScreens = bed - 60

    // Melatonin suppression probability
    const suppressPct = screen > 4 ? 80 : screen > 2 ? 55 : screen > 1 ? 30 : 10
    const status: 'good' | 'warning' | 'danger' = suppressPct > 50 ? "danger" : suppressPct > 25 ? "warning" : "good"

    const sleepDelayMin = r0(screen * 8)

    setResult({
      primaryMetric: { label: "Blue Light Cutoff", value: fmtTime(cutoff2hr), status: suppressPct > 50 ? "danger" : "good", description: `${suppressPct}% melatonin suppression risk — Stop screens by ${fmtTime(cutoff2hr)}` },
      healthScore: Math.max(0, r0(100 - suppressPct)),
      metrics: [
        { label: "Blue Light Cutoff (strict)", value: fmtTime(cutoff3hr), status: "good" },
        { label: "Blue Light Cutoff (moderate)", value: fmtTime(cutoff2hr), status: "good" },
        { label: "Enable Night Mode", value: fmtTime(nightMode), status: "good" },
        { label: "Dim Lights", value: fmtTime(dimLights), status: "normal" },
        { label: "No Screens", value: fmtTime(noScreens), status: "warning" },
        { label: "Evening Screen Hours", value: screen, unit: "hrs", status: screen < 2 ? "good" : screen < 3 ? "warning" : "danger" },
        { label: "Melatonin Suppression", value: suppressPct, unit: "%", status },
        { label: "Estimated Sleep Delay", value: sleepDelayMin, unit: "min", status: sleepDelayMin > 30 ? "danger" : sleepDelayMin > 15 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Blue Light Timeline", description: `Bedtime: ${fmtTime(bed)}. Enable night mode at ${fmtTime(nightMode)} (reduces blue light 50-80%). Dim household lights at ${fmtTime(dimLights)}. Stop all screens at ${fmtTime(noScreens)}. Read a physical book or practice relaxation instead.`, priority: "high", category: "Schedule" },
        { title: "Melatonin Protection", description: `${screen} hrs evening screen use = ~${suppressPct}% melatonin suppression. Blue light (460nm) suppresses melatonin 2x more than green light. Even 30 min of bright screen at night delays melatonin onset by 22 min. Use amber/red-tinted glasses after sunset.`, priority: "high", category: "Science" },
        { title: "Alternatives", description: "Replace screen time with: reading (paper), podcasts, meditation, journaling, gentle stretching, conversation, puzzle games (non-screen). If screen use is necessary, use lowest brightness + night shift + blue-light glasses.", priority: "medium", category: "Lifestyle" }
      ],
      detailedBreakdown: { "Bedtime": fmtTime(bed), "Night Mode": fmtTime(nightMode), "Dim Lights": fmtTime(dimLights), "No Screens": fmtTime(noScreens), "Screen Hours": `${screen} hrs`, "Melatonin Suppress": `${suppressPct}%`, "Sleep Delay": `${sleepDelayMin} min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blue-light-schedule" title="Blue Light Schedule — Sleep Protection Planner"
      description="Plan evening blue-light reduction to protect melatonin production. Calculates cutoff times, suppression risk, and sleep delay estimates."
      icon={Eye} calculate={calculate} onClear={() => { setBedtime("23:00"); setScreenHrs(3); setResult(null) }}
      values={[bedtime, screenHrs]} result={result}
      seoContent={<SeoContentGenerator title="Blue Light Schedule" description="Plan blue light reduction for better sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
        <NumInput label="Evening Screen Usage" val={screenHrs} set={setScreenHrs} min={0} max={12} step={0.5} suffix="hrs after sunset" />
      </div>} />
  )
}

// ─── 11. Meditation Timer (Mindfulness Session Tool) ─────────────────────────
export function MeditationTimerCalculator() {
  const [duration, setDuration] = useState(15)
  const [technique, setTechnique] = useState("mindfulness")
  const [experience, setExperience] = useState("beginner")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 1, 120)

    const techniques: Record<string, { phases: { name: string; pct: number }[]; hrvBoost: number; anxietyReduce: number }> = {
      mindfulness: { phases: [{ name: "Settling In", pct: 15 }, { name: "Focused Attention", pct: 50 }, { name: "Open Awareness", pct: 25 }, { name: "Integration", pct: 10 }], hrvBoost: 12, anxietyReduce: 25 },
      bodycan: { phases: [{ name: "Grounding", pct: 10 }, { name: "Feet to Legs", pct: 25 }, { name: "Torso Scan", pct: 30 }, { name: "Head & Integration", pct: 35 }], hrvBoost: 8, anxietyReduce: 30 },
      lovingkindness: { phases: [{ name: "Self-Compassion", pct: 30 }, { name: "Loved Ones", pct: 30 }, { name: "Neutral Person", pct: 20 }, { name: "All Beings", pct: 20 }], hrvBoost: 15, anxietyReduce: 35 },
      transcendental: { phases: [{ name: "Settling", pct: 10 }, { name: "Mantra Repetition", pct: 70 }, { name: "Silent Rest", pct: 20 }], hrvBoost: 18, anxietyReduce: 40 },
      breath: { phases: [{ name: "Natural Breathing", pct: 20 }, { name: "Counted Breath", pct: 50 }, { name: "Breath Awareness", pct: 30 }], hrvBoost: 10, anxietyReduce: 20 }
    }

    const tech = techniques[technique] || techniques.mindfulness
    const phases = tech.phases.map(p => ({ name: p.name, minutes: r1(dur * p.pct / 100) }))

    const expMultiplier = experience === "advanced" ? 1.5 : experience === "intermediate" ? 1.2 : 1.0
    const hrvImprovement = r1(tech.hrvBoost * expMultiplier * Math.min(2, dur / 15))
    const anxietyReduction = r1(tech.anxietyReduce * expMultiplier * Math.min(1.5, dur / 20))
    const calmnessScore = r0(clamp(50 + dur * 1.5 + hrvImprovement, 0, 100))

    const recDuration = experience === "beginner" ? "5-10 min" : experience === "intermediate" ? "15-25 min" : "30-60 min"

    setResult({
      primaryMetric: { label: "Session Plan", value: `${dur} min ${technique}`, status: "good", description: `${phases.length} phases — Est. HRV improvement: +${hrvImprovement}%` },
      healthScore: calmnessScore,
      metrics: [
        { label: "Duration", value: dur, unit: "min", status: "good" },
        { label: "Technique", value: technique.charAt(0).toUpperCase() + technique.slice(1), status: "good" },
        ...phases.map(p => ({ label: p.name, value: p.minutes, unit: "min", status: "normal" as const })),
        { label: "HRV Improvement", value: `+${hrvImprovement}%`, status: "good" },
        { label: "Anxiety Reduction", value: `${anxietyReduction}%`, status: "good" },
        { label: "Calmness Score", value: calmnessScore, unit: "/100", status: calmnessScore > 70 ? "good" : "warning" },
        { label: "Recommended Duration", value: recDuration, status: "normal" }
      ],
      recommendations: [
        { title: "Session Structure", description: `${dur}-min ${technique} meditation in ${phases.length} phases: ${phases.map(p => `${p.name} (${p.minutes} min)`).join(" → ")}. Consistency matters more than duration — daily 10 min beats weekly 60 min. 8 weeks of daily practice = measurable brain changes.`, priority: "high", category: "Practice" },
        { title: "HRV & Anxiety Benefits", description: `Expected HRV improvement: +${hrvImprovement}% (higher is better — indicates improved autonomic regulation). Anxiety reduction: ~${anxietyReduction}%. Regular meditation increases prefrontal cortex thickness, reduces amygdala reactivity, and improves default mode network function.`, priority: "high", category: "Benefits" },
        { title: "Progression", description: `Experience level: ${experience}. ${experience === "beginner" ? "Start with 5 min daily and increase by 2 min/week. Focus on breath counting." : experience === "intermediate" ? "Experiment with different techniques. Try body scan for physical tension, loving-kindness for emotional health." : "Deepen practice with longer sits. Consider retreat experience. Explore non-directive meditation."} Aim for same time daily.`, priority: "medium", category: "Growth" }
      ],
      detailedBreakdown: { "Duration": `${dur} min`, "Technique": technique, "Phases": phases.map(p => `${p.name}: ${p.minutes}m`).join(", "), "HRV Boost": `+${hrvImprovement}%`, "Anxiety -": `${anxietyReduction}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="meditation-timer" title="Meditation Timer — Mindfulness Session Tool"
      description="Structure guided meditation sessions with phase timing, technique selection, HRV improvement estimates, and anxiety reduction scores."
      icon={Brain} calculate={calculate} onClear={() => { setDuration(15); setTechnique("mindfulness"); setExperience("beginner"); setResult(null) }}
      values={[duration, technique, experience]} result={result}
      seoContent={<SeoContentGenerator title="Meditation Timer" description="Plan structured meditation sessions." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Session Duration" val={duration} set={setDuration} min={1} max={120} suffix="minutes" />
        <SelectInput label="Technique" val={technique} set={setTechnique} options={[{ value: "mindfulness", label: "Mindfulness (focused attention)" }, { value: "bodycan", label: "Body Scan" }, { value: "lovingkindness", label: "Loving-Kindness (Metta)" }, { value: "transcendental", label: "Transcendental (Mantra)" }, { value: "breath", label: "Breath Awareness" }]} />
        <SelectInput label="Experience Level" val={experience} set={setExperience} options={[{ value: "beginner", label: "Beginner (< 3 months)" }, { value: "intermediate", label: "Intermediate (3-12 months)" }, { value: "advanced", label: "Advanced (1+ years)" }]} />
      </div>} />
  )
}

// ─── 12. Breathing Exercise Timer (Respiratory Relaxation Model) ─────────────
export function BreathingExerciseCalculator() {
  const [technique, setTechnique] = useState("478")
  const [durationMin, setDurationMin] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(durationMin, 1, 30)

    const techniques: Record<string, { name: string; inhale: number; hold: number; exhale: number; hold2?: number; cycleSec: number; desc: string; anxietyReduce: number }> = {
      "478": { name: "4-7-8 Breathing", inhale: 4, hold: 7, exhale: 8, cycleSec: 19, desc: "Dr. Andrew Weil's relaxation technique. Activates parasympathetic nervous system.", anxietyReduce: 40 },
      box: { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4, hold2: 4, cycleSec: 16, desc: "Navy SEAL technique. Equal phases for calm under pressure.", anxietyReduce: 35 },
      coherent: { name: "Coherent Breathing", inhale: 5, hold: 0, exhale: 5, cycleSec: 10, desc: "5.5 breaths/min synchronized with heart rate variability.", anxietyReduce: 30 },
      physiological: { name: "Physiological Sigh", inhale: 3, hold: 0, exhale: 6, cycleSec: 9, desc: "Double inhale + long exhale. Fastest real-time stress relief (Stanford 2023).", anxietyReduce: 45 },
      alternate: { name: "Alternate Nostril", inhale: 4, hold: 2, exhale: 4, cycleSec: 10, desc: "Yogic Nadi Shodhana. Balances autonomic nervous system.", anxietyReduce: 25 }
    }

    const tech = techniques[technique] || techniques["478"]
    const totalCycles = r0(dur * 60 / tech.cycleSec)
    const totalBreaths = totalCycles

    const anxietyReduction = r0(tech.anxietyReduce * Math.min(1.5, dur / 5))
    const hrReduction = r0(Math.min(15, dur * 1.5))
    const bpReduction = r1(Math.min(8, dur * 0.8))

    const calmnessScore = r0(clamp(40 + anxietyReduction + dur * 2, 0, 100))

    setResult({
      primaryMetric: { label: "Breathing Plan", value: tech.name, status: "good", description: `${totalCycles} cycles in ${dur} min — Anxiety reduction: ~${anxietyReduction}%` },
      healthScore: calmnessScore,
      metrics: [
        { label: "Technique", value: tech.name, status: "good" },
        { label: "Inhale", value: tech.inhale, unit: "sec", status: "normal" },
        { label: "Hold", value: tech.hold, unit: "sec", status: "normal" },
        { label: "Exhale", value: tech.exhale, unit: "sec", status: "normal" },
        ...(tech.hold2 ? [{ label: "Hold 2", value: tech.hold2, unit: "sec", status: "normal" as const }] : []),
        { label: "Cycle Duration", value: tech.cycleSec, unit: "sec", status: "normal" },
        { label: "Total Cycles", value: totalCycles, status: "good" },
        { label: "Session Duration", value: dur, unit: "min", status: "good" },
        { label: "Anxiety Reduction", value: `~${anxietyReduction}%`, status: "good" },
        { label: "Heart Rate Reduction", value: `-${hrReduction} bpm`, status: "good" },
        { label: "BP Reduction", value: `-${bpReduction} mmHg`, status: "good" },
        { label: "Calmness Score", value: calmnessScore, unit: "/100", status: calmnessScore > 70 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Breathing Pattern", description: `${tech.name}: ${tech.desc} Pattern: Inhale ${tech.inhale}s${tech.hold > 0 ? ` → Hold ${tech.hold}s` : ""} → Exhale ${tech.exhale}s${tech.hold2 ? ` → Hold ${tech.hold2}s` : ""}. Complete ${totalCycles} cycles for maximum benefit.`, priority: "high", category: "Technique" },
        { title: "Physiological Effects", description: `Extended exhale activates vagus nerve → parasympathetic response → reduced heart rate (est. -${hrReduction} bpm), lower cortisol, reduced blood pressure (est. -${bpReduction} mmHg). Effects begin within 90 seconds and compound over 5+ minutes.`, priority: "high", category: "Science" },
        { title: "Practice Guide", description: `Best times: morning (sets calm tone), before stressful events, before sleep. Sit comfortably with straight spine. Breathe through nose when possible. Start with 3 min and build to ${dur}+ min. Pair with meditation for enhanced effects.`, priority: "medium", category: "Practice" }
      ],
      detailedBreakdown: { "Technique": tech.name, "Pattern": `${tech.inhale}-${tech.hold}-${tech.exhale}${tech.hold2 ? `-${tech.hold2}` : ""}`, "Cycles": totalCycles, "Duration": `${dur} min`, "Anxiety -": `${anxietyReduction}%`, "HR -": `${hrReduction} bpm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="breathing-exercise-timer" title="Breathing Exercise Timer"
      description="Guided breathing exercises with multiple techniques (4-7-8, Box, Coherent, Physiological Sigh). Calculates anxiety reduction and physiological benefits."
      icon={Wind} calculate={calculate} onClear={() => { setTechnique("478"); setDurationMin(5); setResult(null) }}
      values={[technique, durationMin]} result={result}
      seoContent={<SeoContentGenerator title="Breathing Exercise Timer" description="Structured breathing exercises for relaxation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Breathing Technique" val={technique} set={setTechnique} options={[{ value: "478", label: "4-7-8 Breathing (Relaxation)" }, { value: "box", label: "Box Breathing (Navy SEAL)" }, { value: "coherent", label: "Coherent Breathing (HRV)" }, { value: "physiological", label: "Physiological Sigh (Stanford)" }, { value: "alternate", label: "Alternate Nostril (Yogic)" }]} />
        <NumInput label="Session Duration" val={durationMin} set={setDurationMin} min={1} max={30} suffix="minutes" />
      </div>} />
  )
}

// ─── 13. Alcohol Sleep Impact Calculator ─────────────────────────────────────
export function AlcoholSleepImpactCalculator() {
  const [drinks, setDrinks] = useState(2)
  const [alcoholPct, setAlcoholPct] = useState(5)
  const [weight, setWeight] = useState(70)
  const [gender, setGender] = useState("male")
  const [consumeTime, setConsumeTime] = useState("20:00")
  const [bedtime, setBedtime] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(drinks, 0.5, 20)
    const pct = clamp(alcoholPct, 1, 60)
    const w = clamp(weight, 30, 200)
    const male = gender === "male"
    const consume = timeToMin(consumeTime)
    const bed = timeToMin(bedtime)

    let hoursToBed = (bed - consume) / 60
    if (hoursToBed <= 0) hoursToBed += 24

    // Standard drink = 14g alcohol. Estimate from drinks × abv
    const mlPerDrink = 355  // ~12 oz
    const alcoholGrams = r1(d * mlPerDrink * (pct / 100) * 0.789)
    const standardDrinks = r1(alcoholGrams / 14)

    // BAC estimation (Widmark formula)
    const bodyWater = male ? 0.68 : 0.55
    const bac = r2(Math.max(0, (alcoholGrams / (w * 1000 * bodyWater)) * 100 - 0.015 * hoursToBed))
    const bacAtBed = r2(Math.max(0, bac))

    // Alcohol metabolism: ~0.015 BAC/hr
    const hoursToZero = r1(Math.max(0, bac / 0.015 + hoursToBed))
    const clearTime = consume + r0(hoursToZero * 60)

    // REM suppression: dose-dependent
    const remSuppression = r0(clamp(standardDrinks * 15, 0, 80))

    // Night awakening probability
    const awakeningProb = r0(clamp(standardDrinks * 12 + (bacAtBed > 0.05 ? 20 : 0), 0, 95))

    // Deep sleep effect: alcohol initially increases deep sleep, then disrupts
    const deepSleepFirst = r0(clamp(standardDrinks * 8, 0, 40))
    const deepSleepSecond = r0(clamp(standardDrinks * -12, -60, 0))

    // Next-day fatigue
    const fatigueIndex = r0(clamp(standardDrinks * 10 + (bacAtBed > 0.03 ? 15 : 0), 0, 100))

    const sleepQuality = Math.max(0, r0(100 - remSuppression * 0.5 - awakeningProb * 0.3 - fatigueIndex * 0.2))
    const status: 'good' | 'warning' | 'danger' = sleepQuality > 70 ? "good" : sleepQuality > 45 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Sleep Quality Impact", value: `${sleepQuality}/100`, status, description: `${standardDrinks} standard drinks — REM suppressed ${remSuppression}%, ${awakeningProb}% awakening probability` },
      healthScore: sleepQuality,
      metrics: [
        { label: "Standard Drinks", value: standardDrinks, status: standardDrinks <= 1 ? "good" : standardDrinks <= 2 ? "warning" : "danger" },
        { label: "Alcohol (grams)", value: alcoholGrams, unit: "g", status: "normal" },
        { label: "BAC at Bedtime", value: bacAtBed, unit: "%", status: bacAtBed < 0.02 ? "good" : bacAtBed < 0.05 ? "warning" : "danger" },
        { label: "Full Clearance", value: fmtTime(clearTime), status: "normal" },
        { label: "REM Suppression", value: remSuppression, unit: "%", status: remSuppression < 20 ? "good" : remSuppression < 40 ? "warning" : "danger" },
        { label: "Night Awakening Risk", value: awakeningProb, unit: "%", status: awakeningProb < 20 ? "good" : awakeningProb < 50 ? "warning" : "danger" },
        { label: "Deep Sleep 1st Half", value: `+${deepSleepFirst}%`, status: "warning" },
        { label: "Deep Sleep 2nd Half", value: `${deepSleepSecond}%`, status: deepSleepSecond < -20 ? "danger" : "warning" },
        { label: "Next-Day Fatigue", value: fatigueIndex, unit: "/100", status: fatigueIndex < 20 ? "good" : fatigueIndex < 50 ? "warning" : "danger" },
        { label: "Sleep Quality Score", value: sleepQuality, unit: "/100", status }
      ],
      recommendations: [
        { title: "Alcohol & Sleep Architecture", description: `${standardDrinks} drinks = ${remSuppression}% REM suppression. Alcohol initially sedates (increases deep sleep first half by ${deepSleepFirst}%) but second-half sleep is fragmented (deep sleep -${Math.abs(deepSleepSecond)}%, frequent awakenings). Net effect is always negative for sleep quality.`, priority: "high", category: "Impact" },
        { title: "BAC & Timing", description: `BAC at bedtime: ${bacAtBed}%. Full clearance: ${fmtTime(clearTime)}. To minimize sleep disruption: stop drinking 3-4 hrs before bed, alternate with water, eat before drinking (slows absorption). Even "moderate" drinking (1-2 drinks) measurably disrupts sleep.`, priority: "high", category: "Timing" },
        { title: "Next Day Recovery", description: `Fatigue index: ${fatigueIndex}/100. ${fatigueIndex > 40 ? "Significant next-day impairment expected. Dehydration + disrupted sleep architecture = reduced cognitive performance, mood changes, and slower reaction time." : "Mild impact. Stay hydrated and maintain sleep schedule."} Alcohol disrupts sleep for up to 2 nights after consumption.`, priority: "medium", category: "Recovery" }
      ],
      detailedBreakdown: { "Drinks": d, "ABV": `${pct}%`, "Standard Drinks": standardDrinks, "Alcohol": `${alcoholGrams}g`, "BAC at Bed": `${bacAtBed}%`, "Clearance": fmtTime(clearTime), "REM Suppress": `${remSuppression}%`, "Awakening %": awakeningProb, "Fatigue": fatigueIndex }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="alcohol-sleep-impact" title="Alcohol Sleep Impact Calculator"
      description="Estimate how alcohol affects sleep architecture. Calculates BAC at bedtime, REM suppression, night awakening probability, and next-day fatigue index."
      icon={Moon} calculate={calculate} onClear={() => { setDrinks(2); setAlcoholPct(5); setWeight(70); setGender("male"); setConsumeTime("20:00"); setBedtime("23:00"); setResult(null) }}
      values={[drinks, alcoholPct, weight, gender, consumeTime, bedtime]} result={result}
      seoContent={<SeoContentGenerator title="Alcohol Sleep Impact Calculator" description="Calculate how alcohol disrupts sleep quality." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Number of Drinks" val={drinks} set={setDrinks} min={0.5} max={20} step={0.5} suffix="drinks" />
          <NumInput label="Alcohol Percentage" val={alcoholPct} set={setAlcoholPct} min={1} max={60} step={0.5} suffix="% ABV" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} suffix="kg" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Time of Consumption" val={consumeTime} set={setConsumeTime} />
          <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
        </div>
      </div>} />
  )
}
