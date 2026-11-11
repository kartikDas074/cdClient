import PresidentGuard from "@/components/president/PresidentGuard";

export default function PresidentLayout({ children }) {
  return <PresidentGuard>{children}</PresidentGuard>;
}
