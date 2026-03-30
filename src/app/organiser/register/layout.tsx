import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organiser Register | EDUVENTS",
  robots: { index: false, follow: false },
};

export default function OrganiserRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
