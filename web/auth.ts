import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertGoogleUser, findUserById, findUserByEmail } from "@/lib/auth/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email || !account.providerAccountId) {
        return false;
      }

      const dbUser = await upsertGoogleUser({
        email: user.email,
        name: user.name ?? null,
        authProviderUserId: account.providerAccountId
      });

      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        return token;
      }

      if (typeof token.userId === "string") {
        return token;
      }

      if (typeof token.email === "string") {
        const dbUser = await findUserByEmail(token.email);
        if (dbUser) {
          token.userId = dbUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      const dbUser =
        typeof token.userId === "string" ? await findUserById(token.userId) : null;

      session.user.id = dbUser?.id ?? (typeof token.userId === "string" ? token.userId : "");
      session.user.email = dbUser?.email ?? session.user.email ?? undefined;
      session.user.name = dbUser?.name ?? session.user.name ?? undefined;

      return session;
    }
  }
});
