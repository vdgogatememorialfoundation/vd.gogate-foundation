import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { PageForm } from "../PageForm";

export default async function NewPage() {
  const user = await requireStaff("cms:create");
  return (
    <div className="space-y-6">
      <PageHeader title="New page" />
      <PageForm page={{ kind: "CUSTOM", tr: {} }} canPublish={can(user, "cms:publish")} canDelete={false} />
    </div>
  );
}
