"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            expand={false}
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                borderRadius: "1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "1px solid hsl(270 30% 88% / 0.6)",
                boxShadow:
                  "0 8px 24px -4px hsl(262 83% 58% / 0.12), 0 2px 8px -2px hsl(0 0% 0% / 0.08)",
              },
              classNames: {
                toast: "animate-fade-up",
                title: "font-semibold",
                description: "text-muted-foreground",
              },
            }}
          />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
