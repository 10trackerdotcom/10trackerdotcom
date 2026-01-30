// import Cattracker from "@/components/Cattracker";
import ComingSoon from "@/components/ComingSoon";
import HomePage from "@/components/HomePage";
import LmsPlatform from "@/components/LmsPlatform";
// import ReactPlayerComponent from "@/components/ReactPlayer";
// import Image from "next/image";

export const metadata = {
  title: '10tracker - Latest Updates in 10 Points',
  description: 'Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.',
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
  openGraph: {
    title: '10tracker - Latest Updates in 10 Points',
    description: 'Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '10tracker - Latest Updates in 10 Points',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '10tracker - Latest Updates in 10 Points',
    description: 'Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.',
    images: ['/og-image.jpg'],
  },
};

export default function Home() {
  return <HomePage />;
}
