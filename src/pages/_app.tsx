import { type AppType } from "next/app";
import { Inter } from "next/font/google";

import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { Navbar } from "@/components/navbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) =>
        fetch("/api/" + queryKey.join("/")).then((res) => {
          if (!res.ok) {
            throw new Error("Error en la peticion");
          }
          return res.json();
        }),
    },
  },
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <main
          className={`flex min-h-screen w-full flex-col bg-slate-100 font-sans ${inter.variable}`}
        >
          <Navbar />
          <Component {...pageProps} />
        </main>
        <Script src="/start-workers.js" />
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default MyApp;
