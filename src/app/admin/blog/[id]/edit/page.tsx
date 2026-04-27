import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BlogEditorWrapper } from "@/components/admin/blog/BlogEditorWrapper"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params

  const blogPost = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      translations: true,
    },
  })

  if (!blogPost) {
    notFound()
  }

  // Transform translations into a record keyed by language
  const translationsMap: Record<string, any> = {}
  for (const t of blogPost.translations) {
    translationsMap[t.language] = {
      title: t.title,
      content: t.content,
      metaTitle: t.metaTitle || "",
      metaDesc: t.metaDesc || "",
      urlSlug: t.urlSlug,
      wordCount: t.wordCount,
      isPublished: t.isPublished,
    }
  }

  const initialData = {
    slug: blogPost.slug,
    category: blogPost.category || "",
    subcategory: blogPost.subcategory || "",
    status: blogPost.status,
    tags: blogPost.tags,
    linkedCalculatorId: blogPost.linkedCalculatorId || "",
    featuredImage: blogPost.featuredImage || "",
    scheduledAt: blogPost.scheduledAt?.toISOString() || "",
    translations: translationsMap,
  }

  return <BlogEditorWrapper blogId={id} initialData={initialData} />
}
