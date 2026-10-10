import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "사주랩 — 나를 알아가는 작은 정원", template: "%s | 사주랩" },
  description: "회원가입 없이 누구나 무료로. 정확한 달력 계산으로 나만의 사주 이야기를 만나고, 예쁜 카드로 간직하세요. X 루샨이 만든 Lucian Labs 오픈소스 프로젝트.",
  applicationName: "사주랩",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "사주랩 · Saju Lab", url: SITE_URL,
    title: "사주랩 — 나를 알아가는 작은 정원",
    description: "회원가입도, 결제도 없이. 나만의 사주 이야기를 예쁜 카드로 간직해요.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "사주랩의 다섯 오행 친구와 나만의 작은 정원" }],
  },
  twitter: { card: "summary_large_image", title: "사주랩 — 나를 알아가는 작은 정원", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
