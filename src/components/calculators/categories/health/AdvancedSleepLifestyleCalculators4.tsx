"use client"

import { useState } from "react"
import { Moon, Sun, Clock, Brain, Activity, AlertCircle, Eye, Wind } from "lucide-react"
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

// ─── 40. Weekend Sleep Calculator (Catch-Up Sleep Model) ──────────────────────
export function WeekendSleepCalculator() {
  const [wdSleep, setWdSleep] = useState(6)
  const [weSleep, setWeSleep] = useState(9)
  const [recommended, setRecommended] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wd = clamp(wdSleep, 2, 14)
    const we = clamp(weSleep, 2, 16)
    const rec = clamp(recommended, 6, 12)

    const dailyDebt = rec - wd
    const weeklyDebt = dailyDebt * 5
    const weekendExtra = (we - rec) * 2
    const netRecovery = r1(weekendExtra)
    const debtAfterWeekend = r1(Math.max(0, weeklyDebt - weekendExtra))
    const catchupEfficiency = weeklyDebt > 0 ? r0(clamp((weekendExtra / weeklyDebt) * 100, 0, 100)) : 100

    const circadianDisruption = Math.abs(we - wd) > 2 ? "High" : Math.abs(we - wd) > 1 ? "Moderate" : "Low"
    const circStatus: 'good' | 'warning' | 'danger' = circadianDisruption === "High" ? "danger" : circadianDisruption === "Moderate" ? "warning" : "good"

    let status: 'good' | 'warning' | 'danger' = debtAfterWeekend < 2 ? "good" : debtAfterWeekend < 6 ? "warning" : "danger"
    const label = debtAfterWeekend === 0 ? "Fully Recovered" : debtAfterWeekend < 3 ? "Partial Recovery" : "Chronic Deficit"

    const chronicRisk = weeklyDebt > 10 ? "High — chronic sleep deprivation" : weeklyDebt > 5 ? "Moderate" : "Low"

    setResult({
      primaryMetric: { label: "Weekly Sleep Debt", value: `${r1(weeklyDebt)} hrs`, status, description: `${label} — Weekend recovers ${netRecovery > 0 ? netRecovery : 0} hrs` },
      healthScore: Math.max(0, r0(100 - debtAfterWeekend * 8)),
      metrics: [
        { label: "Weekday Sleep", value: wd, unit: "hrs/night", status: wd >= rec ? "good" : wd >= rec - 1 ? "warning" : "danger" },
        { label: "Weekend Sleep", value: we, unit: "hrs/night", status: "normal" },
        { label: "Recommended", value: rec, unit: "hrs", status: "good" },
        { label: "Daily Deficit", value: r1(dailyDebt), unit: "hrs", status: dailyDebt <= 0 ? "good" : dailyDebt < 1.5 ? "warning" : "danger" },
        { label: "Weekly Debt (5 days)", value: r1(weeklyDebt), unit: "hrs", status: weeklyDebt < 3 ? "good" : weeklyDebt < 7 ? "warning" : "danger" },
        { label: "Weekend Recovery", value: netRecovery > 0 ? `+${netRecovery}` : `${netRecovery}`, unit: "hrs", status: netRecovery > 0 ? "good" : "warning" },
        { label: "Remaining Debt", value: r1(debtAfterWeekend), unit: "hrs", status },
        { label: "Catch-Up Efficiency", value: catchupEfficiency, unit: "%", status: catchupEfficiency >= 80 ? "good" : catchupEfficiency >= 50 ? "warning" : "danger" },
        { label: "Circadian Disruption", value: circadianDisruption, status: circStatus },
        { label: "Chronic Risk", value: chronicRisk, status: chronicRisk.startsWith("High") ? "danger" : chronicRisk === "Moderate" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleep Debt Analysis", description: `${r1(weeklyDebt)} hrs weekly debt from ${wd} hrs/night (need ${rec}). ${label}. Research: sleep debt >20 hrs is nearly impossible to fully recover. Even 1 hr/night deficit accumulates to 5 hrs/week, impairing reaction time equivalent to 0.1% BAC.`, priority: "high", category: "Analysis" },
        { title: "Catch-Up Strategy", description: `Weekend recovery: ${catchupEfficiency}% efficient. ${debtAfterWeekend > 0 ? `Still ${r1(debtAfterWeekend)} hrs in debt. Sleeping in on weekends helps partially but causes social jetlag (${circadianDisruption} risk). Better: add 30-60 min to WEEKDAY sleep + 20 min afternoon nap.` : "Full recovery this week. Maintain weekday sleep to avoid new debt."}`, priority: "high", category: "Strategy" },
        { title: "Long-Term Health", description: `Chronic deficit risk: ${chronicRisk}. ${weeklyDebt > 5 ? "Chronic sleep debt increases: diabetes risk 2.5x, heart disease 48%, weight gain, depression. Cannot be fixed by weekend sleep alone — research shows cognitive deficits persist even after recovery sleep." : "Current deficit is manageable. Prioritize consistent weekday sleep."}`, priority: "medium", category: "Health" }
      ],
      detailedBreakdown: { "WD Sleep": `${wd} hrs`, "WE Sleep": `${we} hrs`, "Need": `${rec} hrs`, "Weekly Debt": `${r1(weeklyDebt)} hrs`, "Recovery": `${netRecovery} hrs`, "Remaining": `${r1(debtAfterWeekend)} hrs`, "Efficiency": `${catchupEfficiency}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weekend-sleep-calculator" title="Weekend Sleep Calculator"
      description="Analyze catch-up sleep effectiveness. Measures weekly sleep debt, weekend recovery efficiency, and circadian disruption risk."
      icon={Moon} calculate={calculate} onClear={() => { setWdSleep(6); setWeSleep(9); setRecommended(8); setResult(null) }}
      values={[wdSleep, weSleep, recommended]} result={result}
      seoContent={<SeoContentGenerator title="Weekend Sleep Calculator" description="Calculate weekend catch-up sleep and sleep debt recovery." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weekday Sleep" val={wdSleep} set={setWdSleep} min={2} max={14} step={0.5} suffix="hrs/night" />
          <NumInput label="Weekend Sleep" val={weSleep} set={setWeSleep} min={2} max={16} step={0.5} suffix="hrs/night" />
        </div>
        <NumInput label="Recommended Sleep Need" val={recommended} set={setRecommended} min={6} max={12} step={0.5} suffix="hrs" />
      </div>} />
  )
}

// ─── 41. Sleep Pressure Calculator (Homeostatic Sleep Drive) ──────────────────
export function SleepPressureCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [currentTime, setCurrentTime] = useState("22:00")
  const [naps, setNaps] = useState(0)
  const [napDuration, setNapDuration] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(wakeTime)
    const now = timeToMin(currentTime)
    let awakeMin = (now - wake + 1440) % 1440
    const napsCount = clamp(naps, 0, 5)
    const napMin = clamp(napDuration, 0, 120)

    // Naps reduce sleep pressure by ~30% of nap duration
    const effectiveAwake = Math.max(0, awakeMin - napsCount * napMin * 0.3)
    const awakeHrs = r1(effectiveAwake / 60)

    // Sleep pressure increases roughly linearly with wakefulness
    // Peak at ~16 hrs, critical after 18 hrs
    const pressure = r0(clamp((effectiveAwake / 960) * 100, 0, 100))  // 960 min = 16 hrs = 100%

    const optimalWindow = fmtTime(wake + 960)  // 16 hrs after waking
    const sleepGate = fmtTime(wake + 900)  // 15 hrs = sleep gate opens

    const fatigueIndex = r0(clamp(pressure * 0.8 + (napsCount === 0 && awakeHrs > 12 ? 15 : 0), 0, 100))
    const cogDecline = awakeHrs > 17 ? "Severe — equivalent to 0.05% BAC" : awakeHrs > 14 ? "Moderate — 30% slower reactions" : awakeHrs > 10 ? "Mild" : "Minimal"

    const status: 'good' | 'warning' | 'danger' = pressure < 60 ? "good" : pressure < 85 ? "warning" : "danger"
    const label = pressure < 30 ? "Low" : pressure < 60 ? "Building" : pressure < 85 ? "High" : "Critical"

    setResult({
      primaryMetric: { label: "Sleep Pressure", value: `${pressure}%`, status, description: `${label} — ${awakeHrs} hrs effective wakefulness` },
      healthScore: Math.max(0, r0(100 - pressure * 0.7)),
      metrics: [
        { label: "Sleep Pressure", value: pressure, unit: "%", status },
        { label: "Pressure Level", value: label, status },
        { label: "Time Awake", value: r1(awakeMin / 60), unit: "hrs", status: awakeMin / 60 < 14 ? "good" : awakeMin / 60 < 17 ? "warning" : "danger" },
        { label: "Effective Wakefulness", value: awakeHrs, unit: "hrs", status: awakeHrs < 14 ? "good" : awakeHrs < 17 ? "warning" : "danger" },
        { label: "Nap Pressure Relief", value: napsCount > 0 ? `-${r0(napsCount * napMin * 0.3)} min` : "None", status: napsCount > 0 ? "good" : "normal" },
        { label: "Optimal Sleep Window", value: optimalWindow, status: "good" },
        { label: "Sleep Gate Opens", value: sleepGate, status: "good" },
        { label: "Cognitive Fatigue", value: fatigueIndex, unit: "/100", status: fatigueIndex < 40 ? "good" : fatigueIndex < 70 ? "warning" : "danger" },
        { label: "Cognitive Decline", value: cogDecline, status: cogDecline.startsWith("Severe") ? "danger" : cogDecline.startsWith("Moderate") ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleep Pressure Science", description: `Pressure: ${pressure}% (${label}). Adenosine accumulates during wakefulness, creating homeostatic sleep drive. After 16 hrs, pressure is optimal for deep sleep. After 18+ hrs, microsleeps begin — dangerous for driving (6,000 fatal crashes/year in US from drowsy driving).`, priority: "high", category: "Science" },
        { title: "Optimal Sleep Window", description: `Sleep gate opens: ${sleepGate}. Optimal window: ${optimalWindow}. ${pressure > 85 ? "CRITICAL: Go to bed now. " : pressure > 60 ? "High pressure — sleep within 1-2 hrs for best deep sleep. " : "Pressure still building. Avoid napping now to build adequate pressure for tonight."}`, priority: "high", category: "Timing" },
        { title: "Nap Strategy", description: `${napsCount > 0 ? `${napsCount} nap(s) reduced pressure by ~${r0(napsCount * napMin * 0.3)} min equivalent. ` : "No naps today. "}Strategic napping: 20 min before 2 PM reduces pressure without disrupting night sleep. Avoid naps after 3 PM — delays sleep onset. Coffee nap: caffeine + 20 min nap = maximum alertness boost.`, priority: "medium", category: "Naps" }
      ],
      detailedBreakdown: { "Wake": fmtTime(wake), "Current": fmtTime(now), "Awake": `${r1(awakeMin / 60)} hrs`, "Effective": `${awakeHrs} hrs`, "Naps": napsCount, "Pressure": `${pressure}%`, "Fatigue": fatigueIndex }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-pressure-calculator" title="Sleep Pressure Calculator"
      description="Estimate homeostatic sleep drive from adenosine buildup. Identifies optimal sleep window and cognitive fatigue index."
      icon={Brain} calculate={calculate} onClear={() => { setWakeTime("07:00"); setCurrentTime("22:00"); setNaps(0); setNapDuration(0); setResult(null) }}
      values={[wakeTime, currentTime, naps, napDuration]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Pressure Calculator" description="Calculate sleep pressure and optimal sleep window." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Wake-Up Time" val={wakeTime} set={setWakeTime} />
          <TimeInput label="Current Time" val={currentTime} set={setCurrentTime} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Naps Taken" val={naps} set={setNaps} min={0} max={5} suffix="times" />
          <NumInput label="Nap Duration" val={napDuration} set={setNapDuration} min={0} max={120} suffix="min each" />
        </div>
      </div>} />
  )
}

// ─── 42. Adenosine Clearance Timer ────────────────────────────────────────────
export function AdenosineClearanceCalculator() {
  const [sleepHrs, setSleepHrs] = useState(7)
  const [caffeine, setCaffeine] = useState("moderate")
  const [wakeTime, setWakeTime] = useState("07:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sleep = clamp(sleepHrs, 2, 14)
    const wake = timeToMin(wakeTime)

    // Adenosine clears ~60% in first 4 hrs of sleep, rest needs full 7-8 hrs
    const baseClearance = Math.min(100, sleep * 13)
    const caffeineBlock = caffeine === "heavy" ? 20 : caffeine === "moderate" ? 10 : caffeine === "light" ? 5 : 0
    const effectiveClearance = r0(clamp(baseClearance - caffeineBlock, 0, 100))

    const brainRecovery = r0(clamp(effectiveClearance * 0.9 + (sleep >= 7 ? 10 : 0), 0, 100))
    const recoveryProb = r0(clamp(effectiveClearance * 0.85, 0, 100))

    const residualAdenosine = 100 - effectiveClearance
    const alertTime = fmtTime(wake + r0(residualAdenosine * 1.2))  // minutes until fully alert
    const peakAlert = fmtTime(wake + 120)  // typically 2 hrs after wake

    const status: 'good' | 'warning' | 'danger' = effectiveClearance > 80 ? "good" : effectiveClearance > 55 ? "warning" : "danger"
    const label = effectiveClearance > 85 ? "Excellent Clearance" : effectiveClearance > 65 ? "Good Clearance" : effectiveClearance > 45 ? "Partial Clearance" : "Poor Clearance"

    setResult({
      primaryMetric: { label: "Adenosine Clearance", value: `${effectiveClearance}%`, status, description: `${label} — ${sleep} hrs sleep, ${caffeine} caffeine` },
      healthScore: brainRecovery,
      metrics: [
        { label: "Adenosine Cleared", value: effectiveClearance, unit: "%", status },
        { label: "Clearance Quality", value: label, status },
        { label: "Residual Adenosine", value: residualAdenosine, unit: "%", status: residualAdenosine < 20 ? "good" : residualAdenosine < 45 ? "warning" : "danger" },
        { label: "Brain Recovery Score", value: brainRecovery, unit: "/100", status: brainRecovery > 75 ? "good" : brainRecovery > 50 ? "warning" : "danger" },
        { label: "Recovery Probability", value: recoveryProb, unit: "%", status: recoveryProb > 70 ? "good" : recoveryProb > 45 ? "warning" : "danger" },
        { label: "Caffeine Impact", value: `-${caffeineBlock}%`, status: caffeineBlock > 15 ? "danger" : caffeineBlock > 8 ? "warning" : "good" },
        { label: "Full Alertness By", value: alertTime, status: "normal" },
        { label: "Peak Alertness", value: peakAlert, status: "good" }
      ],
      recommendations: [
        { title: "Adenosine Science", description: `${effectiveClearance}% cleared during ${sleep} hrs sleep. Adenosine is a sleep-promoting nucleoside that builds up during waking. Glymphatic system clears it during deep sleep (mostly first 4 hrs). Full clearance needs 7-8 hrs. Caffeine blocks adenosine receptors (doesn't clear it) — when caffeine wears off, backed-up adenosine causes crash.`, priority: "high", category: "Science" },
        { title: "Recovery Optimization", description: `Brain recovery: ${brainRecovery}/100. ${sleep < 7 ? `Only ${sleep} hrs — need 7-8 for full clearance. Residual adenosine (${residualAdenosine}%) causes daytime sleepiness, poor focus, impaired memory. ` : "Adequate sleep duration. "}${caffeineBlock > 10 ? `Heavy caffeine blocks ${caffeineBlock}% of clearance benefit. Avoid caffeine after 2 PM — half-life is 5-6 hrs.` : "Caffeine impact is manageable."}`, priority: "high", category: "Recovery" },
        { title: "Morning Protocol", description: `Full alertness by: ${alertTime}. Peak: ${peakAlert}. To speed morning clearance: bright light exposure within 30 min of waking, cold water on face, 10 min walk. Delay caffeine 90 min after waking (let cortisol awakening response work first — Andrew Huberman protocol).`, priority: "medium", category: "Morning" }
      ],
      detailedBreakdown: { "Sleep": `${sleep} hrs`, "Caffeine": caffeine, "Clearance": `${effectiveClearance}%`, "Residual": `${residualAdenosine}%`, "Brain Recovery": brainRecovery, "Alert By": alertTime }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="adenosine-clearance" title="Adenosine Clearance Timer"
      description="Estimate adenosine clearance during sleep. Calculates brain recovery score, residual adenosine, and morning alertness timeline."
      icon={Brain} calculate={calculate} onClear={() => { setSleepHrs(7); setCaffeine("moderate"); setWakeTime("07:00"); setResult(null) }}
      values={[sleepHrs, caffeine, wakeTime]} result={result}
      seoContent={<SeoContentGenerator title="Adenosine Clearance Timer" description="Calculate adenosine clearance and brain recovery during sleep." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Duration" val={sleepHrs} set={setSleepHrs} min={2} max={14} step={0.5} suffix="hours" />
          <TimeInput label="Wake-Up Time" val={wakeTime} set={setWakeTime} />
        </div>
        <SelectInput label="Caffeine Intake" val={caffeine} set={setCaffeine} options={[{ value: "none", label: "None" }, { value: "light", label: "Light (1 cup)" }, { value: "moderate", label: "Moderate (2-3 cups)" }, { value: "heavy", label: "Heavy (4+ cups)" }]} />
      </div>} />
  )
}

// ─── 43. Sleep Hygiene Score ──────────────────────────────────────────────────
export function SleepHygieneScoreCalculator() {
  const [consistentBed, setConsistentBed] = useState("mostly")
  const [screenBefore, setScreenBefore] = useState(2)
  const [caffeineAfter2, setCaffeineAfter2] = useState("no")
  const [exerciseTiming, setExerciseTiming] = useState("morning")
  const [bedroomEnv, setBedroomEnv] = useState("good")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const scr = clamp(screenBefore, 0, 6)

    // Score components (total 100)
    let score = 0

    // Consistent bedtime (25 pts)
    const bedPoints = consistentBed === "always" ? 25 : consistentBed === "mostly" ? 18 : consistentBed === "sometimes" ? 10 : 3
    score += bedPoints

    // Screen exposure (20 pts) - less is better
    const scrPoints = scr === 0 ? 20 : scr < 0.5 ? 16 : scr < 1 ? 12 : scr < 2 ? 7 : 3
    score += scrPoints

    // Caffeine (20 pts)
    const cafPoints = caffeineAfter2 === "no" ? 20 : caffeineAfter2 === "sometimes" ? 10 : 3
    score += cafPoints

    // Exercise timing (15 pts)
    const exPoints = exerciseTiming === "morning" ? 15 : exerciseTiming === "afternoon" ? 13 : exerciseTiming === "evening" ? 7 : exerciseTiming === "none" ? 4 : 4
    score += exPoints

    // Bedroom environment (20 pts)
    const envPoints = bedroomEnv === "excellent" ? 20 : bedroomEnv === "good" ? 15 : bedroomEnv === "fair" ? 9 : 3
    score += envPoints

    const hygieneScore = r0(clamp(score, 0, 100))
    const insomniaRisk = r0(clamp(100 - hygieneScore * 0.9 - 5, 5, 85))

    const status: 'good' | 'warning' | 'danger' = hygieneScore > 70 ? "good" : hygieneScore > 45 ? "warning" : "danger"
    const label = hygieneScore > 80 ? "Excellent" : hygieneScore > 65 ? "Good" : hygieneScore > 45 ? "Fair" : "Poor"

    const improvements: string[] = []
    if (bedPoints < 20) improvements.push("Set consistent bedtime (±30 min)")
    if (scrPoints < 12) improvements.push(`Reduce screens before bed (${scr} hrs → <1 hr)`)
    if (cafPoints < 15) improvements.push("Eliminate caffeine after 2 PM")
    if (exPoints < 10) improvements.push("Move exercise to morning/afternoon")
    if (envPoints < 12) improvements.push("Improve bedroom (dark, cool, quiet)")

    setResult({
      primaryMetric: { label: "Sleep Hygiene Score", value: `${hygieneScore}/100`, status, description: `${label} — ${improvements.length === 0 ? "All habits optimal" : improvements.length + " areas to improve"}` },
      healthScore: hygieneScore,
      metrics: [
        { label: "Overall Score", value: hygieneScore, unit: "/100", status },
        { label: "Quality", value: label, status },
        { label: "Consistent Bedtime", value: `${bedPoints}/25`, status: bedPoints > 18 ? "good" : bedPoints > 10 ? "warning" : "danger" },
        { label: "Screen Hygiene", value: `${scrPoints}/20`, status: scrPoints > 14 ? "good" : scrPoints > 8 ? "warning" : "danger" },
        { label: "Caffeine Discipline", value: `${cafPoints}/20`, status: cafPoints > 14 ? "good" : cafPoints > 8 ? "warning" : "danger" },
        { label: "Exercise Timing", value: `${exPoints}/15`, status: exPoints > 10 ? "good" : exPoints > 5 ? "warning" : "danger" },
        { label: "Bedroom Environment", value: `${envPoints}/20`, status: envPoints > 14 ? "good" : envPoints > 8 ? "warning" : "danger" },
        { label: "Insomnia Risk", value: insomniaRisk, unit: "%", status: insomniaRisk < 20 ? "good" : insomniaRisk < 45 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Hygiene Assessment", description: `Score: ${hygieneScore}/100 (${label}). Sleep hygiene is the single most modifiable factor in sleep quality. CBT-I (Cognitive Behavioral Therapy for Insomnia) uses these exact principles and is more effective than sleeping pills long-term.`, priority: "high", category: "Assessment" },
        { title: "Improvement Checklist", description: improvements.length > 0 ? `Priority fixes: ${improvements.join(". ")}. Each improvement adds 5-15% to sleep quality. Most impactful: consistent bedtime (regulates circadian clock) and screen reduction (protects melatonin).` : "Excellent habits! Maintain current routine. Small improvements: meditation, pre-bed stretching, gratitude journal.", priority: "high", category: "Checklist" },
        { title: "Insomnia Prevention", description: `Insomnia risk: ${insomniaRisk}%. ${insomniaRisk > 40 ? "Elevated risk. Focus on stimulus control: bed = sleep only (no phone/TV/work in bed). If not asleep in 20 min, get up, do boring activity, return only when sleepy." : "Low risk with current habits."} Good sleep hygiene reduces insomnia onset by 60%.`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Total": hygieneScore, "Bedtime": `${bedPoints}/25`, "Screen": `${scrPoints}/20`, "Caffeine": `${cafPoints}/20`, "Exercise": `${exPoints}/15`, "Environment": `${envPoints}/20`, "Insomnia Risk": `${insomniaRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-hygiene-score" title="Sleep Hygiene Score"
      description="Evaluate sleep habits and generate behavioral sleep health score. Includes insomnia risk and personalized improvement checklist."
      icon={Moon} calculate={calculate} onClear={() => { setConsistentBed("mostly"); setScreenBefore(2); setCaffeineAfter2("no"); setExerciseTiming("morning"); setBedroomEnv("good"); setResult(null) }}
      values={[consistentBed, screenBefore, caffeineAfter2, exerciseTiming, bedroomEnv]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Hygiene Score" description="Calculate your sleep hygiene score and get improvement tips." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Consistent Bedtime" val={consistentBed} set={setConsistentBed} options={[{ value: "always", label: "Always (±30 min)" }, { value: "mostly", label: "Mostly (±1 hr)" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely" }]} />
          <NumInput label="Screen Before Bed" val={screenBefore} set={setScreenBefore} min={0} max={6} step={0.5} suffix="hours" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Caffeine After 2 PM" val={caffeineAfter2} set={setCaffeineAfter2} options={[{ value: "no", label: "Never" }, { value: "sometimes", label: "Sometimes" }, { value: "yes", label: "Regularly" }]} />
          <SelectInput label="Exercise Timing" val={exerciseTiming} set={setExerciseTiming} options={[{ value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening (within 3hrs of bed)" }, { value: "none", label: "No exercise" }]} />
        </div>
        <SelectInput label="Bedroom Environment" val={bedroomEnv} set={setBedroomEnv} options={[{ value: "excellent", label: "Excellent (dark, cool, quiet)" }, { value: "good", label: "Good (mostly dark, comfortable)" }, { value: "fair", label: "Fair (some light/noise)" }, { value: "poor", label: "Poor (bright, noisy, warm)" }]} />
      </div>} />
  )
}

// ─── 44. Sleep Inertia Calculator ─────────────────────────────────────────────
export function SleepInertiaCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [sleepStage, setSleepStage] = useState("light")
  const [napDur, setNapDur] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(wakeTime)
    const nap = clamp(napDur, 0, 120)

    // Sleep inertia severity depends on sleep stage at awakening
    let inertiaBase = 0, recoverMin = 0, grogginess = ""
    if (sleepStage === "rem") { inertiaBase = 40; recoverMin = 15; grogginess = "Moderate — dream-like confusion" }
    else if (sleepStage === "deep") { inertiaBase = 85; recoverMin = 45; grogginess = "Severe — disorientation, impaired judgment" }
    else if (sleepStage === "light") { inertiaBase = 20; recoverMin = 8; grogginess = "Mild — brief fogginess" }
    else { inertiaBase = 10; recoverMin = 3; grogginess = "Minimal — quick transition" }

    // Nap duration affects inertia (>30 min naps hit deep sleep)
    if (nap > 0) {
      if (nap > 30) { inertiaBase = Math.min(95, inertiaBase + 25); recoverMin += 20 }
      else if (nap > 20) { inertiaBase = Math.min(90, inertiaBase + 10); recoverMin += 5 }
    }

    const inertiaProb = r0(clamp(inertiaBase, 0, 95))
    const alertRecovery = fmtTime(wake + recoverMin)
    const fullRecovery = fmtTime(wake + recoverMin + 30)

    const morningProd = r0(clamp(100 - inertiaProb * 0.7, 10, 95))
    const status: 'good' | 'warning' | 'danger' = inertiaProb < 30 ? "good" : inertiaProb < 60 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Sleep Inertia", value: `${inertiaProb}%`, status, description: `${grogginess} — Recovery in ~${recoverMin} min` },
      healthScore: morningProd,
      metrics: [
        { label: "Inertia Probability", value: inertiaProb, unit: "%", status },
        { label: "Grogginess Level", value: grogginess, status },
        { label: "Wake Stage", value: sleepStage === "deep" ? "Deep (N3)" : sleepStage === "rem" ? "REM" : sleepStage === "light" ? "Light (N1/N2)" : "Drowsy", status: sleepStage === "deep" ? "danger" : sleepStage === "rem" ? "warning" : "good" },
        { label: "Alertness Recovery", value: alertRecovery, unit: `(~${recoverMin} min)`, status: recoverMin < 15 ? "good" : recoverMin < 30 ? "warning" : "danger" },
        { label: "Full Recovery", value: fullRecovery, status: "normal" },
        { label: "Morning Productivity", value: morningProd, unit: "/100", status: morningProd > 70 ? "good" : morningProd > 45 ? "warning" : "danger" },
        { label: "Nap Effect", value: nap > 30 ? "Increased inertia (deep nap)" : nap > 0 ? "Mild increase" : "No nap effect", status: nap > 30 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Sleep Inertia Explained", description: `${inertiaProb}% probability. Sleep inertia = transition period from sleep to full wakefulness. Worst after deep sleep (N3) awakening — can last 30-60 min with impaired decision-making equivalent to legal intoxication. Critical for on-call professionals, pilots, surgeons.`, priority: "high", category: "Science" },
        { title: "Minimizing Grogginess", description: `Stage: ${sleepStage}. ${sleepStage === "deep" ? "Waking from deep sleep is worst. Use sleep cycle alarm (wakes during light sleep). 90-min sleep cycles mean alarms at: 6hr, 7.5hr, or 9hr marks." : "Light sleep awakening is optimal."} Bright light + cold water immediately on waking reduces inertia by 50%.`, priority: "high", category: "Strategy" },
        { title: "Morning Protocol", description: `Alertness by: ${alertRecovery}. Full function: ${fullRecovery}. Protocol: 1) Bright light immediately. 2) Cold water on face/wrists. 3) Move physically (walk, stretch). 4) Delay important decisions for ${recoverMin}+ min. ${nap > 30 ? "Limit naps to 20 min to avoid deep-sleep inertia." : ""}`, priority: "medium", category: "Protocol" }
      ],
      detailedBreakdown: { "Wake": fmtTime(wake), "Stage": sleepStage, "Nap": `${nap} min`, "Inertia": `${inertiaProb}%`, "Recovery": `${recoverMin} min`, "Productivity": morningProd }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-inertia" title="Sleep Inertia Calculator"
      description="Predict wake-up grogginess based on sleep stage. Estimates alertness recovery time and morning productivity index."
      icon={Clock} calculate={calculate} onClear={() => { setWakeTime("07:00"); setSleepStage("light"); setNapDur(0); setResult(null) }}
      values={[wakeTime, sleepStage, napDur]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Inertia Calculator" description="Predict morning grogginess and alertness recovery time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Wake-Up Time" val={wakeTime} set={setWakeTime} />
          <SelectInput label="Sleep Stage at Waking" val={sleepStage} set={setSleepStage} options={[{ value: "drowsy", label: "Drowsy (falling asleep)" }, { value: "light", label: "Light Sleep (N1/N2)" }, { value: "deep", label: "Deep Sleep (N3/SWS)" }, { value: "rem", label: "REM Sleep" }]} />
        </div>
        <NumInput label="Recent Nap Duration" val={napDur} set={setNapDur} min={0} max={120} suffix="min (0 if none)" />
      </div>} />
  )
}

// ─── 45. Lucid Dreaming Probability ───────────────────────────────────────────
export function LucidDreamingCalculator() {
  const [dreamRecall, setDreamRecall] = useState(3)
  const [meditation, setMeditation] = useState("sometimes")
  const [sleepHrs, setSleepHrs] = useState(7.5)
  const [technique, setTechnique] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const recall = clamp(dreamRecall, 0, 7)
    const sleep = clamp(sleepHrs, 3, 14)

    // Base probability from dream recall
    let prob = recall * 5  // 0-35 base

    // Meditation boosts metacognition
    if (meditation === "daily") prob += 20
    else if (meditation === "sometimes") prob += 8
    else if (meditation === "rarely") prob += 3

    // Sleep duration affects REM time
    if (sleep >= 8) prob += 15
    else if (sleep >= 7) prob += 10
    else if (sleep >= 6) prob += 5

    // Technique bonus
    if (technique === "wild") prob += 18
    else if (technique === "mild") prob += 15
    else if (technique === "wbtb") prob += 20
    else if (technique === "reality") prob += 10

    prob = r0(clamp(prob, 2, 85))

    const remAwareness = r0(clamp(recall * 8 + (meditation === "daily" ? 20 : meditation === "sometimes" ? 10 : 0), 0, 100))
    const remPct = sleep >= 8 ? "~25% (optimal)" : sleep >= 7 ? "~20%" : sleep >= 6 ? "~15%" : "<15% (reduced)"

    const status: 'good' | 'warning' | 'danger' = prob > 40 ? "good" : prob > 20 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Lucid Dream Probability", value: `${prob}%`, status, description: `${prob > 50 ? "High likelihood" : prob > 25 ? "Moderate likelihood" : "Low likelihood"} — REM awareness: ${remAwareness}/100` },
      healthScore: remAwareness,
      metrics: [
        { label: "Lucid Probability", value: prob, unit: "%", status },
        { label: "Dream Recall", value: recall, unit: "dreams/week", status: recall >= 4 ? "good" : recall >= 2 ? "warning" : "danger" },
        { label: "REM Awareness Score", value: remAwareness, unit: "/100", status: remAwareness > 60 ? "good" : remAwareness > 30 ? "warning" : "danger" },
        { label: "REM Sleep %", value: remPct, status: sleep >= 7 ? "good" : "warning" },
        { label: "Meditation Effect", value: meditation === "daily" ? "+20%" : meditation === "sometimes" ? "+8%" : meditation === "rarely" ? "+3%" : "None", status: meditation === "daily" ? "good" : "normal" },
        { label: "Technique Bonus", value: technique === "none" ? "None" : technique === "wbtb" ? "+20% (WBTB)" : technique === "wild" ? "+18% (WILD)" : technique === "mild" ? "+15% (MILD)" : "+10%", status: technique !== "none" ? "good" : "normal" },
        { label: "Sleep Duration", value: sleep, unit: "hrs", status: sleep >= 7 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Lucid Dreaming Assessment", description: `${prob}% probability with current practice. Lucid dreaming = awareness that you're dreaming during REM. Benefits: nightmare resolution, creativity, skill rehearsal. ~55% of people have ≥1 lucid dream in life; ~23% have monthly. With practice, frequency increases significantly.`, priority: "high", category: "Assessment" },
        { title: "Boosting Probability", description: `Key factors: 1) Dream journal (current: ${recall}/week — aim 5+). 2) Reality checks 10x/day ("Am I dreaming?"). 3) ${technique === "none" ? "Start MILD technique (Mnemonic Induction): repeat 'Next time I dream, I'll remember I'm dreaming' as you fall asleep." : "Continue " + technique.toUpperCase() + " practice."} 4) WBTB (Wake Back to Bed): wake after 5 hrs, stay up 20-30 min, return to sleep — targets late-night REM.`, priority: "high", category: "Training" },
        { title: "REM Optimization", description: `REM: ${remPct}. REM increases in later sleep cycles (cycles 4-5 have longest REM). Sleep 7.5-9 hrs for maximum REM. ${sleep < 7 ? "Your " + sleep + " hrs cuts REM significantly. " : ""}Meditation (${meditation}) boosts metacognition — the brain region (prefrontal cortex) active in lucid dreaming.`, priority: "medium", category: "REM" }
      ],
      detailedBreakdown: { "Recall": `${recall}/week`, "Meditation": meditation, "Sleep": `${sleep} hrs`, "Technique": technique, "Probability": `${prob}%`, "REM Awareness": remAwareness }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="lucid-dreaming" title="Lucid Dreaming Probability Calculator"
      description="Estimate lucid dreaming likelihood based on dream recall, meditation, sleep duration, and induction techniques."
      icon={Eye} calculate={calculate} onClear={() => { setDreamRecall(3); setMeditation("sometimes"); setSleepHrs(7.5); setTechnique("none"); setResult(null) }}
      values={[dreamRecall, meditation, sleepHrs, technique]} result={result}
      seoContent={<SeoContentGenerator title="Lucid Dreaming Probability" description="Calculate your chances of having a lucid dream." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Dream Recall" val={dreamRecall} set={setDreamRecall} min={0} max={7} suffix="dreams/week" />
          <NumInput label="Sleep Duration" val={sleepHrs} set={setSleepHrs} min={3} max={14} step={0.5} suffix="hours" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Meditation Practice" val={meditation} set={setMeditation} options={[{ value: "daily", label: "Daily" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely" }, { value: "never", label: "Never" }]} />
          <SelectInput label="Induction Technique" val={technique} set={setTechnique} options={[{ value: "none", label: "None" }, { value: "reality", label: "Reality Checks" }, { value: "mild", label: "MILD" }, { value: "wild", label: "WILD" }, { value: "wbtb", label: "WBTB" }]} />
        </div>
      </div>} />
  )
}

// ─── 46. Dream Recall Frequency Tracker ───────────────────────────────────────
export function DreamRecallTracker() {
  const [recallWeek, setRecallWeek] = useState(3)
  const [sleepQuality, setSleepQuality] = useState("good")
  const [journaling, setJournaling] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const recall = clamp(recallWeek, 0, 14)

    // Recall frequency score
    let recallScore = r0(clamp(recall * 10, 0, 100))
    if (journaling === "yes") recallScore = Math.min(100, recallScore + 15)

    // REM engagement index
    const qualityBonus = sleepQuality === "excellent" ? 20 : sleepQuality === "good" ? 12 : sleepQuality === "fair" ? 5 : 0
    const remEngagement = r0(clamp(recall * 8 + qualityBonus, 0, 100))

    // Memory consolidation correlation
    const memoryCon = r0(clamp(remEngagement * 0.7 + (sleepQuality === "excellent" ? 15 : sleepQuality === "good" ? 10 : 0), 0, 100))

    const status: 'good' | 'warning' | 'danger' = recallScore > 60 ? "good" : recallScore > 30 ? "warning" : "danger"
    const label = recall >= 5 ? "High Recall" : recall >= 3 ? "Moderate Recall" : recall >= 1 ? "Low Recall" : "No Recall"

    setResult({
      primaryMetric: { label: "Dream Recall Score", value: `${recallScore}/100`, status, description: `${label} — ${recall} dreams/week recalled` },
      healthScore: recallScore,
      metrics: [
        { label: "Recall Score", value: recallScore, unit: "/100", status },
        { label: "Dreams Recalled", value: recall, unit: "/week", status: recall >= 4 ? "good" : recall >= 2 ? "warning" : "danger" },
        { label: "Recall Category", value: label, status },
        { label: "REM Engagement", value: remEngagement, unit: "/100", status: remEngagement > 60 ? "good" : remEngagement > 30 ? "warning" : "danger" },
        { label: "Memory Consolidation", value: memoryCon, unit: "/100", status: memoryCon > 60 ? "good" : memoryCon > 35 ? "warning" : "danger" },
        { label: "Sleep Quality", value: sleepQuality.charAt(0).toUpperCase() + sleepQuality.slice(1), status: sleepQuality === "excellent" || sleepQuality === "good" ? "good" : sleepQuality === "fair" ? "warning" : "danger" },
        { label: "Dream Journal", value: journaling === "yes" ? "Active (+15%)" : "Inactive", status: journaling === "yes" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Dream Recall Analysis", description: `${recall} dreams/week (${label}). Average adults recall 1-2 dreams/week. High recallers (5+) have more REM sleep and stronger prefrontal cortex activity. Dream recall is a trainable skill — improves 300% within 2 weeks of journaling.`, priority: "high", category: "Analysis" },
        { title: "Improving Recall", description: `${journaling === "yes" ? "Journal active — great! " : "Start dream journal: write immediately on waking, even fragments. "}Tips: 1) Don't move on waking — lie still, reconstruct dream. 2) Set intention before sleep ("I will remember my dreams"). 3) Avoid alarm snooze (destroys REM memory). 4) No alcohol (suppresses REM).`, priority: "high", category: "Improvement" },
        { title: "REM & Memory", description: `REM engagement: ${remEngagement}/100. Memory consolidation: ${memoryCon}/100. REM sleep reorganizes memories, processes emotions, and boosts creativity. Higher dream recall correlates with better episodic memory, creativity, and emotional intelligence. ${sleepQuality === "poor" ? "Improve sleep quality first — poor sleep reduces REM time." : ""}`, priority: "medium", category: "Memory" }
      ],
      detailedBreakdown: { "Recall": `${recall}/week`, "Score": recallScore, "Quality": sleepQuality, "Journal": journaling, "REM": remEngagement, "Memory": memoryCon }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="dream-recall" title="Dream Recall Frequency Tracker"
      description="Track dream recall ability and REM sleep engagement. Includes memory consolidation correlation and improvement strategies."
      icon={Eye} calculate={calculate} onClear={() => { setRecallWeek(3); setSleepQuality("good"); setJournaling("no"); setResult(null) }}
      values={[recallWeek, sleepQuality, journaling]} result={result}
      seoContent={<SeoContentGenerator title="Dream Recall Tracker" description="Track dream recall frequency and REM engagement." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Dreams Recalled" val={recallWeek} set={setRecallWeek} min={0} max={14} suffix="per week" />
          <SelectInput label="Sleep Quality" val={sleepQuality} set={setSleepQuality} options={[{ value: "excellent", label: "Excellent" }, { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" }]} />
        </div>
        <SelectInput label="Dream Journal" val={journaling} set={setJournaling} options={[{ value: "yes", label: "Yes — I keep one" }, { value: "no", label: "No" }]} />
      </div>} />
  )
}

// ─── 47. Sleepwalking Risk Calculator ─────────────────────────────────────────
export function SleepwalkingRiskCalculator() {
  const [familyHistory, setFamilyHistory] = useState("no")
  const [sleepDeprivation, setSleepDeprivation] = useState("mild")
  const [stressLevel, setStressLevel] = useState(5)
  const [alcohol, setAlcohol] = useState("none")
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const stress = clamp(stressLevel, 1, 10)
    const a = clamp(age, 3, 80)

    let risk = 5  // base

    // Family history is strongest predictor (10x increase with both parents)
    if (familyHistory === "both") risk += 40
    else if (familyHistory === "one") risk += 20
    else risk += 0

    // Sleep deprivation triggers deep sleep rebound
    if (sleepDeprivation === "severe") risk += 20
    else if (sleepDeprivation === "moderate") risk += 12
    else if (sleepDeprivation === "mild") risk += 5

    // Stress and alcohol
    risk += stress * 2
    if (alcohol === "heavy") risk += 15
    else if (alcohol === "moderate") risk += 8
    else if (alcohol === "light") risk += 3

    // Age factor (peaks 3-12 years)
    if (a < 12) risk += 15
    else if (a < 18) risk += 8
    else if (a > 60) risk += 5

    risk = r0(clamp(risk, 2, 90))

    const parasomnia = risk > 50 ? "High" : risk > 25 ? "Moderate" : "Low"
    const injuryRisk = risk > 40 ? "Elevated — safety measures needed" : risk > 20 ? "Mild — basic precautions" : "Low"
    const status: 'good' | 'warning' | 'danger' = risk < 20 ? "good" : risk < 45 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Sleepwalking Risk", value: `${risk}%`, status, description: `${parasomnia} parasomnia risk — ${familyHistory !== "no" ? "Family history present" : "No family history"}` },
      healthScore: Math.max(0, r0(100 - risk)),
      metrics: [
        { label: "Risk Score", value: risk, unit: "%", status },
        { label: "Risk Level", value: parasomnia, status },
        { label: "Family History", value: familyHistory === "both" ? "Both parents" : familyHistory === "one" ? "One parent" : "None", status: familyHistory !== "no" ? "danger" : "good" },
        { label: "Sleep Deprivation", value: sleepDeprivation.charAt(0).toUpperCase() + sleepDeprivation.slice(1), status: sleepDeprivation === "severe" ? "danger" : sleepDeprivation === "moderate" ? "warning" : "good" },
        { label: "Stress Level", value: stress, unit: "/10", status: stress > 7 ? "danger" : stress > 4 ? "warning" : "good" },
        { label: "Alcohol", value: alcohol.charAt(0).toUpperCase() + alcohol.slice(1), status: alcohol === "heavy" ? "danger" : alcohol === "moderate" ? "warning" : "good" },
        { label: "Parasomnia Class", value: parasomnia, status },
        { label: "Injury Risk", value: injuryRisk, status: injuryRisk.startsWith("Elevated") ? "danger" : injuryRisk.startsWith("Mild") ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleepwalking Assessment", description: `Risk: ${risk}% (${parasomnia}). Somnambulism occurs during deep NREM sleep (N3), typically first 1-3 hrs of night. Prevalence: 1-15% of population, peaks age 8-12. ${familyHistory !== "no" ? "Family history is strongest risk factor — 45% concordance in first-degree relatives, 60-80% if both parents affected." : "No family history reduces risk significantly."}`, priority: "high", category: "Assessment" },
        { title: "Trigger Reduction", description: `Key triggers: ${sleepDeprivation !== "none" ? "sleep deprivation (yours: " + sleepDeprivation + "), " : ""}${stress > 5 ? "high stress (" + stress + "/10), " : ""}${alcohol !== "none" ? "alcohol (" + alcohol + "), " : ""}fever, certain medications (zolpidem, lithium). Reduce triggers: get adequate sleep, manage stress, limit alcohol, maintain consistent schedule.`, priority: "high", category: "Prevention" },
        { title: "Safety Measures", description: `Injury risk: ${injuryRisk}. ${risk > 30 ? "Safety protocol: lock doors/windows, gate stairs, remove sharp objects, sleep on ground floor if possible. Bed alarms available. Do NOT try to wake sleepwalker — gently guide back to bed." : "Basic awareness sufficient."} If episodes are frequent/violent → consult sleep specialist. Treatment: scheduled awakening, hypnosis, clonazepam.`, priority: "medium", category: "Safety" }
      ],
      detailedBreakdown: { "Risk": `${risk}%`, "Family": familyHistory, "Deprivation": sleepDeprivation, "Stress": `${stress}/10`, "Alcohol": alcohol, "Age": a, "Parasomnia": parasomnia }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-walking" title="Sleepwalking Risk Calculator"
      description="Estimate somnambulism probability from genetics, sleep deprivation, stress, and lifestyle. Includes parasomnia classification and injury risk."
      icon={AlertCircle} calculate={calculate} onClear={() => { setFamilyHistory("no"); setSleepDeprivation("mild"); setStressLevel(5); setAlcohol("none"); setAge(30); setResult(null) }}
      values={[familyHistory, sleepDeprivation, stressLevel, alcohol, age]} result={result}
      seoContent={<SeoContentGenerator title="Sleepwalking Risk Calculator" description="Assess sleepwalking risk and parasomnia probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Family History" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No family history" }, { value: "one", label: "One parent" }, { value: "both", label: "Both parents" }]} />
          <SelectInput label="Sleep Deprivation" val={sleepDeprivation} set={setSleepDeprivation} options={[{ value: "none", label: "None (7+ hrs)" }, { value: "mild", label: "Mild (6-7 hrs)" }, { value: "moderate", label: "Moderate (4-6 hrs)" }, { value: "severe", label: "Severe (<4 hrs)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="1-10" />
          <SelectInput label="Alcohol Use" val={alcohol} set={setAlcohol} options={[{ value: "none", label: "None" }, { value: "light", label: "Light (1-2 drinks)" }, { value: "moderate", label: "Moderate (3-4)" }, { value: "heavy", label: "Heavy (5+)" }]} />
        </div>
        <NumInput label="Age" val={age} set={setAge} min={3} max={80} suffix="years" />
      </div>} />
  )
}

// ─── 48. Sleep Talking Risk Calculator ────────────────────────────────────────
export function SleepTalkingRiskCalculator() {
  const [stressLevel, setStressLevel] = useState(5)
  const [sleepDeprivation, setSleepDeprivation] = useState("mild")
  const [familyHistory, setFamilyHistory] = useState("no")
  const [fever, setFever] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const stress = clamp(stressLevel, 1, 10)

    let risk = 8  // base (somniloquy is very common)

    if (familyHistory === "yes") risk += 20
    if (sleepDeprivation === "severe") risk += 18
    else if (sleepDeprivation === "moderate") risk += 12
    else if (sleepDeprivation === "mild") risk += 5

    risk += stress * 2.5
    if (fever === "yes") risk += 15

    risk = r0(clamp(risk, 5, 85))

    const parasomnia = r0(clamp(risk * 0.7 + (familyHistory === "yes" ? 10 : 0), 0, 80))
    const status: 'good' | 'warning' | 'danger' = risk < 25 ? "good" : risk < 50 ? "warning" : "danger"
    const label = risk > 50 ? "High" : risk > 25 ? "Moderate" : "Low"

    const contentRisk = stress > 7 ? "May include distressing content" : "Usually meaningless/bland"

    setResult({
      primaryMetric: { label: "Sleep Talking Risk", value: `${risk}%`, status, description: `${label} probability — Somniloquy is usually harmless` },
      healthScore: Math.max(0, r0(100 - risk)),
      metrics: [
        { label: "Risk Score", value: risk, unit: "%", status },
        { label: "Risk Level", value: label, status },
        { label: "Parasomnia Score", value: parasomnia, unit: "/100", status: parasomnia > 50 ? "danger" : parasomnia > 25 ? "warning" : "good" },
        { label: "Stress", value: stress, unit: "/10", status: stress > 7 ? "danger" : stress > 4 ? "warning" : "good" },
        { label: "Sleep Deprivation", value: sleepDeprivation.charAt(0).toUpperCase() + sleepDeprivation.slice(1), status: sleepDeprivation === "severe" ? "danger" : sleepDeprivation === "moderate" ? "warning" : "good" },
        { label: "Family History", value: familyHistory === "yes" ? "Present" : "Absent", status: familyHistory === "yes" ? "warning" : "good" },
        { label: "Fever", value: fever === "yes" ? "Yes (+15%)" : "No", status: fever === "yes" ? "warning" : "good" },
        { label: "Content", value: contentRisk, status: stress > 7 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleep Talking Overview", description: `Risk: ${risk}% (${label}). Somniloquy affects ~66% of people at some point. Can occur in ANY sleep stage (NREM or REM). In NREM: mumbling, nonsensical. In REM: clearer speech, may relate to dream content. Usually benign — no treatment needed unless disrupting partner.`, priority: "high", category: "Overview" },
        { title: "Trigger Management", description: `Triggers: ${stress > 5 ? "high stress (" + stress + "/10), " : ""}${sleepDeprivation !== "none" ? "sleep deprivation, " : ""}${fever === "yes" ? "fever, " : ""}alcohol, heavy meals. Reduce by: managing stress, adequate sleep, limiting evening stimulants. If co-occurring with sleepwalking or violent behavior → seek evaluation.`, priority: "high", category: "Triggers" },
        { title: "When to Worry", description: `Somniloquy alone is harmless. Concern if: 1) Starts suddenly in adulthood (rule out REM behavior disorder). 2) Accompanied by screaming (night terrors). 3) Acting out dreams (RBD — associated with neurodegenerative disease in 50+ age). 4) Causing significant partner disturbance → white noise, separate rooms temporarily.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Risk": `${risk}%`, "Stress": `${stress}/10`, "Deprivation": sleepDeprivation, "Family": familyHistory, "Fever": fever, "Parasomnia": parasomnia }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-talking" title="Sleep Talking Risk Calculator"
      description="Assess somniloquy probability from stress, sleep deprivation, genetics, and health factors. Includes parasomnia susceptibility score."
      icon={Wind} calculate={calculate} onClear={() => { setStressLevel(5); setSleepDeprivation("mild"); setFamilyHistory("no"); setFever("no"); setResult(null) }}
      values={[stressLevel, sleepDeprivation, familyHistory, fever]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Talking Risk Calculator" description="Calculate sleep talking probability and parasomnia risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="1-10" />
          <SelectInput label="Sleep Deprivation" val={sleepDeprivation} set={setSleepDeprivation} options={[{ value: "none", label: "None (7+ hrs)" }, { value: "mild", label: "Mild (6-7 hrs)" }, { value: "moderate", label: "Moderate (4-6 hrs)" }, { value: "severe", label: "Severe (<4 hrs)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Family History" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Current Fever/Illness" val={fever} set={setFever} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 49. Sleep Paralysis Risk Calculator ──────────────────────────────────────
export function SleepParalysisRiskCalculator() {
  const [sleepDeprivation, setSleepDeprivation] = useState("mild")
  const [irregularSchedule, setIrregularSchedule] = useState("sometimes")
  const [stressLevel, setStressLevel] = useState(5)
  const [narcolepsy, setNarcolepsy] = useState("no")
  const [supinePosition, setSupinePosition] = useState("sometimes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const stress = clamp(stressLevel, 1, 10)

    let risk = 5  // base (8% lifetime prevalence)

    // Narcolepsy is strongest predictor
    if (narcolepsy === "yes") risk += 40
    else if (narcolepsy === "suspected") risk += 20

    // Sleep deprivation triggers REM intrusion
    if (sleepDeprivation === "severe") risk += 22
    else if (sleepDeprivation === "moderate") risk += 14
    else if (sleepDeprivation === "mild") risk += 6

    // Irregular schedule disrupts REM timing
    if (irregularSchedule === "always") risk += 15
    else if (irregularSchedule === "often") risk += 10
    else if (irregularSchedule === "sometimes") risk += 5

    risk += stress * 2

    // Supine sleeping increases risk significantly
    if (supinePosition === "always") risk += 12
    else if (supinePosition === "sometimes") risk += 5

    risk = r0(clamp(risk, 3, 90))

    const remIntrusion = r0(clamp(risk * 0.8 + (narcolepsy !== "no" ? 15 : 0), 0, 95))
    const anxietyCorrelation = r0(clamp(stress * 8 + (risk > 40 ? 15 : 0), 0, 90))

    const status: 'good' | 'warning' | 'danger' = risk < 20 ? "good" : risk < 45 ? "warning" : "danger"
    const label = risk > 50 ? "High Risk" : risk > 25 ? "Moderate Risk" : "Low Risk"

    const hallucRisk = risk > 30 ? "Likely — hypnagogic/hypnopompic hallucinations" : "Possible but less likely"

    setResult({
      primaryMetric: { label: "Sleep Paralysis Risk", value: `${risk}%`, status, description: `${label} — ${narcolepsy !== "no" ? "Narcolepsy history elevates risk significantly" : "REM intrusion based on lifestyle factors"}` },
      healthScore: Math.max(0, r0(100 - risk)),
      metrics: [
        { label: "Risk Score", value: risk, unit: "%", status },
        { label: "Risk Level", value: label, status },
        { label: "REM Intrusion Likelihood", value: remIntrusion, unit: "%", status: remIntrusion < 25 ? "good" : remIntrusion < 55 ? "warning" : "danger" },
        { label: "Anxiety Correlation", value: anxietyCorrelation, unit: "%", status: anxietyCorrelation < 30 ? "good" : anxietyCorrelation < 60 ? "warning" : "danger" },
        { label: "Hallucination Risk", value: hallucRisk, status: risk > 30 ? "warning" : "good" },
        { label: "Sleep Deprivation", value: sleepDeprivation.charAt(0).toUpperCase() + sleepDeprivation.slice(1), status: sleepDeprivation === "severe" ? "danger" : sleepDeprivation === "moderate" ? "warning" : "good" },
        { label: "Schedule Regularity", value: irregularSchedule.charAt(0).toUpperCase() + irregularSchedule.slice(1), status: irregularSchedule === "always" ? "danger" : irregularSchedule === "often" ? "warning" : "good" },
        { label: "Supine Sleep", value: supinePosition.charAt(0).toUpperCase() + supinePosition.slice(1), status: supinePosition === "always" ? "warning" : "good" },
        { label: "Narcolepsy", value: narcolepsy === "yes" ? "Diagnosed" : narcolepsy === "suspected" ? "Suspected" : "No", status: narcolepsy === "yes" ? "danger" : narcolepsy === "suspected" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleep Paralysis Explained", description: `Risk: ${risk}% (${label}). Sleep paralysis = conscious awareness during REM atonia (muscle paralysis). Brain is awake but body is still in REM state. Affects ~8% lifetime prevalence, 28% in students. Not dangerous but extremely frightening. Episodes last 30s-3 min.`, priority: "high", category: "Education" },
        { title: "Reducing Risk", description: `Key targets: ${sleepDeprivation !== "none" ? "1) Get adequate sleep (yours: " + sleepDeprivation + " deprivation). " : ""}${irregularSchedule !== "rarely" && irregularSchedule !== "never" ? "2) Regularize schedule. " : ""}${supinePosition !== "never" ? "3) Avoid sleeping on back (supine position increases episodes 2-4x). " : ""}${stress > 5 ? "4) Manage stress (" + stress + "/10). " : ""}Most effective: consistent sleep schedule + adequate sleep duration.`, priority: "high", category: "Prevention" },
        { title: "During an Episode", description: `If paralysis occurs: 1) Don't panic — it's harmless and temporary. 2) Focus on moving one small body part (toes, fingers). 3) Control breathing (slow, deep). 4) Don't fight it — resistance increases fear. 5) Some find eye movement helps break atonia. ${narcolepsy !== "no" ? "With narcolepsy: discuss with neurologist — SSRIs can reduce frequency." : ""} CBT reduces episode frequency and fear.`, priority: "medium", category: "Coping" }
      ],
      detailedBreakdown: { "Risk": `${risk}%`, "REM Intrusion": `${remIntrusion}%`, "Anxiety": `${anxietyCorrelation}%`, "Deprivation": sleepDeprivation, "Schedule": irregularSchedule, "Stress": `${stress}/10`, "Narcolepsy": narcolepsy, "Supine": supinePosition }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-paralysis" title="Sleep Paralysis Risk Calculator"
      description="Estimate sleep paralysis risk from deprivation, schedule irregularity, stress, and narcolepsy history. Includes REM intrusion likelihood and coping strategies."
      icon={AlertCircle} calculate={calculate} onClear={() => { setSleepDeprivation("mild"); setIrregularSchedule("sometimes"); setStressLevel(5); setNarcolepsy("no"); setSupinePosition("sometimes"); setResult(null) }}
      values={[sleepDeprivation, irregularSchedule, stressLevel, narcolepsy, supinePosition]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Paralysis Risk Calculator" description="Assess sleep paralysis risk and REM intrusion likelihood." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Sleep Deprivation" val={sleepDeprivation} set={setSleepDeprivation} options={[{ value: "none", label: "None (7+ hrs)" }, { value: "mild", label: "Mild (6-7 hrs)" }, { value: "moderate", label: "Moderate (4-6 hrs)" }, { value: "severe", label: "Severe (<4 hrs)" }]} />
          <SelectInput label="Irregular Schedule" val={irregularSchedule} set={setIrregularSchedule} options={[{ value: "never", label: "Never (very consistent)" }, { value: "rarely", label: "Rarely" }, { value: "sometimes", label: "Sometimes" }, { value: "often", label: "Often" }, { value: "always", label: "Always (shift work/variable)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="1-10" />
          <SelectInput label="Narcolepsy" val={narcolepsy} set={setNarcolepsy} options={[{ value: "no", label: "No" }, { value: "suspected", label: "Suspected" }, { value: "yes", label: "Diagnosed" }]} />
        </div>
        <SelectInput label="Sleep on Back (Supine)" val={supinePosition} set={setSupinePosition} options={[{ value: "never", label: "Never" }, { value: "sometimes", label: "Sometimes" }, { value: "always", label: "Always/mostly" }]} />
      </div>} />
  )
}
