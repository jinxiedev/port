import { NextResponse } from "next/server"

export type ContributionDay = { date: string; count: number }

export async function GET() {
  try {
    const res = await fetch("https://github.com/users/jinxiedev/contributions", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 3600 }, // Cache on edge for 1 hour
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from GitHub" }, { status: 502 })
    }

    const html = await res.text()

    // Parse tooltip counts (id -> count)
    const tooltips = html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)
    const countMap = new Map<string, number>()
    for (const match of tooltips) {
      const id = match[1]
      const text = match[2]
      const countMatch = text.match(/(\d+)\s+contribution/)
      countMap.set(id, countMatch ? parseInt(countMatch[1], 10) : 0)
    }

    // Parse td elements (date and id)
    const cells = html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"/g)
    const data: ContributionDay[] = []
    for (const match of cells) {
      const date = match[1]
      const id = match[2]
      data.push({
        date,
        count: countMap.get(id) ?? 0,
      })
    }

    // Sort ascending by date
    data.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      username: "jinxiedev",
      total: data.reduce((sum, d) => sum + d.count, 0),
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
