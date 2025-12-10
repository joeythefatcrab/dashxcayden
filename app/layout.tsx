import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FloatingExitQA } from "@/components/superadmin/FloatingExitQA";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Homeschool SaaS - Adaptive Curriculum Platform",
  description: "Upload your curriculum, let students learn at their own pace with intelligent gating, and get automated progress reports.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let userTheme = "light";

  // Get user's theme preference if logged in
  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });
    userTheme = user?.theme || "light";
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider theme={userTheme}>
          <SessionProvider>
            {children}
            <FloatingExitQA />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
