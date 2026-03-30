import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings | EDUVENTS",
  robots: { index: false, follow: false },
};

export default function OrganiserAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
