"use client"

import { useState } from "react"
import { Baby, Heart, Calendar, Activity, TrendingUp } from "lucide-react"
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

// Normal CDF → percentile (Abramowitz & Stegun approximation, error < 7.5×10⁻⁸)
function zToPct(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z))
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp(-z * z)
  const cdf = (1 + (z >= 0 ? erf : -erf)) / 2
  return r0(clamp(cdf * 100, 1, 99))
}

// ─── 1. Advanced Pregnancy Calculator ─────────────────────────────────────────
export function PregnancyCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [cycleLength, setCycleLength] = useState(28)
  const [age, setAge] = useState(28)
  const [prevPregnancies, setPrevPregnancies] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    if (isNaN(lmp.getTime())) return
    const now = new Date()
    const cycleAdj = cycleLength - 28
    const edd = new Date(lmp)
    edd.setDate(edd.getDate() + 280 + cycleAdj)

    const daysPregnant = Math.floor((now.getTime() - lmp.getTime()) / 86400000)
    const weeksPregnant = Math.floor(daysPregnant / 7)
    const extraDays = daysPregnant % 7
    const daysToEDD = Math.floor((edd.getTime() - now.getTime()) / 86400000)

    const trimesterNum = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3
    const trimesterLabels = ["First Trimester (1-12 wks)", "Second Trimester (13-26 wks)", "Third Trimester (27-40 wks)"]
    const trimester = trimesterLabels[trimesterNum - 1]
    const eddStr = edd.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })

    const advancedMaternalAge = age >= 35
    const teenMom = age < 18
    const grandMultipara = prevPregnancies >= 5
    let riskScore = 0
    if (advancedMaternalAge) riskScore += 2
    if (teenMom) riskScore += 2
    if (grandMultipara) riskScore += 1
    if (weeksPregnant > 42) riskScore += 3
    const status = riskScore === 0 ? "good" : riskScore <= 2 ? "warning" : "danger"
    const riskLabel = riskScore === 0 ? "Standard Risk" : riskScore <= 2 ? "Moderate Risk" : "High Risk"

    const devStages: Array<{ lo: number; hi: number; desc: string }> = [
      { lo: 1, hi: 3, desc: "Pre-embryonic — implantation, hCG rising" },
      { lo: 4, hi: 7, desc: "Embryonic — heart tube, neural fold forming" },
      { lo: 8, hi: 11, desc: "Organogenesis — all organs forming (critical period)" },
      { lo: 12, hi: 13, desc: "End of T1 — NT scan window, miscarriage risk falls" },
      { lo: 14, hi: 17, desc: "Placenta takes over hormone production" },
      { lo: 18, hi: 20, desc: "Anatomy scan window — fetal movement begins" },
      { lo: 21, hi: 23, desc: "Rapid growth — viability threshold approaching (24w)" },
      { lo: 24, hi: 28, desc: "Viability milestone — GTT screening at 24-28w" },
      { lo: 29, hi: 32, desc: "Rapid brain/lung development — position check" },
      { lo: 33, hi: 36, desc: "GBS swab at 35-37w — lung maturation phase" },
      { lo: 37, hi: 42, desc: "Full term — birth plan, cervical checks" }
    ]
    let devStage = "Gestational week outside expected range"
    for (const s of devStages) {
      if (weeksPregnant >= s.lo && weeksPregnant <= s.hi) { devStage = s.desc; break }
    }

    const urgentTest =
      weeksPregnant >= 10 && weeksPregnant <= 14 ? "NT scan + NIPT due now" :
      weeksPregnant >= 18 && weeksPregnant <= 20 ? "Anatomy ultrasound due now" :
      weeksPregnant >= 24 && weeksPregnant <= 28 ? "Glucose tolerance test due now" :
      weeksPregnant >= 35 && weeksPregnant <= 37 ? "Group B Strep culture due now" :
      weeksPregnant >= 38 ? "Weekly antenatal monitoring" : "Routine prenatal care"

    const t1Guidance = "Folate 800mcg essential. Avoid alcohol, smoking, raw fish, soft cheeses. Manage nausea with small frequent meals."
    const t2Guidance = "Iron 27mg/day, Calcium 1000mg, DHA 200mg. +340 kcal/day. GTT screening at 24-28w."
    const t3Guidance = "Protein 70g/day. Monitor kick counts (10 kicks in 2 hrs). Non-stress tests. Birth plan preparation."

    setResult({
      primaryMetric: { label: "Gestational Age", value: `${weeksPregnant}w ${extraDays}d`, status, description: `${riskLabel} · ${trimester}` },
      metrics: [
        { label: "Estimated Due Date", value: eddStr, status: "good" },
        { label: "Trimester", value: trimester, status: "good" },
        { label: "Days Remaining", value: `${daysToEDD > 0 ? daysToEDD : 0} days`, status: daysToEDD > 7 ? "good" : daysToEDD >= 0 ? "warning" : "danger" },
        { label: "Risk Category", value: riskLabel, status },
        { label: "Active Screening", value: urgentTest, status: urgentTest.includes("due now") ? "warning" : "normal" },
        { label: "Maternal Age", value: `${age} yrs ${advancedMaternalAge ? "— AMA (≥35)" : teenMom ? "— Teen (<18)" : "— Normal"}`, status: advancedMaternalAge || teenMom ? "warning" : "good" }
      ],
      recommendations: [
        { title: `Week ${weeksPregnant}: Development Stage`, description: devStage, priority: "high", category: "Weekly Guide" },
        { title: urgentTest.includes("due now") ? "Screening Due Now" : "Screening Schedule", description: `W10-14: NT scan + NIPT. W15-20: Quad screen (if no NIPT). W18-20: Anatomy ultrasound. W24-28: 50g GTT. W35-37: GBS culture. W36+: Weekly NST if high-risk. ${urgentTest.includes("due now") ? `⚠ Currently: ${urgentTest}` : ""}`, priority: urgentTest.includes("due now") ? "high" : "medium", category: "Screening" },
        { title: riskScore > 0 ? `${riskLabel} — Advisory` : "Nutrition & Care", description: advancedMaternalAge ? "AMA (≥35 yrs): Elevated chromosomal anomaly, gestational hypertension, and C-section risk. NIPT + detailed anomaly scan strongly recommended. MFM referral if ≥40 years." : teenMom ? "Teen pregnancy: Enhanced nutritional support, anemia prevention, and social support essential. Preterm and low birth weight risk elevated." : grandMultipara ? "Grand multipara (5+ pregnancies): Uterine atony, placenta previa, and rupture risk marginally elevated. Serial ultrasounds recommended." : trimesterNum === 1 ? t1Guidance : trimesterNum === 2 ? t2Guidance : t3Guidance, priority: riskScore > 0 ? "high" : "medium", category: riskScore > 0 ? "Risk Advisory" : "Nutrition" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "EDD": eddStr, "Gestational Age": `${weeksPregnant}w ${extraDays}d`, "Trimester": trimester, "Maternal Age": `${age} yrs`, "Risk": riskLabel }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-calculator" title="Advanced Pregnancy Calculator"
      description="Comprehensive pregnancy tracking — gestational age, EDD, trimester milestones, weekly development, and maternal risk stratification."
      icon={Baby} calculate={calculate} onClear={() => { setLmpDate(today); setCycleLength(28); setAge(28); setPrevPregnancies(0); setResult(null) }}
      values={[lmpDate, cycleLength, age, prevPregnancies]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Calculator" description="Advanced pregnancy due date, gestational age, and risk calculator." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Menstrual Period (LMP)" val={lmpDate} set={setLmpDate} />
        <NumInput label="Average Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
        <NumInput label="Maternal Age" val={age} set={setAge} min={14} max={55} suffix="years" />
        <NumInput label="Previous Pregnancies" val={prevPregnancies} set={setPrevPregnancies} min={0} max={15} />
      </div>} />
  )
}

// ─── 2. Fertility Window Calculator ───────────────────────────────────────────
export function FertilityWindowCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [cycleLength, setCycleLength] = useState(28)
  const [lutealPhase, setLutealPhase] = useState(14)
  const [age, setAge] = useState(28)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    if (isNaN(lmp.getTime())) return

    const ovulationDayNum = cycleLength - lutealPhase
    const ovulationDate = new Date(lmp)
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDayNum - 1)

    const fertileStart = new Date(ovulationDate)
    fertileStart.setDate(fertileStart.getDate() - 5)
    const fertileEnd = new Date(ovulationDate)
    const peakDay = new Date(ovulationDate)
    peakDay.setDate(peakDay.getDate() - 1)

    const baseRate = age < 25 ? 25 : age < 30 ? 22 : age < 35 ? 18 : age < 40 ? 11 : age < 45 ? 5 : 1

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })

    const shortCycle = cycleLength < 21
    const longCycle = cycleLength > 35
    const shortLuteal = lutealPhase < 12
    const irregularFlag = shortCycle || longCycle || shortLuteal
    const status = irregularFlag ? "warning" : "good"

    const nextPeriod = new Date(lmp)
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength)

    setResult({
      primaryMetric: { label: "Fertile Window", value: `${fmt(fertileStart)} – ${fmt(fertileEnd)}`, status, description: `Ovulation: ${fmt(ovulationDate)} · Peak fertility: ${fmt(peakDay)}` },
      metrics: [
        { label: "Ovulation Date", value: fmt(ovulationDate), status: "good" },
        { label: "Peak Fertility Day", value: fmt(peakDay), status: "good" },
        { label: "Fertile Window", value: `${fmt(fertileStart)} – ${fmt(fertileEnd)}`, status: "good" },
        { label: "Next Expected Period", value: fmt(nextPeriod), status: "normal" },
        { label: "Monthly Success Rate", value: `~${baseRate}%`, status: baseRate >= 15 ? "good" : baseRate >= 8 ? "warning" : "danger" },
        { label: "Cycle Regularity", value: irregularFlag ? `Irregular — ${shortCycle ? "Short cycle" : longCycle ? "Long cycle" : "Short luteal phase"}` : "Regular", status }
      ],
      recommendations: [
        { title: "Conception Timing", description: `Best intercourse days: ${fmt(peakDay)} (peak) and the 2–3 days prior. Sperm survival: up to 5 days. Egg viability: only 12–24 hours post-ovulation. Daily or every-other-day intercourse during the fertile window maximises chances.`, priority: "high", category: "Timing" },
        { title: irregularFlag ? "Cycle Irregularity Detected" : "Cycle Assessment Normal", description: irregularFlag ? `${shortCycle ? "Cycle length < 21 days (polymenorrhea): Consider thyroid, hyperprolactinemia, or perimenopause evaluation." : longCycle ? "Cycle > 35 days (oligomenorrhea): PCOS, hypothyroidism, or functional hypothalamic amenorrhea common causes." : "Luteal phase < 12 days: Possible luteal phase defect reducing implantation window. Progesterone on day 21 of cycle recommended."} Consult a gynecologist.` : "Cycle length and luteal phase are within normal parameters. Continue tracking for 3 cycles to confirm consistency.", priority: irregularFlag ? "high" : "low", category: "Cycle Health" },
        { title: "Age & Fertility Counselling", description: `At age ${age}, monthly conception probability is ~${baseRate}% with optimal timing. If no success after ${age < 35 ? "12" : "6"} months of regular timed intercourse, seek reproductive medicine consultation. AMH testing can quantify ovarian reserve.`, priority: "medium", category: "Age Advisory" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "Cycle Length": `${cycleLength}d`, "Luteal Phase": `${lutealPhase}d`, "Ovulation Day": `Day ${ovulationDayNum}`, "Monthly Rate": `~${baseRate}%`, "Regular": irregularFlag ? "No" : "Yes" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fertility-window" title="Fertility Window Calculator"
      description="Pinpoint your fertile window, ovulation date, and peak fertility day with age-adjusted monthly probability and irregular cycle detection."
      icon={Calendar} calculate={calculate} onClear={() => { setLmpDate(today); setCycleLength(28); setLutealPhase(14); setAge(28); setResult(null) }}
      values={[lmpDate, cycleLength, lutealPhase, age]} result={result}
      seoContent={<SeoContentGenerator title="Fertility Window Calculator" description="Find your fertile window, ovulation date, and conception probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Period (LMP)" val={lmpDate} set={setLmpDate} />
        <NumInput label="Cycle Length" val={cycleLength} set={setCycleLength} min={18} max={50} suffix="days" />
        <NumInput label="Luteal Phase Length" val={lutealPhase} set={setLutealPhase} min={10} max={18} suffix="days" />
        <NumInput label="Your Age" val={age} set={setAge} min={15} max={50} />
      </div>} />
  )
}

// ─── 3. Pregnancy Week Calculator ─────────────────────────────────────────────
export function PregnancyWeekCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [cycleLength, setCycleLength] = useState(28)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    if (isNaN(lmp.getTime())) return
    const now = new Date()
    const cycleAdj = cycleLength - 28
    const edd = new Date(lmp)
    edd.setDate(edd.getDate() + 280 + cycleAdj)

    const daysPregnant = Math.floor((now.getTime() - lmp.getTime()) / 86400000)
    const weeks = Math.floor(daysPregnant / 7)
    const days = daysPregnant % 7
    const daysRemaining = Math.max(0, Math.floor((edd.getTime() - now.getTime()) / 86400000))
    const weeksRemaining = Math.floor(daysRemaining / 7)

    const devStages: Array<{ lo: number; hi: number; desc: string }> = [
      { lo: 1, hi: 3, desc: "Blastocyst implanting. hCG production begins. Missed period." },
      { lo: 4, hi: 6, desc: "Heartbeat detectable at week 6. Embryo ~4mm. Neural tube closing." },
      { lo: 7, hi: 9, desc: "Facial features, limb buds, fingers/toes forming. Now 2-3cm." },
      { lo: 10, hi: 13, desc: "NT scan window (10-14w). All major organs formed. Miscarriage risk drops." },
      { lo: 14, hi: 17, desc: "Placenta fully functional. Sex may be visible on scan. Movements starting." },
      { lo: 18, hi: 20, desc: "Anatomy ultrasound now (18-20w). Fetal weight ~300-450g." },
      { lo: 21, hi: 23, desc: "Rapid growth continues. Hearing functional. Viability threshold at 24w." },
      { lo: 24, hi: 28, desc: "24-28w: Glucose tolerance test. Eyes can open. Lung surfactant developing." },
      { lo: 29, hi: 32, desc: "Baby turns head-down. Bone marrow making blood cells. 1.5-2kg." },
      { lo: 33, hi: 36, desc: "GBS swab at 35-37w. Lungs maturing. 2.2-2.8kg." },
      { lo: 37, hi: 42, desc: "Full term from 37w. Head engaging. Birth can occur any time." }
    ]
    let devStage = "Pre-pregnancy or error in date"
    for (const s of devStages) {
      if (weeks >= s.lo && weeks <= s.hi) { devStage = s.desc; break }
    }

    const urgentTest =
      weeks >= 10 && weeks <= 14 ? "NT scan + NIPT due now" :
      weeks >= 18 && weeks <= 20 ? "Anatomy ultrasound due now" :
      weeks >= 24 && weeks <= 28 ? "Glucose tolerance test due now" :
      weeks >= 35 && weeks <= 37 ? "Group B Strep culture due now" :
      weeks >= 38 ? "Weekly antenatal check" : "Routine prenatal care"

    const nutritionByTrimester =
      weeks <= 12 ? "T1: Folate 800mcg, Vitamin D 600IU, avoid alcohol/raw fish. No extra calories needed." :
      weeks <= 26 ? "T2: +340 kcal/day. Iron 27mg, Calcium 1000mg, DHA 200mg. Anatomy scan window." :
      "T3: +450 kcal/day. Protein 70g, Magnesium for cramps. Kick counts (10 in 2 hrs)."

    const eddStr = edd.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    const status = weeks > 0 && weeks <= 42 ? "good" : weeks > 42 ? "danger" : "normal"

    setResult({
      primaryMetric: { label: "Current Pregnancy Week", value: `Week ${weeks} Day ${days}`, status, description: `${weeksRemaining}w ${daysRemaining % 7}d remaining · EDD: ${eddStr}` },
      metrics: [
        { label: "Gestational Age", value: `${weeks} weeks ${days} days`, status },
        { label: "Total Days Pregnant", value: `${daysPregnant} days`, status: "normal" },
        { label: "Weeks Remaining", value: `${weeksRemaining} weeks`, status: weeksRemaining > 4 ? "good" : weeksRemaining > 0 ? "warning" : "danger" },
        { label: "Estimated Due Date", value: eddStr, status: "good" },
        { label: "Active Screening", value: urgentTest, status: urgentTest.includes("due now") ? "warning" : "normal" },
        { label: "Trimester", value: weeks < 13 ? "First Trimester" : weeks < 27 ? "Second Trimester" : "Third Trimester", status: "good" }
      ],
      recommendations: [
        { title: `Week ${weeks}: Growth & Development`, description: devStage, priority: "high", category: "Development" },
        { title: urgentTest, description: `At week ${weeks}, the following care is recommended: ${urgentTest}. Full schedule: W10-14 NT+NIPT, W18-20 anatomy scan, W24-28 GTT, W35-37 GBS, W36+ weekly NST if high-risk.`, priority: urgentTest.includes("due now") ? "high" : "medium", category: "Screening" },
        { title: "Nutrition This Trimester", description: nutritionByTrimester, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "Gestational Age": `${weeks}w ${days}d`, "Days Pregnant": daysPregnant, "EDD": eddStr, "Remaining": `${daysRemaining} days` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-week-calculator" title="Pregnancy Week Calculator"
      description="Track your exact pregnancy week with developmental milestones, active screening alerts, and trimester-specific nutrition guidance."
      icon={Baby} calculate={calculate} onClear={() => { setLmpDate(today); setCycleLength(28); setResult(null) }}
      values={[lmpDate, cycleLength]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Week Calculator" description="Find your exact pregnancy week with fetal development milestones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Menstrual Period (LMP)" val={lmpDate} set={setLmpDate} />
        <NumInput label="Average Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
      </div>} />
  )
}

// ─── 4. Trimester Calculator ──────────────────────────────────────────────────
export function TrimesterCalculator() {
  const [gestWeeks, setGestWeeks] = useState(20)
  const [gestDays, setGestDays] = useState(0)
  const [age, setAge] = useState(28)
  const [complications, setComplications] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const totalDays = gestWeeks * 7 + gestDays
    const trimesterNum = gestWeeks < 13 ? 1 : gestWeeks < 27 ? 2 : 3
    const trimesterLabels = ["First Trimester", "Second Trimester", "Third Trimester"]
    const trimesterLabel = trimesterLabels[trimesterNum - 1]

    const trimesterEndDays = [84, 189, 280]
    const daysRemainingInTrimester = trimesterEndDays[trimesterNum - 1] - totalDays
    const weeksRemainingInTrimester = Math.max(0, Math.ceil(daysRemainingInTrimester / 7))

    let riskScore = 0
    if (age >= 35) riskScore++
    if (complications !== "none") riskScore += 2
    if (gestWeeks > 42) riskScore += 3
    const status = riskScore === 0 ? "good" : riskScore <= 2 ? "warning" : "danger"
    const riskLabel = riskScore === 0 ? "Standard Risk" : riskScore <= 2 ? "Elevated Risk" : "High Risk"

    const t1 = {
      focus: "Organogenesis — all major organs forming. Critical exposure period. hCG peaks at 8-10 weeks.",
      tests: "W8-10: Dating scan. W10-14: NT scan + NIPT. W15-18: Quad/AFP screen.",
      risks: "Miscarriage risk highest (10-20%). Ectopic pregnancy concern in early weeks. No alcohol/teratogens.",
      nutrition: "Folate 800mcg essential. Iodine, Vitamin D 600IU. Avoid raw meat, soft cheeses, high-mercury fish."
    }
    const t2 = {
      focus: "Growth and refinement phase. Fetal movements begin 18-20w. Cervical incompetence window.",
      tests: "W18-20: Anatomy (anomaly) ultrasound. W24-28: 50g Glucose tolerance test (GTT). BP monitoring.",
      risks: "Gestational diabetes risk (screen 24-28w). Placenta previa may be detected. Midtrimester loss rare.",
      nutrition: "Iron 27mg/day, Calcium 1000mg, DHA 200mg. +340 kcal/day from T2 start."
    }
    const t3 = {
      focus: "Rapid fetal weight gain. Lung maturation. Fetal position and presentation monitoring.",
      tests: "W35-37: GBS culture. W36+: Weekly NST if high-risk. Cervical assessment and birth planning.",
      risks: "Hypertensive disorders (pregestational BP ≥140/90), preterm labor, IUGR. Monitor kick counts.",
      nutrition: "Protein 70g/day, Calcium 1200mg, +450 kcal/day. Reduce sodium to limit fluid retention."
    }
    const guide = trimesterNum === 1 ? t1 : trimesterNum === 2 ? t2 : t3

    const complicationsMap: Record<string, string> = {
      none: "No known complications",
      gd: "Gestational Diabetes",
      pih: "Hypertension / Preeclampsia",
      placenta: "Placenta Previa",
      preterm: "Preterm Labor Risk",
      multiple: "Multiple Gestation"
    }

    setResult({
      primaryMetric: { label: "Current Trimester", value: trimesterLabel, status, description: `${gestWeeks}w ${gestDays}d · ${weeksRemainingInTrimester} weeks remaining in trimester · ${riskLabel}` },
      metrics: [
        { label: "Trimester", value: `${trimesterNum}${["st","nd","rd"][trimesterNum-1]} Trimester`, status },
        { label: "Gestational Age", value: `${gestWeeks}w ${gestDays}d`, status: "good" },
        { label: "Weeks Left in Trimester", value: `${weeksRemainingInTrimester} weeks`, status: weeksRemainingInTrimester > 2 ? "good" : "warning" },
        { label: "Risk Category", value: riskLabel, status },
        { label: "Known Complications", value: complicationsMap[complications] || complications, status: complications !== "none" ? "warning" : "good" },
        { label: "Maternal Age", value: `${age} yrs${age >= 35 ? " — AMA" : ""}`, status: age >= 35 ? "warning" : "good" }
      ],
      recommendations: [
        { title: `${trimesterLabel}: Clinical Focus`, description: guide.focus + " " + guide.risks, priority: "high", category: "Clinical Focus" },
        { title: "Upcoming Tests & Screens", description: guide.tests, priority: "high", category: "Screening Schedule" },
        { title: "Nutrition Guidelines", description: guide.nutrition, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "GA": `${gestWeeks}w ${gestDays}d`, "Trimester": trimesterLabel, "Risk": riskLabel, "Complications": complicationsMap[complications], "Age": `${age} yrs` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="trimester-calculator" title="Trimester Calculator"
      description="Identify your trimester, remaining weeks, complication risks, and care plans for each stage of pregnancy."
      icon={Baby} calculate={calculate} onClear={() => { setGestWeeks(20); setGestDays(0); setAge(28); setComplications("none"); setResult(null) }}
      values={[gestWeeks, gestDays, age, complications]} result={result}
      seoContent={<SeoContentGenerator title="Trimester Calculator" description="Pregnancy trimester guide with risk stratification and care recommendations." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Gestational Weeks" val={gestWeeks} set={setGestWeeks} min={1} max={42} suffix="weeks" />
        <NumInput label="Additional Days" val={gestDays} set={setGestDays} min={0} max={6} suffix="days" />
        <NumInput label="Maternal Age" val={age} set={setAge} min={14} max={55} suffix="years" />
        <SelectInput label="Known Complications" val={complications} set={setComplications} options={[
          { value: "none", label: "None" },
          { value: "gd", label: "Gestational Diabetes" },
          { value: "pih", label: "Hypertension / Preeclampsia" },
          { value: "placenta", label: "Placenta Previa" },
          { value: "preterm", label: "Preterm Labor Risk" },
          { value: "multiple", label: "Multiple Gestation (Twins+)" }
        ]} />
      </div>} />
  )
}

// ─── 5. Cycle Length Analyzer ─────────────────────────────────────────────────
export function CycleLengthCalculator() {
  const [c1, setC1] = useState(28)
  const [c2, setC2] = useState(29)
  const [c3, setC3] = useState(27)
  const [c4, setC4] = useState(28)
  const [c5, setC5] = useState(30)
  const [c6, setC6] = useState(28)
  const [numCycles, setNumCycles] = useState(4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const allCycles = [c1, c2, c3, c4, c5, c6]
    const cycles = allCycles.slice(0, numCycles).filter(c => c > 0)
    const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length
    const variance = cycles.reduce((a, b) => a + (b - avg) ** 2, 0) / cycles.length
    const sd = Math.sqrt(variance)
    const minCycle = Math.min(...cycles)
    const maxCycle = Math.max(...cycles)

    const shortCycles = avg < 21
    const longCycles = avg > 35
    const highVariability = sd > 5
    const irregular = shortCycles || longCycles || highVariability
    const lutealDeficiency = avg < 24
    const oligomenorrhea = avg > 35

    const status = sd > 8 ? "danger" : irregular ? "warning" : "good"
    const label = sd > 8 ? "Significantly Irregular" : irregular ? "Mildly Irregular" : "Regular Cycles"

    const nextPeriodIn = r0(avg - (cycles[cycles.length - 1] > 0 ? 0 : 0))

    setResult({
      primaryMetric: { label: "Average Cycle Length", value: `${r1(avg)} days`, status, description: `SD: ${r1(sd)} days · Range: ${minCycle}–${maxCycle} days · ${label}` },
      metrics: [
        { label: "Average Length", value: `${r1(avg)} days`, status },
        { label: "Variability (SD)", value: `${r1(sd)} days`, status: sd <= 3 ? "good" : sd <= 5 ? "warning" : "danger" },
        { label: "Shortest Cycle", value: `${minCycle} days`, status: minCycle >= 21 ? "good" : "warning" },
        { label: "Longest Cycle", value: `${maxCycle} days`, status: maxCycle <= 35 ? "good" : "warning" },
        { label: "Cycle Classification", value: label, status },
        { label: "Luteal Phase Concern", value: lutealDeficiency ? "Possible Short LP (<12 days)" : "Adequate LP", status: lutealDeficiency ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Cycle Health Assessment", description: irregular ? `Your cycles show variability (SD=${r1(sd)} days, avg=${r1(avg)} days). ${shortCycles ? "Short cycles (<21 days) may indicate polymenorrhea, thyroid dysfunction, or perimenopause." : longCycles ? "Long cycles (>35 days, oligomenorrhea) commonly indicate PCOS, hypothyroidism, or hyperprolactinemia." : highVariability ? "High cycle-to-cycle variability suggests hormonal irregularity — PCOS, stress, or thyroid issues are common causes."  : ""} Consult a gynecologist and track for 3 more cycles.` : `Cycles averaging ${r1(avg)} days with SD ${r1(sd)} days are regular and within normal range (21–35 days, SD ≤5 days). This indicates healthy ovulatory function.`, priority: irregular ? "high" : "low", category: "Cycle Assessment" },
        { title: lutealDeficiency ? "Luteal Phase Deficiency Concern" : "Luteal Phase Normal", description: lutealDeficiency ? `Average cycle of ${r1(avg)} days suggests a luteal phase under 12 days, which is insufficient for reliable implantation. Day 21 serum progesterone testing recommended. If trying to conceive, discuss progesterone supplementation with your OB/GYN.` : `Luteal phase appears adequate (estimated ≥12 days) based on cycle length. Normal progesterone support for implantation.`, priority: lutealDeficiency ? "high" : "low", category: "Fertility Concern" },
        { title: oligomenorrhea ? "Oligomenorrhea / Irregular Cycle Alert" : "No Endocrine Flags", description: oligomenorrhea ? "Cycles > 35 days strongly suggest ovulatory dysfunction. Recommended blood tests: FSH, LH, LH:FSH ratio, AMH, testosterone, prolactin, TSH, fasting insulin. Pelvic ultrasound for antral follicle count (PCOS morphology)." : `All ${numCycles} cycles within normal range. No endocrine concern detected. Continue monthly tracking.`, priority: oligomenorrhea ? "high" : "low", category: "Medical Advisory" }
      ],
      detailedBreakdown: { "Cycles Analyzed": numCycles, "Average": `${r1(avg)}d`, "SD": `${r1(sd)}d`, "Min": `${minCycle}d`, "Max": `${maxCycle}d`, "Status": label, "Next Period Est.": `In ~${r0(nextPeriodIn)} days` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cycle-length-calculator" title="Cycle Length Analyzer"
      description="Analyze cycle regularity with variability scoring, luteal phase assessment, and PCOS/thyroid disorder detection over 3–6 cycles."
      icon={Calendar} calculate={calculate} onClear={() => { setC1(28); setC2(29); setC3(27); setC4(28); setC5(30); setC6(28); setNumCycles(4); setResult(null) }}
      values={[c1, c2, c3, c4, c5, c6, numCycles]} result={result}
      seoContent={<SeoContentGenerator title="Cycle Length Calculator" description="Analyze menstrual cycle regularity and detect hormonal irregularities." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Number of Cycles to Analyze" val={String(numCycles)} set={v => setNumCycles(Number(v))} options={[
          { value: "3", label: "3 cycles" }, { value: "4", label: "4 cycles" }, { value: "5", label: "5 cycles" }, { value: "6", label: "6 cycles" }
        ]} />
        <NumInput label="Cycle 1 Length" val={c1} set={setC1} min={15} max={65} suffix="days" />
        <NumInput label="Cycle 2 Length" val={c2} set={setC2} min={15} max={65} suffix="days" />
        <NumInput label="Cycle 3 Length" val={c3} set={setC3} min={15} max={65} suffix="days" />
        {numCycles >= 4 && <NumInput label="Cycle 4 Length" val={c4} set={setC4} min={15} max={65} suffix="days" />}
        {numCycles >= 5 && <NumInput label="Cycle 5 Length" val={c5} set={setC5} min={15} max={65} suffix="days" />}
        {numCycles >= 6 && <NumInput label="Cycle 6 Length" val={c6} set={setC6} min={15} max={65} suffix="days" />}
      </div>} />
  )
}

// ─── 6. Period & Cycle Health Tracker ─────────────────────────────────────────
export function PeriodTracker() {
  const [daysSincePeriod, setDaysSincePeriod] = useState(14)
  const [duration, setDuration] = useState(5)
  const [flow, setFlow] = useState("medium")
  const [painLevel, setPainLevel] = useState(4)
  const [pmsScore, setPmsScore] = useState(3)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cycleDay = daysSincePeriod
    const phase =
      cycleDay <= duration ? "Menstrual Phase" :
      cycleDay <= 13 ? "Follicular Phase" :
      cycleDay <= 16 ? "Ovulatory Phase" : "Luteal Phase"

    const pmsSeverity = pmsScore <= 2 ? "Minimal" : pmsScore <= 5 ? "Moderate PMS" : pmsScore <= 8 ? "Severe PMS" : "Possible PMDD"
    const pmsStatus: "good" | "normal" | "warning" | "danger" = pmsScore <= 2 ? "good" : pmsScore <= 5 ? "normal" : pmsScore <= 8 ? "warning" : "danger"

    const painLabel = painLevel <= 3 ? "Mild/Absent dysmenorrhea" : painLevel <= 6 ? "Moderate dysmenorrhea" : "Severe dysmenorrhea"
    const painStatus: "good" | "warning" | "danger" = painLevel <= 3 ? "good" : painLevel <= 6 ? "warning" : "danger"

    const heavyFlow = flow === "very_heavy"
    const prolongedPeriod = duration > 7
    const endometriosisSuspicion = heavyFlow && painLevel >= 7
    const pcosSuspicion = (prolongedPeriod && heavyFlow) || pmsScore >= 8
    const overallStatus: "good" | "warning" | "danger" = endometriosisSuspicion || pmsScore > 8 ? "danger" : pcosSuspicion || painLevel >= 7 ? "warning" : "good"

    const phaseGuide: Record<string, string> = {
      "Menstrual Phase": "Rest and gentle movement. Iron-rich foods (spinach, lentils, red meat). Avoid caffeine and salt which worsen cramps. Heat therapy effective for dysmenorrhea.",
      "Follicular Phase": "Energy and mood rising as estrogen increases. Optimal for high-intensity workouts, social activity, and creative tasks.",
      "Ovulatory Phase": "Peak energy and libido. LH surge causes ovulation. Fertile window active. Cervical mucus egg-white consistency.",
      "Luteal Phase": "Progesterone dominant. PMS symptoms may occur. Magnesium (300–400mg) and Vitamin B6 (100mg) reduce PMS. Prioritise sleep and stress management."
    }

    setResult({
      primaryMetric: { label: "Cycle Phase", value: phase, status: overallStatus, description: `${pmsSeverity} · ${painLabel}` },
      metrics: [
        { label: "Estimated Cycle Day", value: `Day ${cycleDay}`, status: "normal" },
        { label: "Cycle Phase", value: phase, status: "good" },
        { label: "PMS Severity", value: pmsSeverity, status: pmsStatus },
        { label: "Pain / Dysmenorrhea", value: `${painLevel}/10 — ${painLabel.split(" ")[0]}`, status: painStatus },
        { label: "Endometriosis Suspicion", value: endometriosisSuspicion ? "High — GYN consult needed" : "Not detected", status: endometriosisSuspicion ? "danger" : "good" },
        { label: "PCOS Suspicion", value: pcosSuspicion ? "Moderate — Hormone test advised" : "Not detected", status: pcosSuspicion ? "warning" : "good" }
      ],
      recommendations: [
        { title: `${phase}: Guidance`, description: phaseGuide[phase] || "Continue tracking your cycle.", priority: "medium", category: "Phase Optimization" },
        { title: endometriosisSuspicion ? "Endometriosis Red Flag" : pcosSuspicion ? "PCOS Concern Detected" : "No Major Pathology Flags", description: endometriosisSuspicion ? "Heavy flow + severe pain (≥7/10) is a classic endometriosis presentation. Transvaginal ultrasound, serum CA-125, and laparoscopy (gold standard) are diagnostic tools. Avoid long-term NSAID self-medication without investigation." : pcosSuspicion ? "Prolonged heavy bleeding with severe PMS suggests possible PCOS. Recommended: LH:FSH ratio, testosterone, AMH, fasting insulin, pelvic ultrasound (antral follicle count)." : "No significant endometriosis or PCOS flags detected on current inputs. Continue monitoring over 3 months.", priority: endometriosisSuspicion || pcosSuspicion ? "high" : "low", category: "Gynecologic Screening" },
        { title: pmsScore > 8 ? "Possible PMDD — Seek Evaluation" : pmsScore > 5 ? "Severe PMS Management" : "PMS Prevention Tips", description: pmsScore > 8 ? "Premenstrual Dysphoric Disorder (PMDD) features severe mood disruption (anxiety, depression, irritability) in the 1-2 weeks before menstruation. SSRIs, oral contraceptives (Yasmin/Yaz), and CBT are evidence-based treatments. Please consult a psychiatrist or gynaecologist." : pmsScore > 5 ? "Severe PMS: Vitamin B6 100mg, Magnesium 400mg, Chasteberry (Vitex 20mg), and 30 min aerobic exercise daily have clinical evidence for symptom reduction." : "Mild PMS: Regular sleep (7-9h), reducing caffeine and salt in the luteal phase, and light exercise are first-line strategies.", priority: pmsScore > 5 ? "high" : "low", category: "PMS/PMDD Advisory" }
      ],
      detailedBreakdown: { "Cycle Day": cycleDay, "Phase": phase, "Flow": flow, "Period Duration": `${duration}d`, "Pain": `${painLevel}/10`, "PMS": `${pmsScore}/10 (${pmsSeverity})` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="period-tracker" title="Period & Cycle Health Tracker"
      description="Advanced menstrual health tracker with PMS/PMDD severity scoring, endometriosis and PCOS suspicion flags, and cycle phase optimization."
      icon={Activity} calculate={calculate} onClear={() => { setDaysSincePeriod(14); setDuration(5); setFlow("medium"); setPainLevel(4); setPmsScore(3); setResult(null) }}
      values={[daysSincePeriod, duration, flow, painLevel, pmsScore]} result={result}
      seoContent={<SeoContentGenerator title="Period Tracker" description="Track menstrual health with PMS, PCOS, and endometriosis detection." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Days Since Period Started (Cycle Day)" val={daysSincePeriod} set={setDaysSincePeriod} min={1} max={60} />
        <NumInput label="Period Duration" val={duration} set={setDuration} min={1} max={15} suffix="days" />
        <SelectInput label="Flow Intensity" val={flow} set={setFlow} options={[
          { value: "spotting", label: "Spotting only" },
          { value: "light", label: "Light" },
          { value: "medium", label: "Medium (normal)" },
          { value: "heavy", label: "Heavy" },
          { value: "very_heavy", label: "Very Heavy (soaking pad < 1 hr)" }
        ]} />
        <NumInput label="Pain / Cramp Level" val={painLevel} set={setPainLevel} min={0} max={10} suffix="0-10" />
        <NumInput label="PMS Symptom Severity" val={pmsScore} set={setPmsScore} min={0} max={10} suffix="0-10" />
      </div>} />
  )
}

// ─── 7. Conception Window Estimator ───────────────────────────────────────────
export function ConceptionWindowEstimator() {
  const today = new Date().toISOString().split("T")[0]
  const [lmpDate, setLmpDate] = useState(today)
  const [cycleLength, setCycleLength] = useState(28)
  const [age, setAge] = useState(28)
  const [timing, setTiming] = useState("yes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lmp = new Date(lmpDate)
    if (isNaN(lmp.getTime())) return

    const ovulationDayNum = cycleLength - 14
    const ovulation = new Date(lmp)
    ovulation.setDate(ovulation.getDate() + ovulationDayNum - 1)

    const windowStart = new Date(ovulation)
    windowStart.setDate(windowStart.getDate() - 5)
    const peakDay = new Date(ovulation)
    peakDay.setDate(peakDay.getDate() - 1)

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })

    const baseRate = age < 25 ? 33 : age < 30 ? 28 : age < 35 ? 22 : age < 38 ? 15 : age < 42 ? 8 : 3
    const timingMultiplier = timing === "yes" ? 1.0 : timing === "possible" ? 0.55 : 0.2
    const adjustedRate = r0(clamp(baseRate * timingMultiplier, 1, 45))

    const monthlyProb = baseRate / 100
    const cum6 = r0((1 - Math.pow(1 - monthlyProb, 6)) * 100)
    const cum12 = r0((1 - Math.pow(1 - monthlyProb, 12)) * 100)

    const day2Before = new Date(ovulation)
    day2Before.setDate(day2Before.getDate() - 2)

    const status: "good" | "warning" | "danger" = adjustedRate >= 18 ? "good" : adjustedRate >= 8 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Conception Probability", value: `~${adjustedRate}% this cycle`, status, description: `Fertile window: ${fmt(windowStart)} – ${fmt(ovulation)} · Ovulation: ${fmt(ovulation)}` },
      metrics: [
        { label: "Fertile Window", value: `${fmt(windowStart)} – ${fmt(ovulation)}`, status: "good" },
        { label: "Peak Fertility Days", value: `${fmt(day2Before)} – ${fmt(peakDay)}`, status: "good" },
        { label: "This Cycle Probability", value: `~${adjustedRate}%`, status },
        { label: "6-Month Cumulative", value: `~${cum6}%`, status: cum6 >= 60 ? "good" : cum6 >= 40 ? "warning" : "danger" },
        { label: "12-Month Cumulative", value: `~${cum12}%`, status: cum12 >= 80 ? "good" : cum12 >= 55 ? "warning" : "danger" },
        { label: "Timing Assessment", value: timing === "yes" ? "Optimal ✓" : timing === "possible" ? "Suboptimal" : "Non-optimal", status }
      ],
      recommendations: [
        { title: "Optimal Conception Strategy", description: `Intercourse on ${fmt(day2Before)} (2 days before ovulation) through ${fmt(ovulation)} (ovulation day) gives the highest success rate. Sperm remain viable up to 5 days; the egg survives only 12–24 hours. Every-other-day or daily intercourse during this window is recommended.`, priority: "high", category: "Timing Optimization" },
        { title: `Age ${age}: Fertility Outlook`, description: `Per-cycle probability: ~${baseRate}% (optimal timing). Over 12 months: ~${cum12}%. ${age >= 35 ? `After 35, fertility declines more rapidly. Recommend fertility evaluation if no conception in 6 months. Ovarian reserve (AMH, AFC) testing provides useful information.` : `Recommend evaluation if no conception after 12 months of regular timed intercourse.`}`, priority: "medium", category: "Age Advisory" },
        { title: "Male & Female Factor Optimisation", description: "Female: Folate 400mcg 3 months pre-conception. Maintain BMI 19–25 (extremes reduce fertility). Cervical mucus monitoring (egg-white = peak fertility). Male: Avoid scrotal heat, smoking, alcohol. CoQ10 300mg and zinc 25mg may improve sperm parameters. Optimum frequency: intercourse every 1–2 days.", priority: "medium", category: "Lifestyle" }
      ],
      detailedBreakdown: { "LMP": lmpDate, "Cycle Length": `${cycleLength}d`, "Ovulation Day": `Day ${ovulationDayNum}`, "Per-cycle Rate": `~${adjustedRate}%`, "6-Month": `~${cum6}%`, "12-Month": `~${cum12}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="conception-window" title="Conception Window Estimator"
      description="Age-adjusted conception probability with cumulative success rates, sperm viability modeling, and intercourse timing optimization."
      icon={Heart} calculate={calculate} onClear={() => { setLmpDate(today); setCycleLength(28); setAge(28); setTiming("yes"); setResult(null) }}
      values={[lmpDate, cycleLength, age, timing]} result={result}
      seoContent={<SeoContentGenerator title="Conception Window Estimator" description="Calculate conception probability with age-adjusted fertility rates." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="First Day of Last Period (LMP)" val={lmpDate} set={setLmpDate} />
        <NumInput label="Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
        <NumInput label="Your Age" val={age} set={setAge} min={18} max={50} />
        <SelectInput label="Intercourse During Fertile Window" val={timing} set={setTiming} options={[
          { value: "yes", label: "Yes — on/around ovulation days" },
          { value: "possible", label: "Possibly — unsure of timing" },
          { value: "no", label: "No — not during fertile window" }
        ]} />
      </div>} />
  )
}

// ─── 8. IVF Due Date Calculator ───────────────────────────────────────────────
export function IVFDueDateCalculator() {
  const today = new Date().toISOString().split("T")[0]
  const [transferDate, setTransferDate] = useState(today)
  const [embryoDay, setEmbryoDay] = useState("5")
  const [age, setAge] = useState(32)
  const [prevIVFCycles, setPrevIVFCycles] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const transfer = new Date(transferDate)
    if (isNaN(transfer.getTime())) return

    // EDD = transfer date + (266 days - embryo age at transfer)
    const embryoDays = Number(embryoDay)
    const daysToAdd = 266 - embryoDays
    const edd = new Date(transfer)
    edd.setDate(edd.getDate() + daysToAdd)

    // Gestational age: days since transfer + embryo age + 14 day LMP offset
    const now = new Date()
    const daysSinceTransfer = Math.max(0, Math.floor((now.getTime() - transfer.getTime()) / 86400000))
    const adjustedGADays = daysSinceTransfer + embryoDays + 14
    const gaWeeks = Math.floor(adjustedGADays / 7)
    const gaDaysExtra = adjustedGADays % 7
    const daysToEDD = Math.floor((edd.getTime() - now.getTime()) / 86400000)

    const veryHighRisk = age >= 43
    const highRisk = age >= 40 || prevIVFCycles >= 3
    const status: "good" | "warning" | "danger" = veryHighRisk ? "danger" : highRisk ? "warning" : "good"

    const eddStr = edd.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })

    const betaHCGDate = new Date(transfer)
    betaHCGDate.setDate(betaHCGDate.getDate() + (embryoDay === "5" ? 9 : 11))
    const viabilityUltrasound = new Date(transfer)
    viabilityUltrasound.setDate(viabilityUltrasound.getDate() + (embryoDay === "5" ? 14 : 16))
    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })

    setResult({
      primaryMetric: { label: "IVF Estimated Due Date", value: eddStr, status, description: `Adjusted GA: ${gaWeeks}w ${gaDaysExtra}d · ${daysToEDD > 0 ? daysToEDD + " days remaining" : "Past EDD"}` },
      metrics: [
        { label: "Transfer Date", value: transfer.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }), status: "good" },
        { label: "Embryo Stage", value: `Day ${embryoDay} (${embryoDay === "5" ? "Blastocyst" : "Cleavage Stage"})`, status: "good" },
        { label: "IVF Due Date", value: eddStr, status: "good" },
        { label: "Adjusted Gestational Age", value: `${gaWeeks}w ${gaDaysExtra}d`, status: "good" },
        { label: "Beta hCG Test Date", value: fmt(betaHCGDate), status: "normal" },
        { label: "Viability Scan Date", value: fmt(viabilityUltrasound), status: "normal" }
      ],
      recommendations: [
        { title: "IVF Pregnancy Milestones", description: `Beta hCG blood test: ${fmt(betaHCGDate)} (${embryoDay === "5" ? "9-10 days post 5DT" : "11-12 days post 3DT"}). Positive beta = pregnancy confirmed. Viability ultrasound: ~${fmt(viabilityUltrasound)} (fetal heartbeat). Progesterone/estrogen support continues until 10–12 weeks in most protocols. NT scan: 10–14 weeks GA.`, priority: "high", category: "IVF Protocol" },
        { title: veryHighRisk ? "Very High Risk — PGT-A Advised" : highRisk ? "High Risk — Enhanced Monitoring" : "Standard IVF Monitoring", description: veryHighRisk ? `Age ${age} ≥43: Very high chromosomal anomaly risk. Preimplantation Genetic Testing for Aneuploidy (PGT-A) strongly recommended prior to future transfers. Discuss donor egg option with your reproductive endocrinologist.` : highRisk ? `Age ${age}${prevIVFCycles >= 3 ? ` + ${prevIVFCycles} prior IVF cycles` : ""}: Enhanced monitoring. Weekly beta hCG doubling checks, early viability scan, progesterone extended to 14 weeks, aspirin 81mg if not contraindicated.` : "Standard IVF risk monitoring. Regular beta hCG, progesterone support as prescribed, viability scan at ~6-7 weeks GA.", priority: highRisk ? "high" : "medium", category: "Risk Advisory" },
        { title: "Luteal Phase & Emotional Support", description: "Continue prescribed progesterone (pessaries/injections/gel) and estrogen supplements until your clinic advises discontinuation (typically 10–12 weeks). Avoid strenuous activity until viability confirmed. The 2-week wait (2WW) is emotionally taxing — mind-body support, mindfulness, and fertility counselling are recommended.", priority: "medium", category: "Support Care" }
      ],
      detailedBreakdown: { "Transfer Date": transferDate, "Embryo Day": `Day ${embryoDay}`, "EDD": eddStr, "GA": `${gaWeeks}w ${gaDaysExtra}d`, "Maternal Age": `${age} yrs`, "Prior Cycles": prevIVFCycles }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ivf-due-date-calculator" title="IVF Due Date Calculator"
      description="Accurate IVF due date with Day 3/5 embryo adjustment, beta hCG timing, viability scan dates, and age-stratified risk assessment."
      icon={Baby} calculate={calculate} onClear={() => { setTransferDate(today); setEmbryoDay("5"); setAge(32); setPrevIVFCycles(0); setResult(null) }}
      values={[transferDate, embryoDay, age, prevIVFCycles]} result={result}
      seoContent={<SeoContentGenerator title="IVF Due Date Calculator" description="Calculate IVF due date from embryo transfer date and embryo age." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Embryo Transfer Date" val={transferDate} set={setTransferDate} />
        <SelectInput label="Embryo Age at Transfer" val={embryoDay} set={setEmbryoDay} options={[
          { value: "3", label: "Day 3 — Cleavage Stage" },
          { value: "5", label: "Day 5 — Blastocyst (most common)" }
        ]} />
        <NumInput label="Maternal Age" val={age} set={setAge} min={22} max={58} suffix="years" />
        <NumInput label="Previous Failed IVF Cycles" val={prevIVFCycles} set={setPrevIVFCycles} min={0} max={10} />
      </div>} />
  )
}

// ─── 9. Pregnancy Calorie Calculator ──────────────────────────────────────────
export function PregnancyCalorieCalculator() {
  const [weight, setWeight] = useState(60)
  const [height, setHeight] = useState(160)
  const [age, setAge] = useState(28)
  const [activity, setActivity] = useState("light")
  const [trimester, setTrimester] = useState("2")
  const [twins, setTwins] = useState("single")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // Mifflin-St Jeor BMR (female)
    const bmr = 10 * weight + 6.25 * height - 5 * age - 161
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725
    }
    const tdee = bmr * (activityMultipliers[activity] ?? 1.375)

    const trimesterExtra: Record<string, number> = { "1": 0, "2": 340, "3": 450 }
    const twinExtra = twins === "twin" ? 300 : twins === "triplet" ? 600 : 0
    const totalCalories = r0(tdee + (trimesterExtra[trimester] ?? 0) + twinExtra)

    const preBMI = r1(weight / ((height / 100) ** 2))
    const gdRisk = preBMI >= 25 && (trimester === "2" || trimester === "3")
    const bmiCategory = preBMI < 18.5 ? "Underweight" : preBMI < 25 ? "Normal" : preBMI < 30 ? "Overweight" : "Obese"
    const proteinNeeds = r0(weight * 1.1 + 25)
    const carbLimit = gdRisk ? "130–175g/day complex carbs" : "Unrestricted (choose whole grains)"
    const status: "good" | "warning" | "danger" = gdRisk ? "warning" : preBMI < 18.5 ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Daily Caloric Need", value: `${totalCalories} kcal/day`, status, description: `Base TDEE ${r0(tdee)} kcal + T${trimester} extra ${trimesterExtra[trimester]} kcal${twins !== "single" ? " + " + twinExtra + " kcal (multiple)" : ""}` },
      metrics: [
        { label: "Base TDEE", value: `${r0(tdee)} kcal`, status: "good" },
        { label: `T${trimester} Caloric Extra`, value: `+${trimesterExtra[trimester] ?? 0} kcal`, status: "normal" },
        { label: "Total Daily Target", value: `${totalCalories} kcal`, status },
        { label: "Protein Requirement", value: `${proteinNeeds} g/day`, status: "normal" },
        { label: "Pre-pregnancy BMI", value: `${preBMI} (${bmiCategory})`, status: preBMI < 18.5 || preBMI >= 25 ? "warning" : "good" },
        { label: "Gestational Diabetes Nutrition Risk", value: gdRisk ? "Elevated — moderate carbs" : "Standard risk", status: gdRisk ? "warning" : "good" }
      ],
      recommendations: [
        { title: `Trimester ${trimester} Caloric Plan`, description: trimester === "1" ? "First trimester: No extra calories needed (+0 kcal). Focus entirely on micronutrient quality. Folate 800mcg/day is critical for neural tube formation. Manage nausea with small, frequent bland meals. No alcohol." : trimester === "2" ? `Second trimester: +340 kcal/day. Practical addition: a medium banana (100 kcal) + small yogurt (80 kcal) + a small handful of nuts (160 kcal). Iron and DHA intake critical.${twins !== "single" ? ` Multiple gestation: total +${340 + twinExtra} kcal/day.` : ""}` : `Third trimester: +450 kcal/day. Fetus gains ~200g/week. Prioritise protein (${proteinNeeds}g/day), calcium for bone development, and omega-3 DHA 200mg.${twins !== "single" ? ` Multiple gestation: total +${450 + twinExtra} kcal/day.` : ""}`, priority: "high", category: "Caloric Planning" },
        { title: gdRisk ? "Gestational Diabetes Nutrition Alert" : "Balanced Pregnancy Nutrition", description: gdRisk ? `BMI ${preBMI} (${bmiCategory}) in Trimester ${trimester}: Elevated GDM risk. Limit refined carbohydrates. Carbohydrate distribution: ${carbLimit}. Avoid sugary drinks, white rice, maida. Recommended: 3 small meals + 2-3 snacks, each with protein + fibre. Ensure GTT screening at 24-28 weeks.` : "Varied diet: whole grains, lean protein (chicken, fish, lentils), leafy vegetables, low-fat dairy, healthy fats (nuts, avocado, olive oil). Avoid raw meat, unpasteurised dairy, high-mercury fish (shark, swordfish, king mackerel).", priority: gdRisk ? "high" : "medium", category: "Nutrition Quality" },
        { title: "Key Micronutrient Targets", description: "Folate: 600mcg/day (800mcg T1). Iron: 27mg/day (prenatal vitamin + food). Calcium: 1000mg/day. Vitamin D: 600 IU. Iodine: 220mcg. DHA/Omega-3: 200mg/day. Choline: 450mg/day (critical for brain development). Best achieved via a comprehensive prenatal multivitamin + dietary sources.", priority: "medium", category: "Micronutrients" }
      ],
      detailedBreakdown: { "Weight": `${weight}kg`, "Height": `${height}cm`, "Pre-BMI": preBMI, "Activity": activity, "Base TDEE": `${r0(tdee)} kcal`, "Total Need": `${totalCalories} kcal`, "Trimester": `T${trimester}`, "Pregnancy": twins }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-calorie-calculator" title="Pregnancy Calorie Calculator"
      description="Trimester-specific caloric needs using Mifflin-St Jeor BMR, gestational diabetes nutrition risk, twin adjustment, and micronutrient targets."
      icon={Activity} calculate={calculate} onClear={() => { setWeight(60); setHeight(160); setAge(28); setActivity("light"); setTrimester("2"); setTwins("single"); setResult(null) }}
      values={[weight, height, age, activity, trimester, twins]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Calorie Calculator" description="Daily calorie needs during pregnancy by trimester with nutrition guidance." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Current Weight" val={weight} set={setWeight} min={35} max={200} suffix="kg" />
        <NumInput label="Height" val={height} set={setHeight} min={130} max={210} suffix="cm" />
        <NumInput label="Age" val={age} set={setAge} min={15} max={55} suffix="years" />
        <SelectInput label="Activity Level" val={activity} set={setActivity} options={[
          { value: "sedentary", label: "Sedentary (desk job, no exercise)" },
          { value: "light", label: "Lightly Active (1-3 days/week)" },
          { value: "moderate", label: "Moderately Active (3-5 days/week)" },
          { value: "active", label: "Very Active (6-7 days/week)" }
        ]} />
        <SelectInput label="Trimester" val={trimester} set={setTrimester} options={[
          { value: "1", label: "First Trimester (Weeks 1–12)" },
          { value: "2", label: "Second Trimester (Weeks 13–26)" },
          { value: "3", label: "Third Trimester (Weeks 27–40)" }
        ]} />
        <SelectInput label="Number of Babies" val={twins} set={setTwins} options={[
          { value: "single", label: "Single (1 baby)" },
          { value: "twin", label: "Twins (2 babies)" },
          { value: "triplet", label: "Triplets (3 babies)" }
        ]} />
      </div>} />
  )
}

// ─── 10. Pregnancy BMI & Weight Gain Calculator ────────────────────────────────
export function PregnancyBMICalculator() {
  const [preWeight, setPreWeight] = useState(60)
  const [currentWeight, setCurrentWeight] = useState(68)
  const [height, setHeight] = useState(160)
  const [gestWeeks, setGestWeeks] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = height / 100
    const preBMI = r1(preWeight / (h * h))
    const currentBMI = r1(currentWeight / (h * h))
    const weightGained = r1(currentWeight - preWeight)

    // IOM 2009 gestational weight gain recommendations
    const iomMap: Record<string, { lo: number; hi: number; label: string; weeklyLo: number; weeklyHi: number }> = {
      underweight: { lo: 12.5, hi: 18, label: "Underweight (BMI<18.5)", weeklyLo: 0.44, weeklyHi: 0.58 },
      normal: { lo: 11.5, hi: 16, label: "Normal (BMI 18.5–24.9)", weeklyLo: 0.35, weeklyHi: 0.50 },
      overweight: { lo: 7, hi: 11.5, label: "Overweight (BMI 25–29.9)", weeklyLo: 0.23, weeklyHi: 0.33 },
      obese: { lo: 5, hi: 9, label: "Obese (BMI≥30)", weeklyLo: 0.17, weeklyHi: 0.27 }
    }
    const bmiCat = preBMI < 18.5 ? "underweight" : preBMI < 25 ? "normal" : preBMI < 30 ? "overweight" : "obese"
    const rec = iomMap[bmiCat]

    // Expected gain at current week
    const t1Total = 1.5 // approximate T1 gain for normal weight
    const weeklyMid = (rec.weeklyLo + rec.weeklyHi) / 2
    const expectedGain = gestWeeks <= 12 ? t1Total * (gestWeeks / 12) : t1Total + (gestWeeks - 12) * weeklyMid
    const gainStatus = weightGained < expectedGain * 0.7 ? "under" : weightGained > expectedGain * 1.3 ? "over" : "on-track"

    // C-section risk correlation (observational data)
    const cSectionRisk = preBMI < 25 ? "15–20% (population baseline)" : preBMI < 30 ? "25–30% (elevated)" : preBMI < 35 ? "35–45% (high)" : ">50% (very high)"
    const macrosomiaRisk = (preBMI >= 25 && weightGained > expectedGain * 1.3) || preBMI >= 30

    const overallStatus: "good" | "warning" | "danger" = gainStatus === "over" && preBMI >= 30 ? "danger" : gainStatus !== "on-track" || preBMI >= 30 ? "warning" : "good"
    const gainLabel = gainStatus === "on-track" ? "On Track ✓" : gainStatus === "over" ? "Gaining Too Fast" : "Gaining Too Slow"

    setResult({
      primaryMetric: { label: "Weight Gain Status", value: gainLabel, status: overallStatus, description: `Gained: ${weightGained} kg · Expected ~${r1(expectedGain)} kg at ${gestWeeks}w · IOM target: ${rec.lo}–${rec.hi} kg total` },
      metrics: [
        { label: "Pre-pregnancy BMI", value: `${preBMI} — ${rec.label}`, status: preBMI < 25 ? "good" : "warning" },
        { label: "Current BMI", value: `${currentBMI}`, status: "normal" },
        { label: "Weight Gained So Far", value: `${weightGained} kg`, status: overallStatus },
        { label: "IOM Total Gain Target", value: `${rec.lo}–${rec.hi} kg`, status: "normal" },
        { label: "C-Section Risk Correlation", value: cSectionRisk, status: preBMI < 25 ? "good" : preBMI < 30 ? "warning" : "danger" },
        { label: "Macrosomia Risk", value: macrosomiaRisk ? "Elevated — monitor growth" : "Low risk", status: macrosomiaRisk ? "warning" : "good" }
      ],
      recommendations: [
        { title: "IOM Weight Gain Guidance", description: `Pre-pregnancy BMI ${preBMI} (${rec.label}): IOM recommends ${rec.lo}–${rec.hi} kg total gain over 40 weeks — approximately ${r1(rec.weeklyLo * 1000 / 1000)}–${r1(rec.weeklyHi)} kg/week from T2 onward. Current gain of ${weightGained} kg at week ${gestWeeks} is ${gainLabel.toLowerCase()}. ${gainStatus === "over" ? "Reduce caloric density. Avoid added sugars. Continue safe prenatal exercise." : gainStatus === "under" ? "Increase nutrient-dense foods. Add 2 snacks/day. Rule out hyperemesis gravidarum." : "Maintain current pattern."}`, priority: "high", category: "Weight Management" },
        { title: "C-Section & Birth Risk", description: `BMI ${preBMI}: ${cSectionRisk} C-section correlation. Higher BMI is also associated with prolonged labour, shoulder dystocia, instrumental delivery, and neonatal ICU admission. Engage an obstetrician-led care team from 28 weeks if BMI ≥30 at booking.`, priority: preBMI >= 30 ? "high" : "medium", category: "Birth Planning" },
        { title: macrosomiaRisk ? "Macrosomia / LGA Alert" : "Fetal Growth on Track", description: macrosomiaRisk ? "Excess weight gain combined with elevated BMI increases large-for-gestational-age (LGA) risk. Birth weight >4.5kg is associated with shoulder dystocia and C-section. Gestational diabetes screening critical (24-28w GTT). Reduce refined carbohydrates. Serial growth ultrasounds from 28 weeks." : "Current weight gain trajectory is within a healthy range for fetal growth. Continue regular prenatal monitoring.", priority: macrosomiaRisk ? "high" : "low", category: "Fetal Growth" }
      ],
      detailedBreakdown: { "Pre-BMI": preBMI, "Pre-Weight": `${preWeight}kg`, "Current Weight": `${currentWeight}kg`, "Gained": `${weightGained}kg`, "Expected": `~${r1(expectedGain)}kg`, "Status": gainLabel, "C-Section Risk": cSectionRisk.split(" ")[0] }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-bmi-calculator" title="Pregnancy BMI & Weight Gain Calculator"
      description="IOM-based pregnancy weight gain tracker — C-section risk, macrosomia assessment, and trimester-specific trajectory vs. pre-pregnancy BMI."
      icon={Activity} calculate={calculate} onClear={() => { setPreWeight(60); setCurrentWeight(68); setHeight(160); setGestWeeks(20); setResult(null) }}
      values={[preWeight, currentWeight, height, gestWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy BMI Calculator" description="Track pregnancy weight gain against IOM guidelines with C-section risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Pre-Pregnancy Weight" val={preWeight} set={setPreWeight} min={35} max={200} suffix="kg" />
        <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={35} max={250} suffix="kg" />
        <NumInput label="Height" val={height} set={setHeight} min={130} max={210} suffix="cm" />
        <NumInput label="Current Gestational Week" val={gestWeeks} set={setGestWeeks} min={4} max={42} suffix="weeks" />
      </div>} />
  )
}

// ─── 11. Fetal Growth Percentile Calculator ────────────────────────────────────
export function FetalGrowthPercentileCalculator() {
  const [gaWeeks, setGaWeeks] = useState(28)
  const [efw, setEfw] = useState(1100)    // grams
  const [hc, setHc] = useState(250)       // mm
  const [fl, setFl] = useState(52)        // mm
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // Hadlock / WHO reference 50th percentile values by gestational week
    const efwRef50: Record<number, number> = {
      20: 330, 22: 430, 24: 600, 26: 760, 28: 1100,
      30: 1450, 32: 1790, 34: 2200, 36: 2600, 38: 3050, 40: 3400
    }
    const hcRef50: Record<number, number> = {
      20: 182, 22: 198, 24: 214, 26: 228, 28: 244,
      30: 260, 32: 274, 34: 285, 36: 295, 38: 303, 40: 310
    }
    const flRef50: Record<number, number> = {
      20: 34, 22: 38, 24: 43, 26: 48, 28: 52,
      30: 58, 32: 62, 34: 66, 36: 69, 38: 72, 40: 74
    }

    const stdWeeks = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]
    const closestWeek = stdWeeks.reduce((a, b) => Math.abs(b - gaWeeks) < Math.abs(a - gaWeeks) ? b : a)

    const efwRef = efwRef50[closestWeek]
    const hcRef = hcRef50[closestWeek]
    const flRef = flRef50[closestWeek]

    // Z-scores (approximately 15% SD for EFW, 6% for HC, 8% for FL)
    const efwZ = (efw - efwRef) / (efwRef * 0.15)
    const hcZ = (hc - hcRef) / (hcRef * 0.06)
    const flZ = (fl - flRef) / (flRef * 0.08)

    const efwPct = zToPct(efwZ)
    const hcPct = zToPct(hcZ)
    const flPct = zToPct(flZ)

    const iugrSuspicion = efwPct < 10
    const severeIUGR = efwPct < 3
    const macrosomia = efwPct > 90
    const headSparing = hcPct > efwPct + 20

    const overallStatus: "good" | "warning" | "danger" = severeIUGR ? "danger" : iugrSuspicion || macrosomia ? "warning" : "good"
    const growthLabel = severeIUGR ? "Severe IUGR" : iugrSuspicion ? "IUGR Suspected" : macrosomia ? "Macrosomia Risk" : "Normal Growth (AGA)"

    setResult({
      primaryMetric: { label: "EFW Percentile", value: `${efwPct}th percentile`, status: overallStatus, description: `${growthLabel} · GA ${gaWeeks}w · EFW ${efw}g (50th ref: ${efwRef}g at ${closestWeek}w)` },
      metrics: [
        { label: "EFW Percentile", value: `${efwPct}th`, status: severeIUGR ? "danger" : iugrSuspicion ? "warning" : macrosomia ? "warning" : "good" },
        { label: "Head Circumference (HC)", value: `${hcPct}th percentile`, status: hcPct < 3 ? "danger" : hcPct < 10 ? "warning" : "good" },
        { label: "Femur Length (FL)", value: `${flPct}th percentile`, status: flPct < 3 ? "danger" : flPct < 10 ? "warning" : "good" },
        { label: "IUGR Suspicion", value: iugrSuspicion ? `Present (${severeIUGR ? "<3rd" : "<10th"} pct)` : "Absent (≥10th pct)", status: iugrSuspicion ? "danger" : "good" },
        { label: "Macrosomia Risk", value: macrosomia ? "EFW >90th percentile" : "Not detected", status: macrosomia ? "warning" : "good" },
        { label: "Head-Sparing Pattern", value: headSparing ? "Detected — asymmetric IUGR" : "Absent — proportionate", status: headSparing ? "warning" : "good" }
      ],
      recommendations: [
        { title: iugrSuspicion ? (severeIUGR ? "Severe IUGR — Urgent Review" : "IUGR Suspected — Review Needed") : macrosomia ? "Macrosomia Alert — Enhanced Monitoring" : "Normal Fetal Growth", description: iugrSuspicion ? `EFW at ${efwPct}th percentile is below the IUGR threshold (10th percentile). Common causes: uteroplacental insufficiency, maternal hypertension, infection (CMV, rubella), chromosomal anomaly, or maternal under-nutrition. ${severeIUGR ? "Severe IUGR (<3rd pct): Immediate Doppler velocimetry of umbilical artery, MCA, and ductus venosus. Consider hospital admission. Corticosteroids if delivery <34 weeks is likely." : "Recommended: umbilical artery Doppler every 1–2 weeks, non-stress test twice weekly, and serial growth scan every 2 weeks."}` : macrosomia ? `EFW above 90th percentile (${efwPct}th) at ${gaWeeks} weeks. LGA (large for gestational age) associated with gestational diabetes, post-dates, and genetic syndromes. Birth weight >4.5kg risk: shoulder dystocia, C-section. GTT if not done. Repeat growth scan at 38–39 weeks.` : `EFW ${efw}g at ${gaWeeks}w is appropriate for gestational age (${efwPct}th percentile). Continue routine monitoring at 28-32w and 36w.`, priority: iugrSuspicion || macrosomia ? "high" : "low", category: "Growth Assessment" },
        { title: "Biometric Interpretation", description: `EFW: ${efw}g → ${efwPct}th pct (50th ref: ${efwRef}g). HC: ${hc}mm → ${hcPct}th pct (50th ref: ${hcRef}mm). FL: ${fl}mm → ${flPct}th pct (50th ref: ${flRef}mm at ${closestWeek}w). ${headSparing ? "Head-sparing pattern: HC disproportionately larger than EFW — brain is being preferentially perfused. This is the classic asymmetric IUGR pattern. Urgent Doppler evaluation required." : "Proportionate biometry — symmetric growth pattern."}`, priority: "high", category: "Biometrics" },
        { title: "Recommended Monitoring Plan", description: iugrSuspicion ? "Doppler studies (umbilical artery, MCA, DV) every 1-2 weeks. Non-stress test twice weekly. Liquor volume (AFI) assessment. BPP (biophysical profile). Serial growth scan every 2 weeks. Multidisciplinary team involvement (MFM, neonatologist) if worsening." : macrosomia ? "GTT if not yet done. Repeat growth scan 38-39 weeks. Assess liquor volume. Discuss birth mode: consider elective C-section if EFW >4.5kg. Check for polyhydramnios (associated with macrosomia and GDM)." : "Routine growth scan at 28-32 weeks and 36 weeks. No additional monitoring unless symptoms arise.", priority: "medium", category: "Next Steps" }
      ],
      detailedBreakdown: {
        "GA": `${gaWeeks}w`, "EFW": `${efw}g (${efwPct}th pct)`,
        "HC": `${hc}mm (${hcPct}th pct)`, "FL": `${fl}mm (${flPct}th pct)`,
        "Reference Week": `${closestWeek}w`, "Growth Status": growthLabel
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fetal-growth-percentile" title="Fetal Growth Percentile Calculator"
      description="Fetal biometry percentile calculator — EFW, HC, FL vs. gestational norms with IUGR detection, macrosomia risk, and Doppler guidance."
      icon={TrendingUp} calculate={calculate} onClear={() => { setGaWeeks(28); setEfw(1100); setHc(250); setFl(52); setResult(null) }}
      values={[gaWeeks, efw, hc, fl]} result={result}
      seoContent={<SeoContentGenerator title="Fetal Growth Percentile Calculator" description="Estimate fetal growth percentiles with IUGR and macrosomia detection." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Gestational Age" val={gaWeeks} set={setGaWeeks} min={18} max={42} suffix="weeks" />
        <NumInput label="Estimated Fetal Weight (EFW)" val={efw} set={setEfw} min={100} max={5500} step={50} suffix="grams" />
        <NumInput label="Head Circumference (HC)" val={hc} set={setHc} min={100} max={420} suffix="mm" />
        <NumInput label="Femur Length (FL)" val={fl} set={setFl} min={10} max={110} suffix="mm" />
      </div>} />
  )
}
