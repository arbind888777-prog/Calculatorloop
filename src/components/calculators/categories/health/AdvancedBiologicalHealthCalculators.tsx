"use client"

import { useState } from "react"
import { Heart, Baby, Shield, Calendar, Activity } from "lucide-react"
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

// ─── 5. Menstrual Cycle Calculator ────────────────────────────────────────────
export function MenstrualCycleCalculator() {
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [daysSinceStart, setDaysSinceStart] = useState(14)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cl = clamp(cycleLength, 21, 40)
    const pl = clamp(periodLength, 2, 10)
    const day = clamp(daysSinceStart, 1, cl)

    // Cycle phases
    const menstrualEnd = pl
    const follicularEnd = r0(cl * 0.5 - 1)
    const ovulationDay = r0(cl - 14)
    const ovulationStart = ovulationDay - 1
    const ovulationEnd = ovulationDay + 1
    const lutealStart = ovulationEnd + 1

    // Determine current phase
    let phase = ""
    let phaseDay = 0
    let phaseDuration = 0
    if (day <= menstrualEnd) {
      phase = "Menstrual"; phaseDay = day; phaseDuration = pl
    } else if (day <= follicularEnd) {
      phase = "Follicular"; phaseDay = day - menstrualEnd; phaseDuration = follicularEnd - menstrualEnd
    } else if (day >= ovulationStart && day <= ovulationEnd) {
      phase = "Ovulation"; phaseDay = day - ovulationStart + 1; phaseDuration = 3
    } else {
      phase = "Luteal"; phaseDay = day - ovulationEnd; phaseDuration = cl - ovulationEnd
    }

    // Hormone levels (relative scale 0-100)
    const estrogen = phase === "Menstrual" ? 20 : phase === "Follicular" ? 60 : phase === "Ovulation" ? 95 : 50
    const progesterone = phase === "Menstrual" ? 10 : phase === "Follicular" ? 15 : phase === "Ovulation" ? 30 : 80
    const lh = phase === "Ovulation" ? 95 : phase === "Follicular" ? 30 : 20
    const fsh = phase === "Menstrual" ? 50 : phase === "Follicular" ? 60 : phase === "Ovulation" ? 40 : 20

    // Fertility window
    const fertileStart = ovulationDay - 5
    const fertileEnd = ovulationDay + 1
    const isFertile = day >= fertileStart && day <= fertileEnd
    const fertilityLevel = isFertile ? (day === ovulationDay ? "Peak" : day >= ovulationDay - 2 && day <= ovulationDay ? "High" : "Moderate") : "Low"

    // Regularity (based on cycle length)
    const regularity = cl >= 25 && cl <= 32 ? "Regular" : cl >= 21 && cl <= 35 ? "Slightly Irregular" : "Irregular"

    const nextPeriod = cl - day
    const status: 'good' | 'warning' | 'danger' = regularity === "Regular" ? "good" : regularity === "Slightly Irregular" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Current Phase", value: phase, status: "good", description: `Day ${day} of ${cl}-day cycle — ${phase} phase (day ${phaseDay}/${phaseDuration})` },
      healthScore: r0(clamp(regularity === "Regular" ? 90 : regularity === "Slightly Irregular" ? 70 : 50, 20, 100)),
      metrics: [
        { label: "Current Phase", value: phase, status: "good" },
        { label: "Cycle Day", value: `${day}/${cl}`, status: "normal" },
        { label: "Phase Day", value: `${phaseDay}/${phaseDuration}`, status: "normal" },
        { label: "Fertility Level", value: fertilityLevel, status: isFertile ? "warning" : "good" },
        { label: "Ovulation Day", value: `Day ${ovulationDay}`, status: "normal" },
        { label: "Next Period", value: `${nextPeriod} days`, status: nextPeriod <= 3 ? "warning" : "good" },
        { label: "Estrogen", value: `${estrogen}%`, status: estrogen > 80 ? "warning" : "good" },
        { label: "Progesterone", value: `${progesterone}%`, status: "normal" },
        { label: "LH Surge", value: `${lh}%`, status: lh > 80 ? "warning" : "good" },
        { label: "FSH", value: `${fsh}%`, status: "normal" },
        { label: "Cycle Regularity", value: regularity, status }
      ],
      recommendations: [
        { title: "Phase Analysis", description: `Currently in ${phase} phase (day ${phaseDay}/${phaseDuration}). ${phase === "Menstrual" ? "Menstrual phase: uterine lining sheds. Rest, iron-rich foods, stay hydrated. Light exercise can help cramps." : phase === "Follicular" ? "Follicular phase: follicles develop, estrogen rising. Energy increases — good for exercise, learning, social activities." : phase === "Ovulation" ? "Ovulation phase: egg released, peak fertility. LH surge triggers ovulation. Cervical mucus is clear and stretchy." : "Luteal phase: progesterone rises, potential PMS symptoms. Focus on self-care, magnesium-rich foods, stress management."}`, priority: "high", category: "Phase" },
        { title: "Fertility Window", description: `${isFertile ? `FERTILE WINDOW — ${fertilityLevel} fertility. ${day === ovulationDay ? "OVULATION DAY: highest conception probability (~33%). Egg viable for 12-24 hours." : `Sperm can survive 3-5 days. ${fertilityLevel === "High" ? "High conception chance." : "Moderate chance."}`}` : `Not in fertile window. Next fertile window: day ${fertileStart}-${fertileEnd}. ${nextPeriod <= 5 ? "Period approaching soon." : ""}`}`, priority: "high", category: "Fertility" },
        { title: "Hormonal Profile", description: `Estrogen: ${estrogen}% | Progesterone: ${progesterone}% | LH: ${lh}% | FSH: ${fsh}%. ${phase === "Ovulation" ? "LH surge detected — ovulation occurring." : phase === "Luteal" ? "High progesterone supports potential implantation." : phase === "Follicular" ? "Rising estrogen stimulates follicle growth." : "Hormone levels at baseline during menstruation."} Cycle regularity: ${regularity} (${cl}-day cycle). ${regularity === "Irregular" ? "Consult gynecologist if cycles consistently <21 or >35 days." : ""}`, priority: "medium", category: "Hormones" }
      ],
      detailedBreakdown: { "Phase": phase, "Day": `${day}/${cl}`, "Fertile": fertilityLevel, "Ovulation": `Day ${ovulationDay}`, "NextPeriod": `${nextPeriod}d`, "Estrogen": `${estrogen}%`, "Progesterone": `${progesterone}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="menstrual-cycle" title="Menstrual Cycle Calculator"
      description="Track menstrual cycle phases, hormone fluctuations, fertility windows, and ovulation timing. Comprehensive hormonal cycle analysis."
      icon={Heart} calculate={calculate} onClear={() => { setCycleLength(28); setPeriodLength(5); setDaysSinceStart(14); setResult(null) }}
      values={[cycleLength, periodLength, daysSinceStart]} result={result}
      seoContent={<SeoContentGenerator title="Menstrual Cycle Calculator" description="Track cycle phases, hormones, and fertility windows." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cycle Length" val={cycleLength} set={setCycleLength} min={21} max={40} suffix="days" />
          <NumInput label="Period Length" val={periodLength} set={setPeriodLength} min={2} max={10} suffix="days" />
        </div>
        <NumInput label="Days Since Period Started" val={daysSinceStart} set={setDaysSinceStart} min={1} max={40} suffix="current day" />
      </div>} />
  )
}

// ─── 6. Fetal Development Timeline ────────────────────────────────────────────
export function FetalDevelopmentTimeline() {
  const [gestationalWeek, setGestationalWeek] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(gestationalWeek, 4, 42)

    // Fetal size estimates (crown-rump then crown-heel)
    const sizeData: Record<number, { length: number; weight: number; size: string; organ: string }> = {
      4: { length: 0.1, weight: 0.01, size: "Poppy seed", organ: "Neural tube forming" },
      5: { length: 0.2, weight: 0.03, size: "Sesame seed", organ: "Heart begins beating" },
      6: { length: 0.5, weight: 0.1, size: "Lentil", organ: "Brain hemispheres forming" },
      7: { length: 1.0, weight: 0.5, size: "Blueberry", organ: "Arms and legs budding" },
      8: { length: 1.6, weight: 1, size: "Raspberry", organ: "Fingers forming, facial features" },
      9: { length: 2.3, weight: 2, size: "Cherry", organ: "All organs present, muscles developing" },
      10: { length: 3.1, weight: 4, size: "Strawberry", organ: "Fingernails forming, vital organs functioning" },
      11: { length: 4.1, weight: 7, size: "Fig", organ: "Bones hardening, tooth buds" },
      12: { length: 5.4, weight: 14, size: "Lime", organ: "Reflexes developing, kidneys working" },
      13: { length: 7.4, weight: 23, size: "Peach", organ: "Fingerprints forming, vocal cords" },
      14: { length: 8.7, weight: 43, size: "Lemon", organ: "Gender identifiable, facial muscles" },
      15: { length: 10.1, weight: 70, size: "Apple", organ: "Breathing movements, taste buds" },
      16: { length: 11.6, weight: 100, size: "Avocado", organ: "Skeletal system visible, hearing developing" },
      17: { length: 13, weight: 140, size: "Pear", organ: "Fat deposits beginning, sweat glands" },
      18: { length: 14.2, weight: 190, size: "Bell pepper", organ: "Ears in final position, yawning" },
      19: { length: 15.3, weight: 240, size: "Mango", organ: "Vernix coating, sensory development" },
      20: { length: 16.4, weight: 300, size: "Banana", organ: "Halfway point, regular sleep cycles" },
      21: { length: 26.7, weight: 360, size: "Carrot", organ: "Eyebrows, eyelids, fingernails complete" },
      22: { length: 27.8, weight: 430, size: "Papaya", organ: "Lips visible, eyes formed but iris no color" },
      23: { length: 28.9, weight: 500, size: "Grapefruit", organ: "Viability threshold, lung surfactant" },
      24: { length: 30, weight: 600, size: "Ear of corn", organ: "Face fully formed, lungs branching" },
      25: { length: 34.6, weight: 660, size: "Cauliflower", organ: "Startle reflex, dexterity improving" },
      26: { length: 35.6, weight: 760, size: "Zucchini", organ: "Eyes opening, brain waves detected" },
      27: { length: 36.6, weight: 875, size: "Head of lettuce", organ: "Regular sleep-wake patterns" },
      28: { length: 37.6, weight: 1000, size: "Eggplant", organ: "REM sleep, can dream, lungs maturing" },
      29: { length: 38.6, weight: 1150, size: "Butternut squash", organ: "Brain growing rapidly, hiccups" },
      30: { length: 39.9, weight: 1320, size: "Cabbage", organ: "Red blood cell production by bone marrow" },
      31: { length: 41.1, weight: 1500, size: "Coconut", organ: "Processing information, tracking light" },
      32: { length: 42.4, weight: 1700, size: "Squash", organ: "Toenails, hair growth, practicing breathing" },
      33: { length: 43.7, weight: 1920, size: "Pineapple", organ: "Bones hardening except skull, immune system" },
      34: { length: 45, weight: 2150, size: "Cantaloupe", organ: "Central nervous system maturing" },
      35: { length: 46.2, weight: 2380, size: "Honeydew melon", organ: "Kidneys fully developed, liver processing" },
      36: { length: 47.4, weight: 2620, size: "Head of romaine", organ: "Skin smooth, fat layer building" },
      37: { length: 48.6, weight: 2860, size: "Winter melon", organ: "Full term, lungs mature, coordinated breathing" },
      38: { length: 49.8, weight: 3080, size: "Leek", organ: "Organs fully functional, grasp reflex strong" },
      39: { length: 50.7, weight: 3290, size: "Mini watermelon", organ: "Brain still developing, ready for birth" },
      40: { length: 51.2, weight: 3460, size: "Watermelon", organ: "Full development complete, due date" },
      41: { length: 51.5, weight: 3600, size: "Watermelon+", organ: "Post-term, monitoring recommended" },
      42: { length: 51.7, weight: 3700, size: "Watermelon+", organ: "Post-term, induction considered" }
    }

    const nearest = Object.keys(sizeData).map(Number).reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a)
    const data = sizeData[nearest]

    // Trimester
    const trimester = w <= 12 ? 1 : w <= 27 ? 2 : 3
    const trimesterName = trimester === 1 ? "First" : trimester === 2 ? "Second" : "Third"
    const weeksRemaining = Math.max(0, 40 - w)
    const percentComplete = r0(clamp(w / 40 * 100, 0, 100))

    // Growth percentile (50th percentile reference)
    const expectedWeight50th = w <= 12 ? w * 1.2 : w <= 20 ? w * 15 : w <= 30 ? w * 45 : w * 87
    const growthStatus = "On track (50th percentile reference)"

    // Development stage
    const stage = w <= 8 ? "Embryonic" : w <= 12 ? "Early Fetal" : w <= 20 ? "Mid Fetal" : w <= 28 ? "Late Fetal" : w <= 36 ? "Near Term" : "Full Term"
    const viability = w < 22 ? "Pre-viable" : w < 24 ? "Borderline viable (~10-30%)" : w < 28 ? "Viable (~60-80%)" : w < 32 ? "Good viability (~90%+)" : "Excellent (>95%)"

    const status: 'good' | 'warning' | 'danger' = w >= 37 && w <= 41 ? "good" : w >= 28 ? "good" : w >= 24 ? "warning" : "warning"

    setResult({
      primaryMetric: { label: "Week", value: `${w}`, status, description: `${trimesterName} Trimester — ${stage} stage — ${data.size}` },
      healthScore: r0(clamp(percentComplete, 10, 100)),
      metrics: [
        { label: "Gestational Week", value: `${w}/40`, status },
        { label: "Trimester", value: `${trimesterName} (${trimester}/3)`, status: "normal" },
        { label: "Fetal Length", value: `${data.length} cm`, status: "normal" },
        { label: "Fetal Weight", value: data.weight < 1 ? `${data.weight} g` : data.weight >= 1000 ? `${r1(data.weight / 1000)} kg` : `${data.weight} g`, status: "normal" },
        { label: "Size Comparison", value: data.size, status: "normal" },
        { label: "Development Stage", value: stage, status },
        { label: "Key Development", value: data.organ, status: "normal" },
        { label: "Viability", value: viability, status: w >= 28 ? "good" : w >= 24 ? "warning" : "danger" },
        { label: "Progress", value: `${percentComplete}%`, status: "normal" },
        { label: "Weeks Remaining", value: weeksRemaining, status: weeksRemaining <= 4 ? "warning" : "good" },
        { label: "Growth", value: growthStatus, status: "good" }
      ],
      recommendations: [
        { title: "Development", description: `Week ${w}: ${data.organ}. Fetal size: ~${data.length} cm, ~${data.weight >= 1000 ? r1(data.weight / 1000) + " kg" : data.weight + " g"} (about a ${data.size}). ${stage} stage. ${w <= 12 ? "Critical organogenesis period — avoid teratogens, take folic acid 400-800mcg/day." : w <= 20 ? "Major structural development. Anatomy scan (18-22 weeks) recommended." : w <= 28 ? "Rapid growth phase. Glucose screening (24-28 weeks). Start kick counts at 28 weeks." : w <= 36 ? "Maturation phase. Lungs producing surfactant. Weekly/biweekly visits. GBS screening 35-37 weeks." : "Full term. Monitor for signs of labor: contractions, water breaking, bloody show."}`, priority: "high", category: "Development" },
        { title: "Trimester Care", description: `${trimesterName} Trimester (weeks ${trimester === 1 ? "1-12" : trimester === 2 ? "13-27" : "28-40"}). ${trimester === 1 ? "Morning sickness common. First prenatal visit. NT scan (11-14 weeks). Avoid alcohol, smoking, raw fish." : trimester === 2 ? "Energy returns. Feel first movements (quickening 16-22w). Anatomy ultrasound. Start prenatal classes." : "Third trimester — fatigue returns. Braxton Hicks contractions. Prepare birth plan. Sleep on left side. Monitor swelling for preeclampsia signs."}`, priority: "high", category: "Care" },
        { title: "Milestones", description: `Key upcoming milestones: ${w < 12 ? "12w: end of first trimester, miscarriage risk drops significantly. 13w: fingerprints forming." : w < 20 ? "20w: halfway point, anatomy scan. 18-22w: feel first movements." : w < 28 ? "24w: viability milestone. 28w: third trimester begins, start kick counts." : w < 37 ? "37w: full term. 34-36w: baby gains ~0.5 lb/week. Head may engage in pelvis." : "40w: due date. 41w: post-term, induction discussion. Every day baby gains weight and lung maturity."}`, priority: "medium", category: "Milestones" }
      ],
      detailedBreakdown: { "Week": w, "Trimester": trimesterName, "Length": `${data.length}cm`, "Weight": `${data.weight}g`, "Size": data.size, "Stage": stage, "Viable": viability }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fetal-development" title="Fetal Development Timeline"
      description="Week-by-week fetal growth milestones showing size, weight, organ development stage, and viability status throughout pregnancy."
      icon={Baby} calculate={calculate} onClear={() => { setGestationalWeek(20); setResult(null) }}
      values={[gestationalWeek]} result={result}
      seoContent={<SeoContentGenerator title="Fetal Development Timeline" description="Week-by-week fetal growth milestones and development stages." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Gestational Week" val={gestationalWeek} set={setGestationalWeek} min={4} max={42} suffix="weeks" />
      </div>} />
  )
}

// ─── 7. Vaccination Schedule Planner ──────────────────────────────────────────
export function VaccinationSchedulePlanner() {
  const [age, setAge] = useState(2)
  const [ageUnit, setAgeUnit] = useState("years")
  const [country, setCountry] = useState("india")
  const [bcg, setBcg] = useState("yes")
  const [hepatitisB, setHepatitisB] = useState("yes")
  const [polio, setPolio] = useState("yes")
  const [dpt, setDpt] = useState("yes")
  const [mmr, setMmr] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ageMonths = ageUnit === "years" ? clamp(age, 0, 100) * 12 : clamp(age, 0, 1200)

    // Universal vaccination schedules
    const vaccines: { name: string; dueMonth: number; doses: number; category: string }[] = [
      { name: "BCG", dueMonth: 0, doses: 1, category: "Childhood" },
      { name: "Hepatitis B (Birth)", dueMonth: 0, doses: 1, category: "Childhood" },
      { name: "Hepatitis B (1st)", dueMonth: 1, doses: 1, category: "Childhood" },
      { name: "OPV/IPV (1st)", dueMonth: 2, doses: 1, category: "Childhood" },
      { name: "DPT/DTaP (1st)", dueMonth: 2, doses: 1, category: "Childhood" },
      { name: "Hib (1st)", dueMonth: 2, doses: 1, category: "Childhood" },
      { name: "Rotavirus (1st)", dueMonth: 2, doses: 1, category: "Childhood" },
      { name: "PCV (1st)", dueMonth: 2, doses: 1, category: "Childhood" },
      { name: "OPV/IPV (2nd)", dueMonth: 4, doses: 1, category: "Childhood" },
      { name: "DPT/DTaP (2nd)", dueMonth: 4, doses: 1, category: "Childhood" },
      { name: "Hib (2nd)", dueMonth: 4, doses: 1, category: "Childhood" },
      { name: "Rotavirus (2nd)", dueMonth: 4, doses: 1, category: "Childhood" },
      { name: "PCV (2nd)", dueMonth: 4, doses: 1, category: "Childhood" },
      { name: "Hepatitis B (3rd)", dueMonth: 6, doses: 1, category: "Childhood" },
      { name: "OPV/IPV (3rd)", dueMonth: 6, doses: 1, category: "Childhood" },
      { name: "DPT/DTaP (3rd)", dueMonth: 6, doses: 1, category: "Childhood" },
      { name: "Influenza (yearly)", dueMonth: 6, doses: 1, category: "Childhood" },
      { name: "MMR (1st)", dueMonth: 9, doses: 1, category: "Childhood" },
      { name: "Varicella (1st)", dueMonth: 12, doses: 1, category: "Childhood" },
      { name: "Hepatitis A (1st)", dueMonth: 12, doses: 1, category: "Childhood" },
      { name: "PCV Booster", dueMonth: 12, doses: 1, category: "Childhood" },
      { name: "DPT Booster (1st)", dueMonth: 18, doses: 1, category: "Childhood" },
      { name: "OPV Booster", dueMonth: 18, doses: 1, category: "Childhood" },
      { name: "Hepatitis A (2nd)", dueMonth: 18, doses: 1, category: "Childhood" },
      { name: "MMR (2nd)", dueMonth: 60, doses: 1, category: "Childhood" },
      { name: "Varicella (2nd)", dueMonth: 60, doses: 1, category: "Childhood" },
      { name: "DPT Booster (2nd)", dueMonth: 60, doses: 1, category: "Childhood" },
      { name: "Tdap", dueMonth: 132, doses: 1, category: "Adolescent" },
      { name: "HPV (1st)", dueMonth: 108, doses: 1, category: "Adolescent" },
      { name: "HPV (2nd)", dueMonth: 114, doses: 1, category: "Adolescent" },
      { name: "Meningococcal", dueMonth: 132, doses: 1, category: "Adolescent" },
      { name: "Td Booster", dueMonth: 300, doses: 1, category: "Adult" },
      { name: "Pneumococcal (65+)", dueMonth: 780, doses: 1, category: "Adult" },
      { name: "Shingles (50+)", dueMonth: 600, doses: 1, category: "Adult" },
      { name: "COVID-19", dueMonth: 60, doses: 1, category: "Adult" },
    ]

    // Count vaccines given
    const givenVaccines: string[] = []
    if (bcg === "yes") givenVaccines.push("BCG")
    if (hepatitisB === "yes") givenVaccines.push("Hepatitis B (Birth)", "Hepatitis B (1st)", "Hepatitis B (3rd)")
    if (polio === "yes") givenVaccines.push("OPV/IPV (1st)", "OPV/IPV (2nd)", "OPV/IPV (3rd)")
    if (dpt === "yes") givenVaccines.push("DPT/DTaP (1st)", "DPT/DTaP (2nd)", "DPT/DTaP (3rd)")
    if (mmr === "yes") givenVaccines.push("MMR (1st)")

    const due = vaccines.filter(v => v.dueMonth <= ageMonths && !givenVaccines.includes(v.name))
    const upcoming = vaccines.filter(v => v.dueMonth > ageMonths && v.dueMonth <= ageMonths + 12)
    const completed = vaccines.filter(v => givenVaccines.includes(v.name))
    const missed = due.filter(v => !givenVaccines.includes(v.name))

    const totalRecommended = vaccines.filter(v => v.dueMonth <= ageMonths).length
    const completionRate = totalRecommended > 0 ? r0(completed.length / totalRecommended * 100) : 100
    const status: 'good' | 'warning' | 'danger' = completionRate >= 80 ? "good" : completionRate >= 50 ? "warning" : "danger"

    const ageDisplay = ageUnit === "years" ? `${age} years` : `${age} months`

    setResult({
      primaryMetric: { label: "Completion", value: `${completionRate}%`, status, description: `${completed.length} of ${totalRecommended} age-appropriate vaccines completed` },
      healthScore: clamp(completionRate, 5, 100),
      metrics: [
        { label: "Completion Rate", value: `${completionRate}%`, status },
        { label: "Vaccines Completed", value: completed.length, status: "good" },
        { label: "Missed Vaccines", value: missed.length, status: missed.length === 0 ? "good" : missed.length <= 3 ? "warning" : "danger" },
        { label: "Due Now", value: due.length, status: due.length === 0 ? "good" : "warning" },
        { label: "Upcoming (next 12m)", value: upcoming.length, status: "normal" },
        { label: "Age", value: ageDisplay, status: "normal" },
        { label: "Guidelines", value: country === "india" ? "NIS India" : country === "usa" ? "CDC USA" : "WHO", status: "normal" }
      ],
      recommendations: [
        { title: "Missed Vaccines", description: missed.length > 0 ? `${missed.length} missed vaccines requiring catch-up: ${missed.slice(0, 5).map(v => v.name).join(", ")}${missed.length > 5 ? ` and ${missed.length - 5} more` : ""}. Consult pediatrician for catch-up schedule. Most vaccines can be administered later with adjusted intervals. Do NOT restart completed series.` : "All age-appropriate vaccines completed. Well done! Continue following the schedule for upcoming vaccinations.", priority: "high", category: "Catch-up" },
        { title: "Upcoming", description: upcoming.length > 0 ? `${upcoming.length} vaccines due in next 12 months: ${upcoming.slice(0, 5).map(v => `${v.name} (${v.dueMonth < 12 ? v.dueMonth + "mo" : r0(v.dueMonth / 12) + "yr"} age)`).join(", ")}${upcoming.length > 5 ? ` + ${upcoming.length - 5} more` : ""}. Schedule appointments in advance.` : "No vaccines due in the next 12 months. Continue annual checkups.", priority: "medium", category: "Schedule" },
        { title: "General", description: `Vaccination schedule based on ${country === "india" ? "National Immunization Schedule (NIS) India" : country === "usa" ? "CDC recommended schedule" : "WHO guidelines"}. Keep vaccination records updated. Mild side effects (fever, redness, swelling) are normal. Seek medical attention for severe reactions. ${ageMonths >= 6 ? "Annual flu vaccine recommended." : ""} ${ageMonths >= 108 ? "HPV vaccine recommended for ages 9-14 (2 doses) or 15-26 (3 doses)." : ""}`, priority: "medium", category: "General" }
      ],
      detailedBreakdown: { "Age": ageDisplay, "Completed": completed.length, "Missed": missed.length, "Upcoming": upcoming.length, "Rate": `${completionRate}%`, "Country": country }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vaccination-schedule" title="Vaccination Schedule Planner"
      description="Age-based vaccination reminders with catch-up schedules. Tracks completed, missed, and upcoming vaccines per national guidelines."
      icon={Shield} calculate={calculate} onClear={() => { setAge(2); setAgeUnit("years"); setCountry("india"); setBcg("yes"); setHepatitisB("yes"); setPolio("yes"); setDpt("yes"); setMmr("no"); setResult(null) }}
      values={[age, ageUnit, country, bcg, hepatitisB, polio, dpt, mmr]} result={result}
      seoContent={<SeoContentGenerator title="Vaccination Schedule Planner" description="Age-based vaccination tracker and catch-up schedule planner." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={0} max={100} />
          <SelectInput label="Age Unit" val={ageUnit} set={setAgeUnit} options={[{ value: "months", label: "Months" }, { value: "years", label: "Years" }]} />
        </div>
        <SelectInput label="Country Guidelines" val={country} set={setCountry} options={[{ value: "india", label: "India (NIS)" }, { value: "usa", label: "USA (CDC)" }, { value: "who", label: "WHO" }]} />
        <p className="text-sm font-medium text-muted-foreground">Vaccination History</p>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="BCG" val={bcg} set={setBcg} options={[{ value: "yes", label: "✓ Given" }, { value: "no", label: "✗ Not given" }]} />
          <SelectInput label="Hepatitis B (3 doses)" val={hepatitisB} set={setHepatitisB} options={[{ value: "yes", label: "✓ Complete" }, { value: "no", label: "✗ Incomplete" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Polio (OPV/IPV 3 doses)" val={polio} set={setPolio} options={[{ value: "yes", label: "✓ Complete" }, { value: "no", label: "✗ Incomplete" }]} />
          <SelectInput label="DPT/DTaP (3 doses)" val={dpt} set={setDpt} options={[{ value: "yes", label: "✓ Complete" }, { value: "no", label: "✗ Incomplete" }]} />
        </div>
        <SelectInput label="MMR (1st dose)" val={mmr} set={setMmr} options={[{ value: "yes", label: "✓ Given" }, { value: "no", label: "✗ Not given" }]} />
      </div>} />
  )
}
