"use client"

import { useState } from "react"
import { Moon, Clock, Activity, Brain, Heart, Shield, Award, Droplets, AlertCircle, Sun } from "lucide-react"
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

function DateInput({ label, val, set }: { label: string; val: string; set: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input type="date" value={val} onChange={e => set(e.target.value)}
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

// ─── 14. Nicotine Sleep Impact Calculator ────────────────────────────────────
export function NicotineSleepImpactCalculator() {
  const [cigarettes, setCigarettes] = useState(10)
  const [lastIntake, setLastIntake] = useState("21:00")
  const [weight, setWeight] = useState(70)
  const [bedtime, setBedtime] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cigs = clamp(cigarettes, 1, 60)
    const w = clamp(weight, 30, 200)
    const last = timeToMin(lastIntake)
    const bed = timeToMin(bedtime)

    let hoursToBed = (bed - last) / 60
    if (hoursToBed <= 0) hoursToBed += 24

    // Nicotine per cigarette ~1-2mg absorbed, half-life ~2 hrs
    const nicPerCig = 1.5
    const totalNicDaily = r1(cigs * nicPerCig)
    const lastDoseNic = nicPerCig
    const halfLife = 2
    const halvings = hoursToBed / halfLife
    const remainingMg = r2(lastDoseNic * Math.pow(0.5, halvings))

    // Cotinine (metabolite) half-life ~16 hrs — lingers
    const cotinineLevel = r1(totalNicDaily * 0.7)

    // Sleep onset delay: nicotine is a stimulant
    const sleepOnsetDelay = r0(clamp(remainingMg * 15 + (cigs > 15 ? 10 : 0), 0, 60))

    // REM suppression
    const remSuppression = r0(clamp(cigs * 2.5 + remainingMg * 10, 0, 70))

    // Night awakening risk
    const awakeningRisk = r0(clamp(cigs * 3 + (hoursToBed < 2 ? 25 : hoursToBed < 4 ? 10 : 0), 0, 90))

    // Withdrawal micro-arousals (heavy smokers wake for nicotine)
    const withdrawalArousals = cigs > 20 ? "High" : cigs > 10 ? "Moderate" : "Low"

    const sleepQuality = Math.max(0, r0(100 - remSuppression * 0.5 - awakeningRisk * 0.3 - sleepOnsetDelay * 0.5))
    const status: 'good' | 'warning' | 'danger' = sleepQuality > 70 ? "good" : sleepQuality > 45 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Sleep Quality Impact", value: `${sleepQuality}/100`, status, description: `${cigs} cigs/day — ${remainingMg}mg nicotine at bedtime — ${remSuppression}% REM suppression` },
      healthScore: sleepQuality,
      metrics: [
        { label: "Cigarettes/Day", value: cigs, status: cigs <= 5 ? "warning" : "danger" },
        { label: "Daily Nicotine", value: totalNicDaily, unit: "mg", status: "normal" },
        { label: "Remaining at Bedtime", value: remainingMg, unit: "mg", status: remainingMg < 0.2 ? "good" : remainingMg < 0.5 ? "warning" : "danger" },
        { label: "Hours Since Last Cig", value: r1(hoursToBed), unit: "hrs", status: hoursToBed >= 4 ? "good" : hoursToBed >= 2 ? "warning" : "danger" },
        { label: "Sleep Onset Delay", value: `+${sleepOnsetDelay}`, unit: "min", status: sleepOnsetDelay < 10 ? "good" : sleepOnsetDelay < 25 ? "warning" : "danger" },
        { label: "REM Suppression", value: remSuppression, unit: "%", status: remSuppression < 15 ? "good" : remSuppression < 35 ? "warning" : "danger" },
        { label: "Night Awakening Risk", value: awakeningRisk, unit: "%", status: awakeningRisk < 20 ? "good" : awakeningRisk < 50 ? "warning" : "danger" },
        { label: "Withdrawal Arousals", value: withdrawalArousals, status: withdrawalArousals === "Low" ? "good" : withdrawalArousals === "Moderate" ? "warning" : "danger" },
        { label: "Cotinine Level", value: cotinineLevel, unit: "mg (est.)", status: "warning" }
      ],
      recommendations: [
        { title: "Nicotine & Sleep", description: `${cigs} cigarettes/day delivers ~${totalNicDaily}mg nicotine. Nicotine is a stimulant (half-life ~2 hrs) that delays sleep onset by ${sleepOnsetDelay} min and suppresses REM by ${remSuppression}%. Smokers spend 20% less time in deep sleep than non-smokers. Cotinine (metabolite, half-life 16 hrs) keeps the body in mild stimulation.`, priority: "high", category: "Impact" },
        { title: "Timing Strategy", description: `Last cigarette was ${r1(hoursToBed)} hrs before bed (${remainingMg}mg remaining). Ideal: stop nicotine 4+ hrs before bed. Even NRT patches can disrupt sleep — consider removing before bed. ${hoursToBed < 2 ? "CRITICAL: Smoking within 2 hrs of bed nearly doubles sleep onset time." : ""}`, priority: "high", category: "Timing" },
        { title: "Cessation & Sleep", description: `Sleep temporarily worsens during first 1-3 weeks of quitting (withdrawal insomnia), then dramatically improves. After 2 weeks smoke-free: sleep latency −50%, awakenings −40%, total sleep +30 min. Nicotine replacement therapy helps manage withdrawal without cigarette toxins.`, priority: "medium", category: "Cessation" }
      ],
      detailedBreakdown: { "Cigarettes": cigs, "Nicotine/day": `${totalNicDaily}mg`, "Last Cig": fmtTime(last), "At Bedtime": `${remainingMg}mg`, "Onset Delay": `+${sleepOnsetDelay}min`, "REM Suppress": `${remSuppression}%`, "Awakening %": awakeningRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="nicotine-sleep-impact" title="Nicotine Sleep Impact Calculator"
      description="Estimate how nicotine/smoking affects sleep architecture. Calculates remaining nicotine at bedtime, REM suppression, night awakening risk, and withdrawal arousal probability."
      icon={Moon} calculate={calculate} onClear={() => { setCigarettes(10); setLastIntake("21:00"); setWeight(70); setBedtime("23:00"); setResult(null) }}
      values={[cigarettes, lastIntake, weight, bedtime]} result={result}
      seoContent={<SeoContentGenerator title="Nicotine Sleep Impact Calculator" description="Calculate nicotine impact on sleep quality." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cigarettes Per Day" val={cigarettes} set={setCigarettes} min={1} max={60} suffix="cigs/day" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Last Nicotine Intake" val={lastIntake} set={setLastIntake} />
          <TimeInput label="Planned Bedtime" val={bedtime} set={setBedtime} />
        </div>
      </div>} />
  )
}

// ─── 15. Daily Habit Score (Lifestyle Compliance Index) ──────────────────────
export function DailyHabitScoreCalculator() {
  const [sleepHrs, setSleepHrs] = useState(7)
  const [exerciseMin, setExerciseMin] = useState(30)
  const [waterL, setWaterL] = useState(2)
  const [screenHrs, setScreenHrs] = useState(6)
  const [nutritionScore, setNutritionScore] = useState(6)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sleep = clamp(sleepHrs, 0, 16)
    const exercise = clamp(exerciseMin, 0, 300)
    const water = clamp(waterL, 0, 10)
    const screen = clamp(screenHrs, 0, 18)
    const nutrition = clamp(nutritionScore, 1, 10)

    // Scoring each habit (0-20 each, total 100)
    const sleepScore = sleep >= 7 && sleep <= 9 ? 20 : sleep >= 6 ? 14 : sleep >= 5 ? 8 : 3
    const exerciseScore = exercise >= 30 ? 20 : exercise >= 15 ? 14 : exercise > 0 ? 8 : 0
    const waterScore = water >= 2.5 ? 20 : water >= 2 ? 16 : water >= 1.5 ? 10 : water >= 1 ? 6 : 2
    const screenScore = screen <= 4 ? 20 : screen <= 6 ? 14 : screen <= 8 ? 8 : 3
    const nutritionScoreCalc = r0(nutrition * 2)

    const habitScore = r0(sleepScore + exerciseScore + waterScore + screenScore + nutritionScoreCalc)

    const consistencyIndex = habitScore >= 80 ? "Excellent" : habitScore >= 60 ? "Good" : habitScore >= 40 ? "Fair" : "Poor"
    const burnoutProb = r0(clamp(100 - habitScore - (exercise > 0 ? 10 : 0) + (screen > 8 ? 15 : 0), 0, 100))

    let status: 'good' | 'warning' | 'danger' = habitScore >= 70 ? "good" : habitScore >= 45 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Daily Habit Score", value: `${habitScore}/100`, status, description: `${consistencyIndex} lifestyle compliance — Burnout risk: ${burnoutProb}%` },
      healthScore: habitScore,
      metrics: [
        { label: "Overall Habit Score", value: habitScore, unit: "/100", status },
        { label: "Sleep Score", value: sleepScore, unit: "/20", status: sleepScore >= 16 ? "good" : sleepScore >= 10 ? "warning" : "danger" },
        { label: "Exercise Score", value: exerciseScore, unit: "/20", status: exerciseScore >= 16 ? "good" : exerciseScore >= 8 ? "warning" : "danger" },
        { label: "Hydration Score", value: waterScore, unit: "/20", status: waterScore >= 16 ? "good" : waterScore >= 10 ? "warning" : "danger" },
        { label: "Screen Time Score", value: screenScore, unit: "/20", status: screenScore >= 14 ? "good" : screenScore >= 8 ? "warning" : "danger" },
        { label: "Nutrition Score", value: nutritionScoreCalc, unit: "/20", status: nutritionScoreCalc >= 14 ? "good" : nutritionScoreCalc >= 10 ? "warning" : "danger" },
        { label: "Consistency Index", value: consistencyIndex, status: consistencyIndex === "Excellent" ? "good" : consistencyIndex === "Good" ? "good" : "warning" },
        { label: "Burnout Probability", value: burnoutProb, unit: "%", status: burnoutProb < 25 ? "good" : burnoutProb < 50 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Habit Score Breakdown", description: `Score ${habitScore}/100. Weakest areas: ${sleepScore < 14 ? "Sleep (" + sleepScore + "/20) — " : ""}${exerciseScore < 14 ? "Exercise (" + exerciseScore + "/20) — " : ""}${waterScore < 14 ? "Hydration (" + waterScore + "/20) — " : ""}${screenScore < 14 ? "Screen Time (" + screenScore + "/20) — " : ""}${nutritionScoreCalc < 14 ? "Nutrition (" + nutritionScoreCalc + "/20)" : ""}. Focus on improving your lowest-scoring habit first.`, priority: "high", category: "Analysis" },
        { title: "Habit Stacking", description: "Build new habits by stacking them onto existing routines. After brushing teeth → drink water. After lunch → 10 min walk. After dinner → no screens. Research shows it takes 66 days on average to form a habit. Start with one change at a time.", priority: "high", category: "Strategy" },
        { title: "Weekly Tracking", description: `Track this score daily for 7 days. Consistency matters more than perfection. Aim for 70+ score 5 days/week. ${burnoutProb > 40 ? "High burnout risk detected — prioritize recovery days and sleep." : "Maintain your routine and gradually increase exercise and nutrition quality."}`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Sleep": `${sleep} hrs (${sleepScore}/20)`, "Exercise": `${exercise} min (${exerciseScore}/20)`, "Water": `${water}L (${waterScore}/20)`, "Screen": `${screen} hrs (${screenScore}/20)`, "Nutrition": `${nutritionScore}/10 (${nutritionScoreCalc}/20)`, "Total": `${habitScore}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="daily-habit-score" title="Daily Habit Score — Lifestyle Compliance Index"
      description="Generate a composite daily health score from sleep, exercise, hydration, screen time, and nutrition. Track lifestyle compliance and burnout risk."
      icon={Award} calculate={calculate} onClear={() => { setSleepHrs(7); setExerciseMin(30); setWaterL(2); setScreenHrs(6); setNutritionScore(6); setResult(null) }}
      values={[sleepHrs, exerciseMin, waterL, screenHrs, nutritionScore]} result={result}
      seoContent={<SeoContentGenerator title="Daily Habit Score Calculator" description="Calculate daily healthy habit compliance score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Hours" val={sleepHrs} set={setSleepHrs} min={0} max={16} step={0.5} suffix="hrs/night" />
          <NumInput label="Exercise Duration" val={exerciseMin} set={setExerciseMin} min={0} max={300} suffix="min/day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Water Intake" val={waterL} set={setWaterL} min={0} max={10} step={0.25} suffix="liters" />
          <NumInput label="Screen Time" val={screenHrs} set={setScreenHrs} min={0} max={18} step={0.5} suffix="hrs/day" />
        </div>
        <NumInput label="Nutrition Quality" val={nutritionScore} set={setNutritionScore} min={1} max={10} suffix="1-10 self-rated" />
      </div>} />
  )
}

// ─── 16. Mindfulness Score Calculator (Mental Balance Index) ─────────────────
export function MindfulnessScoreCalculator() {
  const [meditationMin, setMeditationMin] = useState(10)
  const [stressRating, setStressRating] = useState(5)
  const [sleepQuality, setSleepQuality] = useState(6)
  const [breathingMin, setBreathingMin] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const medMin = clamp(meditationMin, 0, 120)
    const stress = clamp(stressRating, 1, 10)
    const sleepQ = clamp(sleepQuality, 1, 10)
    const breathMin = clamp(breathingMin, 0, 60)

    // Mindfulness score components
    const medScore = Math.min(30, medMin >= 20 ? 30 : medMin >= 10 ? 22 : medMin >= 5 ? 15 : medMin > 0 ? 8 : 0)
    const stressScore = r0((10 - stress) * 3) // low stress = high score
    const sleepScore = r0(sleepQ * 2)
    const breathScore = Math.min(20, breathMin >= 10 ? 20 : breathMin >= 5 ? 14 : breathMin > 0 ? 8 : 0)

    const mindScore = r0(clamp(medScore + stressScore + sleepScore + breathScore, 0, 100))

    // Emotional regulation index
    const emotionalReg = r0(clamp(mindScore * 0.7 + (10 - stress) * 3, 0, 100))

    // Anxiety risk
    const anxietyRisk = stress > 7 && sleepQ < 5 ? "High" : stress > 5 || sleepQ < 6 ? "Moderate" : "Low"
    const anxietyStatus: 'good' | 'warning' | 'danger' = anxietyRisk === "High" ? "danger" : anxietyRisk === "Moderate" ? "warning" : "good"

    let status: 'good' | 'warning' | 'danger' = mindScore >= 65 ? "good" : mindScore >= 40 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Mindfulness Score", value: `${mindScore}/100`, status, description: `Emotional regulation: ${emotionalReg}% — Anxiety risk: ${anxietyRisk}` },
      healthScore: mindScore,
      metrics: [
        { label: "Mindfulness Score", value: mindScore, unit: "/100", status },
        { label: "Meditation Score", value: medScore, unit: "/30", status: medScore >= 20 ? "good" : medScore >= 10 ? "warning" : "danger" },
        { label: "Stress Management", value: stressScore, unit: "/30", status: stressScore >= 18 ? "good" : stressScore >= 10 ? "warning" : "danger" },
        { label: "Sleep Quality Score", value: sleepScore, unit: "/20", status: sleepScore >= 14 ? "good" : sleepScore >= 10 ? "warning" : "danger" },
        { label: "Breathing Score", value: breathScore, unit: "/20", status: breathScore >= 14 ? "good" : breathScore >= 8 ? "warning" : "danger" },
        { label: "Emotional Regulation", value: emotionalReg, unit: "%", status: emotionalReg >= 60 ? "good" : emotionalReg >= 40 ? "warning" : "danger" },
        { label: "Anxiety Risk", value: anxietyRisk, status: anxietyStatus }
      ],
      recommendations: [
        { title: "Mindfulness Assessment", description: `Score ${mindScore}/100. ${mindScore >= 65 ? "Strong mindfulness practice — maintain consistency." : mindScore >= 40 ? "Moderate awareness. Increase meditation to 15-20 min daily for significant improvement." : "Low mindfulness engagement. Start with 5 min daily meditation and 3-min breathing exercises. Even small practices compound over time."}`, priority: "high", category: "Assessment" },
        { title: "Emotional Regulation", description: `Emotional regulation index: ${emotionalReg}%. ${emotionalReg < 50 ? "Below threshold — stress is outpacing coping mechanisms. Prioritize: 1) Even 5 min meditation reduces amygdala reactivity. 2) 4-7-8 breathing activates vagus nerve in 90 seconds. 3) Journaling 10 min reduces rumination 40%." : "Good emotional balance. Continue current practices and explore body scan meditation for deeper interoception."}`, priority: "high", category: "Regulation" },
        { title: "Anxiety Reduction", description: `Anxiety risk: ${anxietyRisk}. ${anxietyRisk !== "Low" ? "High stress (" + stress + "/10) and/or poor sleep quality (" + sleepQ + "/10) elevate anxiety. Evidence: 8 weeks MBSR reduces anxiety 38%. Combine meditation + sleep hygiene + regular exercise for best outcomes." : "Low anxiety risk. Maintain mindfulness routine for resilience building."}`, priority: "medium", category: "Mental Health" }
      ],
      detailedBreakdown: { "Meditation": `${medMin} min (${medScore}/30)`, "Stress": `${stress}/10 (${stressScore}/30)`, "Sleep Quality": `${sleepQ}/10 (${sleepScore}/20)`, "Breathing": `${breathMin} min (${breathScore}/20)`, "Total": `${mindScore}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="mindfulness-score" title="Mindfulness Score Calculator"
      description="Evaluate mental balance from meditation, stress, sleep quality, and breathing exercises. Includes emotional regulation index and anxiety risk indicator."
      icon={Brain} calculate={calculate} onClear={() => { setMeditationMin(10); setStressRating(5); setSleepQuality(6); setBreathingMin(5); setResult(null) }}
      values={[meditationMin, stressRating, sleepQuality, breathingMin]} result={result}
      seoContent={<SeoContentGenerator title="Mindfulness Score Calculator" description="Calculate mindfulness and mental balance score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Meditation Duration" val={meditationMin} set={setMeditationMin} min={0} max={120} suffix="min/day" />
          <NumInput label="Breathing Exercises" val={breathingMin} set={setBreathingMin} min={0} max={60} suffix="min/day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stress Level" val={stressRating} set={setStressRating} min={1} max={10} suffix="1=low, 10=high" />
          <NumInput label="Sleep Quality" val={sleepQuality} set={setSleepQuality} min={1} max={10} suffix="1=poor, 10=great" />
        </div>
      </div>} />
  )
}

// ─── 17. Sobriety Calculator (Addiction Recovery Tracker) ────────────────────
export function SobrietyCalculator() {
  const [quitDateStr, setQuitDateStr] = useState("2025-01-01")
  const [prevFrequency, setPrevFrequency] = useState("daily")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const quitDate = new Date(quitDateStr)
    const now = new Date()
    const diffMs = now.getTime() - quitDate.getTime()

    if (diffMs < 0) {
      setResult({ primaryMetric: { label: "Sobriety", value: "Future date", status: "warning", description: "Quit date is in the future" }, metrics: [], recommendations: [], detailedBreakdown: {} })
      return
    }

    const daysSober = Math.floor(diffMs / 86400000)
    const weeksSober = r1(daysSober / 7)
    const monthsSober = r1(daysSober / 30.44)
    const yearsSober = r2(daysSober / 365.25)

    // Health recovery milestones
    const milestones = [
      { day: 1, name: "First 24 Hours", desc: "Blood alcohol drops to zero. Body begins detox process.", reached: daysSober >= 1 },
      { day: 3, name: "72 Hours", desc: "Withdrawal symptoms peak. Blood sugar normalizes.", reached: daysSober >= 3 },
      { day: 7, name: "1 Week", desc: "Sleep quality begins improving. Hydration normalizes.", reached: daysSober >= 7 },
      { day: 14, name: "2 Weeks", desc: "Stomach lining heals. Liver fat reduces 15%. Anxiety decreases.", reached: daysSober >= 14 },
      { day: 30, name: "1 Month", desc: "Liver fat decreases up to 40%. Blood pressure improves. Skin clears.", reached: daysSober >= 30 },
      { day: 90, name: "3 Months", desc: "Liver function significantly improved. Brain fog lifts. Depression reduces.", reached: daysSober >= 90 },
      { day: 180, name: "6 Months", desc: "Weight stabilizes. Relationships improve. Financial savings accumulate.", reached: daysSober >= 180 },
      { day: 365, name: "1 Year", desc: "Cancer risk begins declining. Liver may fully regenerate. Cognitive function restored.", reached: daysSober >= 365 }
    ]

    const reachedMilestones = milestones.filter(m => m.reached).length
    const nextMilestone = milestones.find(m => !m.reached)

    // Liver recovery estimate
    const liverRecovery = Math.min(100, r0(daysSober > 365 ? 95 : daysSober > 180 ? 80 : daysSober > 90 ? 60 : daysSober > 30 ? 40 : daysSober * 1.3))

    // Relapse probability (decreases over time)
    const relapseProb = r0(Math.max(5, 85 - daysSober * 0.3 - (prevFrequency === "occasional" ? 15 : 0)))

    const status: 'good' | 'warning' | 'danger' = daysSober >= 90 ? "good" : daysSober >= 14 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Days Sober", value: daysSober, status, description: `${monthsSober} months — ${reachedMilestones}/${milestones.length} milestones reached` },
      healthScore: Math.min(100, r0(daysSober > 365 ? 95 : daysSober > 90 ? 75 + daysSober * 0.07 : daysSober * 0.8)),
      metrics: [
        { label: "Days Sober", value: daysSober, status },
        { label: "Weeks", value: weeksSober, status: "normal" },
        { label: "Months", value: monthsSober, status: "normal" },
        { label: "Years", value: yearsSober, status: "normal" },
        { label: "Milestones Reached", value: `${reachedMilestones}/${milestones.length}`, status: "good" },
        { label: "Liver Recovery", value: liverRecovery, unit: "%", status: liverRecovery >= 70 ? "good" : liverRecovery >= 40 ? "warning" : "danger" },
        { label: "Relapse Risk", value: relapseProb, unit: "%", status: relapseProb < 20 ? "good" : relapseProb < 50 ? "warning" : "danger" },
        ...milestones.slice(0, 6).map(m => ({ label: m.name, value: m.reached ? "✓ Reached" : `${m.day - daysSober} days away`, status: (m.reached ? "good" : "normal") as 'good' | 'normal' }))
      ],
      recommendations: [
        { title: "Recovery Progress", description: `${daysSober} days sober (${monthsSober} months). ${nextMilestone ? `Next milestone: ${nextMilestone.name} in ${nextMilestone.day - daysSober} days — ${nextMilestone.desc}` : "All major milestones reached! Long-term sobriety significantly reduces all-cause mortality and cancer risk."}`, priority: "high", category: "Progress" },
        { title: "Liver Recovery", description: `Liver recovery: ${liverRecovery}%. The liver can regenerate remarkably — fatty liver reverses in 2-6 weeks, inflammation resolves in months. ${liverRecovery < 60 ? "Continue — major healing is happening now." : "Significant recovery achieved. Annual liver function tests recommended."}`, priority: "high", category: "Health" },
        { title: "Relapse Prevention", description: `Relapse probability: ${relapseProb}%. ${relapseProb > 40 ? "First 90 days are highest risk. HALT check: Hungry, Angry, Lonely, Tired — address these triggers. Consider support groups, therapy, or medication-assisted treatment." : "Risk decreasing with time. Maintain support network. Remember: relapse is a setback, not failure. Skills learned remain."}`, priority: "medium", category: "Support" }
      ],
      detailedBreakdown: { "Quit Date": quitDateStr, "Days": daysSober, "Weeks": weeksSober, "Months": monthsSober, "Years": yearsSober, "Liver": `${liverRecovery}%`, "Relapse Risk": `${relapseProb}%`, "Milestones": `${reachedMilestones}/8` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sobriety-calculator" title="Sobriety Calculator — Recovery Tracker"
      description="Track alcohol-free duration, health recovery milestones, liver regeneration progress, and relapse probability. Celebrate your sobriety journey."
      icon={Shield} calculate={calculate} onClear={() => { setQuitDateStr("2025-01-01"); setPrevFrequency("daily"); setResult(null) }}
      values={[quitDateStr, prevFrequency]} result={result}
      seoContent={<SeoContentGenerator title="Sobriety Calculator" description="Track sobriety milestones and health recovery." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Sobriety Start Date" val={quitDateStr} set={setQuitDateStr} />
        <SelectInput label="Previous Drinking Frequency" val={prevFrequency} set={setPrevFrequency} options={[{ value: "daily", label: "Daily drinker" }, { value: "heavy", label: "Heavy (4-6 days/week)" }, { value: "moderate", label: "Moderate (2-3 days/week)" }, { value: "occasional", label: "Occasional (weekly or less)" }]} />
      </div>} />
  )
}

// ─── 18. Smoke-Free Calculator (Quit Smoking Progress Tracker) ───────────────
export function SmokeFreeProgressCalculator() {
  const [quitDateStr, setQuitDateStr] = useState("2025-01-01")
  const [cigsPerDay, setCigsPerDay] = useState(15)
  const [costPerPack, setCostPerPack] = useState(10)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const quitDate = new Date(quitDateStr)
    const now = new Date()
    const diffMs = now.getTime() - quitDate.getTime()

    if (diffMs < 0) {
      setResult({ primaryMetric: { label: "Smoke-Free", value: "Future date", status: "warning", description: "Quit date is in the future" }, metrics: [], recommendations: [], detailedBreakdown: {} })
      return
    }

    const daysFree = Math.floor(diffMs / 86400000)
    const cigs = clamp(cigsPerDay, 1, 60)
    const cost = clamp(costPerPack, 0.5, 50)

    const cigsAvoided = daysFree * cigs
    const packsAvoided = r1(cigsAvoided / 20)
    const moneySaved = r0(packsAvoided * cost)
    const lifeRegained = r1(cigsAvoided * 11 / 60) // ~11 min per cigarette

    // Health recovery timeline
    const milestones = [
      { day: 0.02, name: "20 Minutes", desc: "Heart rate and blood pressure drop.", reached: daysFree >= 0.02 },
      { day: 0.5, name: "12 Hours", desc: "Carbon monoxide returns to normal.", reached: daysFree >= 0.5 },
      { day: 2, name: "48 Hours", desc: "Taste and smell begin recovering.", reached: daysFree >= 2 },
      { day: 14, name: "2 Weeks", desc: "Circulation improves. Lung function increases.", reached: daysFree >= 14 },
      { day: 30, name: "1 Month", desc: "Coughing decreases. Shortness of breath reduces.", reached: daysFree >= 30 },
      { day: 90, name: "3 Months", desc: "Circulation and lung function significantly improve.", reached: daysFree >= 90 },
      { day: 270, name: "9 Months", desc: "Lung cilia regrow. Fewer infections.", reached: daysFree >= 270 },
      { day: 365, name: "1 Year", desc: "Heart disease risk halved vs. smoker.", reached: daysFree >= 365 },
      { day: 1825, name: "5 Years", desc: "Stroke risk equals non-smoker.", reached: daysFree >= 1825 },
      { day: 3650, name: "10 Years", desc: "Lung cancer risk halved. Pancreatic cancer risk drops.", reached: daysFree >= 3650 }
    ]

    const reached = milestones.filter(m => m.reached).length
    const nextMs = milestones.find(m => !m.reached)

    // Lung recovery percentage
    const lungRecovery = Math.min(100, r0(daysFree > 3650 ? 90 : daysFree > 365 ? 50 + daysFree * 0.01 : daysFree > 90 ? 30 + daysFree * 0.22 : daysFree * 0.33))

    const status: 'good' | 'warning' | 'danger' = daysFree >= 30 ? "good" : daysFree >= 7 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Days Smoke-Free", value: daysFree, status, description: `${cigsAvoided} cigarettes avoided — $${moneySaved} saved — ${lifeRegained} hrs regained` },
      healthScore: Math.min(100, r0(daysFree > 365 ? 90 : daysFree > 30 ? 50 + daysFree * 0.12 : daysFree * 1.5)),
      metrics: [
        { label: "Days Smoke-Free", value: daysFree, status },
        { label: "Cigarettes Avoided", value: cigsAvoided, status: "good" },
        { label: "Money Saved", value: `$${moneySaved}`, status: "good" },
        { label: "Life Regained", value: r1(lifeRegained), unit: "hours", status: "good" },
        { label: "Packs Avoided", value: packsAvoided, status: "good" },
        { label: "Lung Recovery", value: lungRecovery, unit: "%", status: lungRecovery >= 50 ? "good" : lungRecovery >= 25 ? "warning" : "danger" },
        { label: "Milestones", value: `${reached}/${milestones.length}`, status: "good" },
        ...(nextMs ? [{ label: "Next Milestone", value: nextMs.name, status: "normal" as const }] : [])
      ],
      recommendations: [
        { title: "Health Recovery", description: `${daysFree} days smoke-free! ${nextMs ? `Next milestone: ${nextMs.name} — ${nextMs.desc}` : "All major health milestones reached!"}. Lung recovery: ${lungRecovery}%. Each smoke-free day your body is healing and cancer risk is declining.`, priority: "high", category: "Health" },
        { title: "Savings & Life", description: `Avoided ${cigsAvoided} cigarettes ($${moneySaved} saved). Each cigarette costs ~11 min of life — you've regained ${lifeRegained} hours. Annual savings projection: $${r0(cigs / 20 * cost * 365)}.`, priority: "high", category: "Benefits" },
        { title: "Stay Smoke-Free", description: `${daysFree < 14 ? "First 2 weeks are hardest. Cravings last 3-5 min — ride them out. Use 4Ds: Delay, Drink water, Deep breathe, Do something. NRT doubles success rate." : daysFree < 90 ? "Past the worst! Cravings are fading. Avoid triggers: stress, alcohol, other smokers. Exercise reduces cravings 50%." : "Excellent progress! Relapse risk drops significantly after 3 months. Stay vigilant around triggers."}`, priority: "medium", category: "Support" }
      ],
      detailedBreakdown: { "Quit Date": quitDateStr, "Days": daysFree, "Cigs Avoided": cigsAvoided, "Saved": `$${moneySaved}`, "Life +": `${lifeRegained} hrs`, "Lung Recovery": `${lungRecovery}%`, "Milestones": `${reached}/10` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="smoke-free-calculator" title="Smoke-Free Calculator — Quit Progress Tracker"
      description="Track smoking cessation progress, health recovery timeline, money saved, cigarettes avoided, and lung recovery. Celebrate every smoke-free day."
      icon={Shield} calculate={calculate} onClear={() => { setQuitDateStr("2025-01-01"); setCigsPerDay(15); setCostPerPack(10); setResult(null) }}
      values={[quitDateStr, cigsPerDay, costPerPack]} result={result}
      seoContent={<SeoContentGenerator title="Smoke-Free Calculator" description="Track quit smoking progress and health benefits." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Quit Date" val={quitDateStr} set={setQuitDateStr} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cigarettes Per Day (before)" val={cigsPerDay} set={setCigsPerDay} min={1} max={60} suffix="cigs/day" />
          <NumInput label="Cost Per Pack" val={costPerPack} set={setCostPerPack} min={0.5} max={50} step={0.5} suffix="$/pack" />
        </div>
      </div>} />
  )
}

// ─── 19. Fitness Streak Calculator (Habit Consistency Engine) ────────────────
export function FitnessStreakCalculator() {
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(4)
  const [avgDuration, setAvgDuration] = useState(45)
  const [currentStreak, setCurrentStreak] = useState(12)
  const [longestStreak, setLongestStreak] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wk = clamp(workoutsThisWeek, 0, 7)
    const dur = clamp(avgDuration, 0, 300)
    const streak = clamp(currentStreak, 0, 3650)
    const longest = clamp(Math.max(longestStreak, streak), 0, 3650)

    const weeklyMin = wk * dur
    const weeklyTarget = 150 // WHO recommendation
    const adherence = r0(Math.min(100, weeklyMin / weeklyTarget * 100))

    // Habit probability (the longer the streak, the stronger the habit)
    const habitProb = r0(Math.min(95, streak >= 66 ? 90 : streak >= 30 ? 70 + streak * 0.3 : streak * 2))

    // Consistency score
    const consistencyScore = r0(clamp(adherence * 0.5 + habitProb * 0.3 + (streak > longest * 0.8 ? 20 : 10), 0, 100))

    // Motivation factors
    const streakBonus = streak >= 100 ? "Elite" : streak >= 66 ? "Habit Formed" : streak >= 30 ? "Building" : streak >= 7 ? "Starting" : "Day Zero"
    const breakRisk = streak < 7 ? "High" : streak < 21 ? "Moderate" : streak < 66 ? "Low" : "Very Low"

    const status: 'good' | 'warning' | 'danger' = streak >= 30 ? "good" : streak >= 7 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Current Streak", value: `${streak} days`, status, description: `${streakBonus} — ${adherence}% weekly target met — Habit probability: ${habitProb}%` },
      healthScore: consistencyScore,
      metrics: [
        { label: "Current Streak", value: streak, unit: "days", status },
        { label: "Longest Streak", value: longest, unit: "days", status: "good" },
        { label: "Workouts/Week", value: wk, status: wk >= 4 ? "good" : wk >= 2 ? "warning" : "danger" },
        { label: "Weekly Minutes", value: weeklyMin, unit: "min", status: weeklyMin >= 150 ? "good" : weeklyMin >= 75 ? "warning" : "danger" },
        { label: "WHO Target Met", value: adherence, unit: "%", status: adherence >= 100 ? "good" : adherence >= 50 ? "warning" : "danger" },
        { label: "Habit Probability", value: habitProb, unit: "%", status: habitProb >= 70 ? "good" : habitProb >= 40 ? "warning" : "danger" },
        { label: "Streak Status", value: streakBonus, status },
        { label: "Break Risk", value: breakRisk, status: breakRisk === "Very Low" || breakRisk === "Low" ? "good" : breakRisk === "Moderate" ? "warning" : "danger" },
        { label: "Consistency Score", value: consistencyScore, unit: "/100", status: consistencyScore >= 70 ? "good" : consistencyScore >= 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Streak Analysis", description: `${streak}-day streak (longest: ${longest}). ${streakBonus}. Research: 66 days average to form exercise habit (range: 18-254 days). ${streak < 66 ? "Keep going — habit formation is non-linear. Motivation follows action, not the other way around." : "Habit likely formed! Exercise is now part of your identity. Focus on progressive overload and variety."}`, priority: "high", category: "Habits" },
        { title: "WHO Guidelines", description: `${weeklyMin} min/week (target: 150+ min moderate OR 75+ min vigorous). ${adherence >= 100 ? "Meeting WHO guidelines — associated with 30% lower mortality, reduced cancer risk, better mental health." : "Below target. Even 10-min walks count. Consistency beats intensity for health outcomes."}`, priority: "high", category: "Guidelines" },
        { title: "Maintaining Streaks", description: `Break risk: ${breakRisk}. ${streak < 21 ? "First 21 days: Never miss twice in a row. Schedule workouts like meetings. Have a minimum viable workout (even 5 min counts)." : "Good foundation. Allow recovery days. Cross-train to prevent injuries. Track progress photos/numbers for motivation."}`, priority: "medium", category: "Motivation" }
      ],
      detailedBreakdown: { "Streak": `${streak} days`, "Longest": `${longest} days`, "Weekly": `${wk} workouts × ${dur} min = ${weeklyMin} min`, "Adherence": `${adherence}%`, "Habit Prob": `${habitProb}%`, "Status": streakBonus }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fitness-streak" title="Fitness Streak Calculator"
      description="Track workout streaks, habit formation probability, WHO guideline adherence, and consistency scores. Maintain motivation with streak analytics."
      icon={Activity} calculate={calculate} onClear={() => { setWorkoutsThisWeek(4); setAvgDuration(45); setCurrentStreak(12); setLongestStreak(30); setResult(null) }}
      values={[workoutsThisWeek, avgDuration, currentStreak, longestStreak]} result={result}
      seoContent={<SeoContentGenerator title="Fitness Streak Calculator" description="Track workout streaks and habit consistency." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Workouts This Week" val={workoutsThisWeek} set={setWorkoutsThisWeek} min={0} max={7} suffix="days" />
          <NumInput label="Avg Workout Duration" val={avgDuration} set={setAvgDuration} min={0} max={300} suffix="min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Streak" val={currentStreak} set={setCurrentStreak} min={0} max={3650} suffix="days" />
          <NumInput label="Longest Streak" val={longestStreak} set={setLongestStreak} min={0} max={3650} suffix="days" />
        </div>
      </div>} />
  )
}

// ─── 20. Burnout Risk Estimator (Mental Fatigue Model) ──────────────────────
export function BurnoutRiskCalculator() {
  const [workHrs, setWorkHrs] = useState(50)
  const [sleepHrs, setSleepHrs] = useState(6)
  const [stressLevel, setStressLevel] = useState(7)
  const [exerciseFreq, setExerciseFreq] = useState(1)
  const [vacationDays, setVacationDays] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const work = clamp(workHrs, 0, 100)
    const sleep = clamp(sleepHrs, 0, 14)
    const stress = clamp(stressLevel, 1, 10)
    const exercise = clamp(exerciseFreq, 0, 7)
    const vacation = clamp(vacationDays, 0, 30)

    // Burnout scoring (0-100)
    let burnoutScore = 0
    burnoutScore += work > 60 ? 30 : work > 50 ? 22 : work > 45 ? 12 : 5
    burnoutScore += sleep < 5 ? 25 : sleep < 6 ? 18 : sleep < 7 ? 10 : 0
    burnoutScore += stress >= 8 ? 20 : stress >= 6 ? 12 : stress >= 4 ? 5 : 0
    burnoutScore -= exercise >= 4 ? 12 : exercise >= 2 ? 6 : 0
    burnoutScore -= vacation >= 10 ? 8 : vacation >= 5 ? 4 : 0
    burnoutScore = clamp(r0(burnoutScore), 0, 100)

    // Emotional exhaustion index
    const emotionalExhaustion = r0(clamp(stress * 8 + (sleep < 6 ? 15 : 0) + (work > 50 ? 15 : 0), 0, 100))

    // Depersonalization estimate
    const depersonalization = burnoutScore > 70 ? "High" : burnoutScore > 45 ? "Moderate" : "Low"

    // Depression risk correlation
    const depressionRisk = r0(clamp(burnoutScore * 0.6 + (sleep < 6 ? 10 : 0) + (stress > 7 ? 10 : 0), 0, 100))

    const category = burnoutScore > 70 ? "Critical Burnout Risk" : burnoutScore > 50 ? "High Risk" : burnoutScore > 30 ? "Moderate Risk" : "Low Risk"
    const status: 'good' | 'warning' | 'danger' = burnoutScore > 60 ? "danger" : burnoutScore > 35 ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Burnout Risk", value: `${burnoutScore}/100`, status, description: `${category} — Emotional exhaustion: ${emotionalExhaustion}%` },
      healthScore: Math.max(0, 100 - burnoutScore),
      metrics: [
        { label: "Burnout Risk Score", value: burnoutScore, unit: "/100", status },
        { label: "Category", value: category, status },
        { label: "Emotional Exhaustion", value: emotionalExhaustion, unit: "%", status: emotionalExhaustion > 60 ? "danger" : emotionalExhaustion > 35 ? "warning" : "good" },
        { label: "Depersonalization", value: depersonalization, status: depersonalization === "High" ? "danger" : depersonalization === "Moderate" ? "warning" : "good" },
        { label: "Depression Risk", value: depressionRisk, unit: "%", status: depressionRisk > 50 ? "danger" : depressionRisk > 25 ? "warning" : "good" },
        { label: "Work Hours", value: work, unit: "hrs/week", status: work <= 45 ? "good" : work <= 55 ? "warning" : "danger" },
        { label: "Sleep", value: sleep, unit: "hrs/night", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" },
        { label: "Stress Level", value: stress, unit: "/10", status: stress <= 4 ? "good" : stress <= 7 ? "warning" : "danger" },
        { label: "Exercise", value: exercise, unit: "days/week", status: exercise >= 3 ? "good" : exercise >= 1 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Burnout Assessment", description: `Burnout score ${burnoutScore}/100 (${category}). ${burnoutScore > 60 ? "CRITICAL: You show signs of serious burnout. Consider immediate workload reduction, professional support (therapist/counselor), and mandatory recovery time. Burnout is not laziness — it's a medical condition." : burnoutScore > 35 ? "Elevated risk. Implement boundaries: work hours cap, regular breaks, one full rest day/week." : "Manageable level. Maintain work-life balance and monitor stress trends."}`, priority: "high", category: "Assessment" },
        { title: "Maslach Burnout Dimensions", description: `Emotional exhaustion: ${emotionalExhaustion}%. Depersonalization: ${depersonalization}. These are 2 of 3 Maslach burnout dimensions. ${emotionalExhaustion > 50 ? "High emotional exhaustion = feeling drained, depleted, unable to recover. Core recovery: sleep 7+ hrs, exercise, social connection, creative outlets." : "Within manageable range."}`, priority: "high", category: "Clinical" },
        { title: "Depression Correlation", description: `Depression risk: ${depressionRisk}%. Burnout and depression share 50% symptom overlap. ${depressionRisk > 40 ? "Significant correlation detected. Watch for: persistent sadness, loss of interest, appetite changes, hopelessness. Seek professional evaluation if 3+ symptoms present for 2+ weeks." : "Low correlation. Continue preventive measures."}`, priority: "medium", category: "Mental Health" }
      ],
      detailedBreakdown: { "Work": `${work} hrs/week`, "Sleep": `${sleep} hrs`, "Stress": `${stress}/10`, "Exercise": `${exercise}x/week`, "Vacation": `${vacation} days/year`, "Burnout Score": burnoutScore, "Exhaustion": `${emotionalExhaustion}%`, "Depression Risk": `${depressionRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="burnout-risk-calculator" title="Burnout Risk Estimator"
      description="Assess burnout probability from work hours, sleep, stress, and exercise. Includes emotional exhaustion index, depersonalization, and depression risk correlation."
      icon={AlertCircle} calculate={calculate} onClear={() => { setWorkHrs(50); setSleepHrs(6); setStressLevel(7); setExerciseFreq(1); setVacationDays(5); setResult(null) }}
      values={[workHrs, sleepHrs, stressLevel, exerciseFreq, vacationDays]} result={result}
      seoContent={<SeoContentGenerator title="Burnout Risk Calculator" description="Estimate burnout risk from lifestyle factors." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weekly Work Hours" val={workHrs} set={setWorkHrs} min={0} max={100} suffix="hrs/week" />
          <NumInput label="Sleep Hours" val={sleepHrs} set={setSleepHrs} min={0} max={14} step={0.5} suffix="hrs/night" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="1-10" />
          <NumInput label="Exercise Frequency" val={exerciseFreq} set={setExerciseFreq} min={0} max={7} suffix="days/week" />
        </div>
        <NumInput label="Vacation Days Used (last 6 months)" val={vacationDays} set={setVacationDays} min={0} max={30} suffix="days" />
      </div>} />
  )
}

// ─── 21. Hydration Reminder Calculator ──────────────────────────────────────
export function HydrationReminderCalculator() {
  const [weight, setWeight] = useState(70)
  const [activityLevel, setActivityLevel] = useState("moderate")
  const [climate, setClimate] = useState("temperate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 200)

    // Base: 30-35 ml/kg
    let mlPerKg = 33
    if (activityLevel === "high") mlPerKg = 40
    else if (activityLevel === "moderate") mlPerKg = 35
    else mlPerKg = 30

    if (climate === "hot") mlPerKg += 5
    else if (climate === "cold") mlPerKg -= 2

    const totalMl = r0(w * mlPerKg)
    const totalL = r1(totalMl / 1000)
    const totalCups = r0(totalMl / 250)

    // Hourly target (16 waking hours)
    const hourlyMl = r0(totalMl / 16)
    const hourlyCups = r2(totalCups / 16)

    // Dehydration risk
    const minMl = r0(w * 25)
    const dehydrationRisk = totalMl < minMl * 0.8 ? "High" : "Low"

    // Electrolyte need
    const electrolyteNeed = activityLevel === "high" || climate === "hot" ? "Add electrolytes for intense exercise or hot climate" : "Water alone is usually sufficient"

    setResult({
      primaryMetric: { label: "Daily Water Target", value: `${totalL}L`, status: "good", description: `${totalCups} cups — ${hourlyMl}ml every hour — ${w}kg × ${mlPerKg}ml/kg` },
      healthScore: 85,
      metrics: [
        { label: "Daily Target", value: totalL, unit: "liters", status: "good" },
        { label: "Daily Cups", value: totalCups, unit: "cups (250ml)", status: "good" },
        { label: "Hourly Intake", value: hourlyMl, unit: "ml/hr", status: "good" },
        { label: "Total Milliliters", value: totalMl, unit: "ml", status: "good" },
        { label: "Formula", value: `${w}kg × ${mlPerKg}ml/kg`, status: "normal" },
        { label: "Minimum Need", value: r1(minMl / 1000), unit: "L", status: "warning" },
        { label: "Dehydration Risk", value: dehydrationRisk, status: dehydrationRisk === "High" ? "danger" : "good" },
        { label: "Electrolyte Need", value: electrolyteNeed, status: activityLevel === "high" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Hydration Schedule", description: `Target: ${totalL}L/day (${totalCups} cups). Spread evenly: ~${hourlyMl}ml every hour during 16 waking hours. Drink 500ml within 30 min of waking. Front-load hydration — drink 60% by 3 PM. Reduce intake 2 hours before bed to avoid nighttime awakenings.`, priority: "high", category: "Schedule" },
        { title: "Hydration Signs", description: "Urine color is the best indicator: pale yellow = hydrated, dark yellow = dehydrated. Other signs of dehydration: headache, fatigue, dry mouth, decreased concentration. Even 2% dehydration impairs cognitive function and physical performance.", priority: "high", category: "Monitoring" },
        { title: "Hydration Sources", description: `~20% of daily water comes from food (fruits, vegetables, soups). Caffeinated drinks still contribute to hydration (net positive). ${activityLevel === "high" ? "For exercise >60 min: add electrolytes (sodium, potassium). Sports drinks or electrolyte tablets." : "Water is the best choice for daily hydration. Herbal tea and infused water add variety."}`, priority: "medium", category: "Sources" }
      ],
      detailedBreakdown: { "Weight": `${w} kg`, "Rate": `${mlPerKg} ml/kg`, "Activity": activityLevel, "Climate": climate, "Daily": `${totalL}L (${totalCups} cups)`, "Hourly": `${hourlyMl}ml`, "Minimum": `${r1(minMl / 1000)}L` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hydration-reminder" title="Hydration Calculator — Daily Water Need"
      description="Calculate personalized daily water intake based on weight, activity level, and climate. Includes hourly intake targets and dehydration risk assessment."
      icon={Droplets} calculate={calculate} onClear={() => { setWeight(70); setActivityLevel("moderate"); setClimate("temperate"); setResult(null) }}
      values={[weight, activityLevel, climate]} result={result}
      seoContent={<SeoContentGenerator title="Hydration Calculator" description="Calculate daily water intake based on weight and activity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={200} suffix="kg" />
        <SelectInput label="Activity Level" val={activityLevel} set={setActivityLevel} options={[{ value: "sedentary", label: "Sedentary (desk job)" }, { value: "moderate", label: "Moderate (some exercise)" }, { value: "high", label: "High (daily intense exercise)" }]} />
        <SelectInput label="Climate" val={climate} set={setClimate} options={[{ value: "cold", label: "Cold / Cool" }, { value: "temperate", label: "Temperate / Mild" }, { value: "hot", label: "Hot / Humid" }]} />
      </div>} />
  )
}

// ─── 22. Bedtime Reminder (Sleep Hygiene Scheduler) ─────────────────────────
export function BedtimeReminderCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [sleepGoal, setSleepGoal] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wake = timeToMin(wakeTime)
    const goal = clamp(sleepGoal, 4, 12)

    const sleepMin = goal * 60
    const bedtime = wake - sleepMin
    const windDown = bedtime - 30
    const screenOff = bedtime - 60
    const lastCaffeine = bedtime - 480 // 8 hrs before

    // Circadian drift detection
    const isLateWake = wake > 540 // 9 AM
    const isEarlyWake = wake < 300 // 5 AM
    const driftWarning = isLateWake ? "Late wake time may indicate circadian drift — gradually shift 15 min earlier." : isEarlyWake ? "Very early wake — ensure adequate total sleep." : "Normal wake timing."

    const bedHour = ((bedtime % 1440) + 1440) % 1440 / 60
    const idealBedRange = bedHour >= 21 && bedHour <= 24 ? "Optimal" : bedHour >= 20 || bedHour <= 1 ? "Acceptable" : "Misaligned"

    setResult({
      primaryMetric: { label: "Recommended Bedtime", value: fmtTime(bedtime), status: idealBedRange === "Optimal" ? "good" : "warning", description: `${goal} hrs sleep goal — Wind down at ${fmtTime(windDown)}` },
      healthScore: idealBedRange === "Optimal" ? 90 : idealBedRange === "Acceptable" ? 70 : 45,
      metrics: [
        { label: "Bedtime", value: fmtTime(bedtime), status: idealBedRange === "Optimal" ? "good" : "warning" },
        { label: "Wind-Down Start", value: fmtTime(windDown), status: "good" },
        { label: "Screens Off", value: fmtTime(screenOff), status: "good" },
        { label: "Last Caffeine", value: fmtTime(lastCaffeine), status: "warning" },
        { label: "Sleep Goal", value: goal, unit: "hours", status: "good" },
        { label: "Wake Time", value: fmtTime(wake), status: "normal" },
        { label: "Bedtime Window", value: idealBedRange, status: idealBedRange === "Optimal" ? "good" : "warning" },
        { label: "Circadian Alignment", value: driftWarning, status: isLateWake || isEarlyWake ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Bedtime Routine", description: `Bedtime: ${fmtTime(bedtime)}. Wind-down routine at ${fmtTime(windDown)}: dim lights, no work/emails, gentle stretching or reading. Screens off at ${fmtTime(screenOff)} (blue light suppresses melatonin). Last caffeine by ${fmtTime(lastCaffeine)}.`, priority: "high", category: "Routine" },
        { title: "Consistency", description: "Keep the same bedtime ±30 min every day (including weekends). Social jet lag (>1 hr weekend shift) disrupts circadian rhythm and increases metabolic risk. Set a bedtime alarm 30 min before target bedtime.", priority: "high", category: "Consistency" },
        { title: "Sleep Environment", description: "Ideal: 65-68°F (18-20°C), completely dark (use blackout curtains), quiet (white noise if needed), comfortable mattress. Remove all electronic devices. Associate bed only with sleep — no work, no scrolling.", priority: "medium", category: "Environment" }
      ],
      detailedBreakdown: { "Wake": fmtTime(wake), "Bedtime": fmtTime(bedtime), "Wind-Down": fmtTime(windDown), "Screens Off": fmtTime(screenOff), "Last Caffeine": fmtTime(lastCaffeine), "Sleep Goal": `${goal} hrs`, "Window": idealBedRange }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bedtime-reminder" title="Bedtime Reminder — Sleep Hygiene Scheduler"
      description="Calculate optimal bedtime with wind-down routine, screen-off time, and caffeine cutoff. Includes circadian drift detection."
      icon={Moon} calculate={calculate} onClear={() => { setWakeTime("07:00"); setSleepGoal(8); setResult(null) }}
      values={[wakeTime, sleepGoal]} result={result}
      seoContent={<SeoContentGenerator title="Bedtime Reminder Calculator" description="Calculate optimal bedtime for sleep hygiene." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <TimeInput label="Wake-Up Time" val={wakeTime} set={setWakeTime} />
        <NumInput label="Sleep Duration Goal" val={sleepGoal} set={setSleepGoal} min={4} max={12} step={0.5} suffix="hours" />
      </div>} />
  )
}

// ─── 23. Sleep Quality Score Calculator ─────────────────────────────────────
export function SleepQualityScoreCalculator() {
  const [sleepDuration, setSleepDuration] = useState(7)
  const [interruptions, setInterruptions] = useState(2)
  const [sleepLatency, setSleepLatency] = useState(15)
  const [hrv, setHrv] = useState(45)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(sleepDuration, 0, 16)
    const ints = clamp(interruptions, 0, 20)
    const lat = clamp(sleepLatency, 0, 120)
    const h = clamp(hrv, 10, 150)

    // Duration score (0-30)
    const durScore = dur >= 7 && dur <= 9 ? 30 : dur >= 6 ? 20 : dur >= 5 ? 12 : 5

    // Interruption score (0-25)
    const intScore = ints === 0 ? 25 : ints <= 1 ? 20 : ints <= 3 ? 12 : ints <= 5 ? 5 : 0

    // Latency score (0-25)
    const latScore = lat <= 10 ? 25 : lat <= 20 ? 20 : lat <= 30 ? 12 : lat <= 60 ? 5 : 0

    // HRV bonus (0-20)
    const hrvScore = h >= 60 ? 20 : h >= 45 ? 15 : h >= 30 ? 10 : 5

    const sleepScore = r0(durScore + intScore + latScore + hrvScore)

    // Sleep fragmentation index
    const fragIndex = r0(ints * 100 / Math.max(1, dur))

    // Sleep disorder probability
    const disorderProb = r0(clamp((lat > 30 ? 20 : 0) + (ints > 3 ? 20 : 0) + (dur < 5 ? 15 : 0) + (h < 25 ? 10 : 0), 0, 100))

    const quality = sleepScore >= 80 ? "Excellent" : sleepScore >= 60 ? "Good" : sleepScore >= 40 ? "Fair" : "Poor"
    const status: 'good' | 'warning' | 'danger' = sleepScore >= 70 ? "good" : sleepScore >= 45 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Sleep Quality Score", value: `${sleepScore}/100`, status, description: `${quality} — Fragmentation index: ${fragIndex}%` },
      healthScore: sleepScore,
      metrics: [
        { label: "Overall Score", value: sleepScore, unit: "/100", status },
        { label: "Quality Rating", value: quality, status },
        { label: "Duration Score", value: durScore, unit: "/30", status: durScore >= 24 ? "good" : durScore >= 15 ? "warning" : "danger" },
        { label: "Continuity Score", value: intScore, unit: "/25", status: intScore >= 18 ? "good" : intScore >= 10 ? "warning" : "danger" },
        { label: "Onset Score", value: latScore, unit: "/25", status: latScore >= 18 ? "good" : latScore >= 10 ? "warning" : "danger" },
        { label: "HRV Score", value: hrvScore, unit: "/20", status: hrvScore >= 14 ? "good" : hrvScore >= 8 ? "warning" : "danger" },
        { label: "Fragmentation Index", value: fragIndex, unit: "%", status: fragIndex < 20 ? "good" : fragIndex < 50 ? "warning" : "danger" },
        { label: "Sleep Disorder Risk", value: disorderProb, unit: "%", status: disorderProb < 15 ? "good" : disorderProb < 35 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Sleep Score Breakdown", description: `Score ${sleepScore}/100 (${quality}). Weakest: ${durScore < 20 ? "Duration (" + dur + "hrs) — " : ""}${intScore < 15 ? "Interruptions (" + ints + ") — " : ""}${latScore < 15 ? "Latency (" + lat + "min) — " : ""}${hrvScore < 12 ? "HRV (" + h + "ms)" : ""}. ${sleepScore < 60 ? "Focus on your lowest-scoring component for maximum improvement." : "Good overall sleep quality."}`, priority: "high", category: "Analysis" },
        { title: "Fragmentation", description: `Sleep fragmentation index: ${fragIndex}%. ${fragIndex > 30 ? "High fragmentation reduces restorative deep sleep and REM. Causes: sleep apnea, restless legs, pain, noise, temperature, anxiety. Consider sleep study if >3 awakenings nightly." : "Acceptable fragmentation level."}`, priority: "high", category: "Continuity" },
        { title: "Sleep Disorder Screening", description: `Disorder probability: ${disorderProb}%. ${disorderProb > 25 ? "Elevated risk suggests possible insomnia, sleep apnea, or other disorder. Key indicators: latency >30 min (insomnia), >5 awakenings (sleep apnea), snoring + daytime fatigue (obstructive sleep apnea). Consult sleep specialist." : "Low disorder risk. Continue good sleep hygiene."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Duration": `${dur} hrs (${durScore}/30)`, "Interruptions": `${ints} (${intScore}/25)`, "Latency": `${lat} min (${latScore}/25)`, "HRV": `${h}ms (${hrvScore}/20)`, "Total": `${sleepScore}/100`, "Fragmentation": `${fragIndex}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-quality-score" title="Sleep Quality Score Calculator"
      description="Evaluate sleep quality from duration, interruptions, latency, and HRV. Includes fragmentation index and sleep disorder probability."
      icon={Moon} calculate={calculate} onClear={() => { setSleepDuration(7); setInterruptions(2); setSleepLatency(15); setHrv(45); setResult(null) }}
      values={[sleepDuration, interruptions, sleepLatency, hrv]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Quality Score Calculator" description="Calculate sleep quality score from sleep metrics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Duration" val={sleepDuration} set={setSleepDuration} min={0} max={16} step={0.5} suffix="hours" />
          <NumInput label="Night Interruptions" val={interruptions} set={setInterruptions} min={0} max={20} suffix="times woke up" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Latency" val={sleepLatency} set={setSleepLatency} min={0} max={120} suffix="min to fall asleep" />
          <NumInput label="HRV (if available)" val={hrv} set={setHrv} min={10} max={150} suffix="ms" />
        </div>
      </div>} />
  )
}

// ─── 24. Sleep Efficiency Calculator ────────────────────────────────────────
export function SleepEfficiencyAdvancedCalculator() {
  const [timeInBed, setTimeInBed] = useState(8.5)
  const [actualSleep, setActualSleep] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const tib = clamp(timeInBed, 1, 20)
    const sleep = clamp(actualSleep, 0, tib)

    const efficiency = r1(sleep / tib * 100)
    const wastedTime = r1(tib - sleep)

    const rating = efficiency >= 90 ? "Excellent" : efficiency >= 85 ? "Good" : efficiency >= 75 ? "Moderate" : "Poor"
    const status: 'good' | 'warning' | 'danger' = efficiency >= 85 ? "good" : efficiency >= 75 ? "warning" : "danger"

    // CBT-I recommendation: if efficiency <85%, restrict time in bed
    const adjustedTib = efficiency < 85 ? r1(Math.max(5, sleep + 0.5)) : tib
    const cbtRecommend = efficiency < 85

    setResult({
      primaryMetric: { label: "Sleep Efficiency", value: `${efficiency}%`, status, description: `${rating} — ${sleep}hrs sleep in ${tib}hrs bed` },
      healthScore: r0(efficiency),
      metrics: [
        { label: "Sleep Efficiency", value: efficiency, unit: "%", status },
        { label: "Rating", value: rating, status },
        { label: "Time in Bed", value: tib, unit: "hours", status: "normal" },
        { label: "Actual Sleep", value: sleep, unit: "hours", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" },
        { label: "Time Awake in Bed", value: wastedTime, unit: "hours", status: wastedTime < 0.5 ? "good" : wastedTime < 1 ? "warning" : "danger" },
        ...(cbtRecommend ? [{ label: "CBT-I: Reduce Bed Time To", value: adjustedTib, unit: "hours", status: "warning" as const }] : [])
      ],
      recommendations: [
        { title: "Sleep Efficiency", description: `Efficiency: ${efficiency}% (${rating}). Target: ≥85%. ${efficiency >= 85 ? "Excellent — your bed is associated with sleep, not wakefulness." : `Below target: you spend ${wastedTime} hrs awake in bed. This weakens the bed-sleep association. CBT-I strategy: restrict bed time to ${adjustedTib} hrs and gradually increase as efficiency improves.`}`, priority: "high", category: "Efficiency" },
        { title: "Stimulus Control", description: `${efficiency < 85 ? "Key CBT-I rules: 1) Bed for sleep only (no phones, TV, reading). 2) If awake >15 min, get up. 3) Return only when sleepy. 4) Same wake time daily. 5) No daytime napping. This retrains the brain to associate bed with sleep." : "Good bed-sleep association. Maintain your routine."}`, priority: efficiency < 85 ? "high" : "medium", category: "CBT-I" },
        { title: "Tracking", description: `Track efficiency daily for 2 weeks. Average ≥85% = healthy pattern. If consistently <80% for 3+ weeks despite good sleep hygiene, consider sleep study to rule out sleep apnea, restless legs, or other disorders.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Time in Bed": `${tib} hrs`, "Actual Sleep": `${sleep} hrs`, "Efficiency": `${efficiency}%`, "Awake in Bed": `${wastedTime} hrs`, "Rating": rating }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-efficiency-calculator" title="Sleep Efficiency Calculator"
      description="Calculate sleep efficiency (actual sleep ÷ time in bed). Includes CBT-I bed restriction recommendations and stimulus control strategies."
      icon={Moon} calculate={calculate} onClear={() => { setTimeInBed(8.5); setActualSleep(7); setResult(null) }}
      values={[timeInBed, actualSleep]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Efficiency Calculator" description="Calculate sleep efficiency percentage." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Time in Bed" val={timeInBed} set={setTimeInBed} min={1} max={20} step={0.25} suffix="hours" />
          <NumInput label="Actual Sleep Time" val={actualSleep} set={setActualSleep} min={0} max={20} step={0.25} suffix="hours" />
        </div>
      </div>} />
  )
}

// ─── 25. Power Nap Timer (Alertness Recovery) ───────────────────────────────
export function PowerNapTimerCalculator() {
  const [fatigue, setFatigue] = useState("moderate")
  const [availableTime, setAvailableTime] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const avail = clamp(availableTime, 5, 120)

    const napOptions = [
      { min: 6, label: "Micro Nap", desc: "Improves alertness and declarative memory", inertia: "None", suitable: avail >= 6 },
      { min: 10, label: "Mini Nap", desc: "Reduces sleepiness, increases energy for 2.5 hrs", inertia: "None", suitable: avail >= 10 },
      { min: 20, label: "Power Nap", desc: "Memory consolidation, mood boost, reaction time improvement", inertia: "Minimal (1-2 min)", suitable: avail >= 20 },
      { min: 30, label: "Short Nap", desc: "Entering deep sleep — more recovery but grogginess risk", inertia: "Moderate (15-30 min)", suitable: avail >= 30 },
      { min: 90, label: "Full Cycle", desc: "Complete cycle with REM — creativity, emotional processing", inertia: "Low (wakes at cycle end)", suitable: avail >= 90 }
    ]

    const recommended = fatigue === "severe" ? (avail >= 90 ? napOptions[4] : napOptions[2]) : fatigue === "moderate" ? napOptions[2] : napOptions[1]

    const bestAvailable = [...napOptions].reverse().find(n => n.suitable) || napOptions[0]

    // Sleep inertia probability
    const inertiaProb = recommended.min >= 30 && recommended.min < 90 ? "High" : recommended.min >= 90 ? "Low" : "Very Low"

    setResult({
      primaryMetric: { label: "Recommended Nap", value: `${recommended.min} min`, status: "good", description: `${recommended.label} — ${recommended.desc}` },
      healthScore: 80,
      metrics: [
        { label: "Best Option", value: `${recommended.min} min (${recommended.label})`, status: "good" },
        { label: "Max Available", value: `${bestAvailable.min} min (${bestAvailable.label})`, status: "normal" },
        { label: "Sleep Inertia Risk", value: inertiaProb, status: inertiaProb === "High" ? "warning" : "good" },
        { label: "Expected Inertia", value: recommended.inertia, status: "normal" },
        ...napOptions.filter(n => n.suitable).map(n => ({ label: `${n.label} (${n.min}min)`, value: n.desc, status: "normal" as const }))
      ],
      recommendations: [
        { title: "Nap Selection", description: `Fatigue: ${fatigue}, available: ${avail} min. Best choice: ${recommended.min}-min ${recommended.label}. ${recommended.desc}. NASA study: 26-min nap improved pilot alertness 54% and performance 34%.`, priority: "high", category: "Selection" },
        { title: "Sleep Inertia", description: `Inertia risk: ${inertiaProb}. ${recommended.min >= 30 && recommended.min < 90 ? "30-60 min naps enter deep sleep — waking mid-stage causes 15-30 min grogginess. Either nap <25 min or commit to full 90 min." : "Low inertia risk. You'll wake feeling refreshed within 1-2 min."}`, priority: "high", category: "Timing" },
        { title: "Coffee Nap Hack", description: "For 20-min power nap: drink coffee immediately before napping. Caffeine takes ~20 min to absorb, so you wake just as it kicks in. Studies show this combo is more effective than coffee or nap alone for alertness.", priority: "medium", category: "Advanced" }
      ],
      detailedBreakdown: { "Fatigue": fatigue, "Available": `${avail} min`, "Recommended": `${recommended.min} min (${recommended.label})`, "Inertia": recommended.inertia }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="power-nap-timer" title="Power Nap Timer — Alertness Recovery"
      description="Find the optimal nap duration based on fatigue level and available time. Includes sleep inertia risk and coffee nap technique."
      icon={Clock} calculate={calculate} onClear={() => { setFatigue("moderate"); setAvailableTime(30); setResult(null) }}
      values={[fatigue, availableTime]} result={result}
      seoContent={<SeoContentGenerator title="Power Nap Timer" description="Optimize nap duration for alertness recovery." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Current Fatigue Level" val={fatigue} set={setFatigue} options={[{ value: "mild", label: "Mild — slightly tired" }, { value: "moderate", label: "Moderate — need a boost" }, { value: "severe", label: "Severe — exhausted" }]} />
        <NumInput label="Available Time" val={availableTime} set={setAvailableTime} min={5} max={120} suffix="minutes" />
      </div>} />
  )
}

// ─── 26. Polyphasic Sleep Planner ───────────────────────────────────────────
export function PolyphasicSleepPlanner() {
  const [schedule, setSchedule] = useState("everyman3")
  const [workStart, setWorkStart] = useState("09:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const work = timeToMin(workStart)

    const schedules: Record<string, { name: string; core: number; naps: number; napLen: number; totalSleep: number; difficulty: string; cogRisk: number }> = {
      biphasic: { name: "Biphasic", core: 360, naps: 1, napLen: 20, totalSleep: 380, difficulty: "Easy", cogRisk: 5 },
      everyman2: { name: "Everyman-2", core: 270, naps: 2, napLen: 20, totalSleep: 310, difficulty: "Moderate", cogRisk: 15 },
      everyman3: { name: "Everyman-3", core: 210, naps: 3, napLen: 20, totalSleep: 270, difficulty: "Hard", cogRisk: 30 },
      everyman4: { name: "Everyman-4", core: 90, naps: 4, napLen: 20, totalSleep: 170, difficulty: "Very Hard", cogRisk: 50 },
      uberman: { name: "Uberman", core: 0, naps: 6, napLen: 20, totalSleep: 120, difficulty: "Extreme", cogRisk: 75 },
      dymaxion: { name: "Dymaxion", core: 0, naps: 4, napLen: 30, totalSleep: 120, difficulty: "Extreme", cogRisk: 80 }
    }

    const sched = schedules[schedule] || schedules.everyman3
    const totalHrs = r1(sched.totalSleep / 60)

    // Generate nap schedule
    const coreEnd = work - 120
    const coreStart = coreEnd - sched.core
    const wakeHours = 1440 - sched.totalSleep
    const napGap = sched.naps > 0 ? r0(wakeHours / (sched.naps + 1)) : 0

    const napTimes = []
    for (let i = 1; i <= sched.naps; i++) {
      const napStart = (coreEnd + napGap * i) % 1440
      napTimes.push({ start: fmtTime(napStart), end: fmtTime(napStart + sched.napLen) })
    }

    const adaptDays = sched.cogRisk > 50 ? "21-30+" : sched.cogRisk > 25 ? "14-21" : sched.cogRisk > 10 ? "7-14" : "3-7"

    const status: 'good' | 'warning' | 'danger' = sched.cogRisk < 15 ? "good" : sched.cogRisk < 40 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Schedule", value: sched.name, status, description: `${totalHrs} hrs total — ${sched.core > 0 ? r1(sched.core / 60) + "hr core + " : ""}${sched.naps} × ${sched.napLen}min naps` },
      healthScore: Math.max(0, r0(100 - sched.cogRisk)),
      metrics: [
        { label: "Schedule Type", value: sched.name, status },
        { label: "Total Sleep", value: totalHrs, unit: "hrs/day", status: totalHrs >= 6 ? "good" : totalHrs >= 4 ? "warning" : "danger" },
        ...(sched.core > 0 ? [{ label: "Core Sleep", value: `${fmtTime(coreStart)} – ${fmtTime(coreEnd)}`, status: "good" as const }] : []),
        ...napTimes.map((n, i) => ({ label: `Nap ${i + 1}`, value: `${n.start} – ${n.end}`, status: "normal" as const })),
        { label: "Adaptation Period", value: adaptDays, unit: "days", status: "warning" },
        { label: "Difficulty", value: sched.difficulty, status },
        { label: "Cognitive Risk", value: sched.cogRisk, unit: "%", status }
      ],
      recommendations: [
        { title: "Schedule Details", description: `${sched.name}: ${totalHrs} hrs total sleep. ${sched.core > 0 ? `Core: ${r1(sched.core / 60)} hrs (${fmtTime(coreStart)}–${fmtTime(coreEnd)}).` : "No core sleep — naps only."} ${sched.naps} naps × ${sched.napLen} min spaced every ~${r0(napGap / 60)} hrs. Adaptation: ${adaptDays} days of sleep deprivation before brain adjusts.`, priority: "high", category: "Schedule" },
        { title: "Cognitive Performance", description: `Cognitive risk: ${sched.cogRisk}%. ${sched.cogRisk > 40 ? "WARNING: Extreme schedules (Uberman, Dymaxion) have very high failure rates and can cause serious cognitive impairment, microsleep episodes, and depression. NOT recommended without medical supervision." : sched.cogRisk > 15 ? "Moderate risk — performance may dip during adaptation. Avoid driving or critical tasks during transition." : "Low risk — biphasic is closest to natural human sleep patterns (siesta cultures)."}`, priority: "high", category: "Safety" },
        { title: "Medical Disclaimer", description: "Polyphasic sleep is experimental. Long-term health effects are poorly studied. Most people cannot maintain extreme schedules. Biphasic or Everyman-2 are most sustainable. Never attempt while operating machinery. Consult doctor before starting.", priority: "high", category: "Warning" }
      ],
      detailedBreakdown: { "Type": sched.name, "Core": sched.core > 0 ? `${r1(sched.core / 60)} hrs` : "None", "Naps": `${sched.naps} × ${sched.napLen}min`, "Total": `${totalHrs} hrs`, "Difficulty": sched.difficulty, "Adapt": adaptDays, "Cog Risk": `${sched.cogRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="polyphasic-sleep-planner" title="Polyphasic Sleep Planner"
      description="Explore polyphasic sleep schedules (Biphasic, Everyman, Uberman, Dymaxion). Includes adaptation timeline, cognitive risk assessment, and schedule visualization."
      icon={Clock} calculate={calculate} onClear={() => { setSchedule("everyman3"); setWorkStart("09:00"); setResult(null) }}
      values={[schedule, workStart]} result={result}
      seoContent={<SeoContentGenerator title="Polyphasic Sleep Planner" description="Plan polyphasic sleep schedules with risk assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Sleep Schedule" val={schedule} set={setSchedule} options={[{ value: "biphasic", label: "Biphasic (6hr + 1 nap) — Easy" }, { value: "everyman2", label: "Everyman-2 (4.5hr + 2 naps) — Moderate" }, { value: "everyman3", label: "Everyman-3 (3.5hr + 3 naps) — Hard" }, { value: "everyman4", label: "Everyman-4 (1.5hr + 4 naps) — Very Hard" }, { value: "uberman", label: "Uberman (6 × 20min naps) — Extreme" }, { value: "dymaxion", label: "Dymaxion (4 × 30min naps) — Extreme" }]} />
        <TimeInput label="Work/Commitment Start Time" val={workStart} set={setWorkStart} />
      </div>} />
  )
}

// ─── 27. Shift Work Sleep Planner ───────────────────────────────────────────
export function ShiftWorkSleepPlanner() {
  const [shiftStart, setShiftStart] = useState("22:00")
  const [shiftEnd, setShiftEnd] = useState("06:00")
  const [commuteMin, setCommuteMin] = useState(30)
  const [lightExposure, setLightExposure] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const start = timeToMin(shiftStart)
    const end = timeToMin(shiftEnd)
    const commute = clamp(commuteMin, 0, 120)

    let shiftLen = end - start
    if (shiftLen <= 0) shiftLen += 1440

    const homeArrival = end + commute
    const windDown = homeArrival + 30

    // Sleep window: after getting home + wind down, before next commute
    const nextLeave = start - commute
    const availableSleep = ((nextLeave - windDown) % 1440 + 1440) % 1440
    const recommendedSleep = Math.min(availableSleep - 60, 480) // leave 1hr buffer
    const sleepStart = windDown
    const sleepEnd = sleepStart + recommendedSleep

    // Circadian misalignment
    const nightShift = start >= 1200 || start <= 360 // 8PM-6AM
    const misalignScore = nightShift ? (lightExposure === "high" ? 80 : lightExposure === "moderate" ? 60 : 40) : 20
    const misalignStatus: 'good' | 'warning' | 'danger' = misalignScore > 60 ? "danger" : misalignScore > 35 ? "warning" : "good"

    // Fatigue risk
    const fatigueRisk = r0(clamp(misalignScore * 0.5 + (recommendedSleep < 360 ? 25 : recommendedSleep < 420 ? 10 : 0) + (shiftLen > 720 ? 15 : 0), 0, 100))

    // Light strategy
    const wearSunglasses = nightShift ? `Wear dark sunglasses during commute home (${fmtTime(end)}–${fmtTime(homeArrival)})` : "N/A"
    const seekLight = nightShift ? `Bright light for 30 min at shift start (${fmtTime(start)})` : `Morning light exposure`

    setResult({
      primaryMetric: { label: "Optimal Sleep Window", value: `${fmtTime(sleepStart)} – ${fmtTime(sleepEnd)}`, status: recommendedSleep >= 420 ? "good" : "warning", description: `${r1(recommendedSleep / 60)} hrs — Circadian misalignment: ${misalignScore}%` },
      healthScore: Math.max(0, r0(100 - misalignScore * 0.5 - fatigueRisk * 0.3)),
      metrics: [
        { label: "Shift", value: `${fmtTime(start)} – ${fmtTime(end)}`, status: "normal" },
        { label: "Shift Duration", value: r1(shiftLen / 60), unit: "hrs", status: shiftLen <= 600 ? "good" : shiftLen <= 720 ? "warning" : "danger" },
        { label: "Home Arrival", value: fmtTime(homeArrival), status: "normal" },
        { label: "Sleep Window", value: `${fmtTime(sleepStart)} – ${fmtTime(sleepEnd)}`, status: recommendedSleep >= 420 ? "good" : "warning" },
        { label: "Available Sleep", value: r1(recommendedSleep / 60), unit: "hrs", status: recommendedSleep >= 420 ? "good" : recommendedSleep >= 360 ? "warning" : "danger" },
        { label: "Circadian Misalignment", value: misalignScore, unit: "%", status: misalignStatus },
        { label: "Fatigue Risk", value: fatigueRisk, unit: "%", status: fatigueRisk < 25 ? "good" : fatigueRisk < 50 ? "warning" : "danger" },
        { label: "Night Shift", value: nightShift ? "Yes" : "No", status: nightShift ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Sleep Schedule", description: `After ${fmtTime(end)} shift end: commute (${commute}min) → arrive ${fmtTime(homeArrival)} → wind down → sleep ${fmtTime(sleepStart)} to ${fmtTime(sleepEnd)} (${r1(recommendedSleep / 60)} hrs). Keep this schedule consistent — even on days off shift by no more than 2 hrs.`, priority: "high", category: "Schedule" },
        { title: "Light Management", description: `${nightShift ? "CRITICAL for night workers: " + wearSunglasses + ". This prevents morning light from resetting your clock. " + seekLight + " to maintain alertness. Blackout curtains are essential. Consider melatonin (0.5-3mg) 30 min before daytime sleep." : "Standard light exposure. Get morning sunlight to anchor circadian rhythm."}`, priority: "high", category: "Light" },
        { title: "Fatigue Mitigation", description: `Fatigue risk: ${fatigueRisk}%. ${fatigueRisk > 40 ? "High risk — avoid driving when exhausted. Strategic caffeine: drink 200mg at shift start (not in last 4 hrs). 15-20 min nap during break reduces errors 34%. " : ""}Shift work increases risk of cardiovascular disease, diabetes, and depression. Regular exercise and consistent sleep schedule are protective.`, priority: "medium", category: "Safety" }
      ],
      detailedBreakdown: { "Shift": `${fmtTime(start)}–${fmtTime(end)}`, "Duration": `${r1(shiftLen / 60)} hrs`, "Commute": `${commute} min`, "Sleep": `${fmtTime(sleepStart)}–${fmtTime(sleepEnd)}`, "Sleep Hrs": r1(recommendedSleep / 60), "Misalign": `${misalignScore}%`, "Fatigue": `${fatigueRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="shift-work-sleep-planner" title="Shift Work Sleep Planner"
      description="Optimize sleep for shift workers. Calculates optimal sleep window, circadian misalignment score, fatigue risk, and light exposure strategy."
      icon={Sun} calculate={calculate} onClear={() => { setShiftStart("22:00"); setShiftEnd("06:00"); setCommuteMin(30); setLightExposure("moderate"); setResult(null) }}
      values={[shiftStart, shiftEnd, commuteMin, lightExposure]} result={result}
      seoContent={<SeoContentGenerator title="Shift Work Sleep Planner" description="Plan sleep schedule for shift workers." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Shift Start" val={shiftStart} set={setShiftStart} />
          <TimeInput label="Shift End" val={shiftEnd} set={setShiftEnd} />
        </div>
        <NumInput label="Commute Time" val={commuteMin} set={setCommuteMin} min={0} max={120} suffix="minutes" />
        <SelectInput label="Light Exposure at End of Shift" val={lightExposure} set={setLightExposure} options={[{ value: "low", label: "Low (dark/cloudy)" }, { value: "moderate", label: "Moderate (indirect sunlight)" }, { value: "high", label: "High (bright sunlight)" }]} />
      </div>} />
  )
}
