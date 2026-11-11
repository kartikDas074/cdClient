import ClubMembershipManager from "@/components/membership/ClubMembershipManager";
import PresidentGuard from "@/components/president/PresidentGuard";

export default function ProgrammingMembershipRequestsPage() {
  return (
    <PresidentGuard requiredRole="pgpresident" roleLabel="Programming Club President">
      <ClubMembershipManager clubType="programming" mode="requests" />
    </PresidentGuard>
  );
}
