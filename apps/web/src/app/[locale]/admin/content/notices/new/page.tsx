import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { NoticeForm } from "../NoticeForm";

export default async function NewNotice() {
  const user = await requireStaff("cms:create");
  return (
    <div className="space-y-6">
      <PageHeader title="New notice" />
      <NoticeForm notice={{ tr: {} }} canPublish={can(user, "cms:publish")} canDelete={false} />
    </div>
  );
}
