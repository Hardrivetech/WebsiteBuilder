import "./globals.css";

export const metadata = {
  title: "Website Builder",
  description: "Automated Website Builder SaaS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
