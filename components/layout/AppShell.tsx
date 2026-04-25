"use client";
import BottomNav from "./BottomNav";

interface Props {
  children: React.ReactNode;
  activeTab: "dashboard" | "insights" | "ai" | "profile";
}

export default function AppShell({ children, activeTab }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <main className="pb-20">{children}</main>
      <BottomNav activeTab={activeTab} />
    </div>
  );
}
