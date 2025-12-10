"use client"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "./theme-provider"
import { HostProvider } from "@/hooks/use-hosts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={['light', 'dark', 'glacier']}
    >
      <HostProvider>
        {children}
      </HostProvider>
      <Toaster />
    </ThemeProvider>
  )
}
