import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { getUserLocale } from '@/lib/i18n';
import SessionController from '@/components/providers/SessionController';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["700", "800", "900"],
  display: "swap",
  preload: true,
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://online-senior-project-management-sy.vercel.app'),
  title: "SeniorProj | Online Senior Project Management System",
  description: "A premium platform for university senior projects, connecting students, instructors, and industry partners.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getUserLocale();
  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    messages = (await import(`../messages/en.json`)).default;
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to Google Fonts to eliminate DNS round-trip delay */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for Supabase API */}
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionController />
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
