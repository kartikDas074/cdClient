import ClubMembershipManager from "@/components/membership/ClubMembershipManager";
import PresidentGuard from "@/components/president/PresidentGuard";

export default function WebDevelopmentClubMembersPage() {
  return (
    <PresidentGuard requiredRole="wbpresident" roleLabel="Web Development Club President">
      <ClubMembershipManager clubType="web-development" mode="members" />
    </PresidentGuard>
  );
}
