import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "مهندس‌یار V2 — میزکار آمادگی آزمون نظام مهندسی",
  description:
    "پیاده‌سازی کامل معماری V2 روی محتوای واقعی APK: داشبورد، مطالعه مقررات، تمرین با هویت منبع، آزمون رسمی/جامع، نقشه راه و جستجوی سراسری",
  icons: {
    icon: "/app-icon.webp",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a4e7a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
