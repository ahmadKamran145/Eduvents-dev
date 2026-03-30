import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favourites | EDUVENTS",
  robots: { index: false, follow: false },
};

export default function FavouritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
