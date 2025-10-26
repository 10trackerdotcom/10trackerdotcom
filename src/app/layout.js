import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "./context/AuthContext";
import AuthModalWrapper from "@/components/AuthModalWrapper";
import ProfileModal from "@/components/ProfileModal";
import AnalyticsInitializer from "@/components/AnalyticsInitializer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: {
    default: '10tracker - Exam Preparation Platform',
    template: '%s | 10tracker'
  },
  description: 'Comprehensive exam preparation platform for CAT, GATE, UPSC, JEE, NEET and other competitive exams. Practice MCQs, mock tests, and access study materials.',
  keywords: [
    'exam preparation',
    'CAT exam',
    'GATE exam',
    'UPSC preparation',
    'JEE preparation',
    'NEET preparation',
    'competitive exams',
    'mock tests',
    'MCQ practice',
    'study materials'
  ],
  authors: [{ name: '10tracker Team' }],
  creator: '10tracker',
  publisher: '10tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.in',
    title: '10tracker - Exam Preparation Platform',
    description: 'Comprehensive exam preparation platform for CAT, GATE, UPSC, JEE, NEET and other competitive exams. Practice MCQs, mock tests, and access study materials.',
    siteName: '10tracker',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '10tracker - Exam Preparation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '10tracker - Exam Preparation Platform',
    description: 'Comprehensive exam preparation platform for CAT, GATE, UPSC, JEE, NEET and other competitive exams.',
    images: ['/og-image.jpg'],
    creator: '@10tracker',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>
        
        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2873018653456315`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CatTracker" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <AuthProvider>
            <AnalyticsInitializer />
            <AuthModalWrapper />
            <Navbar/>
            <ProfileModal />
            <div className="pt-24">
              {children}
            </div>
            <Footer />
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
          </AuthProvider>
        </ClerkProvider>

      </body>
    </html>
  );
}