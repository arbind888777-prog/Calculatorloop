"use client"

import { BlogEditor } from "@/components/admin/blog/BlogEditor"

interface Props {
  blogId: string
  initialData: any
}

export function BlogEditorWrapper({ blogId, initialData }: Props) {
  return <BlogEditor blogId={blogId} initialData={initialData} />
}
