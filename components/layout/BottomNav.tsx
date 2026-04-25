"use client";
import Link from "next/link";
import { Home, BarChart2, Sparkles, User } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Home",     icon: Home,     href: "/dashboard" },
  { id: "insights",  label: "Insights", icon: BarChart2, href: "/insights" },
  { id: "ai",        label: "AI",       icon: Sparkles,  href: "/ai" },
  { id: "profile",   label: "Profile",  icon: User,      href: "/profile" },
];

interface Props {
  activeTab: string;
}

export default function BottomNav({ activeTab }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-2 py-2 z-20">
      <div className="flex justify-around">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link key={tab.id} href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : ""}`} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}>
                {tab.label}
              </span>
              {isActive && <div className="w-1 h-1 rounded-full bg-green-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
