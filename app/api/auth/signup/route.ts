import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const ALLOWED_SELF_SIGNUP_ROLES = ["PARENT", "STUDENT"];

export async function POST(req: Request) {
  try {
    const { email, password, name, role, inviteCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let assignedRole: string;

    if (inviteCode) {
      // --- Invite code path ---
      const invite = await db.inviteCode.findUnique({ where: { code: inviteCode } });

      if (!invite) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
      }
      if (invite.usedAt) {
        return NextResponse.json({ error: "This invite code has already been used" }, { status: 400 });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return NextResponse.json({ error: "This invite code has expired" }, { status: 400 });
      }

      assignedRole = invite.role;
    } else {
      // --- Signup-code gate path ---
      const cookieStore = await cookies();
      const validated = cookieStore.get("signup_code_validated");
      if (!validated) {
        return NextResponse.json({ error: "Invalid or missing signup code" }, { status: 403 });
      }

      if (!role || !ALLOWED_SELF_SIGNUP_ROLES.includes(role.toUpperCase())) {
        return NextResponse.json(
          { error: "Invalid role. Must be PARENT or STUDENT" },
          { status: 400 }
        );
      }
      assignedRole = role.toUpperCase();
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please use a different email or sign in." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: assignedRole as any,
        emailVerified: new Date(),
      },
    });

    // If student, auto-create student profile
    if (assignedRole === "STUDENT") {
      await db.student.create({
        data: {
          name: name || email.split("@")[0],
          userId: user.id,
          parentId: user.id,
        },
      });
    }

    // Mark invite code as used
    if (inviteCode) {
      await db.inviteCode.update({
        where: { code: inviteCode },
        data: { usedAt: new Date(), usedByEmail: email },
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
