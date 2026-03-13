"use client"
import { useState } from "react"
import { Activity, Dumbbell, Target, Zap, TrendingUp, Shield } from "lucide-react"
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

// ─── 55. Basketball Calories Calculator ───────────────────────────────────────
export function BasketballCaloriesCalculator() {
  const [duration, setDuration] = useState(60)
  const [playType, setPlayType] = useState("full-court")
  const [weight, setWeight] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 180)
    const w = clamp(weight, 30, 200)

    const met = playType === "full-court" ? 8.0 : playType === "half-court" ? 6.5 : 4.5
    const calories = r0(met * 3.5 * w / 200 * dur)
    const jumpFreq = playType === "full-court" ? r0(dur * 0.8) : r0(dur * 0.4) // jumps per session
    const ankleRisk = jumpFreq > 50 ? "Elevated" : jumpFreq > 25 ? "Moderate" : "Low"
    const ankleProb = jumpFreq > 50 ? r0(18 + jumpFreq * 0.1) : jumpFreq > 25 ? r0(8 + jumpFreq * 0.1) : r0(4)

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${playType.replace("-", " ")} — ${dur} min` },
      healthScore: r0(Math.min(100, calories / 5)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Play Type", value: playType.replace("-", " "), status: "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Est. Jump Frequency", value: jumpFreq, unit: "jumps", status: "normal" },
        { label: "Ankle Injury Risk", value: `${ankleProb}% (${ankleRisk})`, status: ankleRisk === "Low" ? "good" : ankleRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Basketball Analysis", description: `${calories} kcal in ${dur} min ${playType.replace("-", " ")} (${met} METs). ${playType === "full-court" ? "Full-court basketball is a high-intensity interval sport with sprint/recovery cycles." : "Half-court is lower intensity but still excellent for cardiovascular fitness."} ~${jumpFreq} jumps per session builds explosive power.`, priority: "high", category: "Assessment" },
        { title: "Ankle Protection", description: `Risk: ${ankleRisk} (${ankleProb}%). Ankle sprains are the #1 basketball injury (25% of all injuries). ${ankleRisk !== "Low" ? "Use high-top shoes with ankle support, tape or brace if previous sprains. Strengthen peroneals with resistance band eversion exercises. Land on both feet after rebounds." : "Low volume — maintain ankle proprioception work."}`, priority: "high", category: "Clinical" },
        { title: "ACL & Knee Load", description: `Jumping and cutting increase ACL loading. ${jumpFreq > 40 ? "High jump frequency — strengthen hamstrings (Nordic curls) and single-leg stability. Female players: ACL injury rate 2-8x higher — targeted neuromuscular training recommended." : "Moderate load. Standard strength training supports knee health."}`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Play Type": playType.replace("-", " "), "Duration": `${dur} min`, "MET": met, "Calories": calories, "Jumps": jumpFreq, "Ankle Risk": `${ankleProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="basketball-calories" title="Basketball Calories Calculator"
      description="Calculate calories burned playing basketball with jump frequency analysis and ankle injury risk assessment."
      icon={Activity} calculate={calculate} onClear={() => { setDuration(60); setPlayType("full-court"); setWeight(80); setResult(null) }}
      values={[duration, playType, weight]} result={result}
      seoContent={<SeoContentGenerator title="Basketball Calories Calculator" description="Estimate calories burned playing basketball." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Duration" val={duration} set={setDuration} min={10} max={180} suffix="minutes" />
        <SelectInput label="Play Type" val={playType} set={setPlayType} options={[{ value: "full-court", label: "Full Court Game" }, { value: "half-court", label: "Half Court" }, { value: "shooting", label: "Shooting Practice" }]} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 56. Soccer Calories Calculator ───────────────────────────────────────────
export function SoccerCaloriesCalculator() {
  const [duration, setDuration] = useState(90)
  const [intensity, setIntensity] = useState("match")
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 15, 180)
    const w = clamp(weight, 30, 200)

    const met = intensity === "match" ? 10.0 : intensity === "training" ? 7.0 : 5.0
    const calories = r0(met * 3.5 * w / 200 * dur)
    const sprintLoad = intensity === "match" ? r0(dur * 0.15) : r0(dur * 0.08)
    const totalDist = intensity === "match" ? r1(dur / 90 * 10.5) : r1(dur / 90 * 7)

    // Hamstring strain risk
    const hamRisk = sprintLoad > 15 ? "Elevated" : sprintLoad > 8 ? "Moderate" : "Low"
    const hamProb = sprintLoad > 15 ? r0(18 + sprintLoad * 0.3) : sprintLoad > 8 ? r0(8 + sprintLoad * 0.3) : r0(4)

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${intensity} — ${dur} min` },
      healthScore: r0(Math.min(100, calories / 6)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Est. Distance", value: totalDist, unit: "km", status: "normal" },
        { label: "Sprint Load", value: sprintLoad, unit: "min", status: "normal" },
        { label: "Hamstring Strain Risk", value: `${hamProb}% (${hamRisk})`, status: hamRisk === "Low" ? "good" : hamRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Soccer Analysis", description: `${calories} kcal in ${dur} min (${met} METs). Coverage: ~${totalDist} km. ${intensity === "match" ? "Match play is high-intensity interval: 15% sprinting, 40% jogging, 25% walking, 20% standing. Burns 800-1200 kcal for 90 min." : "Training intensity is more controlled but still excellent conditioning."}`, priority: "high", category: "Assessment" },
        { title: "Hamstring Protection", description: `Risk: ${hamRisk} (${hamProb}%). ${hamRisk !== "Low" ? "Hamstring injuries account for 12-16% of all soccer injuries. Risk peaks in the last 15 min of each half (fatigue). Nordic hamstring exercises reduce injury by 51-60%. Sprint training builds posterior chain resilience." : "Low sprint demand — standard hamstring maintenance sufficient."}`, priority: "high", category: "Clinical" },
        { title: "Recovery & Nutrition", description: `At ${calories} kcal expenditure, replenish with 1.2g/kg carbs within 30 min post-match. Electrolyte replacement: 500-700mg sodium/hour during play. ${dur > 60 ? "Hydrate at half-time. In-game fueling: sports drink every 15-20 min." : "Pre-hydrate and refuel after."}`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Intensity": intensity, "Duration": `${dur} min`, "Distance": `${totalDist} km`, "MET": met, "Calories": calories, "Ham Risk": `${hamProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="soccer-calories-burned" title="Soccer Calories Calculator"
      description="Calculate calories burned playing soccer with sprint load analysis and hamstring strain risk."
      icon={Activity} calculate={calculate} onClear={() => { setDuration(90); setIntensity("match"); setWeight(75); setResult(null) }}
      values={[duration, intensity, weight]} result={result}
      seoContent={<SeoContentGenerator title="Soccer Calories Calculator" description="Estimate calories burned playing soccer." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Duration" val={duration} set={setDuration} min={15} max={180} suffix="minutes" />
        <SelectInput label="Intensity" val={intensity} set={setIntensity} options={[{ value: "match", label: "Match / Game" }, { value: "training", label: "Training / Practice" }, { value: "casual", label: "Casual / Recreational" }]} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 57. Golf Calories Calculator ─────────────────────────────────────────────
export function GolfCaloriesCalculator() {
  const [holes, setHoles] = useState(18)
  const [transport, setTransport] = useState("walking")
  const [weight, setWeight] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(holes, 9, 36)
    const w = clamp(weight, 30, 200)

    const durationPerHole = transport === "walking" ? 14 : transport === "walking-carry" ? 13 : 10
    const dur = h * durationPerHole
    const met = transport === "walking-carry" ? 5.3 : transport === "walking" ? 4.3 : 3.5
    const calories = r0(met * 3.5 * w / 200 * dur)

    // Steps estimate
    const stepsPerHole = transport === "walking" ? 800 : transport === "walking-carry" ? 850 : 300
    const totalSteps = h * stepsPerHole

    // Lower back stress from swing
    const backStress = h > 18 ? "Moderate" : "Low"
    const backProb = r0(5 + h * 0.3)

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${h} holes — ${transport.replace("-", " ")}` },
      healthScore: r0(Math.min(100, calories / 5)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Duration", value: r0(dur), unit: "min", status: "normal" },
        { label: "Holes", value: h, status: "normal" },
        { label: "Est. Steps", value: totalSteps.toLocaleString(), status: totalSteps > 10000 ? "good" : "normal" },
        { label: "Transport", value: transport.replace("-", " "), status: "normal" },
        { label: "Lower Back Stress", value: `${backProb}% (${backStress})`, status: backStress === "Low" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Golf Analysis", description: `${calories} kcal over ${h} holes (~${r0(dur)} min). ${transport === "walking-carry" ? "Walking with bag is the highest calorie option — carrying 10-15kg adds 20% expenditure." : transport === "walking" ? "Walking with cart/caddy still provides excellent step count." : "Cart reduces steps significantly — walk when possible for health benefits."} Steps: ~${totalSteps.toLocaleString()}.`, priority: "high", category: "Assessment" },
        { title: "Lower Back Protection", description: `Stress: ${backStress} (${backProb}%). Golf swing generates 8× body weight compression on L4-L5. ${h > 18 ? "Extended play increases fatigue-related swing flaws. Warm up with hip rotations and cat-cow stretches. Core stability exercises (dead bugs, pallof press) protect the spine." : "Standard round — warm up properly and maintain posture through the round."}`, priority: "high", category: "Clinical" },
        { title: "Walking Benefits", description: `${transport.includes("walking") ? `Walking golf provides sustained low-intensity exercise (${met} METs) for ${r0(dur)} minutes — excellent for heart health and metabolic conditioning. Add 10,000+ steps/round.` : "Consider walking at least some holes for cardiovascular benefit. Even 9 holes walking adds 6,000+ steps."}`, priority: "medium", category: "Benefits" }
      ],
      detailedBreakdown: { "Holes": h, "Transport": transport.replace("-", " "), "Duration": `${r0(dur)} min`, "MET": met, "Calories": calories, "Steps": totalSteps.toLocaleString() }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="golf-calories-calculator" title="Golf Calories Calculator"
      description="Calculate calories burned playing golf with step estimation and lower back stress analysis."
      icon={Target} calculate={calculate} onClear={() => { setHoles(18); setTransport("walking"); setWeight(80); setResult(null) }}
      values={[holes, transport, weight]} result={result}
      seoContent={<SeoContentGenerator title="Golf Calories Calculator" description="Calculate calories burned playing golf." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Holes" val={holes} set={setHoles} min={9} max={36} />
        <SelectInput label="Transport" val={transport} set={setTransport} options={[{ value: "walking", label: "Walking (with pull cart)" }, { value: "walking-carry", label: "Walking (carrying bag)" }, { value: "cart", label: "Golf Cart" }]} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 58. Advanced Bench Press Calculator ──────────────────────────────────────
export function AdvancedBenchPressCalculator() {
  const [weight, setWeight] = useState(80)
  const [reps, setReps] = useState(5)
  const [bodyWeight, setBodyWeight] = useState(80)
  const [gender, setGender] = useState("male")
  const [experience, setExperience] = useState("intermediate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 300)
    const r = clamp(reps, 1, 30)
    const bw = clamp(bodyWeight, 30, 200)

    // Epley 1RM formula
    const oneRM = r === 1 ? w : r0(w * (1 + r / 30))
    const ratio = r2(oneRM / bw)

    // percentages
    const p95 = r0(oneRM * 0.95)
    const p90 = r0(oneRM * 0.9)
    const p80 = r0(oneRM * 0.8)
    const p70 = r0(oneRM * 0.7)

    // Strength standards (relative to bodyweight, male basis)
    const genderMul = gender === "female" ? 0.6 : 1.0
    const beginner = r0(bw * 0.5 * genderMul)
    const inter = r0(bw * 1.0 * genderMul)
    const advanced = r0(bw * 1.5 * genderMul)
    const elite = r0(bw * 2.0 * genderMul)

    let level = "Beginner"
    if (oneRM >= elite) level = "Elite"
    else if (oneRM >= advanced) level = "Advanced"
    else if (oneRM >= inter) level = "Intermediate"

    // Shoulder overload risk
    const shoulderRisk = ratio > 1.8 ? "Elevated" : ratio > 1.3 ? "Moderate" : "Low"
    const shoulderProb = ratio > 1.8 ? r0(20 + ratio * 5) : ratio > 1.3 ? r0(10 + ratio * 3) : r0(5)

    let status: 'good' | 'warning' | 'danger' | 'normal' = level === "Elite" || level === "Advanced" ? "good" : level === "Intermediate" ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "Estimated 1RM", value: `${oneRM} kg`, status, description: `${level} — ${ratio}× bodyweight` },
      healthScore: r0(Math.min(100, ratio * 45)),
      metrics: [
        { label: "1RM (Epley)", value: oneRM, unit: "kg", status },
        { label: "Strength Ratio", value: ratio, unit: "× BW", status: ratio >= 1.5 ? "good" : ratio >= 1.0 ? "normal" : "warning" },
        { label: "Strength Level", value: level, status },
        { label: "95% 1RM", value: p95, unit: "kg", status: "normal" },
        { label: "90% 1RM", value: p90, unit: "kg", status: "normal" },
        { label: "80% 1RM", value: p80, unit: "kg", status: "normal" },
        { label: "70% 1RM", value: p70, unit: "kg", status: "normal" },
        { label: "Shoulder Overload Risk", value: `${shoulderProb}% (${shoulderRisk})`, status: shoulderRisk === "Low" ? "good" : shoulderRisk === "Moderate" ? "warning" : "danger" },
        { label: "Beginner Standard", value: beginner, unit: "kg", status: "normal" },
        { label: "Intermediate Standard", value: inter, unit: "kg", status: "normal" },
        { label: "Advanced Standard", value: advanced, unit: "kg", status: "normal" },
        { label: "Elite Standard", value: elite, unit: "kg", status: "normal" }
      ],
      recommendations: [
        { title: "Bench Press Analysis", description: `1RM: ${oneRM}kg (${ratio}× BW). Level: ${level}. ${level === "Beginner" ? "Focus on technique: retracted scapulae, arch, leg drive. Train 3×/week with linear progression." : level === "Intermediate" ? "Implement periodization: heavy singles at 90%+, volume days at 70-80%. Consider Wendler 5/3/1 or Texas Method." : "Advanced/Elite level. Peaking protocols, competition prep. Focus on weak points: pause bench, close-grip, incline work."}`, priority: "high", category: "Assessment" },
        { title: "Shoulder Risk Management", description: `Risk: ${shoulderRisk} (${shoulderProb}%). ${shoulderRisk !== "Low" ? "Heavy bench pressing loads anterior deltoid and pec minor, creating shoulder impingement risk. Balance with: 2:1 pull-to-push ratio, face pulls every session, external rotation work." : "Low risk at current loading. Maintain balanced pressing and pulling volume."}`, priority: "high", category: "Clinical" },
        { title: "Training Percentages", description: `Use these for programming: Strength (1-5 reps at ${p90}-${p95}kg), Hypertrophy (8-12 reps at ${p70}-${p80}kg), Power (3-5 reps explosive at ${p70}-${p80}kg). Deload every 4th week at 50-60% intensity.`, priority: "medium", category: "Programming" }
      ],
      detailedBreakdown: { "Weight×Reps": `${w}kg × ${r}`, "1RM": `${oneRM}kg`, "Ratio": `${ratio}× BW`, "Level": level, "Shoulder Risk": `${shoulderProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bench-press-calculator" title="Advanced Bench Press Calculator"
      description="Calculate your bench press 1RM with Epley formula, strength standards, shoulder overload risk, and training percentages."
      icon={Dumbbell} calculate={calculate} onClear={() => { setWeight(80); setReps(5); setBodyWeight(80); setGender("male"); setExperience("intermediate"); setResult(null) }}
      values={[weight, reps, bodyWeight, gender, experience]} result={result}
      seoContent={<SeoContentGenerator title="Bench Press Calculator" description="Calculate your bench press 1RM." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight Lifted" val={weight} set={setWeight} min={20} max={300} suffix="kg" />
          <NumInput label="Reps Completed" val={reps} set={setReps} min={1} max={30} />
        </div>
        <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} step={0.1} suffix="kg" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <SelectInput label="Experience" val={experience} set={setExperience} options={[{ value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }]} />
        </div>
      </div>} />
  )
}

// ─── 59. Advanced Squat Strength Calculator ───────────────────────────────────
export function AdvancedSquatStrengthCalculator() {
  const [weight, setWeight] = useState(100)
  const [reps, setReps] = useState(5)
  const [bodyWeight, setBodyWeight] = useState(80)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 400)
    const r = clamp(reps, 1, 30)
    const bw = clamp(bodyWeight, 30, 200)

    const oneRM = r === 1 ? w : r0(w * (1 + r / 30))
    const ratio = r2(oneRM / bw)
    const p90 = r0(oneRM * 0.9)
    const p80 = r0(oneRM * 0.8)
    const p70 = r0(oneRM * 0.7)

    const genderMul = gender === "female" ? 0.65 : 1.0
    const beginner = r0(bw * 0.75 * genderMul)
    const inter = r0(bw * 1.25 * genderMul)
    const advanced = r0(bw * 1.75 * genderMul)
    const elite = r0(bw * 2.5 * genderMul)

    let level = "Beginner"
    if (oneRM >= elite) level = "Elite"
    else if (oneRM >= advanced) level = "Advanced"
    else if (oneRM >= inter) level = "Intermediate"

    // Knee load estimation (kN)
    const kneeForcekN = r1((oneRM + bw) * 9.81 * 7.5 / 1000) // ~7.5× at deep squat
    const kneeRisk = kneeForcekN > 10 ? "Elevated" : kneeForcekN > 7 ? "Moderate" : "Low"

    let status: 'good' | 'warning' | 'danger' | 'normal' = level === "Elite" || level === "Advanced" ? "good" : level === "Intermediate" ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "Estimated 1RM", value: `${oneRM} kg`, status, description: `${level} — ${ratio}× bodyweight` },
      healthScore: r0(Math.min(100, ratio * 35)),
      metrics: [
        { label: "1RM (Epley)", value: oneRM, unit: "kg", status },
        { label: "Strength Ratio", value: ratio, unit: "× BW", status: ratio >= 1.75 ? "good" : ratio >= 1.25 ? "normal" : "warning" },
        { label: "Strength Level", value: level, status },
        { label: "90% 1RM", value: p90, unit: "kg", status: "normal" },
        { label: "80% 1RM", value: p80, unit: "kg", status: "normal" },
        { label: "70% 1RM", value: p70, unit: "kg", status: "normal" },
        { label: "Knee Joint Force", value: kneeForcekN, unit: "kN", status: kneeRisk === "Low" ? "good" : kneeRisk === "Moderate" ? "warning" : "danger" },
        { label: "Knee Load Risk", value: kneeRisk, status: kneeRisk === "Low" ? "good" : kneeRisk === "Moderate" ? "warning" : "danger" },
        { label: "Beginner Standard", value: beginner, unit: "kg", status: "normal" },
        { label: "Advanced Standard", value: advanced, unit: "kg", status: "normal" },
        { label: "Elite Standard", value: elite, unit: "kg", status: "normal" }
      ],
      recommendations: [
        { title: "Squat Analysis", description: `1RM: ${oneRM}kg (${ratio}× BW). Level: ${level}. ${level === "Beginner" ? "Master the movement pattern: depth to parallel, knees tracking over toes, braced core. Goblet squats → back squats progression." : level === "Intermediate" ? "Program periodized training. Accessories: front squats, pause squats, Bulgarian split squats." : "Advanced level. Peaking blocks, specialty bars, accommodating resistance (bands/chains)."}`, priority: "high", category: "Assessment" },
        { title: "Knee Protection", description: `Knee force: ${kneeForcekN} kN (${kneeRisk} risk). ${kneeRisk !== "Low" ? "Heavy squats generate 6-8× BW through the knee. Ensure full depth (reduces shear force vs partial squats), maintain quad/hamstring balance, and warm up with 3-4 progressive sets. Patellar tendinopathy warning signs: anterior knee pain during descent." : "Knee loading appropriate for current strength level. Full-depth squatting is protective in trained individuals."}`, priority: "high", category: "Clinical" },
        { title: "Programming Guide", description: `Strength: 3-5 reps at ${p90}kg. Hypertrophy: 8-12 at ${p70}-${p80}kg. For ${level} level: ${level === "Beginner" ? "3×5 adding 2.5kg/session" : level === "Intermediate" ? "5/3/1 or GZCL style programming" : "Block periodization with peaking phases"}.`, priority: "medium", category: "Programming" }
      ],
      detailedBreakdown: { "Lifted": `${w}kg × ${r}`, "1RM": `${oneRM}kg`, "Ratio": `${ratio}× BW`, "Level": level, "Knee Force": `${kneeForcekN} kN` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="squat-strength-calculator" title="Advanced Squat Strength Calculator"
      description="Calculate your squat 1RM with strength standards, knee load analysis, and periodization recommendations."
      icon={Dumbbell} calculate={calculate} onClear={() => { setWeight(100); setReps(5); setBodyWeight(80); setGender("male"); setResult(null) }}
      values={[weight, reps, bodyWeight, gender]} result={result}
      seoContent={<SeoContentGenerator title="Squat Strength Calculator" description="Calculate your squat 1RM and strength level." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight Lifted" val={weight} set={setWeight} min={20} max={400} suffix="kg" />
          <NumInput label="Reps Completed" val={reps} set={setReps} min={1} max={30} />
        </div>
        <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} step={0.1} suffix="kg" />
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 60. Advanced Deadlift Calculator ─────────────────────────────────────────
export function AdvancedDeadliftCalculator() {
  const [weight, setWeight] = useState(120)
  const [reps, setReps] = useState(5)
  const [bodyWeight, setBodyWeight] = useState(80)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 500)
    const r = clamp(reps, 1, 30)
    const bw = clamp(bodyWeight, 30, 200)

    const oneRM = r === 1 ? w : r0(w * (1 + r / 30))
    const ratio = r2(oneRM / bw)
    const p90 = r0(oneRM * 0.9)
    const p80 = r0(oneRM * 0.8)
    const p70 = r0(oneRM * 0.7)

    const genderMul = gender === "female" ? 0.6 : 1.0
    const beginner = r0(bw * 1.0 * genderMul)
    const inter = r0(bw * 1.5 * genderMul)
    const advanced = r0(bw * 2.0 * genderMul)
    const elite = r0(bw * 3.0 * genderMul)

    let level = "Beginner"
    if (oneRM >= elite) level = "Elite"
    else if (oneRM >= advanced) level = "Advanced"
    else if (oneRM >= inter) level = "Intermediate"

    // Lumbar strain risk
    const lumbarLoad = r1((oneRM + bw) * 9.81 * 8 / 1000) // ~8× compression
    const lumbarRisk = lumbarLoad > 15 ? "Elevated" : lumbarLoad > 10 ? "Moderate" : "Low"
    const lumbarProb = lumbarLoad > 15 ? r0(22) : lumbarLoad > 10 ? r0(12) : r0(5)

    let status: 'good' | 'warning' | 'danger' | 'normal' = level === "Elite" || level === "Advanced" ? "good" : level === "Intermediate" ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "Estimated 1RM", value: `${oneRM} kg`, status, description: `${level} — ${ratio}× bodyweight` },
      healthScore: r0(Math.min(100, ratio * 30)),
      metrics: [
        { label: "1RM (Epley)", value: oneRM, unit: "kg", status },
        { label: "Strength Ratio", value: ratio, unit: "× BW", status: ratio >= 2.0 ? "good" : ratio >= 1.5 ? "normal" : "warning" },
        { label: "Strength Level", value: level, status },
        { label: "90% 1RM", value: p90, unit: "kg", status: "normal" },
        { label: "80% 1RM", value: p80, unit: "kg", status: "normal" },
        { label: "70% 1RM", value: p70, unit: "kg", status: "normal" },
        { label: "Lumbar Compression", value: lumbarLoad, unit: "kN", status: lumbarRisk === "Low" ? "good" : lumbarRisk === "Moderate" ? "warning" : "danger" },
        { label: "Lumbar Strain Risk", value: `${lumbarProb}% (${lumbarRisk})`, status: lumbarRisk === "Low" ? "good" : lumbarRisk === "Moderate" ? "warning" : "danger" },
        { label: "Beginner Standard", value: beginner, unit: "kg", status: "normal" },
        { label: "Advanced Standard", value: advanced, unit: "kg", status: "normal" },
        { label: "Elite Standard", value: elite, unit: "kg", status: "normal" }
      ],
      recommendations: [
        { title: "Deadlift Analysis", description: `1RM: ${oneRM}kg (${ratio}× BW). Level: ${level}. Deadlift is the ultimate posterior chain developer. ${level === "Beginner" ? "Focus on hip hinge pattern. Trap bar or Romanian DL to build movement competency. Keep spine neutral." : level === "Intermediate" ? "Implement deficit deads, paused deads, and block pulls for weak points. Train 1-2×/week." : "Advanced: competition prep with peaking cycles, sumo/conventional specialization, grip training."}`, priority: "high", category: "Assessment" },
        { title: "Lumbar Protection", description: `Compression: ${lumbarLoad} kN (${lumbarRisk} risk). ${lumbarRisk !== "Low" ? "Heavy deadlifts generate 8-10× BW lumbar compression. CRITICAL: never round the lower back under load. Use belt for sets >80% 1RM, brace with valsalva technique, and include McGill Big 3 exercises daily (curl-up, side plank, bird-dog)." : "Manageable spinal loading. Continue with proper bracing mechanics."}`, priority: "high", category: "Clinical" },
        { title: "Accessory Work", description: `Strengthen weak points: slow off floor → deficit deadlifts. Lockout issues → block pulls/hip thrusts. Grip failing → farmer walks, double overhand holds. Training loads: ${p80}-${p90}kg for strength, ${p70}kg for volume work.`, priority: "medium", category: "Programming" }
      ],
      detailedBreakdown: { "Lifted": `${w}kg × ${r}`, "1RM": `${oneRM}kg`, "Ratio": `${ratio}× BW`, "Level": level, "Lumbar": `${lumbarLoad} kN` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="deadlift-calculator" title="Advanced Deadlift Calculator"
      description="Calculate your deadlift 1RM with strength classification, lumbar strain risk analysis, and programming percentages."
      icon={Dumbbell} calculate={calculate} onClear={() => { setWeight(120); setReps(5); setBodyWeight(80); setGender("male"); setResult(null) }}
      values={[weight, reps, bodyWeight, gender]} result={result}
      seoContent={<SeoContentGenerator title="Deadlift Calculator" description="Calculate your deadlift 1RM." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight Lifted" val={weight} set={setWeight} min={20} max={500} suffix="kg" />
          <NumInput label="Reps Completed" val={reps} set={setReps} min={1} max={30} />
        </div>
        <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} step={0.1} suffix="kg" />
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 61. Advanced Wilks Score Calculator ──────────────────────────────────────
export function AdvancedWilksScoreCalculator() {
  const [squat, setSquat] = useState(140)
  const [bench, setBench] = useState(100)
  const [deadlift, setDeadlift] = useState(180)
  const [bodyWeight, setBodyWeight] = useState(80)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(squat, 0, 500)
    const b = clamp(bench, 0, 400)
    const d = clamp(deadlift, 0, 500)
    const bw = clamp(bodyWeight, 30, 200)
    const total = s + b + d

    // Wilks coefficients (Wilks 2020 updated)
    const maleCoeff = [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8]
    const femaleCoeff = [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8]
    const c = gender === "male" ? maleCoeff : femaleCoeff

    const denom = c[0] + c[1] * bw + c[2] * bw ** 2 + c[3] * bw ** 3 + c[4] * bw ** 4 + c[5] * bw ** 5
    const wilks = r1(total * 500 / denom)

    // National percentile estimation
    let percentile = 50
    if (wilks >= 500) percentile = 99
    else if (wilks >= 450) percentile = 97
    else if (wilks >= 400) percentile = 93
    else if (wilks >= 350) percentile = 85
    else if (wilks >= 300) percentile = 70
    else if (wilks >= 250) percentile = 50
    else if (wilks >= 200) percentile = 30
    else percentile = 15

    // Classification
    let classification = "Class III"
    if (wilks >= 500) classification = "Elite"
    else if (wilks >= 425) classification = "Master"
    else if (wilks >= 365) classification = "Class I"
    else if (wilks >= 310) classification = "Class II"

    const ratio = r2(total / bw)

    let status: 'good' | 'warning' | 'danger' | 'normal' = wilks >= 400 ? "good" : wilks >= 300 ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "Wilks Score", value: wilks, status, description: `${classification} — Top ${100 - percentile}%` },
      healthScore: r0(Math.min(100, wilks / 5)),
      metrics: [
        { label: "Wilks Score", value: wilks, status },
        { label: "Classification", value: classification, status },
        { label: "National Percentile", value: `${percentile}th`, status: percentile >= 85 ? "good" : percentile >= 50 ? "normal" : "warning" },
        { label: "Total", value: total, unit: "kg", status: "normal" },
        { label: "Total/BW Ratio", value: ratio, unit: "×", status: ratio >= 7 ? "good" : ratio >= 5 ? "normal" : "warning" },
        { label: "Squat", value: s, unit: "kg", status: "normal" },
        { label: "Bench", value: b, unit: "kg", status: "normal" },
        { label: "Deadlift", value: d, unit: "kg", status: "normal" },
        { label: "Body Weight", value: bw, unit: "kg", status: "normal" }
      ],
      recommendations: [
        { title: "Wilks Analysis", description: `Wilks: ${wilks} (${classification}). Total: ${total}kg at ${bw}kg BW (${ratio}× BW). Percentile: ${percentile}th among competitive lifters. ${wilks < 300 ? "Focus on consistent training and progressive overload. Wilks improves rapidly in early training." : wilks < 400 ? "Strong competitor. Target weak lifts — find which lift has lowest ratio to BW and prioritize it." : "Elite level. Competition-ready. Focus on peaking and specificity."}`, priority: "high", category: "Assessment" },
        { title: "Lift Balance Analysis", description: `S/B/D: ${s}/${b}/${d}. Typical ratios: squat ~1.0× (${r0(total * 0.38)}kg), bench ~0.6× (${r0(total * 0.24)}kg), deadlift ~1.15× (${r0(total * 0.38)}kg). ${b / total < 0.22 ? "Bench is your weakest lift — add bench volume." : d / total < 0.35 ? "Deadlift lagging — add posterior chain work." : s / total < 0.33 ? "Squat needs work — increase squat frequency." : "Well-balanced total."}`, priority: "high", category: "Analysis" },
        { title: "Competition Strategy", description: `${classification} class: ${classification === "Elite" || classification === "Master" ? "Strategic attempt selection is critical. 1st attempts: 92-95% of best. 2nd: 97-100%. 3rd: PR attempt. Weigh-in strategy for weight class." : "Build competition experience. Go 9/9 (all attempts successful) before chasing records. Learn commands and timing."}`, priority: "medium", category: "Competition" }
      ],
      detailedBreakdown: { "S/B/D": `${s}/${b}/${d} kg`, "Total": `${total} kg`, "BW": `${bw} kg`, "Wilks": wilks, "Class": classification, "Percentile": `${percentile}th` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="wilks-score-calculator" title="Advanced Wilks Score Calculator"
      description="Calculate your Wilks score with powerlifting classification, national percentile, and lift balance analysis."
      icon={Shield} calculate={calculate} onClear={() => { setSquat(140); setBench(100); setDeadlift(180); setBodyWeight(80); setGender("male"); setResult(null) }}
      values={[squat, bench, deadlift, bodyWeight, gender]} result={result}
      seoContent={<SeoContentGenerator title="Wilks Score Calculator" description="Calculate your Wilks powerlifting score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Squat 1RM" val={squat} set={setSquat} min={0} max={500} suffix="kg" />
          <NumInput label="Bench 1RM" val={bench} set={setBench} min={0} max={400} suffix="kg" />
          <NumInput label="Deadlift 1RM" val={deadlift} set={setDeadlift} min={0} max={500} suffix="kg" />
        </div>
        <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} step={0.1} suffix="kg" />
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 62. Advanced Cooper Test Calculator ──────────────────────────────────────
export function AdvancedCooperTestCalculator() {
  const [distance, setDistance] = useState(2400)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dist = clamp(distance, 500, 5000)
    const a = clamp(age, 13, 70)

    // VO₂max estimation (Cooper formula)
    const vo2max = r1((dist - 504.9) / 44.73)
    const pacePerKm = r0(720 / (dist / 1000)) // 12 min / km covered

    // Fitness category (Cooper standards)
    let category = "Very Poor"
    if (gender === "male") {
      if (a < 30) {
        if (dist >= 2800) category = "Excellent"; else if (dist >= 2400) category = "Good"; else if (dist >= 2200) category = "Average"; else if (dist >= 1600) category = "Poor"
      } else if (a < 40) {
        if (dist >= 2700) category = "Excellent"; else if (dist >= 2300) category = "Good"; else if (dist >= 1900) category = "Average"; else if (dist >= 1500) category = "Poor"
      } else if (a < 50) {
        if (dist >= 2500) category = "Excellent"; else if (dist >= 2100) category = "Good"; else if (dist >= 1700) category = "Average"; else if (dist >= 1400) category = "Poor"
      } else {
        if (dist >= 2400) category = "Excellent"; else if (dist >= 2000) category = "Good"; else if (dist >= 1600) category = "Average"; else if (dist >= 1300) category = "Poor"
      }
    } else {
      if (a < 30) {
        if (dist >= 2700) category = "Excellent"; else if (dist >= 2200) category = "Good"; else if (dist >= 1800) category = "Average"; else if (dist >= 1500) category = "Poor"
      } else if (a < 40) {
        if (dist >= 2500) category = "Excellent"; else if (dist >= 2000) category = "Good"; else if (dist >= 1700) category = "Average"; else if (dist >= 1400) category = "Poor"
      } else if (a < 50) {
        if (dist >= 2300) category = "Excellent"; else if (dist >= 1900) category = "Good"; else if (dist >= 1500) category = "Average"; else if (dist >= 1200) category = "Poor"
      } else {
        if (dist >= 2200) category = "Excellent"; else if (dist >= 1700) category = "Good"; else if (dist >= 1400) category = "Average"; else if (dist >= 1100) category = "Poor"
      }
    }

    // 8-week projection (8-12% improvement)
    const improvedDist = r0(dist * 1.10)
    const improvedVO2 = r1((improvedDist - 504.9) / 44.73)

    // Risk thresholds
    const lowVO2risk = vo2max < 35 ? "Below Average — Increased Cardiovascular Risk" : vo2max < 45 ? "Average — Maintain/Improve" : "Good — Low Risk"

    let status: 'good' | 'warning' | 'danger' | 'normal' = category === "Excellent" ? "good" : category === "Good" ? "good" : category === "Average" ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "VO₂ max", value: `${vo2max} mL/kg/min`, status, description: `${category} for age ${a}` },
      healthScore: r0(Math.min(100, vo2max * 2)),
      metrics: [
        { label: "VO₂ max", value: vo2max, unit: "mL/kg/min", status },
        { label: "Distance", value: dist, unit: "m", status: "normal" },
        { label: "Fitness Category", value: category, status },
        { label: "Pace", value: `${Math.floor(pacePerKm / 60)}:${String(r0(pacePerKm % 60)).padStart(2, '0')}`, unit: "/km", status: "normal" },
        { label: "CV Risk Level", value: lowVO2risk, status: vo2max >= 45 ? "good" : vo2max >= 35 ? "normal" : "danger" },
        { label: "8-Week Distance Target", value: improvedDist, unit: "m", status: "good" },
        { label: "8-Week VO₂ Projection", value: improvedVO2, unit: "mL/kg/min", status: "good" },
        { label: "Age", value: a, status: "normal" },
        { label: "Gender", value: gender === "male" ? "Male" : "Female", status: "normal" }
      ],
      recommendations: [
        { title: "Cooper Test Analysis", description: `Distance: ${dist}m in 12 minutes → VO₂max ${vo2max} mL/kg/min. Category: ${category} for ${gender === "male" ? "Male" : "Female"} age ${a}. ${category === "Excellent" ? "Outstanding cardiovascular fitness." : category === "Good" ? "Above average — continue current training." : category === "Average" ? "Room for improvement — structured aerobic training recommended." : "Below standard — begin progressive walking/jogging program. See physician if sedentary."}`, priority: "high", category: "Assessment" },
        { title: "8-Week Improvement Plan", description: `Target: ${improvedDist}m (VO₂ ${improvedVO2}). Week 1-2: 3× easy jogs (20 min) + 1× interval (6×200m at Cooper pace). Week 3-4: 3× jogs (25 min) + 1× interval (4×400m). Week 5-6: 2× jogs + 1× tempo run (15 min at goal pace) + 1× interval. Week 7-8: Sharpen with race-pace repetitions. Retest week 9.`, priority: "high", category: "Training" },
        { title: "Clinical Significance", description: `VO₂max is the strongest predictor of all-cause mortality. ${vo2max < 35 ? "⚠️ Low VO₂max (<35) correlates with 2-3× higher cardiovascular mortality risk. Recommend physician clearance and supervised exercise program. Even modest improvements (3-5 mL/kg/min) reduce mortality risk 10-25%." : vo2max < 45 ? "Average level. Every 1 mL/kg/min improvement in VO₂max reduces all-cause mortality by ~9%." : "Excellent fitness. Protective against cardiovascular disease, type 2 diabetes, and cognitive decline."}`, priority: "high", category: "Clinical" }
      ],
      detailedBreakdown: { "Distance": `${dist}m`, "Time": "12:00", "VO₂max": `${vo2max} mL/kg/min`, "Category": category, "8-Wk Target": `${improvedDist}m`, "8-Wk VO₂": `${improvedVO2}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cooper-test-calculator" title="Advanced Cooper Test Calculator"
      description="Calculate VO₂max from the 12-minute Cooper test with fitness classification, cardiovascular risk, and 8-week improvement plan."
      icon={TrendingUp} calculate={calculate} onClear={() => { setDistance(2400); setAge(30); setGender("male"); setResult(null) }}
      values={[distance, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Cooper Test Calculator" description="Estimate VO₂max from the Cooper test." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Distance Covered in 12 min" val={distance} set={setDistance} min={500} max={5000} suffix="meters" />
        <NumInput label="Age" val={age} set={setAge} min={13} max={70} suffix="years" />
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}
