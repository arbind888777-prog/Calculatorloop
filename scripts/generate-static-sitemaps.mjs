#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import vm from 'vm'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const repoRoot = process.cwd()
const toolsFile = path.join(repoRoot, 'src', 'lib', 'toolsData.ts')
const financialJson = path.join(repoRoot, 'financial-tools-report.json')
const outDir = path.join(repoRoot, 'public', 'sitemaps')
const baseUrl = 'https://calculatorloop.com'
const locales = ['en','hi','mr','ta','te','bn','gu','es','pt','fr','de','id','ar','ur','ja']
const MAX_PER_SITEMAP = 2000

function findObjectLiteral(content, marker) {
  const i = content.indexOf(marker)
  if (i === -1) throw new Error('marker not found: ' + marker)
  const eq = content.indexOf('=', i)
  const start = content.indexOf('{', eq)
  if (start === -1) throw new Error('object start not found')
  let depth = 0
  for (let j = start; j < content.length; j++) {
    const ch = content[j]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return content.slice(start, j + 1)
    }
  }
  throw new Error('matching brace not found')
}

async function main() {
  const toolsTs = await fs.readFile(toolsFile, 'utf8')
  const baseSnippet = findObjectLiteral(toolsTs, 'const baseToolsData')

  // Evaluate the object literal safely in a VM
  const script = `baseToolsData = ${baseSnippet};`
  const ctx = { baseToolsData: undefined }
  vm.createContext(ctx)
  vm.runInContext(script, ctx)
  const baseToolsData = ctx.baseToolsData

  // collect IDs to exclude when building financial category
  const excludeIds = new Set()
  for (const category of Object.values(baseToolsData)) {
    for (const sub of Object.values(category.subcategories)) {
      for (const t of sub.calculators) excludeIds.add(t.id)
    }
  }

  // read financial report
  let financialReport = {}
  try { financialReport = JSON.parse(await fs.readFile(financialJson, 'utf8')) } catch (e) { financialReport = {} }
  const items = [ ...(financialReport.basicImplemented || []), ...(financialReport.advancedImplemented || []) ]
  const seen = new Set()
  const subcategories = {}
  for (const item of items) {
    if (!item || !item.id || !item.subcategoryKey) continue
    if (excludeIds.has(item.id)) continue
    if (seen.has(item.id)) continue
    seen.add(item.id)
    const key = item.subcategoryKey
    if (!subcategories[key]) subcategories[key] = { name: item.subcategoryName || key, icon: 'fas fa-calculator', calculators: [] }
    subcategories[key].calculators.push({ id: item.id, title: item.title || item.id, description: (item.title ? `${item.title}.` : 'Calculator'), icon: 'fas fa-calculator', action: 'Calculate Now' })
  }
  const financialCategory = { subcategories }

  const toolsData = { financial: financialCategory, ...baseToolsData }

  // build URL list per locale
  const globalPages = ['/', '/about', '/contact', '/blog', '/popular']

  await fs.mkdir(outDir, { recursive: true })
  const sitemapFiles = []

  for (const loc of locales) {
    const urls = []
    for (const p of globalPages) urls.push(`${baseUrl}/${loc}${p === '/' ? '' : p}`)

    for (const [categoryId, category] of Object.entries(toolsData)) {
      urls.push(`${baseUrl}/${loc}/${categoryId}`)
      for (const sub of Object.values(category.subcategories)) {
        for (const tool of sub.calculators) {
          urls.push(`${baseUrl}/${loc}/${categoryId}/${tool.id}`)
        }
      }
    }

    // append blogs from db
    try {
      const dbPosts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true }
      });
      for (const p of dbPosts) {
        urls.push(`${baseUrl}/${loc}/blog/${p.slug}`)
      }
    } catch (e) {
      console.warn("DB not reachable in static sitemap script for blogs", e)
    }

    // dedupe and chunk
    const unique = Array.from(new Set(urls))
    for (let i = 0; i < unique.length; i += MAX_PER_SITEMAP) {
      const chunk = unique.slice(i, i + MAX_PER_SITEMAP)
      const fileName = `sitemap-${loc}-${Math.floor(i / MAX_PER_SITEMAP) + 1}.xml`
      const filePath = path.join(outDir, fileName)
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${chunk.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join('\n')}\n</urlset>`
      await fs.writeFile(filePath, xml, 'utf8')
      sitemapFiles.push({ loc: `${baseUrl}/sitemaps/${fileName}`, path: filePath })
    }
  }

  // sitemap index
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${sitemapFiles.map(f => `  <sitemap><loc>${f.loc}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>`
  await fs.writeFile(path.join(repoRoot, 'public', 'sitemap_index.xml'), indexXml, 'utf8')

  // robots.txt
  const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_next/\nDisallow: /proxy\nSitemap: ${baseUrl}/sitemap_index.xml\n`
  await fs.writeFile(path.join(repoRoot, 'public', 'robots.txt'), robots, 'utf8')

  console.log('Generated', sitemapFiles.length, 'sitemap files. Index written to /public/sitemap_index.xml')
  await prisma.$disconnect()
}

main().catch(async (err) => { 
  console.error(err)
  await prisma.$disconnect()
  process.exit(1) 
})
