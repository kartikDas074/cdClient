import ClubMembershipManager from "@/components/membership/ClubMembershipManager";
import PresidentGuard from "@/components/president/PresidentGuard";

export default function ProgrammingClubMembersPage() {
  return (
    <PresidentGuard requiredRole="pgpresident" roleLabel="Programming Club President">
      <ClubMembershipManager clubType="programming" mode="members" />
    </PresidentGuard>
  );
}
