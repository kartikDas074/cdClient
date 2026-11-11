import ClubDetailsClient from "./ClubDetailsClient";

export const instant = false;

export default async function ClubDetailsPage({ params }) {
  const { id } = await params;
  return <ClubDetailsClient key={id} id={id} />;
}
