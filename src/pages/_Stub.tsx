import { Hammer } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/shell/PageHeader";

export function Stub({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={<Hammer weight="duotone" />} title={`${title} is being built`} description="This screen is a placeholder." />
    </>
  );
}
