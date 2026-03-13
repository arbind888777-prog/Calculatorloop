"use client"

import { useState } from "react"
import { Moon, Sun, Clock, Eye, Thermometer, Volume2, Activity, Brain } from "lucide-react"
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

// ─── 28. Sleep Onset Latency Tracker ──────────────────────────────────────────
export function SleepOnsetLatencyCalculator() {
  const [bedtime, setBedtime] = useState("23:00")
  const [sleepStart, setSleepStart] = useState("23:25")
  const [screenBefore, setScreenBefore] = useState(2)
  const [caffeine, setCaffeine] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bed = timeToMin(bedtime)
    const start = timeToMin(sleepStart)
    let sol = start - bed
    if (sol < 0) sol += 1440
    sol = clamp(sol, 0, 300)
    const scr = clamp(screenBefore, 0, 6)

    let status: 'good' | 'warning' | 'danger' = sol < 20 ? "good" : sol < 30 ? "warning" : "danger"
    const label = sol < 10 ? "Very Fast" : sol < 20 ? "Normal" : sol < 30 ? "Delayed" : sol < 45 ? "Significantly Delayed" : "Severe Delay"

    const insomniaProb = r0(clamp(sol * 1.8 + scr * 5 + (caffeine !== "none" ? 15 : 0), 0, 95))
    const anxietyDelay = r0(clamp(sol * 0.8 + scr * 3, 0, 80))
    const hygieneScore = Math.max(0, r0(100 - sol * 1.5 - scr * 8 - (caffeine !== "none" ? 12 : 0)))

    setResult({
      primaryMetric: { label: "Sleep Onset Latency", value: `${sol} min`, status, description: `${label} — ${sol < 20 ? "Healthy range" : "May indicate sleep difficulty"}` },
      healthScore: hygieneScore,
      metrics: [
        { label: "SOL", value: sol, unit: "min", status },
        { label: "Category", value: label, status },
        { label: "Insomnia Probability", value: insomniaProb, unit: "%", status: insomniaProb > 50 ? "danger" : insomniaProb > 25 ? "warning" : "good" },
        { label: "Anxiety-Related Delay", value: anxietyDelay, unit: "%", status: anxietyDelay > 40 ? "danger" : anxietyDelay > 20 ? "warning" : "good" },
        { label: "Sleep Hygiene Score", value: hygieneScore, unit: "/100", status: hygieneScore > 70 ? "good" : hygieneScore > 45 ? "warning" : "danger" },
        { label: "Screen Before Bed", value: scr, unit: "hrs", status: scr < 1 ? "good" : scr < 2 ? "warning" : "danger" },
        { label: "Caffeine", value: caffeine === "none" ? "None" : caffeine === "afternoon" ? "Afternoon" : "Evening", status: caffeine === "none" ? "good" : caffeine === "afternoon" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "SOL Assessment", description: `${sol} min SOL: ${label}. Normal SOL is 10-20 min. <5 min may indicate sleep deprivation (falling asleep too fast = overtired). >30 min meets one criteria for insomnia diagnosis. Clinical insomnia: SOL >30 min for ≥3 nights/week for ≥3 months.`, priority: "high", category: "Assessment" },
        { title: "Reducing Sleep Latency", description: `Insomnia probability: ${insomniaProb}%. Strategies: ${scr > 1 ? "Stop screens 60 min before bed (your " + scr + " hrs is too much). " : ""}${caffeine !== "none" ? "Eliminate late caffeine. " : ""}Progressive muscle relaxation reduces SOL by 18 min. CBT-I is gold standard (reduces SOL 50%).`, priority: "high", category: "Intervention" },
        { title: "Sleep Hygiene", description: `Score: ${hygieneScore}/100. Key factors: consistent bedtime (±30 min), dark cool room (65-68°F), no clock-watching, leave bed if not asleep in 20 min (stimulus control). Racing thoughts? Try cognitive shuffle or 4-7-8 breathing.`, priority: "medium", category: "Hygiene" }
      ],
      detailedBreakdown: { "Bedtime": fmtTime(bed), "Sleep Start": fmtTime(start), "SOL": `${sol} min`, "Screen": `${scr} hrs`, "Caffeine": caffeine, "Insomnia %": insomniaProb, "Hygiene": hygieneScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-onset-latency" title="Sleep Onset Latency Tracker"
      description="Measure time from bedtime to sleep onset. Assess insomnia probability, anxiety-related delay, and sleep hygiene score."
      icon={Moon} calculate={calculate} onClear={() => { setBedtime("23:00"); setSleepStart("23:25"); setScreenBefore(2); setCaffeine("none"); setResult(null) }}
      values={[bedtime, sleepStart, screenBefore, caffeine]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Onset Latency Tracker" description="Track how long it takes you to fall asleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Bedtime" val={bedtime} set={setBedtime} />
          <TimeInput label="Estimated Sleep Start" val={sleepStart} set={setSleepStart} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Screen Time Before Bed" val={screenBefore} set={setScreenBefore} min={0} max={6} step={0.5} suffix="hours" />
          <SelectInput label="Caffeine Intake" val={caffeine} set={setCaffeine} options={[{ value: "none", label: "None" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" }]} />
        </div>
      </div>} />
  )
}

// ─── 29. Wake After Sleep Onset (WASO) Calculator ─────────────────────────────
export function WASOCalculator() {
  const [awakenings, setAwakenings] = useState(3)
  const [avgDuration, setAvgDuration] = useState(10)
  const [totalSleep, setTotalSleep] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const awk = clamp(awakenings, 0, 30)
    const dur = clamp(avgDuration, 1, 60)
    const sleep = clamp(totalSleep, 2, 14)

    const waso = r0(awk * dur)
    const totalBed = r1(sleep + waso / 60)
    const continuity = r0(Math.max(0, 100 - waso * 1.5))
    const efficiency = r0((sleep / totalBed) * 100)

    let status: 'good' | 'warning' | 'danger' = waso < 20 ? "good" : waso < 40 ? "warning" : "danger"
    const label = waso < 15 ? "Excellent" : waso < 30 ? "Normal" : waso < 45 ? "Elevated" : "High"

    const apneaSuspicion = awk > 5 && dur < 5 ? "Moderate — frequent brief awakenings" : awk > 8 ? "High — very frequent awakenings" : "Low"
    const apneaStatus: 'good' | 'warning' | 'danger' = apneaSuspicion.startsWith("High") ? "danger" : apneaSuspicion.startsWith("Moderate") ? "warning" : "good"

    setResult({
      primaryMetric: { label: "WASO", value: `${waso} min`, status, description: `${label} — ${awk} awakenings × ${dur} min avg` },
      healthScore: continuity,
      metrics: [
        { label: "WASO", value: waso, unit: "min", status },
        { label: "Number of Awakenings", value: awk, status: awk <= 2 ? "good" : awk <= 5 ? "warning" : "danger" },
        { label: "Avg Awakening Duration", value: dur, unit: "min", status: dur < 10 ? "good" : dur < 20 ? "warning" : "danger" },
        { label: "Sleep Continuity Score", value: continuity, unit: "/100", status: continuity > 70 ? "good" : continuity > 45 ? "warning" : "danger" },
        { label: "Sleep Efficiency", value: efficiency, unit: "%", status: efficiency >= 85 ? "good" : efficiency >= 75 ? "warning" : "danger" },
        { label: "Sleep Apnea Suspicion", value: apneaSuspicion, status: apneaStatus },
        { label: "Total Time in Bed", value: r1(totalBed), unit: "hrs", status: "normal" }
      ],
      recommendations: [
        { title: "WASO Interpretation", description: `WASO = ${waso} min (${label}). Normal WASO: <20 min for young adults, <30 min for 50+. WASO >30 min is a diagnostic criterion for insomnia. ${waso > 40 ? "Significantly elevated — consider sleep study or CBT-I referral." : ""}`, priority: "high", category: "Assessment" },
        { title: "Sleep Continuity", description: `Continuity score: ${continuity}/100. Fragmented sleep reduces restorative deep sleep and REM. Even if total sleep time is adequate, high WASO reduces cognitive and mood benefits. Each 10 min of WASO reduces subjective sleep quality by ~8%.`, priority: "high", category: "Quality" },
        { title: "Sleep Apnea Screening", description: `Apnea suspicion: ${apneaSuspicion}. ${awk > 5 ? "Frequent brief awakenings (<5 min each) can indicate obstructive sleep apnea. Other signs: snoring, morning headache, daytime sleepiness. Consider STOP-BANG questionnaire or sleep study." : "Low suspicion based on awakening pattern."}`, priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "Awakenings": awk, "Avg Duration": `${dur} min`, "Total WASO": `${waso} min`, "Sleep Time": `${sleep} hrs`, "Efficiency": `${efficiency}%`, "Continuity": continuity }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="wake-after-sleep-onset" title="Wake After Sleep Onset (WASO) Calculator"
      description="Quantify sleep interruptions and assess sleep maintenance quality. Includes continuity score and sleep apnea screening."
      icon={Moon} calculate={calculate} onClear={() => { setAwakenings(3); setAvgDuration(10); setTotalSleep(7); setResult(null) }}
      values={[awakenings, avgDuration, totalSleep]} result={result}
      seoContent={<SeoContentGenerator title="WASO Calculator" description="Calculate wake after sleep onset and sleep continuity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Night Awakenings" val={awakenings} set={setAwakenings} min={0} max={30} suffix="times" />
          <NumInput label="Avg Duration Per Awakening" val={avgDuration} set={setAvgDuration} min={1} max={60} suffix="min" />
        </div>
        <NumInput label="Total Sleep Duration" val={totalSleep} set={setTotalSleep} min={2} max={14} step={0.5} suffix="hours" />
      </div>} />
  )
}

// ─── 30. Sleep Fragmentation Index ────────────────────────────────────────────
export function SleepFragmentationCalculator() {
  const [awakenings, setAwakenings] = useState(4)
  const [sleepHrs, setSleepHrs] = useState(7)
  const [movements, setMovements] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const awk = clamp(awakenings, 0, 30)
    const sleep = clamp(sleepHrs, 2, 14)
    const mov = clamp(movements, 0, 50)

    const fragIndex = r1(awk / sleep)
    const movIndex = r1(mov / sleep)
    const totalIndex = r1(fragIndex + movIndex * 0.3)

    let status: 'good' | 'warning' | 'danger' = totalIndex < 1.5 ? "good" : totalIndex < 3 ? "warning" : "danger"
    const label = totalIndex < 1 ? "Stable Sleep" : totalIndex < 2 ? "Mildly Fragmented" : totalIndex < 3.5 ? "Moderately Fragmented" : "Severely Fragmented"

    const restorativeProb = r0(Math.max(0, 100 - totalIndex * 20))
    const deepSleepEst = r0(Math.max(5, 25 - totalIndex * 4))
    const cogImpact = totalIndex > 3 ? "Significant" : totalIndex > 2 ? "Moderate" : totalIndex > 1 ? "Mild" : "Minimal"

    setResult({
      primaryMetric: { label: "Fragmentation Index", value: r1(totalIndex), status, description: `${label} — ${awk} awakenings in ${sleep} hrs sleep` },
      healthScore: restorativeProb,
      metrics: [
        { label: "Arousal Index", value: fragIndex, unit: "/hr", status: fragIndex < 1 ? "good" : fragIndex < 2 ? "warning" : "danger" },
        { label: "Movement Index", value: movIndex, unit: "/hr", status: movIndex < 2 ? "good" : movIndex < 4 ? "warning" : "danger" },
        { label: "Combined Fragmentation", value: r1(totalIndex), status },
        { label: "Sleep Stability", value: label, status },
        { label: "Restorative Sleep %", value: restorativeProb, unit: "%", status: restorativeProb > 60 ? "good" : restorativeProb > 40 ? "warning" : "danger" },
        { label: "Deep Sleep Estimate", value: deepSleepEst, unit: "% of total", status: deepSleepEst > 15 ? "good" : deepSleepEst > 10 ? "warning" : "danger" },
        { label: "Cognitive Impact", value: cogImpact, status: cogImpact === "Minimal" ? "good" : cogImpact === "Mild" ? "good" : cogImpact === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Fragmentation Analysis", description: `Index: ${r1(totalIndex)} (${label}). Normal: <1.5 arousals/hr. Sleep fragmentation prevents consolidation of deep sleep and REM. Even with 8 hrs total sleep, high fragmentation = poor cognitive recovery.`, priority: "high", category: "Analysis" },
        { title: "Improving Sleep Stability", description: `${totalIndex > 2 ? "Significantly fragmented sleep. Investigate causes: pain, snoring/apnea, restless legs, nocturia, noise, temperature. Consider sleep study if fragmentation persists." : "Mild fragmentation. Optimize environmental factors: blackout curtains, white noise, consistent temperature 65-68°F."}`, priority: "high", category: "Improvement" },
        { title: "Restorative Sleep", description: `Estimated ${restorativeProb}% restorative quality. Deep sleep (N3) heals tissue, builds muscle, strengthens immunity. REM consolidates memory. Both require uninterrupted cycles. Target: <5 awakenings/night for optimal restoration.`, priority: "medium", category: "Recovery" }
      ],
      detailedBreakdown: { "Awakenings": awk, "Sleep": `${sleep} hrs`, "Movements": mov, "Arousal Index": fragIndex, "Movement Index": movIndex, "Combined": r1(totalIndex), "Restorative %": restorativeProb }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-fragmentation-index" title="Sleep Fragmentation Index"
      description="Assess overall sleep stability from awakenings and movements. Includes restorative sleep probability and cognitive impact rating."
      icon={Moon} calculate={calculate} onClear={() => { setAwakenings(4); setSleepHrs(7); setMovements(8); setResult(null) }}
      values={[awakenings, sleepHrs, movements]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Fragmentation Index" description="Calculate sleep fragmentation and stability score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Awakenings" val={awakenings} set={setAwakenings} min={0} max={30} suffix="times" />
          <NumInput label="Sleep Duration" val={sleepHrs} set={setSleepHrs} min={2} max={14} step={0.5} suffix="hours" />
        </div>
        <NumInput label="Movement Arousals (brief)" val={movements} set={setMovements} min={0} max={50} suffix="times" />
      </div>} />
  )
}

// ─── 31. Chronotype Calculator ────────────────────────────────────────────────
export function ChronotypeCalculator() {
  const [prefWake, setPrefWake] = useState("07:00")
  const [peakProductivity, setPeakProductivity] = useState("10:00")
  const [sleepOnset, setSleepOnset] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(prefWake)
    const peak = timeToMin(peakProductivity)
    const onset = timeToMin(sleepOnset)

    const midSleep = onset + ((wake + 1440 - onset) % 1440) / 2
    const midMin = midSleep % 1440

    let chronotype = "", desc = ""
    if (midMin < 180) { chronotype = "Definite Morning (Lion)"; desc = "Strong early riser. Peak performance: 6-10 AM. Natural wake: before 6 AM." }
    else if (midMin < 210) { chronotype = "Moderate Morning (Lark)"; desc = "Morning preference. Peak: 8-12 PM. Best for routine-heavy work." }
    else if (midMin < 270) { chronotype = "Intermediate (Bear)"; desc = "Average chronotype (~55% of population). Follows solar cycle closely." }
    else if (midMin < 330) { chronotype = "Moderate Evening (Owl)"; desc = "Evening preference. Peak: 4-8 PM. Creative work thrives late." }
    else { chronotype = "Definite Evening (Wolf)"; desc = "Strong night owl. Peak: 6 PM-midnight. Often socially jet-lagged." }

    const socialJetlag = Math.abs(wake - 420)  // difference from 7 AM standard
    const misalignRisk = socialJetlag > 120 ? "High" : socialJetlag > 60 ? "Moderate" : "Low"
    const misalignStatus: 'good' | 'warning' | 'danger' = socialJetlag > 120 ? "danger" : socialJetlag > 60 ? "warning" : "good"

    const idealBed = fmtTime(onset)
    const idealWake = fmtTime(wake)
    const idealExercise = fmtTime(wake + 180)
    const idealFocus = fmtTime(peak)
    const idealCreative = fmtTime(peak + 360)

    setResult({
      primaryMetric: { label: "Chronotype", value: chronotype, status: "good", description: desc },
      healthScore: Math.max(0, r0(100 - socialJetlag * 0.3)),
      metrics: [
        { label: "Chronotype", value: chronotype, status: "good" },
        { label: "Mid-Sleep Point", value: fmtTime(midMin), status: "normal" },
        { label: "Preferred Wake", value: idealWake, status: "good" },
        { label: "Natural Bedtime", value: idealBed, status: "good" },
        { label: "Peak Focus", value: idealFocus, status: "good" },
        { label: "Peak Creative", value: idealCreative, status: "good" },
        { label: "Best Exercise", value: idealExercise, status: "good" },
        { label: "Circadian Misalignment", value: misalignRisk, status: misalignStatus },
        { label: "Social Jetlag", value: r0(socialJetlag / 60), unit: "hrs", status: misalignStatus }
      ],
      recommendations: [
        { title: "Chronotype Profile", description: `${chronotype}: ${desc} Chronotype is ~50% genetic (PER3 gene). Cannot be fully changed, but can shift 30-60 min with consistent light exposure and meal timing.`, priority: "high", category: "Profile" },
        { title: "Optimal Schedule", description: `Based on your chronotype: Wake ${idealWake}, Exercise ${idealExercise}, Deep work ${idealFocus}, Creative work ${idealCreative}, Wind down ${fmtTime(onset - 60)}, Sleep ${idealBed}. Aligning schedule with chronotype improves performance 10-15%.`, priority: "high", category: "Schedule" },
        { title: "Circadian Alignment", description: `Misalignment risk: ${misalignRisk}. ${socialJetlag > 60 ? "Your schedule may conflict with social/work norms. Morning light therapy can advance clock. " : ""}Evening types: avoid bright light at night, use blue-light filters. Morning types: maximize evening light if need to delay.`, priority: "medium", category: "Alignment" }
      ],
      detailedBreakdown: { "Mid-Sleep": fmtTime(midMin), "Chronotype": chronotype, "Wake": idealWake, "Bedtime": idealBed, "Peak Focus": idealFocus, "Social Jetlag": `${r0(socialJetlag / 60)} hrs` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="chronotype-calculator" title="Chronotype Calculator"
      description="Determine your biological clock type (Morning Lark, Intermediate Bear, Night Owl). Includes ideal daily schedule and circadian alignment assessment."
      icon={Sun} calculate={calculate} onClear={() => { setPrefWake("07:00"); setPeakProductivity("10:00"); setSleepOnset("23:00"); setResult(null) }}
      values={[prefWake, peakProductivity, sleepOnset]} result={result}
      seoContent={<SeoContentGenerator title="Chronotype Calculator" description="Find your chronotype and optimal daily schedule." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Preferred Wake-Up Time" val={prefWake} set={setPrefWake} />
          <TimeInput label="Peak Productivity Time" val={peakProductivity} set={setPeakProductivity} />
        </div>
        <TimeInput label="Natural Sleep Onset Time" val={sleepOnset} set={setSleepOnset} />
      </div>} />
  )
}

// ─── 32. Social Jetlag Calculator ─────────────────────────────────────────────
export function SocialJetlagCalculator() {
  const [wdBed, setWdBed] = useState("23:00")
  const [wdWake, setWdWake] = useState("06:30")
  const [weBed, setWeBed] = useState("01:00")
  const [weWake, setWeWake] = useState("09:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wdBedMin = timeToMin(wdBed)
    const wdWakeMin = timeToMin(wdWake)
    const weBedMin = timeToMin(weBed)
    const weWakeMin = timeToMin(weWake)

    let wdSleep = wdWakeMin - wdBedMin; if (wdSleep <= 0) wdSleep += 1440
    let weSleep = weWakeMin - weBedMin; if (weSleep <= 0) weSleep += 1440

    const wdMid = (wdBedMin + wdSleep / 2) % 1440
    const weMid = (weBedMin + weSleep / 2) % 1440

    let sjHrs = Math.abs(weMid - wdMid) / 60
    if (sjHrs > 12) sjHrs = 24 - sjHrs
    sjHrs = r1(sjHrs)

    const status: 'good' | 'warning' | 'danger' = sjHrs < 1 ? "good" : sjHrs < 2 ? "warning" : "danger"
    const label = sjHrs < 0.5 ? "Minimal" : sjHrs < 1 ? "Mild" : sjHrs < 2 ? "Moderate" : "Severe"

    const metabolicRisk = sjHrs > 2 ? "Elevated" : sjHrs > 1 ? "Mildly elevated" : "Normal"
    const bmiImpact = r1(sjHrs * 0.3)
    const moodImpact = sjHrs > 1.5 ? "Significant" : sjHrs > 0.5 ? "Mild" : "Minimal"

    setResult({
      primaryMetric: { label: "Social Jetlag", value: `${sjHrs} hrs`, status, description: `${label} circadian disruption — Weekday vs weekend mid-sleep shift` },
      healthScore: Math.max(0, r0(100 - sjHrs * 25)),
      metrics: [
        { label: "Social Jetlag", value: sjHrs, unit: "hours", status },
        { label: "Severity", value: label, status },
        { label: "Weekday Sleep", value: r1(wdSleep / 60), unit: "hrs", status: "normal" },
        { label: "Weekend Sleep", value: r1(weSleep / 60), unit: "hrs", status: "normal" },
        { label: "Weekday Mid-Sleep", value: fmtTime(wdMid), status: "normal" },
        { label: "Weekend Mid-Sleep", value: fmtTime(weMid), status: "normal" },
        { label: "Metabolic Risk", value: metabolicRisk, status: sjHrs > 2 ? "danger" : sjHrs > 1 ? "warning" : "good" },
        { label: "BMI Impact", value: `+${bmiImpact} BMI points`, status: bmiImpact > 0.5 ? "warning" : "good" },
        { label: "Mood Impact", value: moodImpact, status: moodImpact === "Significant" ? "danger" : moodImpact === "Mild" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Social Jetlag Impact", description: `${sjHrs} hrs social jetlag: ${label}. >1 hr = 33% higher odds of being overweight. >2 hrs = associated with depressive symptoms, poor academic/work performance, and increased cardiovascular risk. Affects ~70% of the population.`, priority: "high", category: "Impact" },
        { title: "Reducing Social Jetlag", description: `Target: <1 hr difference. Strategies: 1) Don't sleep in more than 1 hr on weekends. 2) Use bright morning light on workdays. 3) Gradually shift weekend sleep earlier by 30 min. 4) Avoid late Friday/Saturday night stimulation.`, priority: "high", category: "Fix" },
        { title: "Metabolic Connection", description: `Metabolic risk: ${metabolicRisk}. Social jetlag disrupts cortisol, insulin, and leptin rhythms. Each 1-hr increase in social jetlag is associated with ~11% higher risk of heart disease and 0.3 BMI units gain.`, priority: "medium", category: "Metabolism" }
      ],
      detailedBreakdown: { "WD Bed": fmtTime(wdBedMin), "WD Wake": fmtTime(wdWakeMin), "WE Bed": fmtTime(weBedMin), "WE Wake": fmtTime(weWakeMin), "WD Sleep": `${r1(wdSleep / 60)} hrs`, "WE Sleep": `${r1(weSleep / 60)} hrs`, "Social Jetlag": `${sjHrs} hrs` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="social-jetlag-calculator" title="Social Jetlag Calculator"
      description="Measure weekday-weekend sleep schedule mismatch. Calculates circadian disruption score, metabolic risk, and mood impact."
      icon={Clock} calculate={calculate} onClear={() => { setWdBed("23:00"); setWdWake("06:30"); setWeBed("01:00"); setWeWake("09:00"); setResult(null) }}
      values={[wdBed, wdWake, weBed, weWake]} result={result}
      seoContent={<SeoContentGenerator title="Social Jetlag Calculator" description="Calculate weekday vs weekend sleep schedule jetlag." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Weekday Schedule</p>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Weekday Bedtime" val={wdBed} set={setWdBed} />
          <TimeInput label="Weekday Wake Time" val={wdWake} set={setWdWake} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Weekend Schedule</p>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Weekend Bedtime" val={weBed} set={setWeBed} />
          <TimeInput label="Weekend Wake Time" val={weWake} set={setWeWake} />
        </div>
      </div>} />
  )
}

// ─── 33. Melatonin Timing Calculator ──────────────────────────────────────────
export function MelatoninTimingCalculator() {
  const [bedtime, setBedtime] = useState("23:00")
  const [lightOff, setLightOff] = useState("21:00")
  const [chronotype, setChronotype] = useState("intermediate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bed = timeToMin(bedtime)
    const lightOffMin = timeToMin(lightOff)

    const chronoShift = chronotype === "morning" ? -30 : chronotype === "evening" ? 45 : 0

    // DLMO typically 2-3 hrs before habitual bedtime
    const dlmo = bed - 150 + chronoShift
    const optimalSupplement = bed - 30
    const advancePhase = bed - 300 + chronoShift  // for advancing clock
    const delayPhase = bed + 540  // morning for delaying clock

    const darkBefore = (bed - lightOffMin + 1440) % 1440
    const darkAdequate = darkBefore >= 120
    const suppressionRisk = darkBefore < 60 ? "High" : darkBefore < 120 ? "Moderate" : "Low"

    setResult({
      primaryMetric: { label: "DLMO Estimate", value: fmtTime(dlmo), status: "good", description: `Dim Light Melatonin Onset — Natural melatonin starts ~${r0((bed - dlmo + 1440) % 1440 / 60)} hrs before bed` },
      healthScore: darkAdequate ? 85 : 55,
      metrics: [
        { label: "DLMO (Natural Onset)", value: fmtTime(dlmo), status: "good" },
        { label: "Best Supplement Time", value: fmtTime(optimalSupplement), status: "good" },
        { label: "Phase Advance Dose", value: fmtTime(advancePhase), status: "normal" },
        { label: "Phase Delay Dose", value: fmtTime(delayPhase % 1440), status: "normal" },
        { label: "Darkness Before Bed", value: r0(darkBefore / 60), unit: "hrs", status: darkAdequate ? "good" : "warning" },
        { label: "Melatonin Suppression Risk", value: suppressionRisk, status: suppressionRisk === "Low" ? "good" : suppressionRisk === "Moderate" ? "warning" : "danger" },
        { label: "Chronotype Adjustment", value: `${chronoShift > 0 ? "+" : ""}${chronoShift} min`, status: "normal" }
      ],
      recommendations: [
        { title: "Melatonin Timing", description: `DLMO estimated at ${fmtTime(dlmo)}. For sleep induction: take 0.5-3mg melatonin at ${fmtTime(optimalSupplement)} (30 min before bed). For clock advancement (night owls): take at ${fmtTime(advancePhase)} (5 hrs before bed). Low dose (0.5mg) is often as effective as high dose.`, priority: "high", category: "Dosing" },
        { title: "Darkness Protocol", description: `${r0(darkBefore / 60)} hrs darkness before bed. ${darkAdequate ? "Adequate — supports natural melatonin." : "Insufficient! Bright light suppresses melatonin. Dim rooms to <30 lux starting 2 hrs before bed."} Even 30 min of bright light at night can delay DLMO by 30-60 min. Use amber glasses after sunset.`, priority: "high", category: "Light" },
        { title: "Circadian Phase Shifting", description: `To advance clock (fall asleep earlier): melatonin at ${fmtTime(advancePhase)} + morning bright light. To delay (stay up later): morning melatonin at ${fmtTime(delayPhase % 1440)} + evening bright light. Shift 30 min/day max to avoid disorientation.`, priority: "medium", category: "Phase Shift" }
      ],
      detailedBreakdown: { "Bedtime": fmtTime(bed), "DLMO": fmtTime(dlmo), "Supplement": fmtTime(optimalSupplement), "Advance Dose": fmtTime(advancePhase), "Dark Window": `${r0(darkBefore / 60)} hrs`, "Chronotype": chronotype }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="melatonin-timing-calculator" title="Melatonin Timing Calculator"
      description="Calculate optimal melatonin supplement timing, DLMO estimation, and circadian phase shift protocol based on your chronotype."
      icon={Moon} calculate={calculate} onClear={() => { setBedtime("23:00"); setLightOff("21:00"); setChronotype("intermediate"); setResult(null) }}
      values={[bedtime, lightOff, chronotype]} result={result}
      seoContent={<SeoContentGenerator title="Melatonin Timing Calculator" description="Find optimal melatonin timing for better sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
          <TimeInput label="Lights-Off / Dim Time" val={lightOff} set={setLightOff} />
        </div>
        <SelectInput label="Chronotype" val={chronotype} set={setChronotype} options={[{ value: "morning", label: "Morning Lark" }, { value: "intermediate", label: "Intermediate" }, { value: "evening", label: "Night Owl" }]} />
      </div>} />
  )
}

// ─── 34. Light Exposure Tracker ───────────────────────────────────────────────
export function LightExposureCalculator() {
  const [outdoorMin, setOutdoorMin] = useState(45)
  const [screenHrs, setScreenHrs] = useState(6)
  const [morningLight, setMorningLight] = useState("yes")
  const [eveningScreen, setEveningScreen] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const outdoor = clamp(outdoorMin, 0, 480)
    const screen = clamp(screenHrs, 0, 18)
    const morning = morningLight === "yes"
    const evening = clamp(eveningScreen, 0, 8)

    const circadianScore = r0(clamp(
      (morning ? 25 : 0) + Math.min(35, outdoor * 0.7) + (20 - evening * 6) + (20 - (screen > 8 ? 20 : screen * 1.5)),
      0, 100
    ))

    const suppressionIndex = r0(clamp(evening * 12 + (screen > 6 ? 15 : 0) - (outdoor > 60 ? 10 : 0), 0, 100))
    const sadRisk = outdoor < 20 && !morning ? "Elevated" : outdoor < 45 ? "Mildly elevated" : "Low"
    const sadStatus: 'good' | 'warning' | 'danger' = sadRisk === "Elevated" ? "danger" : sadRisk.startsWith("Mildly") ? "warning" : "good"

    const vitDEst = outdoor > 120 ? "Likely adequate" : outdoor > 30 ? "Borderline" : "Insufficient exposure"

    setResult({
      primaryMetric: { label: "Circadian Light Score", value: `${circadianScore}/100`, status: circadianScore > 65 ? "good" : circadianScore > 40 ? "warning" : "danger", description: `Outdoor: ${outdoor} min, Evening screens: ${evening} hrs` },
      healthScore: circadianScore,
      metrics: [
        { label: "Circadian Score", value: circadianScore, unit: "/100", status: circadianScore > 65 ? "good" : circadianScore > 40 ? "warning" : "danger" },
        { label: "Outdoor Light", value: outdoor, unit: "min", status: outdoor > 60 ? "good" : outdoor > 30 ? "warning" : "danger" },
        { label: "Morning Light", value: morning ? "Yes" : "No", status: morning ? "good" : "warning" },
        { label: "Total Screen Time", value: screen, unit: "hrs", status: screen < 6 ? "good" : screen < 10 ? "warning" : "danger" },
        { label: "Evening Screen", value: evening, unit: "hrs", status: evening < 1 ? "good" : evening < 2 ? "warning" : "danger" },
        { label: "Melatonin Suppression", value: suppressionIndex, unit: "/100", status: suppressionIndex < 30 ? "good" : suppressionIndex < 60 ? "warning" : "danger" },
        { label: "SAD Risk", value: sadRisk, status: sadStatus },
        { label: "Vitamin D Exposure", value: vitDEst, status: vitDEst.startsWith("Likely") ? "good" : vitDEst === "Borderline" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Light Exposure Balance", description: `Circadian score: ${circadianScore}/100. Target ≥30 min bright outdoor light within 2 hrs of waking (even cloudy days = 10,000 lux vs indoor 500 lux). Morning light anchors circadian rhythm and boosts alertness, mood, and vitamin D.`, priority: "high", category: "Morning" },
        { title: "Evening Protection", description: `${evening} hrs evening screen = ${suppressionIndex}% melatonin suppression risk. Reduce evening blue light: Night Shift mode, amber glasses, dim rooms. Each hour of evening bright light delays sleep onset 20-30 min.`, priority: "high", category: "Evening" },
        { title: "Seasonal Considerations", description: `SAD risk: ${sadRisk}. In winter/low-latitude, use 10,000 lux light therapy box for 20-30 min each morning. Light therapy is as effective as antidepressants for seasonal depression. Year-round outdoor time improves circadian health.`, priority: "medium", category: "Seasonal" }
      ],
      detailedBreakdown: { "Outdoor": `${outdoor} min`, "Morning Light": morning ? "Yes" : "No", "Screen": `${screen} hrs`, "Evening": `${evening} hrs`, "Circadian Score": circadianScore, "Suppression": suppressionIndex, "SAD Risk": sadRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="light-exposure-tracker" title="Light Exposure Tracker"
      description="Track daily light exposure and its circadian impact. Calculates melatonin suppression index, SAD risk, and vitamin D exposure."
      icon={Sun} calculate={calculate} onClear={() => { setOutdoorMin(45); setScreenHrs(6); setMorningLight("yes"); setEveningScreen(2); setResult(null) }}
      values={[outdoorMin, screenHrs, morningLight, eveningScreen]} result={result}
      seoContent={<SeoContentGenerator title="Light Exposure Tracker" description="Track light exposure for circadian health." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Outdoor Light" val={outdoorMin} set={setOutdoorMin} min={0} max={480} suffix="min/day" />
          <SelectInput label="Morning Light (within 2 hrs wake)" val={morningLight} set={setMorningLight} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Screen Time" val={screenHrs} set={setScreenHrs} min={0} max={18} step={0.5} suffix="hrs/day" />
          <NumInput label="Evening Screen Use" val={eveningScreen} set={setEveningScreen} min={0} max={8} step={0.5} suffix="hrs after 7PM" />
        </div>
      </div>} />
  )
}

// ─── 35. Darkness Exposure Planner ────────────────────────────────────────────
export function DarknessExposurePlanner() {
  const [bedtime, setBedtime] = useState("23:00")
  const [roomLux, setRoomLux] = useState(150)
  const [screenHrs, setScreenHrs] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bed = timeToMin(bedtime)
    const lux = clamp(roomLux, 0, 1000)
    const screen = clamp(screenHrs, 0, 8)

    const dimStart = bed - 180   // 3 hrs before bed
    const screenOff = bed - 60
    const totalDark = bed - 120
    const maxLux30Before = 10   // target lux 30 min before bed

    const currentExposure = lux + screen * 50   // rough combined
    const onsetImprove = r0(clamp(Math.max(0, (currentExposure - 50) * 0.1), 0, 45))
    const melatoninProtect = lux <= 30 && screen <= 1 ? "Excellent" : lux <= 100 && screen <= 2 ? "Good" : lux <= 200 ? "Fair" : "Poor"

    const status: 'good' | 'warning' | 'danger' = melatoninProtect === "Excellent" || melatoninProtect === "Good" ? "good" : melatoninProtect === "Fair" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Darkness Plan", value: `Start dim at ${fmtTime(dimStart)}`, status, description: `Melatonin protection: ${melatoninProtect} — Room lux: ${lux}` },
      healthScore: melatoninProtect === "Excellent" ? 95 : melatoninProtect === "Good" ? 75 : melatoninProtect === "Fair" ? 50 : 25,
      metrics: [
        { label: "Start Dimming", value: fmtTime(dimStart), status: "good" },
        { label: "Screens Off", value: fmtTime(screenOff), status: "good" },
        { label: "Full Darkness", value: fmtTime(totalDark), status: "good" },
        { label: "Current Room Lux", value: lux, unit: "lux", status: lux <= 30 ? "good" : lux <= 100 ? "warning" : "danger" },
        { label: "Target Lux (30 min pre-bed)", value: `≤${maxLux30Before}`, unit: "lux", status: "good" },
        { label: "Evening Screen Hours", value: screen, unit: "hrs", status: screen < 1 ? "good" : screen < 2 ? "warning" : "danger" },
        { label: "Melatonin Protection", value: melatoninProtect, status },
        { label: "Sleep Onset Improvement", value: onsetImprove > 0 ? `-${onsetImprove} min` : "Optimal", status: onsetImprove > 20 ? "danger" : onsetImprove > 10 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Darkness Schedule", description: `Bedtime ${fmtTime(bed)}: Dim lights at ${fmtTime(dimStart)} (<50 lux), screens off at ${fmtTime(screenOff)}, full dark at ${fmtTime(totalDark)} (<10 lux). Use dimmer switches, amber bulbs, or candles. Current ${lux} lux is ${lux <= 30 ? "excellent" : lux <= 100 ? "good but could improve" : "too bright for pre-sleep"}.`, priority: "high", category: "Schedule" },
        { title: "Melatonin Science", description: `Light >30 lux suppresses melatonin production. Standard room lighting (150-300 lux) delays melatonin by 1-2 hrs. Phone screens emit 40-100 lux at typical distance. Even brief bright light exposure (>500 lux) at night can reset the circadian clock.`, priority: "high", category: "Science" },
        { title: "Practical Tips", description: `Low-cost strategies: Use table lamps instead of ceiling lights, get amber/red bulbs ($3-5), enable Night Shift/warm mode. Blackout curtains for sleeping. Wear blue-light glasses after ${fmtTime(dimStart)}. Reading: paper or e-ink (no backlight).`, priority: "medium", category: "Practical" }
      ],
      detailedBreakdown: { "Bedtime": fmtTime(bed), "Dim Start": fmtTime(dimStart), "Screen Off": fmtTime(screenOff), "Dark Start": fmtTime(totalDark), "Room Lux": lux, "Screen Hrs": screen, "Protection": melatoninProtect }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="darkness-exposure-planner" title="Darkness Exposure Planner"
      description="Optimize evening darkness for melatonin production. Creates a personalized dimming schedule based on bedtime and light environment."
      icon={Moon} calculate={calculate} onClear={() => { setBedtime("23:00"); setRoomLux(150); setScreenHrs(2); setResult(null) }}
      values={[bedtime, roomLux, screenHrs]} result={result}
      seoContent={<SeoContentGenerator title="Darkness Exposure Planner" description="Plan evening darkness for optimal melatonin release." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Room Brightness" val={roomLux} set={setRoomLux} min={0} max={1000} suffix="lux" />
          <NumInput label="Evening Screen Use" val={screenHrs} set={setScreenHrs} min={0} max={8} step={0.5} suffix="hrs" />
        </div>
      </div>} />
  )
}

// ─── 36. Exercise–Sleep Timing Calculator ─────────────────────────────────────
export function ExerciseSleepTimingCalculator() {
  const [exerciseTime, setExerciseTime] = useState("18:00")
  const [intensity, setIntensity] = useState("moderate")
  const [bedtime, setBedtime] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ex = timeToMin(exerciseTime)
    const bed = timeToMin(bedtime)
    let gap = (bed - ex + 1440) % 1440
    if (gap > 720) gap = 1440 - gap

    const minGap = intensity === "vigorous" ? 180 : intensity === "moderate" ? 120 : 60
    const gapOk = gap >= minGap

    const disruptProb = r0(clamp(Math.max(0, (minGap - gap) * 0.8) + (intensity === "vigorous" ? 10 : 0), 0, 80))
    const hrRecovery = intensity === "vigorous" ? r1(3 + Math.random()) : intensity === "moderate" ? r1(1.5 + Math.random() * 0.5) : r1(0.5 + Math.random() * 0.3)
    const coreTemp = intensity === "vigorous" ? "+1.5-2°C" : intensity === "moderate" ? "+0.5-1°C" : "+0.2-0.5°C"

    const bestAM = fmtTime(timeToMin("07:00") + 120)
    const bestPM = fmtTime(bed - 300)

    const status: 'good' | 'warning' | 'danger' = gapOk ? "good" : gap < minGap / 2 ? "danger" : "warning"

    setResult({
      primaryMetric: { label: "Exercise-Bed Gap", value: `${r1(gap / 60)} hrs`, status, description: `${gapOk ? "Adequate gap for " + intensity + " exercise" : "Too close! Need " + r1(minGap / 60) + "+ hrs for " + intensity}` },
      healthScore: gapOk ? 85 : Math.max(20, r0(85 - (minGap - gap) * 0.5)),
      metrics: [
        { label: "Gap", value: r1(gap / 60), unit: "hrs", status },
        { label: "Required Gap", value: r1(minGap / 60), unit: "hrs", status: "normal" },
        { label: "Sleep Disruption Risk", value: disruptProb, unit: "%", status: disruptProb < 15 ? "good" : disruptProb < 40 ? "warning" : "danger" },
        { label: "Intensity", value: intensity.charAt(0).toUpperCase() + intensity.slice(1), status: "normal" },
        { label: "Core Temp Rise", value: coreTemp, status: "normal" },
        { label: "HR Recovery Est", value: hrRecovery, unit: "hrs", status: "normal" },
        { label: "Best AM Exercise", value: bestAM, status: "good" },
        { label: "Best PM Exercise", value: bestPM, status: "good" }
      ],
      recommendations: [
        { title: "Exercise Timing", description: `${r1(gap / 60)} hr gap between ${intensity} exercise and bed. ${gapOk ? "Good timing! Exercise improves sleep quality: +18% deep sleep, −55% SOL." : "Too close. Vigorous exercise raises core temp, HR, cortisol, and adrenaline. Need " + r1(minGap / 60) + " hrs to cool down. Try earlier or reduce intensity."} Morning exercise is ideal for circadian alignment.`, priority: "high", category: "Timing" },
        { title: "Core Temperature", description: `Exercise raises core temp by ${coreTemp}. Sleep requires core temp to drop 1-2°C. After vigorous exercise, cooling takes 3+ hrs. Light evening exercise (yoga, walking) can actually improve sleep by promoting relaxation without excessive heat.`, priority: "high", category: "Thermoregulation" },
        { title: "Optimal Windows", description: `Best exercise times: Morning (${bestAM}) — anchors circadian rhythm + vitamin D. Afternoon (${bestPM}) — peak physical performance (body temp highest). Avoid high-intensity within 2-3 hrs of bed. Yoga/stretching is fine anytime.`, priority: "medium", category: "Optimization" }
      ],
      detailedBreakdown: { "Exercise": fmtTime(ex), "Intensity": intensity, "Bedtime": fmtTime(bed), "Gap": `${r1(gap / 60)} hrs`, "Required": `${r1(minGap / 60)} hrs`, "Disruption %": disruptProb }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="exercise-sleep-timing" title="Exercise–Sleep Timing Calculator"
      description="Optimize workout timing relative to bedtime. Calculates required cooldown gap, disruption probability, and best exercise windows."
      icon={Activity} calculate={calculate} onClear={() => { setExerciseTime("18:00"); setIntensity("moderate"); setBedtime("23:00"); setResult(null) }}
      values={[exerciseTime, intensity, bedtime]} result={result}
      seoContent={<SeoContentGenerator title="Exercise Sleep Timing Calculator" description="Find optimal exercise time for better sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Exercise Time" val={exerciseTime} set={setExerciseTime} />
          <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
        </div>
        <SelectInput label="Exercise Intensity" val={intensity} set={setIntensity} options={[{ value: "light", label: "Light (yoga, walking)" }, { value: "moderate", label: "Moderate (jogging, cycling)" }, { value: "vigorous", label: "Vigorous (HIIT, sprints)" }]} />
      </div>} />
  )
}

// ─── 37. Dinner–Bedtime Gap Calculator ────────────────────────────────────────
export function DinnerBedtimeGapCalculator() {
  const [dinnerTime, setDinnerTime] = useState("20:00")
  const [bedtime, setBedtime] = useState("23:00")
  const [mealSize, setMealSize] = useState("medium")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dinner = timeToMin(dinnerTime)
    const bed = timeToMin(bedtime)
    let gap = (bed - dinner + 1440) % 1440
    if (gap > 720) gap = 1440 - gap
    const gapHrs = r1(gap / 60)

    const idealGap = mealSize === "large" ? 3.5 : mealSize === "medium" ? 2.5 : 1.5
    const gapOk = gapHrs >= idealGap

    const gerdRisk = gapHrs < 2 && mealSize !== "light" ? "Elevated" : gapHrs < 1.5 ? "High" : "Low"
    const metabolicDisruption = r0(clamp(Math.max(0, (idealGap - gapHrs) * 25) + (mealSize === "large" ? 10 : 0), 0, 80))
    const sleepQualityImpact = gapHrs < 2 ? "Significant — delayed digestion disrupts deep sleep" : gapHrs < 3 ? "Mild" : "Minimal"

    const status: 'good' | 'warning' | 'danger' = gapOk ? "good" : gapHrs >= idealGap * 0.6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Dinner-Bed Gap", value: `${gapHrs} hrs`, status, description: `${gapOk ? "Adequate gap for " + mealSize + " meal" : "Too close! Need " + idealGap + "+ hrs for " + mealSize + " meal"}` },
      healthScore: gapOk ? 85 : Math.max(20, r0(85 - (idealGap - gapHrs) * 25)),
      metrics: [
        { label: "Gap", value: gapHrs, unit: "hrs", status },
        { label: "Ideal Gap", value: idealGap, unit: "hrs", status: "normal" },
        { label: "GERD Risk", value: gerdRisk, status: gerdRisk === "High" ? "danger" : gerdRisk === "Elevated" ? "warning" : "good" },
        { label: "Metabolic Disruption", value: metabolicDisruption, unit: "%", status: metabolicDisruption < 20 ? "good" : metabolicDisruption < 50 ? "warning" : "danger" },
        { label: "Sleep Impact", value: sleepQualityImpact, status: sleepQualityImpact.startsWith("Significant") ? "danger" : sleepQualityImpact === "Mild" ? "warning" : "good" },
        { label: "Meal Size", value: mealSize.charAt(0).toUpperCase() + mealSize.slice(1), status: "normal" }
      ],
      recommendations: [
        { title: "Meal Timing", description: `${gapHrs} hrs before bed (${mealSize} meal). ${gapOk ? "Good timing." : "Too close!"} Eating within 2 hrs of bed increases GERD by 5x, disrupts melatonin, raises insulin during sleep, and reduces deep sleep by up to 20%. Last meal should be your lightest.`, priority: "high", category: "Timing" },
        { title: "GERD Prevention", description: `GERD risk: ${gerdRisk}. Lying down within 2 hrs of large meal increases acid reflux. Raise bed head 6 inches, avoid spicy/fatty/acidic foods at dinner, eat slowly. If experiencing nighttime heartburn, increase gap to 3+ hrs.`, priority: "high", category: "Digestive" },
        { title: "Optimal Approach", description: `Ideal: finish eating 3 hrs before bed. If hungry at bedtime: small snack (<200 cal) with protein + complex carbs (e.g., yogurt, banana, handful of nuts). Avoid heavy protein, fried food, alcohol, chocolate before bed.`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Dinner": fmtTime(dinner), "Bedtime": fmtTime(bed), "Gap": `${gapHrs} hrs`, "Meal": mealSize, "Ideal": `${idealGap} hrs`, "GERD Risk": gerdRisk, "Metabolic %": metabolicDisruption }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="dinner-bedtime-gap" title="Dinner–Bedtime Gap Calculator"
      description="Assess late-night eating impact on sleep. Calculates GERD risk, metabolic disruption, and optimal dinner timing."
      icon={Clock} calculate={calculate} onClear={() => { setDinnerTime("20:00"); setBedtime("23:00"); setMealSize("medium"); setResult(null) }}
      values={[dinnerTime, bedtime, mealSize]} result={result}
      seoContent={<SeoContentGenerator title="Dinner Bedtime Gap Calculator" description="Calculate optimal dinner timing for better sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Dinner Time" val={dinnerTime} set={setDinnerTime} />
          <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
        </div>
        <SelectInput label="Meal Size" val={mealSize} set={setMealSize} options={[{ value: "light", label: "Light (snack/salad)" }, { value: "medium", label: "Medium (regular meal)" }, { value: "large", label: "Large (heavy/feast)" }]} />
      </div>} />
  )
}

// ─── 38. Bedroom Temperature Optimizer ────────────────────────────────────────
export function BedroomTempOptimizer() {
  const [tempC, setTempC] = useState(22)
  const [humidity, setHumidity] = useState(50)
  const [comfort, setComfort] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(tempC, 5, 40)
    const h = clamp(humidity, 10, 100)
    const c = clamp(comfort, 1, 10)

    const optMin = 16
    const optMax = 19
    const tempOk = t >= optMin && t <= optMax
    const tempDiff = t < optMin ? optMin - t : t > optMax ? t - optMax : 0

    const thermalComfort = r0(clamp(100 - tempDiff * 12 - Math.abs(h - 45) * 0.3, 0, 100))
    const insomniaRisk = r0(clamp(tempDiff * 10 + (h > 70 ? 15 : 0) + (h < 25 ? 8 : 0), 0, 70))

    const deepSleepImpact = tempDiff > 3 ? "Reduced 20-30%" : tempDiff > 1 ? "Reduced 5-15%" : "Optimal"
    const status: 'good' | 'warning' | 'danger' = tempOk ? "good" : tempDiff <= 3 ? "warning" : "danger"

    const suggestion = t > optMax ? `Lower to ${optMax}°C — use fan, AC, or open window` : t < optMin ? `Raise to ${optMin}°C — too cold impairs circulation` : `Maintain ${t}°C — in optimal range`

    setResult({
      primaryMetric: { label: "Room Temperature", value: `${t}°C / ${r0(t * 9 / 5 + 32)}°F`, status, description: `${tempOk ? "Optimal range (16-19°C)" : suggestion}` },
      healthScore: thermalComfort,
      metrics: [
        { label: "Temperature", value: t, unit: "°C", status },
        { label: "Optimal Range", value: "16–19°C / 60–67°F", status: "good" },
        { label: "Deviation", value: tempDiff, unit: "°C", status: tempDiff === 0 ? "good" : tempDiff <= 3 ? "warning" : "danger" },
        { label: "Humidity", value: h, unit: "%", status: h >= 30 && h <= 60 ? "good" : h >= 20 && h <= 70 ? "warning" : "danger" },
        { label: "Thermal Comfort", value: thermalComfort, unit: "/100", status: thermalComfort > 70 ? "good" : thermalComfort > 45 ? "warning" : "danger" },
        { label: "Insomnia Risk", value: insomniaRisk, unit: "%", status: insomniaRisk < 15 ? "good" : insomniaRisk < 35 ? "warning" : "danger" },
        { label: "Deep Sleep Impact", value: deepSleepImpact, status: deepSleepImpact === "Optimal" ? "good" : deepSleepImpact.includes("5-15") ? "warning" : "danger" },
        { label: "Comfort Rating", value: c, unit: "/10", status: c >= 7 ? "good" : c >= 4 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Temperature Optimization", description: `${t}°C (${r0(t * 9 / 5 + 32)}°F) — ${suggestion}. The body must drop core temperature 1-2°C to initiate sleep. Ambient 16-19°C facilitates this drop. Research: sleeping in 19°C increases deep sleep by 25% and reduces awakenings by 50% vs 24°C.`, priority: "high", category: "Temperature" },
        { title: "Humidity Control", description: `${h}% humidity — ${h >= 30 && h <= 60 ? "Optimal range" : h > 60 ? "Too humid — promotes mold, dust mites, congestion. Use dehumidifier." : "Too dry — causes airway irritation, snoring. Use humidifier."}. Ideal: 30-60%. Each 10% above 60% increases dust mite populations significantly.`, priority: "high", category: "Humidity" },
        { title: "Sleep Hacking", description: "Cool bedroom tricks: warm bath 90 min before bed (paradoxically cools core), keep feet slightly warm (socks), cool pillow/mattress, breathable bedding. Hot room = worst sleep modifier after noise and light.", priority: "medium", category: "Tips" }
      ],
      detailedBreakdown: { "Temp": `${t}°C / ${r0(t * 9 / 5 + 32)}°F`, "Optimal": "16-19°C", "Deviation": `${tempDiff}°C`, "Humidity": `${h}%`, "Comfort": `${c}/10`, "Insomnia Risk": `${insomniaRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bedroom-temp-optimizer" title="Bedroom Temperature Optimizer"
      description="Determine optimal sleep temperature and humidity. Assesses thermal comfort, insomnia risk, and deep sleep impact."
      icon={Thermometer} calculate={calculate} onClear={() => { setTempC(22); setHumidity(50); setComfort(5); setResult(null) }}
      values={[tempC, humidity, comfort]} result={result}
      seoContent={<SeoContentGenerator title="Bedroom Temperature Optimizer" description="Find optimal bedroom temperature for sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Room Temperature" val={tempC} set={setTempC} min={5} max={40} step={0.5} suffix="°C" />
          <NumInput label="Humidity" val={humidity} set={setHumidity} min={10} max={100} suffix="%" />
        </div>
        <NumInput label="Sleep Comfort Rating" val={comfort} set={setComfort} min={1} max={10} suffix="1=poor, 10=great" />
      </div>} />
  )
}

// ─── 39. Noise Sleep Impact Estimator ─────────────────────────────────────────
export function NoiseSleepImpactCalculator() {
  const [noiseDb, setNoiseDb] = useState(45)
  const [disturbances, setDisturbances] = useState(3)
  const [noiseType, setNoiseType] = useState("intermittent")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const db = clamp(noiseDb, 10, 120)
    const dist = clamp(disturbances, 0, 30)

    const arousalProb = r0(clamp((db - 30) * 2 + dist * 3 + (noiseType === "intermittent" ? 15 : noiseType === "sudden" ? 25 : 0), 0, 95))
    const fragPrediction = r1(clamp(dist * 0.5 + (db > 50 ? (db - 50) * 0.15 : 0), 0, 10))
    const deepSleepReduction = r0(clamp((db - 35) * 1.2 + dist * 2, 0, 60))

    const status: 'good' | 'warning' | 'danger' = db < 35 ? "good" : db < 50 ? "warning" : "danger"
    const label = db < 30 ? "Quiet" : db < 40 ? "Low" : db < 50 ? "Moderate" : db < 65 ? "Loud" : "Very Loud"

    const healthRisk = db > 55 ? "Elevated — chronic noise >55 dB increases cardiovascular risk" : "Low"
    const whiteNoiseBenefit = db > 40 ? `Yes — mask ${db} dB with 40-50 dB white/pink noise` : "Not needed at current levels"

    setResult({
      primaryMetric: { label: "Noise Level", value: `${db} dB`, status, description: `${label} — ${arousalProb}% arousal probability per disturbance` },
      healthScore: Math.max(0, r0(100 - db * 1.2 - dist * 3)),
      metrics: [
        { label: "Noise Level", value: db, unit: "dB", status },
        { label: "Category", value: label, status },
        { label: "Night Disturbances", value: dist, unit: "events", status: dist < 3 ? "good" : dist < 6 ? "warning" : "danger" },
        { label: "Noise Type", value: noiseType.charAt(0).toUpperCase() + noiseType.slice(1), status: noiseType === "constant" ? "good" : "warning" },
        { label: "Arousal Probability", value: arousalProb, unit: "%", status: arousalProb < 20 ? "good" : arousalProb < 50 ? "warning" : "danger" },
        { label: "Fragmentation Prediction", value: fragPrediction, unit: "awakenings/hr", status: fragPrediction < 1 ? "good" : fragPrediction < 2.5 ? "warning" : "danger" },
        { label: "Deep Sleep Reduction", value: deepSleepReduction, unit: "%", status: deepSleepReduction < 10 ? "good" : deepSleepReduction < 25 ? "warning" : "danger" },
        { label: "White Noise", value: whiteNoiseBenefit, status: db > 40 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Noise Impact", description: `${db} dB (${label}): ${arousalProb}% arousal probability. WHO recommends <35 dB for sleep. Reference: whisper 30 dB, normal room 40 dB, conversation 60 dB, traffic 70 dB. ${noiseType === "intermittent" ? "Intermittent noise is worse than constant — unpredictability increases arousals." : noiseType === "sudden" ? "Sudden noise spikes are the most disruptive to sleep." : "Constant noise is least disruptive — habituation occurs."}`, priority: "high", category: "Impact" },
        { title: "Noise Solutions", description: `Estimated ${deepSleepReduction}% deep sleep reduction. Solutions: ${db > 50 ? "Earplugs (reduce 20-30 dB), white noise machine (mask variable sounds), soundproof curtains/windows." : db > 35 ? "White/pink noise app at 40 dB can mask background. Fan or air purifier provides consistent masking." : "Current levels are acceptable for sleep."}`, priority: "high", category: "Solutions" },
        { title: "Health Effects", description: `${healthRisk}. Chronic nighttime noise >55 dB: 48% higher heart attack risk, elevated cortisol, impaired glucose metabolism. Even noise below awakening threshold disrupts sleep architecture. Children and elderly are more noise-sensitive.`, priority: "medium", category: "Health" }
      ],
      detailedBreakdown: { "Noise": `${db} dB`, "Type": noiseType, "Disturbances": dist, "Arousal %": arousalProb, "Fragmentation": fragPrediction, "Deep Sleep -": `${deepSleepReduction}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="noise-sleep-impact" title="Noise Sleep Impact Estimator"
      description="Estimate how ambient noise affects sleep quality. Calculates arousal probability, sleep fragmentation prediction, and recommends solutions."
      icon={Volume2} calculate={calculate} onClear={() => { setNoiseDb(45); setDisturbances(3); setNoiseType("intermittent"); setResult(null) }}
      values={[noiseDb, disturbances, noiseType]} result={result}
      seoContent={<SeoContentGenerator title="Noise Sleep Impact Calculator" description="Assess noise impact on sleep quality." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average Noise Level" val={noiseDb} set={setNoiseDb} min={10} max={120} suffix="dB" />
          <NumInput label="Night Disturbances" val={disturbances} set={setDisturbances} min={0} max={30} suffix="events" />
        </div>
        <SelectInput label="Noise Type" val={noiseType} set={setNoiseType} options={[{ value: "constant", label: "Constant (fan, traffic hum)" }, { value: "intermittent", label: "Intermittent (neighbors, barking)" }, { value: "sudden", label: "Sudden (sirens, crashes)" }]} />
      </div>} />
  )
}
