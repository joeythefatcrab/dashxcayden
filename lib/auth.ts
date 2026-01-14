import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // @ts-expect-error - Type mismatch between next-auth and @auth/prisma-adapter versions
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore - role exists in our User model
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore - role exists in our User model
        session.user.role = token.role;

        // Skip database queries in Edge Runtime (middleware)
        // In Edge Runtime, we can't use Prisma, so wrap in try-catch
        try {
          const cookieStore = await cookies();

          // Check for full user impersonation (superadmin backdoor for testing)
          const impersonateUserId = cookieStore.get("impersonate_user_id");
          const impersonateAdminId = cookieStore.get("impersonate_admin_id");

          if (token.role === "SUPERADMIN" && impersonateUserId?.value && impersonateAdminId?.value) {
            // Load the impersonated user's data
            const impersonatedUser = await db.user.findUnique({
              where: { id: impersonateUserId.value },
              select: { id: true, email: true, name: true, role: true },
            });

            if (impersonatedUser) {
              // Override session with impersonated user
              // @ts-ignore
              session.user.id = impersonatedUser.id;
              // @ts-ignore
              session.user.email = impersonatedUser.email;
              // @ts-ignore
              session.user.name = impersonatedUser.name;
              // @ts-ignore
              session.user.role = impersonatedUser.role;
              // @ts-ignore - Mark as impersonating
              session.user.isImpersonating = true;
              // @ts-ignore - Store real admin info
              session.user.realAdminId = impersonateAdminId.value;
              session.user.realRole = token.role;
            }
          } else {
            // Check for role-only impersonation (legacy QA feature)
            const impersonateRole = cookieStore.get("impersonate_role");

            if (token.role === "SUPERADMIN" && impersonateRole?.value) {
              // @ts-ignore - Override role for QA testing
              session.user.role = impersonateRole.value;
              // @ts-ignore - Mark that this is impersonation
              session.user.isImpersonating = true;
              // @ts-ignore - Store real role
              session.user.realRole = token.role;
            }
          }
        } catch (error) {
          // Silently fail in edge runtime - impersonation won't work in middleware but that's ok
          // This happens when middleware runs with Edge Runtime and can't access Prisma
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect to dashboard
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },
});
