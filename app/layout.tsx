import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "사주랩 — 무료 사주풀이, 연애운, 올해 운세", template: "%s | 사주랩" },
  description: "생년월일로 보는 무료 사주풀이. 타고난 성격, 연애운, 직업, 재물운, 올해 운세를 쉬운 말로 만나세요. 양력, 음력, 윤달 지원, 회원가입 없이 이용하는 Lucian Labs 오픈소스 서비스.",
  applicationName: "사주랩",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "사주랩, Saju Lab", url: SITE_URL,
    title: "사주랩 — 무료 사주풀이, 연애운, 올해 운세",
    description: "내 사주가 궁금한가요? 성격부터 연애운, 재물운, 올해 운세까지, 회원가입 없이 무료로.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "무료 사주풀이 사주랩과 다섯 오행 친구" }],
  },
  twitter: { card: "summary_large_image", title: "사주랩 — 무료 사주풀이, 연애운, 올해 운세", images: ["/og.png"] },
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
