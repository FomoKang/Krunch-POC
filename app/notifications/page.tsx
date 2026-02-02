"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Bell, Gavel, Trophy, Heart, MessageCircle, TrendingUp, Check, Trash2 } from "lucide-react"
import { useLocale } from "@/components/locale-provider"

// 알림 데이터
const notificationsData = [
  {
    id: 1,
    type: "bid_outbid",
    title: "You've been outbid!",
    message: "Someone placed a higher bid on PEACEMINUSONE Cap",
    time: "2 min ago",
    read: false,
    image: "/peaceminusone-gd-cap-burgundy-red-with-flames-stre.jpg",
    actionUrl: "/auction",
  },
  {
    id: 2,
    type: "auction_ending",
    title: "Auction ending soon",
    message: "PEACEMINUSONE Cap auction ends in 30 minutes",
    time: "28 min ago",
    read: false,
    image: "/peaceminusone-gd-cap-burgundy-red-with-flames-stre.jpg",
    actionUrl: "/auction",
  },
  {
    id: 3,
    type: "new_drop",
    title: "New Legend Drop!",
    message: "G-DRAGON just listed a new item for auction",
    time: "1 hour ago",
    read: false,
    image: "/images/gd-avatar.png",
    actionUrl: "/",
  },
  {
    id: 4,
    type: "community",
    title: "Your vote is winning!",
    message: "GD's outfit is leading 73% in the Fashion Battle",
    time: "2 hours ago",
    read: true,
    image: "/images/gd-avatar.png",
    actionUrl: "/community",
  },
  {
    id: 5,
    type: "ranking",
    title: "Rank up!",
    message: "You've moved up to #47 in Top Collectors",
    time: "5 hours ago",
    read: true,
    image: null,
    actionUrl: "/ranking",
  },
  {
    id: 6,
    type: "bid_won",
    title: "Congratulations!",
    message: "You won the auction for Supreme Box Logo Hoodie",
    time: "1 day ago",
    read: true,
    image: "/supreme-box-logo-hoodie-red-streetwear.jpg",
    actionUrl: "/profile",
  },
  {
    id: 7,
    type: "follow",
    title: "New follower",
    message: "VIP_DRAGON started following you",
    time: "2 days ago",
    read: true,
    image: null,
    actionUrl: "/profile",
  },
]

function getNotificationIcon(type: string) {
  switch (type) {
    case "bid_outbid":
      return <TrendingUp className="w-4 h-4 text-red-400" />
    case "auction_ending":
      return <Gavel className="w-4 h-4 text-orange-400" />
    case "new_drop":
      return <Bell className="w-4 h-4 text-[#FF6B9D]" />
    case "community":
      return <Heart className="w-4 h-4 text-pink-400" />
    case "ranking":
      return <Trophy className="w-4 h-4 text-yellow-400" />
    case "bid_won":
      return <Trophy className="w-4 h-4 text-green-400" />
    case "follow":
      return <MessageCircle className="w-4 h-4 text-blue-400" />
    default:
      return <Bell className="w-4 h-4 text-white/60" />
  }
}

function getNotificationBgColor(type: string, read: boolean) {
  if (read) return "bg-white/5"
  switch (type) {
    case "bid_outbid":
      return "bg-red-500/10 border-red-500/20"
    case "auction_ending":
      return "bg-orange-500/10 border-orange-500/20"
    case "new_drop":
      return "bg-[#FF6B9D]/10 border-[#FF6B9D]/20"
    case "bid_won":
      return "bg-green-500/10 border-green-500/20"
    default:
      return "bg-white/5 border-white/10"
  }
}

export default function NotificationsPage() {
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const [notifications, setNotifications] = useState(notificationsData)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{isKo ? "알림" : "Notifications"}</h1>
              {unreadCount > 0 && (
                <span className="bg-[#FF6B9D] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs text-[#FF6B9D] hover:text-[#FF6B9D]/80 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-white/60 font-medium">{isKo ? "아직 알림이 없어요" : "No notifications yet"}</h3>
            <p className="text-white/40 text-sm mt-1">{isKo ? "새 소식이 있으면 알려드릴게요" : "We'll notify you when something happens"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative rounded-xl border transition-all ${getNotificationBgColor(
                  notification.type,
                  notification.read
                )} ${!notification.read ? "border" : "border-white/5"}`}
              >
                <Link
                  href={notification.actionUrl}
                  onClick={() => markAsRead(notification.id)}
                  className="flex items-start gap-3 p-4"
                >
                  {/* 아이콘 또는 이미지 */}
                  <div className="flex-shrink-0">
                    {notification.image ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/10">
                        <Image
                          src={notification.image || "/placeholder.svg"}
                          alt=""
                          fill
                          className="object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 bg-black rounded-full">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-medium ${!notification.read ? "text-white" : "text-white/70"}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-[#FF6B9D] rounded-full mt-1.5" />
                      )}
                    </div>
                    <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-white/30 text-xs mt-1.5">{notification.time}</p>
                  </div>
                </Link>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-white/40" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
