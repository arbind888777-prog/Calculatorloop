import { allBlogPosts } from "@/lib/blogData"
import { toolsData } from "@/lib/toolsData"

type BlogStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "SCHEDULED"

type BlogInsightPost = {
  linkedCalculatorId: string | null
  status: BlogStatus
  tags: string[]
}

type ToolDescriptor = {
  toolId: string
  title: string
  categoryId: string
  categoryName: string
  subcategoryKey: string
  subcategoryName: string
}

type CoverageBucket = "startHere" | "examples" | "formula" | "faq"

const START_HERE_TAGS = new Set(["beginner", "how-to", "guide", "basics", "getting-started", "start-here"])
const EXAMPLE_TAGS = new Set(["example", "examples", "use-case", "use-cases", "scenario", "case-study", "case-studies"])
const FORMULA_TAGS = new Set(["formula", "formulas", "calculation", "calculations", "explained", "working"])
const FAQ_TAGS = new Set(["faq", "faqs", "questions", "common-mistakes", "mistakes", "troubleshooting"])

const COVERAGE_LABELS: Record<CoverageBucket, string> = {
  startHere: "Start here",
  examples: "Examples",
  formula: "Formula",
  faq: "FAQ",
}

const CATEGORY_LABELS: Record<string, string> = {
  financial: "Financial",
  health: "Health & Fitness",
  math: "Mathematics",
  scientific: "Science",
  technology: "Technology",
  education: "Education",
  business: "Business",
  construction: "Construction",
  everyday: "Everyday",
  datetime: "Date & Time",
}

function cleanLabel(value: string) {
  return value.replace(/^[^\p{L}\p{N}]+/gu, "").trim()
}

function flattenTools(): ToolDescriptor[] {
  const tools: ToolDescriptor[] = []

  for (const [categoryId, category] of Object.entries(toolsData)) {
    for (const [subcategoryKey, subcategory] of Object.entries(category.subcategories ?? {})) {
      for (const calculator of subcategory.calculators) {
        tools.push({
          toolId: calculator.id,
          title: calculator.title,
          categoryId,
          categoryName: CATEGORY_LABELS[categoryId] || categoryId,
          subcategoryKey,
          subcategoryName: cleanLabel(subcategory.name || subcategoryKey),
        })
      }
    }
  }

  return tools
}

function getCoverageBuckets(tags: string[]) {
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase())
  const buckets = new Set<CoverageBucket>()

  for (const tag of normalizedTags) {
    if (START_HERE_TAGS.has(tag)) buckets.add("startHere")
    if (EXAMPLE_TAGS.has(tag)) buckets.add("examples")
    if (FORMULA_TAGS.has(tag)) buckets.add("formula")
    if (FAQ_TAGS.has(tag)) buckets.add("faq")
  }

  return buckets
}

function createEmptyMetric() {
  return {
    liveGuides: 0,
    draftGuides: 0,
    totalGuides: 0,
    buckets: new Set<CoverageBucket>(),
  }
}

export function buildAdminBlogInsights(dbPosts: BlogInsightPost[]) {
  const tools = flattenTools()
  const coverageByTool = new Map<string, ReturnType<typeof createEmptyMetric>>()

  for (const tool of tools) {
    coverageByTool.set(tool.toolId, createEmptyMetric())
  }

  let unlinkedPostCount = 0
  let linkedPublishedPosts = 0
  let linkedDraftPosts = 0

  for (const post of dbPosts) {
    if (!post.linkedCalculatorId) {
      unlinkedPostCount += 1
      continue
    }

    const metric = coverageByTool.get(post.linkedCalculatorId)
    if (!metric) continue

    metric.totalGuides += 1
    const buckets = getCoverageBuckets(post.tags || [])
    for (const bucket of buckets) metric.buckets.add(bucket)

    if (post.status === "PUBLISHED") {
      metric.liveGuides += 1
      linkedPublishedPosts += 1
    } else {
      metric.draftGuides += 1
      linkedDraftPosts += 1
    }
  }

  for (const post of allBlogPosts) {
    if (!post.toolId) continue
    const metric = coverageByTool.get(post.toolId)
    if (!metric) continue

    metric.liveGuides += 1
    metric.totalGuides += 1
    const buckets = getCoverageBuckets(post.tags || [])
    for (const bucket of buckets) metric.buckets.add(bucket)
  }

  const toolsWithAnyGuides = tools
    .map((tool) => {
      const metric = coverageByTool.get(tool.toolId) || createEmptyMetric()
      const missingBuckets = (Object.keys(COVERAGE_LABELS) as CoverageBucket[])
        .filter((bucket) => !metric.buckets.has(bucket))
        .map((bucket) => COVERAGE_LABELS[bucket])

      return {
        ...tool,
        ...metric,
        missingBuckets,
      }
    })

  const calculatorsWithLiveGuides = toolsWithAnyGuides.filter((tool) => tool.liveGuides > 0).length
  const calculatorsWithAnyGuides = toolsWithAnyGuides.filter((tool) => tool.totalGuides > 0).length
  const calculatorsWithDraftGuides = toolsWithAnyGuides.filter((tool) => tool.draftGuides > 0).length
  const calculatorsWithoutGuides = toolsWithAnyGuides.filter((tool) => tool.totalGuides === 0).length
  const averageLiveGuidesPerCoveredCalculator = calculatorsWithLiveGuides > 0
    ? Number((toolsWithAnyGuides.reduce((sum, tool) => sum + tool.liveGuides, 0) / calculatorsWithLiveGuides).toFixed(1))
    : 0

  const readyToPublish = toolsWithAnyGuides
    .filter((tool) => tool.liveGuides === 0 && tool.draftGuides > 0)
    .sort((left, right) => right.draftGuides - left.draftGuides || left.title.localeCompare(right.title))
    .slice(0, 8)

  const zeroCoverage = toolsWithAnyGuides
    .filter((tool) => tool.totalGuides === 0)
    .sort((left, right) => left.title.localeCompare(right.title))
    .slice(0, 10)

  const thinCoverage = toolsWithAnyGuides
    .filter((tool) => tool.liveGuides > 0 && tool.liveGuides <= 1)
    .sort((left, right) => right.missingBuckets.length - left.missingBuckets.length || left.title.localeCompare(right.title))
    .slice(0, 10)

  const categoryCoverage = Object.values(
    toolsWithAnyGuides.reduce<Record<string, {
      categoryId: string
      categoryName: string
      totalCalculators: number
      coveredCalculators: number
      liveGuides: number
      draftGuides: number
    }>>((acc, tool) => {
      if (!acc[tool.categoryId]) {
        acc[tool.categoryId] = {
          categoryId: tool.categoryId,
          categoryName: tool.categoryName,
          totalCalculators: 0,
          coveredCalculators: 0,
          liveGuides: 0,
          draftGuides: 0,
        }
      }

      acc[tool.categoryId].totalCalculators += 1
      acc[tool.categoryId].liveGuides += tool.liveGuides
      acc[tool.categoryId].draftGuides += tool.draftGuides
      if (tool.liveGuides > 0) acc[tool.categoryId].coveredCalculators += 1

      return acc
    }, {})
  )
    .map((row) => ({
      ...row,
      coveragePercent: row.totalCalculators > 0
        ? Math.round((row.coveredCalculators / row.totalCalculators) * 100)
        : 0,
    }))
    .sort((left, right) => right.coveragePercent - left.coveragePercent)

  return {
    summary: {
      totalCalculators: tools.length,
      calculatorsWithAnyGuides,
      calculatorsWithLiveGuides,
      calculatorsWithDraftGuides,
      calculatorsWithoutGuides,
      averageLiveGuidesPerCoveredCalculator,
      unlinkedPostCount,
      linkedPublishedPosts,
      linkedDraftPosts,
    },
    zeroCoverage,
    thinCoverage,
    readyToPublish,
    categoryCoverage,
  }
}
