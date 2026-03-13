"use client"

import { useState } from "react"
import { Baby, Heart, Calendar, Activity, TrendingUp, AlertCircle, Shield, Clock, CheckCircle } from "lucide-react"
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

// ─── 31. Naegele's Rule Calculator ────────────────────────────────────────────
export function NaegelesRuleCalculator() {
  const [lmpDate, setLmpDate] = useState("")
  const [cycleLength, setCycleLength] = useState(28)
  const [method, setMethod] = useState("natural")
  const [ivfTransferDay, setIvfTransferDay] = useState("day5")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    if (!lmpDate) return
    const lmp = new Date(lmpDate)
    const cl = clamp(cycleLength, 20, 45)
    const cycleAdj = cl - 28

    let edd: Date
    if (method === "ivf") {
      const transferAdj = ivfTransferDay === "day3" ? 263 : 261
      edd = new Date(lmp.getTime() + transferAdj * 86400000)
    } else {
      edd = new Date(lmp.getTime())
      edd.setMonth(edd.getMonth() + 9)
      edd.setDate(edd.getDate() + 7 + cycleAdj)
    }

    const today = new Date()
    const daysPregnant = Math.floor((today.getTime() - lmp.getTime()) / 86400000)
    const weeksPregnant = Math.floor(daysPregnant / 7)
    const daysExtra = daysPregnant % 7
    const daysRemaining = Math.max(0, Math.floor((edd.getTime() - today.getTime()) / 86400000))
    const trimester = weeksPregnant < 13 ? "First Trimester" : weeksPregnant < 27 ? "Second Trimester" : "Third Trimester"

    const pretermDate = new Date(lmp.getTime() + 259 * 86400000)
    const postTermDate = new Date(edd.getTime() + 14 * 86400000)
    const viabilityDate = new Date(lmp.getTime() + 168 * 86400000)

    const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    const status: 'normal' | 'warning' | 'danger' | 'good' = daysPregnant < 0 ? "warning" : daysRemaining <= 0 ? "danger" : "good"

    setResult({
      primaryMetric: { label: "Estimated Due Date", value: fmt(edd), status, description: `Naegele's Rule${cycleAdj !== 0 ? ` (adjusted ${cycleAdj > 0 ? "+" : ""}${cycleAdj} days for ${cl}-day cycle)` : ""} — ${daysRemaining} days remaining` },
      healthScore: Math.min(100, r0((daysPregnant / 280) * 100)),
      metrics: [
        { label: "Due Date (EDD)", value: fmt(edd), status: "good" },
        { label: "Current Gestational Age", value: `${weeksPregnant}w ${daysExtra}d`, status: "normal" },
        { label: "Trimester", value: trimester, status: "normal" },
        { label: "Days Remaining", value: daysRemaining, unit: "days", status: daysRemaining < 14 ? "warning" : "good" },
        { label: "Preterm Threshold (37w)", value: fmt(pretermDate), status: "normal" },
        { label: "Post-term Threshold (42w)", value: fmt(postTermDate), status: "warning" },
        { label: "Viability Threshold (24w)", value: fmt(viabilityDate), status: "normal" },
        { label: "Cycle Adjustment", value: cycleAdj, unit: "days", status: "normal" }
      ],
      recommendations: [
        { title: "Naegele's Rule Formula", description: `EDD = LMP + 280 days (40 weeks) ± cycle adjustment. Your LMP: ${fmt(lmp)}, cycle length: ${cl} days. Adjustment: ${cycleAdj} days. Only 4-5% of babies arrive exactly on the due date; 80% deliver within ±2 weeks of EDD.`, priority: "high", category: "Formula" },
        { title: "Trimester Overview", description: `${trimester}: ${weeksPregnant < 13 ? "Organ formation, neural tube development. High risk of miscarriage. Start prenatal vitamins (folic acid 400-800μg/day). First ultrasound at 8-12 weeks." : weeksPregnant < 27 ? "Anatomy scan at 18-22 weeks. Glucose tolerance test at 24-28 weeks. Baby begins kicking. Risk of preterm labor increases after 24 weeks." : "Growth monitoring, kick counts daily after 28 weeks. NST/BPP if high-risk. Prepare hospital bag by 36 weeks. Full-term at 39 weeks."}`, priority: "high", category: "Pregnancy" },
        { title: "Dating Accuracy", description: "Naegele's Rule assumes a 28-day cycle with ovulation on day 14. First-trimester ultrasound dating (CRL) is accurate to ±5-7 days and may override LMP-based EDD if discrepancy >7 days. Second-trimester ultrasound is accurate to ±10-14 days.", priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: { "LMP Date": fmt(lmp), "Cycle Length": `${cl} days`, "Cycle Adjustment": `${cycleAdj} days`, "Method": method === "ivf" ? `IVF (${ivfTransferDay})` : "Natural/LMP", "EDD": fmt(edd), "Gestational Age": `${weeksPregnant}w ${daysExtra}d`, "Days Remaining": daysRemaining }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="naegeles-rule-calculator" title="Naegele's Rule Due Date Calculator"
      description="Calculate your estimated due date using Naegele's Rule with cycle length adjustment. Supports natural conception and IVF transfer dating."
      icon={Calendar} calculate={calculate} onClear={() => { setLmpDate(""); setCycleLength(28); setMethod("natural"); setIvfTransferDay("day5"); setResult(null) }}
      values={[lmpDate, cycleLength, method, ivfTransferDay]} result={result}
      seoContent={<SeoContentGenerator title="Naegele's Rule Due Date Calculator" description="Calculate pregnancy due date using Naegele's Rule with cycle adjustment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Last Menstrual Period (LMP)" val={lmpDate} set={setLmpDate} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
          <SelectInput label="Conception Method" val={method} set={setMethod} options={[{ value: "natural", label: "Natural / LMP" }, { value: "ivf", label: "IVF Transfer" }]} />
        </div>
        {method === "ivf" && <SelectInput label="IVF Transfer Day" val={ivfTransferDay} set={setIvfTransferDay} options={[{ value: "day3", label: "Day 3 Transfer" }, { value: "day5", label: "Day 5 (Blastocyst)" }]} />}
      </div>} />
  )
}

// ─── 32. Pregnancy Milestones Tracker ─────────────────────────────────────────
export function PregnancyMilestonesTracker() {
  const [lmpDate, setLmpDate] = useState("")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    if (!lmpDate) return
    const lmp = new Date(lmpDate)
    const today = new Date()
    const daysPregnant = Math.floor((today.getTime() - lmp.getTime()) / 86400000)
    const weeksPregnant = r1(daysPregnant / 7)
    const wk = Math.floor(weeksPregnant)

    const milestones = [
      { week: 4, name: "Implantation Complete", organ: "Placenta begins forming" },
      { week: 6, name: "Heartbeat Detectable", organ: "Heart tube begins beating" },
      { week: 8, name: "Embryo → Fetus", organ: "All major organs initiated" },
      { week: 10, name: "Fingers & Toes Formed", organ: "Limb buds differentiated" },
      { week: 12, name: "End of First Trimester", organ: "Reflexes appear, gender identifiable" },
      { week: 16, name: "Movement Possible", organ: "Skeleton hardening, facial muscles" },
      { week: 18, name: "Anatomy Scan Window", organ: "Detailed organ/structure review" },
      { week: 20, name: "Halfway Point", organ: "Vernix forms, can hear sounds" },
      { week: 24, name: "Viability Threshold", organ: "Lungs begin surfactant production" },
      { week: 28, name: "Third Trimester Begins", organ: "Eyes open, brain development rapid" },
      { week: 32, name: "Practice Breathing", organ: "Lungs maturing, fat deposition" },
      { week: 36, name: "Head Engages", organ: "Most organs mature, position for birth" },
      { week: 37, name: "Early Term", organ: "Considered safe for delivery" },
      { week: 39, name: "Full Term", organ: "Brain and liver fully mature" },
      { week: 40, name: "Due Date", organ: "Expected delivery" }
    ]

    const passed = milestones.filter(m => wk >= m.week)
    const upcoming = milestones.filter(m => wk < m.week)
    const nextMilestone = upcoming[0]
    const daysToNext = nextMilestone ? (nextMilestone.week * 7 - daysPregnant) : 0

    const currentSize = wk < 8 ? "Poppy seed → Raspberry" : wk < 12 ? "Lime → Plum" : wk < 16 ? "Avocado → Apple" : wk < 20 ? "Banana → Mango" : wk < 24 ? "Papaya → Corn" : wk < 28 ? "Eggplant → Cauliflower" : wk < 32 ? "Squash → Coconut" : wk < 36 ? "Pineapple → Honeydew" : "Watermelon → Pumpkin"

    const trimester = wk < 13 ? "First" : wk < 27 ? "Second" : "Third"
    const progress = Math.min(100, r0((daysPregnant / 280) * 100))

    setResult({
      primaryMetric: { label: "Pregnancy Progress", value: `${progress}%`, status: "good", description: `Week ${wk} — ${trimester} Trimester — ${passed.length}/${milestones.length} milestones reached` },
      healthScore: progress,
      metrics: [
        { label: "Gestational Age", value: `${wk} weeks`, status: "normal" },
        { label: "Trimester", value: `${trimester} Trimester`, status: "normal" },
        { label: "Milestones Reached", value: `${passed.length}/${milestones.length}`, status: "good" },
        { label: "Next Milestone", value: nextMilestone ? `${nextMilestone.name} (Week ${nextMilestone.week})` : "Due Date Reached!", status: nextMilestone ? "normal" : "good" },
        { label: "Days to Next Milestone", value: daysToNext, unit: "days", status: "normal" },
        { label: "Baby Size Comparison", value: currentSize, status: "normal" },
        { label: "Progress", value: progress, unit: "%", status: "good" }
      ],
      recommendations: [
        { title: "Current Stage Development", description: `Week ${wk}: ${wk < 12 ? "Critical organ formation period. Avoid alcohol, smoking, and raw foods. Neural tube closes by week 6 — folic acid crucial. First prenatal visit and dating ultrasound recommended." : wk < 24 ? "Growth and maturation phase. Anatomy scan at 18-22 weeks checks for structural anomalies. Glucose tolerance test at 24-28 weeks. Baby develops hearing and starts moving." : "Rapid brain and lung development. Monitor fetal movements daily (≥10 kicks in 2 hours). Weekly/biweekly appointments after 36 weeks. Pack hospital bag by 36 weeks."}`, priority: "high", category: "Development" },
        { title: "Upcoming Milestones", description: upcoming.slice(0, 3).map(m => `Week ${m.week}: ${m.name} — ${m.organ}`).join(". ") || "All milestones reached! Awaiting delivery.", priority: "medium", category: "Timeline" },
        { title: "Key Tests & Screenings", description: `${wk < 12 ? "Schedule: NIPT/cell-free DNA (10-13w), nuchal translucency US (11-14w), first-trimester combined screening." : wk < 28 ? "Due: Anatomy scan (18-22w), glucose tolerance test (24-28w), Rh antibody screen, complete blood count." : "Monitor: Non-stress test (NST), biophysical profile (BPP) if high-risk, Group B Strep screen (35-37w)."}`, priority: "high", category: "Screening" }
      ],
      detailedBreakdown: Object.fromEntries(milestones.map(m => [m.name, wk >= m.week ? `✅ Week ${m.week} — Reached` : `⏳ Week ${m.week} — ${m.week * 7 - daysPregnant} days away`]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pregnancy-milestones" title="Pregnancy Milestones Tracker"
      description="Track week-by-week fetal development milestones including organ formation, viability threshold, and key pregnancy events."
      icon={Baby} calculate={calculate} onClear={() => { setLmpDate(""); setResult(null) }}
      values={[lmpDate]} result={result}
      seoContent={<SeoContentGenerator title="Pregnancy Milestones Tracker" description="Track pregnancy milestones week by week." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Last Menstrual Period (LMP)" val={lmpDate} set={setLmpDate} />
      </div>} />
  )
}

// ─── 33. Amniotic Fluid Index Calculator ──────────────────────────────────────
export function AmnioticFluidIndexCalculator() {
  const [q1, setQ1] = useState(5.0)
  const [q2, setQ2] = useState(5.0)
  const [q3, setQ3] = useState(4.0)
  const [q4, setQ4] = useState(4.0)
  const [gestWeeks, setGestWeeks] = useState(32)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(q1, 0, 15)
    const b = clamp(q2, 0, 15)
    const c = clamp(q3, 0, 15)
    const d = clamp(q4, 0, 15)
    const gw = clamp(gestWeeks, 20, 42)
    const afi = r1(a + b + c + d)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (afi < 5) { category = "Oligohydramnios (Low)"; status = "danger" }
    else if (afi < 8) { category = "Borderline Low"; status = "warning" }
    else if (afi <= 24) { category = "Normal"; status = "good" }
    else if (afi <= 30) { category = "Borderline High"; status = "warning" }
    else { category = "Polyhydramnios (High)"; status = "danger" }

    const deepestPocket = Math.max(a, b, c, d)
    const dpStatus = deepestPocket < 2 ? "danger" : deepestPocket > 8 ? "warning" : "good"

    const fetalDistressRisk = afi < 5 ? "High — consider urgent evaluation" : afi < 8 ? "Moderate — close monitoring advised" : "Low"
    const fetalDistressStatus = afi < 5 ? "danger" : afi < 8 ? "warning" : "good"

    setResult({
      primaryMetric: { label: "AFI Score", value: `${afi} cm`, status, description: `${category} — Normal range: 5-24 cm at ${gw} weeks` },
      healthScore: afi < 5 ? 20 : afi < 8 ? 50 : afi <= 24 ? 90 : afi <= 30 ? 60 : 25,
      metrics: [
        { label: "AFI Total", value: afi, unit: "cm", status },
        { label: "Category", value: category, status },
        { label: "Q1 (Upper Right)", value: a, unit: "cm", status: "normal" },
        { label: "Q2 (Upper Left)", value: b, unit: "cm", status: "normal" },
        { label: "Q3 (Lower Left)", value: c, unit: "cm", status: "normal" },
        { label: "Q4 (Lower Right)", value: d, unit: "cm", status: "normal" },
        { label: "Deepest Vertical Pocket", value: r1(deepestPocket), unit: "cm", status: dpStatus },
        { label: "Fetal Distress Risk", value: fetalDistressRisk, status: fetalDistressStatus },
        { label: "Gestational Age", value: gw, unit: "weeks", status: "normal" }
      ],
      recommendations: [
        { title: "AFI Interpretation", description: `AFI = ${afi} cm at ${gw} weeks: ${afi < 5 ? "Oligohydramnios — Associated with fetal growth restriction, cord compression, and meconium aspiration. Requires immediate clinical evaluation. May need amnioinfusion or delivery planning." : afi < 8 ? "Borderline low — serial monitoring every 1-2 weeks. Ensure adequate hydration (2-3L/day). Rule out rupture of membranes, renal anomalies, or uteroplacental insufficiency." : afi <= 24 ? "Normal amniotic fluid volume. Continue routine prenatal care." : "Polyhydramnios — Associated with gestational diabetes, fetal anomalies (esophageal atresia), multiple gestation. Glucose screening recommended. Amnio-reduction may be considered in severe cases."}`, priority: "high", category: "Assessment" },
        { title: "Monitoring Protocol", description: `${afi < 8 ? "Repeat AFI in 1-2 weeks. Add non-stress test (NST). Consider BPP scoring. Monitor fetal movement daily. Maternal hydration may improve AFI by 1-3 cm." : afi > 24 ? "Repeat AFI in 2-4 weeks. Test for gestational diabetes. Detailed fetal anatomy scan if not done. Monitor for preterm labor signs." : "Routine monitoring per trimester. AFI naturally peaks at 32-36 weeks (average 14-15 cm) then gradually decreases."}`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "Q1 (UR)": `${a} cm`, "Q2 (UL)": `${b} cm`, "Q3 (LL)": `${c} cm`, "Q4 (LR)": `${d} cm`, "AFI Total": `${afi} cm`, "Deepest Pocket": `${r1(deepestPocket)} cm`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="amniotic-fluid-index" title="Amniotic Fluid Index (AFI) Calculator"
      description="Calculate the Amniotic Fluid Index from 4-quadrant ultrasound measurements. Detect oligohydramnios and polyhydramnios."
      icon={Activity} calculate={calculate} onClear={() => { setQ1(5); setQ2(5); setQ3(4); setQ4(4); setGestWeeks(32); setResult(null) }}
      values={[q1, q2, q3, q4, gestWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Amniotic Fluid Index Calculator" description="Calculate AFI from 4-quadrant amniotic fluid measurements." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Gestational Age" val={gestWeeks} set={setGestWeeks} min={20} max={42} suffix="weeks" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Q1 — Upper Right" val={q1} set={setQ1} min={0} max={15} step={0.1} suffix="cm" />
          <NumInput label="Q2 — Upper Left" val={q2} set={setQ2} min={0} max={15} step={0.1} suffix="cm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Q3 — Lower Left" val={q3} set={setQ3} min={0} max={15} step={0.1} suffix="cm" />
          <NumInput label="Q4 — Lower Right" val={q4} set={setQ4} min={0} max={15} step={0.1} suffix="cm" />
        </div>
      </div>} />
  )
}

// ─── 34. Biophysical Profile Score Calculator ─────────────────────────────────
export function BiophysicalProfileCalculator() {
  const [nst, setNst] = useState("2")
  const [fetalBreathing, setFetalBreathing] = useState("2")
  const [fetalMovement, setFetalMovement] = useState("2")
  const [fetalTone, setFetalTone] = useState("2")
  const [amnioticFluid, setAmnioticFluid] = useState("2")
  const [gestWeeks, setGestWeeks] = useState(34)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const scores = [Number(nst), Number(fetalBreathing), Number(fetalMovement), Number(fetalTone), Number(amnioticFluid)]
    const total = scores.reduce((a, b) => a + b, 0)
    const gw = clamp(gestWeeks, 24, 42)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good", recommendation = ""
    if (total === 10) { category = "Normal — No Fetal Compromise"; status = "good"; recommendation = "Routine care. Repeat per protocol." }
    else if (total === 8 && amnioticFluid === "2") { category = "Normal — Low Risk"; status = "good"; recommendation = "Routine care. Repeat per protocol." }
    else if (total === 8 && amnioticFluid === "0") { category = "Suspect Chronic Asphyxia"; status = "warning"; recommendation = "If ≥37 weeks: consider delivery. If <37 weeks: repeat in 24 hours." }
    else if (total === 6) { category = "Equivocal — Possible Compromise"; status = "warning"; recommendation = "If ≥37 weeks: consider delivery. If <37 weeks: repeat in 4-6 hours. If persistent 6/10: deliver." }
    else if (total === 4) { category = "Suspect Acute Asphyxia"; status = "danger"; recommendation = "If ≥32 weeks: strong consideration for delivery. If <32 weeks: repeat in 4-6 hours." }
    else if (total <= 2) { category = "Strongly Suspect Asphyxia"; status = "danger"; recommendation = "Immediate evaluation for delivery regardless of gestational age." }
    else { category = "Borderline"; status = "warning"; recommendation = "Clinical correlation required. Consider gestational age." }

    const perinatalMortality = total >= 8 ? "<1/1000" : total === 6 ? "~90/1000" : total === 4 ? "~90/1000" : "~200-600/1000"
    const absentComponents = scores.map((s, i) => s === 0 ? ["NST", "Fetal Breathing", "Fetal Movement", "Fetal Tone", "Amniotic Fluid"][i] : null).filter(Boolean)

    setResult({
      primaryMetric: { label: "BPP Score", value: `${total}/10`, status, description: `${category}` },
      healthScore: total * 10,
      metrics: [
        { label: "Total BPP Score", value: `${total}/10`, status },
        { label: "Category", value: category, status },
        { label: "NST (Reactive)", value: nst === "2" ? "Normal (2)" : "Abnormal (0)", status: nst === "2" ? "good" : "danger" },
        { label: "Fetal Breathing", value: fetalBreathing === "2" ? "Present (2)" : "Absent (0)", status: fetalBreathing === "2" ? "good" : "danger" },
        { label: "Fetal Movement", value: fetalMovement === "2" ? "≥3 movements (2)" : "<3 movements (0)", status: fetalMovement === "2" ? "good" : "danger" },
        { label: "Fetal Tone", value: fetalTone === "2" ? "Normal (2)" : "Absent (0)", status: fetalTone === "2" ? "good" : "danger" },
        { label: "Amniotic Fluid (DVP)", value: amnioticFluid === "2" ? "≥2cm pocket (2)" : "<2cm pocket (0)", status: amnioticFluid === "2" ? "good" : "danger" },
        { label: "Perinatal Mortality Risk", value: perinatalMortality, status: total >= 8 ? "good" : "danger" },
        { label: "Absent Components", value: absentComponents.length > 0 ? absentComponents.join(", ") : "None", status: absentComponents.length === 0 ? "good" : "danger" }
      ],
      recommendations: [
        { title: "BPP Management", description: `Score ${total}/10 at ${gw} weeks: ${recommendation}`, priority: "high", category: "Management" },
        { title: "BPP Components", description: "Each parameter scores 0 or 2: 1) NST: ≥2 accelerations (15 bpm × 15 sec) in 20 min. 2) Fetal Breathing: ≥1 episode of ≥30 sec in 30 min. 3) Fetal Movement: ≥3 discrete body/limb movements in 30 min. 4) Fetal Tone: ≥1 episode of extension-flexion of limbs/trunk. 5) Amniotic Fluid: ≥1 pocket ≥2cm in two perpendicular planes.", priority: "medium", category: "Scoring" },
        { title: "Modified BPP", description: "Modified BPP combines NST + AFI only (faster, less resource-intensive). If NST reactive + AFI normal → reassuring. If either abnormal → full BPP recommended.", priority: "medium", category: "Alternative" }
      ],
      detailedBreakdown: { "NST": `${nst}/2`, "Fetal Breathing": `${fetalBreathing}/2`, "Fetal Movement": `${fetalMovement}/2`, "Fetal Tone": `${fetalTone}/2`, "Amniotic Fluid": `${amnioticFluid}/2`, "Total": `${total}/10`, "Recommendation": recommendation }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="biophysical-profile-score" title="Biophysical Profile (BPP) Score Calculator"
      description="Calculate the fetal Biophysical Profile score from 5 parameters. Includes delivery recommendation based on score and gestational age."
      icon={Shield} calculate={calculate} onClear={() => { setNst("2"); setFetalBreathing("2"); setFetalMovement("2"); setFetalTone("2"); setAmnioticFluid("2"); setGestWeeks(34); setResult(null) }}
      values={[nst, fetalBreathing, fetalMovement, fetalTone, amnioticFluid, gestWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Biophysical Profile Calculator" description="Calculate fetal BPP score for pregnancy monitoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Gestational Age" val={gestWeeks} set={setGestWeeks} min={24} max={42} suffix="weeks" />
        <SelectInput label="Non-Stress Test (NST)" val={nst} set={setNst} options={[{ value: "2", label: "Reactive — ≥2 accelerations (2 pts)" }, { value: "0", label: "Non-reactive (0 pts)" }]} />
        <SelectInput label="Fetal Breathing Movements" val={fetalBreathing} set={setFetalBreathing} options={[{ value: "2", label: "≥1 episode ≥30 sec (2 pts)" }, { value: "0", label: "Absent (0 pts)" }]} />
        <SelectInput label="Fetal Movement" val={fetalMovement} set={setFetalMovement} options={[{ value: "2", label: "≥3 discrete movements (2 pts)" }, { value: "0", label: "<3 movements (0 pts)" }]} />
        <SelectInput label="Fetal Tone" val={fetalTone} set={setFetalTone} options={[{ value: "2", label: "Normal flexion/extension (2 pts)" }, { value: "0", label: "Absent (0 pts)" }]} />
        <SelectInput label="Amniotic Fluid (DVP)" val={amnioticFluid} set={setAmnioticFluid} options={[{ value: "2", label: "≥2 cm pocket (2 pts)" }, { value: "0", label: "<2 cm pocket (0 pts)" }]} />
      </div>} />
  )
}

// ─── 35. Bishop's Score Calculator ────────────────────────────────────────────
export function BishopsScoreCalculator() {
  const [dilation, setDilation] = useState("0")
  const [effacement, setEffacement] = useState("0")
  const [station, setStation] = useState("0")
  const [consistency, setConsistency] = useState("0")
  const [position, setPosition] = useState("0")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const scores = [Number(dilation), Number(effacement), Number(station), Number(consistency), Number(position)]
    const total = scores.reduce((a, b) => a + b, 0)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good", inductionSuccess = 0
    if (total <= 3) { category = "Unfavorable Cervix"; status = "danger"; inductionSuccess = 15 }
    else if (total <= 5) { category = "Intermediate"; status = "warning"; inductionSuccess = 45 }
    else if (total <= 7) { category = "Favorable"; status = "good"; inductionSuccess = 75 }
    else { category = "Very Favorable"; status = "good"; inductionSuccess = 95 }

    const needRipening = total <= 5
    const vagDeliveryLikely = total >= 6

    setResult({
      primaryMetric: { label: "Bishop's Score", value: `${total}/13`, status, description: `${category} — Induction success: ~${inductionSuccess}%` },
      healthScore: r0((total / 13) * 100),
      metrics: [
        { label: "Total Score", value: `${total}/13`, status },
        { label: "Category", value: category, status },
        { label: "Induction Success Rate", value: inductionSuccess, unit: "%", status: inductionSuccess >= 60 ? "good" : inductionSuccess >= 40 ? "warning" : "danger" },
        { label: "Dilation", value: ["Closed (0)", "1-2 cm (1)", "3-4 cm (2)", "≥5 cm (3)"][Number(dilation)], status: "normal" },
        { label: "Effacement", value: ["0-30% (0)", "40-50% (1)", "60-70% (2)", "≥80% (3)"][Number(effacement)], status: "normal" },
        { label: "Station", value: ["-3 (0)", "-2 (1)", "-1/0 (2)", "+1/+2 (3)"][Number(station)], status: "normal" },
        { label: "Consistency", value: ["Firm (0)", "Medium (1)", "Soft (2)"][Number(consistency)], status: "normal" },
        { label: "Position", value: ["Posterior (0)", "Mid (1)", "Anterior (2)"][Number(position)], status: "normal" },
        { label: "Cervical Ripening Needed", value: needRipening ? "Yes — Consider prostaglandin or mechanical" : "No — Oxytocin may be started", status: needRipening ? "warning" : "good" },
        { label: "Vaginal Delivery Likely", value: vagDeliveryLikely ? "Yes" : "Lower probability", status: vagDeliveryLikely ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Bishop's Score Interpretation", description: `Score ${total}: ${total <= 3 ? "Unfavorable cervix. Cervical ripening recommended before oxytocin induction. Options: prostaglandin E2 (dinoprostone), misoprostol, Foley catheter balloon, or Cook catheter. Induction without ripening has high failure rate." : total <= 5 ? "Intermediate. Cervical ripening may improve outcomes. Discuss risks of induction vs expectant management. Membrane sweeping may be offered at term." : "Favorable cervix. Oxytocin induction is appropriate. High success rate for vaginal delivery. Average time to delivery: 6-12 hours for multiparous, 12-18 hours for nulliparous."}`, priority: "high", category: "Management" },
        { title: "Cervical Ripening Methods", description: "Mechanical: Foley catheter (40-80mL) in cervix — 65% effective, lower hyperstimulation risk. Pharmacological: Misoprostol 25μg PV q3-6h (max 6 doses), Dinoprostone 10mg vaginal insert or 0.5mg cervical gel. Cook double-balloon catheter increasingly popular.", priority: "medium", category: "Options" }
      ],
      detailedBreakdown: { "Dilation": `${dilation}/3`, "Effacement": `${effacement}/3`, "Station": `${station}/3`, "Consistency": `${consistency}/2`, "Position": `${position}/2`, "Total": `${total}/13`, "Success Rate": `${inductionSuccess}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bishops-score-calculator" title="Bishop's Score Calculator"
      description="Calculate Bishop's Score for labor induction readiness. Assess cervical dilation, effacement, station, consistency, and position."
      icon={Baby} calculate={calculate} onClear={() => { setDilation("0"); setEffacement("0"); setStation("0"); setConsistency("0"); setPosition("0"); setResult(null) }}
      values={[dilation, effacement, station, consistency, position]} result={result}
      seoContent={<SeoContentGenerator title="Bishop's Score Calculator" description="Calculate Bishop's Score for labor induction assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Cervical Dilation" val={dilation} set={setDilation} options={[{ value: "0", label: "Closed (0 pts)" }, { value: "1", label: "1-2 cm (1 pt)" }, { value: "2", label: "3-4 cm (2 pts)" }, { value: "3", label: "≥5 cm (3 pts)" }]} />
        <SelectInput label="Cervical Effacement" val={effacement} set={setEffacement} options={[{ value: "0", label: "0-30% (0 pts)" }, { value: "1", label: "40-50% (1 pt)" }, { value: "2", label: "60-70% (2 pts)" }, { value: "3", label: "≥80% (3 pts)" }]} />
        <SelectInput label="Fetal Station" val={station} set={setStation} options={[{ value: "0", label: "-3 (0 pts)" }, { value: "1", label: "-2 (1 pt)" }, { value: "2", label: "-1 / 0 (2 pts)" }, { value: "3", label: "+1 / +2 (3 pts)" }]} />
        <SelectInput label="Cervical Consistency" val={consistency} set={setConsistency} options={[{ value: "0", label: "Firm (0 pts)" }, { value: "1", label: "Medium (1 pt)" }, { value: "2", label: "Soft (2 pts)" }]} />
        <SelectInput label="Cervical Position" val={position} set={setPosition} options={[{ value: "0", label: "Posterior (0 pts)" }, { value: "1", label: "Mid-position (1 pt)" }, { value: "2", label: "Anterior (2 pts)" }]} />
      </div>} />
  )
}

// ─── 36. Apgar Score Calculator ───────────────────────────────────────────────
export function ApgarScoreCalculator() {
  const [appearance, setAppearance] = useState("2")
  const [pulse, setPulse] = useState("2")
  const [grimace, setGrimace] = useState("2")
  const [activity, setActivity] = useState("2")
  const [respiration, setRespiration] = useState("2")
  const [timing, setTiming] = useState("1min")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const scores = [Number(appearance), Number(pulse), Number(grimace), Number(activity), Number(respiration)]
    const total = scores.reduce((a, b) => a + b, 0)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (total >= 7) { category = "Normal — Reassuring"; status = "good" }
    else if (total >= 4) { category = "Moderately Depressed"; status = "warning" }
    else { category = "Severely Depressed — Critical"; status = "danger" }

    const needsResuscitation = total < 7
    const needsIntubation = total < 4

    const interventions = total >= 7 ? "Routine care: dry, warm, suction if needed, skin-to-skin contact" :
      total >= 4 ? "Stimulate, clear airway, positive pressure ventilation (PPV) if no improvement. Consider CPAP." :
      "Immediate resuscitation: PPV, potential intubation, chest compressions if HR <60, epinephrine if no response"

    setResult({
      primaryMetric: { label: `Apgar Score (${timing === "1min" ? "1 minute" : "5 minutes"})`, value: `${total}/10`, status, description: category },
      healthScore: total * 10,
      metrics: [
        { label: `Total Score (${timing})`, value: `${total}/10`, status },
        { label: "Category", value: category, status },
        { label: "Appearance (Color)", value: ["Blue/pale all over (0)", "Acrocyanosis — blue extremities (1)", "Pink all over (2)"][Number(appearance)], status: appearance === "2" ? "good" : appearance === "1" ? "warning" : "danger" },
        { label: "Pulse (Heart Rate)", value: ["Absent (0)", "<100 bpm (1)", "≥100 bpm (2)"][Number(pulse)], status: pulse === "2" ? "good" : pulse === "1" ? "warning" : "danger" },
        { label: "Grimace (Reflex)", value: ["No response (0)", "Grimace (1)", "Cry/cough/sneeze (2)"][Number(grimace)], status: grimace === "2" ? "good" : grimace === "1" ? "warning" : "danger" },
        { label: "Activity (Muscle Tone)", value: ["Limp (0)", "Some flexion (1)", "Active motion (2)"][Number(activity)], status: activity === "2" ? "good" : activity === "1" ? "warning" : "danger" },
        { label: "Respiration", value: ["Absent (0)", "Slow/irregular (1)", "Good cry (2)"][Number(respiration)], status: respiration === "2" ? "good" : respiration === "1" ? "warning" : "danger" },
        { label: "Resuscitation Needed", value: needsResuscitation ? "Yes" : "No", status: needsResuscitation ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Apgar Score Action", description: `Score ${total}/10 at ${timing === "1min" ? "1 minute" : "5 minutes"}: ${interventions}. ${timing === "1min" && total < 7 ? "Reassess at 5 minutes. If 5-minute Apgar <7, continue resuscitation and reassess at 10, 15, 20 minutes." : ""}`, priority: "high", category: "Intervention" },
        { title: "Apgar Limitations", description: "Apgar score is NOT predictive of long-term outcome. Low 1-minute scores commonly improve by 5 minutes. A single low score does not indicate cerebral palsy or neurological damage. Other factors (cord blood gas, clinical course) are more predictive. The score assesses transition from intrauterine to extrauterine life.", priority: "medium", category: "Interpretation" },
        { title: "APGAR Mnemonic", description: "A = Appearance (skin color), P = Pulse (heart rate), G = Grimace (reflex irritability), A = Activity (muscle tone), R = Respiration (breathing effort). Each scored 0, 1, or 2. Introduced by Dr. Virginia Apgar in 1952.", priority: "low", category: "Education" }
      ],
      detailedBreakdown: { "Appearance": `${appearance}/2`, "Pulse": `${pulse}/2`, "Grimace": `${grimace}/2`, "Activity": `${activity}/2`, "Respiration": `${respiration}/2`, "Total": `${total}/10`, "Timing": timing === "1min" ? "1 minute" : "5 minutes" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="apgar-score-calculator" title="Apgar Score Calculator"
      description="Calculate the newborn Apgar score at 1 and 5 minutes. Assess Appearance, Pulse, Grimace, Activity, and Respiration."
      icon={Baby} calculate={calculate} onClear={() => { setAppearance("2"); setPulse("2"); setGrimace("2"); setActivity("2"); setRespiration("2"); setTiming("1min"); setResult(null) }}
      values={[appearance, pulse, grimace, activity, respiration, timing]} result={result}
      seoContent={<SeoContentGenerator title="Apgar Score Calculator" description="Calculate newborn Apgar score for neonatal assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Assessment Timing" val={timing} set={setTiming} options={[{ value: "1min", label: "1 Minute" }, { value: "5min", label: "5 Minutes" }]} />
        <SelectInput label="Appearance (Skin Color)" val={appearance} set={setAppearance} options={[{ value: "0", label: "Blue or pale all over (0)" }, { value: "1", label: "Blue extremities, pink body (1)" }, { value: "2", label: "Completely pink (2)" }]} />
        <SelectInput label="Pulse (Heart Rate)" val={pulse} set={setPulse} options={[{ value: "0", label: "Absent (0)" }, { value: "1", label: "<100 bpm (1)" }, { value: "2", label: "≥100 bpm (2)" }]} />
        <SelectInput label="Grimace (Reflex Irritability)" val={grimace} set={setGrimace} options={[{ value: "0", label: "No response (0)" }, { value: "1", label: "Grimace only (1)" }, { value: "2", label: "Cry, cough, or sneeze (2)" }]} />
        <SelectInput label="Activity (Muscle Tone)" val={activity} set={setActivity} options={[{ value: "0", label: "Limp / flaccid (0)" }, { value: "1", label: "Some flexion (1)" }, { value: "2", label: "Active motion (2)" }]} />
        <SelectInput label="Respiration (Breathing)" val={respiration} set={setRespiration} options={[{ value: "0", label: "Absent (0)" }, { value: "1", label: "Slow, weak, irregular (1)" }, { value: "2", label: "Good cry (2)" }]} />
      </div>} />
  )
}

// ─── 37. Breastmilk Storage Guide ─────────────────────────────────────────────
export function BreastmilkStorageGuide() {
  const [storageType, setStorageType] = useState("room")
  const [hoursStored, setHoursStored] = useState(2)
  const [temperature, setTemperature] = useState("normal")
  const [freshOrThawed, setFreshOrThawed] = useState("fresh")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hrs = clamp(hoursStored, 0, 8760)

    const limits: Record<string, { maxHours: number; label: string; optimal: string }> = {
      room: { maxHours: freshOrThawed === "fresh" ? 4 : 2, label: "Room Temperature (16-25°C)", optimal: "Use within 4 hours (ideal: 1-2 hours)" },
      cooler: { maxHours: 24, label: "Insulated Cooler with Ice Packs", optimal: "Use within 24 hours" },
      fridge: { maxHours: freshOrThawed === "fresh" ? 96 : 24, label: "Refrigerator (4°C / 39°F)", optimal: freshOrThawed === "fresh" ? "Best within 3 days, safe up to 4 days" : "Use thawed milk within 24 hours" },
      freezer: { maxHours: freshOrThawed === "fresh" ? 4380 : 0, label: "Freezer (-18°C / 0°F)", optimal: "Best within 3 months, acceptable up to 6 months" },
      deepFreezer: { maxHours: freshOrThawed === "fresh" ? 8760 : 0, label: "Deep Freezer (-20°C / -4°F)", optimal: "Safe up to 12 months, best quality within 6 months" }
    }

    const current = limits[storageType]
    const maxH = current.maxHours
    const percentUsed = maxH > 0 ? r0((hrs / maxH) * 100) : 100
    const hoursLeft = Math.max(0, maxH - hrs)
    const safe = hrs <= maxH && maxH > 0

    let bacterialRisk = "Low"
    let bacterialStatus: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (percentUsed > 100) { bacterialRisk = "High — Do NOT use"; bacterialStatus = "danger" }
    else if (percentUsed > 75) { bacterialRisk = "Moderate — Use soon"; bacterialStatus = "warning" }
    else if (percentUsed > 50) { bacterialRisk = "Low-Moderate"; bacterialStatus = "normal" }

    const canRefreeze = freshOrThawed === "thawed" ? "No — Never refreeze thawed milk" : "N/A"

    setResult({
      primaryMetric: { label: "Storage Status", value: safe ? "SAFE to Use" : "EXPIRED — Discard", status: safe ? "good" : "danger", description: `${current.label} — ${r0(hrs)} hours stored of ${maxH} max` },
      healthScore: safe ? Math.max(10, 100 - percentUsed) : 0,
      metrics: [
        { label: "Storage Method", value: current.label, status: "normal" },
        { label: "Hours Stored", value: hrs, unit: "hours", status: safe ? "good" : "danger" },
        { label: "Maximum Safe Duration", value: maxH, unit: "hours", status: "normal" },
        { label: "Time Remaining", value: r0(hoursLeft), unit: "hours", status: hoursLeft > 0 ? "good" : "danger" },
        { label: "Storage Used", value: Math.min(percentUsed, 100), unit: "%", status: percentUsed <= 50 ? "good" : percentUsed <= 75 ? "normal" : percentUsed <= 100 ? "warning" : "danger" },
        { label: "Bacterial Growth Risk", value: bacterialRisk, status: bacterialStatus },
        { label: "Milk Type", value: freshOrThawed === "fresh" ? "Freshly Expressed" : "Previously Thawed", status: "normal" },
        { label: "Can Re-freeze", value: canRefreeze, status: freshOrThawed === "thawed" ? "danger" : "normal" },
        { label: "Optimal Use", value: current.optimal, status: "normal" }
      ],
      recommendations: [
        { title: "Storage Guidelines (CDC/ABM)", description: `${current.label}: ${current.optimal}. ${safe ? `You have approximately ${r0(hoursLeft)} hours remaining.` : "This milk has exceeded safe storage time and should be discarded."} ${temperature === "warm" ? " Note: Warm room >25°C reduces safe time significantly." : ""}`, priority: "high", category: "Safety" },
        { title: "Handling Best Practices", description: "Always label milk with date/time expressed. Use oldest milk first (FIFO). Thaw in refrigerator overnight or under warm running water — never microwave. Gently swirl (don't shake) to mix fat layer. Once baby starts feeding from a bottle, use within 2 hours.", priority: "high", category: "Handling" },
        { title: "Storage Tips", description: "Store in back of fridge/freezer (not door) for consistent temperature. Use BPA-free storage bags or glass containers. Leave 1 inch headspace for freezing expansion. Small portions (2-4 oz) reduce waste. Fresh milk has more anti-infective properties than frozen.", priority: "medium", category: "Tips" }
      ],
      detailedBreakdown: { "Storage": current.label, "Stored": `${hrs} hours`, "Max": `${maxH} hours`, "Remaining": `${r0(hoursLeft)} hours`, "Risk": bacterialRisk, "Type": freshOrThawed }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="breastmilk-storage-guide" title="Breastmilk Storage Guide & Timer"
      description="Check breastmilk storage safety by method and duration. Bacterial growth risk assessment and CDC/ABM guidelines."
      icon={Clock} calculate={calculate} onClear={() => { setStorageType("room"); setHoursStored(2); setTemperature("normal"); setFreshOrThawed("fresh"); setResult(null) }}
      values={[storageType, hoursStored, temperature, freshOrThawed]} result={result}
      seoContent={<SeoContentGenerator title="Breastmilk Storage Guide" description="Check breastmilk storage safety and expiration times." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Storage Method" val={storageType} set={setStorageType} options={[{ value: "room", label: "Room Temperature (16-25°C)" }, { value: "cooler", label: "Insulated Cooler + Ice Packs" }, { value: "fridge", label: "Refrigerator (4°C)" }, { value: "freezer", label: "Freezer (-18°C)" }, { value: "deepFreezer", label: "Deep Freezer (-20°C)" }]} />
        <SelectInput label="Milk Type" val={freshOrThawed} set={setFreshOrThawed} options={[{ value: "fresh", label: "Freshly Expressed" }, { value: "thawed", label: "Previously Frozen (Thawed)" }]} />
        <NumInput label="Hours Stored So Far" val={hoursStored} set={setHoursStored} min={0} max={8760} suffix="hours" />
        <SelectInput label="Room Temperature" val={temperature} set={setTemperature} options={[{ value: "cool", label: "Cool (<19°C)" }, { value: "normal", label: "Normal (19-25°C)" }, { value: "warm", label: "Warm (>25°C)" }]} />
      </div>} />
  )
}

// ─── 38. Newborn Feeding Schedule Calculator ──────────────────────────────────
export function NewbornFeedingSchedule() {
  const [babyAgeDays, setBabyAgeDays] = useState(7)
  const [birthWeight, setBirthWeight] = useState(3.2)
  const [currentWeight, setCurrentWeight] = useState(3.1)
  const [feedingType, setFeedingType] = useState("breast")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const age = clamp(babyAgeDays, 0, 365)
    const bw = clamp(birthWeight, 1.5, 6.0)
    const cw = clamp(currentWeight, 1.0, 12.0)

    const weightChange = r1(((cw - bw) / bw) * 100)
    const isBreast = feedingType === "breast"

    let feedsPerDay = 0, volumePerFeed = 0, dailyTotal = 0
    let scheduleDesc = ""

    if (age <= 1) {
      feedsPerDay = 8; volumePerFeed = isBreast ? 7 : 10; scheduleDesc = "Colostrum phase: 5-7mL/feed, every 2-3 hours"
    } else if (age <= 3) {
      feedsPerDay = 8; volumePerFeed = isBreast ? 22 : 30; scheduleDesc = "Transitional milk: 15-30mL/feed, every 2-3 hours"
    } else if (age <= 7) {
      feedsPerDay = 8; volumePerFeed = isBreast ? 45 : 60; scheduleDesc = "Mature milk coming in: 30-60mL/feed, 8-12 feeds/day"
    } else if (age <= 14) {
      feedsPerDay = 8; volumePerFeed = isBreast ? 60 : 75; scheduleDesc = "Established feeding: 60-90mL/feed, 8-12 feeds/day"
    } else if (age <= 30) {
      feedsPerDay = 7; volumePerFeed = isBreast ? 90 : 100; scheduleDesc = "Growth spurt phase: 75-120mL/feed, 7-9 feeds/day"
    } else if (age <= 90) {
      feedsPerDay = 6; volumePerFeed = isBreast ? 120 : 140; scheduleDesc = "Established pattern: 100-150mL/feed, 6-8 feeds/day"
    } else if (age <= 180) {
      feedsPerDay = 5; volumePerFeed = isBreast ? 150 : 180; scheduleDesc = "Longer gaps: 120-200mL/feed, 5-6 feeds/day + solids introduction at 6mo"
    } else {
      feedsPerDay = 4; volumePerFeed = isBreast ? 180 : 200; scheduleDesc = "Mixed feeding: 150-240mL/feed, 3-5 feeds/day + solid meals"
    }

    dailyTotal = feedsPerDay * volumePerFeed
    const hoursInterval = r1(24 / feedsPerDay)

    const weightLossOk = age <= 7 ? weightChange >= -10 : weightChange >= -7
    const regainedBirthWeight = cw >= bw

    let growthAdequacy = "", growthStatus: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (age <= 7 && weightChange >= -10) { growthAdequacy = "Normal physiological weight loss"; growthStatus = weightChange >= -5 ? "good" : "warning" }
    else if (age <= 14 && !regainedBirthWeight) { growthAdequacy = "Should regain birth weight by 10-14 days"; growthStatus = "warning" }
    else if (regainedBirthWeight) { growthAdequacy = "Birth weight regained — on track"; growthStatus = "good" }
    else { growthAdequacy = "Below birth weight — monitor closely"; growthStatus = "danger" }

    setResult({
      primaryMetric: { label: "Feeding Schedule", value: `${feedsPerDay} feeds/day`, status: "good", description: `${scheduleDesc} — ~${r0(volumePerFeed)} mL per feed` },
      healthScore: weightLossOk ? (regainedBirthWeight || age <= 7 ? 85 : 60) : 35,
      metrics: [
        { label: "Baby Age", value: age, unit: "days", status: "normal" },
        { label: "Feeds per Day", value: feedsPerDay, status: "good" },
        { label: "Volume per Feed", value: r0(volumePerFeed), unit: "mL", status: "normal" },
        { label: "Daily Total Intake", value: r0(dailyTotal), unit: "mL", status: "normal" },
        { label: "Feeding Interval", value: hoursInterval, unit: "hours", status: "normal" },
        { label: "Feeding Type", value: isBreast ? "Breastfeeding" : "Formula", status: "normal" },
        { label: "Weight Change", value: weightChange, unit: "%", status: weightLossOk ? "good" : "danger" },
        { label: "Growth Adequacy", value: growthAdequacy, status: growthStatus },
        { label: "Birth Weight", value: bw, unit: "kg", status: "normal" },
        { label: "Current Weight", value: cw, unit: "kg", status: regainedBirthWeight || age <= 7 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Age-Based Feeding Guide", description: `Day ${age}: ${scheduleDesc}. ${isBreast ? "Breastfeed on demand — watch for hunger cues (rooting, lip smacking, fist-to-mouth). Time at breast: 10-20 min per side. Let baby finish first breast before offering second." : `Formula: ${r0(volumePerFeed)} mL (${r0(volumePerFeed / 30)} oz) every ${hoursInterval} hours. Use paced bottle feeding — hold bottle horizontal, allow baby to control pace. Do not force finish.`}`, priority: "high", category: "Feeding" },
        { title: "Weight Monitoring", description: `Weight change: ${weightChange}%. ${age <= 3 ? "Expect 5-7% loss in first 3-4 days (max 10%)." : age <= 14 ? `Should regain birth weight by 10-14 days. ${regainedBirthWeight ? "✓ Birth weight regained." : "⚠ Not yet regained — ensure adequate feeds, consider lactation consult."}` : `Expected gain: 150-200g/week (0-3mo), 100-150g/week (3-6mo). ${weightChange < 0 ? "Below birth weight — evaluate feeding adequacy." : "Growing well."}`}`, priority: "high", category: "Growth" },
        { title: "Adequate Intake Signs", description: "Signs of adequate feeding: 6-8 wet diapers/day by day 4-5, 3-4 yellow seedy stools/day (breastfed), satisfied after feeds, steady weight gain. Insufficient signs: <6 wet diapers, persistent yellow eyes, lethargy, weak cry, poor latch.", priority: "medium", category: "Assessment" }
      ],
      detailedBreakdown: { "Age": `${age} days`, "Feeds/Day": feedsPerDay, "mL/Feed": r0(volumePerFeed), "Total mL/Day": r0(dailyTotal), "Interval": `${hoursInterval}h`, "Weight Δ": `${weightChange}%`, "Type": feedingType }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="newborn-feeding-schedule" title="Newborn Feeding Schedule Calculator"
      description="Get age and weight-based feeding frequency, volume per feed, and growth adequacy assessment for breast and formula feeding."
      icon={Baby} calculate={calculate} onClear={() => { setBabyAgeDays(7); setBirthWeight(3.2); setCurrentWeight(3.1); setFeedingType("breast"); setResult(null) }}
      values={[babyAgeDays, birthWeight, currentWeight, feedingType]} result={result}
      seoContent={<SeoContentGenerator title="Newborn Feeding Schedule Calculator" description="Calculate newborn feeding schedule by age and weight." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Baby Age" val={babyAgeDays} set={setBabyAgeDays} min={0} max={365} suffix="days" />
          <SelectInput label="Feeding Type" val={feedingType} set={setFeedingType} options={[{ value: "breast", label: "Breastfeeding" }, { value: "formula", label: "Formula" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Birth Weight" val={birthWeight} set={setBirthWeight} min={1.5} max={6.0} step={0.1} suffix="kg" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={1.0} max={12.0} step={0.1} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 39. Postpartum Recovery Tracker ──────────────────────────────────────────
export function PostpartumRecoveryTracker() {
  const [deliveryType, setDeliveryType] = useState("vaginal")
  const [daysPostpartum, setDaysPostpartum] = useState(7)
  const [painLevel, setPainLevel] = useState(3)
  const [bleedingLevel, setBleedingLevel] = useState("moderate")
  const [sleepHours, setSleepHours] = useState(5)
  const [moodScore, setMoodScore] = useState(6)
  const [fever, setFever] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const days = clamp(daysPostpartum, 0, 365)
    const pain = clamp(painLevel, 0, 10)
    const sleep = clamp(sleepHours, 0, 12)
    const mood = clamp(moodScore, 0, 10)
    const isCSection = deliveryType === "csection"

    let recoveryScore = 100
    recoveryScore -= pain * 5
    recoveryScore -= (bleedingLevel === "heavy" ? 20 : bleedingLevel === "moderate" ? 10 : 0)
    recoveryScore -= Math.max(0, (6 - sleep) * 5)
    recoveryScore -= Math.max(0, (7 - mood) * 5)
    if (fever === "yes") recoveryScore -= 20
    if (isCSection && days < 14) recoveryScore -= 10
    recoveryScore = clamp(recoveryScore, 0, 100)

    const expectedRecoveryWeeks = isCSection ? 6 : 4
    const recoveryProgress = Math.min(100, r0((days / (expectedRecoveryWeeks * 7)) * 100))

    const ppdRisk = mood <= 3 || (mood <= 5 && sleep < 4)
    const infectionAlert = fever === "yes" || (bleedingLevel === "heavy" && days > 14) || (pain >= 8 && days > 7)

    let bleedingExpectation = ""
    if (days <= 3) bleedingExpectation = "Lochia rubra (bright red, heavy) — normal"
    else if (days <= 10) bleedingExpectation = "Lochia serosa (pinkish-brown) — moderate flow"
    else if (days <= 28) bleedingExpectation = "Lochia alba (yellowish-white) — light"
    else bleedingExpectation = "Should be minimal or stopped"

    const bleedingNormal = (days <= 3 && bleedingLevel !== "none") || (days <= 10 && bleedingLevel !== "heavy") || (days > 10 && bleedingLevel !== "heavy")

    const status: 'normal' | 'warning' | 'danger' | 'good' = infectionAlert ? "danger" : ppdRisk ? "warning" : recoveryScore >= 70 ? "good" : recoveryScore >= 40 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Recovery Index", value: `${r0(recoveryScore)}/100`, status, description: `Day ${days} postpartum (${deliveryType === "csection" ? "C-section" : "Vaginal"}) — ${recoveryProgress}% through expected recovery` },
      healthScore: recoveryScore,
      metrics: [
        { label: "Recovery Score", value: r0(recoveryScore), unit: "/100", status },
        { label: "Recovery Progress", value: recoveryProgress, unit: "%", status: recoveryProgress >= 80 ? "good" : "normal" },
        { label: "Days Postpartum", value: days, status: "normal" },
        { label: "Pain Level", value: `${pain}/10`, status: pain <= 3 ? "good" : pain <= 6 ? "warning" : "danger" },
        { label: "Bleeding", value: bleedingLevel, status: bleedingNormal ? "normal" : "warning" },
        { label: "Expected Bleeding", value: bleedingExpectation, status: "normal" },
        { label: "Sleep", value: sleep, unit: "hours/night", status: sleep >= 6 ? "good" : sleep >= 4 ? "warning" : "danger" },
        { label: "Mood Score", value: `${mood}/10`, status: mood >= 7 ? "good" : mood >= 4 ? "warning" : "danger" },
        { label: "PPD Risk Flag", value: ppdRisk ? "⚠ Elevated Risk" : "Low Risk", status: ppdRisk ? "danger" : "good" },
        { label: "Infection Alert", value: infectionAlert ? "⚠ Possible Infection" : "No Concerns", status: infectionAlert ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Recovery Assessment", description: `Day ${days} ${isCSection ? "post C-section" : "postpartum"}: ${recoveryScore >= 70 ? "Recovery progressing well. Continue current care." : recoveryScore >= 40 ? "Some areas of concern. Focus on rest and pain management." : "Multiple concerning parameters. Consider contacting your healthcare provider."}${infectionAlert ? " ⚠ INFECTION ALERT: Fever, excessive pain, or heavy bleeding warrants immediate medical evaluation." : ""}`, priority: "high", category: "Assessment" },
        { title: "Postpartum Depression Screening", description: `Mood score: ${mood}/10, Sleep: ${sleep}h/night. ${ppdRisk ? "⚠ PPD risk factors present. Edinburgh Postnatal Depression Scale (EPDS) screening recommended. Contact provider if: persistent sadness >2 weeks, loss of interest, anxiety/panic, thoughts of self-harm, difficulty bonding with baby. PPD affects 10-20% of new mothers. Treatment is available and effective." : "Current mood indicators within normal range. Baby blues (mood swings, crying) are normal in the first 2 weeks postpartum."}`, priority: ppdRisk ? "high" : "medium", category: "Mental Health" },
        { title: "Physical Recovery Timeline", description: `${isCSection ? "C-section recovery: Incision healing 4-6 weeks. Avoid lifting >10 lbs for 6 weeks. Gradually increase activity. Numbness near incision may last months. Full recovery: 6-8 weeks." : "Vaginal delivery: Perineal healing 2-4 weeks. Sitz baths for comfort. Pelvic floor exercises (Kegels) starting 24h post-delivery. Full recovery: 4-6 weeks."} Resume exercise after provider clearance (typically 6 weeks). Postpartum visit at 6 weeks.`, priority: "medium", category: "Timeline" }
      ],
      detailedBreakdown: { "Delivery": isCSection ? "C-Section" : "Vaginal", "Day": days, "Pain": `${pain}/10`, "Bleeding": bleedingLevel, "Sleep": `${sleep}h`, "Mood": `${mood}/10`, "PPD Risk": ppdRisk ? "Yes" : "No", "Infection Alert": infectionAlert ? "Yes" : "No", "Recovery": `${r0(recoveryScore)}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="postpartum-recovery-tracker" title="Postpartum Recovery Tracker"
      description="Track postpartum recovery with pain, bleeding, sleep, and mood assessment. Includes PPD risk screening and infection alerts."
      icon={Heart} calculate={calculate} onClear={() => { setDeliveryType("vaginal"); setDaysPostpartum(7); setPainLevel(3); setBleedingLevel("moderate"); setSleepHours(5); setMoodScore(6); setFever("no"); setResult(null) }}
      values={[deliveryType, daysPostpartum, painLevel, bleedingLevel, sleepHours, moodScore, fever]} result={result}
      seoContent={<SeoContentGenerator title="Postpartum Recovery Tracker" description="Track postpartum recovery with PPD risk and infection alerts." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Delivery Type" val={deliveryType} set={setDeliveryType} options={[{ value: "vaginal", label: "Vaginal Delivery" }, { value: "csection", label: "C-Section" }]} />
          <NumInput label="Days Postpartum" val={daysPostpartum} set={setDaysPostpartum} min={0} max={365} suffix="days" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Pain Level" val={painLevel} set={setPainLevel} min={0} max={10} suffix="/10" />
          <SelectInput label="Bleeding Level" val={bleedingLevel} set={setBleedingLevel} options={[{ value: "none", label: "None" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "heavy", label: "Heavy" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep per Night" val={sleepHours} set={setSleepHours} min={0} max={12} step={0.5} suffix="hours" />
          <NumInput label="Mood Score" val={moodScore} set={setMoodScore} min={0} max={10} suffix="/10" />
        </div>
        <SelectInput label="Fever (≥38°C / 100.4°F)" val={fever} set={setFever} options={[{ value: "no", label: "No Fever" }, { value: "yes", label: "Yes — Fever Present" }]} />
      </div>} />
  )
}

// ─── 40. PMS Symptom Tracker ──────────────────────────────────────────────────
export function PMSSymptomTracker() {
  const [cycleDay, setCycleDay] = useState(24)
  const [bloating, setBloating] = useState(2)
  const [cramps, setCramps] = useState(2)
  const [moodSwings, setMoodSwings] = useState(2)
  const [fatigue, setFatigue] = useState(2)
  const [breastTenderness, setBreastTenderness] = useState(1)
  const [headache, setHeadache] = useState(1)
  const [appetite, setAppetite] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cd = clamp(cycleDay, 1, 45)
    const symptoms = [
      { name: "Bloating", score: clamp(bloating, 0, 5) },
      { name: "Cramps", score: clamp(cramps, 0, 5) },
      { name: "Mood Swings", score: clamp(moodSwings, 0, 5) },
      { name: "Fatigue", score: clamp(fatigue, 0, 5) },
      { name: "Breast Tenderness", score: clamp(breastTenderness, 0, 5) },
      { name: "Headache", score: clamp(headache, 0, 5) },
      { name: "Appetite Changes", score: clamp(appetite, 0, 5) }
    ]

    const totalScore = symptoms.reduce((sum, s) => sum + s.score, 0)
    const maxScore = 35
    const pmsIndex = r0((totalScore / maxScore) * 100)

    let severity = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (pmsIndex < 20) { severity = "Minimal PMS"; status = "good" }
    else if (pmsIndex < 40) { severity = "Mild PMS"; status = "good" }
    else if (pmsIndex < 60) { severity = "Moderate PMS"; status = "warning" }
    else if (pmsIndex < 80) { severity = "Severe PMS"; status = "danger" }
    else { severity = "Very Severe — PMDD Suspected"; status = "danger" }

    const pmddSuspicion = (moodSwings >= 4 || (moodSwings >= 3 && fatigue >= 3)) && totalScore >= 18
    const hormonalImbalance = totalScore >= 20 && (breastTenderness >= 4 || bloating >= 4)

    const lutealPhase = cd > 14
    const expectedRelief = lutealPhase ? `Expect relief in ~${Math.max(1, 28 - cd)} days (with period onset)` : "Symptoms typically occur in luteal phase (day 14-28)"

    setResult({
      primaryMetric: { label: "PMS Severity Score", value: `${pmsIndex}%`, status, description: `${severity} — Cycle Day ${cd} — Total: ${totalScore}/${maxScore}` },
      healthScore: Math.max(0, 100 - pmsIndex),
      metrics: [
        { label: "PMS Index", value: pmsIndex, unit: "%", status },
        { label: "Severity Category", value: severity, status },
        { label: "Total Symptom Score", value: `${totalScore}/${maxScore}`, status: totalScore < 10 ? "good" : totalScore < 20 ? "warning" : "danger" },
        ...symptoms.map(s => ({ label: s.name, value: `${s.score}/5`, status: (s.score <= 1 ? "good" : s.score <= 3 ? "warning" : "danger") as 'good' | 'warning' | 'danger' })),
        { label: "PMDD Suspicion", value: pmddSuspicion ? "⚠ Possible PMDD" : "Not suspected", status: pmddSuspicion ? "danger" : "good" },
        { label: "Hormonal Imbalance Alert", value: hormonalImbalance ? "⚠ Possible" : "Not indicated", status: hormonalImbalance ? "warning" : "good" },
        { label: "Expected Relief", value: expectedRelief, status: "normal" }
      ],
      recommendations: [
        { title: "PMS Management", description: `${severity} (Score ${pmsIndex}%): ${pmsIndex < 40 ? "Mild — Regular exercise, adequate sleep, and balanced diet usually sufficient. Limit salt, caffeine, and sugar in luteal phase." : pmsIndex < 60 ? "Moderate — Consider: calcium 1200mg/day (reduces PMS 48%), magnesium 200-400mg, vitamin B6 50-100mg. NSAIDs for cramps (ibuprofen 400mg q6h). Evening primrose oil may help breast tenderness." : "Severe — SSRIs (fluoxetine, sertraline) are FDA-approved for PMDD and severe PMS — can be taken continuously or luteal-phase only. Hormonal options: combined OCP (continuous use), GnRH agonists as last resort. Consult gynecologist."}`, priority: "high", category: "Treatment" },
        { title: "PMDD Assessment", description: `${pmddSuspicion ? "⚠ Your symptom pattern suggests possible PMDD (Premenstrual Dysphoric Disorder). PMDD affects 3-8% of menstruating individuals and is a recognized psychiatric condition in DSM-5. Key difference from PMS: symptoms are severe enough to impair daily functioning. Track symptoms for 2-3 cycles and consult healthcare provider." : "PMDD not currently suspected. PMDD requires ≥5 symptoms (incl. mood disturbance) causing functional impairment in most cycles. Track symptoms across 2-3 cycles for accurate assessment."}`, priority: pmddSuspicion ? "high" : "medium", category: "Diagnosis" },
        { title: "Lifestyle Modifications", description: "Evidence-based PMS relief: Aerobic exercise 30 min × 5 days/week (reduces cramps 25%, mood symptoms 30%). Reduce caffeine and alcohol. Increase complex carbs (serotonin precursors). Stress management: yoga, meditation. Chasteberry (Vitex) may help — 40mg/day for ≥3 cycles.", priority: "medium", category: "Lifestyle" }
      ],
      detailedBreakdown: Object.fromEntries(symptoms.map(s => [s.name, `${s.score}/5`]).concat([["Total", `${totalScore}/${maxScore}`], ["PMS Index", `${pmsIndex}%`], ["Severity", severity]]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pms-symptom-tracker" title="PMS Symptom Tracker"
      description="Track PMS symptoms by cycle day with severity scoring. Includes PMDD suspicion screening and hormonal imbalance alerts."
      icon={Activity} calculate={calculate} onClear={() => { setCycleDay(24); setBloating(2); setCramps(2); setMoodSwings(2); setFatigue(2); setBreastTenderness(1); setHeadache(1); setAppetite(2); setResult(null) }}
      values={[cycleDay, bloating, cramps, moodSwings, fatigue, breastTenderness, headache, appetite]} result={result}
      seoContent={<SeoContentGenerator title="PMS Symptom Tracker" description="Track PMS symptoms and severity by cycle day." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Cycle Day" val={cycleDay} set={setCycleDay} min={1} max={45} suffix="day" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Bloating" val={bloating} set={setBloating} min={0} max={5} suffix="/5" />
          <NumInput label="Cramps" val={cramps} set={setCramps} min={0} max={5} suffix="/5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Mood Swings" val={moodSwings} set={setMoodSwings} min={0} max={5} suffix="/5" />
          <NumInput label="Fatigue" val={fatigue} set={setFatigue} min={0} max={5} suffix="/5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Breast Tenderness" val={breastTenderness} set={setBreastTenderness} min={0} max={5} suffix="/5" />
          <NumInput label="Headache" val={headache} set={setHeadache} min={0} max={5} suffix="/5" />
        </div>
        <NumInput label="Appetite Changes" val={appetite} set={setAppetite} min={0} max={5} suffix="/5" />
      </div>} />
  )
}

// ─── 41. Implantation Calculator ──────────────────────────────────────────────
export function ImplantationCalculator() {
  const [ovulationDate, setOvulationDate] = useState("")
  const [cycleLength, setCycleLength] = useState(28)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    if (!ovulationDate) return
    const ovDay = new Date(ovulationDate)
    const today = new Date()
    const cl = clamp(cycleLength, 20, 45)

    const implantEarly = new Date(ovDay.getTime() + 6 * 86400000)
    const implantPeak = new Date(ovDay.getTime() + 9 * 86400000)
    const implantLate = new Date(ovDay.getTime() + 12 * 86400000)

    const dpo = Math.floor((today.getTime() - ovDay.getTime()) / 86400000)
    const inWindow = dpo >= 6 && dpo <= 12

    const hcgTestDate = new Date(ovDay.getTime() + 14 * 86400000)
    const earlyTestDate = new Date(ovDay.getTime() + 10 * 86400000)
    const daysToHcgTest = Math.max(0, Math.floor((hcgTestDate.getTime() - today.getTime()) / 86400000))

    const expectedPeriod = new Date(ovDay.getTime() + (cl - 14 + 14) * 86400000)
    const missedPeriod = today.getTime() > expectedPeriod.getTime()

    const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    const implantChances: Record<number, number> = { 6: 5, 7: 10, 8: 30, 9: 35, 10: 15, 11: 3, 12: 2 }
    const todayChance = implantChances[dpo] || 0

    const status: 'normal' | 'warning' | 'danger' | 'good' = inWindow ? "good" : dpo < 6 ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "Implantation Window", value: inWindow ? "In Window Now!" : dpo < 6 ? "Not Yet — Wait" : "Window Passed", status, description: `${dpo} DPO — Peak implantation: 8-10 DPO` },
      healthScore: inWindow ? 85 : dpo < 6 ? 50 : 70,
      metrics: [
        { label: "Days Past Ovulation (DPO)", value: dpo, status: dpo >= 0 ? "normal" : "warning" },
        { label: "Implantation Window", value: `${fmt(implantEarly)} → ${fmt(implantLate)}`, status: "normal" },
        { label: "Peak Implantation Day", value: `${fmt(implantPeak)} (9 DPO)`, status: "good" },
        { label: "Today's Implantation Chance", value: todayChance, unit: "%", status: todayChance > 0 ? "good" : "normal" },
        { label: "In Implantation Window", value: inWindow ? "Yes" : "No", status: inWindow ? "good" : "normal" },
        { label: "Earliest Home Test (10 DPO)", value: fmt(earlyTestDate), status: today >= earlyTestDate ? "good" : "normal" },
        { label: "Reliable hCG Test (14 DPO)", value: fmt(hcgTestDate), status: today >= hcgTestDate ? "good" : "normal" },
        { label: "Days Until Reliable Test", value: daysToHcgTest, unit: "days", status: daysToHcgTest === 0 ? "good" : "normal" },
        { label: "Expected Period", value: fmt(expectedPeriod), status: missedPeriod ? "warning" : "normal" },
        { label: "Period Status", value: missedPeriod ? "Missed — Test recommended" : "Not yet due", status: missedPeriod ? "warning" : "normal" }
      ],
      recommendations: [
        { title: "Implantation Timeline", description: `Ovulation: ${fmt(ovDay)}. Implantation typically occurs 6-12 DPO, with peak probability at 8-10 DPO (~80% of implantations). At ${dpo} DPO: ${dpo < 6 ? "Fertilized egg is still traveling through fallopian tube. Too early for implantation." : inWindow ? "You are in the implantation window. Some women notice light spotting (implantation bleeding), mild cramping, or breast tenderness. These are not reliable signs." : "Implantation window has passed. If pregnant, hCG should be detectable soon."}`, priority: "high", category: "Timeline" },
        { title: "When to Test", description: `Earliest possible detection: 10 DPO (50-60% sensitivity). Most reliable: 14 DPO or day of missed period (>99% sensitivity with first morning urine). Blood hCG test detects earlier than urine. ${daysToHcgTest > 0 ? `Wait ${daysToHcgTest} more days for reliable test.` : "You can test now for reliable results."} False negatives are common before 12 DPO.`, priority: "high", category: "Testing" },
        { title: "hCG Levels After Implantation", description: "After implantation, hCG doubles every 48-72 hours. Typical levels: 5-50 mIU/mL at implantation, 18-7340 by 4 weeks, 1080-56500 by 6 weeks. Home tests detect ≥25 mIU/mL. Early testing may show faint line — retest in 48 hours.", priority: "medium", category: "hCG" }
      ],
      detailedBreakdown: { "Ovulation": fmt(ovDay), "DPO": dpo, "Early Implant (6 DPO)": fmt(implantEarly), "Peak (9 DPO)": fmt(implantPeak), "Late (12 DPO)": fmt(implantLate), "Test Date": fmt(hcgTestDate) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="implantation-calculator" title="Implantation Calculator"
      description="Calculate your implantation window from ovulation date. Get optimal hCG test timing and daily implantation probability."
      icon={Calendar} calculate={calculate} onClear={() => { setOvulationDate(""); setCycleLength(28); setResult(null) }}
      values={[ovulationDate, cycleLength]} result={result}
      seoContent={<SeoContentGenerator title="Implantation Calculator" description="Calculate implantation window and when to test for pregnancy." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <DateInput label="Ovulation Date" val={ovulationDate} set={setOvulationDate} />
        <NumInput label="Cycle Length" val={cycleLength} set={setCycleLength} min={20} max={45} suffix="days" />
      </div>} />
  )
}

// ─── 42. Doula Cost Estimator ─────────────────────────────────────────────────
export function DoulaCostEstimator() {
  const [location, setLocation] = useState("suburban")
  const [serviceType, setServiceType] = useState("birth")
  const [experience, setExperience] = useState("intermediate")
  const [extras, setExtras] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const baseCosts: Record<string, { low: number; mid: number; high: number }> = {
      urban: { low: 1200, mid: 2000, high: 3500 },
      suburban: { low: 800, mid: 1400, high: 2500 },
      rural: { low: 500, mid: 900, high: 1800 }
    }

    const base = baseCosts[location]
    const serviceMultiplier = serviceType === "birth" ? 1.0 : serviceType === "postpartum" ? 0.6 : serviceType === "both" ? 1.5 : 1.0
    const expMultiplier = experience === "new" ? 0.6 : experience === "intermediate" ? 1.0 : 1.4
    const extrasAdd = extras === "photography" ? 500 : extras === "placenta" ? 300 : extras === "lactation" ? 400 : 0

    const lowEst = r0(base.low * serviceMultiplier * expMultiplier + extrasAdd)
    const midEst = r0(base.mid * serviceMultiplier * expMultiplier + extrasAdd)
    const highEst = r0(base.high * serviceMultiplier * expMultiplier + extrasAdd)

    const prenatalVisits = serviceType === "birth" || serviceType === "both" ? "2-4 prenatal visits" : "N/A"
    const birthSupport = serviceType === "birth" || serviceType === "both" ? "Continuous labor support" : "N/A"
    const postpartumVisits = serviceType === "postpartum" || serviceType === "both" ? "2-6 postpartum visits" : "N/A"

    setResult({
      primaryMetric: { label: "Estimated Cost Range", value: `$${lowEst} — $${highEst}`, status: "good", description: `Midpoint: $${midEst} — ${location} area, ${experience} experience` },
      healthScore: 75,
      metrics: [
        { label: "Low Estimate", value: `$${lowEst}`, status: "good" },
        { label: "Mid Estimate", value: `$${midEst}`, status: "good" },
        { label: "High Estimate", value: `$${highEst}`, status: "normal" },
        { label: "Location", value: location === "urban" ? "Urban/City" : location === "suburban" ? "Suburban" : "Rural", status: "normal" },
        { label: "Service Type", value: serviceType === "birth" ? "Birth Doula" : serviceType === "postpartum" ? "Postpartum Doula" : "Birth + Postpartum", status: "normal" },
        { label: "Experience Level", value: experience === "new" ? "Newly Certified" : experience === "intermediate" ? "3-5 Years" : "Senior (5+ Years)", status: "normal" },
        { label: "Prenatal Visits", value: prenatalVisits, status: "normal" },
        { label: "Birth Support", value: birthSupport, status: "normal" },
        { label: "Postpartum Visits", value: postpartumVisits, status: "normal" },
        { label: "Extras", value: extras === "none" ? "None" : `+$${extrasAdd} (${extras})`, status: "normal" }
      ],
      recommendations: [
        { title: "What's Typically Included", description: `Birth doula ($${lowEst}-$${highEst}): 2-4 prenatal visits, continuous labor support (on-call 24/7 from 37 weeks), physical comfort measures, emotional support, partner guidance, 1-2 postpartum visits. Postpartum doula: newborn care, breastfeeding support, light housekeeping, meal prep, sibling adjustment help. Rates vary significantly by location and experience.`, priority: "high", category: "Included" },
        { title: "Cost Savings & Insurance", description: "Studies show doula support: reduces C-section rate by 25-50%, shortens labor by 25%, reduces epidural use by 31%, reduces oxytocin use by 40%. Some insurance plans cover doula services. Check with your insurer. HSA/FSA may be used for doula fees. Community doula programs offer reduced rates. Some doulas offer payment plans.", priority: "high", category: "Value" },
        { title: "Choosing a Doula", description: "Interview 2-3 doulas. Ask: training/certification (DONA, CAPPA, DTI), number of births attended, backup doula plan, philosophy on interventions, availability around due date, what's included in fee, references from recent clients. Meet in person to assess chemistry.", priority: "medium", category: "Selection" }
      ],
      detailedBreakdown: { "Base Range": `$${base.low}-$${base.high}`, "Service Multiplier": `×${serviceMultiplier}`, "Experience": `×${expMultiplier}`, "Extras": `+$${extrasAdd}`, "Final Range": `$${lowEst}-$${highEst}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="doula-cost" title="Doula Cost Estimator"
      description="Estimate doula costs by location, service type, and experience level. Budget planning for birth and postpartum doula support."
      icon={Heart} calculate={calculate} onClear={() => { setLocation("suburban"); setServiceType("birth"); setExperience("intermediate"); setExtras("none"); setResult(null) }}
      values={[location, serviceType, experience, extras]} result={result}
      seoContent={<SeoContentGenerator title="Doula Cost Estimator" description="Estimate doula costs by location and service type." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Location Type" val={location} set={setLocation} options={[{ value: "urban", label: "Urban / City" }, { value: "suburban", label: "Suburban" }, { value: "rural", label: "Rural" }]} />
          <SelectInput label="Service Type" val={serviceType} set={setServiceType} options={[{ value: "birth", label: "Birth Doula" }, { value: "postpartum", label: "Postpartum Doula" }, { value: "both", label: "Birth + Postpartum" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Experience Level" val={experience} set={setExperience} options={[{ value: "new", label: "Newly Certified" }, { value: "intermediate", label: "3-5 Years" }, { value: "senior", label: "Senior (5+ Years)" }]} />
          <SelectInput label="Extras" val={extras} set={setExtras} options={[{ value: "none", label: "None" }, { value: "photography", label: "Birth Photography (+$500)" }, { value: "placenta", label: "Placenta Encapsulation (+$300)" }, { value: "lactation", label: "Lactation Consulting (+$400)" }]} />
        </div>
      </div>} />
  )
}

// ─── 43. Midwife Cost Estimator ───────────────────────────────────────────────
export function MidwifeCostEstimator() {
  const [birthSetting, setBirthSetting] = useState("hospital")
  const [location, setLocation] = useState("suburban")
  const [insurance, setInsurance] = useState("yes")
  const [complications, setComplications] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const settingCosts: Record<string, { total: number; outOfPocket: number; uninsured: number }> = {
      hospital: { total: 6000, outOfPocket: 1500, uninsured: 6000 },
      birthCenter: { total: 5000, outOfPocket: 1200, uninsured: 5000 },
      home: { total: 4000, outOfPocket: 3000, uninsured: 4000 }
    }

    const locationMultiplier = location === "urban" ? 1.3 : location === "suburban" ? 1.0 : 0.8
    const base = settingCosts[birthSetting]
    const compAdd = complications === "none" ? 0 : complications === "minor" ? 1500 : 5000

    const totalCost = r0(base.total * locationMultiplier + compAdd)
    const outOfPocket = insurance === "yes" ? r0(base.outOfPocket * locationMultiplier) : totalCost
    const savings = insurance === "yes" ? totalCost - outOfPocket : 0

    const includesService = birthSetting === "hospital"
      ? "Prenatal care (10-15 visits), labor & delivery, hospital facility fee, postnatal visit"
      : birthSetting === "birthCenter"
      ? "Prenatal care (10-15 visits), labor & delivery at center, postnatal visit, water birth option"
      : "Prenatal care (10-15 visits), labor & delivery at home, birth pool rental, postnatal visits (2-3)"

    setResult({
      primaryMetric: { label: "Estimated Out-of-Pocket", value: `$${outOfPocket}`, status: "good", description: `Total: $${totalCost} — ${birthSetting === "hospital" ? "Hospital" : birthSetting === "birthCenter" ? "Birth Center" : "Home Birth"} with ${insurance === "yes" ? "insurance" : "no insurance"}` },
      healthScore: 75,
      metrics: [
        { label: "Total Midwife Cost", value: `$${totalCost}`, status: "normal" },
        { label: "Out-of-Pocket", value: `$${outOfPocket}`, status: "good" },
        { label: "Insurance Savings", value: insurance === "yes" ? `$${savings}` : "N/A", status: insurance === "yes" ? "good" : "normal" },
        { label: "Birth Setting", value: birthSetting === "hospital" ? "Hospital CNM" : birthSetting === "birthCenter" ? "Freestanding Birth Center" : "Home Birth CPM/CNM", status: "normal" },
        { label: "Location Factor", value: `×${locationMultiplier}`, status: "normal" },
        { label: "Complications Add-on", value: compAdd > 0 ? `+$${compAdd}` : "None expected", status: compAdd > 0 ? "warning" : "good" },
        { label: "Services Included", value: includesService, status: "normal" }
      ],
      recommendations: [
        { title: "Midwife Cost Breakdown", description: `${birthSetting === "hospital" ? "Hospital CNM (Certified Nurse-Midwife): ~$2,000-$6,000 for prenatal + delivery. Hospital facility fee additional $3,000-$10,000. Most insurance covers hospital CNMs similarly to OBs." : birthSetting === "birthCenter" ? "Birth Center: $3,000-$6,000 all-inclusive (prenatal + birth + postnatal). Often 30-50% less than hospital birth. Insurance coverage varies — verify in-network status." : "Home Birth: $3,000-$6,000 total. Insurance coverage limited — some states mandate coverage, others don't. Includes prenatal care, birth supplies, postpartum visits. May not cover hospital transfer costs."}`, priority: "high", category: "Costs" },
        { title: "CNM vs CPM vs CM", description: "CNM (Certified Nurse-Midwife): Masters-level nurse, can practice in all settings. Covered by most insurance. CPM (Certified Professional Midwife): Trained specifically for out-of-hospital birth. Insurance coverage varies by state. CM (Certified Midwife): Masters-level, same scope as CNM but without nursing degree. Licensed in fewer states.", priority: "medium", category: "Types" },
        { title: "Financial Planning", description: `Estimated cost: $${outOfPocket} out-of-pocket. Tips: Check insurance coverage/in-network midwives. Ask about payment plans. Compare with OB costs ($2,000-$5,000 + facility). Use HSA/FSA funds. Consider supplemental birth insurance. Home birth may qualify for tax deduction as medical expense.`, priority: "medium", category: "Budget" }
      ],
      detailedBreakdown: { "Setting": birthSetting, "Base Total": `$${base.total}`, "Location": `×${locationMultiplier}`, "Complications": `+$${compAdd}`, "Total": `$${totalCost}`, "Insurance": insurance, "Out-of-Pocket": `$${outOfPocket}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="midwife-cost" title="Midwife Cost Estimator"
      description="Estimate midwife costs by birth setting, location, and insurance status. Compare hospital CNM, birth center, and home birth costs."
      icon={Heart} calculate={calculate} onClear={() => { setBirthSetting("hospital"); setLocation("suburban"); setInsurance("yes"); setComplications("none"); setResult(null) }}
      values={[birthSetting, location, insurance, complications]} result={result}
      seoContent={<SeoContentGenerator title="Midwife Cost Estimator" description="Estimate midwife delivery costs by birth setting and insurance." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Birth Setting" val={birthSetting} set={setBirthSetting} options={[{ value: "hospital", label: "Hospital (CNM)" }, { value: "birthCenter", label: "Freestanding Birth Center" }, { value: "home", label: "Home Birth" }]} />
          <SelectInput label="Location" val={location} set={setLocation} options={[{ value: "urban", label: "Urban / City" }, { value: "suburban", label: "Suburban" }, { value: "rural", label: "Rural" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Health Insurance" val={insurance} set={setInsurance} options={[{ value: "yes", label: "Yes — Insured" }, { value: "no", label: "No — Uninsured" }]} />
          <SelectInput label="Expected Complications" val={complications} set={setComplications} options={[{ value: "none", label: "None (Low Risk)" }, { value: "minor", label: "Minor (GDM, Mild Pre-E)" }, { value: "major", label: "Major (C-section transfer)" }]} />
        </div>
      </div>} />
  )
}

// ─── 44. Hospital Bag Checklist ───────────────────────────────────────────────
export function HospitalBagChecklist() {
  const [deliveryType, setDeliveryType] = useState("vaginal")
  const [stayDuration, setStayDuration] = useState(2)
  const [season, setSeason] = useState("summer")
  const [gestWeeks, setGestWeeks] = useState(36)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const gw = clamp(gestWeeks, 28, 42)
    const stay = clamp(stayDuration, 1, 7)
    const isCSection = deliveryType === "csection"

    const essentials = [
      "Photo ID & insurance card",
      "Birth plan (3 copies)",
      "Phone charger (long cord)",
      "Comfortable robe/gown",
      `${stay + 1} changes of underwear (high-waist for C-section)`,
      "Nursing bras (2-3)",
      "Toiletries (shampoo, toothbrush, lip balm)",
      "Hair ties / headband",
      "Slippers & non-slip socks",
      "Going-home outfit (loose, comfortable)"
    ]

    const forBaby = [
      "Car seat (installed & inspected)",
      `${stay + 1} onesies / sleepers`,
      `${Math.ceil(stay * 8)} newborn diapers`,
      "Swaddle blankets (2-3)",
      "Receiving blanket",
      "Mittens (scratch prevention)",
      `Going-home outfit (${season === "winter" ? "warm layers + bunting" : "weather-appropriate"})`,
      "Newborn hat"
    ]

    const forPartner = [
      "Change of clothes",
      "Snacks & water bottle",
      "Phone & charger",
      "Pillow & blanket",
      "Cash (for vending/parking)"
    ]

    const cSectionExtras = isCSection ? [
      "High-waist underwear (above incision)",
      "Abdominal binder",
      "Stool softener",
      "Loose, front-opening pajamas",
      "Extra-long phone charger (bed-bound initially)"
    ] : []

    const seasonExtras = season === "winter" ? ["Warm blanket for car ride", "Baby bunting/snowsuit", "Warm socks"] : season === "monsoon" ? ["Umbrella", "Extra plastic bag for wet items"] : []

    const totalItems = essentials.length + forBaby.length + forPartner.length + cSectionExtras.length + seasonExtras.length
    const readyByWeek = 36

    const urgency = gw >= readyByWeek ? "Pack NOW — you're at or past 36 weeks!" : gw >= 34 ? "Pack soon — 2 weeks until recommended readiness" : "Time to start planning — aim to finish by week 36"

    setResult({
      primaryMetric: { label: "Hospital Bag Checklist", value: `${totalItems} items`, status: gw >= 36 ? "warning" : "good", description: `${urgency}` },
      healthScore: gw >= 36 ? 90 : gw >= 34 ? 70 : 50,
      metrics: [
        { label: "Total Items Needed", value: totalItems, status: "normal" },
        { label: "For Mom", value: `${essentials.length + cSectionExtras.length} items`, status: "normal" },
        { label: "For Baby", value: `${forBaby.length} items`, status: "normal" },
        { label: "For Partner", value: `${forPartner.length} items`, status: "normal" },
        { label: "Season Extras", value: seasonExtras.length > 0 ? `${seasonExtras.length} items` : "None", status: "normal" },
        { label: "Expected Stay", value: stay, unit: isCSection ? "days (C-section)" : "days (vaginal)", status: "normal" },
        { label: "Gestational Age", value: gw, unit: "weeks", status: gw >= 36 ? "warning" : "normal" },
        { label: "Pack By", value: "Week 36", status: gw >= 36 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Mom's Essentials", description: essentials.join(" • "), priority: "high", category: "Mom" },
        { title: "Baby Items", description: forBaby.join(" • "), priority: "high", category: "Baby" },
        { title: "Partner & Extras", description: [...forPartner, ...cSectionExtras, ...seasonExtras].join(" • "), priority: "medium", category: "Partner" },
        { title: "Pro Tips", description: `Pack bag by 36 weeks. Keep car seat in car from 37 weeks. ${isCSection ? "C-section tip: Pack button-front or zip pajamas for easy nursing access. Abdominal binder reduces incision pain significantly." : "Vaginal delivery tip: Pack a perineal spray bottle (peri bottle) — hospitals provide but yours will be better quality."} Bring snacks (granola bars, trail mix). Download hospital's Wi-Fi info. Bring entertainment for early labor.`, priority: "medium", category: "Tips" }
      ],
      detailedBreakdown: { "Mom Items": essentials.length, "Baby Items": forBaby.length, "Partner Items": forPartner.length, "C-Section Extras": cSectionExtras.length, "Season Extras": seasonExtras.length, "Total": totalItems }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hospital-bag" title="Hospital Bag Checklist Generator"
      description="Generate a personalized hospital bag checklist based on delivery type, stay duration, and season. Trimester-based packing reminders."
      icon={CheckCircle} calculate={calculate} onClear={() => { setDeliveryType("vaginal"); setStayDuration(2); setSeason("summer"); setGestWeeks(36); setResult(null) }}
      values={[deliveryType, stayDuration, season, gestWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Hospital Bag Checklist" description="Generate personalized hospital bag packing checklist for labor and delivery." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Delivery Type" val={deliveryType} set={setDeliveryType} options={[{ value: "vaginal", label: "Vaginal Delivery" }, { value: "csection", label: "Planned C-Section" }]} />
          <NumInput label="Expected Stay" val={stayDuration} set={setStayDuration} min={1} max={7} suffix="days" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Season" val={season} set={setSeason} options={[{ value: "summer", label: "Summer" }, { value: "winter", label: "Winter" }, { value: "spring", label: "Spring" }, { value: "monsoon", label: "Monsoon/Rainy" }]} />
          <NumInput label="Current Gestational Age" val={gestWeeks} set={setGestWeeks} min={28} max={42} suffix="weeks" />
        </div>
      </div>} />
  )
}

// ─── 45. Baby Name Numerology Calculator ──────────────────────────────────────
export function BabyNameNumerology() {
  const [babyName, setBabyName] = useState("")
  const [birthDateStr, setBirthDateStr] = useState("")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    if (!babyName.trim()) return
    const name = babyName.trim().toUpperCase()

    const letterValues: Record<string, number> = {
      A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
      J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
      S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
    }

    const vowels = "AEIOU"

    const reduceToSingle = (n: number): number => {
      if (n === 11 || n === 22 || n === 33) return n
      while (n > 9) n = String(n).split("").reduce((s, d) => s + Number(d), 0)
      return n
    }

    let expressionSum = 0, soulSum = 0, personalitySum = 0
    for (const ch of name) {
      const val = letterValues[ch]
      if (val) {
        expressionSum += val
        if (vowels.includes(ch)) soulSum += val
        else personalitySum += val
      }
    }

    const expressionNumber = reduceToSingle(expressionSum)
    const soulNumber = reduceToSingle(soulSum)
    const personalityNumber = reduceToSingle(personalitySum)

    let lifePathNumber = 0
    if (birthDateStr) {
      const bd = new Date(birthDateStr)
      const digits = `${bd.getFullYear()}${String(bd.getMonth() + 1).padStart(2, "0")}${String(bd.getDate()).padStart(2, "0")}`
      lifePathNumber = reduceToSingle(digits.split("").reduce((s, d) => s + Number(d), 0))
    }

    const traits: Record<number, { keyword: string; traits: string }> = {
      1: { keyword: "Leader", traits: "Independent, ambitious, pioneering, self-reliant. Natural leader with strong willpower." },
      2: { keyword: "Peacemaker", traits: "Diplomatic, cooperative, sensitive, intuitive. Excellent mediator and team player." },
      3: { keyword: "Creative", traits: "Expressive, artistic, joyful, communicative. Natural entertainer with imagination." },
      4: { keyword: "Builder", traits: "Practical, disciplined, organized, dependable. Strong work ethic and stability." },
      5: { keyword: "Adventurer", traits: "Dynamic, versatile, freedom-loving, curious. Embraces change and new experiences." },
      6: { keyword: "Nurturer", traits: "Caring, responsible, harmonious, protective. Natural caregiver and community-oriented." },
      7: { keyword: "Seeker", traits: "Analytical, spiritual, introspective, wise. Deep thinker with quest for knowledge." },
      8: { keyword: "Achiever", traits: "Ambitious, authoritative, successful, material mastery. Natural business acumen." },
      9: { keyword: "Humanitarian", traits: "Compassionate, generous, idealistic, global awareness. Selfless service-oriented." },
      11: { keyword: "Master Intuitive", traits: "Visionary, inspired, intuitive, spiritual teacher. Higher vibration of 2." },
      22: { keyword: "Master Builder", traits: "Powerful manifester, large-scale vision, practical idealism. Higher vibration of 4." },
      33: { keyword: "Master Teacher", traits: "Selfless service, cosmic consciousness, master healer. Higher vibration of 6." }
    }

    const expTrait = traits[expressionNumber] || traits[expressionNumber % 9 || 9]
    const soulTrait = traits[soulNumber] || traits[soulNumber % 9 || 9]
    const persTrait = traits[personalityNumber] || traits[personalityNumber % 9 || 9]

    const compatibility = lifePathNumber > 0 ? Math.abs(expressionNumber - lifePathNumber) <= 2 || expressionNumber === lifePathNumber ? "Excellent harmony between name and birth date" : "Moderate harmony — name and birth numbers differ notably" : "Enter birth date for compatibility"

    setResult({
      primaryMetric: { label: "Expression Number", value: expressionNumber, status: "good", description: `"${babyName}" → ${expTrait.keyword} — ${expTrait.traits.split(".")[0]}` },
      healthScore: 75,
      metrics: [
        { label: "Expression Number (Full Name)", value: expressionNumber, status: "good" },
        { label: "Expression Keyword", value: expTrait.keyword, status: "normal" },
        { label: "Soul Urge Number (Vowels)", value: soulNumber, status: "good" },
        { label: "Soul Keyword", value: soulTrait.keyword, status: "normal" },
        { label: "Personality Number (Consonants)", value: personalityNumber, status: "good" },
        { label: "Personality Keyword", value: persTrait.keyword, status: "normal" },
        ...(lifePathNumber > 0 ? [
          { label: "Life Path Number (DOB)", value: lifePathNumber, status: "good" as const },
          { label: "Name-DOB Compatibility", value: compatibility, status: "normal" as const }
        ] : []),
        { label: "Name Letters", value: name.replace(/[^A-Z]/g, "").length, status: "normal" },
        { label: "Name Sum (raw)", value: expressionSum, status: "normal" }
      ],
      recommendations: [
        { title: "Expression Number Analysis", description: `Expression ${expressionNumber} (${expTrait.keyword}): ${expTrait.traits} This number represents the natural talents and abilities the name carries. It influences how others perceive and interact with the child.`, priority: "high", category: "Expression" },
        { title: "Soul Urge & Personality", description: `Soul Urge ${soulNumber} (${soulTrait.keyword}): Inner desires and motivations — ${soulTrait.traits.split(".")[0]}. Personality ${personalityNumber} (${persTrait.keyword}): Outer expression and first impressions — ${persTrait.traits.split(".")[0]}.`, priority: "medium", category: "Inner/Outer" },
        { title: "Numerology Note", description: "Numerology is a belief system assigning meaning to numbers derived from names and dates. It is not scientifically validated but has been part of many cultural and spiritual traditions for millennia. Use this as a fun, cultural exploration tool — the most important factor in naming is personal meaning and family significance.", priority: "low", category: "Disclaimer" }
      ],
      detailedBreakdown: {
        "Name": babyName,
        "Expression Sum": `${expressionSum} → ${expressionNumber}`,
        "Soul (Vowels)": `${soulSum} → ${soulNumber}`,
        "Personality (Consonants)": `${personalitySum} → ${personalityNumber}`,
        ...(lifePathNumber > 0 ? { "Life Path": lifePathNumber } : {}),
        "Compatibility": compatibility
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-name-numerology" title="Baby Name Numerology Calculator"
      description="Calculate numerology numbers for baby names — Expression, Soul Urge, and Personality numbers with personality trait mapping."
      icon={Baby} calculate={calculate} onClear={() => { setBabyName(""); setBirthDateStr(""); setResult(null) }}
      values={[babyName, birthDateStr]} result={result}
      seoContent={<SeoContentGenerator title="Baby Name Numerology Calculator" description="Calculate numerology numbers and personality traits for baby names." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-medium">Baby Name</label>
          <input type="text" value={babyName} onChange={e => setBabyName(e.target.value)} placeholder="Enter full name"
            className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
        </div>
        <DateInput label="Birth Date (optional — for Life Path)" val={birthDateStr} set={setBirthDateStr} />
      </div>} />
  )
}
