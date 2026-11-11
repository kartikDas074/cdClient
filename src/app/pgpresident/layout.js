import PresidentGuard from "@/components/president/PresidentGuard";

export default function ProgrammingPresidentLayout({ children }) {
  return (
    <PresidentGuard requiredRole="pgpresident" roleLabel="Programming Club President">
      {children}
    </PresidentGuard>
  );
}
