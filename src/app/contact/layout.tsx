import type { Metadata } from "next";
import { APP_NAME, APP_URL } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Contact",
  description:
    `Get in touch with ${APP_NAME}. We'd love to hear from you—whether you have questions, feedback, or need support.`,
  keywords: [`contact ${APP_NAME}`, "support", "feedback", "help"],
  openGraph: {
    title: `Contact ${APP_NAME}`,
    description:
      "Get in touch with us. Questions, feedback, or support—we're here to help.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Contact ${APP_NAME}`,
    description: "Get in touch with us for questions, feedback, or support.",
  },
  alternates: {
    canonical: `${APP_URL}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}














