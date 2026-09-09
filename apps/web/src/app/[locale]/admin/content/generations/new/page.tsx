import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { GenerationForm } from "../GenerationForm";

export default async function NewGeneration() {
  await requireStaff("cms:create");
  return (
    <div className="space-y-6">
      <PageHeader title="Add generation" />
      <GenerationForm gen={{ tr: {} }} canDelete={false} />
    </div>
  );
}
