import CreateClubForm from "@/components/president/CreateClubForm";

export const instant = false;

export default async function EditClubPage({ params }) {
  const { id } = await params;
  return <CreateClubForm clubId={id} />;
}
