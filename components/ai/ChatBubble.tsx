"use client";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Props {
  message: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  };
}

export default function ChatBubble({ message }: Props) {
  const isAi = message.role === "assistant";

  if (isAi) {
    return (
      <div className="flex gap-2.5 items-start">
        <div className="w-7 h-7 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="max-w-[85%]">
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">
            {format(new Date(message.timestamp), "h:mm a")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="bg-green-600 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-white leading-relaxed">{message.content}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right mr-1">
          {format(new Date(message.timestamp), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
