import type { Metadata } from "next";
import { Manrope, Nunito, Outfit, Poppins, Sora, Space_Grotesk, Urbanist } from "next/font/google";
import "./globals.css";
import AppConvexProvider from "@/components/Providers/ConvexProvider";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "FlowBot",
  description: "Visual chatbot flow builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${manrope.variable} ${outfit.variable} ${sora.variable} ${urbanist.variable} ${nunito.variable} ${poppins.variable} ${spaceGrotesk.variable} min-h-full flex flex-col`}
      >
        <AppConvexProvider>{children}</AppConvexProvider>
      </body>
    </html>
  );
}
