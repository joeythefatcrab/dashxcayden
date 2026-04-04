import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ImpersonationWidget } from "@/components/admin/ImpersonationWidget";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learnality",
  description: "Homeschool attendance tracking, progress reports, and curriculum management.",
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
            {session?.user && (
              <ImpersonationWidget
                // @ts-ignore
                isImpersonating={session.user.isImpersonating}
                // @ts-ignore
                impersonatedUserEmail={session.user.email}
              />
            )}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
