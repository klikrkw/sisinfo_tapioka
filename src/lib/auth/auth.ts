import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await db
          .select({ user: users, role: roles })
          .from(users)
          .leftJoin(roles, eq(users.roleId, roles.id))
          .where(eq(users.email, String(credentials.email)))
          .limit(1);

        const found = rows[0];
        if (!found || !found.user.status) return null;

        const valid = await bcrypt.compare(String(credentials.password), found.user.password);
        if (!valid) return null;

        return {
          id: String(found.user.id),
          name: found.user.name,
          email: found.user.email,
          role: found.role?.name ?? "User",
        };
      },
    }),
  ],
});
