/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define message types
export type MessageType = "text" | "component";

// Define the structure of a single message
export interface Message {
  id: string;
  date: string;
  content: string;
  senderId: string;
  type: MessageType;
  componentName?: string; // Only required for 'component' type
  componentProps?: Record<string, unknown>; // Props for the component
  suggestions?: string[]; // Array of suggestion strings for bot messages
  chartData?: {
    title: string;
    range: string;
    config: any;
    data: any[];
  }; // Chart data for rendering charts
}

// Define the structure of a chat containing multiple messages
export interface Chat {
  id: string;
  messages: Message[];
}

// Define the initial state with an array of chats
interface ChatState {
  chats: Chat[];
}

const initialState: ChatState = {
  chats: [],
};

// Define the payload structure for adding a message
interface AddMessagePayload {
  chatId: string;
  message: Omit<Message, "id" | "date">; // Require type when adding messages
  messageId: string;
}

// Define the payload structure for updating a message with a new chunk
interface UpdateMessageChunkPayload {
  chatId: string;
  messageId: string;
  newChunk: string;
}

// Define the payload structure for updating message suggestions
interface UpdateMessageSuggestionsPayload {
  chatId: string;
  messageId: string;
  suggestions: string[];
}

// Define the payload structure for updating message chart data
interface UpdateMessageChartDataPayload {
  chatId: string;
  messageId: string;
  chartData: {
    title: string;
    range: string;
    config: any;
    data: any[];
  };
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Add a new chat
    addChat(state, action: PayloadAction<Chat>) {
      const newChat = {
        ...action.payload,
        messages: action.payload.messages ?? [],
      };
      state.chats.push(newChat);
    },
    // Remove an existing chat by its ID
    removeChat(state, action: PayloadAction<string>) {
      state.chats = state.chats.filter((chat) => chat.id !== action.payload);
    },
    // Add a new message to a specific chat
    addMessage(state, action: PayloadAction<AddMessagePayload>) {
      const { chatId, message, messageId } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        const fullMessage: Message = {
          ...message,
          id: messageId,
          date: new Date().toISOString(),
        };
        chat.messages.push(fullMessage);
      }
    },
    // Clear all chats
    clearChats(state) {
      state.chats = [];
    },
    // Update a specific chat by ID while preserving messages
    updateChat(state, action: PayloadAction<Chat>) {
      const index = state.chats.findIndex(
        (chat) => chat.id === action.payload.id,
      );
      if (index !== -1) {
        state.chats[index] = {
          ...state.chats[index],
          ...action.payload,
          messages: state.chats[index].messages, // Preserve existing messages
        };
      }
    },
    // Update a message's content by appending a new chunk
    updateMessageChunk(
      state,
      action: PayloadAction<UpdateMessageChunkPayload>,
    ) {
      const { chatId, messageId, newChunk } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) return;
      const message = chat.messages.find((m) => m.id === messageId);
      if (!message) return;
      if (message.type === "text") {
        message.content = newChunk;
      }
    },
    // Update a message's suggestions
    updateMessageSuggestions(
      state,
      action: PayloadAction<UpdateMessageSuggestionsPayload>,
    ) {
      const { chatId, messageId, suggestions } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) return;
      const message = chat.messages.find((m) => m.id === messageId);
      if (!message) return;
      message.suggestions = suggestions;
    },
    // Update a message's chart data
    updateMessageChartData(
      state,
      action: PayloadAction<UpdateMessageChartDataPayload>,
    ) {
      const { chatId, messageId, chartData } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) return;
      const message = chat.messages.find((m) => m.id === messageId);
      if (!message) return;
      message.chartData = chartData;
    },
  },
});

export const {
  addChat,
  removeChat,
  addMessage,
  clearChats,
  updateChat,
  updateMessageChunk,
  updateMessageSuggestions,
  updateMessageChartData,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;
