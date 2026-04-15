"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Flame, Search, TrendingUp, X } from "lucide-react"
import { formatDate, titleCase } from "@/lib/admin/utils"

const trendingSearches = [
  { id: 1, keyword: "G-DRAGON PEACEMINUSONE", hot: true },
  { id: 2, keyword: "BLACKPINK stage look", hot: true },
  { id: 3, keyword: "Tour jacket", hot: false },
  { id: 4, keyword: "Broadcast outfit", hot: false },
  { id: 5, keyword: "Signed archive piece", hot: false },
]

const initialRecentSearches = [
  "PEACEMINUSONE Cap",
  "Burberry Trench",
  "Stage Jacket",
]

const recommendedItems = [
  {
    id: 1,
    name: "PEACEMINUSONE Cap",
    artist: "G-DRAGON",
    image: "/peaceminusone-gd-cap-burgundy-red-with-flames-stre.jpg",
    status: "LIVE",
    meta: "Auction in progress",
  },
  {
    id: 2,
    name: "Burberry Trench Jacket",
    artist: "SON HEUNG MIN",
    image: "/son-burberry.png",
    status: "UPCOMING",
    meta: "Preview listing",
  },
]

function addRecentKeyword(list: string[], keyword: string) {
  const value = keyword.trim()

  if (!value) {
    return list
  }

  return [value, ...list.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 6)
}

type PublicSearchListing = {
  id: string
  artifact_code: string
  artifact_title: string
  artist_name: string | null
  era_name: string | null
  usage_tier: string | null
  current_status: string | null
  created_at: string | null
  image_url: string | null
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentList, setRecentList] = useState(initialRecentSearches)
  const [newListings, setNewListings] = useState<PublicSearchListing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [listingError, setListingError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadNewListings() {
      try {
        setLoadingListings(true)
        const params = new URLSearchParams()

        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim())
        }

        const response = await fetch(`/api/public/registry?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        })

        const payload = (await response.json()) as {
          listings?: PublicSearchListing[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load public listings.")
        }

        if (!active) {
          return
        }

        setNewListings(payload.listings ?? [])
        setListingError(null)
      } catch (error) {
        if (!active) {
          return
        }

        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        setListingError(error instanceof Error ? error.message : "Unable to load new listings.")
      } finally {
        if (active) {
          setLoadingListings(false)
        }
      }
    }

    void loadNewListings()

    return () => {
      active = false
      controller.abort()
    }
  }, [searchQuery])

  function removeRecent(keyword: string) {
    setRecentList((current) => current.filter((item) => item !== keyword))
  }

  function clearAllRecent() {
    setRecentList([])
  }

  function applySuggestedSearch(keyword: string) {
    setSearchQuery(keyword)
    setRecentList((current) => addRecentKeyword(current, keyword))
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="-ml-2 rounded-full p-2 transition-colors hover:bg-white/10">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onBlur={() => {
                if (searchQuery.trim()) {
                  setRecentList((current) => addRecentKeyword(current, searchQuery))
                }
              }}
              placeholder="Search artists, artifacts, or collections..."
              className="w-full rounded-full border border-white/10 bg-white/10 py-2.5 pl-10 pr-10 text-sm text-white transition-all placeholder:text-white/40 focus:border-[#FF6B9D]/50 focus:outline-none focus:ring-1 focus:ring-[#FF6B9D]/50"
              autoFocus
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 rounded-full p-1 -translate-y-1/2 hover:bg-white/10"
              >
                <X className="h-4 w-4 text-white/40" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="scrollbar-dark h-[calc(100dvh-69px)] overflow-y-auto overscroll-y-contain px-4 py-6 pb-10">
        <div className="space-y-8">
          {recentList.length ? (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/40" />
                  <h2 className="text-sm font-medium text-white/60">Recent Searches</h2>
                </div>
                <button
                  onClick={clearAllRecent}
                  className="text-xs text-[#FF6B9D] transition-colors hover:text-[#ff8bb2]"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentList.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => applySuggestedSearch(keyword)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left"
                  >
                    <span className="text-sm text-white/80">{keyword}</span>
                    <span
                      onClick={(event) => {
                        event.stopPropagation()
                        removeRecent(keyword)
                      }}
                      className="rounded-full p-0.5 hover:bg-white/10"
                    >
                      <X className="h-3 w-3 text-white/40" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FF6B9D]" />
              <h2 className="text-sm font-medium text-white/60">Trending Now</h2>
            </div>
            <div className="space-y-1">
              {trendingSearches.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => applySuggestedSearch(item.keyword)}
                  className="flex w-full items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white/5"
                >
                  <span className={`w-6 text-center font-bold ${index < 3 ? "text-[#FF6B9D]" : "text-white/40"}`}>
                    {index + 1}
                  </span>
                  <span className="flex-1 text-left text-white/90">{item.keyword}</span>
                  {item.hot ? (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame className="h-3 w-3" />
                      HOT
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium text-white/60">Recommended For You</h2>
            <div className="space-y-3">
              {recommendedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-[#FF6B9D]/30"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    {item.status === "LIVE" ? (
                      <div className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        LIVE
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-white">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-white/40">{item.artist}</p>
                    <p className={`mt-1 text-xs ${item.status === "LIVE" ? "text-[#FF6B9D]" : "text-white/60"}`}>
                      {item.meta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-white/60">New Listings</h2>
                <p className="mt-1 text-xs text-white/35">Fresh registry entries from the admin dashboard appear here.</p>
              </div>
              {searchQuery.trim() ? (
                <p className="text-xs text-white/45">Filtered by "{searchQuery.trim()}"</p>
              ) : null}
            </div>

            {listingError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {listingError}
              </div>
            ) : loadingListings ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : newListings.length ? (
              <div className="space-y-3">
                {newListings.map((artifact) => {
                  return (
                    <article
                      key={artifact.id}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition-colors hover:border-white/20"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                        {artifact.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={artifact.image_url} alt={artifact.artifact_title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-end bg-[linear-gradient(160deg,rgba(255,107,157,0.28),rgba(255,255,255,0.04))] p-2">
                            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                              {artifact.usage_tier ?? "Artifact"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{artifact.artifact_title}</p>
                            <p className="mt-1 truncate text-xs text-white/45">
                              {artifact.artist_name ?? "Unknown artist"}
                              {artifact.era_name ? ` · ${artifact.era_name}` : ""}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                            {artifact.artifact_code}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {artifact.current_status ? (
                            <span className="rounded-full bg-[#FF6B9D]/12 px-2.5 py-1 text-[11px] text-[#ff9ebe]">
                              {titleCase(artifact.current_status)}
                            </span>
                          ) : null}
                          {artifact.usage_tier ? (
                            <span className="rounded-full bg-white/7 px-2.5 py-1 text-[11px] text-white/70">
                              {artifact.usage_tier}
                            </span>
                          ) : null}
                          <span className="text-[11px] text-white/40">
                            {artifact.created_at ? `Added ${formatDate(artifact.created_at)}` : "Recently added"}
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/55">
                No registry listings match this search yet.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
