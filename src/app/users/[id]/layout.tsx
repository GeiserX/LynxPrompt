import type { Metadata } from "next";
import { prismaUsers } from "@/lib/db-users";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const user = await prismaUsers.user.findUnique({
      where: { id },
      select: {
        displayName: true,
        name: true,
        isProfilePublic: true,
        persona: true,
        image: true,
        _count: {
          select: {
            templates: {
              where: {
                OR: [{ visibility: "PUBLIC" }, { isPublic: true }],
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        title: "User Not Found",
        description: "This user profile doesn't exist.",
      };
    }

    if (!user.isProfilePublic) {
      return {
        title: user.displayName || user.name || "Private Profile",
        description: "This user's profile is private.",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const displayName = user.displayName || user.name || "LynxPrompt User";
    const templateCount = user._count.templates;
    
    const personaLabels: Record<string, string> = {
      backend: "Backend Developer",
      frontend: "Frontend Developer",
      fullstack: "Full Stack Developer",
      devops: "DevOps Engineer",
      mobile: "Mobile Developer",
      data: "Data Engineer",
      ml: "ML Engineer",
      security: "Security Engineer",
      other: "Developer",
    };

    const role = user.persona ? personaLabels[user.persona] || "Developer" : "Developer";
    const description = `${displayName} - ${role} on LynxPrompt. ${templateCount} public blueprint${templateCount !== 1 ? "s" : ""}.`;

    return {
      title: displayName,
      description,
      openGraph: {
        title: displayName,
        description,
        type: "profile",
        images: user.image
          ? [{ url: user.image, alt: displayName }]
          : [{ url: "/lynxprompt.png", alt: "LynxPrompt" }],
      },
      twitter: {
        card: "summary",
        title: displayName,
        description,
        images: user.image ? [user.image] : ["/lynxprompt.png"],
      },
      alternates: {
        canonical: `https://lynxprompt.com/users/${id}`,
      },
    };
  } catch (error) {
    console.error("Error fetching user for metadata:", error);
    return {
      title: "User Profile",
      description: "View this user's profile on LynxPrompt.",
    };
  }
}

// JSON-LD Person schema for public profiles
async function getUserJsonLd(id: string) {
  try {
    const user = await prismaUsers.user.findUnique({
      where: { id },
      select: {
        displayName: true,
        name: true,
        isProfilePublic: true,
        image: true,
        socialGithub: true,
        socialTwitter: true,
        socialLinkedin: true,
        socialWebsite: true,
      },
    });

    if (!user || !user.isProfilePublic) return null;

    const displayName = user.displayName || user.name || "LynxPrompt User";
    
    const sameAs: string[] = [];
    if (user.socialGithub) sameAs.push(`https://github.com/${user.socialGithub}`);
    if (user.socialTwitter) sameAs.push(`https://x.com/${user.socialTwitter}`);
    if (user.socialLinkedin) {
      sameAs.push(
        user.socialLinkedin.startsWith("http")
          ? user.socialLinkedin
          : `https://linkedin.com/in/${user.socialLinkedin}`
      );
    }
    if (user.socialWebsite) sameAs.push(user.socialWebsite);

    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: displayName,
      url: `https://lynxprompt.com/users/${id}`,
      image: user.image || "https://lynxprompt.com/lynxprompt.png",
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    };
  } catch {
    return null;
  }
}

export default async function UserProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jsonLd = await getUserJsonLd(id);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}









