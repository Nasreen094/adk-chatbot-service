export interface ChatHistoryItem {
  id: string
  title: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

