import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "AssessForge - AI Assessment Creator",
  description:
    "An advanced AI-powered platform for educators to design, customize, and print structured, syllabus-aligned question papers and solution keys with real-time classroom dispatching.",
  keywords: [
    "AssessForge",
    "VedaAI",
    "AI Assessment Creator",
    "Exam Draft Automation",
    "CBSE Question Generator",
    "Academic Evaluation AI",
    "Syllabus Ingestion RAG",
    "Student Evaluation Portal",
    "Classroom Dispatching",
  ],
  authors: [{ name: "Chaitanya Shah", url: "https://github.com/ChaitanyaShah26" }],
  creator: "Chaitanya Shah",
  openGraph: {
    title: "AssessForge - Dynamic Academic Assessments",
    description: "An advanced AI-powered platform for educators to design, customize, and print structured, syllabus-aligned question papers and solution keys.",
    url: "",
    siteName: "AssessForge",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AssessForge — Dynamic Academic Assessments",
    description: "An advanced AI-powered platform for educators to design, customize, and print structured, syllabus-aligned question papers.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${bricolage.variable} font-sans antialiased selection:bg-brand-orange/20`}
      >
        {children}
      </body>
    </html>
  );
}