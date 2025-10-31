"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Chat } from "@/components/Chat";

export default function SingleChat() {
  // ✅ Extract chat ID (UUID) from the URL: /c/{id}
  const params = useParams();
  const conversationId = params?.id as string;

  // ✅ Pass the conversationId to the Chat component
  return <Chat conversationId={conversationId} />;
}
