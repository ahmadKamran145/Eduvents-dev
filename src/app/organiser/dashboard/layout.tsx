import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organiser Dashboard | EDUVENTS",
  robots: { index: false, follow: false },
};

export default function OrganiserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
