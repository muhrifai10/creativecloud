"use server";

import { prisma } from "@nexusdrive/database";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(128)
    .regex(/[A-Za-z]/, "Password harus memuat huruf.")
    .regex(/[0-9]/, "Password harus memuat angka."),
});

export async function registerUser(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { fullName, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "Email sudah terdaftar." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name: fullName,
      passwordHash,
      profile: { create: { email, fullName } },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Gagal masuk otomatis, silakan login manual." };
    throw e; // NEXT_REDIRECT
  }
  redirect("/dashboard");
}

export async function loginAction(data: {
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email: data.email.toLowerCase().trim(),
      password: data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return { error: "Email atau password salah." };
    }
    const err = e as { message?: string; digest?: string };
    if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return { error: "Email atau password salah." };
  }
}

export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse({
    fullName: data.name,
    email: data.email,
    password: data.password,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { fullName, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "Email sudah terdaftar." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name: fullName,
      passwordHash,
      profile: { create: { email, fullName, onboardingCompleted: true } },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return { error: "Gagal masuk otomatis, silakan login manual." };
    }
    const err = e as { message?: string; digest?: string };
    if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    throw e;
  }
}
