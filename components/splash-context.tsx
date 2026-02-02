"use client"

import { createContext, useContext, useState, useCallback } from "react"

const SplashContext = createContext<{
  isSplashVisible: boolean
  setSplashVisible: (visible: boolean) => void
}>({ isSplashVisible: false, setSplashVisible: () => {} })

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [isSplashVisible, setSplashVisible] = useState(false)
  return (
    <SplashContext.Provider value={{ isSplashVisible, setSplashVisible }}>
      {children}
    </SplashContext.Provider>
  )
}

export function useSplash() {
  return useContext(SplashContext)
}
