import PresidentGuard from "@/components/president/PresidentGuard";

export default function WebPresidentLayout({ children }) {
  return (
    <PresidentGuard requiredRole="wbpresident" roleLabel="Web Development Club President">
      {children}
    </PresidentGuard>
  );
}
