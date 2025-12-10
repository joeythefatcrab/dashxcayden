import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      isImpersonating?: boolean;
      realRole?: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}
