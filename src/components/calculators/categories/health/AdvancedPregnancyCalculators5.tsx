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

// ─── 46. Chinese Gender Predictor ─────────────────────────────────────────────
export function ChineseGenderPredictor() {
  const [motherAge, setMotherAge] = useState(28)
  const [conceptionMonth, setConceptionMonth] = useState("1")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const age = clamp(motherAge, 18, 45)
    const lunarAge = age + 1
    const month = parseInt(conceptionMonth)

    // Traditional Chinese gender chart logic (ancient lunar calendar matrix)
    const chart: Record<number, number[]> = {
      18: [2,1,2,1,1,1,1,1,1,1,1,1],
      19: [1,2,1,2,2,1,1,1,1,2,1,2],
      20: [2,1,2,1,1,1,1,1,1,2,2,2],
      21: [1,2,2,2,2,2,2,2,2,2,2,2],
      22: [2,1,1,2,1,2,2,1,2,2,2,2],
      23: [1,1,2,1,1,2,1,2,1,1,2,1],
      24: [1,2,1,2,2,1,2,1,2,2,2,2],
      25: [2,1,2,1,2,1,2,1,2,1,1,1],
      26: [1,2,1,2,1,2,1,2,2,2,2,2],
      27: [2,1,2,1,2,2,1,1,1,1,2,1],
      28: [1,2,1,2,2,2,1,2,1,1,2,2],
      29: [2,1,2,2,1,1,2,1,1,2,2,2],
      30: [1,2,2,2,2,2,2,2,2,2,1,1],
      31: [1,2,1,2,2,2,2,2,2,2,2,2],
      32: [1,2,2,2,1,2,2,1,2,2,2,1],
      33: [2,1,2,1,2,2,1,2,1,2,1,2],
      34: [1,2,1,2,2,1,2,1,2,1,2,1],
      35: [1,2,1,2,1,2,1,2,2,2,1,2],
      36: [2,1,2,1,1,2,1,2,1,2,2,1],
      37: [1,2,2,1,2,1,2,1,2,2,1,2],
      38: [2,1,2,2,1,2,1,2,2,1,2,1],
      39: [1,2,1,2,2,1,2,1,2,1,2,1],
      40: [2,1,2,1,2,1,2,1,2,1,2,2],
      41: [1,2,1,2,1,2,1,2,2,1,1,2],
      42: [2,1,2,1,1,2,1,2,1,2,2,1],
      43: [1,2,2,1,2,1,2,2,1,2,1,2],
      44: [2,1,2,2,1,2,1,1,2,1,2,1],
      45: [1,2,1,2,2,1,2,1,2,2,1,2],
    }

    const row = chart[clamp(lunarAge, 18, 45)]
    const prediction = row ? (row[month - 1] === 1 ? "Boy" : "Girl") : "Boy"

    const confidence = 50 // This is a traditional folklore method with ~50% accuracy
    const status = prediction === "Boy" ? "normal" as const : "good" as const

    setResult({
      primaryMetric: { label: "Predicted Gender", value: prediction, status, description: `Based on Chinese Lunar Calendar — Mother's lunar age: ${lunarAge}, Conception month: ${month}` },
      healthScore: confidence,
      metrics: [
        { label: "Prediction", value: prediction, status },
        { label: "Mother's Age (Western)", value: age, unit: "years", status: "normal" },
        { label: "Mother's Lunar Age", value: lunarAge, unit: "years", status: "normal" },
        { label: "Conception Month", value: new Date(0, month - 1).toLocaleString("en", { month: "long" }), status: "normal" },
        { label: "Scientific Accuracy", value: "~50%", status: "warning" },
        { label: "Method", value: "Chinese Lunar Calendar", status: "normal" }
      ],
      recommendations: [
        { title: "About This Method", description: "The Chinese Gender Prediction Chart is an ancient method said to be over 700 years old, discovered in a royal tomb near Beijing. It uses the mother's lunar age at conception and the lunar month of conception to predict the baby's gender.", priority: "high", category: "Background" },
        { title: "Scientific Accuracy", description: "Studies show the Chinese Gender Chart has approximately 50% accuracy — the same as random chance. A 1999 study in AJOG analyzing 2.8 million Swedish births found no predictive value. This is for entertainment only.", priority: "high", category: "Accuracy" },
        { title: "Reliable Gender Determination", description: "For accurate gender determination, consider: NIPT blood test (99% accurate, available from week 10), ultrasound anatomy scan (97-99% accurate, weeks 18-22), CVS (weeks 10-13), or amniocentesis (weeks 15-20). Consult your healthcare provider.", priority: "medium", category: "Medical" }
      ],
      detailedBreakdown: { "Mother's Age": age, "Lunar Age": lunarAge, "Conception Month": month, "Chart Value": row ? row[month - 1] : "N/A", "Prediction": prediction }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="chinese-gender" title="Chinese Gender Predictor"
      description="Predict baby's gender using the ancient Chinese Lunar Calendar method. Enter mother's age and conception month for a traditional gender prediction."
      icon={Baby} calculate={calculate} onClear={() => { setMotherAge(28); setConceptionMonth("1"); setResult(null) }}
      values={[motherAge, conceptionMonth]} result={result}
      seoContent={<SeoContentGenerator title="Chinese Gender Predictor" description="Predict baby gender using Chinese Lunar Calendar." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Mother's Age at Conception" val={motherAge} set={setMotherAge} min={18} max={45} suffix="years" />
        <SelectInput label="Conception Month" val={conceptionMonth} set={setConceptionMonth} options={[
          { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
          { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
          { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
          { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" }
        ]} />
      </div>} />
  )
}

// ─── 47. Mayan Gender Predictor ───────────────────────────────────────────────
export function MayanGenderPredictor() {
  const [motherAge, setMotherAge] = useState(28)
  const [conceptionMonth, setConceptionMonth] = useState("3")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const age = clamp(motherAge, 15, 50)
    const month = parseInt(conceptionMonth)

    // Mayan method: if mother's age and conception month are both even or both odd → girl, otherwise → boy
    const ageEven = age % 2 === 0
    const monthEven = month % 2 === 0
    const prediction = (ageEven === monthEven) ? "Girl" : "Boy"

    const status = prediction === "Boy" ? "normal" as const : "good" as const

    setResult({
      primaryMetric: { label: "Predicted Gender", value: prediction, status, description: `Mayan method — Age (${age}) is ${ageEven ? "even" : "odd"}, Month (${month}) is ${monthEven ? "even" : "odd"}` },
      healthScore: 50,
      metrics: [
        { label: "Prediction", value: prediction, status },
        { label: "Mother's Age", value: age, unit: "years", status: "normal" },
        { label: "Age Parity", value: ageEven ? "Even" : "Odd", status: "normal" },
        { label: "Conception Month", value: new Date(0, month - 1).toLocaleString("en", { month: "long" }), status: "normal" },
        { label: "Month Parity", value: monthEven ? "Even" : "Odd", status: "normal" },
        { label: "Match", value: ageEven === monthEven ? "Both same parity → Girl" : "Different parity → Boy", status: "normal" },
        { label: "Scientific Accuracy", value: "~50%", status: "warning" }
      ],
      recommendations: [
        { title: "Mayan Gender Method", description: "The Mayan Gender Predictor is based on ancient Mayan numerology. The rule is simple: if both the mother's age and the conception month number are even or both are odd, the prediction is a girl. If one is even and the other is odd, the prediction is a boy.", priority: "high", category: "Method" },
        { title: "Accuracy Note", description: "Like all traditional gender prediction methods, the Mayan method has approximately 50% accuracy — equivalent to a coin flip. No folklore-based method has been scientifically proven to predict gender. This is for entertainment purposes only.", priority: "high", category: "Accuracy" },
        { title: "Medical Gender Tests", description: "For reliable results: NIPT (Non-Invasive Prenatal Testing) from week 10 (99%+ accuracy), anatomy ultrasound at 18-22 weeks (97-99%), or cell-free fetal DNA blood test. These are scientifically validated methods.", priority: "medium", category: "Medical" }
      ],
      detailedBreakdown: { "Age": age, "Age Parity": ageEven ? "Even" : "Odd", "Month": month, "Month Parity": monthEven ? "Even" : "Odd", "Logic": ageEven === monthEven ? "Same → Girl" : "Different → Boy", "Prediction": prediction }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="mayan-gender" title="Mayan Gender Predictor"
      description="Predict baby's gender using the ancient Mayan parity method. Based on the even/odd pattern of mother's age and conception month."
      icon={Baby} calculate={calculate} onClear={() => { setMotherAge(28); setConceptionMonth("3"); setResult(null) }}
      values={[motherAge, conceptionMonth]} result={result}
      seoContent={<SeoContentGenerator title="Mayan Gender Predictor" description="Predict baby gender using ancient Mayan parity method." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Mother's Age at Conception" val={motherAge} set={setMotherAge} min={15} max={50} suffix="years" />
        <SelectInput label="Conception Month" val={conceptionMonth} set={setConceptionMonth} options={[
          { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
          { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
          { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
          { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" }
        ]} />
      </div>} />
  )
}

// ─── 48. Ramzi Theory Predictor ───────────────────────────────────────────────
export function RamziTheoryPredictor() {
  const [placentaSide, setPlacentaSide] = useState("right")
  const [ultrasoundWeek, setUltrasoundWeek] = useState(6)
  const [ultrasoundType, setUltrasoundType] = useState("transvaginal")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const week = clamp(ultrasoundWeek, 5, 14)

    // Ramzi theory: right placenta = boy, left = girl
    // Note: transvaginal images are NOT mirrored; transabdominal images may be mirrored
    let effectiveSide = placentaSide
    if (ultrasoundType === "transabdominal") {
      // Some sources say transabdominal images are mirrored
      effectiveSide = placentaSide === "right" ? "left" : placentaSide === "left" ? "right" : placentaSide
    }

    const prediction = effectiveSide === "right" ? "Boy" : effectiveSide === "left" ? "Girl" : "Inconclusive"
    const earlyEnough = week <= 8
    const confidence = earlyEnough ? 55 : 50
    const status = prediction === "Boy" ? "normal" as const : prediction === "Girl" ? "good" as const : "warning" as const

    setResult({
      primaryMetric: { label: "Predicted Gender", value: prediction, status, description: `Ramzi Theory — Placenta on ${effectiveSide} side at ${week} weeks (${ultrasoundType})` },
      healthScore: confidence,
      metrics: [
        { label: "Prediction", value: prediction, status },
        { label: "Placenta Side (reported)", value: placentaSide === "right" ? "Right" : placentaSide === "left" ? "Left" : "Central", status: "normal" },
        { label: "Effective Side (adjusted)", value: effectiveSide === "right" ? "Right" : effectiveSide === "left" ? "Left" : "Central", status: "normal" },
        { label: "Ultrasound Type", value: ultrasoundType === "transvaginal" ? "Transvaginal" : "Transabdominal", status: "normal" },
        { label: "Ultrasound Week", value: week, unit: "weeks", status: week <= 8 ? "good" : "warning" },
        { label: "Optimal Timing", value: week <= 8 ? "Yes (6-8 weeks ideal)" : "Late — best before 8 weeks", status: week <= 8 ? "good" : "warning" },
        { label: "Estimated Accuracy", value: `~${confidence}%`, status: "warning" }
      ],
      recommendations: [
        { title: "Ramzi Theory Explained", description: `Dr. Saad Ramzi Ismail's (2011) theory states that placental/chorionic villi location in early ultrasound correlates with fetal sex: right-sided = male, left-sided = female. The original study claimed 97.2% accuracy, but this has NOT been replicated in peer-reviewed research.`, priority: "high", category: "Theory" },
        { title: "Image Mirroring", description: `${ultrasoundType === "transabdominal" ? "Transabdominal images may be laterally mirrored — right on the image may actually be left anatomically. We adjusted the side for this. Confirm with your sonographer." : "Transvaginal images are generally not mirrored. The side you see on the image should correspond to the anatomical side."}`, priority: "high", category: "Technical" },
        { title: "Scientific Consensus", description: "Subsequent studies (2010-2020) have failed to replicate Ramzi's findings. A 2020 systematic review found no significant correlation between placental laterality and fetal sex. The original paper's methodology has been questioned. For fun only.", priority: "medium", category: "Evidence" }
      ],
      detailedBreakdown: { "Placenta Side": placentaSide, "Ultrasound Type": ultrasoundType, "Mirroring Applied": ultrasoundType === "transabdominal" ? "Yes" : "No", "Effective Side": effectiveSide, "Week": week, "Prediction": prediction }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ramzi-theory" title="Ramzi Theory Gender Predictor"
      description="Predict baby's gender using Ramzi Theory based on placental location in early ultrasound. Includes image mirroring correction."
      icon={Baby} calculate={calculate} onClear={() => { setPlacentaSide("right"); setUltrasoundWeek(6); setUltrasoundType("transvaginal"); setResult(null) }}
      values={[placentaSide, ultrasoundWeek, ultrasoundType]} result={result}
      seoContent={<SeoContentGenerator title="Ramzi Theory Predictor" description="Predict gender using Ramzi theory placental location." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Placenta/Chorionic Villi Side" val={placentaSide} set={setPlacentaSide} options={[
          { value: "right", label: "Right Side" }, { value: "left", label: "Left Side" }, { value: "central", label: "Central/Unclear" }
        ]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Ultrasound Week" val={ultrasoundWeek} set={setUltrasoundWeek} min={5} max={14} suffix="weeks" />
          <SelectInput label="Ultrasound Type" val={ultrasoundType} set={setUltrasoundType} options={[
            { value: "transvaginal", label: "Transvaginal" }, { value: "transabdominal", label: "Transabdominal" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 49. Nub Theory Predictor ─────────────────────────────────────────────────
export function NubTheoryPredictor() {
  const [nubAngle, setNubAngle] = useState(30)
  const [ultrasoundWeek, setUltrasoundWeek] = useState(12)
  const [nubShape, setNubShape] = useState("pointed")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const angle = clamp(nubAngle, 0, 90)
    const week = clamp(ultrasoundWeek, 11, 14)

    // Nub theory: angle > 30° from spine = boy, < 10° or parallel = girl
    let prediction: string
    let confidence: number
    if (angle > 30) {
      prediction = "Boy"
      confidence = week >= 12 ? 70 : 55
    } else if (angle < 10) {
      prediction = "Girl"
      confidence = week >= 12 ? 70 : 55
    } else {
      prediction = "Inconclusive"
      confidence = 50
    }

    // Nub shape also considered
    if (nubShape === "forked" || nubShape === "stacked") {
      if (prediction === "Inconclusive") prediction = "Likely Boy"
      confidence = Math.min(confidence + 5, 75)
    } else if (nubShape === "flat" || nubShape === "rounded") {
      if (prediction === "Inconclusive") prediction = "Likely Girl"
      confidence = Math.min(confidence + 5, 75)
    }

    const status = prediction.includes("Boy") ? "normal" as const : prediction.includes("Girl") ? "good" as const : "warning" as const

    setResult({
      primaryMetric: { label: "Predicted Gender", value: prediction, status, description: `Nub angle: ${angle}° at ${week} weeks — ${nubShape} shape` },
      healthScore: confidence,
      metrics: [
        { label: "Prediction", value: prediction, status },
        { label: "Nub Angle", value: angle, unit: "degrees", status: angle > 30 ? "normal" : angle < 10 ? "good" : "warning" },
        { label: "Nub Shape", value: nubShape.charAt(0).toUpperCase() + nubShape.slice(1), status: "normal" },
        { label: "Gestational Week", value: week, unit: "weeks", status: week >= 12 ? "good" : "warning" },
        { label: "Estimated Confidence", value: `${confidence}%`, status: confidence >= 65 ? "good" : "warning" },
        { label: "Angle Category", value: angle > 30 ? ">30° (Male indicator)" : angle < 10 ? "<10° (Female indicator)" : "10-30° (Ambiguous zone)", status: angle > 30 || angle < 10 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Nub Theory Explained", description: `At 11-14 weeks, the genital tubercle (\"nub\") is present in all fetuses. In males, it angles upward (>30° from the spinal line); in females, it remains parallel or points slightly downward (<10°). Nub angle at 12+ weeks: studies report 70-98% accuracy depending on image quality and sonographer skill.`, priority: "high", category: "Theory" },
        { title: "Nub Shape Analysis", description: `Shape can supplement angle: Pointed/forked/stacked nubs suggest male. Flat/rounded/horizontal nubs suggest female. Your nub: ${nubShape}. Combined angle+shape analysis can improve prediction accuracy, especially in ambiguous angle cases (10-30°).`, priority: "high", category: "Shape" },
        { title: "Best Practices", description: "For best nub theory accuracy: use images from 12-13 weeks (earlier images are less reliable). The fetus must be in true sagittal profile. Image quality matters enormously — ask for a clear mid-sagittal view. Even experienced nub theory analysts report ~70-80% accuracy.", priority: "medium", category: "Technique" }
      ],
      detailedBreakdown: { "Nub Angle": `${angle}°`, "Shape": nubShape, "Week": week, "Confidence": `${confidence}%`, "Prediction": prediction }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="nub-theory" title="Nub Theory Gender Predictor"
      description="Predict baby's gender using Nub Theory — analyze the genital tubercle angle and shape from 12-week ultrasound images."
      icon={Baby} calculate={calculate} onClear={() => { setNubAngle(30); setUltrasoundWeek(12); setNubShape("pointed"); setResult(null) }}
      values={[nubAngle, ultrasoundWeek, nubShape]} result={result}
      seoContent={<SeoContentGenerator title="Nub Theory Predictor" description="Predict baby gender using nub theory ultrasound angle." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Nub Angle from Spine" val={nubAngle} set={setNubAngle} min={0} max={90} suffix="degrees" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Ultrasound Week" val={ultrasoundWeek} set={setUltrasoundWeek} min={11} max={14} suffix="weeks" />
          <SelectInput label="Nub Shape" val={nubShape} set={setNubShape} options={[
            { value: "pointed", label: "Pointed/Upward" }, { value: "forked", label: "Forked/Split" },
            { value: "stacked", label: "Stacked" }, { value: "flat", label: "Flat/Horizontal" },
            { value: "rounded", label: "Rounded/Dome" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 50. Skull Theory Predictor ───────────────────────────────────────────────
export function SkullTheoryPredictor() {
  const [foreheadShape, setForeheadShape] = useState("sloped")
  const [jawShape, setJawShape] = useState("rounded")
  const [brow, setBrow] = useState("flat")
  const [overallShape, setOverallShape] = useState("round")
  const [ultrasoundWeek, setUltrasoundWeek] = useState(12)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const week = clamp(ultrasoundWeek, 11, 20)
    let maleScore = 0
    let femaleScore = 0

    // Forehead
    if (foreheadShape === "sloped") maleScore += 2
    else if (foreheadShape === "rounded") femaleScore += 2
    else { maleScore += 1; femaleScore += 1 }

    // Jaw
    if (jawShape === "square") maleScore += 2
    else if (jawShape === "rounded") femaleScore += 2
    else if (jawShape === "pointed") femaleScore += 1
    else { maleScore += 1; femaleScore += 1 }

    // Brow ridge
    if (brow === "prominent") maleScore += 2
    else if (brow === "flat") femaleScore += 2
    else { maleScore += 1; femaleScore += 1 }

    // Overall shape
    if (overallShape === "blockier") maleScore += 2
    else if (overallShape === "round") femaleScore += 2
    else { maleScore += 1; femaleScore += 1 }

    const total = maleScore + femaleScore
    const malePct = r0((maleScore / total) * 100)
    const femalePct = 100 - malePct

    let prediction: string
    if (malePct > 60) prediction = "Boy"
    else if (femalePct > 60) prediction = "Girl"
    else prediction = "Inconclusive"

    const confidence = Math.max(malePct, femalePct)
    const status = prediction === "Boy" ? "normal" as const : prediction === "Girl" ? "good" as const : "warning" as const

    setResult({
      primaryMetric: { label: "Predicted Gender", value: prediction, status, description: `Skull features: ${malePct}% male indicators, ${femalePct}% female indicators` },
      healthScore: confidence,
      metrics: [
        { label: "Prediction", value: prediction, status },
        { label: "Male Indicators", value: malePct, unit: "%", status: malePct > 60 ? "normal" : "warning" },
        { label: "Female Indicators", value: femalePct, unit: "%", status: femalePct > 60 ? "good" : "warning" },
        { label: "Forehead", value: foreheadShape === "sloped" ? "Sloped (♂)" : foreheadShape === "rounded" ? "Rounded (♀)" : "Neutral", status: "normal" },
        { label: "Jaw", value: jawShape === "square" ? "Square (♂)" : jawShape === "rounded" ? "Rounded (♀)" : jawShape === "pointed" ? "Pointed (♀)" : "Neutral", status: "normal" },
        { label: "Brow Ridge", value: brow === "prominent" ? "Prominent (♂)" : brow === "flat" ? "Flat (♀)" : "Moderate", status: "normal" },
        { label: "Overall Shape", value: overallShape === "blockier" ? "Blockier (♂)" : overallShape === "round" ? "Rounded (♀)" : "Average", status: "normal" },
        { label: "Week", value: week, unit: "weeks", status: week >= 12 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Skull Theory Background", description: "Skull Theory claims that male and female skulls have observable differences even in utero: males tend to have a sloped forehead, prominent brow ridge, square jaw, and blockier skull shape. Females tend to have a rounded forehead, flat brow, rounded jaw, and overall rounder skull.", priority: "high", category: "Theory" },
        { title: "Scientific Validity", description: "There is NO peer-reviewed scientific evidence supporting skull theory for prenatal gender prediction. Sexual dimorphism in skull shape primarily develops during puberty under hormonal influence, not in the first trimester. This tool is for entertainment only.", priority: "high", category: "Evidence" },
        { title: "Professional Gender Determination", description: "Accurate fetal sex determination methods: Cell-free DNA (NIPT) from 10 weeks (99%+), anatomy ultrasound 18-22 weeks (97-99%), or invasive testing (CVS/amnio). Skull theory should never replace medical testing.", priority: "medium", category: "Medical" }
      ],
      detailedBreakdown: { "Forehead": foreheadShape, "Jaw": jawShape, "Brow": brow, "Overall Shape": overallShape, "Male Score": maleScore, "Female Score": femaleScore, "Prediction": prediction }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="skull-theory" title="Skull Theory Gender Predictor"
      description="Predict baby's gender using Skull Theory — analyze forehead slope, jaw shape, brow ridge, and overall skull shape from ultrasound."
      icon={Baby} calculate={calculate} onClear={() => { setForeheadShape("sloped"); setJawShape("rounded"); setBrow("flat"); setOverallShape("round"); setUltrasoundWeek(12); setResult(null) }}
      values={[foreheadShape, jawShape, brow, overallShape, ultrasoundWeek]} result={result}
      seoContent={<SeoContentGenerator title="Skull Theory Predictor" description="Predict baby gender using skull theory from ultrasound." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Forehead Shape" val={foreheadShape} set={setForeheadShape} options={[
            { value: "sloped", label: "Sloped/Angular" }, { value: "rounded", label: "Rounded/Curved" }, { value: "neutral", label: "Neutral/Unclear" }
          ]} />
          <SelectInput label="Jaw Shape" val={jawShape} set={setJawShape} options={[
            { value: "square", label: "Square/Angular" }, { value: "rounded", label: "Rounded" }, { value: "pointed", label: "Pointed/V-shape" }, { value: "neutral", label: "Neutral/Unclear" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Brow Ridge" val={brow} set={setBrow} options={[
            { value: "prominent", label: "Prominent/Defined" }, { value: "flat", label: "Flat/Smooth" }, { value: "moderate", label: "Moderate/Unclear" }
          ]} />
          <SelectInput label="Overall Skull Shape" val={overallShape} set={setOverallShape} options={[
            { value: "blockier", label: "Blockier/Square" }, { value: "round", label: "Round/Oval" }, { value: "average", label: "Average/Unclear" }
          ]} />
        </div>
        <NumInput label="Ultrasound Week" val={ultrasoundWeek} set={setUltrasoundWeek} min={11} max={20} suffix="weeks" />
      </div>} />
  )
}

// ─── 51. Baby Blood Type Predictor ────────────────────────────────────────────
export function BabyBloodTypePredictor() {
  const [motherType, setMotherType] = useState("A")
  const [fatherType, setFatherType] = useState("B")
  const [motherRh, setMotherRh] = useState("+")
  const [fatherRh, setFatherRh] = useState("+")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // ABO genetics: each parent has two alleles
    const alleles: Record<string, string[][]> = {
      "A": [["A", "A"], ["A", "O"]],
      "B": [["B", "B"], ["B", "O"]],
      "AB": [["A", "B"]],
      "O": [["O", "O"]]
    }

    const rhAlleles: Record<string, string[][]> = {
      "+": [["+", "+"], ["+", "-"]],
      "-": [["-", "-"]]
    }

    // Calculate all possible outcomes
    const outcomes: Record<string, number> = {}
    let total = 0

    for (const mAllele of alleles[motherType]) {
      for (const fAllele of alleles[fatherType]) {
        for (const m of mAllele) {
          for (const f of fAllele) {
            let bloodType: string
            if ((m === "A" && f === "B") || (m === "B" && f === "A")) bloodType = "AB"
            else if (m === "A" || f === "A") bloodType = "A"
            else if (m === "B" || f === "B") bloodType = "B"
            else bloodType = "O"
            outcomes[bloodType] = (outcomes[bloodType] || 0) + 1
            total++
          }
        }
      }
    }

    // Rh factor
    const rhOutcomes: Record<string, number> = {}
    let rhTotal = 0
    for (const mRh of rhAlleles[motherRh]) {
      for (const fRh of rhAlleles[fatherRh]) {
        for (const m of mRh) {
          for (const f of fRh) {
            const rh = (m === "+" || f === "+") ? "+" : "-"
            rhOutcomes[rh] = (rhOutcomes[rh] || 0) + 1
            rhTotal++
          }
        }
      }
    }

    // Format probabilities
    const aboProbs = Object.entries(outcomes).map(([type, count]) => ({
      type,
      pct: r0((count / total) * 100)
    })).sort((a, b) => b.pct - a.pct)

    const rhProbs = Object.entries(rhOutcomes).map(([rh, count]) => ({
      rh,
      pct: r0((count / rhTotal) * 100)
    })).sort((a, b) => b.pct - a.pct)

    const mostLikelyABO = aboProbs[0]
    const mostLikelyRh = rhProbs[0]
    const mostLikely = `${mostLikelyABO.type}${mostLikelyRh.rh}`

    const rhIncompat = motherRh === "-" && fatherRh === "+"
    const aboIncompat = (motherType === "O" && (fatherType === "A" || fatherType === "B" || fatherType === "AB"))

    setResult({
      primaryMetric: { label: "Most Likely Blood Type", value: mostLikely, status: "good", description: `${mostLikelyABO.pct}% chance of type ${mostLikelyABO.type}, ${mostLikelyRh.pct}% chance of Rh${mostLikelyRh.rh}` },
      healthScore: mostLikelyABO.pct,
      metrics: [
        ...aboProbs.map(p => ({ label: `Chance of Type ${p.type}`, value: p.pct, unit: "%", status: (p.pct > 0 ? "normal" : "warning") as 'normal' | 'warning' })),
        ...rhProbs.map(p => ({ label: `Chance of Rh${p.rh}`, value: p.pct, unit: "%", status: "normal" as const })),
        { label: "Rh Incompatibility Risk", value: rhIncompat ? "Yes — needs monitoring" : "No", status: rhIncompat ? "danger" : "good" },
        { label: "ABO Incompatibility Risk", value: aboIncompat ? "Possible" : "Low", status: aboIncompat ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Blood Type Genetics", description: `Mother: ${motherType}${motherRh} × Father: ${fatherType}${fatherRh}. ABO blood type follows Mendelian genetics with codominance (A and B alleles) and recessive O allele. Each parent contributes one ABO allele and one Rh allele. Possible baby types: ${aboProbs.map(p => `${p.type} (${p.pct}%)`).join(", ")}.`, priority: "high", category: "Genetics" },
        { title: "Rh Factor Considerations", description: rhIncompat ? "IMPORTANT: Mother is Rh− and father is Rh+. Baby may be Rh+, risking hemolytic disease of the newborn (HDN). RhoGAM injection at 28 weeks and within 72 hours of delivery is standard prevention. Discuss with your OB-GYN." : "No Rh incompatibility concerns based on parental blood types.", priority: rhIncompat ? "high" : "low", category: "Rh Factor" },
        { title: "ABO Incompatibility", description: aboIncompat ? `Mother is type O and father is type ${fatherType}. Baby may have A or B antigens, causing mild ABO incompatibility. This is usually less severe than Rh disease but may cause mild neonatal jaundice. Monitoring after delivery is recommended.` : "Low risk of ABO incompatibility based on parental types.", priority: aboIncompat ? "medium" : "low", category: "ABO" }
      ],
      detailedBreakdown: { "Mother": `${motherType}${motherRh}`, "Father": `${fatherType}${fatherRh}`, ...Object.fromEntries(aboProbs.map(p => [`Type ${p.type}`, `${p.pct}%`])), "Rh+": `${rhProbs.find(p => p.rh === "+")?.pct || 0}%`, "Rh−": `${rhProbs.find(p => p.rh === "-")?.pct || 0}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-blood-type" title="Baby Blood Type Predictor"
      description="Predict your baby's possible blood type based on parents' ABO and Rh types. Includes Rh incompatibility risk assessment."
      icon={Heart} calculate={calculate} onClear={() => { setMotherType("A"); setFatherType("B"); setMotherRh("+"); setFatherRh("+"); setResult(null) }}
      values={[motherType, fatherType, motherRh, fatherRh]} result={result}
      seoContent={<SeoContentGenerator title="Baby Blood Type Predictor" description="Predict baby blood type from parents blood types." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Mother's Blood Type" val={motherType} set={setMotherType} options={[
            { value: "A", label: "Type A" }, { value: "B", label: "Type B" }, { value: "AB", label: "Type AB" }, { value: "O", label: "Type O" }
          ]} />
          <SelectInput label="Mother's Rh Factor" val={motherRh} set={setMotherRh} options={[
            { value: "+", label: "Rh Positive (+)" }, { value: "-", label: "Rh Negative (−)" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Father's Blood Type" val={fatherType} set={setFatherType} options={[
            { value: "A", label: "Type A" }, { value: "B", label: "Type B" }, { value: "AB", label: "Type AB" }, { value: "O", label: "Type O" }
          ]} />
          <SelectInput label="Father's Rh Factor" val={fatherRh} set={setFatherRh} options={[
            { value: "+", label: "Rh Positive (+)" }, { value: "-", label: "Rh Negative (−)" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 52. Baby Eye Color Predictor ─────────────────────────────────────────────
export function BabyEyeColorPredictor() {
  const [motherEyes, setMotherEyes] = useState("brown")
  const [fatherEyes, setFatherEyes] = useState("blue")
  const [mGrandparent1, setMGrandparent1] = useState("brown")
  const [mGrandparent2, setMGrandparent2] = useState("blue")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // Simplified polygenic eye color model (OCA2/HERC2 + other genes)
    // Brown > Green > Blue dominance hierarchy
    const colorScore: Record<string, number> = { brown: 3, hazel: 2.5, green: 2, blue: 1, gray: 1 }

    const mScore = colorScore[motherEyes] || 2
    const fScore = colorScore[fatherEyes] || 2
    const mg1Score = colorScore[mGrandparent1] || 2
    const mg2Score = colorScore[mGrandparent2] || 2

    // Weight: parents 40% each, maternal grandparents 10% each
    const avgScore = mScore * 0.4 + fScore * 0.4 + mg1Score * 0.1 + mg2Score * 0.1

    // Calculate probabilities based on genetic dominance
    const probs: Record<string, number> = { brown: 0, hazel: 0, green: 0, blue: 0 }

    if (motherEyes === "brown" && fatherEyes === "brown") {
      probs.brown = 75; probs.hazel = 12; probs.green = 6; probs.blue = 7
      // If a grandparent has blue eyes, increase blue probability
      if (mGrandparent1 === "blue" || mGrandparent2 === "blue") {
        probs.brown = 56; probs.hazel = 12; probs.green = 7; probs.blue = 25
      }
    } else if (motherEyes === "blue" && fatherEyes === "blue") {
      probs.brown = 0; probs.hazel = 1; probs.green = 1; probs.blue = 98
    } else if (motherEyes === "green" && fatherEyes === "green") {
      probs.brown = 0; probs.hazel = 1; probs.green = 75; probs.blue = 24
    } else if ((motherEyes === "brown" && fatherEyes === "blue") || (motherEyes === "blue" && fatherEyes === "brown")) {
      probs.brown = 50; probs.hazel = 12; probs.green = 6; probs.blue = 32
      if (mGrandparent1 === "blue" || mGrandparent2 === "blue") {
        probs.brown = 37; probs.hazel = 12; probs.green = 6; probs.blue = 45
      }
    } else if ((motherEyes === "brown" && fatherEyes === "green") || (motherEyes === "green" && fatherEyes === "brown")) {
      probs.brown = 50; probs.hazel = 12; probs.green = 25; probs.blue = 13
    } else if ((motherEyes === "green" && fatherEyes === "blue") || (motherEyes === "blue" && fatherEyes === "green")) {
      probs.brown = 0; probs.hazel = 5; probs.green = 50; probs.blue = 45
    } else {
      // hazel/gray combinations — distribute
      probs.brown = r0(avgScore > 2.5 ? 40 : 20)
      probs.hazel = r0(25)
      probs.green = r0(avgScore < 2 ? 25 : 15)
      probs.blue = 100 - probs.brown - probs.hazel - probs.green
    }

    const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1])
    const mostLikely = sorted[0]

    setResult({
      primaryMetric: { label: "Most Likely Eye Color", value: mostLikely[0].charAt(0).toUpperCase() + mostLikely[0].slice(1), status: "good", description: `${mostLikely[1]}% probability based on parental and grandparental eye colors` },
      healthScore: mostLikely[1],
      metrics: [
        ...sorted.map(([color, pct]) => ({
          label: `${color.charAt(0).toUpperCase() + color.slice(1)} Eyes`, value: pct, unit: "%",
          status: (pct === mostLikely[1] ? "good" : pct > 0 ? "normal" : "warning") as 'good' | 'normal' | 'warning'
        })),
        { label: "Mother's Eyes", value: motherEyes.charAt(0).toUpperCase() + motherEyes.slice(1), status: "normal" },
        { label: "Father's Eyes", value: fatherEyes.charAt(0).toUpperCase() + fatherEyes.slice(1), status: "normal" }
      ],
      recommendations: [
        { title: "Eye Color Genetics", description: "Eye color is polygenic (16+ genes involved), with OCA2 and HERC2 on chromosome 15 being most influential. Brown is generally dominant over green and blue due to melanin production. Two blue-eyed parents almost always have blue-eyed children.", priority: "high", category: "Genetics" },
        { title: "When Baby's Eyes Change", description: "Most Caucasian babies are born with blue/gray eyes. Melanin production increases over 6-12 months, and final eye color usually stabilizes by 18-24 months. Dark-skinned babies often already have brown eyes at birth due to higher melanin levels.", priority: "high", category: "Development" },
        { title: "Limitations", description: "This is a simplified model. Real eye color inheritance involves 16+ genes with complex interactions. Heterochromia, environmental factors, and rare recessive allele combinations can produce unexpected results. These percentages are approximate.", priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: Object.fromEntries(sorted.map(([color, pct]) => [color.charAt(0).toUpperCase() + color.slice(1), `${pct}%`]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-eye-color" title="Baby Eye Color Predictor"
      description="Predict your baby's eye color based on parents' and grandparents' eye colors using simplified genetic modeling."
      icon={Baby} calculate={calculate} onClear={() => { setMotherEyes("brown"); setFatherEyes("blue"); setMGrandparent1("brown"); setMGrandparent2("blue"); setResult(null) }}
      values={[motherEyes, fatherEyes, mGrandparent1, mGrandparent2]} result={result}
      seoContent={<SeoContentGenerator title="Baby Eye Color Predictor" description="Predict baby eye color from parents genetics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Mother's Eye Color" val={motherEyes} set={setMotherEyes} options={[
            { value: "brown", label: "Brown" }, { value: "hazel", label: "Hazel" }, { value: "green", label: "Green" }, { value: "blue", label: "Blue" }, { value: "gray", label: "Gray" }
          ]} />
          <SelectInput label="Father's Eye Color" val={fatherEyes} set={setFatherEyes} options={[
            { value: "brown", label: "Brown" }, { value: "hazel", label: "Hazel" }, { value: "green", label: "Green" }, { value: "blue", label: "Blue" }, { value: "gray", label: "Gray" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Maternal Grandparent 1 Eyes" val={mGrandparent1} set={setMGrandparent1} options={[
            { value: "brown", label: "Brown" }, { value: "hazel", label: "Hazel" }, { value: "green", label: "Green" }, { value: "blue", label: "Blue" }, { value: "gray", label: "Gray" }
          ]} />
          <SelectInput label="Maternal Grandparent 2 Eyes" val={mGrandparent2} set={setMGrandparent2} options={[
            { value: "brown", label: "Brown" }, { value: "hazel", label: "Hazel" }, { value: "green", label: "Green" }, { value: "blue", label: "Blue" }, { value: "gray", label: "Gray" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 53. Baby Height Predictor ────────────────────────────────────────────────
export function BabyHeightPredictor() {
  const [motherHeight, setMotherHeight] = useState(165)
  const [fatherHeight, setFatherHeight] = useState(178)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const mh = clamp(motherHeight, 120, 220)
    const fh = clamp(fatherHeight, 120, 240)
    const male = gender === "male"

    // Mid-parental height method (Tanner method)
    const midParentalBoy = r1((fh + mh + 13) / 2)     // cm
    const midParentalGirl = r1((fh + mh - 13) / 2)     // cm
    const predicted = male ? midParentalBoy : midParentalGirl

    // Khamis-Roche range (±5 cm 50th percentile, ±8.5 cm 90%)
    const rangeLow = r1(predicted - 8.5)
    const rangeHigh = r1(predicted + 8.5)

    // Convert to feet/inches
    const cmToFtIn = (cm: number) => {
      const inches = cm / 2.54
      const ft = Math.floor(inches / 12)
      const inc = r0(inches % 12)
      return `${ft}'${inc}"`
    }

    const pctile = male
      ? (predicted < 162 ? 10 : predicted < 170 ? 25 : predicted < 177 ? 50 : predicted < 183 ? 75 : 90)
      : (predicted < 150 ? 10 : predicted < 157 ? 25 : predicted < 163 ? 50 : predicted < 170 ? 75 : 90)

    setResult({
      primaryMetric: { label: "Predicted Adult Height", value: `${predicted} cm (${cmToFtIn(predicted)})`, status: "good", description: `Mid-parental height method — range: ${rangeLow}-${rangeHigh} cm` },
      healthScore: pctile,
      metrics: [
        { label: "Predicted Height", value: predicted, unit: "cm", status: "good" },
        { label: "In Feet/Inches", value: cmToFtIn(predicted), status: "good" },
        { label: "Range (90% CI)", value: `${rangeLow} - ${rangeHigh} cm`, status: "normal" },
        { label: "Range (Feet)", value: `${cmToFtIn(rangeLow)} - ${cmToFtIn(rangeHigh)}`, status: "normal" },
        { label: "Approx. Percentile", value: pctile, unit: "%ile", status: "normal" },
        { label: "Mother's Height", value: `${mh} cm (${cmToFtIn(mh)})`, status: "normal" },
        { label: "Father's Height", value: `${fh} cm (${cmToFtIn(fh)})`, status: "normal" },
        { label: "Method", value: "Mid-Parental (Tanner)", status: "normal" }
      ],
      recommendations: [
        { title: "Mid-Parental Height Method", description: `For boys: (Father + Mother + 13) / 2 = ${midParentalBoy} cm. For girls: (Father + Mother − 13) / 2 = ${midParentalGirl} cm. The ±8.5 cm range encompasses ~90% of outcomes. Genetics explain ~60-80% of height variance.`, priority: "high", category: "Method" },
        { title: "Environmental Factors (20-40%)", description: "Nutrition (adequate protein, calcium, vitamin D), sleep quality (growth hormone peaks during deep sleep), physical activity, and chronic illness all significantly impact final height. Severely malnourished children may fall 10-15 cm below genetic potential.", priority: "high", category: "Environment" },
        { title: "Growth Monitoring", description: "Children should follow their growth curve percentile consistently. Crossing 2+ percentile lines or falling off the curve may indicate growth disorders (GH deficiency, thyroid issues, celiac disease). Bone age X-ray can predict remaining growth potential.", priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Mother": `${mh} cm`, "Father": `${fh} cm`, "Boy Formula": `(${fh} + ${mh} + 13) / 2 = ${midParentalBoy}`, "Girl Formula": `(${fh} + ${mh} − 13) / 2 = ${midParentalGirl}`, "Selected": `${gender} — ${predicted} cm`, "Range": `${rangeLow} – ${rangeHigh} cm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-height" title="Baby Height Predictor"
      description="Predict your child's adult height using the mid-parental (Tanner) method based on parents' heights and child's gender."
      icon={TrendingUp} calculate={calculate} onClear={() => { setMotherHeight(165); setFatherHeight(178); setGender("male"); setResult(null) }}
      values={[motherHeight, fatherHeight, gender]} result={result}
      seoContent={<SeoContentGenerator title="Baby Height Predictor" description="Predict child adult height from parents heights." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Mother's Height" val={motherHeight} set={setMotherHeight} min={120} max={220} suffix="cm" />
          <NumInput label="Father's Height" val={fatherHeight} set={setFatherHeight} min={120} max={240} suffix="cm" />
        </div>
        <SelectInput label="Baby's Gender" val={gender} set={setGender} options={[
          { value: "male", label: "Boy" }, { value: "female", label: "Girl" }
        ]} />
      </div>} />
  )
}

// ─── 54. Baby Hair Color Predictor ────────────────────────────────────────────
export function BabyHairColorPredictor() {
  const [motherHair, setMotherHair] = useState("brown")
  const [fatherHair, setFatherHair] = useState("blonde")
  const [mGrandparent1Hair, setMGrandparent1Hair] = useState("brown")
  const [mGrandparent2Hair, setMGrandparent2Hair] = useState("blonde")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // Simplified polygenic model (MC1R, OCA2, TYR, TYRP1, SLC24A4 etc.)
    const probs: Record<string, number> = { black: 0, brown: 0, auburn: 0, red: 0, blonde: 0 }

    // Dominance: Black > Brown > Auburn > Red > Blonde
    if (motherHair === "black" && fatherHair === "black") {
      probs.black = 80; probs.brown = 15; probs.auburn = 3; probs.red = 1; probs.blonde = 1
    } else if (motherHair === "blonde" && fatherHair === "blonde") {
      probs.black = 0; probs.brown = 5; probs.auburn = 2; probs.red = 3; probs.blonde = 90
    } else if ((motherHair === "red" || fatherHair === "red") && (motherHair === "red" || fatherHair === "red") && motherHair === fatherHair) {
      probs.black = 0; probs.brown = 5; probs.auburn = 15; probs.red = 75; probs.blonde = 5
    } else if ((motherHair === "brown" && fatherHair === "brown")) {
      probs.black = 5; probs.brown = 65; probs.auburn = 10; probs.red = 5; probs.blonde = 15
      if (mGrandparent1Hair === "blonde" || mGrandparent2Hair === "blonde") {
        probs.blonde += 10; probs.brown -= 10
      }
      if (mGrandparent1Hair === "red" || mGrandparent2Hair === "red") {
        probs.red += 8; probs.brown -= 8
      }
    } else if ((motherHair === "brown" && fatherHair === "blonde") || (motherHair === "blonde" && fatherHair === "brown")) {
      probs.black = 2; probs.brown = 45; probs.auburn = 8; probs.red = 5; probs.blonde = 40
    } else if ((motherHair === "black" && fatherHair === "blonde") || (motherHair === "blonde" && fatherHair === "black")) {
      probs.black = 30; probs.brown = 50; probs.auburn = 8; probs.red = 2; probs.blonde = 10
    } else if (motherHair === "red" || fatherHair === "red") {
      const other = motherHair === "red" ? fatherHair : motherHair
      if (other === "brown") {
        probs.black = 2; probs.brown = 45; probs.auburn = 20; probs.red = 25; probs.blonde = 8
      } else if (other === "blonde") {
        probs.black = 0; probs.brown = 10; probs.auburn = 20; probs.red = 35; probs.blonde = 35
      } else if (other === "black") {
        probs.black = 25; probs.brown = 40; probs.auburn = 20; probs.red = 10; probs.blonde = 5
      } else {
        probs.black = 5; probs.brown = 25; probs.auburn = 25; probs.red = 35; probs.blonde = 10
      }
    } else {
      // Other combinations
      probs.black = 15; probs.brown = 35; probs.auburn = 20; probs.red = 10; probs.blonde = 20
    }

    // Grandparent influence adjustments
    if (mGrandparent1Hair === "red" || mGrandparent2Hair === "red") {
      probs.red = Math.min(probs.red + 5, 80)
      probs.auburn = Math.min(probs.auburn + 3, 40)
      const excess = 8
      const maxKey = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0]
      if (maxKey !== "red" && maxKey !== "auburn") probs[maxKey] = Math.max(0, probs[maxKey] - excess)
    }

    // Normalize to 100
    const sumVal = Object.values(probs).reduce((a, b) => a + b, 0)
    if (sumVal !== 100) {
      const diff = 100 - sumVal
      const maxKey2 = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0]
      probs[maxKey2] += diff
    }

    const sorted = Object.entries(probs).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    const mostLikely = sorted[0]

    setResult({
      primaryMetric: { label: "Most Likely Hair Color", value: mostLikely[0].charAt(0).toUpperCase() + mostLikely[0].slice(1), status: "good", description: `${mostLikely[1]}% probability — based on parental and grandparental hair colors` },
      healthScore: mostLikely[1],
      metrics: [
        ...sorted.map(([color, pct]) => ({
          label: `${color.charAt(0).toUpperCase() + color.slice(1)}`, value: pct, unit: "%",
          status: (pct === mostLikely[1] ? "good" : pct > 10 ? "normal" : "warning") as 'good' | 'normal' | 'warning'
        })),
        { label: "Mother's Hair", value: motherHair.charAt(0).toUpperCase() + motherHair.slice(1), status: "normal" },
        { label: "Father's Hair", value: fatherHair.charAt(0).toUpperCase() + fatherHair.slice(1), status: "normal" }
      ],
      recommendations: [
        { title: "Hair Color Genetics", description: "Hair color is determined by the type and amount of melanin (eumelanin = dark, pheomelanin = red/yellow). Multiple genes (MC1R, OCA2, TYR, TYRP1, SLC24A4, KITLG) interact to produce the final shade. Dark colors are generally dominant over light.", priority: "high", category: "Genetics" },
        { title: "Red Hair (MC1R Gene)", description: "Red hair requires two copies of the recessive MC1R variant. Two brown-haired parents who both carry one MC1R copy have a 25% chance of a red-haired child. Red hair occurs in only 1-2% of the global population but about 6% of Scottish and Irish populations.", priority: "high", category: "Red Hair" },
        { title: "Hair Color Changes Over Time", description: "Many babies are born with lighter hair that darkens over the first 2-3 years as melanin production increases. Some blonde children darken to brown by adolescence. Hormonal changes during puberty can also alter hair color and texture.", priority: "medium", category: "Development" }
      ],
      detailedBreakdown: Object.fromEntries(sorted.map(([color, pct]) => [color.charAt(0).toUpperCase() + color.slice(1), `${pct}%`]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="baby-hair-color" title="Baby Hair Color Predictor"
      description="Predict your baby's likely hair color based on parents' and grandparents' hair colors using simplified genetic modeling."
      icon={Baby} calculate={calculate} onClear={() => { setMotherHair("brown"); setFatherHair("blonde"); setMGrandparent1Hair("brown"); setMGrandparent2Hair("blonde"); setResult(null) }}
      values={[motherHair, fatherHair, mGrandparent1Hair, mGrandparent2Hair]} result={result}
      seoContent={<SeoContentGenerator title="Baby Hair Color Predictor" description="Predict baby hair color from parents genetics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Mother's Hair Color" val={motherHair} set={setMotherHair} options={[
            { value: "black", label: "Black" }, { value: "brown", label: "Brown" }, { value: "auburn", label: "Auburn" }, { value: "red", label: "Red" }, { value: "blonde", label: "Blonde" }
          ]} />
          <SelectInput label="Father's Hair Color" val={fatherHair} set={setFatherHair} options={[
            { value: "black", label: "Black" }, { value: "brown", label: "Brown" }, { value: "auburn", label: "Auburn" }, { value: "red", label: "Red" }, { value: "blonde", label: "Blonde" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Maternal Grandparent 1 Hair" val={mGrandparent1Hair} set={setMGrandparent1Hair} options={[
            { value: "black", label: "Black" }, { value: "brown", label: "Brown" }, { value: "auburn", label: "Auburn" }, { value: "red", label: "Red" }, { value: "blonde", label: "Blonde" }
          ]} />
          <SelectInput label="Maternal Grandparent 2 Hair" val={mGrandparent2Hair} set={setMGrandparent2Hair} options={[
            { value: "black", label: "Black" }, { value: "brown", label: "Brown" }, { value: "auburn", label: "Auburn" }, { value: "red", label: "Red" }, { value: "blonde", label: "Blonde" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 55. Twin Probability Calculator ──────────────────────────────────────────
export function TwinProbabilityCalculator() {
  const [age, setAge] = useState(30)
  const [familyHistory, setFamilyHistory] = useState("no")
  const [previousTwins, setPreviousTwins] = useState("no")
  const [fertility, setFertility] = useState("natural")
  const [bmi, setBmi] = useState(25)
  const [height, setHeight] = useState(165)
  const [ethnicity, setEthnicity] = useState("caucasian")
  const [parity, setParity] = useState("0")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 18, 50)
    const b = clamp(bmi, 15, 50)
    const h = clamp(height, 140, 200)
    const par = parseInt(parity)

    // Baseline twin rate: ~3.3% of all US births (2019 data)
    let twinRate = 3.3
    let fraternalRate = 2.7
    let identicalRate = 0.4

    // Age factor: peaks at 35-39
    if (a >= 35 && a < 40) { fraternalRate *= 1.7; twinRate = fraternalRate + identicalRate }
    else if (a >= 40) { fraternalRate *= 1.5; twinRate = fraternalRate + identicalRate }
    else if (a >= 30) { fraternalRate *= 1.3; twinRate = fraternalRate + identicalRate }

    // Family history (maternal side)
    if (familyHistory === "maternal") { fraternalRate *= 1.7; twinRate = fraternalRate + identicalRate }
    else if (familyHistory === "paternal") { fraternalRate *= 1.1; twinRate = fraternalRate + identicalRate }

    // Previous twins
    if (previousTwins === "yes") { fraternalRate *= 2.0; twinRate = fraternalRate + identicalRate }

    // Fertility treatment
    if (fertility === "clomid") { fraternalRate *= 3; twinRate = fraternalRate + identicalRate }
    else if (fertility === "gonadotropins") { fraternalRate *= 5; twinRate = fraternalRate + identicalRate }
    else if (fertility === "ivf") {
      // IVF twin rate depends on # embryos transferred — assume 2
      twinRate = 20; fraternalRate = 19; identicalRate = 1
    }

    // BMI > 30 increases fraternal rate
    if (b >= 30) { fraternalRate *= 1.3; twinRate = fraternalRate + identicalRate }

    // Tall women have higher twin rates
    if (h >= 170) { fraternalRate *= 1.2; twinRate = fraternalRate + identicalRate }

    // Parity (more pregnancies = slightly higher rate)
    if (par >= 4) { fraternalRate *= 1.3; twinRate = fraternalRate + identicalRate }
    else if (par >= 2) { fraternalRate *= 1.1; twinRate = fraternalRate + identicalRate }

    // Ethnicity
    if (ethnicity === "nigerian") { fraternalRate *= 1.8; twinRate = fraternalRate + identicalRate }
    else if (ethnicity === "african") { fraternalRate *= 1.5; twinRate = fraternalRate + identicalRate }
    else if (ethnicity === "asian") { fraternalRate *= 0.6; twinRate = fraternalRate + identicalRate }

    // Cap at reasonable values
    twinRate = r2(Math.min(twinRate, 50))
    fraternalRate = r2(Math.min(fraternalRate, 45))
    identicalRate = r2(identicalRate)
    const singletonRate = r2(Math.max(0, 100 - twinRate))
    const tripletsRate = r2(twinRate * 0.03)

    const oddsStr = twinRate < 5 ? `1 in ${r0(100 / twinRate)}` : `1 in ${r0(100 / twinRate)}`

    setResult({
      primaryMetric: { label: "Twin Probability", value: `${twinRate}%`, status: twinRate > 10 ? "warning" : "good", description: `${oddsStr} pregnancies — Fraternal: ${fraternalRate}%, Identical: ${identicalRate}%` },
      healthScore: r0(100 - twinRate),
      metrics: [
        { label: "Total Twin Rate", value: twinRate, unit: "%", status: twinRate > 10 ? "warning" : "normal" },
        { label: "Fraternal (Dizygotic)", value: fraternalRate, unit: "%", status: "normal" },
        { label: "Identical (Monozygotic)", value: identicalRate, unit: "%", status: "normal" },
        { label: "Singleton Rate", value: singletonRate, unit: "%", status: "good" },
        { label: "Triplet+ Risk", value: tripletsRate, unit: "%", status: tripletsRate > 1 ? "warning" : "normal" },
        { label: "Odds", value: oddsStr, status: "normal" },
        { label: "Age Factor", value: a >= 35 ? "Elevated (peak 35-39)" : "Normal", status: a >= 35 ? "warning" : "good" },
        { label: "Fertility Treatment", value: fertility === "natural" ? "None" : fertility.charAt(0).toUpperCase() + fertility.slice(1), status: fertility !== "natural" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Twin Statistics", description: `Your estimated twin probability: ${twinRate}%. US average: 3.3% (2019). Fraternal twins are influenced by maternal age, genetics, fertility treatments, BMI, height, and parity. Identical twins occur randomly (~0.4%) and are NOT influenced by these factors.`, priority: "high", category: "Statistics" },
        { title: "Risk Factors for Twins", description: `Key factors increasing fraternal twins: 1) Maternal age 35-39 (highest natural rate). 2) Maternal family history of twins. 3) Fertility treatments (IVF: 20-30% with 2 embryos). 4) Tall stature and higher BMI. 5) African descent (highest natural twin rate). 6) Higher parity.`, priority: "high", category: "Risk Factors" },
        { title: "Twin Pregnancy Considerations", description: "Twin pregnancies carry higher risks: preterm birth (60% before 37 weeks), preeclampsia (2-3x), gestational diabetes (1.5x), C-section (>50%), and low birth weight. Additional monitoring, nutrition (600+ extra cal/day), and specialist care are recommended.", priority: "medium", category: "Health" }
      ],
      detailedBreakdown: { "Age": a, "BMI": b, "Height": `${h} cm`, "Parity": par, "Family History": familyHistory, "Fertility": fertility, "Twin Rate": `${twinRate}%`, "Fraternal": `${fraternalRate}%`, "Identical": `${identicalRate}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="twin-probability" title="Twin Probability Calculator"
      description="Calculate your probability of having twins based on age, family history, fertility treatments, BMI, height, and ethnicity."
      icon={Baby} calculate={calculate} onClear={() => { setAge(30); setFamilyHistory("no"); setPreviousTwins("no"); setFertility("natural"); setBmi(25); setHeight(165); setEthnicity("caucasian"); setParity("0"); setResult(null) }}
      values={[age, familyHistory, previousTwins, fertility, bmi, height, ethnicity, parity]} result={result}
      seoContent={<SeoContentGenerator title="Twin Probability Calculator" description="Calculate twin probability based on risk factors." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Mother's Age" val={age} set={setAge} min={18} max={50} suffix="years" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={50} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={140} max={200} suffix="cm" />
          <SelectInput label="Previous Births" val={parity} set={setParity} options={[
            { value: "0", label: "0 (First pregnancy)" }, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4+" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Family History of Twins" val={familyHistory} set={setFamilyHistory} options={[
            { value: "no", label: "No family history" }, { value: "maternal", label: "Yes — Mother's side" }, { value: "paternal", label: "Yes — Father's side" }
          ]} />
          <SelectInput label="Previous Twin Pregnancy" val={previousTwins} set={setPreviousTwins} options={[
            { value: "no", label: "No" }, { value: "yes", label: "Yes" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Fertility Treatment" val={fertility} set={setFertility} options={[
            { value: "natural", label: "Natural conception" }, { value: "clomid", label: "Clomid/Letrozole" }, { value: "gonadotropins", label: "Gonadotropins (injectables)" }, { value: "ivf", label: "IVF" }
          ]} />
          <SelectInput label="Ethnicity" val={ethnicity} set={setEthnicity} options={[
            { value: "caucasian", label: "Caucasian" }, { value: "african", label: "African American" }, { value: "nigerian", label: "Nigerian/West African" }, { value: "hispanic", label: "Hispanic" }, { value: "asian", label: "Asian" }, { value: "other", label: "Other" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 56. VBAC Success Calculator ──────────────────────────────────────────────
export function VBACSuccessCalculator() {
  const [age, setAge] = useState(30)
  const [bmi, setBmi] = useState(27)
  const [previousVaginal, setPreviousVaginal] = useState("no")
  const [previousCsReason, setPreviousCsReason] = useState("failure-progress")
  const [cervicalDilation, setCervicalDilation] = useState(2)
  const [gestationalAge, setGestationalAge] = useState(39)
  const [spontaneousLabor, setSpontaneousLabor] = useState("yes")
  const [recurringIndication, setRecurringIndication] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 18, 50)
    const b = clamp(bmi, 15, 55)
    const dilation = clamp(cervicalDilation, 0, 10)
    const ga = clamp(gestationalAge, 34, 42)

    // MFMU (Maternal-Fetal Medicine Units) Network VBAC Calculator model
    // Baseline success rate for TOLAC (trial of labor after cesarean): ~60-80%
    let score = 70

    // Age: younger = better
    if (a < 25) score += 5
    else if (a < 30) score += 3
    else if (a >= 35 && a < 40) score -= 5
    else if (a >= 40) score -= 10

    // BMI
    if (b < 25) score += 5
    else if (b >= 30 && b < 35) score -= 5
    else if (b >= 35 && b < 40) score -= 10
    else if (b >= 40) score -= 15

    // Previous vaginal delivery (strongest positive predictor)
    if (previousVaginal === "before-cs") score += 15
    else if (previousVaginal === "after-cs") score += 20

    // Reason for previous CS
    if (previousCsReason === "breech") score += 10
    else if (previousCsReason === "fetal-distress") score += 5
    else if (previousCsReason === "failure-progress") score -= 5

    // Cervical dilation at admission
    if (dilation >= 4) score += 8
    else if (dilation >= 2) score += 3

    // Spontaneous labor
    if (spontaneousLabor === "yes") score += 8
    else score -= 5 // induction reduces VBAC success

    // Gestational age > 40 weeks reduces success
    if (ga > 40) score -= 5
    if (ga > 41) score -= 10

    // Recurring indication
    if (recurringIndication === "yes") score -= 10

    score = clamp(score, 10, 95)

    let risk: string, status: 'normal' | 'warning' | 'danger' | 'good'
    if (score >= 70) { risk = "Good Candidate for VBAC"; status = "good" }
    else if (score >= 50) { risk = "Moderate VBAC Candidate"; status = "warning" }
    else { risk = "Lower VBAC Success Likelihood"; status = "danger" }

    const uterineRuptureRisk = r2(0.5 + (ga > 41 ? 0.3 : 0) + (spontaneousLabor === "no" ? 0.2 : 0))

    setResult({
      primaryMetric: { label: "VBAC Success Rate", value: `${score}%`, status, description: risk },
      healthScore: score,
      metrics: [
        { label: "Estimated Success Rate", value: score, unit: "%", status },
        { label: "Risk Category", value: risk, status },
        { label: "Uterine Rupture Risk", value: uterineRuptureRisk, unit: "%", status: uterineRuptureRisk < 0.7 ? "good" : "warning" },
        { label: "Age Factor", value: a < 35 ? "Favorable" : a < 40 ? "Moderate" : "Unfavorable", status: a < 35 ? "good" : a < 40 ? "warning" : "danger" },
        { label: "BMI Factor", value: b < 30 ? "Favorable" : b < 35 ? "Moderate" : "Unfavorable", status: b < 30 ? "good" : b < 35 ? "warning" : "danger" },
        { label: "Previous Vaginal Birth", value: previousVaginal === "no" ? "None" : "Yes — strong positive factor", status: previousVaginal !== "no" ? "good" : "normal" },
        { label: "Spontaneous Labor", value: spontaneousLabor === "yes" ? "Yes (+8 pts)" : "No / Induced (−5 pts)", status: spontaneousLabor === "yes" ? "good" : "warning" },
        { label: "Gestational Age", value: ga, unit: "weeks", status: ga <= 40 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "VBAC Success Factors", description: `Your estimated VBAC success rate: ${score}%. The strongest predictors of VBAC success are: 1) Prior vaginal delivery (increases success to 85-90%). 2) Spontaneous labor onset. 3) Non-recurring reason for prior CS (e.g., breech). 4) BMI <30. 5) Age <35.`, priority: "high", category: "Predictors" },
        { title: "ACOG Guidelines", description: `ACOG recommends TOLAC (Trial of Labor After Cesarean) when expected success rate is ≥60-70%. Your rate of ${score}% is ${score >= 60 ? "within" : "below"} this threshold. TOLAC should be attempted at facilities with emergency CS capability (within 30 min).`, priority: "high", category: "Guidelines" },
        { title: "Risks & Benefits", description: `VBAC benefits: shorter recovery, lower infection risk, better for future pregnancies. Risks: uterine rupture (~${uterineRuptureRisk}%), emergency CS if VBAC fails (with higher complication rates than planned repeat CS). Discuss with your provider to make an informed decision.`, priority: "medium", category: "Risk-Benefit" }
      ],
      detailedBreakdown: { "Base Score": 70, "Age Adj": a < 25 ? "+5" : a < 30 ? "+3" : a >= 40 ? "−10" : a >= 35 ? "−5" : "0", "BMI Adj": b < 25 ? "+5" : b >= 40 ? "−15" : b >= 35 ? "−10" : b >= 30 ? "−5" : "0", "Vaginal Birth Bonus": previousVaginal === "after-cs" ? "+20" : previousVaginal === "before-cs" ? "+15" : "0", "Final Score": `${score}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vbac-success" title="VBAC Success Calculator"
      description="Estimate your probability of successful vaginal birth after cesarean (VBAC) using evidence-based predictors from the MFMU model."
      icon={Heart} calculate={calculate} onClear={() => { setAge(30); setBmi(27); setPreviousVaginal("no"); setPreviousCsReason("failure-progress"); setCervicalDilation(2); setGestationalAge(39); setSpontaneousLabor("yes"); setRecurringIndication("no"); setResult(null) }}
      values={[age, bmi, previousVaginal, previousCsReason, cervicalDilation, gestationalAge, spontaneousLabor, recurringIndication]} result={result}
      seoContent={<SeoContentGenerator title="VBAC Success Calculator" description="Calculate VBAC success rate using MFMU model." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={50} suffix="years" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={55} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Gestational Age" val={gestationalAge} set={setGestationalAge} min={34} max={42} suffix="weeks" />
          <NumInput label="Cervical Dilation at Admission" val={cervicalDilation} set={setCervicalDilation} min={0} max={10} suffix="cm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Previous Vaginal Delivery" val={previousVaginal} set={setPreviousVaginal} options={[
            { value: "no", label: "None" }, { value: "before-cs", label: "Yes — before cesarean" }, { value: "after-cs", label: "Yes — after cesarean (prev VBAC)" }
          ]} />
          <SelectInput label="Reason for Previous CS" val={previousCsReason} set={setPreviousCsReason} options={[
            { value: "failure-progress", label: "Failure to progress" }, { value: "fetal-distress", label: "Fetal distress" }, { value: "breech", label: "Breech presentation" }, { value: "elective", label: "Elective/Scheduled" }, { value: "other", label: "Other" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Spontaneous Labor" val={spontaneousLabor} set={setSpontaneousLabor} options={[
            { value: "yes", label: "Yes — natural onset" }, { value: "no", label: "No — induced/planned" }
          ]} />
          <SelectInput label="Recurring Indication" val={recurringIndication} set={setRecurringIndication} options={[
            { value: "no", label: "No — non-recurring" }, { value: "yes", label: "Yes — same reason likely" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 57. Labor Pain Simulator ─────────────────────────────────────────────────
export function LaborPainSimulator() {
  const [phase, setPhase] = useState("early")
  const [painTolerance, setPainTolerance] = useState("moderate")
  const [epidural, setEpidural] = useState("no")
  const [backLabor, setBackLabor] = useState("no")
  const [pitocin, setPitocin] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // Pain scale: 0-10 VAS equivalent based on labor phase
    const phaseScores: Record<string, { pain: number; desc: string; dilation: string; duration: string }> = {
      "early": { pain: 4, desc: "Mild-moderate cramping, period-like pain", dilation: "0-3 cm", duration: "6-12 hours" },
      "active": { pain: 7, desc: "Strong, regular contractions, increasing intensity", dilation: "4-7 cm", duration: "3-5 hours" },
      "transition": { pain: 9.5, desc: "Overwhelming, very intense, nausea common", dilation: "8-10 cm", duration: "30 min - 2 hours" },
      "pushing": { pain: 8.5, desc: "Intense pressure, urge to push, burning/stretching", dilation: "10 cm (complete)", duration: "20 min - 3 hours" }
    }

    const phaseData = phaseScores[phase] || phaseScores["early"]
    let painScore = phaseData.pain

    // Pain tolerance adjustment
    if (painTolerance === "low") painScore = Math.min(10, painScore + 1)
    else if (painTolerance === "high") painScore = Math.max(1, painScore - 1)

    // Epidural reduces pain significantly
    let epiduralEffect = 0
    if (epidural === "yes") { epiduralEffect = -4; painScore = Math.max(1, painScore - 4) }
    else if (epidural === "partial") { epiduralEffect = -2; painScore = Math.max(2, painScore - 2) }

    // Back labor increases pain
    if (backLabor === "yes") painScore = Math.min(10, painScore + 1.5)

    // Pitocin makes contractions more intense
    if (pitocin === "yes") painScore = Math.min(10, painScore + 1)

    painScore = r1(painScore)

    let comparison = ""
    if (painScore <= 3) comparison = "Similar to: moderate menstrual cramps, stubbed toe"
    else if (painScore <= 5) comparison = "Similar to: kidney stone, severe toothache, migraine"
    else if (painScore <= 7) comparison = "Similar to: broken bone, cluster headache, severe burn"
    else if (painScore <= 9) comparison = "Exceeds: kidney stone, bone fracture (described as most intense pain possible)"
    else comparison = "Near maximum on human pain scale — described as 'beyond comparison'"

    const coping = phase === "transition"
      ? "Breathing techniques, counter-pressure, position changes, vocalization. Transition is the shortest and most intense phase — it means delivery is very close."
      : phase === "pushing"
      ? "Directed pushing, different positions (squatting, side-lying), perineal support. The pressure sensation actually helps guide effective pushing."
      : "Walking, warm bath/shower, massage, breathing patterns, TENS machine, birth ball."

    const status = painScore <= 3 ? "good" as const : painScore <= 6 ? "warning" as const : "danger" as const

    setResult({
      primaryMetric: { label: "Estimated Pain Level", value: `${painScore}/10`, status, description: `${phaseData.desc}` },
      healthScore: r0(100 - painScore * 10),
      metrics: [
        { label: "Pain Score (VAS)", value: painScore, unit: "/10", status },
        { label: "Labor Phase", value: phase.charAt(0).toUpperCase() + phase.slice(1), status: "normal" },
        { label: "Cervical Dilation", value: phaseData.dilation, status: "normal" },
        { label: "Typical Duration", value: phaseData.duration, status: "normal" },
        { label: "Pain Comparison", value: comparison, status },
        { label: "Epidural Effect", value: epidural === "yes" ? `−4 points (current: ${painScore})` : epidural === "partial" ? `−2 points` : "Not used", status: epidural !== "no" ? "good" : "normal" },
        { label: "Back Labor", value: backLabor === "yes" ? "+1.5 (posterior baby position)" : "No", status: backLabor === "yes" ? "warning" : "good" },
        { label: "Pitocin/Oxytocin", value: pitocin === "yes" ? "+1 (stronger contractions)" : "No augmentation", status: pitocin === "yes" ? "warning" : "normal" }
      ],
      recommendations: [
        { title: "Pain Management Options", description: `Phase: ${phase}. ${epidural === "no" ? "Epidural analgesia reduces labor pain by 70-90% and is available until late active labor. Other options: IV opioids (moderate relief, 1-2 hours), nitrous oxide (mild relief), TENS, hydrotherapy." : "With epidural: monitor for fever, blood pressure changes. Walking epidural allows some mobility. Can be topped up as needed."}`, priority: "high", category: "Pain Relief" },
        { title: "Coping Strategies", description: coping, priority: "high", category: "Coping" },
        { title: "What to Expect", description: `During ${phase} labor: contractions are ${phase === "early" ? "5-20 min apart, 30-60 seconds long" : phase === "active" ? "3-5 min apart, 45-75 seconds" : phase === "transition" ? "2-3 min apart, 60-90 seconds, very intense" : "with each push lasting about 10 seconds, 3 pushes per contraction"}. ${phase === "transition" ? "Transition is the hardest but shortest phase — you're almost there!" : ""}`, priority: "medium", category: "Education" }
      ],
      detailedBreakdown: { "Phase": phase, "Base Pain": phaseData.pain, "Tolerance Adj": painTolerance === "low" ? "+1" : painTolerance === "high" ? "−1" : "0", "Epidural": `${epiduralEffect}`, "Back Labor": backLabor === "yes" ? "+1.5" : "0", "Pitocin": pitocin === "yes" ? "+1" : "0", "Final": painScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="labor-pain" title="Labor Pain Simulator & Guide"
      description="Understand labor pain intensity across different phases. Includes pain comparisons, coping strategies, and pain management options."
      icon={AlertCircle} calculate={calculate} onClear={() => { setPhase("early"); setPainTolerance("moderate"); setEpidural("no"); setBackLabor("no"); setPitocin("no"); setResult(null) }}
      values={[phase, painTolerance, epidural, backLabor, pitocin]} result={result}
      seoContent={<SeoContentGenerator title="Labor Pain Simulator" description="Understand labor pain levels across different phases." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Labor Phase" val={phase} set={setPhase} options={[
          { value: "early", label: "Early Labor (0-3 cm)" }, { value: "active", label: "Active Labor (4-7 cm)" },
          { value: "transition", label: "Transition (8-10 cm)" }, { value: "pushing", label: "Pushing Stage" }
        ]} />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Pain Tolerance" val={painTolerance} set={setPainTolerance} options={[
            { value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }
          ]} />
          <SelectInput label="Epidural" val={epidural} set={setEpidural} options={[
            { value: "no", label: "None" }, { value: "partial", label: "Partial/Walking" }, { value: "yes", label: "Full epidural" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Back Labor" val={backLabor} set={setBackLabor} options={[
            { value: "no", label: "No" }, { value: "yes", label: "Yes (posterior position)" }
          ]} />
          <SelectInput label="Pitocin/Oxytocin Augmentation" val={pitocin} set={setPitocin} options={[
            { value: "no", label: "No" }, { value: "yes", label: "Yes" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 58. Contraction Intensity Calculator ─────────────────────────────────────
export function ContractionIntensityCalculator() {
  const [frequency, setFrequency] = useState(5)
  const [duration, setDuration] = useState(45)
  const [painLevel, setPainLevel] = useState(5)
  const [pattern, setPattern] = useState("regular")
  const [weekPregnant, setWeekPregnant] = useState(38)
  const [cervicalChange, setCervicalChange] = useState("unknown")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const freq = clamp(frequency, 1, 30)
    const dur = clamp(duration, 10, 180)
    const pain = clamp(painLevel, 0, 10)
    const week = clamp(weekPregnant, 20, 42)

    // Montevideo Units approximation (MVU = avg pressure × contractions per 10 min)
    // Normal labor: >200 MVU considered adequate
    const contractionsPerHour = r0(60 / freq)
    const contractionsPer10min = r1(10 / freq)
    const estimatedPressureMmHg = r0(20 + pain * 5) // rough estimate based on pain
    const mvu = r0(estimatedPressureMmHg * contractionsPer10min)

    // Labor phase assessment
    let phase: string
    let recommend: string
    let status: 'normal' | 'warning' | 'danger' | 'good'

    if (freq > 10 && dur < 30) {
      phase = "Braxton Hicks / Prodromal"
      recommend = "Irregular, short contractions — likely false labor. Rest, hydrate, and time them for an hour."
      status = "good"
    } else if (freq > 5 && dur < 45) {
      phase = "Early Labor"
      recommend = "Rest at home, eat light meals, stay hydrated. Call your provider when contractions are 5-1-1 (5 min apart, 1 min long, for 1 hour)."
      status = "good"
    } else if (freq <= 5 && freq > 3 && dur >= 45) {
      phase = "Active Labor"
      recommend = "Time to head to the hospital/birth center. Regular contractions 3-5 minutes apart lasting 45-60 seconds indicate active labor."
      status = "warning"
    } else if (freq <= 3 && dur >= 60) {
      phase = "Advanced/Transition Labor"
      recommend = "You should be at the hospital. These contractions indicate advanced labor or transition phase. If not already there, go immediately."
      status = "danger"
    } else {
      phase = pattern === "irregular" ? "Prodromal/False Labor" : "Early Labor"
      recommend = "Continue monitoring. The 5-1-1 rule helps determine when to go in."
      status = "good"
    }

    // Preterm warning
    const preterm = week < 37
    if (preterm && freq <= 10 && pattern === "regular") {
      phase = "POSSIBLE PRETERM LABOR"
      recommend = "Regular contractions before 37 weeks require immediate medical evaluation. Contact your provider or go to labor and delivery now."
      status = "danger"
    }

    const isAdequate = mvu >= 200

    const fiveOneOne = freq <= 5 && dur >= 60

    setResult({
      primaryMetric: { label: "Labor Assessment", value: phase, status, description: `Contractions every ${freq} min, lasting ${dur}s, pain ${pain}/10` },
      healthScore: status === "good" ? 80 : status === "warning" ? 50 : 20,
      metrics: [
        { label: "Phase Assessment", value: phase, status },
        { label: "Frequency", value: freq, unit: "min apart", status: freq <= 5 ? "warning" : "good" },
        { label: "Duration", value: dur, unit: "seconds", status: dur >= 60 ? "warning" : "good" },
        { label: "Pain Level", value: pain, unit: "/10", status: pain >= 7 ? "danger" : pain >= 4 ? "warning" : "good" },
        { label: "Pattern", value: pattern === "regular" ? "Regular" : "Irregular", status: pattern === "regular" ? "warning" : "good" },
        { label: "Contractions/Hour", value: contractionsPerHour, status: contractionsPerHour >= 6 ? "warning" : "good" },
        { label: "Est. Montevideo Units", value: mvu, unit: "MVU", status: isAdequate ? "warning" : "good" },
        { label: "5-1-1 Rule Met", value: fiveOneOne ? "YES — Go to hospital" : "No — continue monitoring", status: fiveOneOne ? "danger" : "good" },
        { label: "Gestational Age", value: week, unit: "weeks", status: week < 37 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Current Assessment", description: recommend, priority: "high", category: "Action" },
        { title: "5-1-1 Rule", description: `Go to the hospital when contractions are: 5 minutes apart, 1 minute long, for 1 hour consistently. ${fiveOneOne ? "YOUR CONTRACTIONS MEET THIS CRITERIA — call your provider and head to the hospital." : "Your contractions do not yet meet this threshold. Continue timing and monitoring."}`, priority: "high", category: "When to Go" },
        { title: "Contraction Timing Tips", description: "Time contractions from the START of one to the START of the next (frequency). Duration is from the start to end of a single contraction. Track for at least 1 hour. If contractions become irregular or stop with rest/hydration, they may be Braxton Hicks.", priority: "medium", category: "Timing" },
        ...(preterm ? [{ title: "PRETERM LABOR WARNING", description: `You are ${week} weeks pregnant. Regular contractions before 37 weeks may indicate preterm labor. Other signs: pelvic pressure, low dull backache, watery/bloody discharge, menstrual-like cramps. Seek immediate medical attention — early intervention can significantly improve outcomes.`, priority: "high" as const, category: "Emergency" }] : [])
      ],
      detailedBreakdown: { "Frequency": `${freq} min`, "Duration": `${dur} sec`, "Pain": `${pain}/10`, "Pattern": pattern, "Week": week, "MVU (est)": mvu, "Phase": phase }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="contraction-intensity" title="Contraction Intensity Calculator"
      description="Track and assess contraction frequency, duration, and intensity. Includes labor phase assessment, 5-1-1 rule, and when-to-go guidance."
      icon={Activity} calculate={calculate} onClear={() => { setFrequency(5); setDuration(45); setPainLevel(5); setPattern("regular"); setWeekPregnant(38); setCervicalChange("unknown"); setResult(null) }}
      values={[frequency, duration, painLevel, pattern, weekPregnant, cervicalChange]} result={result}
      seoContent={<SeoContentGenerator title="Contraction Intensity Calculator" description="Track contraction frequency duration and intensity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Contraction Frequency" val={frequency} set={setFrequency} min={1} max={30} suffix="min apart" />
          <NumInput label="Contraction Duration" val={duration} set={setDuration} min={10} max={180} suffix="seconds" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Pain Level" val={painLevel} set={setPainLevel} min={0} max={10} suffix="/10" />
          <SelectInput label="Pattern" val={pattern} set={setPattern} options={[
            { value: "regular", label: "Regular/Consistent" }, { value: "irregular", label: "Irregular/Variable" }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weeks Pregnant" val={weekPregnant} set={setWeekPregnant} min={20} max={42} suffix="weeks" />
          <SelectInput label="Cervical Change" val={cervicalChange} set={setCervicalChange} options={[
            { value: "unknown", label: "Unknown" }, { value: "yes", label: "Yes — dilating/effacing" }, { value: "no", label: "No change" }
          ]} />
        </div>
      </div>} />
  )
}
