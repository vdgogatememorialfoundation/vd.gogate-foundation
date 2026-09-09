import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { ClinicForm } from "../ClinicForm";

export default async function NewClinic() {
  await requireStaff("cms:create");
  return (
    <div className="space-y-6">
      <PageHeader title="Add clinic" />
      <ClinicForm clinic={{ tr: {} }} canDelete={false} />
    </div>
  );
}
