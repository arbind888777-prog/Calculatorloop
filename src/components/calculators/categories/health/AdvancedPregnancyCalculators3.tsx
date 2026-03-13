"use client"

import { useState } from "react"
import { Baby, Heart, Calendar, Activity, TrendingUp, AlertCircle, Shield } from "lucide-react"
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

function DateInput({ label, val, set }: { label: string; val: string; set: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input type="date" value={val} onChange={e => set(e.target.value)}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

// ─── 16. Baby Kick Counter (Fetal Movement Surveillance) ──────────────────────
export function BabyKickCounter() {
  const [kicks, setKicks] = useState(10)
  const [minutes, setMinutes] = useState(45)
  const [gestWeeks, setGestWeeks] = useState(32)
  const [prevAvgMinutes, setPrevAvgMinutes] = useState(40)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const k = clamp(kicks, 0, 100)
    const m = clamp(minutes, 1, 360)
    const gw = clamp(gestWeeks, 24, 42)
    const prevAvg = clamp(prevAvgMinutes, 5, 360)

    const kicksPerHour = r1((k / m) * 60)
    const timeTo10 = k >= 10 ? r0((10 / k) * m) : m
    const movementScore = r0(clamp((kicksPerHour / 6) * 100, 0, 100))

    // Deviation from baseline
    const deviationPct = prevAvg > 0 ? r0(((m - prevAvg) / prevAvg) * 100) : 0
    const patternDrop = deviationPct > 30

    // Risk stratification
    let status: "good" | "warning" | "danger" = "good"
    let riskLabel = "Normal Activity"
    let color = "Green"

    if (k < 4 && m >= 120) {
      status = "danger"; riskLabel = "Immediate Evaluation Advised"; color = "Purple"
    } else if (k < 6 && m >= 60) {
      status = "danger"; riskLabel = "Low Movement — Urgent Review"; color = "Red"
    } else if (timeTo10 > 120 || kicksPerHour < 4 || patternDrop) {
      status = "warning"; riskLabel = "Slightly Reduced Movement"; color = "Yellow"
    }

    const preterm = gw < 37
    const postTerm = gw > 41

    setResult({
      primaryMetric: { label: "Movement Status", value: riskLabel, status, description: `${k} kicks in ${m} min · ${kicksPerHour} kicks/hr · Score: ${movementScore}/100 · ${color}` },
      metrics: [
        { label: "Kicks Recorded", value: `${k} in ${m} min`, status: "normal" },
        { label: "Kicks Per Hour", value: `${kicksPerHour}`, status: kicksPerHour >= 6 ? "good" : kicksPerHour >= 4 ? "warning" : "danger" },
        { label: "Time to 10 Kicks", value: k >= 10 ? `${timeTo10} min` : `>10 kicks not reached`, status: timeTo10 <= 60 ? "good" : timeTo10 <= 120 ? "warning" : "danger" },
        { label: "Movement Adequacy Score", value: `${movementScore}/100`, status: movementScore >= 70 ? "good" : movementScore >= 40 ? "warning" : "danger" },
        { label: "Baseline Deviation", value: `${deviationPct > 0 ? "+" : ""}${deviationPct}% from avg`, status: patternDrop ? "warning" : "good" },
        { label: "Risk Color", value: color, status }
      ],
      recommendations: [
        { title: color === "Purple" ? "IMMEDIATE: Fetal Evaluation Required" : color === "Red" ? "URGENT: Reduced Movement Alert" : patternDrop ? "Pattern Change Detected" : "Normal Fetal Activity", description: color === "Purple" ? `Only ${k} movements in ${m} minutes with gestational age ${gw}w. This is critically low. Proceed immediately to labor & delivery triage for non-stress test (NST), biophysical profile (BPP), and Doppler assessment. Do NOT wait until tomorrow.` : color === "Red" ? `${k} movements in ${m} minutes is below expected. Lie on left side, drink cold water, recount for 2 hours. If still <10 kicks in 2 hours, present to hospital for NST evaluation. Reduced fetal movement is associated with stillbirth risk.` : patternDrop ? `Movement pattern ${deviationPct}% slower than your baseline (${prevAvg} min average for 10 kicks). A >30% decline warrants monitoring even if absolute count is normal. Track for 2 more sessions; if trend continues, contact your OB.` : `${k} movements in ${m} minutes is reassuring. Normal: ≥10 movements in 2 hours. Your baby is averaging ${kicksPerHour} kicks/hour which is within the healthy range.`, priority: color === "Purple" || color === "Red" ? "high" : patternDrop ? "high" : "low", category: "Fetal Surveillance" },
        { title: "Kick Counting Method", description: "Cardiff 'Count to 10': Start at same time daily (after a meal, when baby is active). Lie on left side or recline. Count distinct movements (kicks, rolls, flutters). Goal: 10 movements within 2 hours. If <10 in 2 hours → contact your provider immediately. Track daily from 28 weeks.", priority: "medium", category: "Method" },
        { title: "Stillbirth Risk Reduction", description: `${gw >= 28 ? "Daily kick counting from 28 weeks reduces late stillbirth risk by 50% (awareness effect)." : "Kick counting most reliable from 28 weeks onward."} ${postTerm ? "Post-term (>41w): Increased stillbirth risk. NST twice weekly and consider induction discussion." : preterm ? "Preterm baby: Fewer movements expected. Pattern consistency matters more than absolute count." : "Maintain daily log. Report any sudden change in pattern to your OB."}`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Kicks": k, "Duration": `${m} min`, "Kicks/hr": kicksPerHour, "Time to 10": k >= 10 ? `${timeTo10} min` : "N/A", "Score": `${movementScore}/100`, "Baseline Deviation": `${deviationPct}%`, "GA": `${gw}w`, "Color": color }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-kick-counter" title="Baby Kick Counter"
      description="Fetal movement surveillance with kick frequency analysis, baseline deviation detection, and stillbirth early-warning alerts."
      icon={Baby} calculate={calculate} onClear={() => { setKicks(10); setMinutes(45); setGestWeeks(32); setPrevAvgMinutes(40); setResult(null) }}
      values={[kicks, minutes, gestWeeks, prevAvgMinutes]} result={result}
      seoContent={<SeoContentGenerator title="Baby Kick Counter" description="Track fetal movements with kick count analysis and stillbirth risk alerts." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Number of Kicks Counted" val={kicks} set={setKicks} min={0} max={100} />
        <NumInput label="Time Taken" val={minutes} set={setMinutes} min={1} max={360} suffix="minutes" />
        <NumInput label="Gestational Week" val={gestWeeks} set={setGestWeeks} min={24} max={42} suffix="weeks" />
        <NumInput label="Your Avg Time for 10 Kicks (baseline)" val={prevAvgMinutes} set={setPrevAvgMinutes} min={5} max={360} suffix="minutes" />
      </div>} />
  )
}

// ─── 17. Contraction Timer (Labor Progress Intelligence) ──────────────────────
export function ContractionTimer() {
  const [duration, setDuration] = useState(45)
  const [interval_, setInterval_] = useState(8)
  const [consistency, setConsistency] = useState("regular")
  const [gestWeeks, setGestWeeks] = useState(39)
  const [cervixDilation, setCervixDilation] = useState(3)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 180)
    const intv = clamp(interval_, 1, 30)
    const gw = clamp(gestWeeks, 24, 42)
    const cx = clamp(cervixDilation, 0, 10)

    const frequency = r1(60 / intv)
    const intervalConsistency = consistency === "regular" ? "Regular (consistent intervals)" : consistency === "somewhat" ? "Somewhat regular" : "Irregular (variable intervals)"

    // 5-1-1 Rule: contractions 5 min apart, lasting 1 min, for 1 hour
    const rule511 = intv <= 5 && dur >= 60
    // 4-1-1 for second+ babies
    const rule411 = intv <= 4 && dur >= 60

    const preterm = gw < 37

    // Active labor probability
    let laborProb = 0
    if (dur >= 60 && intv <= 5 && consistency === "regular") laborProb = 85
    else if (dur >= 45 && intv <= 7 && consistency !== "irregular") laborProb = 55
    else if (dur >= 30 && intv <= 10) laborProb = 30
    else laborProb = 10

    if (cx >= 4) laborProb = Math.min(95, laborProb + 20)
    if (cx >= 6) laborProb = 95

    const braxtonHicks = dur < 30 && intv > 10 && consistency === "irregular"

    let status: "good" | "warning" | "danger" = "good"
    let stageLabel = "Early/Latent Phase"
    if (preterm && dur >= 30 && intv <= 10) {
      status = "danger"; stageLabel = "PRETERM LABOR ALERT"
    } else if (rule511 || cx >= 6) {
      status = "warning"; stageLabel = "Active Labor — Go to Hospital"
    } else if (laborProb >= 50) {
      status = "warning"; stageLabel = "Progressing — Monitor Closely"
    } else if (braxtonHicks) {
      status = "good"; stageLabel = "Likely Braxton Hicks"
    }

    setResult({
      primaryMetric: { label: "Labor Assessment", value: stageLabel, status, description: `${dur}s contractions every ${intv} min · ${frequency}/hr · Active labor probability: ${laborProb}%` },
      metrics: [
        { label: "Duration", value: `${dur} seconds`, status: dur >= 60 ? "warning" : "good" },
        { label: "Interval", value: `Every ${intv} min`, status: intv <= 5 ? "warning" : "good" },
        { label: "Frequency", value: `${frequency}/hour`, status: frequency >= 6 ? "warning" : "normal" },
        { label: "Interval Pattern", value: intervalConsistency, status: consistency === "regular" ? "warning" : "good" },
        { label: "5-1-1 Rule", value: rule511 ? "MET — Go to hospital" : "Not yet met", status: rule511 ? "warning" : "normal" },
        { label: "Active Labor Probability", value: `${laborProb}%`, status: laborProb >= 70 ? "danger" : laborProb >= 40 ? "warning" : "good" }
      ],
      recommendations: [
        { title: preterm ? "PRETERM LABOR — IMMEDIATE ACTION" : rule511 ? "5-1-1 Rule Met — Hospital Time" : braxtonHicks ? "Likely Braxton Hicks" : "Continue Monitoring", description: preterm ? `Contractions at ${gw} weeks (<37w) with ${dur}s duration every ${intv} min: Possible preterm labor. Call your OB or go to L&D immediately. Do NOT wait. Tocolytics, corticosteroids for fetal lung maturity, and magnesium neuroprotection may be indicated.` : rule511 ? `Contractions meeting 5-1-1 criteria (5 min apart, ≥60s duration, for ≥1 hour). Guideline: call your provider and head to the hospital. Bring your hospital bag, ID, and insurance card. Active labor typically begins at 6cm dilation.` : braxtonHicks ? `Short (<30s), irregular contractions >10 min apart are consistent with Braxton Hicks (practice contractions). These are normal from the 2nd trimester. They should resolve with rest, hydration, and position change. No hospital visit needed.` : `Contractions present but not yet meeting active labor criteria. Continue timing. Hydrate, rest, and observe for pattern. If contractions become regular, longer (>60s), and closer (<5 min) for 1+ hour — head to hospital.`, priority: preterm || rule511 ? "high" : "medium", category: preterm ? "Emergency" : "Labor Assessment" },
        { title: "True Labor vs Braxton Hicks", description: "True labor: Regular intervals that get shorter. Duration increases over time (→60-90s). Pain in back → abdomen. Walking intensifies. Cervix dilates. Braxton Hicks: Irregular, <30-45s, relieved by rest/hydration, no cervical change. If uncertain, always contact your provider.", priority: "medium", category: "Education" },
        { title: "Labor Stages Overview", description: `Latent phase: 0-6cm, contractions q5-15min, 30-45s. Active: 6-10cm, q2-5min, 60-90s. Transition: 8-10cm, q1-2min, 60-120s, intense. 2nd stage (pushing): Full dilation to delivery. Current assessment: ${stageLabel} with cervix ${cx}cm.`, priority: "medium", category: "Clinical Guide" }
      ],
      detailedBreakdown: { "Duration": `${dur}s`, "Interval": `${intv} min`, "Frequency": `${frequency}/hr`, "Pattern": consistency, "5-1-1": rule511 ? "Met" : "No", "Labor Prob": `${laborProb}%`, "GA": `${gw}w`, "Cervix": `${cx}cm`, "Stage": stageLabel }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="contraction-timer" title="Contraction Timer"
      description="Labor progress intelligence — true labor vs Braxton Hicks, 5-1-1 rule detection, preterm labor alerts, and active labor probability."
      icon={Activity} calculate={calculate} onClear={() => { setDuration(45); setInterval_(8); setConsistency("regular"); setGestWeeks(39); setCervixDilation(3); setResult(null) }}
      values={[duration, interval_, consistency, gestWeeks, cervixDilation]} result={result}
      seoContent={<SeoContentGenerator title="Contraction Timer" description="Time contractions to assess true labor vs Braxton Hicks." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Contraction Duration" val={duration} set={setDuration} min={10} max={180} suffix="seconds" />
        <NumInput label="Interval Between Contractions" val={interval_} set={setInterval_} min={1} max={30} suffix="minutes" />
        <SelectInput label="Pattern Consistency" val={consistency} set={setConsistency} options={[
          { value: "regular", label: "Regular (consistent intervals)" },
          { value: "somewhat", label: "Somewhat regular" },
          { value: "irregular", label: "Irregular (variable)" }
        ]} />
        <NumInput label="Gestational Week" val={gestWeeks} set={setGestWeeks} min={24} max={42} suffix="weeks" />
        <NumInput label="Last Known Cervix Dilation" val={cervixDilation} set={setCervixDilation} min={0} max={10} suffix="cm" />
      </div>} />
  )
}

// ─── 18. Breastfeeding Calorie Calculator ─────────────────────────────────────
export function BreastfeedingCalorieCalculator() {
  const [preWeight, setPreWeight] = useState(60)
  const [height, setHeight] = useState(160)
  const [age, setAge] = useState(28)
  const [activity, setActivity] = useState("light")
  const [bfType, setBfType] = useState("exclusive")
  const [monthsPostpartum, setMonthsPostpartum] = useState(3)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bmr = 10 * preWeight + 6.25 * height - 5 * age - 161
    const actMult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
    const tdee = r0(bmr * (actMult[activity] ?? 1.375))

    const bfExtra = bfType === "exclusive" ? 500 : bfType === "partial" ? 300 : 0
    const totalCalories = tdee + bfExtra

    const safeLossRate = monthsPostpartum >= 2 ? 0.5 : 0.25
    const deficitForLoss = r0(safeLossRate * 7700 / 30)
    const weightLossCalories = totalCalories - deficitForLoss

    const proteinNeeds = r0(preWeight * 1.3)
    const calciumNeeds = 1000
    const ironNeeds = 9

    const lowIntakeRisk = totalCalories < 1800 && bfType === "exclusive"
    const milkSupplyRisk = totalCalories < 1500

    const preBMI = r1(preWeight / ((height / 100) ** 2))

    const nutrientScore = r0(clamp(
      (totalCalories >= 1800 ? 30 : 15) +
      (bfExtra >= 450 ? 30 : bfExtra >= 250 ? 20 : 10) +
      (preBMI >= 18.5 && preBMI <= 30 ? 20 : 10) +
      (activity !== "sedentary" ? 20 : 10), 0, 100))

    const status: "good" | "warning" | "danger" = milkSupplyRisk ? "danger" : lowIntakeRisk ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Daily Caloric Need", value: `${totalCalories} kcal/day`, status, description: `Base TDEE ${tdee} + ${bfExtra} kcal lactation · Safe weight loss: ${weightLossCalories} kcal/day` },
      metrics: [
        { label: "Base TDEE", value: `${tdee} kcal`, status: "good" },
        { label: "Lactation Extra", value: `+${bfExtra} kcal (${bfType})`, status: "normal" },
        { label: "Total Daily Target", value: `${totalCalories} kcal`, status },
        { label: "Weight Loss Target", value: `${weightLossCalories} kcal/day (−${safeLossRate} kg/wk)`, status: "normal" },
        { label: "Protein Need", value: `${proteinNeeds} g/day`, status: "normal" },
        { label: "Nutrient Adequacy Score", value: `${nutrientScore}/100`, status: nutrientScore >= 70 ? "good" : nutrientScore >= 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Lactation Caloric Needs", description: `Exclusive breastfeeding requires ~500 kcal/day extra (produces ~750 mL milk daily). Partial: +250-300 kcal. Your total: ${totalCalories} kcal. ${milkSupplyRisk ? "⚠ Intake <1500 kcal risks milk supply reduction. Do NOT diet aggressively while breastfeeding." : lowIntakeRisk ? "Intake is marginal for exclusive breastfeeding. Prioritise nutrient-dense foods." : "Caloric intake appears adequate for lactation."}`, priority: milkSupplyRisk ? "high" : "medium", category: "Calories" },
        { title: "Postpartum Weight Loss", description: `Safe rate: ${safeLossRate} kg/week (${monthsPostpartum < 2 ? "conservative in first 6-8 weeks to establish milk supply" : "safe after milk supply established"}). Target: ${weightLossCalories} kcal/day for gradual loss. Never go below 1800 kcal/day if exclusively breastfeeding. Rapid weight loss (>1 kg/wk) releases toxins into breast milk and reduces supply.`, priority: "medium", category: "Weight Management" },
        { title: "Key Nutrients for Lactation", description: `Protein: ${proteinNeeds}g/day (1.3g/kg). Calcium: ${calciumNeeds}mg/day (dairy, fortified foods). Iron: ${ironNeeds}mg/day. DHA: 200mg/day (oily fish 2x/week). Vitamin D: 600 IU. Iodine: 290mcg. Choline: 550mg. Hydration: 3+ litres/day. Foods to include: oats, fennel, brewers yeast (galactagogues).`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Pre-Weight": `${preWeight}kg`, "BMI": preBMI, "TDEE": `${tdee} kcal`, "BF Extra": `+${bfExtra}`, "Total": `${totalCalories} kcal`, "Protein": `${proteinNeeds}g`, "Months PP": monthsPostpartum, "Score": `${nutrientScore}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="breastfeeding-calorie" title="Breastfeeding Calorie Calculator"
      description="Postpartum energy needs with lactation caloric adjustment, safe weight loss rate, milk supply risk, and nutrient adequacy scoring."
      icon={Heart} calculate={calculate} onClear={() => { setPreWeight(60); setHeight(160); setAge(28); setActivity("light"); setBfType("exclusive"); setMonthsPostpartum(3); setResult(null) }}
      values={[preWeight, height, age, activity, bfType, monthsPostpartum]} result={result}
      seoContent={<SeoContentGenerator title="Breastfeeding Calorie Calculator" description="Calculate daily calorie needs during breastfeeding with lactation nutrition." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Pre-Pregnancy Weight" val={preWeight} set={setPreWeight} min={35} max={200} suffix="kg" />
        <NumInput label="Height" val={height} set={setHeight} min={130} max={210} suffix="cm" />
        <NumInput label="Age" val={age} set={setAge} min={15} max={55} suffix="years" />
        <SelectInput label="Activity Level" val={activity} set={setActivity} options={[
          { value: "sedentary", label: "Sedentary" },
          { value: "light", label: "Lightly Active" },
          { value: "moderate", label: "Moderately Active" },
          { value: "active", label: "Very Active" }
        ]} />
        <SelectInput label="Breastfeeding Type" val={bfType} set={setBfType} options={[
          { value: "exclusive", label: "Exclusive Breastfeeding" },
          { value: "partial", label: "Partial / Mixed Feeding" },
          { value: "none", label: "Not Breastfeeding" }
        ]} />
        <NumInput label="Months Postpartum" val={monthsPostpartum} set={setMonthsPostpartum} min={0} max={24} />
      </div>} />
  )
}

// ─── 19. Pregnancy Appointment Schedule ───────────────────────────────────────
export function PregnancyAppointmentSchedule() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [highRisk, setHighRisk] = useState("no")
  const [multiples, setMultiples] = useState("single")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    if (isNaN(lmp.getTime())) return
    const now = new Date()
    const daysPregnant = Math.floor((now.getTime() - lmp.getTime()) / 86400000)
    const currentWeek = Math.floor(daysPregnant / 7)

    const edd = new Date(lmp)
    edd.setDate(edd.getDate() + 280)
    const eddStr = edd.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })

    const makeDate = (week: number) => {
      const d = new Date(lmp)
      d.setDate(d.getDate() + week * 7)
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    }

    const isHR = highRisk === "yes"
    const isTwin = multiples !== "single"

    // Standard visit schedule
    const visits = [
      { week: 8, label: "First prenatal visit + dating scan", done: currentWeek >= 8 },
      { week: 10, label: "NT scan + NIPT blood test (10-14w)", done: currentWeek >= 14 },
      { week: 12, label: "First trimester screening results", done: currentWeek >= 12 },
      { week: 16, label: "Routine checkup + AFP/quad screen option", done: currentWeek >= 16 },
      { week: 20, label: "Anatomy (anomaly) ultrasound (18-20w)", done: currentWeek >= 20 },
      { week: 24, label: "Routine + start kick counts from 28w", done: currentWeek >= 24 },
      { week: 26, label: "Glucose Tolerance Test (GTT) (24-28w)", done: currentWeek >= 28 },
      { week: 28, label: "Tdap vaccine + Anti-D (if Rh−) + biweekly visits start", done: currentWeek >= 28 },
      { week: 30, label: "Growth scan (if high-risk/twins)", done: currentWeek >= 30 },
      { week: 32, label: "Biweekly visit + position check", done: currentWeek >= 32 },
      { week: 34, label: "Biweekly visit", done: currentWeek >= 34 },
      { week: 36, label: "Weekly visits begin + GBS culture (35-37w)", done: currentWeek >= 36 },
      { week: 37, label: "Weekly visit + birth plan discussion", done: currentWeek >= 37 },
      { week: 38, label: "Weekly visit + cervical check (optional)", done: currentWeek >= 38 },
      { week: 39, label: "Weekly visit + NST if indicated", done: currentWeek >= 39 },
      { week: 40, label: "Due date week + induction discussion if needed", done: currentWeek >= 40 }
    ]

    const upcoming = visits.filter(v => !v.done)
    const nextVisit = upcoming.length > 0 ? upcoming[0] : null
    const totalVisits = isHR || isTwin ? "14-18 visits" : "12-14 visits"

    const urgentTests: string[] = []
    if (currentWeek >= 10 && currentWeek <= 14) urgentTests.push("NT scan + NIPT due NOW")
    if (currentWeek >= 18 && currentWeek <= 20) urgentTests.push("Anatomy ultrasound due NOW")
    if (currentWeek >= 24 && currentWeek <= 28) urgentTests.push("GTT screening due NOW")
    if (currentWeek >= 27 && currentWeek <= 29) urgentTests.push("Tdap vaccine due NOW")
    if (currentWeek >= 35 && currentWeek <= 37) urgentTests.push("GBS culture due NOW")

    const status: "good" | "warning" | "danger" = urgentTests.length > 0 ? "warning" : "good"

    const scheduleStr = upcoming.slice(0, 4).map(v => `W${v.week}: ${v.label} (${makeDate(v.week)})`).join(" │ ")

    setResult({
      primaryMetric: { label: "Next Appointment", value: nextVisit ? `Week ${nextVisit.week} — ${makeDate(nextVisit.week)}` : "All visits completed", status, description: `Currently ${currentWeek}w · EDD: ${eddStr} · ${totalVisits} total` },
      metrics: [
        { label: "Current Week", value: `${currentWeek} weeks`, status: "good" },
        { label: "EDD", value: eddStr, status: "good" },
        { label: "Next Visit", value: nextVisit ? `W${nextVisit.week}: ${nextVisit.label}` : "Complete", status: "normal" },
        { label: "Urgent Tests", value: urgentTests.length > 0 ? urgentTests.join(", ") : "None currently", status: urgentTests.length > 0 ? "warning" : "good" },
        { label: "Visit Frequency", value: currentWeek < 28 ? "Monthly" : currentWeek < 36 ? "Biweekly" : "Weekly", status: "normal" },
        { label: "Risk Level", value: isHR ? "High Risk — more frequent visits" : isTwin ? "Multiple Pregnancy — enhanced monitoring" : "Standard care", status: isHR || isTwin ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Upcoming Schedule", description: scheduleStr || "No upcoming visits remaining.", priority: "high", category: "Appointments" },
        { title: "Key Screening Timeline", description: `W8-10: Dating ultrasound. W10-14: NT scan + NIPT. W15-18: Quad/AFP screen (optional if NIPT done). W18-20: Anatomy ultrasound. W24-28: GTT (gestational diabetes). W27-28: Tdap vaccine. W35-37: GBS culture. ${isHR ? "High-risk: Additional growth scans at 28, 32, 36w. Weekly NST from 32-34w." : ""} ${isTwin ? "Twins: Scans every 2-4 weeks from 16w. More frequent from 28w." : ""}`, priority: "high", category: "Screening Calendar" },
        { title: "Visit Frequency Guide", description: "Standard: Monthly until 28w → Biweekly 28-36w → Weekly 36w+. High-risk: Biweekly from 20w, weekly from 32-34w. Twins: Biweekly from 20w, weekly from 28-30w. Never miss GTT (24-28w) or GBS (35-37w) windows.", priority: "medium", category: "Frequency" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "Current Week": currentWeek, "EDD": eddStr, "Next": nextVisit ? `W${nextVisit.week}` : "Done", "Urgent Tests": urgentTests.length || "None", "Total Visits": totalVisits }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-appointment-schedule" title="Pregnancy Appointment Schedule"
      description="OB timeline planner — prenatal visit schedule, screening windows, vaccine timing, and high-risk/twin enhanced monitoring."
      icon={Calendar} calculate={calculate} onClear={() => { setLmpDate(today); setHighRisk("no"); setMultiples("single"); setResult(null) }}
      values={[lmpDate, highRisk, multiples]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Appointment Schedule" description="Prenatal visit schedule planner with screening and test reminders." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Period (LMP)" val={lmpDate} set={setLmpDate} />
        <SelectInput label="High-Risk Pregnancy?" val={highRisk} set={setHighRisk} options={[
          { value: "no", label: "No — Standard risk" },
          { value: "yes", label: "Yes — High risk (GD, HTN, AMA, etc.)" }
        ]} />
        <SelectInput label="Number of Babies" val={multiples} set={setMultiples} options={[
          { value: "single", label: "Singleton" },
          { value: "twin", label: "Twins" },
          { value: "triplet", label: "Triplets+" }
        ]} />
      </div>} />
  )
}

// ─── 20. Fertility Score Estimator ────────────────────────────────────────────
export function FertilityScoreCalculator() {
  const [age, setAge] = useState(28)
  const [cycleReg, setCycleReg] = useState("regular")
  const [bmi, setBmi] = useState(23)
  const [amh, setAmh] = useState(2.5)
  const [amhKnown, setAmhKnown] = useState("no")
  const [smoking, setSmoking] = useState("no")
  const [alcohol, setAlcohol] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 100

    // Age factor (biggest impact)
    if (age < 30) score -= 0
    else if (age < 35) score -= 10
    else if (age < 38) score -= 25
    else if (age < 40) score -= 40
    else if (age < 43) score -= 55
    else score -= 75

    // Cycle regularity
    if (cycleReg === "irregular") score -= 15
    else if (cycleReg === "absent") score -= 30

    // BMI
    if (bmi < 18.5) score -= 12
    else if (bmi >= 30) score -= 15
    else if (bmi >= 25) score -= 5

    // AMH (if known)
    if (amhKnown === "yes") {
      if (amh < 0.5) score -= 25
      else if (amh < 1.0) score -= 15
      else if (amh < 1.5) score -= 8
      else if (amh > 5.0) score -= 5 // possible PCOS
    }

    // Lifestyle
    if (smoking === "yes") score -= 12
    if (alcohol === "heavy") score -= 8
    else if (alcohol === "moderate") score -= 3

    score = clamp(score, 0, 100)

    const monthlyProb = age < 25 ? 33 : age < 30 ? 28 : age < 35 ? 22 : age < 38 ? 15 : age < 42 ? 8 : 3
    const lifestyleAdj = (smoking === "yes" ? 0.85 : 1) * (alcohol === "heavy" ? 0.9 : 1) * (cycleReg === "irregular" ? 0.7 : cycleReg === "absent" ? 0.3 : 1)
    const adjMonthlyProb = r0(monthlyProb * lifestyleAdj)

    const cum6 = r0((1 - Math.pow(1 - adjMonthlyProb / 100, 6)) * 100)
    const cum12 = r0((1 - Math.pow(1 - adjMonthlyProb / 100, 12)) * 100)

    const ovarianReserveFlag = amhKnown === "yes" && amh < 1.0
    const pcosSuspicion = amhKnown === "yes" && amh > 5.0 && cycleReg === "irregular"

    let status: "good" | "warning" | "danger" = score >= 65 ? "good" : score >= 35 ? "warning" : "danger"
    let label = score >= 75 ? "High Fertility" : score >= 50 ? "Good Fertility" : score >= 35 ? "Moderate — Some Concerns" : "Reduced Fertility"
    let color = score >= 65 ? "Green" : score >= 35 ? "Yellow" : "Red"

    setResult({
      primaryMetric: { label: "Fertility Score", value: `${score}/100`, status, description: `${label} · Monthly probability: ~${adjMonthlyProb}% · ${color}` },
      metrics: [
        { label: "Fertility Score", value: `${score}/100`, status },
        { label: "Monthly Conception Probability", value: `~${adjMonthlyProb}%`, status: adjMonthlyProb >= 18 ? "good" : adjMonthlyProb >= 8 ? "warning" : "danger" },
        { label: "6-Month Cumulative", value: `~${cum6}%`, status: cum6 >= 60 ? "good" : cum6 >= 35 ? "warning" : "danger" },
        { label: "12-Month Cumulative", value: `~${cum12}%`, status: cum12 >= 80 ? "good" : cum12 >= 50 ? "warning" : "danger" },
        { label: "Ovarian Reserve", value: ovarianReserveFlag ? "Low (AMH <1.0) — Flag" : amhKnown === "yes" ? `AMH ${amh} ng/mL — ${amh >= 1.5 ? "Normal" : "Borderline"}` : "Not tested", status: ovarianReserveFlag ? "danger" : "normal" },
        { label: "PCOS Suspicion", value: pcosSuspicion ? "Possible — AMH high + irregular" : "Not detected", status: pcosSuspicion ? "warning" : "good" }
      ],
      recommendations: [
        { title: `Age ${age}: Fertility Outlook`, description: `Per-cycle probability ~${adjMonthlyProb}% with optimal timing. ${age >= 35 ? `After 35, oocyte quality declines significantly. Seek evaluation if no conception in 6 months. Consider AMH + AFC testing for ovarian reserve.` : age >= 40 ? `After 40, per-cycle rates drop below 10%. IVF success rates also decline. Early and aggressive fertility treatment is recommended.` : `Under 35: ~85% conceive within 12 months. Seek evaluation if no conception after 12 months of regular timed intercourse. Lifestyle optimisation is the primary intervention.`}`, priority: "high", category: "Age Advisory" },
        { title: ovarianReserveFlag ? "Low Ovarian Reserve — REI Referral" : pcosSuspicion ? "PCOS Suspicion — GYN Evaluation" : "Fertility Optimization", description: ovarianReserveFlag ? "AMH <1.0 ng/mL indicates diminished ovarian reserve (DOR). This means fewer eggs remain. Time is critical. Referral to Reproductive Endocrinology & Infertility (REI) specialist recommended. IVF with aggressive stimulation or donor egg discussion may be needed." : pcosSuspicion ? "High AMH (>5.0) + irregular cycles suggests PCOS. Tests: LH:FSH ratio, testosterone, fasting insulin, pelvic ultrasound. Metformin, letrozole, or lifestyle modification (10% weight loss) can restore ovulation." : `Score ${score}/100: ${label}. ${smoking === "yes" ? "Quit smoking (reduces fertility by 15%)." : ""} ${bmi < 18.5 || bmi >= 30 ? "Optimise BMI to 18.5-25 range." : ""} Folate 400mcg, Vitamin D 600IU, CoQ10 200mg may improve egg quality.`, priority: ovarianReserveFlag || pcosSuspicion ? "high" : "medium", category: ovarianReserveFlag ? "Specialist Referral" : pcosSuspicion ? "PCOS" : "Optimisation" },
        { title: "When to Seek Help", description: `Age <35: After 12 months of unprotected intercourse. Age 35-39: After 6 months. Age ≥40: Immediate consultation. Always seek earlier if: irregular cycles, known endometriosis, prior pelvic surgery, partner sperm concerns, or two or more miscarriages.`, priority: "medium", category: "REI Guidance" }
      ],
      detailedBreakdown: { "Age": age, "Score": `${score}/100`, "Monthly Prob": `~${adjMonthlyProb}%`, "6-Mo": `~${cum6}%`, "12-Mo": `~${cum12}%`, "BMI": bmi, "AMH": amhKnown === "yes" ? `${amh} ng/mL` : "N/A", "Cycle": cycleReg }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fertility-score-calculator" title="Fertility Score Estimator"
      description="Multi-factor reproductive potential score — age, cycle regularity, BMI, AMH, and lifestyle factors with PCOS/DOR flagging."
      icon={TrendingUp} calculate={calculate} onClear={() => { setAge(28); setCycleReg("regular"); setBmi(23); setAmh(2.5); setAmhKnown("no"); setSmoking("no"); setAlcohol("none"); setResult(null) }}
      values={[age, cycleReg, bmi, amh, amhKnown, smoking, alcohol]} result={result}
      seoContent={<SeoContentGenerator title="Fertility Score Estimator" description="Evaluate conception probability with multi-factor fertility scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Age" val={age} set={setAge} min={18} max={50} suffix="years" />
        <SelectInput label="Cycle Regularity" val={cycleReg} set={setCycleReg} options={[
          { value: "regular", label: "Regular (21-35 day cycles)" },
          { value: "irregular", label: "Irregular (varies >7 days)" },
          { value: "absent", label: "Absent / Amenorrhea" }
        ]} />
        <NumInput label="BMI" val={bmi} set={setBmi} min={14} max={55} step={0.1} />
        <SelectInput label="AMH Test Done?" val={amhKnown} set={setAmhKnown} options={[
          { value: "no", label: "No / Don't know" },
          { value: "yes", label: "Yes — I have my AMH value" }
        ]} />
        {amhKnown === "yes" && <NumInput label="AMH Value" val={amh} set={setAmh} min={0.01} max={20} step={0.1} suffix="ng/mL" />}
        <SelectInput label="Smoking" val={smoking} set={setSmoking} options={[
          { value: "no", label: "No" }, { value: "yes", label: "Yes" }
        ]} />
        <SelectInput label="Alcohol" val={alcohol} set={setAlcohol} options={[
          { value: "none", label: "None" }, { value: "moderate", label: "Moderate (1-2/week)" }, { value: "heavy", label: "Heavy (>3/week)" }
        ]} />
      </div>} />
  )
}

// ─── 21. Luteal Phase Calculator ──────────────────────────────────────────────
export function LutealPhaseCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [ovulationDate, setOvulationDate] = useState(today)
  const [nextPeriodDate, setNextPeriodDate] = useState(today)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ov = new Date(ovulationDate)
    const np = new Date(nextPeriodDate)
    if (isNaN(ov.getTime()) || isNaN(np.getTime())) return

    const lutealDays = Math.floor((np.getTime() - ov.getTime()) / 86400000)

    if (lutealDays < 1 || lutealDays > 25) {
      setResult({
        primaryMetric: { label: "Error", value: "Invalid dates", status: "danger", description: "Next period must be after ovulation date, and within 25 days." },
        metrics: [], recommendations: [], detailedBreakdown: {}
      })
      return
    }

    const deficient = lutealDays < 10
    const short = lutealDays < 12
    const normal = lutealDays >= 12 && lutealDays <= 16
    const long = lutealDays > 16

    const implantationWindow = lutealDays >= 8 && lutealDays >= 10

    let status: "good" | "warning" | "danger" = deficient ? "danger" : short ? "warning" : "good"
    let label = deficient ? "Luteal Phase Deficiency (<10 days)" : short ? "Short Luteal Phase (10-11 days)" : normal ? "Normal Luteal Phase" : "Long Luteal Phase (>16 days)"

    const implantProb = deficient ? "Very low — insufficient for implantation" : short ? "Reduced — borderline progesterone support" : "Adequate — normal implantation window"

    setResult({
      primaryMetric: { label: "Luteal Phase Length", value: `${lutealDays} days`, status, description: `${label} · Normal range: 12–16 days` },
      metrics: [
        { label: "Luteal Phase Duration", value: `${lutealDays} days`, status },
        { label: "Classification", value: label, status },
        { label: "Implantation Probability", value: implantProb, status: deficient ? "danger" : short ? "warning" : "good" },
        { label: "Ovulation Date", value: ov.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), status: "normal" },
        { label: "Next Period", value: np.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), status: "normal" },
        { label: "Progesterone Concern", value: deficient ? "High — testing needed" : short ? "Moderate — monitor" : "Low", status }
      ],
      recommendations: [
        { title: deficient ? "Luteal Phase Deficiency — Action Needed" : short ? "Short Luteal Phase Advisory" : long ? "Long Luteal Phase Note" : "Normal Luteal Phase", description: deficient ? `Luteal phase of ${lutealDays} days is insufficient for embryo implantation. The fertilised egg needs 6-10 days post-ovulation to implant. Low progesterone is the usual cause. Recommended: Day 21 serum progesterone (should be >10 ng/mL). If low, exogenous progesterone (vaginal/oral) from 3 DPO through early pregnancy is the treatment.` : short ? `Luteal phase of ${lutealDays} days is borderline. While pregnancies can occur, implantation success is reduced. Track for 3 cycles; if consistently <12 days, request progesterone testing. Vitamin B6 (100mg/day), Vitex (chasteberry 20mg), and vitamin C (750mg) have some evidence for lengthening the luteal phase.` : long ? `Luteal phase of ${lutealDays} days is slightly long. If consistently >16 days without pregnancy, consider checking for luteinised unruptured follicle syndrome or early pregnancy. An hCG blood test may be indicated.` : `Luteal phase of ${lutealDays} days is within the ideal 12-16 day range, indicating adequate progesterone production and sufficient time for embryo implantation.`, priority: deficient ? "high" : short ? "high" : "low", category: "Luteal Assessment" },
        { title: "Clinical Testing", description: `Key test: Serum progesterone on day 21 of the cycle (or 7 DPO). Normal: >10 ng/mL (>32 nmol/L). Low progesterone: <10 ng/mL → confirms LPD. Endometrial biopsy (rarely needed): checks for maturation delay. ${deficient ? "With luteal phase <10 days, testing is strongly recommended." : ""}`, priority: deficient ? "high" : "medium", category: "Diagnostics" }
      ],
      detailedBreakdown: { "Ovulation": ovulationDate, "Next Period": nextPeriodDate, "Luteal Days": lutealDays, "Status": label }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="luteal-phase-calculator" title="Luteal Phase Calculator"
      description="Assess post-ovulation progesterone phase duration with implantation probability, LPD flagging, and progesterone testing guidance."
      icon={Calendar} calculate={calculate} onClear={() => { setOvulationDate(today); setNextPeriodDate(today); setResult(null) }}
      values={[ovulationDate, nextPeriodDate]} result={result}
      seoContent={<SeoContentGenerator title="Luteal Phase Calculator" description="Calculate luteal phase length and assess progesterone adequacy." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Ovulation Date" val={ovulationDate} set={setOvulationDate} />
        <DateInput label="Next Period Start Date" val={nextPeriodDate} set={setNextPeriodDate} />
      </div>} />
  )
}

// ─── 22. Follicular Phase Tracker ─────────────────────────────────────────────
export function FollicularPhaseTracker() {
  const today = new Date().toISOString().split("T")[0]
  const [periodStart, setPeriodStart] = useState(today)
  const [ovulationDate, setOvulationDate] = useState(today)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ps = new Date(periodStart)
    const ov = new Date(ovulationDate)
    if (isNaN(ps.getTime()) || isNaN(ov.getTime())) return

    const follicularDays = Math.floor((ov.getTime() - ps.getTime()) / 86400000)

    if (follicularDays < 5 || follicularDays > 40) {
      setResult({
        primaryMetric: { label: "Error", value: "Invalid dates", status: "danger", description: "Ovulation must be 5-40 days after period start." },
        metrics: [], recommendations: [], detailedBreakdown: {}
      })
      return
    }

    const short = follicularDays < 10
    const normal = follicularDays >= 10 && follicularDays <= 21
    const long = follicularDays > 21

    let status: "good" | "warning" | "danger" = short || long ? "warning" : "good"
    let label = short ? "Short Follicular Phase (<10 days)" : normal ? "Normal Follicular Phase" : "Long Follicular Phase (>21 days)"

    const hormonePhases = [
      { day: "Day 1-5", label: "Menstrual — FSH rising, recruits follicles" },
      { day: "Day 5-7", label: "Dominant follicle selection" },
      { day: `Day 7-${follicularDays - 2}`, label: "Estrogen rising — endometrium building" },
      { day: `Day ${follicularDays - 1}-${follicularDays}`, label: "LH surge → Ovulation" }
    ]

    setResult({
      primaryMetric: { label: "Follicular Phase Length", value: `${follicularDays} days`, status, description: `${label} · Normal range: 10–21 days` },
      metrics: [
        { label: "Follicular Phase", value: `${follicularDays} days`, status },
        { label: "Classification", value: label, status },
        { label: "Period Start", value: ps.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), status: "normal" },
        { label: "Ovulation Date", value: ov.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), status: "normal" },
        { label: "Estimated LH Surge", value: `Day ${follicularDays - 1}`, status: "normal" },
        { label: "Irregularity Flag", value: short || long ? "Detected" : "None", status: short || long ? "warning" : "good" }
      ],
      recommendations: [
        { title: short ? "Short Follicular Phase Alert" : long ? "Long Follicular Phase Alert" : "Normal Follicular Phase", description: short ? `Follicular phase of ${follicularDays} days is short. This may indicate diminished ovarian reserve (ovary recruiting follicles faster) or perimenopause. FSH on day 3 of the cycle is the key diagnostic test. Normal FSH: <10 IU/L. If consistently short, AMH testing recommended.` : long ? `Follicular phase of ${follicularDays} days is prolonged. Common causes: PCOS (delayed or absent ovulation), hypothyroidism, hyperprolactinemia, stress/functional hypothalamic amenorrhea. Testing: FSH, LH, LH:FSH ratio, TSH, prolactin, testosterone. Pelvic ultrasound for antral follicle count.` : `Follicular phase of ${follicularDays} days is within normal range (10-21 days). Ovulation timing is consistent with healthy hormonal function. The variable-length follicular phase is what makes cycle lengths differ between women.`, priority: short || long ? "high" : "low", category: "Phase Assessment" },
        { title: "Hormonal Timeline", description: hormonePhases.map(h => `${h.day}: ${h.label}`).join(". "), priority: "medium", category: "Hormonal Phases" }
      ],
      detailedBreakdown: { "Period Start": periodStart, "Ovulation": ovulationDate, "Follicular Days": follicularDays, "Status": label }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="follicular-phase-tracker" title="Follicular Phase Tracker"
      description="Track the first half of your cycle — follicular phase length with short/long irregularity flags and hormonal phase timeline."
      icon={Calendar} calculate={calculate} onClear={() => { setPeriodStart(today); setOvulationDate(today); setResult(null) }}
      values={[periodStart, ovulationDate]} result={result}
      seoContent={<SeoContentGenerator title="Follicular Phase Tracker" description="Track follicular phase length and hormonal cycle health." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Period Start Date" val={periodStart} set={setPeriodStart} />
        <DateInput label="Ovulation Date" val={ovulationDate} set={setOvulationDate} />
      </div>} />
  )
}

// ─── 23. Cervical Mucus Tracker ───────────────────────────────────────────────
export function CervicalMucusTracker() {
  const [cycleDay, setCycleDay] = useState(14)
  const [mucusType, setMucusType] = useState("eggwhite")
  const [consistency, setConsistency] = useState("stretchy")
  const [amount, setAmount] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const day = clamp(cycleDay, 1, 50)

    const mucusScores: Record<string, number> = {
      dry: 1, sticky: 2, creamy: 3, watery: 4, eggwhite: 5
    }
    const consistencyScores: Record<string, number> = {
      thick: 1, tacky: 2, smooth: 3, slippery: 4, stretchy: 5
    }
    const amountScores: Record<string, number> = {
      none: 0, scant: 1, moderate: 2, copious: 3
    }

    const baseScore = (mucusScores[mucusType] ?? 1) + (consistencyScores[consistency] ?? 1) + (amountScores[amount] ?? 0)
    const fertilityScore = r0(clamp((baseScore / 13) * 100, 0, 100))

    const peakFertile = mucusType === "eggwhite" && consistency === "stretchy"
    const nearPeak = mucusType === "watery" || (mucusType === "eggwhite" && consistency !== "stretchy")
    const lowFertility = mucusType === "dry" || mucusType === "sticky"

    let status: "good" | "warning" | "danger" = peakFertile ? "good" : nearPeak ? "warning" : "normal" as "good"
    if (lowFertility) status = "good" // not concerning, just low fertility

    const ovulationProb = peakFertile ? "Very high (85-95%)" : nearPeak ? "Moderate (50-70%)" : mucusType === "creamy" ? "Low-moderate (20-40%)" : "Low (<15%)"

    const label = peakFertile ? "Peak Fertility — Optimal Day" : nearPeak ? "Near Peak — High Fertility" : mucusType === "creamy" ? "Moderate Fertility" : "Low Fertility"
    const displayStatus: "good" | "warning" | "danger" = peakFertile ? "good" : nearPeak ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Fertility Status", value: label, status: displayStatus, description: `Mucus: ${mucusType} · Score: ${fertilityScore}/100 · Ovulation probability: ${ovulationProb}` },
      metrics: [
        { label: "Cycle Day", value: `Day ${day}`, status: "normal" },
        { label: "Mucus Type", value: mucusType.charAt(0).toUpperCase() + mucusType.slice(1), status: peakFertile ? "good" : "normal" },
        { label: "Fertility Score", value: `${fertilityScore}/100`, status: fertilityScore >= 70 ? "good" : fertilityScore >= 40 ? "warning" : "normal" as "good" },
        { label: "Ovulation Probability", value: ovulationProb, status: displayStatus },
        { label: "Consistency", value: consistency, status: "normal" },
        { label: "Amount", value: amount, status: "normal" }
      ],
      recommendations: [
        { title: peakFertile ? "Peak Fertility Day — Optimal Timing" : nearPeak ? "Approaching Peak — Fertile Window" : "Continue Monitoring", description: peakFertile ? "Egg-white cervical mucus (EWCM) that is stretchy and clear = peak fertility. Ovulation is likely within 24-48 hours. This is the best day for conception. Sperm can survive up to 5 days in fertile mucus. Intercourse today and tomorrow maximises chances." : nearPeak ? "Watery or non-stretchy egg-white mucus indicates approaching ovulation. You are in the fertile window. Intercourse every 1-2 days is recommended. Watch for progression to stretchy EWCM (peak day)." : "Current mucus pattern suggests low/moderate fertility. Continue observing daily. EWCM typically appears 1-3 days before ovulation. Staying hydrated improves mucus production.", priority: peakFertile || nearPeak ? "high" : "low", category: "Timing" },
        { title: "Cervical Mucus Pattern Guide", description: "Post-period: Dry (infertile). Days later: Sticky/thick (low fertility). Approaching ovulation: Creamy/lotion-like (moderate). Pre-ovulation: Watery (fertile). Ovulation day: Egg-white, stretchy, clear (peak). Post-ovulation: Returns to dry/sticky (luteal phase). Tracking over 3 cycles reveals your personal pattern.", priority: "medium", category: "Education" },
        { title: "Natural Family Planning", description: "Billings Ovulation Method and Creighton Model rely on cervical mucus tracking. Combined with BBT and cycle day tracking (Symptothermal Method), effectiveness reaches 95-99% for avoiding pregnancy when rules are followed. For conception: target intercourse on egg-white mucus days.", priority: "low", category: "NFP" }
      ],
      detailedBreakdown: { "Day": day, "Mucus": mucusType, "Consistency": consistency, "Amount": amount, "Score": `${fertilityScore}/100`, "Ovulation Prob": ovulationProb }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cervical-mucus-tracker" title="Cervical Mucus Tracker"
      description="Ovulation biomarker monitor — daily cervical mucus fertility scoring, ovulation confirmation probability, and natural family planning guide."
      icon={Activity} calculate={calculate} onClear={() => { setCycleDay(14); setMucusType("eggwhite"); setConsistency("stretchy"); setAmount("moderate"); setResult(null) }}
      values={[cycleDay, mucusType, consistency, amount]} result={result}
      seoContent={<SeoContentGenerator title="Cervical Mucus Tracker" description="Track cervical mucus patterns for ovulation detection and fertility scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Cycle Day" val={cycleDay} set={setCycleDay} min={1} max={50} />
        <SelectInput label="Mucus Type" val={mucusType} set={setMucusType} options={[
          { value: "dry", label: "Dry / No mucus" },
          { value: "sticky", label: "Sticky / Tacky" },
          { value: "creamy", label: "Creamy / Lotion-like" },
          { value: "watery", label: "Watery / Thin" },
          { value: "eggwhite", label: "Egg-white / Clear" }
        ]} />
        <SelectInput label="Consistency" val={consistency} set={setConsistency} options={[
          { value: "thick", label: "Thick / Pasty" },
          { value: "tacky", label: "Tacky" },
          { value: "smooth", label: "Smooth" },
          { value: "slippery", label: "Slippery" },
          { value: "stretchy", label: "Stretchy (spinnbarkeit)" }
        ]} />
        <SelectInput label="Amount" val={amount} set={setAmount} options={[
          { value: "none", label: "None" },
          { value: "scant", label: "Scant" },
          { value: "moderate", label: "Moderate" },
          { value: "copious", label: "Copious" }
        ]} />
      </div>} />
  )
}

// ─── 24. Basal Body Temperature Tracker ───────────────────────────────────────
export function BasalBodyTempTracker() {
  const [preBBT, setPreBBT] = useState(36.3)
  const [postBBT, setPostBBT] = useState(36.7)
  const [cycleDay, setCycleDay] = useState(16)
  const [wakeTime, setWakeTime] = useState("06:30")
  const [consistentWake, setConsistentWake] = useState("yes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pre = clamp(preBBT, 35, 38)
    const post = clamp(postBBT, 35, 39)
    const shift = r2(post - pre)
    const day = clamp(cycleDay, 1, 50)

    const ovulationConfirmed = shift >= 0.3 && shift <= 1.0
    const strongShift = shift >= 0.5
    const noShift = shift < 0.2
    const anovulatory = noShift && day >= 18

    const biphasic = ovulationConfirmed
    const monophasic = day >= 20 && noShift

    let status: "good" | "warning" | "danger" = ovulationConfirmed ? "good" : anovulatory ? "danger" : "warning"
    let label = strongShift ? "Strong Biphasic Shift — Ovulation Confirmed" : ovulationConfirmed ? "Biphasic Shift — Ovulation Likely" : anovulatory ? "Monophasic — Possible Anovulatory Cycle" : "Insufficient shift — Continue Tracking"

    const dataReliable = consistentWake === "yes"

    setResult({
      primaryMetric: { label: "BBT Analysis", value: label, status, description: `Pre-ovulation: ${pre}°C → Post: ${post}°C · Shift: +${shift}°C · Day ${day}` },
      metrics: [
        { label: "Pre-Ovulation BBT", value: `${pre}°C`, status: "normal" },
        { label: "Post-Ovulation BBT", value: `${post}°C`, status: "normal" },
        { label: "Temperature Shift", value: `+${shift}°C`, status: shift >= 0.3 ? "good" : shift >= 0.2 ? "warning" : "danger" },
        { label: "Pattern", value: biphasic ? "Biphasic ✓" : monophasic ? "Monophasic ✗" : "Inconclusive", status: biphasic ? "good" : monophasic ? "danger" : "warning" },
        { label: "Ovulation Confirmed", value: ovulationConfirmed ? "Yes" : "No", status: ovulationConfirmed ? "good" : "warning" },
        { label: "Data Reliability", value: dataReliable ? "Good (consistent wake)" : "Reduced (variable wake)", status: dataReliable ? "good" : "warning" }
      ],
      recommendations: [
        { title: ovulationConfirmed ? "Ovulation Confirmed" : anovulatory ? "Anovulatory Cycle Suspected" : "Continue Tracking", description: ovulationConfirmed ? `Temperature shift of +${shift}°C on day ${day} confirms ovulation occurred. Progesterone (from corpus luteum) causes the thermal shift. The elevated temperature should persist for 10-16 days (luteal phase). If sustained >18 days → possible pregnancy. For TTC: ovulation already occurred; egg lives only 12-24 hours. Plan intercourse for NEXT cycle's fertile window.` : anovulatory ? `No significant thermal shift (${shift}°C) by day ${day}. Monophasic pattern suggests anovulation this cycle. Occasional anovulatory cycles are normal (1-2/year). If recurrent: check FSH, LH, TSH, prolactin, PCOS screening. Stress, illness, extreme exercise, and very low body fat can cause anovulation.` : `Shift of ${shift}°C is below the typical 0.3-0.5°C threshold. Continue measuring for several more days. A sustained shift for 3 consecutive days confirms ovulation (coverline rule). Ensure measurement immediately upon waking, same time daily, before any activity.`, priority: anovulatory ? "high" : "medium", category: "Ovulation Assessment" },
        { title: "BBT Best Practices", description: `Measure immediately upon waking (before standing, talking, or drinking). Same time daily (±30 min). Use a BBT-specific thermometer (0.01°C precision). Factors that affect BBT: alcohol, illness/fever, broken sleep, travel, shift work. ${dataReliable ? "Your consistent wake time supports reliable data." : "Variable wake times reduce BBT reliability. Try to standardise."}`, priority: "medium", category: "Technique" },
        { title: "Fertility Awareness Method", description: "BBT charting is most powerful combined with cervical mucus tracking (Symptothermal Method). BBT confirms ovulation RETROSPECTIVELY (after the fact). For timing intercourse, cervical mucus and OPK (LH strips) predict ovulation PROSPECTIVELY. Use both for maximum accuracy.", priority: "low", category: "FAM" }
      ],
      detailedBreakdown: { "Pre-BBT": `${pre}°C`, "Post-BBT": `${post}°C`, "Shift": `+${shift}°C`, "Day": day, "Pattern": biphasic ? "Biphasic" : monophasic ? "Monophasic" : "Inconclusive", "Ovulated": ovulationConfirmed ? "Yes" : "No" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="basal-body-temp-tracker" title="Basal Body Temperature Tracker"
      description="Thermal ovulation detection — BBT shift analysis, biphasic/monophasic pattern identification, and anovulatory cycle detection."
      icon={TrendingUp} calculate={calculate} onClear={() => { setPreBBT(36.3); setPostBBT(36.7); setCycleDay(16); setWakeTime("06:30"); setConsistentWake("yes"); setResult(null) }}
      values={[preBBT, postBBT, cycleDay, wakeTime, consistentWake]} result={result}
      seoContent={<SeoContentGenerator title="Basal Body Temperature Tracker" description="Track BBT for ovulation confirmation and anovulatory cycle detection." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Pre-Ovulation BBT (follicular phase avg)" val={preBBT} set={setPreBBT} min={35} max={37.5} step={0.01} suffix="°C" />
        <NumInput label="Post-Ovulation BBT (current/luteal phase)" val={postBBT} set={setPostBBT} min={35.5} max={38.5} step={0.01} suffix="°C" />
        <NumInput label="Current Cycle Day" val={cycleDay} set={setCycleDay} min={1} max={50} />
        <SelectInput label="Consistent Wake Time?" val={consistentWake} set={setConsistentWake} options={[
          { value: "yes", label: "Yes — same time daily (±30 min)" },
          { value: "no", label: "No — variable wake times" }
        ]} />
      </div>} />
  )
}

// ─── 25. Pregnancy Test Timing Calculator ─────────────────────────────────────
export function PregnancyTestTimingCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [ovulationDate, setOvulationDate] = useState(today)
  const [implantationDay, setImplantationDay] = useState("9")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ov = new Date(ovulationDate)
    if (isNaN(ov.getTime())) return

    const implDays = Number(implantationDay)
    const now = new Date()
    const dpo = Math.floor((now.getTime() - ov.getTime()) / 86400000)

    // Optimal test dates
    const earliest = new Date(ov)
    earliest.setDate(earliest.getDate() + 10)
    const optimal = new Date(ov)
    optimal.setDate(optimal.getDate() + 14)
    const bloodTest = new Date(ov)
    bloodTest.setDate(bloodTest.getDate() + 12)

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })

    // False negative probability by DPO
    let falseNegProb = "N/A"
    if (dpo < 8) falseNegProb = ">95% — too early"
    else if (dpo < 10) falseNegProb = "~60-70%"
    else if (dpo < 12) falseNegProb = "~25-40%"
    else if (dpo < 14) falseNegProb = "~10-20%"
    else if (dpo < 16) falseNegProb = "~5-8%"
    else falseNegProb = "<2%"

    const canTestNow = dpo >= 10
    const idealWait = dpo >= 14
    const tooEarly = dpo < 10

    let status: "good" | "warning" | "danger" = idealWait ? "good" : canTestNow ? "warning" : "normal" as "good"

    setResult({
      primaryMetric: { label: "Test Recommendation", value: idealWait ? "Optimal — Test Now" : canTestNow ? "Early — Can Test (sensitivity varies)" : `Wait ${10 - dpo} more days`, status, description: `${dpo} DPO · Optimal: 14 DPO (${fmt(optimal)}) · False neg: ${falseNegProb}` },
      metrics: [
        { label: "Days Post Ovulation (DPO)", value: `${dpo} DPO`, status: dpo >= 14 ? "good" : dpo >= 10 ? "warning" : "normal" as "good" },
        { label: "Earliest Home Test", value: `${fmt(earliest)} (10 DPO)`, status: "normal" },
        { label: "Optimal Home Test", value: `${fmt(optimal)} (14 DPO)`, status: "good" },
        { label: "Blood Test (beta hCG)", value: `${fmt(bloodTest)} (12 DPO)`, status: "normal" },
        { label: "False Negative Probability", value: falseNegProb, status: tooEarly ? "danger" : canTestNow && !idealWait ? "warning" : "good" },
        { label: "Estimated Implantation", value: `${implDays} DPO`, status: "normal" }
      ],
      recommendations: [
        { title: tooEarly ? "Too Early to Test" : canTestNow && !idealWait ? "Can Test — But May Be Inaccurate" : "Optimal Testing Window", description: tooEarly ? `At ${dpo} DPO, hCG levels are likely undetectable even if pregnant. Implantation typically occurs 6-12 DPO (peak: 8-10 DPO). hCG doubles every 48 hours after implantation. Wait until at least 10 DPO for early testing, or 14 DPO for reliable results. Testing too early causes unnecessary anxiety.` : canTestNow && !idealWait ? `At ${dpo} DPO, an early-result home test (sensitivity 10-25 mIU/mL) may detect pregnancy, but false negatives are common (${falseNegProb}). First morning urine is most concentrated. If negative, re-test at 14 DPO before concluding. A blood beta-hCG test (12+ DPO) is more sensitive.` : `At ${dpo} DPO, home pregnancy tests are highly reliable. Use first morning urine. A positive is almost certainly true. A negative at 14+ DPO is also reliable. If period is late and test is negative, repeat in 2-3 days or request a blood beta-hCG.`, priority: "high", category: "Testing Advice" },
        { title: "hCG Detection Science", description: `After implantation (~${implDays} DPO), the embryo secretes hCG which doubles every 48-72 hours. Home tests detect hCG at 20-25 mIU/mL (standard) or 10 mIU/mL (early result). Blood test detects at 5 mIU/mL. Timeline: Implantation → 2-3 days for blood detection → 4-5 days for urine detection. This is why 10-14 DPO is the reliable window.`, priority: "medium", category: "Science" },
        { title: "If Negative but Period Late", description: "Causes of late period without pregnancy: stress, illness, travel, weight changes, thyroid, PCOS. If period is >7 days late with negative tests, contact your doctor for evaluation. Repeat testing 48 hours apart if uncertain.", priority: "low", category: "Next Steps" }
      ],
      detailedBreakdown: { "Ovulation": ovulationDate, "DPO": dpo, "Implantation Est.": `${implDays} DPO`, "Earliest Test": fmt(earliest), "Optimal Test": fmt(optimal), "False Neg %": falseNegProb }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-test-timing" title="Pregnancy Test Timing Calculator"
      description="Optimal pregnancy test day calculator — DPO tracking, false negative probability, and hCG detection science."
      icon={Calendar} calculate={calculate} onClear={() => { setOvulationDate(today); setImplantationDay("9"); setResult(null) }}
      values={[ovulationDate, implantationDay]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Test Timing Calculator" description="Find the best day to take a pregnancy test based on ovulation date." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Ovulation Date (or estimated)" val={ovulationDate} set={setOvulationDate} />
        <SelectInput label="Estimated Implantation Day" val={implantationDay} set={setImplantationDay} options={[
          { value: "7", label: "7 DPO (early implantation)" },
          { value: "8", label: "8 DPO" },
          { value: "9", label: "9 DPO (most common)" },
          { value: "10", label: "10 DPO" },
          { value: "11", label: "11 DPO (late implantation)" }
        ]} />
      </div>} />
  )
}

// ─── 27. Fundal Height Calculator ─────────────────────────────────────────────
export function FundalHeightCalculator() {
  const [fundalHeight, setFundalHeight] = useState(28)
  const [gestWeeks, setGestWeeks] = useState(28)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const fh = clamp(fundalHeight, 10, 50)
    const gw = clamp(gestWeeks, 20, 42)

    // Rule: Fundal height (cm) ≈ gestational weeks ±2 cm (from 20-36 weeks)
    const expected = gw
    const diff = fh - expected
    const absDiff = Math.abs(diff)

    const aligned = absDiff <= 2
    const small = diff < -2
    const large = diff > 2

    let status: "good" | "warning" | "danger" = aligned ? "good" : absDiff <= 3 ? "warning" : "danger"
    let label = aligned ? "Normal — Within ±2 cm" : small ? "Small for Dates" : "Large for Dates"

    const iugrSuspicion = small && absDiff >= 3
    const polyhydramnios = large && absDiff >= 4
    const macrosomia = large && gw >= 36

    setResult({
      primaryMetric: { label: "Fundal Height Assessment", value: label, status, description: `Measured: ${fh} cm · Expected: ${expected} cm ±2 · Difference: ${diff > 0 ? "+" : ""}${diff} cm` },
      metrics: [
        { label: "Fundal Height", value: `${fh} cm`, status },
        { label: "Expected (GA)", value: `${expected} cm ±2`, status: "normal" },
        { label: "Discrepancy", value: `${diff > 0 ? "+" : ""}${diff} cm`, status },
        { label: "GA", value: `${gw} weeks`, status: "normal" },
        { label: "IUGR Suspicion", value: iugrSuspicion ? "Elevated — ultrasound needed" : "Not detected", status: iugrSuspicion ? "danger" : "good" },
        { label: "Polyhydramnios Flag", value: polyhydramnios ? "Possible — AFI check needed" : "Not suspected", status: polyhydramnios ? "warning" : "good" }
      ],
      recommendations: [
        { title: aligned ? "Normal Fundal Height" : small ? "Small for Dates — Investigation" : "Large for Dates — Investigation", description: aligned ? `Fundal height ${fh} cm at ${gw} weeks is within the expected range (${expected} ±2 cm). This correlates with appropriate fetal growth. Continue routine measurements at each visit.` : small ? `Fundal height ${fh} cm is ${absDiff} cm below expected at ${gw} weeks. ${iugrSuspicion ? "Significant discrepancy (≥3cm below) — IUGR is a concern. Urgent growth ultrasound with EFW and Doppler recommended. Common causes: uteroplacental insufficiency, maternal hypertension, smoking, infection." : "Minor discrepancy — may reflect fetal position, maternal body habitus, or dating error. Repeat in 2 weeks. If persistent, request ultrasound for growth assessment."}` : `Fundal height ${fh} cm is ${absDiff} cm above expected at ${gw} weeks. ${polyhydramnios ? "Significant discrepancy — rule out polyhydramnios (AFI >24cm), macrosomia, multiple gestation, or gestational diabetes." : macrosomia ? "Consider macrosomia or gestational diabetes. GTT if not done. Growth ultrasound recommended." : "Minor discrepancy — may be normal variant or fetal position. Repeat measurement in 2 weeks."}`, priority: aligned ? "low" : "high", category: "Growth Assessment" },
        { title: "Measurement Technique", description: "Fundal height is measured from symphysis pubis to uterine fundus with a tape measure (McDonald's rule). Most accurate at 20-36 weeks. After 36w, engagement of the fetal head may cause apparent decrease. Serial measurements are more valuable than a single reading. Accuracy: ±2-3 cm in experienced hands.", priority: "medium", category: "Clinical Method" }
      ],
      detailedBreakdown: { "Measured": `${fh} cm`, "Expected": `${expected} cm`, "Diff": `${diff} cm`, "GA": `${gw}w`, "Status": label }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fundal-height-calculator" title="Fundal Height Calculator"
      description="Uterine growth assessment — fundal height vs gestational age alignment with IUGR and polyhydramnios detection."
      icon={Baby} calculate={calculate} onClear={() => { setFundalHeight(28); setGestWeeks(28); setResult(null) }}
      values={[fundalHeight, gestWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Fundal Height Calculator" description="Check fundal height alignment with gestational age." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Fundal Height (measured)" val={fundalHeight} set={setFundalHeight} min={10} max={50} suffix="cm" />
        <NumInput label="Gestational Week" val={gestWeeks} set={setGestWeeks} min={20} max={42} suffix="weeks" />
      </div>} />
  )
}

// ─── 28. Pregnancy Blood Volume Calculator ────────────────────────────────────
export function PregnancyBloodVolumeCalculator() {
  const [preWeight, setPreWeight] = useState(60)
  const [trimester, setTrimester] = useState("3")
  const [hemoglobin, setHemoglobin] = useState(11.5)
  const [multiples, setMultiples] = useState("single")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(preWeight, 35, 200)
    const hb = clamp(hemoglobin, 5, 18)
    const tri = Number(trimester)

    // Non-pregnant blood volume ~70 mL/kg (female)
    const baseVolume = r0(w * 70)

    // Pregnancy expansion by trimester
    const expansionPct: Record<number, number> = { 1: 10, 2: 30, 3: 45 }
    const twinExtra = multiples === "twin" ? 10 : multiples === "triplet" ? 15 : 0
    const totalExpansion = (expansionPct[tri] ?? 45) + twinExtra
    const pregnancyVolume = r0(baseVolume * (1 + totalExpansion / 100))
    const volumeIncrease = pregnancyVolume - baseVolume

    // Plasma expands more than RBCs → dilutional anemia
    const plasmaExpansion = r0(totalExpansion * 1.3)
    const rbcExpansion = r0(totalExpansion * 0.7)

    const anemia = tri >= 2 && hb < 11.0
    const severeAnemia = hb < 7.0
    const hypotensionRisk = tri === 2 || tri === 3

    let status: "good" | "warning" | "danger" = severeAnemia ? "danger" : anemia ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Pregnancy Blood Volume", value: `${pregnancyVolume} mL`, status, description: `+${volumeIncrease} mL (+${totalExpansion}%) from baseline ${baseVolume} mL · T${tri}` },
      metrics: [
        { label: "Pre-Pregnancy Volume", value: `${baseVolume} mL`, status: "normal" },
        { label: "Current Estimated Volume", value: `${pregnancyVolume} mL`, status: "good" },
        { label: "Volume Increase", value: `+${volumeIncrease} mL (+${totalExpansion}%)`, status: "normal" },
        { label: "Plasma Expansion", value: `~+${plasmaExpansion}%`, status: "normal" },
        { label: "RBC Expansion", value: `~+${rbcExpansion}%`, status: "normal" },
        { label: "Hemoglobin", value: `${hb} g/dL`, status: severeAnemia ? "danger" : anemia ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Hemodynamic Adaptation", description: `Blood volume increases ~${totalExpansion}% during pregnancy (T${tri}). Plasma expands ~50% while RBCs expand ~30% → physiological (dilutional) anemia. This is NORMAL and reduces blood viscosity, improving placental perfusion. ${multiples !== "single" ? `Multiple pregnancy amplifies volume expansion by an additional ~${twinExtra}%.` : ""}`, priority: "medium", category: "Physiology" },
        { title: anemia ? "Anemia Detected — Treatment Needed" : "Anemia Risk Assessment", description: anemia ? `Hemoglobin ${hb} g/dL in T${tri} is below WHO threshold (11.0 g/dL for T1/T3, 10.5 g/dL for T2). ${severeAnemia ? "Severe anemia (<7): IV iron or blood transfusion may be needed. Refer urgently." : "Iron supplementation: Ferrous sulfate 60-120mg elemental iron/day with vitamin C. Recheck in 4 weeks. If no response, check ferritin, B12, folate."} Dietary iron: red meat, spinach, lentils, fortified cereals.` : `Hemoglobin ${hb} g/dL is within acceptable range for T${tri}. Physiological anemia typically bottoms out at 28-32 weeks then stabilises. Continue prenatal vitamins with iron 27mg/day. Hb checked at booking, 28 weeks, and 36 weeks.`, priority: anemia ? "high" : "medium", category: "Anemia" },
        { title: "Postpartum Hemorrhage Preparedness", description: `Blood volume expansion is protective against delivery blood loss (typical: 300-500mL vaginal, 800-1000mL C-section). However, with ${pregnancyVolume} mL total volume, loss >1000mL (PPH) requires active management. Risk factors: uterine atony, retained placenta, coagulopathy. Blood type and screen should be on file.`, priority: "medium", category: "Delivery Planning" }
      ],
      detailedBreakdown: { "Pre-Pregnancy": `${baseVolume} mL`, "Pregnant": `${pregnancyVolume} mL`, "Increase": `+${volumeIncrease} mL`, "Expansion": `${totalExpansion}%`, "Hb": `${hb} g/dL`, "Trimester": `T${tri}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-blood-volume" title="Pregnancy Blood Volume Calculator"
      description="Maternal hemodynamic adaptation — plasma expansion, dilutional anemia assessment, and postpartum hemorrhage preparedness."
      icon={Heart} calculate={calculate} onClear={() => { setPreWeight(60); setTrimester("3"); setHemoglobin(11.5); setMultiples("single"); setResult(null) }}
      values={[preWeight, trimester, hemoglobin, multiples]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Blood Volume Calculator" description="Estimate blood volume expansion during pregnancy with anemia risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Pre-Pregnancy Weight" val={preWeight} set={setPreWeight} min={35} max={200} suffix="kg" />
        <SelectInput label="Trimester" val={trimester} set={setTrimester} options={[
          { value: "1", label: "First Trimester" },
          { value: "2", label: "Second Trimester" },
          { value: "3", label: "Third Trimester" }
        ]} />
        <NumInput label="Current Hemoglobin" val={hemoglobin} set={setHemoglobin} min={5} max={18} step={0.1} suffix="g/dL" />
        <SelectInput label="Number of Babies" val={multiples} set={setMultiples} options={[
          { value: "single", label: "Singleton" },
          { value: "twin", label: "Twins" },
          { value: "triplet", label: "Triplets+" }
        ]} />
      </div>} />
  )
}

// ─── 29. Morning Sickness Tracker ─────────────────────────────────────────────
export function MorningSicknessTracker() {
  const [vomitFreq, setVomitFreq] = useState(3)
  const [weightLoss, setWeightLoss] = useState(1)
  const [hydration, setHydration] = useState("adequate")
  const [gestWeeks, setGestWeeks] = useState(8)
  const [keepFoodDown, setKeepFoodDown] = useState("mostly")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const vf = clamp(vomitFreq, 0, 30)
    const wl = clamp(weightLoss, 0, 20)
    const gw = clamp(gestWeeks, 4, 20)

    // PUQE score approximation (Pregnancy-Unique Quantification of Emesis)
    let severityScore = 0
    if (vf >= 7) severityScore += 5
    else if (vf >= 4) severityScore += 3
    else if (vf >= 1) severityScore += 1

    if (wl >= 5) severityScore += 5
    else if (wl >= 3) severityScore += 3
    else if (wl >= 1) severityScore += 1

    if (hydration === "poor") severityScore += 4
    else if (hydration === "reduced") severityScore += 2

    if (keepFoodDown === "rarely") severityScore += 3
    else if (keepFoodDown === "sometimes") severityScore += 1

    const hyperemesis = severityScore >= 10 || (vf >= 5 && wl >= 5)
    const dehydrationAlert = hydration === "poor" || severityScore >= 8

    let status: "good" | "warning" | "danger" = hyperemesis ? "danger" : severityScore >= 6 ? "warning" : "good"
    let label = hyperemesis ? "Hyperemesis Gravidarum Likely" : severityScore >= 6 ? "Severe Nausea/Vomiting" : severityScore >= 3 ? "Moderate Morning Sickness" : "Mild Morning Sickness"

    const expectDuration = gw <= 12 ? "Peak: 8-10w. Usually resolves by 14-16w." : gw <= 16 ? "Should be improving. If persisting, evaluate further." : "Persistent after 16w is atypical — rule out other causes."

    setResult({
      primaryMetric: { label: "Severity Assessment", value: label, status, description: `Severity index: ${severityScore}/17 · ${vf}x/day vomiting · ${wl}kg weight loss · ${expectDuration}` },
      metrics: [
        { label: "Vomiting Frequency", value: `${vf}x/day`, status: vf >= 5 ? "danger" : vf >= 3 ? "warning" : "good" },
        { label: "Weight Loss", value: `${wl} kg`, status: wl >= 5 ? "danger" : wl >= 2 ? "warning" : "good" },
        { label: "Hydration Status", value: hydration === "adequate" ? "Adequate" : hydration === "reduced" ? "Reduced" : "Poor — Dehydration risk", status: hydration === "poor" ? "danger" : hydration === "reduced" ? "warning" : "good" },
        { label: "Severity Index", value: `${severityScore}/17`, status },
        { label: "Hyperemesis Risk", value: hyperemesis ? "HIGH — Medical attention needed" : "Low", status: hyperemesis ? "danger" : "good" },
        { label: "Dehydration Alert", value: dehydrationAlert ? "YES — IV fluids may be needed" : "No", status: dehydrationAlert ? "danger" : "good" }
      ],
      recommendations: [
        { title: hyperemesis ? "Hyperemesis Gravidarum — Seek Medical Care" : "Nausea Management", description: hyperemesis ? `Vomiting ${vf}x/day with ${wl}kg weight loss and ${hydration} hydration strongly suggests hyperemesis gravidarum (HG). This requires medical treatment: IV fluids for rehydration, antiemetics (ondansetron, metoclopramide), thiamine supplementation (to prevent Wernicke encephalopathy), and possibly hospital admission. Weight loss >5% of pre-pregnancy weight is a diagnostic criterion for HG.` : `Morning sickness management: 1) Ginger (250mg capsules 4x/day or ginger tea). 2) Vitamin B6 (pyridoxine) 25mg every 8 hours. 3) Small, frequent bland meals (crackers, dry toast). 4) Avoid triggers (strong smells, fatty/spicy foods). 5) Acupressure wristbands (P6 point). 6) If B6 alone isn't enough, add doxylamine 12.5mg at night (Diclegis/Diclectin).`, priority: hyperemesis ? "high" : "medium", category: "Treatment" },
        { title: dehydrationAlert ? "Dehydration Warning" : "Hydration Guide", description: dehydrationAlert ? "Signs of dehydration: dark urine, dry lips, dizziness on standing, rapid heart rate, reduced urine output. If unable to keep fluids down for >12 hours, go to the ED for IV rehydration. Electrolyte drinks (ORS) are better than plain water. Dehydration can cause low amniotic fluid and UTIs." : "Aim for 2-3 litres/day. Sip small amounts frequently rather than large gulps. Cold/ice drinks may stay down better. Electrolyte-enhanced water or coconut water helps replace losses.", priority: dehydrationAlert ? "high" : "medium", category: "Hydration" },
        { title: "When HG Needs Intervention", description: `Expected timeline: NVP starts 4-6w, peaks 8-10w, resolves 14-16w in 90% of cases. Gestational week ${gw}: ${expectDuration} If symptoms are worsening or not improving by 14 weeks, additional workup (thyroid, H. pylori, UTI, hepatic) may be needed. HG affects 0.3-3% of pregnancies and has a genetic component.`, priority: "medium", category: "Clinical Course" }
      ],
      detailedBreakdown: { "Vomiting": `${vf}x/day`, "Weight Loss": `${wl}kg`, "Hydration": hydration, "Food Tolerance": keepFoodDown, "Severity": `${severityScore}/17`, "HG Risk": hyperemesis ? "High" : "Low", "GA": `${gw}w` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="morning-sickness-tracker" title="Morning Sickness Tracker"
      description="Hyperemesis risk monitor — nausea severity scoring, dehydration detection, weight loss tracking, and evidence-based management."
      icon={AlertCircle} calculate={calculate} onClear={() => { setVomitFreq(3); setWeightLoss(1); setHydration("adequate"); setGestWeeks(8); setKeepFoodDown("mostly"); setResult(null) }}
      values={[vomitFreq, weightLoss, hydration, gestWeeks, keepFoodDown]} result={result}
      seoContent={<SeoContentGenerator title="Morning Sickness Tracker" description="Track morning sickness severity with hyperemesis gravidarum risk assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Vomiting Episodes Per Day" val={vomitFreq} set={setVomitFreq} min={0} max={30} />
        <NumInput label="Weight Loss Since Start of Pregnancy" val={weightLoss} set={setWeightLoss} min={0} max={20} suffix="kg" />
        <SelectInput label="Hydration Status" val={hydration} set={setHydration} options={[
          { value: "adequate", label: "Adequate — urinating normally, clear/light urine" },
          { value: "reduced", label: "Reduced — less frequent urination, darker urine" },
          { value: "poor", label: "Poor — very infrequent, very dark urine, dizzy" }
        ]} />
        <NumInput label="Gestational Week" val={gestWeeks} set={setGestWeeks} min={4} max={20} suffix="weeks" />
        <SelectInput label="Keeping Food Down?" val={keepFoodDown} set={setKeepFoodDown} options={[
          { value: "mostly", label: "Mostly — eating well enough" },
          { value: "sometimes", label: "Sometimes — struggling with meals" },
          { value: "rarely", label: "Rarely — can barely eat" }
        ]} />
      </div>} />
  )
}

// ─── 30. Gestational Age Calculator (Ultrasound-Aligned) ──────────────────────
export function GestationalAgeUSCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [usWeeks, setUsWeeks] = useState(12)
  const [usDays, setUsDays] = useState(3)
  const [crl, setCrl] = useState(55)
  const [usDate, setUsDate] = useState(today)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    const usD = new Date(usDate)
    if (isNaN(lmp.getTime()) || isNaN(usD.getTime())) return
    const now = new Date()

    // LMP-based GA
    const lmpDaysPregnant = Math.floor((now.getTime() - lmp.getTime()) / 86400000)
    const lmpWeeks = Math.floor(lmpDaysPregnant / 7)
    const lmpDays = lmpDaysPregnant % 7

    // US-based GA (adjusted to today)
    const daysSinceUS = Math.floor((now.getTime() - usD.getTime()) / 86400000)
    const usTotalDays = usWeeks * 7 + usDays + daysSinceUS
    const usGAWeeks = Math.floor(usTotalDays / 7)
    const usGADays = usTotalDays % 7

    // Discrepancy in days
    const discrepancyDays = Math.abs(lmpDaysPregnant - usTotalDays)
    const discrepancyWeeks = r1(discrepancyDays / 7)

    // Dating rules: <9w → >5d discrepancy = redate. 9-13w → >7d. 14-15w → >7d. 16-21w → >10d. 22-27w → >14d.
    let shouldRedate = false
    const usGAAtScan = usWeeks
    if (usGAAtScan < 9) shouldRedate = discrepancyDays > 5
    else if (usGAAtScan <= 13) shouldRedate = discrepancyDays > 7
    else if (usGAAtScan <= 15) shouldRedate = discrepancyDays > 7
    else if (usGAAtScan <= 21) shouldRedate = discrepancyDays > 10
    else shouldRedate = discrepancyDays > 14

    const finalGA = shouldRedate ? `${usGAWeeks}w ${usGADays}d (US-adjusted)` : `${lmpWeeks}w ${lmpDays}d (LMP)`
    const finalEDD = new Date(shouldRedate ? usD : lmp)
    if (shouldRedate) {
      finalEDD.setDate(finalEDD.getDate() + (280 - usTotalDays + daysSinceUS))
    } else {
      finalEDD.setDate(finalEDD.getDate() + 280)
    }
    const eddStr = finalEDD.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })

    const status: "good" | "warning" | "danger" = shouldRedate && discrepancyDays > 14 ? "danger" : shouldRedate ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Final Gestational Age", value: finalGA, status, description: `${shouldRedate ? "Dating corrected by ultrasound" : "LMP dates confirmed by ultrasound"} · Discrepancy: ${discrepancyDays} days (${discrepancyWeeks}w) · EDD: ${eddStr}` },
      metrics: [
        { label: "LMP-Based GA", value: `${lmpWeeks}w ${lmpDays}d`, status: "normal" },
        { label: "US-Based GA (today)", value: `${usGAWeeks}w ${usGADays}d`, status: "normal" },
        { label: "Discrepancy", value: `${discrepancyDays} days (${discrepancyWeeks}w)`, status: shouldRedate ? "warning" : "good" },
        { label: "Redate Recommended?", value: shouldRedate ? "YES — Use US dates" : "NO — LMP confirmed", status: shouldRedate ? "warning" : "good" },
        { label: "Adjusted EDD", value: eddStr, status: "good" },
        { label: "CRL (if provided)", value: crl > 0 ? `${crl} mm` : "N/A", status: "normal" }
      ],
      recommendations: [
        { title: shouldRedate ? "Dating Correction Recommended" : "LMP Dates Confirmed", description: shouldRedate ? `Discrepancy of ${discrepancyDays} days exceeds the acceptable threshold for ultrasound at ${usWeeks}w (>7 days for ≤13w). ACOG/NICE recommend using ultrasound-based dates when discrepancy exceeds threshold. This changes your EDD to ${eddStr}. All future care should use the revised dates.` : `LMP dates (${lmpWeeks}w ${lmpDays}d) and ultrasound dates (${usGAWeeks}w ${usGADays}d) agree within acceptable limits (${discrepancyDays} days). LMP EDD is retained as the official due date. First-trimester ultrasound dating is most accurate (±5-7 days).`, priority: shouldRedate ? "high" : "low", category: "Dating Assessment" },
        { title: "Dating Accuracy by Trimester", description: "First trimester US (CRL): ±5-7 days accuracy — GOLD STANDARD for dating. Second trimester (BPD, FL): ±10-14 days. Third trimester: ±21 days — NOT reliable for dating. If no first-trimester scan was done, second-trimester measurements are used but less accurate. Consistent dates from an early scan should never be changed by a later scan.", priority: "medium", category: "Standards" },
        { title: "Why Accurate Dating Matters", description: "Wrong dates can lead to: unnecessary preterm delivery (<37w), missed post-dates induction (>41w), inappropriate timing of screening tests (NT scan, GTT, GBS). If dates are uncertain, request early dating scan at 8-12 weeks. CRL measurement is the most accurate single parameter.", priority: "medium", category: "Clinical Impact" }
      ],
      detailedBreakdown: { "LMP GA": `${lmpWeeks}w ${lmpDays}d`, "US GA": `${usGAWeeks}w ${usGADays}d`, "Discrepancy": `${discrepancyDays}d`, "Redate": shouldRedate ? "Yes" : "No", "Final GA": finalGA, "EDD": eddStr, "CRL": crl > 0 ? `${crl}mm` : "N/A" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="gestational-age-us-calculator" title="Gestational Age Calculator (US-Aligned)"
      description="Ultrasound-aligned gestational age with LMP vs US discrepancy analysis, ACOG redating criteria, and CRL-based dating."
      icon={Baby} calculate={calculate} onClear={() => { setLmpDate(today); setUsWeeks(12); setUsDays(3); setCrl(55); setUsDate(today); setResult(null) }}
      values={[lmpDate, usWeeks, usDays, crl, usDate]} result={result}
      seoContent={<SeoContentGenerator title="Gestational Age Calculator" description="Calculate gestational age with ultrasound dating correction." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Period (LMP)" val={lmpDate} set={setLmpDate} />
        <DateInput label="Ultrasound Date" val={usDate} set={setUsDate} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="US Gestational Age (weeks)" val={usWeeks} set={setUsWeeks} min={5} max={42} suffix="weeks" />
          <NumInput label="US Gestational Age (days)" val={usDays} set={setUsDays} min={0} max={6} suffix="days" />
        </div>
        <NumInput label="Crown-Rump Length (CRL)" val={crl} set={setCrl} min={0} max={100} suffix="mm" />
      </div>} />
  )
}
