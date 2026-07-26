import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/content/content-editor";
import { getContent, listTags } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getContent(id);
  if (!record) notFound();
  const tags = listTags();
  return <ContentEditor record={record} allTags={tags} />;
}
