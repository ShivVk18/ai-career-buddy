// Edge-safe Auth.js config (no Prisma, no bcrypt): shared by src/auth.js and src/middleware.js.
// Session strategy is JWT (the Credentials provider does not support database sessions). The token carries the
// user's DB id (User.id) as `sub`; session.user.id exposes it.
export const authConfig = {
  providers: [], // Credentials is added in src/auth.js. Google can be added there later (also needs an account-linking policy).
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/sign-in" },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};
