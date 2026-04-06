import type { Metadata } from "next";
import "./globals.css";
import AppConvexProvider from "@/components/Providers/ConvexProvider";

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
      <body className="min-h-full flex flex-col">
        <AppConvexProvider>{children}</AppConvexProvider>
      </body>
    </html>
  );
}
