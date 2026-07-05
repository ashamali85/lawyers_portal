import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adala — Find a Lawyer in Kuwait",
  description:
    "Adala is Kuwait's verified legal directory. Browse vetted lawyers and firms by practice area and governorate, at no cost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
