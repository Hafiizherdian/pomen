"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { pool } from "@/lib/db"
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/admin-token"
import { verifyPassword } from "@/lib/password"
import { isRole } from "@/lib/roles"
import type { LoginState } from "@/lib/admin-types"


export async function login(_prev:LoginState, formData: FormData): Promise<LoginState> {
    if (!process.env.SESSION_SECRET) {
        return { error: "SESSION_SECRET belum diatur di env server"}
    }

    const email = String(formData.get("email") ?? "").trim().toLocaleLowerCase()
    const password = String(formData.get("password") ?? "")
    const next = String(formData.get("next") ?? "")

    const {rows} = await pool.query<{
        id: string
        role: string
        password_hash: string | null
        is_active: boolean
    }>("select id, role, password_hash, is_active from profiles where lower(email) = $1", [email])
    const user = rows[0]

    const valid = Boolean(
      user &&
        isRole(user.role) &&
        user.is_active &&
        user.password_hash &&
        (await verifyPassword(password, user.password_hash)),
    )
    if (!user || !isRole(user.role)  || !valid) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { error: "Email atau password sualah e"}
    }

    const store = await cookies()
    store.set(SESSION_COOKIE, await createSessionToken({ userId: user.id, role: user.role}), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production" && process.env.ADMIN_COOKIE_SECURE !== "false",
        path: "/",
        maxAge: SESSION_MAX_AGE
    })

    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/")
}

export async function logout() {
    const store = await cookies()
    store.delete(SESSION_COOKIE)
    redirect("/login")
}