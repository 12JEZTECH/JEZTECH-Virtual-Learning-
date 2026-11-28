import type { Metadata, Viewport } from "next";
import WhatsAppContact from './support/whatsapp';
import AccessibilityTools from "./accessibility/tools";
import AccessBoundary from "./classroom/access-boundary";
import "./globals.css";
import "./mobile.css";
import "./chat/lounge.css";
import "./hub/hub.css";
import "./student/home.css";
import "./live/live.css";
import "./polish.css";
import "./learner-ui.css";
import "./school/school.css";
import "./schools/schools.css";

export const viewport: Viewport = {width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#15392e"};

export const metadata: Metadata = {
  title: "JEZTECH Learning | Classes, lessons and practicals",
  description: "Create assessments, take exams, and monitor sessions with verified accounts and shared records.",
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
    <html lang="en">
      <body className="antialiased"><AccessibilityTools/><AccessBoundary>{children}</AccessBoundary><WhatsAppContact/></body>
    </html>
  );
}
