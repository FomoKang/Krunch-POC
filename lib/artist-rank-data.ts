/** 랭킹·아티스트 페이지 공용: 아티스트 목록 및 rank로 조회 */

export type ArtistRankItem = {
  rank: number
  name: string
  avatar: string
  totalSales: number
  itemsSold: number
  rankChange?: number
}

export const artistRankDataFull: ArtistRankItem[] = [
  { rank: 1, name: "G-DRAGON", avatar: "/images/gd-avatar.jpg", totalSales: 2847000000, itemsSold: 47, rankChange: 0 },
  { rank: 2, name: "JENNIE", avatar: "/images/jennie-avatar.jpg", totalSales: 2150000000, itemsSold: 38, rankChange: -1 },
  { rank: 3, name: "SON HEUNG MIN", avatar: "/images/son-avatar.png", totalSales: 1923000000, itemsSold: 32, rankChange: 1 },
  { rank: 4, name: "GONG YOO", avatar: "/images/gong-avatar.jpg", totalSales: 1456000000, itemsSold: 28, rankChange: 2 },
  { rank: 5, name: "FELIX", avatar: "/images/felix-avatar.jpg", totalSales: 987000000, itemsSold: 19, rankChange: -1 },
  { rank: 6, name: "PARK GYU YOUNG", avatar: "/images/park-avatar.png", totalSales: 654000000, itemsSold: 15, rankChange: 0 },
  { rank: 7, name: "KARINA", avatar: "/images/karina-avatar.jpg", totalSales: 542000000, itemsSold: 12, rankChange: 1 },
  { rank: 8, name: "V", avatar: "/v-profile.jpg", totalSales: 421000000, itemsSold: 10, rankChange: -2 },
  { rank: 9, name: "JIMIN", avatar: "/jimin-profile.jpg", totalSales: 398000000, itemsSold: 9, rankChange: 1 },
  { rank: 10, name: "JUNGKOOK", avatar: "/jungkook-profile.jpg", totalSales: 356000000, itemsSold: 8, rankChange: 0 },
  { rank: 11, name: "LISA", avatar: "/lisa-profile.jpg", totalSales: 312000000, itemsSold: 7, rankChange: 2 },
  { rank: 12, name: "ROSE", avatar: "/rose-profile.jpg", totalSales: 287000000, itemsSold: 7, rankChange: -1 },
  { rank: 13, name: "IU", avatar: "/IU-profile.jpg", totalSales: 265000000, itemsSold: 6, rankChange: 0 },
  { rank: 14, name: "SUGA", avatar: "/suga-profile.jpg", totalSales: 243000000, itemsSold: 6, rankChange: 1 },
  { rank: 15, name: "J-HOPE", avatar: "/j-hope-profile.jpg", totalSales: 221000000, itemsSold: 5, rankChange: -1 },
  { rank: 16, name: "RM", avatar: "/rm-profile.jpg", totalSales: 198000000, itemsSold: 5, rankChange: 0 },
  { rank: 17, name: "JIN", avatar: "/jin-profile.jpg", totalSales: 176000000, itemsSold: 4, rankChange: 2 },
  { rank: 18, name: "TAEYEON", avatar: "/taeyeon-profile.jpg", totalSales: 154000000, itemsSold: 4, rankChange: -1 },
  { rank: 19, name: "YUQI", avatar: "/yuqi-profile.jpg", totalSales: 132000000, itemsSold: 3, rankChange: 0 },
  { rank: 20, name: "WINTER", avatar: "/winter-profile.jpg", totalSales: 118000000, itemsSold: 3, rankChange: 1 },
]

export function getArtistByRank(rank: number): ArtistRankItem | null {
  const n = Number(rank)
  if (!Number.isInteger(n) || n < 1 || n > 20) return null
  return artistRankDataFull.find((a) => a.rank === n) ?? null
}
