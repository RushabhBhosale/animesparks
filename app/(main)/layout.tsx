import Header from "@/components/header";
import Footer from "@/components/footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh flex flex-col bg-[#050505] text-[#f0f0f0]">
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
