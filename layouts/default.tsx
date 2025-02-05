import { Link } from "@heroui/link";

import { Head } from "./head";

import { Navbar } from "@/components/navbar";
import { ThemeSwitch } from "@/components/theme-switch";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Head />
      <header className="flex justify-between items-center pt-2 px-4">
        <h1>FARS Proposal Revisor</h1>
        <ThemeSwitch/>
      </header>
      <main className="container mx-auto px-6 flex-grow pt-16">
        {children}
      </main>
    </div>
  );
}
