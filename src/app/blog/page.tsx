import { headers } from 'next/headers';
import { allBlogPosts, calculateReadingTime, type BlogPost } from '@/lib/blogData';
import { getMergedTranslations } from '@/lib/translations';
import { BlogDashboard } from '@/components/blog/BlogDashboard';
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const language = (await headers()).get('x-calculator-language') || 'en';
  const dict = getMergedTranslations(language);

  return {
    title: `${dict.nav.blog} - Calculator Loop`,
    description: dict.blog?.metaDescription || 'Expert guides on EMI, loans, investments, and planning.',
  };
}

export default async function BlogPage() {
  const language = (await headers()).get('x-calculator-language') || 'en';
  const dict = getMergedTranslations(language);

  const dbPosts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      translations: {
        some: {
          language,
          isPublished: true,
        },
      },
    },
    include: {
      author: { select: { name: true, image: true } },
      calculator: { select: { slug: true } },
      translations: {
        where: { language, isPublished: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 240,
  }).catch(() => []);

  const databasePosts = dbPosts.reduce<BlogPost[]>((posts, post) => {
      const translation = post.translations[0];
      if (!translation) return posts;

      const plainText = translation.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const description = translation.metaDesc || `${plainText.slice(0, 150)}${plainText.length > 150 ? '...' : ''}`;

      posts.push({
        slug: language === 'en' ? post.slug : translation.urlSlug,
        title: translation.title,
        description,
        content: translation.content,
        category: (post.category || 'general') as BlogPost['category'],
        subcategoryKey: post.subcategory || undefined,
        toolId: post.calculator?.slug || undefined,
        tags: post.tags || [],
        author: {
          name: post.author?.name || 'Calculator Loop',
          avatar: post.author?.image || '/favicon.ico',
          bio: 'Calculator Loop Editorial',
        },
        publishedAt: (translation.publishedAt || post.createdAt).toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        readingTime: Math.max(1, calculateReadingTime(plainText || translation.content)),
        image: post.featuredImage || undefined,
        featured: false,
      });

      return posts;
    }, []);

  const mergedPosts = new Map<string, BlogPost>();
  for (const post of databasePosts) mergedPosts.set(post.slug, post);
  if (language === 'en') {
    for (const post of allBlogPosts) {
      if (!mergedPosts.has(post.slug)) mergedPosts.set(post.slug, post);
    }
  }

  return <BlogDashboard posts={Array.from(mergedPosts.values())} language={language} dict={dict} />;
}
