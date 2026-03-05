"use client"

import { useState } from "react"
import { Baby, Heart, Calendar, Activity } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
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

// ─── 1. Due Date / Pregnancy Calculator ──────────────────────────────────────
export function DueDateCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [cycleLength, setCycleLength] = useState(28)
  const [method, setMethod] = useState("lmp")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    if (isNaN(lmp.getTime())) return

    const cycleAdj = cycleLength - 28
    const eddNaegele = new Date(lmp)
    eddNaegele.setDate(eddNaegele.getDate() + 280 + cycleAdj)

    const today = new Date()
    const daysPregnant = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24))
    const weeksPregnant = Math.floor(daysPregnant / 7)
    const extraDays = daysPregnant % 7
    const daysToEDD = Math.floor((eddNaegele.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const trimester = weeksPregnant < 13 ? "First Trimester (weeks 1-12)" : weeksPregnant < 27 ? "Second Trimester (weeks 13-26)" : "Third Trimester (weeks 27-40)"
    const eddStr = eddNaegele.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })

    const t1End = new Date(lmp); t1End.setDate(t1End.getDate() + 84)
    const t2End = new Date(lmp); t2End.setDate(t2End.getDate() + 190)

    setResult({
      primaryMetric: { label: "Estimated Due Date", value: eddStr, status: "good", description: `${weeksPregnant > 0 ? `${weeksPregnant} weeks ${extraDays} days pregnant` : "LMP selected — start of pregnancy"}` },
      metrics: [
        { label: "EDD (Naegele's Rule)", value: eddStr, status: "good" },
        { label: "Current Gestational Age", value: `${weeksPregnant}w ${extraDays}d`, status: weeksPregnant > 0 && weeksPregnant <= 42 ? "good" : "normal" },
        { label: "Trimester", value: trimester, status: "good" },
        { label: "Days Until Birth (est.)", value: daysToEDD > 0 ? daysToEDD : "Past EDD", status: daysToEDD > 0 ? "good" : "warning" },
        { label: "End of T1 (Week 12)", value: t1End.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), status: "normal" },
        { label: "End of T2 (Week 27)", value: t2End.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), status: "normal" }
      ],
      recommendations: [
        { title: "Trimester Milestones", description: "T1 (1-12 wks): Nausea, fatigue, all organs forming. Critical period for folate (400-800mcg/day). T2 (13-26 wks): Most comfortable. Anatomy scan at 18-20 wks. T3 (27-40 wks): Rapid growth, prepare for birth.", priority: "high", category: "Timeline" },
        { title: "Key Prenatal Tests", description: "Weeks 10-14: NIPT/combined screening. 18-20: Anatomy ultrasound. 24-28: Gestational diabetes (GTT). 35-37: Group B Strep culture. Attend all prenatal appointments.", priority: "high", category: "Medical Care" },
        { title: "EDD Accuracy", description: "Naegele's Rule assumes a 28-day cycle with ovulation on day 14. For cycles other than 28 days, the date is adjusted. Ultrasound at 8-12 weeks provides the most accurate due date.", priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "Cycle Length": `${cycleLength} days`, "EDD": eddStr, "Gestational Age": `${weeksPregnant}w ${extraDays}d`, "Trimester": trimester }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="due-date-calculator" title="Due Date Calculator"
      description="Calculate estimated due date using Naegele's Rule with cycle length adjustment. Includes gestational age and trimester milestones."
      icon={Baby} calculate={calculate} onClear={() => { setLmpDate(today); setCycleLength(28); setResult(null) }}
      values={[lmpDate, cycleLength, method]} result={result}
      seoContent={<SeoContentGenerator title="Due Date Calculator" description="Calculate pregnancy due date from LMP." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Menstrual Period (LMP)" val={lmpDate} set={setLmpDate} />
        <NumInput label="Average Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
      </div>} />
  )
}

// ─── 2. Ovulation / Fertility Window Calculator ────────────────────────────────
export function OvulationCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lastPeriod, setLastPeriod] = useState(today)
  const [cycleLength, setCycleLength] = useState(28)
  const [lutealPhase, setLutealPhase] = useState(14)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lp = new Date(lastPeriod)
    if (isNaN(lp.getTime())) return

    const cl = clamp(cycleLength, 20, 45)
    const lph = clamp(lutealPhase, 10, 16)

    const ovulationDay = cl - lph
    const ovulationDate = new Date(lp)
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay)

    const fertileStart = new Date(ovulationDate)
    fertileStart.setDate(fertileStart.getDate() - 5)       // sperm can survive 5 days

    const fertileEnd = new Date(ovulationDate)
    fertileEnd.setDate(fertileEnd.getDate() + 1)           // egg survives ~24 hours

    const nextPeriod = new Date(lp)
    nextPeriod.setDate(nextPeriod.getDate() + cl)

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })

    setResult({
      primaryMetric: { label: "Ovulation Date (est.)", value: fmt(ovulationDate), status: "good", description: `Fertile window: ${fmt(fertileStart)} – ${fmt(fertileEnd)}` },
      metrics: [
        { label: "Estimated Ovulation", value: fmt(ovulationDate), status: "good" },
        { label: "Fertile Window Start", value: fmt(fertileStart), status: "good" },
        { label: "Fertile Window End", value: fmt(fertileEnd), status: "good" },
        { label: "Days Until Ovulation", value: Math.floor((ovulationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)), status: "normal" },
        { label: "Next Period (est.)", value: fmt(nextPeriod), status: "normal" },
        { label: "Cycle Day of Ovulation", value: ovulationDay, unit: `(Day ${ovulationDay} of ${cl})`, status: "normal" }
      ],
      recommendations: [
        { title: "Maximizing Conception Chances", description: "The peak fertile window is 5 days before ovulation + day of ovulation. The highest probability of conception is the 2-3 days before and the day of ovulation. Having intercourse every 1-2 days during this period optimizes chances.", priority: "high", category: "Fertility" },
        { title: "Tracking Ovulation Signs", description: "Signs of ovulation: increased clear/stretchy cervical mucus (egg-white consistency), slight rise in basal body temperature (0.2-0.5°C), mild one-sided pelvic pain (Mittelschmerz). Ovulation predictor kits (OPKs) detect LH surge 12-36 hours before ovulation.", priority: "high", category: "Tracking" },
        { title: "Irregular Cycles", description: "If cycles vary by >5 days, ovulation prediction is less reliable. Track BBT and cervical mucus, or use digital OPKs. Cycles shorter than 21 days or longer than 35 days warrant evaluation.", priority: "medium", category: "Medical" }
      ],
      detailedBreakdown: { "Last Period": lastPeriod, "Cycle Length": `${cl} days`, "Luteal Phase": `${lph} days`, "Ovulation Day": `Day ${ovulationDay}`, "Ovulation Date": fmt(ovulationDate), "Fertile Window": `${fmt(fertileStart)} – ${fmt(fertileEnd)}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ovulation-calculator" title="Ovulation & Fertility Window Calculator"
      description="Calculate your fertile window and estimated ovulation date. Includes tips for maximizing conception chances using menstrual cycle data."
      icon={Heart} calculate={calculate} onClear={() => { setLastPeriod(today); setCycleLength(28); setLutealPhase(14); setResult(null) }}
      values={[lastPeriod, cycleLength, lutealPhase]} result={result}
      seoContent={<SeoContentGenerator title="Ovulation Calculator" description="Calculate your ovulation and fertile window." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Period" val={lastPeriod} set={setLastPeriod} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
          <NumInput label="Luteal Phase Length" val={lutealPhase} set={setLutealPhase} min={10} max={16} suffix="days" />
        </div>
      </div>} />
  )
}

// ─── 3. Gestational Age Calculator ───────────────────────────────────────────
export function GestationalAgeCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    const now = new Date()
    if (isNaN(lmp.getTime())) return

    const totalDays = Math.floor((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(totalDays / 7)
    const days = totalDays % 7

    const edd = new Date(lmp)
    edd.setDate(edd.getDate() + 280)
    const daysRemaining = Math.floor((edd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const weeksRemaining = Math.floor(daysRemaining / 7)
    const pctComplete = r0(totalDays / 280 * 100)

    let trimester = "", trimStatus: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (weeks < 1) trimester = "Pre-embryonic"
    else if (weeks < 13) trimester = `First Trimester (Week ${weeks})`
    else if (weeks < 28) trimester = `Second Trimester (Week ${weeks})`
    else if (weeks < 37) trimester = `Third Trimester (Week ${weeks})`
    else if (weeks < 42) { trimester = `Term (Week ${weeks})`; trimStatus = "good" }
    else { trimester = `Post-Term (Week ${weeks})`; trimStatus = "warning" }

    const milestones = [
      { w: 8, m: "Heartbeat detectable by ultrasound" },
      { w: 10, m: "First trimester screening" },
      { w: 12, m: "NT scan, end of T1" },
      { w: 18, m: "Anatomy scan (18-20 weeks)" },
      { w: 24, m: "Viability threshold" },
      { w: 28, m: "Glucose tolerance test" },
      { w: 35, m: "Group B Strep test" },
      { w: 37, m: "Full term" },
      { w: 40, m: "Estimated due date" }
    ]

    const nextMilestone = milestones.find(m => m.w > weeks)
    const weeksToNext = nextMilestone ? nextMilestone.w - weeks : 0

    setResult({
      primaryMetric: { label: "Gestational Age", value: `${weeks} weeks ${days} days`, status: trimStatus, description: trimester },
      metrics: [
        { label: "Weeks Pregnant", value: weeks, unit: `weeks + ${days} days`, status: trimStatus },
        { label: "Trimester", value: trimester, status: trimStatus },
        { label: "Days Pregnant", value: totalDays, unit: "days", status: "normal" },
        { label: "Pregnancy Complete", value: pctComplete, unit: "%", status: "good" },
        { label: "Weeks Remaining (est.)", value: weeksRemaining > 0 ? weeksRemaining : 0, status: "normal" },
        { label: "EDD", value: edd.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" }), status: "good" },
        { label: "Next Milestone", value: nextMilestone ? `Week ${nextMilestone.w}: ${nextMilestone.m}` : "Full term reached", status: "normal" }
      ],
      recommendations: [
        { title: `Week ${weeks} — What to Expect`, description: weeks < 13
          ? "Focus: Folate 400-800 mcg/day, avoid alcohol/smoking, start prenatal vitamins, confirm dating ultrasound by 12 weeks."
          : weeks < 28
          ? "Focus: Anatomy scan (18-20 wks), feel baby move by 20 wks, gestational diabetes screening at 24-28 wks, dental care."
          : "Focus: Prepare for birth, GBS test 35-37 wks, monitor fetal movements, attend all prenatal appointments, birth plan.", priority: "high", category: "Current Stage" },
        { title: "Coming Up", description: nextMilestone ? `In ${weeksToNext} weeks: ${nextMilestone.m}` : "All major milestones passed. Prepare for birth.", priority: "medium", category: "Upcoming" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "Gestational Age": `${weeks}w ${days}d`, "Trimester": trimester, "EDD": edd.toLocaleDateString("en-IN") }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="gestational-age-calculator" title="Gestational Age Calculator"
      description="Calculate your exact gestational age in weeks and days from LMP. Includes trimester identification, milestones, and week-by-week guidance."
      icon={Baby} calculate={calculate} onClear={() => { setLmpDate(today); setResult(null) }}
      values={[lmpDate]} result={result}
      seoContent={<SeoContentGenerator title="Gestational Age Calculator" description="Calculate exact gestational age from LMP." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Menstrual Period (LMP)" val={lmpDate} set={setLmpDate} />
      </div>} />
  )
}

// ─── 4. Pregnancy Weight Gain Calculator ──────────────────────────────────────
export function PregnancyWeightGainCalculator() {
  const [prePregnancyBMI, setPrePregnancyBMI] = useState(22)
  const [currentWeight, setCurrentWeight] = useState(65)
  const [preWeight, setPreWeight] = useState(60)
  const [weeks, setWeeks] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bmi = clamp(prePregnancyBMI, 12, 60)
    const cw = clamp(currentWeight, 30, 250)
    const pw = clamp(preWeight, 30, 250)
    const w = clamp(weeks, 4, 44)

    // IOM 2009 guidelines
    let recLow = 0, recHigh = 0, category = ""
    if (bmi < 18.5) { recLow = 12.7; recHigh = 18.1; category = "Underweight" }
    else if (bmi < 25) { recLow = 11.3; recHigh = 15.9; category = "Normal Weight" }
    else if (bmi < 30) { recLow = 6.8; recHigh = 11.3; category = "Overweight" }
    else { recLow = 5; recHigh = 9.1; category = "Obese" }

    const actualGain = r1(cw - pw)
    const ratePerWeek = w > 13 ? r1(actualGain / (w - 13) * 1) : 0   // rate in T2+T3
    const expectedByNow = w <= 13
      ? r1(2 * w / 13)    // T1: ~1-2 kg total
      : r1(2 + (w - 13) * ((recLow + recHigh) / 2 / 27))    // T2+T3

    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (actualGain < expectedByNow - 2) status = "warning"
    else if (actualGain > expectedByNow + 3) status = "warning"

    const gainAtTerm = w > 0 ? r1(actualGain / w * 40) : actualGain

    setResult({
      primaryMetric: { label: "Weight Gained", value: actualGain, unit: "kg", status, description: `${category} — IOM recommendation: ${recLow}–${recHigh} kg total` },
      metrics: [
        { label: "Weight Gained So Far", value: actualGain, unit: "kg", status },
        { label: "Expected by Week " + w + " (est.)", value: expectedByNow, unit: "kg", status: "normal" },
        { label: "IOM Recommended Total", value: `${recLow}–${recHigh} kg`, status: "good" },
        { label: "Rate (2nd/3rd trimester)", value: ratePerWeek, unit: "kg/week", status: ratePerWeek < 0.2 || (bmi < 25 && ratePerWeek > 0.65) ? "warning" : "good" },
        { label: "Projected Total at Term", value: gainAtTerm, unit: "kg", status: gainAtTerm >= recLow && gainAtTerm <= recHigh ? "good" : "warning" },
        { label: "Pre-pregnancy BMI", value: bmi, unit: "kg/m²", status: "normal" },
        { label: "BMI Category", value: category, status: "normal" }
      ],
      recommendations: [
        { title: "IOM Guidelines 2009", description: `For ${category} women (BMI ${bmi}), recommended total gain is ${recLow}–${recHigh} kg. T1: ~0.5-2 kg total. T2+T3: ${bmi < 25 ? "0.4-0.5" : "0.2-0.3"} kg/week. Your projection: ${gainAtTerm} kg total — ${gainAtTerm >= recLow && gainAtTerm <= recHigh ? "on track" : "outside recommended range"}.`, priority: "high", category: "Guidelines" },
        { title: "Weight Gain Distribution", description: "Of total 11-16 kg (normal BMI): Baby: ~3.4 kg | Placenta: ~0.7 kg | Amniotic fluid: ~0.9 kg | Uterus: ~1 kg | Breasts: ~0.9 kg | Blood: ~1.8 kg | Fat: ~2-4 kg", priority: "medium", category: "Breakdown" }
      ],
      detailedBreakdown: { "BMI (pre-preg)": bmi, "Category": category, "Gained So Far": `${actualGain} kg`, "Recommended Total": `${recLow}–${recHigh} kg`, "Projected": `${gainAtTerm} kg` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-weight-gain-calculator" title="Pregnancy Weight Gain Calculator"
      description="Track pregnancy weight gain vs IOM 2009 guidelines based on pre-pregnancy BMI. Includes trimester rates and goal tracking."
      icon={Baby} calculate={calculate} onClear={() => { setPrePregnancyBMI(22); setCurrentWeight(65); setPreWeight(60); setWeeks(20); setResult(null) }}
      values={[prePregnancyBMI, currentWeight, preWeight, weeks]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Weight Gain Calculator" description="Track healthy pregnancy weight gain from IOM guidelines." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Pre-pregnancy BMI" val={prePregnancyBMI} set={setPrePregnancyBMI} min={12} max={60} step={0.1} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Pre-pregnancy Weight" val={preWeight} set={setPreWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={250} step={0.5} suffix="kg" />
        </div>
        <NumInput label="Current Gestational Week" val={weeks} set={setWeeks} min={4} max={44} suffix="weeks" />
      </div>} />
  )
}

// ─── 5. Baby Height Predictor (Mid-Parental) ─────────────────────────────────
export function BabyHeightPredictor() {
  const [fatherHeight, setFatherHeight] = useState(175)
  const [motherHeight, setMotherHeight] = useState(163)
  const [childGender, setChildGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const f = clamp(fatherHeight, 140, 220)
    const m = clamp(motherHeight, 130, 200)
    const male = childGender === "male"

    // Tanner mid-parental height formula
    const midParentalHeight = male
      ? (f + m + 13) / 2
      : (f + m - 13) / 2

    const sdRange = 8.5  // ±1SD = 8.5 cm
    const low = r1(midParentalHeight - sdRange)
    const high = r1(midParentalHeight + sdRange)
    const predicted = r1(midParentalHeight)

    setResult({
      primaryMetric: { label: "Predicted Adult Height", value: predicted, unit: "cm", status: "good", description: `95% range: ${low} – ${high} cm (±8.5 cm one SD)` },
      metrics: [
        { label: "Predicted Height", value: predicted, unit: "cm", status: "good" },
        { label: "Expected Range (±1 SD)", value: `${low}–${high} cm`, status: "good" },
        { label: "Mid-Parental Height", value: r1(midParentalHeight), unit: "cm", status: "normal" },
        { label: "Father's Height", value: f, unit: "cm", status: "normal" },
        { label: "Mother's Height", value: m, unit: "cm", status: "normal" },
        { label: "Gender Correction", value: male ? "+6.5 cm (male)" : "−6.5 cm (female)", status: "normal" }
      ],
      recommendations: [
        { title: "About Mid-Parental Height", description: `The Tanner equation predicts adult height within ±8.5 cm of ${predicted} cm for 68% of children (±17 cm for 95%). Predicted: ${predicted} cm. Genetics accounts for ~80% of height variation; nutrition, sleep, and health account for the rest.`, priority: "high", category: "Interpretation" },
        { title: "Nutrients for Optimal Growth", description: "Calcium (1,000-1,300 mg/day), Vitamin D (600 IU/day), Protein, and Zinc are critical for bone growth. Adequate sleep is essential as 80% of growth hormone is released during deep sleep.", priority: "medium", category: "Nutrition" },
        { title: "Growth Concerns", description: "Consult a pediatrician if: height is below the 3rd percentile for age, growth rate slows unexpectedly, or predicted height is >2 standard deviations from the mid-parental height.", priority: "medium", category: "Medical" }
      ],
      detailedBreakdown: { "Father": `${f} cm`, "Mother": `${m} cm`, "Mid-parental": `${r1(midParentalHeight)} cm`, "Predicted": `${predicted} cm`, "Range": `${low}–${high} cm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-height-predictor" title="Baby Height Predictor (Adult)"
      description="Predict a child's adult height using the Tanner mid-parental height formula based on both parents' heights."
      icon={Baby} calculate={calculate} onClear={() => { setFatherHeight(175); setMotherHeight(163); setChildGender("male"); setResult(null) }}
      values={[fatherHeight, motherHeight, childGender]} result={result}
      seoContent={<SeoContentGenerator title="Baby Height Predictor" description="Predict adult height from parents' heights." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Child's Gender" val={childGender} set={setChildGender} options={[{ value: "male", label: "Male (Boy)" }, { value: "female", label: "Female (Girl)" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Father's Height" val={fatherHeight} set={setFatherHeight} min={140} max={220} suffix="cm" />
          <NumInput label="Mother's Height" val={motherHeight} set={setMotherHeight} min={130} max={200} suffix="cm" />
        </div>
      </div>} />
  )
}

// ─── 6. HCG Doubling Calculator ───────────────────────────────────────────────
export function HCGDoublingCalculator() {
  const [hcg1, setHcg1] = useState(300)
  const [hcg2, setHcg2] = useState(650)
  const [daysBetween, setDaysBetween] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h1 = clamp(hcg1, 1, 500000)
    const h2 = clamp(hcg2, 1, 500000)
    const d = clamp(daysBetween, 1, 14)

    const doublingTime = r1(d * Math.LN2 / Math.log(h2 / h1))
    const increase = r1((h2 / h1 - 1) * 100)
    const expectedMin = h1 * Math.pow(2, d / 2.0)   // every 2 days doubles
    const expectedMax = h1 * Math.pow(2, d / 1.3)   // every 1.3 days

    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    let interpretation = ""
    if (h2 < h1) { status = "danger"; interpretation = "HCG declining — concerning for pregnancy loss or ectopic. Urgent OB evaluation." }
    else if (doublingTime <= 3) { status = "good"; interpretation = "Normal doubling time. Healthy early pregnancy signs." }
    else if (doublingTime <= 4) { status = "normal"; interpretation = "Slightly slow but within acceptable range." }
    else { status = "warning"; interpretation = "Slow doubling time — requires follow-up evaluation by OB/GYN." }

    setResult({
      primaryMetric: { label: "HCG Doubling Time", value: doublingTime > 0 ? doublingTime : "N/A", unit: "days", status, description: interpretation },
      metrics: [
        { label: "First HCG", value: h1, unit: "mIU/mL", status: "normal" },
        { label: "Second HCG", value: h2, unit: "mIU/mL", status: h2 > h1 ? "good" : "danger" },
        { label: "Percentage Increase", value: r1(increase), unit: "%", status: increase > 60 ? "good" : "warning" },
        { label: "Doubling Time", value: doublingTime > 0 ? doublingTime : "N/A", unit: "days", status },
        { label: "Expected Range", value: `${r0(expectedMin).toLocaleString()}–${r0(expectedMax).toLocaleString()}`, unit: "mIU/mL", status: "normal" },
        { label: "Days Between Tests", value: d, status: "normal" }
      ],
      recommendations: [
        { title: "Normal HCG Patterns", description: "In early pregnancy (up to ~8-9 weeks), HCG typically doubles every 1.4-2.1 days. Doubling time <2 days: Possibly twins. 2-3 days: Normal. 3-4 days: Monitor. >4 days or declining: Abnormal — urgent evaluation.", priority: "high", category: "Interpretation" },
        { title: "HCG Alone is Not Diagnostic", description: "A single HCG value and even doubling pattern alone cannot confirm or exclude normal intrauterine pregnancy. Transvaginal ultrasound at appropriate HCG levels (usually >1,500-2,000 mIU/mL) is required for visualization.", priority: "high", category: "Medical" }
      ],
      detailedBreakdown: { "HCG 1": `${h1} mIU/mL`, "HCG 2": `${h2} mIU/mL`, "Days Between": d, "Change": `+${r1(increase)}%`, "Doubling Time": `${doublingTime} days` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hcg-doubling-calculator" title="HCG Doubling Calculator"
      description="Calculate the HCG doubling time between two blood tests. Assess early pregnancy progression against normal doubling rates."
      icon={Activity} calculate={calculate} onClear={() => { setHcg1(300); setHcg2(650); setDaysBetween(2); setResult(null) }}
      values={[hcg1, hcg2, daysBetween]} result={result}
      seoContent={<SeoContentGenerator title="HCG Doubling Calculator" description="Calculate HCG doubling time in early pregnancy." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="First HCG Level" val={hcg1} set={setHcg1} min={1} max={500000} suffix="mIU/mL" />
          <NumInput label="Second HCG Level" val={hcg2} set={setHcg2} min={1} max={500000} suffix="mIU/mL" />
        </div>
        <NumInput label="Days Between Tests" val={daysBetween} set={setDaysBetween} min={1} max={14} />
      </div>} />
  )
}

// ─── 7. Baby Blood Type Calculator ───────────────────────────────────────────
export function BabyBloodTypeCalculator() {
  const [motherBlood, setMotherBlood] = useState("A")
  const [motherRh, setMotherRh] = useState("+")
  const [fatherBlood, setFatherBlood] = useState("B")
  const [fatherRh, setFatherRh] = useState("+")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // ABO blood type possibility matrix
    const possibilities: Record<string, Record<string, string[]>> = {
      "O": { "O": ["O"], "A": ["O", "A"], "B": ["O", "B"], "AB": ["A", "B"] },
      "A": { "O": ["O", "A"], "A": ["O", "A"], "B": ["O", "A", "B", "AB"], "AB": ["A", "B", "AB"] },
      "B": { "O": ["O", "B"], "A": ["O", "A", "B", "AB"], "B": ["O", "B"], "AB": ["A", "B", "AB"] },
      "AB": { "O": ["A", "B"], "A": ["A", "B", "AB"], "B": ["A", "B", "AB"], "AB": ["A", "B", "AB"] }
    }

    const types = possibilities[motherBlood]?.[fatherBlood] ?? ["Unknown"]
    const pct = Math.round(100 / types.length)

    const rhOptions: string[] = []
    const mRh = motherRh === "+"
    const fRh = fatherRh === "+"
    if (mRh && fRh) { rhOptions.push("+", "-"); }
    else if (mRh || fRh) { rhOptions.push("+", "-"); }
    else { rhOptions.push("-"); }

    const allCombinations = types.flatMap(t => rhOptions.map(r => t + r))

    const rhConflict = motherRh === "-" && fatherRh === "+"
    setResult({
      primaryMetric: { label: "Possible Blood Types", value: allCombinations.join(", "), status: rhConflict ? "warning" : "good", description: `${allCombinations.length} possible blood type(s) for baby` },
      metrics: [
        { label: "Mother's Blood Type", value: motherBlood + motherRh, status: "normal" },
        { label: "Father's Blood Type", value: fatherBlood + fatherRh, status: "normal" },
        { label: "Possible ABO Types", value: types.join(", "), status: "good" },
        { label: "Approximate Probability Each", value: `~${pct}%`, status: "normal" },
        { label: "Rh Factor Risk", value: rhConflict ? "Rh incompatibility risk — see doctor" : "No Rh conflict", status: rhConflict ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Blood Type Inheritance", description: `Mother (${motherBlood}${motherRh}) × Father (${fatherBlood}${fatherRh}) → Baby can be: ${allCombinations.join(", ")}. ABO blood type is controlled by 3 alleles (A, B, O) with A and B dominant over O. Both parents pass one allele to the child.`, priority: "high", category: "Genetics" },
        ...(rhConflict ? [{ title: "Rh Incompatibility Warning", description: "Mother is Rh-negative and father is Rh-positive. If baby inherits Rh+, mother's immune system may produce antibodies. Anti-D injection (Rhogam) is given at 28 weeks and within 72 hours after delivery to prevent sensitization.", priority: "high" as const, category: "Medical Alert" }] : [])
      ],
      detailedBreakdown: { "Mother": motherBlood + motherRh, "Father": fatherBlood + fatherRh, "Possible Types": allCombinations.join(", "), "Rh Risk": rhConflict ? "Yes" : "No" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-blood-type-calculator" title="Baby Blood Type Calculator"
      description="Determine possible blood types for a baby based on parents' ABO and Rh blood types. Includes Rh incompatibility alert."
      icon={Heart} calculate={calculate} onClear={() => { setMotherBlood("A"); setMotherRh("+"); setFatherBlood("B"); setFatherRh("+"); setResult(null) }}
      values={[motherBlood, motherRh, fatherBlood, fatherRh]} result={result}
      seoContent={<SeoContentGenerator title="Baby Blood Type Calculator" description="Predict baby's possible blood types from parents." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm text-muted-foreground">Enter both parents' ABO blood types and Rh factor.</p>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Mother's ABO Type" val={motherBlood} set={setMotherBlood} options={["A", "B", "AB", "O"].map(v => ({ value: v, label: `Type ${v}` }))} />
          <SelectInput label="Mother's Rh Factor" val={motherRh} set={setMotherRh} options={[{ value: "+", label: "Positive (+)" }, { value: "-", label: "Negative (−)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Father's ABO Type" val={fatherBlood} set={setFatherBlood} options={["A", "B", "AB", "O"].map(v => ({ value: v, label: `Type ${v}` }))} />
          <SelectInput label="Father's Rh Factor" val={fatherRh} set={setFatherRh} options={[{ value: "+", label: "Positive (+)" }, { value: "-", label: "Negative (−)" }]} />
        </div>
      </div>} />
  )
}

// ─── 8. Conception Calculator ─────────────────────────────────────────────────
export function ConceptionDateCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [dueDate, setDueDate] = useState(today)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const edd = new Date(dueDate)
    if (isNaN(edd.getTime())) return

    const lmp = new Date(edd)
    lmp.setDate(lmp.getDate() - 280)

    const conceptionStart = new Date(lmp)
    conceptionStart.setDate(conceptionStart.getDate() + 11)

    const conceptionEnd = new Date(lmp)
    conceptionEnd.setDate(conceptionEnd.getDate() + 21)

    const ovulationDate = new Date(lmp)
    ovulationDate.setDate(ovulationDate.getDate() + 14)

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })

    setResult({
      primaryMetric: { label: "Estimated LMP", value: fmt(lmp), status: "good", description: `Conception window: ${fmt(conceptionStart)} – ${fmt(conceptionEnd)}` },
      metrics: [
        { label: "Estimated LMP", value: fmt(lmp), status: "good" },
        { label: "Estimated Ovulation", value: fmt(ovulationDate), status: "good" },
        { label: "Conception Window Start", value: fmt(conceptionStart), status: "good" },
        { label: "Conception Window End", value: fmt(conceptionEnd), status: "good" },
        { label: "Entered Due Date", value: fmt(edd), status: "normal" }
      ],
      recommendations: [
        { title: "Working Backwards from EDD", description: `EDD of ${fmt(edd)} means LMP was ${fmt(lmp)} and conception likely occurred between ${fmt(conceptionStart)} and ${fmt(conceptionEnd)}. This assumes a 28-day cycle with ovulation on day 14.`, priority: "high", category: "Calculation" },
        { title: "Note on Accuracy", description: "Conception windows are estimates. Due dates are typically confirmed by ultrasound. If your cycle is longer or shorter than 28 days, the actual conception date may differ from this estimate.", priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: { "Due Date": fmt(edd), "LMP (est.)": fmt(lmp), "Ovulation (est.)": fmt(ovulationDate), "Conception Window": `${fmt(conceptionStart)} – ${fmt(conceptionEnd)}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="conception-date-calculator" title="Conception Date Calculator"
      description="Estimate your conception date by working backwards from your due date. Includes ovulation date and LMP estimation."
      icon={Calendar} calculate={calculate} onClear={() => { setDueDate(today); setResult(null) }}
      values={[dueDate]} result={result}
      seoContent={<SeoContentGenerator title="Conception Date Calculator" description="Calculate conception date from due date." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Estimated Due Date (EDD)" val={dueDate} set={setDueDate} />
      </div>} />
  )
}
