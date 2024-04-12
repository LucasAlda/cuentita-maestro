import { type AppType } from "next/app";
import { Inter } from "next/font/google";

import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <SessionProvider>
      <main
        className={`flex min-h-screen w-full flex-col bg-slate-100 font-sans ${inter.variable}`}
      >
        <Navbar />
        <Component {...pageProps} />
      </main>
      <Script src="/start-workers.js" />
    </SessionProvider>
  );
};

export default MyApp;
