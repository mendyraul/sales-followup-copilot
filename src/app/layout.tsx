import "./globals.css";
export const metadata = {
  title: "Follow Through · Sales Follow-Up",
  description: "A local workspace for thoughtful sales follow-up.",
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
