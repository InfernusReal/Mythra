import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mythra",
  description: "Structured novel writing for high-output writers."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
          backgroundColor: "#f5f7fb",
          color: "#132238"
        }}
      >
        {children}
      </body>
    </html>
  );
}
