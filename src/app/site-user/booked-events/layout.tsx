import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Booked Events | EDUVENTS",
  robots: { index: false, follow: false },
};

export default function BookedEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
