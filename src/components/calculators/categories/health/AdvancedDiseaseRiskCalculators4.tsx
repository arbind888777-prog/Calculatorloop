"use client"

import { useState } from "react"
import { Activity, Heart, Brain, AlertCircle, Thermometer, Wind, Droplets, Zap } from "lucide-react"
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

// ─── 17. Asthma Control Score ─────────────────────────────────────────────────
export function AsthmaControlScoreCalculator() {
  const [daytimeSymptoms, setDaytimeSymptoms] = useState("2_3_week")
  const [nightSymptoms, setNightSymptoms] = useState("1_2_week")
  const [rescueInhaler, setRescueInhaler] = useState("2_3_week")
  const [activityLimit, setActivityLimit] = useState("some")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // ACT-style scoring: each item 1-5, total 5-25
    const dayScore = daytimeSymptoms === "never" ? 5 : daytimeSymptoms === "1_week" ? 4 : daytimeSymptoms === "2_3_week" ? 3 : daytimeSymptoms === "most_days" ? 2 : 1
    const nightScore = nightSymptoms === "never" ? 5 : nightSymptoms === "1_month" ? 4 : nightSymptoms === "1_2_week" ? 3 : nightSymptoms === "2_3_week" ? 2 : 1
    const inhalerScore = rescueInhaler === "never" ? 5 : rescueInhaler === "1_week" ? 4 : rescueInhaler === "2_3_week" ? 3 : rescueInhaler === "1_day" ? 2 : 1
    const activityScore = activityLimit === "none" ? 5 : activityLimit === "slight" ? 4 : activityLimit === "some" ? 3 : activityLimit === "a_lot" ? 2 : 1

    // Self-rated control (derived from average)
    const avg = (dayScore + nightScore + inhalerScore + activityScore) / 4
    const selfRatedScore = avg >= 4 ? 5 : avg >= 3 ? 4 : avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : 1

    const actScore = r0(clamp(dayScore + nightScore + inhalerScore + activityScore + selfRatedScore, 5, 25))

    const classification = actScore >= 20 ? "Well Controlled" : actScore >= 16 ? "Partially Controlled" : "Uncontrolled"
    const exacerbationRisk = r0(clamp(actScore <= 15 ? 50 : actScore <= 19 ? 25 : 10, 5, 60))

    const status: 'good' | 'warning' | 'danger' = actScore >= 20 ? "good" : actScore >= 16 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Asthma Control Test Score", value: `${actScore}/25`, status, description: classification },
      healthScore: r0(clamp(actScore * 4, 20, 100)),
      metrics: [
        { label: "ACT Score", value: `${actScore}/25`, status },
        { label: "Control Level", value: classification, status },
        { label: "Daytime Symptoms", value: `${dayScore}/5`, status: dayScore >= 4 ? "good" : dayScore >= 3 ? "warning" : "danger" },
        { label: "Night Symptoms", value: `${nightScore}/5`, status: nightScore >= 4 ? "good" : nightScore >= 3 ? "warning" : "danger" },
        { label: "Rescue Inhaler Use", value: `${inhalerScore}/5`, status: inhalerScore >= 4 ? "good" : inhalerScore >= 3 ? "warning" : "danger" },
        { label: "Activity Limitation", value: `${activityScore}/5`, status: activityScore >= 4 ? "good" : activityScore >= 3 ? "warning" : "danger" },
        { label: "Exacerbation Risk", value: exacerbationRisk, unit: "%", status: exacerbationRisk < 20 ? "good" : exacerbationRisk < 35 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Asthma Control", description: `ACT score: ${actScore}/25 (${classification}). ${actScore < 16 ? "UNCONTROLLED — step-up therapy needed. Consult pulmonologist urgently." : actScore < 20 ? "Partially controlled — review inhaler technique and adherence." : "Well controlled — maintain current regimen."} Target: ≥20 for well-controlled asthma. Exacerbation risk: ${exacerbationRisk}%.`, priority: "high", category: "Assessment" },
        { title: "Action Plan", description: `${actScore < 20 ? "1) Check inhaler technique (most common cause of poor control). 2) Adherence to controller medication (ICS daily). 3) Identify triggers (allergens, exercise, cold air). 4) Consider step-up: add LABA, increase ICS dose, or add LTRA. " : "Continue current controller therapy. "}Peak flow monitoring recommended. Written asthma action plan essential for all patients.`, priority: "high", category: "Treatment" },
        { title: "Monthly Monitoring", description: `Repeat ACT every 4 weeks to track trends. ${actScore >= 20 ? "If well-controlled for 3+ months, consider step-down trial." : "If uncontrolled despite adherence, consider add-on therapy or specialist referral."} Annual flu vaccination recommended. Avoid known triggers. Emergency plan: rescue inhaler + seek care if no relief.`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "ACT": `${actScore}/25`, "Day": dayScore, "Night": nightScore, "Inhaler": inhalerScore, "Activity": activityScore, "Risk": `${exacerbationRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="asthma-control-score" title="Asthma Control Score"
      description="Assess asthma control using ACT scoring. Evaluates daytime/night symptoms, rescue inhaler use, and activity limitation."
      icon={Wind} calculate={calculate} onClear={() => { setDaytimeSymptoms("2_3_week"); setNightSymptoms("1_2_week"); setRescueInhaler("2_3_week"); setActivityLimit("some"); setResult(null) }}
      values={[daytimeSymptoms, nightSymptoms, rescueInhaler, activityLimit]} result={result}
      seoContent={<SeoContentGenerator title="Asthma Control Score" description="ACT-based asthma symptom control assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Daytime Symptoms" val={daytimeSymptoms} set={setDaytimeSymptoms} options={[{ value: "never", label: "Never" }, { value: "1_week", label: "≤1 day/week" }, { value: "2_3_week", label: "2-3 days/week" }, { value: "most_days", label: "Most days" }, { value: "daily", label: "Every day" }]} />
        <SelectInput label="Night Symptoms" val={nightSymptoms} set={setNightSymptoms} options={[{ value: "never", label: "Never" }, { value: "1_month", label: "1-2 times/month" }, { value: "1_2_week", label: "1-2 times/week" }, { value: "2_3_week", label: "3+ times/week" }, { value: "nightly", label: "Every night" }]} />
        <SelectInput label="Rescue Inhaler Use" val={rescueInhaler} set={setRescueInhaler} options={[{ value: "never", label: "Never" }, { value: "1_week", label: "≤1 day/week" }, { value: "2_3_week", label: "2-3 days/week" }, { value: "1_day", label: "1-2 times/day" }, { value: "3_day", label: "3+ times/day" }]} />
        <SelectInput label="Activity Limitation" val={activityLimit} set={setActivityLimit} options={[{ value: "none", label: "None" }, { value: "slight", label: "Slight" }, { value: "some", label: "Some" }, { value: "a_lot", label: "A lot" }, { value: "total", label: "Cannot exercise" }]} />
      </div>} />
  )
}

// ─── 18. Allergy Symptom Score ────────────────────────────────────────────────
export function AllergySymptomScoreCalculator() {
  const [sneezing, setSneezing] = useState("moderate")
  const [congestion, setCongestion] = useState("moderate")
  const [skinReaction, setSkinReaction] = useState("mild")
  const [eyeIrritation, setEyeIrritation] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const scoreMap: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 }
    const s1 = scoreMap[sneezing] ?? 0
    const s2 = scoreMap[congestion] ?? 0
    const s3 = scoreMap[skinReaction] ?? 0
    const s4 = scoreMap[eyeIrritation] ?? 0

    const total = s1 + s2 + s3 + s4
    const maxScore = 12
    const severityPct = r0(clamp((total / maxScore) * 100, 0, 100))

    const classification = total <= 3 ? "Mild Allergies" : total <= 6 ? "Moderate Allergies" : total <= 9 ? "Severe Allergies" : "Very Severe Allergies"
    const seasonalClass = (s1 + s4) >= (s2 + s3) ? "Seasonal (rhinitis/conjunctivitis pattern)" : "Perennial/Contact (congestion/skin pattern)"
    const anaphylaxisWatch = total >= 10 ? "Yes — monitor for systemic reactions" : "Low"

    const status: 'good' | 'warning' | 'danger' = total <= 3 ? "good" : total <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Allergy Severity Score", value: `${total}/${maxScore}`, status, description: classification },
      healthScore: Math.max(5, r0(100 - severityPct)),
      metrics: [
        { label: "Severity Score", value: `${total}/${maxScore}`, status },
        { label: "Classification", value: classification, status },
        { label: "Severity %", value: severityPct, unit: "%", status },
        { label: "Pattern", value: seasonalClass, status: "normal" },
        { label: "Sneezing", value: sneezing, status: s1 <= 1 ? "good" : s1 <= 2 ? "warning" : "danger" },
        { label: "Congestion", value: congestion, status: s2 <= 1 ? "good" : s2 <= 2 ? "warning" : "danger" },
        { label: "Skin Reaction", value: skinReaction, status: s3 <= 1 ? "good" : s3 <= 2 ? "warning" : "danger" },
        { label: "Eye Irritation", value: eyeIrritation, status: s4 <= 1 ? "good" : s4 <= 2 ? "warning" : "danger" },
        { label: "Anaphylaxis Watch", value: anaphylaxisWatch, status: total >= 10 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Allergy Assessment", description: `Score: ${total}/${maxScore} (${classification}). Pattern: ${seasonalClass}. ${total > 6 ? "Severe — allergy testing (skin prick or specific IgE) recommended for targeted treatment." : "Manageable with OTC medications."} ${total >= 10 ? "SEVERE: Monitor for anaphylaxis signs (throat swelling, difficulty breathing, rapid pulse)." : ""}`, priority: "high", category: "Assessment" },
        { title: "Treatment", description: `1) ${s1 >= 2 || s4 >= 2 ? "Antihistamines (cetirizine, loratadine, fexofenadine) for sneezing/eye symptoms." : ""} 2) ${s2 >= 2 ? "Nasal corticosteroid spray (fluticasone, mometasone) for congestion — most effective." : ""} 3) ${s3 >= 2 ? "Topical antihistamines or corticosteroids for skin. Identify contact allergens." : ""} 4) ${s4 >= 2 ? "Antihistamine eye drops (ketotifen) for eye irritation." : ""} ${total > 8 ? "5) Consider immunotherapy (allergy shots/sublingual) for long-term control." : ""}`, priority: "high", category: "Treatment" },
        { title: "Prevention", description: "Allergen avoidance: keep windows closed during high pollen, HEPA air purifier, wash bedding weekly in hot water, shower after outdoor activities. Track pollen counts. Start prophylactic antihistamines before allergy season. Nasal saline rinse helps flush allergens.", priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Total": `${total}/${maxScore}`, "Sneeze": s1, "Congest": s2, "Skin": s3, "Eyes": s4, "Pattern": seasonalClass }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="allergy-symptom-score" title="Allergy Symptom Score"
      description="Quantify allergic reaction severity. Evaluates sneezing, congestion, skin reactions, and eye irritation."
      icon={AlertCircle} calculate={calculate} onClear={() => { setSneezing("moderate"); setCongestion("moderate"); setSkinReaction("mild"); setEyeIrritation("moderate"); setResult(null) }}
      values={[sneezing, congestion, skinReaction, eyeIrritation]} result={result}
      seoContent={<SeoContentGenerator title="Allergy Symptom Score" description="Assess allergy severity with symptom-based scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Sneezing Frequency" val={sneezing} set={setSneezing} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild (occasional)" }, { value: "moderate", label: "Moderate (frequent)" }, { value: "severe", label: "Severe (persistent)" }]} />
          <SelectInput label="Nasal Congestion" val={congestion} set={setCongestion} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe (can't breathe)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Skin Reaction" val={skinReaction} set={setSkinReaction} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild (itch)" }, { value: "moderate", label: "Moderate (hives)" }, { value: "severe", label: "Severe (widespread)" }]} />
          <SelectInput label="Eye Irritation" val={eyeIrritation} set={setEyeIrritation} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild (watery)" }, { value: "moderate", label: "Moderate (itchy/red)" }, { value: "severe", label: "Severe (swollen)" }]} />
        </div>
      </div>} />
  )
}

// ─── 19. Migraine Trigger Tracker ─────────────────────────────────────────────
export function MigraneTriggerTrackerCalculator() {
  const [sleepHours, setSleepHours] = useState(6)
  const [stressLevel, setStressLevel] = useState("high")
  const [caffeineIntake, setCaffeineIntake] = useState("high")
  const [foodTriggers, setFoodTriggers] = useState("some")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sleep = clamp(sleepHours, 3, 12)

    let triggers = 0
    let triggerFreqIndex = 0

    // Sleep trigger
    if (sleep < 6 || sleep > 9) { triggers++; triggerFreqIndex += 25 }
    else if (sleep < 7) { triggerFreqIndex += 10 }

    // Stress trigger
    if (stressLevel === "high") { triggers++; triggerFreqIndex += 30 }
    else if (stressLevel === "moderate") { triggerFreqIndex += 15 }

    // Caffeine trigger
    if (caffeineIntake === "high") { triggers++; triggerFreqIndex += 20 }
    else if (caffeineIntake === "withdrawal") { triggers++; triggerFreqIndex += 25 }
    else if (caffeineIntake === "moderate") { triggerFreqIndex += 10 }

    // Food triggers
    if (foodTriggers === "many") { triggers++; triggerFreqIndex += 25 }
    else if (foodTriggers === "some") { triggers++; triggerFreqIndex += 15 }

    triggerFreqIndex = r0(clamp(triggerFreqIndex, 5, 100))
    const migraineRiskProb = r0(clamp(triggerFreqIndex * 0.75, 5, 80))

    const label = triggerFreqIndex <= 25 ? "Low Trigger Load" : triggerFreqIndex <= 50 ? "Moderate Trigger Load" : "High Trigger Load"
    const status: 'good' | 'warning' | 'danger' = triggerFreqIndex <= 25 ? "good" : triggerFreqIndex <= 50 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Trigger Frequency Index", value: `${triggerFreqIndex}/100`, status, description: label },
      healthScore: Math.max(5, r0(100 - triggerFreqIndex)),
      metrics: [
        { label: "Trigger Index", value: triggerFreqIndex, unit: "/100", status },
        { label: "Active Triggers", value: `${triggers}/4`, status: triggers <= 1 ? "good" : triggers <= 2 ? "warning" : "danger" },
        { label: "Migraine Risk", value: migraineRiskProb, unit: "%", status: migraineRiskProb < 25 ? "good" : migraineRiskProb < 45 ? "warning" : "danger" },
        { label: "Sleep Factor", value: sleep < 6 || sleep > 9 ? "Trigger" : sleep < 7 ? "Borderline" : "OK", status: sleep >= 7 && sleep <= 9 ? "good" : sleep >= 6 ? "warning" : "danger" },
        { label: "Stress Factor", value: stressLevel, status: stressLevel === "low" ? "good" : stressLevel === "moderate" ? "warning" : "danger" },
        { label: "Caffeine Factor", value: caffeineIntake, status: caffeineIntake === "low" || caffeineIntake === "none" ? "good" : caffeineIntake === "moderate" ? "warning" : "danger" },
        { label: "Food Triggers", value: foodTriggers, status: foodTriggers === "none" ? "good" : foodTriggers === "some" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Migraine Trigger Analysis", description: `Trigger frequency index: ${triggerFreqIndex}/100 (${label}). Active triggers: ${triggers}/4. Migraine probability: ${migraineRiskProb}%. ${triggers >= 3 ? "MULTIPLE TRIGGERS — addressing even 1-2 can significantly reduce migraine frequency." : ""}`, priority: "high", category: "Assessment" },
        { title: "Trigger Management", description: `${sleep < 7 ? "SLEEP: Aim for 7-8 hours, consistent schedule (irregular sleep is top trigger). " : ""}${stressLevel === "high" ? "STRESS: Progressive muscle relaxation, CBT for migraines, mindfulness meditation shown to reduce frequency 40-50%. " : ""}${caffeineIntake === "high" ? "CAFFEINE: Gradually reduce to ≤200mg/day. Sudden withdrawal triggers migraines. " : caffeineIntake === "withdrawal" ? "CAFFEINE WITHDRAWAL: Resume small consistent amount or taper slowly. " : ""}${foodTriggers !== "none" ? "FOOD: Common triggers — aged cheese, chocolate, MSG, nitrates, alcohol (especially red wine). Keep food diary for 4 weeks." : ""}`, priority: "high", category: "Management" },
        { title: "Prevention Strategies", description: "Migraine diary essential — track triggers, aura, duration, severity. If ≥4 migraines/month, discuss prophylactic therapy (propranolol, topiramate, amitriptyline, CGRP inhibitors). Hydration: dehydration is underrated trigger. Regular meals (don't skip). Magnesium 400mg/day may reduce frequency. B2 (riboflavin) 400mg/day.", priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Index": `${triggerFreqIndex}/100`, "Triggers": `${triggers}/4`, "Risk": `${migraineRiskProb}%`, "Sleep": `${sleep}h`, "Stress": stressLevel, "Caffeine": caffeineIntake }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="migraine-trigger-tracker" title="Migraine Trigger Tracker"
      description="Identify and quantify migraine triggers. Analyzes sleep, stress, caffeine, and food trigger patterns."
      icon={Brain} calculate={calculate} onClear={() => { setSleepHours(6); setStressLevel("high"); setCaffeineIntake("high"); setFoodTriggers("some"); setResult(null) }}
      values={[sleepHours, stressLevel, caffeineIntake, foodTriggers]} result={result}
      seoContent={<SeoContentGenerator title="Migraine Trigger Tracker" description="Identify migraine triggers and risk probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Average Sleep Hours" val={sleepHours} set={setSleepHours} min={3} max={12} step={0.5} suffix="hours" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Stress Level" val={stressLevel} set={setStressLevel} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
          <SelectInput label="Caffeine Intake" val={caffeineIntake} set={setCaffeineIntake} options={[{ value: "none", label: "None" }, { value: "low", label: "Low (1 cup)" }, { value: "moderate", label: "Moderate (2-3 cups)" }, { value: "high", label: "High (4+ cups)" }, { value: "withdrawal", label: "Recent Withdrawal" }]} />
        </div>
        <SelectInput label="Food Triggers" val={foodTriggers} set={setFoodTriggers} options={[{ value: "none", label: "None identified" }, { value: "some", label: "Some triggers" }, { value: "many", label: "Many triggers" }]} />
      </div>} />
  )
}

// ─── 20. CRP Interpreter ──────────────────────────────────────────────────────
export function CRPInterpreterCalculator() {
  const [crpLevel, setCrpLevel] = useState(3.5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const crp = clamp(crpLevel, 0, 50)

    const classification = crp < 1 ? "Low Inflammation" : crp <= 3 ? "Moderate Risk" : crp <= 10 ? "High Cardiovascular Risk" : "Acute Inflammation/Infection"
    const chronicIndex = r0(clamp(crp < 1 ? 10 : crp <= 3 ? 30 : crp <= 10 ? 60 : 90, 5, 95))
    const cvRisk = crp < 1 ? "Low" : crp <= 3 ? "Moderate" : "High"
    const cvRiskPct = r0(crp < 1 ? 8 : crp <= 3 ? 18 : crp <= 10 ? 30 : 45)

    const status: 'good' | 'warning' | 'danger' = crp < 1 ? "good" : crp <= 3 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "CRP Level", value: `${crp} mg/L`, status, description: classification },
      healthScore: Math.max(5, r0(100 - chronicIndex)),
      metrics: [
        { label: "CRP", value: crp, unit: "mg/L", status },
        { label: "Classification", value: classification, status },
        { label: "CV Risk Category", value: cvRisk, status },
        { label: "CV Risk", value: cvRiskPct, unit: "%", status: cvRiskPct < 15 ? "good" : cvRiskPct < 25 ? "warning" : "danger" },
        { label: "Chronic Index", value: chronicIndex, unit: "/100", status: chronicIndex < 30 ? "good" : chronicIndex < 60 ? "warning" : "danger" },
        { label: "Infection Likely", value: crp > 10 ? "Yes — rule out acute infection" : "No", status: crp > 10 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "CRP Interpretation", description: `CRP: ${crp} mg/L (${classification}). ${crp > 10 ? "CRP >10 suggests ACUTE infection or inflammation — not useful for CV risk until resolved. Repeat in 2-4 weeks." : crp > 3 ? "HIGH CV risk. hs-CRP 3-10 mg/L significantly increases heart attack and stroke risk. Consider statin therapy discussion." : crp > 1 ? "MODERATE risk. Lifestyle modifications can lower CRP." : "LOW inflammation — excellent cardiovascular marker."} Chronic inflammation index: ${chronicIndex}/100.`, priority: "high", category: "Interpretation" },
        { title: "Reduce Inflammation", description: `${crp > 1 ? "Anti-inflammatory strategies: 1) Mediterranean diet (strongest dietary evidence). 2) Exercise 150+ min/week (lowers CRP 20-30%). 3) Weight loss (adipose tissue produces CRP). 4) Omega-3 fatty acids (fish oil 2-4g/day). 5) Sleep 7-9 hours. 6) Stress reduction. 7) Quit smoking. " : "Maintain current lifestyle. "}${crp > 3 ? "Statins reduce CRP independent of cholesterol — discuss with physician." : ""}`, priority: "high", category: "Treatment" },
        { title: "Cardiovascular Screening", description: `${crp > 3 ? "Full lipid panel, fasting glucose, BP check recommended. CRP adds prognostic value beyond traditional risk factors." : "Routine annual screening sufficient."} CRP is best measured twice, 2 weeks apart, for accurate baseline. AHA/CDC: hs-CRP useful for intermediate-risk patients to guide statin therapy decisions.`, priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "CRP": `${crp} mg/L`, "Class": classification, "CV Risk": `${cvRiskPct}%`, "Chronic Index": chronicIndex }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="inflammation-crp-interpreter" title="CRP Interpreter"
      description="Interpret C-reactive protein levels for cardiovascular risk and inflammation severity assessment."
      icon={Thermometer} calculate={calculate} onClear={() => { setCrpLevel(3.5); setResult(null) }}
      values={[crpLevel]} result={result}
      seoContent={<SeoContentGenerator title="CRP Interpreter" description="C-reactive protein clinical interpretation for cardiovascular risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="CRP Level (hs-CRP)" val={crpLevel} set={setCrpLevel} min={0} max={50} step={0.1} suffix="mg/L" />
      </div>} />
  )
}

// ─── 21. Framingham Risk Score ────────────────────────────────────────────────
export function FraminghamRiskScoreCalculator() {
  const [age, setAge] = useState(55)
  const [totalChol, setTotalChol] = useState(220)
  const [hdl, setHdl] = useState(45)
  const [systolicBP, setSystolicBP] = useState(140)
  const [bpTreated, setBpTreated] = useState("no")
  const [smoking, setSmoking] = useState("no")
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 30, 79)
    const chol = clamp(totalChol, 100, 400)
    const h = clamp(hdl, 20, 100)
    const bp = clamp(systolicBP, 90, 200)

    // Simplified Framingham points
    let points = 0
    // Age
    if (gender === "male") {
      if (a >= 70) points += 13; else if (a >= 65) points += 12; else if (a >= 60) points += 11; else if (a >= 55) points += 10; else if (a >= 50) points += 8; else if (a >= 45) points += 6; else if (a >= 40) points += 3; else points += 0
    } else {
      if (a >= 70) points += 14; else if (a >= 65) points += 13; else if (a >= 60) points += 11; else if (a >= 55) points += 9; else if (a >= 50) points += 7; else if (a >= 45) points += 5; else if (a >= 40) points += 2; else points += 0
    }
    // Cholesterol
    if (chol >= 280) points += 3; else if (chol >= 240) points += 2; else if (chol >= 200) points += 1
    // HDL
    if (h < 35) points += 2; else if (h < 45) points += 1; else if (h >= 60) points -= 1
    // BP
    if (bpTreated === "yes") {
      if (bp >= 160) points += 4; else if (bp >= 150) points += 3; else if (bp >= 140) points += 2; else if (bp >= 130) points += 1
    } else {
      if (bp >= 160) points += 3; else if (bp >= 150) points += 2; else if (bp >= 140) points += 1
    }
    // Smoking
    if (smoking === "yes") points += 3

    const normalizedPts = clamp(points, 0, 25)
    const riskPct = r1(clamp(normalizedPts < 5 ? 2 : normalizedPts < 8 ? 5 : normalizedPts < 11 ? 10 : normalizedPts < 14 ? 15 : normalizedPts < 17 ? 20 : normalizedPts < 20 ? 25 : 30, 1, 35))
    const heartAttackProb = r0(clamp(riskPct * 0.6, 1, 25))

    const label = riskPct < 10 ? "Low Risk" : riskPct < 20 ? "Intermediate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = riskPct < 10 ? "good" : riskPct < 20 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "10-Year CHD Risk", value: `${riskPct}%`, status, description: `${label} — Framingham Score: ${normalizedPts} pts` },
      healthScore: Math.max(5, r0(100 - riskPct * 3)),
      metrics: [
        { label: "Framingham Risk", value: riskPct, unit: "%", status },
        { label: "Points", value: normalizedPts, status },
        { label: "Risk Category", value: label, status },
        { label: "Heart Attack Probability", value: heartAttackProb, unit: "%", status: heartAttackProb < 8 ? "good" : heartAttackProb < 15 ? "warning" : "danger" },
        { label: "Cholesterol", value: chol, unit: "mg/dL", status: chol < 200 ? "good" : chol < 240 ? "warning" : "danger" },
        { label: "HDL", value: h, unit: "mg/dL", status: h >= 60 ? "good" : h >= 40 ? "warning" : "danger" },
        { label: "Blood Pressure", value: bp, unit: "mmHg", status: bp < 130 ? "good" : bp < 140 ? "warning" : "danger" },
        { label: "Smoking", value: smoking === "yes" ? "Current" : "No", status: smoking === "yes" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Cardiovascular Risk", description: `Framingham 10-year CHD risk: ${riskPct}% (${label}). Heart attack probability: ${heartAttackProb}%. ${riskPct >= 20 ? "HIGH RISK — aggressive risk factor modification + statin therapy strongly recommended." : riskPct >= 10 ? "Intermediate risk — consider statin if LDL >130 or additional risk factors." : "Low risk — maintain healthy lifestyle."}`, priority: "high", category: "Assessment" },
        { title: "Risk Reduction", description: `Modifiable factors: ${smoking === "yes" ? "QUIT SMOKING (reduces risk 50% in 1 year). " : ""}${chol >= 200 ? "Lower cholesterol — statins reduce CHD events 25-35%. " : ""}${h < 40 ? "Raise HDL — exercise, healthy fats. " : ""}${bp >= 140 ? "Lower BP — each 10mmHg reduction = 20-25% less CHD. " : ""}Exercise 150 min/week. Mediterranean diet. Maintain healthy weight.`, priority: "high", category: "Prevention" },
        { title: "Clinical Guidance", description: `${riskPct >= 20 ? "Start statin, aspirin (if indicated), BP med to target <130/80." : riskPct >= 10 ? "Lipid panel, fasting glucose, consider coronary calcium score for reclassification." : "Repeat Framingham assessment every 5 years."} Framingham is gold-standard for primary prevention decision-making in cardiology.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Points": normalizedPts, "Chol": chol, "HDL": h, "BP": bp, "MI Prob": `${heartAttackProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="framingham-risk-score" title="Framingham Risk Score"
      description="Calculate 10-year coronary heart disease risk using the Framingham model with age, cholesterol, HDL, BP, and smoking."
      icon={Heart} calculate={calculate} onClear={() => { setAge(55); setTotalChol(220); setHdl(45); setSystolicBP(140); setBpTreated("no"); setSmoking("no"); setGender("male"); setResult(null) }}
      values={[age, totalChol, hdl, systolicBP, bpTreated, smoking, gender]} result={result}
      seoContent={<SeoContentGenerator title="Framingham Risk Score" description="10-year coronary heart disease risk calculator." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={30} max={79} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalChol} set={setTotalChol} min={100} max={400} suffix="mg/dL" />
          <NumInput label="HDL Cholesterol" val={hdl} set={setHdl} min={20} max={100} suffix="mg/dL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic Blood Pressure" val={systolicBP} set={setSystolicBP} min={90} max={200} suffix="mmHg" />
          <SelectInput label="BP Treated" val={bpTreated} set={setBpTreated} options={[{ value: "no", label: "Untreated" }, { value: "yes", label: "On BP Medication" }]} />
        </div>
        <SelectInput label="Smoking Status" val={smoking} set={setSmoking} options={[{ value: "no", label: "Non-smoker" }, { value: "yes", label: "Current Smoker" }]} />
      </div>} />
  )
}

// ─── 22. ASCVD Risk Calculator ────────────────────────────────────────────────
export function ASCVDRiskCalculator() {
  const [age, setAge] = useState(55)
  const [totalChol, setTotalChol] = useState(210)
  const [hdl, setHdl] = useState(50)
  const [systolicBP, setSystolicBP] = useState(135)
  const [diabetes, setDiabetes] = useState("no")
  const [smoking, setSmoking] = useState("no")
  const [gender, setGender] = useState("male")
  const [bpTreated, setBpTreated] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 40, 79)
    const chol = clamp(totalChol, 100, 400)
    const h = clamp(hdl, 20, 100)
    const bp = clamp(systolicBP, 90, 200)

    // Simplified pooled cohort equation proxy
    let risk = 0
    const lnAge = Math.log(a)
    const lnChol = Math.log(chol)
    const lnHDL = Math.log(h)
    const lnBP = Math.log(bp)

    if (gender === "male") {
      const xb = 12.344 * lnAge + 11.853 * lnChol - 2.664 * lnHDL + (bpTreated === "yes" ? 1.797 : 1.764) * lnBP + (smoking === "yes" ? 7.837 : 0) + (diabetes === "yes" ? 0.658 : 0) - 61.18
      risk = 1 - Math.pow(0.9144, Math.exp(xb))
    } else {
      const xb = -29.799 * lnAge + 13.54 * lnChol + 0.198 * Math.pow(lnAge, 2) - 5.06 * lnHDL + (bpTreated === "yes" ? 2.019 : 1.957) * lnBP + (smoking === "yes" ? 7.574 : 0) + (diabetes === "yes" ? 0.661 : 0) + 29.18
      risk = 1 - Math.pow(0.9665, Math.exp(xb))
    }

    const riskPct = r1(clamp(risk * 100, 1, 50))
    const statinRecommend = riskPct >= 7.5 ? "Statin therapy recommended" : riskPct >= 5 ? "Consider statin — discuss with patient" : "Statin not indicated by risk alone"

    const label = riskPct < 5 ? "Low Risk" : riskPct < 7.5 ? "Borderline Risk" : riskPct < 20 ? "Intermediate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = riskPct < 5 ? "good" : riskPct < 7.5 ? "warning" : riskPct < 20 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "10-Year ASCVD Risk", value: `${riskPct}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - riskPct * 3)),
      metrics: [
        { label: "ASCVD Risk", value: riskPct, unit: "%", status },
        { label: "Risk Category", value: label, status },
        { label: "Statin Recommendation", value: statinRecommend, status: riskPct >= 7.5 ? "danger" : riskPct >= 5 ? "warning" : "good" },
        { label: "Cholesterol", value: chol, unit: "mg/dL", status: chol < 200 ? "good" : chol < 240 ? "warning" : "danger" },
        { label: "HDL", value: h, unit: "mg/dL", status: h >= 60 ? "good" : h >= 40 ? "warning" : "danger" },
        { label: "Blood Pressure", value: bp, unit: "mmHg", status: bp < 130 ? "good" : bp < 140 ? "warning" : "danger" },
        { label: "Diabetes", value: diabetes === "yes" ? "Yes" : "No", status: diabetes === "yes" ? "danger" : "good" },
        { label: "Smoking", value: smoking === "yes" ? "Yes" : "No", status: smoking === "yes" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "ASCVD Risk Assessment", description: `10-year ASCVD risk: ${riskPct}% (${label}). ${riskPct >= 20 ? "HIGH RISK — high-intensity statin (atorvastatin 40-80mg, rosuvastatin 20-40mg) strongly recommended." : riskPct >= 7.5 ? "Moderate-to-high risk — moderate/high-intensity statin recommended per AHA/ACC guidelines." : riskPct >= 5 ? "Borderline — coronary calcium score may help reclassify risk." : "Low risk — lifestyle optimization."}`, priority: "high", category: "Assessment" },
        { title: "Statin Decision", description: `${statinRecommend}. AHA/ACC 2018 guidelines: statin for ASCVD ≥7.5% (class I). For 5-7.5%: risk enhancers (family history, hs-CRP >2, CAC >0) favor treatment. ${diabetes === "yes" ? "Diabetes alone is a statin indication if age 40-75." : ""} LDL target: <100 (or <70 if high risk).`, priority: "high", category: "Treatment" },
        { title: "Risk Enhancers", description: `Check for risk-enhancing factors: family history of premature ASCVD, hs-CRP ≥2mg/L, Lp(a) ≥50 mg/dL, ABI <0.9, metabolic syndrome. These tip borderline patients toward treatment. Coronary artery calcium (CAC) score is most powerful adjunct: CAC=0 may defer statin, CAC≥100 strongly favors statin.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "ASCVD": `${riskPct}%`, "Chol": chol, "HDL": h, "BP": bp, "DM": diabetes, "Smoking": smoking, "Statin": statinRecommend.split(" ")[0] }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ascvd-risk-calculator" title="ASCVD Risk Calculator"
      description="Calculate 10-year atherosclerotic cardiovascular disease risk. Pooled cohort equation for heart attack and stroke prediction."
      icon={Heart} calculate={calculate} onClear={() => { setAge(55); setTotalChol(210); setHdl(50); setSystolicBP(135); setDiabetes("no"); setSmoking("no"); setGender("male"); setBpTreated("no"); setResult(null) }}
      values={[age, totalChol, hdl, systolicBP, diabetes, smoking, gender, bpTreated]} result={result}
      seoContent={<SeoContentGenerator title="ASCVD Risk Calculator" description="10-year atherosclerotic cardiovascular disease risk with statin guidance." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={40} max={79} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalChol} set={setTotalChol} min={100} max={400} suffix="mg/dL" />
          <NumInput label="HDL" val={hdl} set={setHdl} min={20} max={100} suffix="mg/dL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={systolicBP} set={setSystolicBP} min={90} max={200} suffix="mmHg" />
          <SelectInput label="BP Treatment" val={bpTreated} set={setBpTreated} options={[{ value: "no", label: "Untreated" }, { value: "yes", label: "On Medication" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Smoking" val={smoking} set={setSmoking} options={[{ value: "no", label: "Non-smoker" }, { value: "yes", label: "Current Smoker" }]} />
        </div>
      </div>} />
  )
}
