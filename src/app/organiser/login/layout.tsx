import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organiser Login | EDUVENTS",
  robots: { index: false, follow: false },
};

export default function OrganiserLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
