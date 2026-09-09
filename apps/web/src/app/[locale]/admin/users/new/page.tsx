import { prisma } from "@vgmf/db";
import { requireStaff } from "@/lib/admin";
import { CreateUserForm } from "./CreateUserForm";

export default async function NewUserPage() {
  await requireStaff("users:create");
  const roles = await prisma.role.findMany({ where: { userKind: "STAFF" }, orderBy: { sortOrder: "asc" }, select: { key: true, name: true, description: true } });
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="text-sm text-stone-600">A 12-digit User ID and a one-time temporary password are generated. The password is emailed to the user and never shown to staff.</p>
      <CreateUserForm roles={roles} />
    </div>
  );
}
