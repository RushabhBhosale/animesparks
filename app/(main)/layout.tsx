import Header from "@/components/header";
import Footer from "@/components/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      suppressHydrationWarning
      className="min-h-dvh flex flex-col justify-between"
    >
      <div>
        <Header />
        {children}
      </div>
      <Footer />
    </div>
  );
}
