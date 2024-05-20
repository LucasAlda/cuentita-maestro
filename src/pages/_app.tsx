import { type AppType } from "next/app";
import { Inter } from "next/font/google";

import "@/styles/globals.css";
import { SessionProvider, signIn, useSession } from "next-auth/react";
import Script from "next/script";
import { Navbar } from "@/components/navbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      queryFn: ({ queryKey }) =>
        fetch("/api/" + queryKey.join("/")).then(async (res) => {
          if (!res.ok) {
            throw await res.json();
          }
          return res.json();
        }),
    },
  },
});

const Providers: AppType = ({ Component, pageProps }) => {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <App>
          <Component {...pageProps} />
        </App>
        <Script src="/start-workers.js" />
      </QueryClientProvider>
    </SessionProvider>
  );
};

const publicPaths = [
  "/login",
  "/api/auth",
  "/sw.js",
  "/start-workers.js",
  "/favicon.ico",
];

function App({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  const isPublic = publicPaths.some((path) => {
    return router.pathname.startsWith(path);
  });

  useEffect(() => {
    if (session.status === "unauthenticated" && !isPublic) {
      signIn();
    }
  }, [isPublic, router, session.status]);

  if (session.status !== "authenticated" && !isPublic) return null;

  return (
    <main
      className={`flex min-h-screen w-full flex-col bg-slate-100 font-sans ${inter.variable}`}
    >
      <Navbar />
      {children}
      <Toaster richColors />
    </main>
  );
}

export default Providers;
