import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with LynxPrompt. We'd love to hear from you—whether you have questions, feedback, or need support.",
  keywords: ["contact LynxPrompt", "support", "feedback", "help"],
  openGraph: {
    title: "Contact LynxPrompt",
    description:
      "Get in touch with us. Questions, feedback, or support—we're here to help.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact LynxPrompt",
    description: "Get in touch with us for questions, feedback, or support.",
  },
  alternates: {
    canonical: "https://lynxprompt.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}









