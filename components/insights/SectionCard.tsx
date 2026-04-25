"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  children: React.ReactNode;
  onTellMore?: () => void;
  loading?: boolean;
}

export function SectionCard({ title, subtitle, subtitleColor = "text-gray-500", children, onTellMore, loading }: Props) {
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${subtitleColor}`}>{subtitle}</p>}
        </div>
        {onTellMore && (
          <button
            onClick={onTellMore}
            className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Tell me more
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
