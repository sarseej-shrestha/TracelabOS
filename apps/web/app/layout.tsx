import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'TraceLab OS — Debug a Student’s Thinking',
  description:
    'Follow the reasoning. Find the first error. Help the next step make sense.',
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
