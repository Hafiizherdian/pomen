export const ROLES = ["root", "admin", "user"] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
    root: "Root",
    admin: "admin",
    user: "user"
}

const LEVEL: Record<Role, number> = { user: 1, admin: 2, root: 3}

export function isRole(value: unknown): value is Role {
    return typeof value === "string" && (ROLES as readonly string[]).includes(value)
}

export function roleAtLeast(role: Role, min: Role) {
    return LEVEL[role] >= LEVEL[min]
}