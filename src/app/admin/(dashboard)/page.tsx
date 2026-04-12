import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/admin/DashboardClient"

async function getDashboardData() {
  const [
    totalCalculators,
    totalBlogPosts,
    publishedBlogs,
    totalUsers,
    recentActivity,
    topCalculators,
  ] = await Promise.all([
    prisma.calculator.count().catch(() => 0),
    prisma.blogPost.count().catch(() => 0),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.activityLog
      .findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      })
      .catch(() => []),
    prisma.calculator
      .findMany({
        take: 6,
        orderBy: { totalUses: "desc" },
        include: {
          translations: {
            where: { language: "en" },
            take: 1,
          },
        },
      })
      .catch(() => []),
  ])

  return {
    stats: {
      totalCalculators,
      totalBlogPosts,
      publishedBlogs,
      totalUsers,
      // Placeholder values — can be connected to real analytics later
      dailyActiveUsers: Math.floor(totalUsers * 0.3) || 0,
      monthlyRevenue: 0,
    },
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      details: a.details,
      userName: a.user?.name || a.user?.email || "System",
      createdAt: a.createdAt.toISOString(),
    })),
    topCalculators: topCalculators.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.translations[0]?.title || c.slug,
      totalUses: c.totalUses,
      isActive: c.isActive,
    })),
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()
  return <DashboardClient data={data} />
}
