import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoed-signal",
  description: "科技商业新闻，为清晰决策而筛选。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
