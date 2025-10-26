// import Cattracker from "@/components/Cattracker";
import ComingSoon from "@/components/ComingSoon";
import HomePage from "@/components/HomePage";
import LmsPlatform from "@/components/LmsPlatform";
// import ReactPlayerComponent from "@/components/ReactPlayer";
// import Image from "next/image";

export const metadata = {
  title: '10tracker - Exam Preparation Platform',
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
  openGraph: {
    title: '10tracker - Exam Preparation Platform',
    description: 'Comprehensive exam preparation platform for CAT, GATE, UPSC, JEE, NEET and other competitive exams. Practice MCQs, mock tests, and access study materials.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.in',
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
  },
};

export default function Home() {
  return <HomePage />;
}
