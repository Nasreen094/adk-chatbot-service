/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */
import { useCallback, useEffect } from "react";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, ThumbsDown, ThumbsUp, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { v4 as uuidv4 } from "uuid";

import {
	addChat,
	addMessage,
	Message,
	updateMessageChartData,
	updateMessageChunk,
	updateMessageSuggestions,
} from "@/redux";

import { AppChart, ChartConfig } from "./AppChart/AppChart";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { EmptyChat } from "./EmptyChat";
import { useStreamingChatWithJSON } from "@/hooks/useStreamingChatWithJSON";
import { Button } from "./ui/button";
import { Textarea } from "./ui/resize-textarea";
import { useAppDispatch, useAppSelector } from "@/redux";

//example how to use
const revenueConfig: ChartConfig = {
  stacked: true,
  legendPosition: "onTop",
  chartType: "mixed",
  theme: "financial",
  xAxis: {
    label: "name",
    type: "category",
  },
  showDataLabels: false,
  keys: [
    {
      name: "Admissions Revenue",
      dataKey: "admissions",
      type: "bar",
      color: "#66D403",
    },
    {
      name: "F&B Revenue",
      dataKey: "fnb",
      type: "bar",
      color: "#60B60B",
    },
    {
      name: "Other Revenue",
      dataKey: "other",
      type: "bar",
      color: "#5A9912",
    },
    {
      name: "Target Revenue",
      dataKey: "target",
      type: "line",
      color: "#FABB00",
      showDots: false,
    },
  ],
};

//DEMO DATA :
const revenueData = [
  { name: "Sept-23", admissions: 32, fnb: 22, other: 8 },
  { name: "Oct-23", admissions: 28, fnb: 18, other: 4 },
  { name: "Nov-23", admissions: 30, fnb: 25, other: 7 },
  { name: "Dec-23", admissions: 27, fnb: 15, other: 5 },
  { name: "Jan-24", admissions: 40, fnb: 29, other: 8 },
  { name: "Feb-24", admissions: 30, fnb: 17, other: 6 },
  { name: "Mar-24", admissions: 35, fnb: 24, other: 9 },
  { name: "Apr-24", admissions: 25, fnb: 19, other: 3 },
  { name: "May-24", admissions: 38, fnb: 26, other: 7 },
  { name: "Jun-24", admissions: 29, fnb: 16, other: 5 },
  { name: "Jul-24", admissions: 35, fnb: 23, other: 9 },
  { name: "Aug-24", admissions: 42, fnb: 21, other: 4 },
  { name: "Sept-24", admissions: 38, fnb: 27, other: 6 },
  { name: "Oct-24", admissions: 32, fnb: 20, other: 8 },
];

const tempChatId = uuidv4();

// SuggestionButtons component
interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({
  suggestions,
  onSuggestionClick,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSuggestionClick(suggestion)}
          className="border-[#001B72] text-[#001B72] transition-colors duration-200 hover:bg-[#001B72] hover:text-white"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
};

export const Chat: React.FC<{ conversationId?: string }> = ({ conversationId }) => {
  "use memo";

  const { id: chatId } = useParams<{ id: string }>();
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { chats } = useAppSelector((state) => state.chats);
  const router = useRouter();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const dispatch = useAppDispatch();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = React.useState(false);
  const { open } = useSidebar();
  const currentBotMessageIdRef = React.useRef<string>("");

  // Function to detect if content contains markdown table
  const hasMarkdownTable = (content: string): boolean => {
    const lines = content.split("\n");
    let hasHeader = false;
    let hasSeparator = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line has table structure (starts and ends with |)
      if (
        line.startsWith("|") &&
        line.endsWith("|") &&
        line.split("|").length > 2
      ) {
        hasHeader = true;

        // Check if next line is separator (contains --- or :--: or --:)
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (
            nextLine.includes("---") ||
            nextLine.includes(":--:") ||
            nextLine.includes("--:")
          ) {
            hasSeparator = true;
            break;
          }
        }
      }
    }

    return hasHeader && hasSeparator;
  };

  // Function to convert markdown table to CSV
  const markdownTableToCSV = (content: string): string => {
    const lines = content.split("\n");
    const csvLines: string[] = [];
    let inTable = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
        if (trimmedLine.includes("---")) {
          // Skip separator line
          continue;
        }

        // Process table row
        const cells = trimmedLine
          .slice(1, -1) // Remove first and last |
          .split("|")
          .map((cell) => cell.trim())
          .map((cell) => `"${cell.replace(/"/g, '""')}"`); // Escape quotes and wrap in quotes

        csvLines.push(cells.join(","));
        inTable = true;
      } else if (inTable) {
        // End of table
        break;
      }
    }

    return csvLines.join("\n");
  };

  // Function to download CSV
  const downloadAsCSV = (content: string, filename?: string) => {
    const csv = markdownTableToCSV(content);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename || `table-${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const onSendMessage = useCallback(
    async (message: string, type: "text" | "component" = "text") => {
      if (!chatId && chats.findIndex((chat) => chat.id === tempChatId) === -1) {
        dispatch(
          addChat({
            id: tempChatId,
            messages: [],
          }),
        );
      }

      if (!message.trim()) return;

      const userMessageId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      dispatch(
        addMessage({
          chatId: chatId ?? tempChatId,
          messageId: userMessageId,
          message: {
            content: message,
            senderId: "user",
            type,
          },
        }),
      );

      const botMessageId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      currentBotMessageIdRef.current = botMessageId;

      dispatch(
        addMessage({
          chatId: chatId ?? tempChatId,
          messageId: botMessageId,
          message: {
            content: "",
            senderId: "bot",
            type: "text",
          },
        }),
      );

      // Use client-side streaming
      await sendMessage({
        query: message,
        user_id: "nvalappil",
        conversation_id: conversationId ?? chatId ?? tempChatId
        
      });
    },
    [chatId, chats, dispatch],
  );

  function isBufferComplete(str: string): boolean {
    const openBraces = (str.match(/{/g) || []).length;
    const closeBraces = (str.match(/}/g) || []).length;
    return openBraces > 0 && openBraces === closeBraces;
  }

  // Initialize streaming hook
  const { sendMessage } = useStreamingChatWithJSON({
    onRawChunk: (buffer) => {
      // Handle raw streaming chunks with brace-counting logic for complete JSON objects
      if (isBufferComplete(buffer)) {
        try {
          const parsed = JSON.parse(buffer);

          if (currentBotMessageIdRef.current && parsed.content) {
            // Convert \n strings to actual newlines for proper markdown rendering
            const processedContent = parsed.content.replace(/\\n/g, "\n");
            dispatch(
              updateMessageChunk({
                chatId: chatId ?? tempChatId,
                messageId: currentBotMessageIdRef.current,
                newChunk: processedContent,
              }),
            );
          }

          // Handle chart data if present
          if (parsed.chart && currentBotMessageIdRef.current) {
            dispatch(
              updateMessageChartData({
                chatId: chatId ?? tempChatId,
                messageId: currentBotMessageIdRef.current,
                chartData: parsed.chart,
              }),
            );
          }

          // Handle suggestions if they exist in the parsed data
          if (parsed.suggestions && currentBotMessageIdRef.current) {
            dispatch(
              updateMessageSuggestions({
                chatId: chatId ?? tempChatId,
                messageId: currentBotMessageIdRef.current,
                suggestions: parsed.suggestions,
              }),
            );
          }
        } catch (error) {
          return error;
        }
      }
    },
    onComplete: () => {
      // Stream completed successfully
    },
    onError: (error) => {
      return error;
    },
  });

  // Form submit now simply calls the consolidated onSendMessage function.
  const handleSubmit = async (e: React.FormEvent) => {
    setInput("");
    e.preventDefault();
    await onSendMessage(input, "text");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  // Updated TextMessage component to handle newlines and HTML (e.g., <b> for bold)
  const TextMessage = React.useMemo(
    () =>
      React.memo(({ type, content }: { type: string; content: string }) => {
        return type === "user" ? (
          <div className="text-base text-[#2D2D2D]">{content}</div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: (props) => (
                <h1 className="mb-4 mt-6 text-2xl font-bold" {...props} />
              ),
              h2: (props) => (
                <h2 className="mb-4 mt-6 text-xl font-semibold" {...props} />
              ),
              strong: (props) => <strong className="font-bold" {...props} />,
              em: (props) => <em className="italic" {...props} />,
              // Customize how list items render
              li: (props) => <li className="my-1" {...props} />,
              // Ensure proper spacing for unordered lists
              ul: (props) => <ul className="mb-4 list-disc pl-5" {...props} />,
              // Ensure proper spacing for ordered lists
              ol: (props) => (
                <ol className="mb-2 list-decimal pl-5" {...props} />
              ),

              p: (props) => (
                <p className="mb-2 whitespace-pre-wrap" {...props} />
              ),

              table: (props) => (
                <div className="table-wrapper">
                  <table className="ride-data-table" {...props} />
                </div>
              ),
              th: (props) => <th className="table-header" {...props} />,
              td: (props) => <td className="table-cell" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        );
      }),
    [],
  );

  const LoaderDots: React.FC = () => {
    return (
      <div className="flex items-center">
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            backgroundColor: "#2D2D2D",
            borderRadius: "50%",
            margin: "0 2px",
            animation: "dotPulse 1.4s infinite ease-in-out",
          }}
        ></span>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            backgroundColor: "#2D2D2D",
            borderRadius: "50%",
            margin: "0 2px",
            animation: "dotPulse 1.4s infinite ease-in-out",
            animationDelay: "0.2s",
          }}
        ></span>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            backgroundColor: "#2D2D2D",
            borderRadius: "50%",
            margin: "0 2px",
            animation: "dotPulse 1.4s infinite ease-in-out",
            animationDelay: "0.4s",
          }}
        ></span>
        <style jsx global>{`
          @keyframes dotPulse {
            0%,
            80%,
            100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  };

  const MessageRenderer = React.memo(function MessageRenderer({
    message,
  }: {
    message: Message;
  }) {
    // console.log("🎬 MessageRenderer called with:", message.id);

    if (
      message?.type === "text" &&
      message?.senderId !== "user" &&
      message.content?.trim() === ""
    ) {
      return <LoaderDots />;
    }
    // If message has chart data, render chart along with text
    if (message.chartData) {
      return (
        <div>
          <TextMessage type={message.senderId} content={message.content} />
          <div className="mt-4">
            <AppChart
              range={message.chartData.range || "quarterly"}
              height={450}
              data={message.chartData.data ?? []}
              config={message.chartData.config}
              subtitle={message.chartData.title}
            />
          </div>
        </div>
      );
    }

    // If message has markdown table, render with CSV download button
    if (message.senderId !== "user" && hasMarkdownTable(message.content)) {
      return (
        <div>
          <TextMessage type={message.senderId} content={message.content} />
          <div className="mt-3 flex items-center justify-start">
            <button
              onClick={() => downloadAsCSV(message.content)}
              className="flex h-8 items-center gap-2 rounded bg-green-500 px-3 text-white transition-colors hover:bg-green-600"
              aria-label="Download as CSV"
              title="Download table as CSV"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="text-sm font-medium">CSV</span>
            </button>
          </div>
        </div>
      );
    }

    switch (message.type) {
      case "component":
        return (
          <AppChart
            showExpandIcon={true}
            range={"monthy"}
            height={450}
            data={revenueData ?? []}
            config={revenueConfig}
          />
        );
      case "text":
        return (
          <TextMessage type={message.senderId} content={message.content} />
        );
      default:
        return null;
    }
  });

  const handleLike = React.useCallback((messageId: string) => {
    return messageId;
    // Implement like functionality
  }, []);

  const handleDislike = React.useCallback((messageId: string) => {
    return messageId;
    // Implement dislike functionality
  }, []);

  const handleRetry = React.useCallback((messageId: string) => {
    // Implement retry functionality
    return messageId;
  }, []);

  const handleSuggestionClick = React.useCallback(
    async (suggestion: string) => {
      // Handle download suggestions differently
      if (
        suggestion.toLowerCase().includes("download") &&
        suggestion.toLowerCase().includes("png")
      ) {
        // Find the chart element and trigger PNG download
        const chartElement = document.querySelector(
          '[aria-label="Download as PNG"]',
        ) as HTMLButtonElement;
        if (chartElement) {
          chartElement.click();
          return;
        }
      }

      if (
        suggestion.toLowerCase().includes("download") &&
        suggestion.toLowerCase().includes("pdf")
      ) {
        // Find the chart element and trigger PDF download
        const chartElement = document.querySelector(
          '[aria-label="Download as PDF"]',
        ) as HTMLButtonElement;
        if (chartElement) {
          chartElement.click();
          return;
        }
      }

      if (
        suggestion.toLowerCase().includes("download") &&
        suggestion.toLowerCase().includes("csv")
      ) {
        // Find the CSV download button and trigger download
        const csvElement = document.querySelector(
          '[aria-label="Download as CSV"]',
        ) as HTMLButtonElement;
        if (csvElement) {
          csvElement.click();
          return;
        }
      }

      // For regular suggestions, add to input and send
      setInput("");
      await onSendMessage(suggestion, "text");
    },
    [onSendMessage],
  );

  // Memoize avatar renderer
  const renderAvatar = React.useCallback((senderId: string) => {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#001B72]">
        {senderId === "user" ? (
          <User color="white" className="h-5 w-5 text-primary" />
        ) : (
          <div className="font-['Proxima Nova'] text-xl font-bold text-white">
            R
          </div>
        )}
      </div>
    );
  }, []);

  const messagesChatId = chatId ?? tempChatId;

  const showEmptyChat =
    chats.findIndex((chat) => chat.id === messagesChatId) === -1 ||
    chats.find((chat) => chat.id === messagesChatId)?.messages.length === 0;

  // Add scroll handler to detect when content is near the textarea
  const handleScroll = React.useCallback(() => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const bottomThreshold = 150; // Adjust this value as needed

    // Show gradient when not at the bottom
    setShowGradient(scrollHeight - scrollTop - clientHeight > bottomThreshold);
  }, []);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const handleNewChat = useCallback(() => {
    const chatId = uuidv4();
    dispatch(
      addChat({
        id: chatId,
        messages: [],
      }),
    );
    router.replace(`/c/${chatId}`);
  }, [dispatch, router]);

  return (
    <div className="relative mx-auto flex h-full w-full flex-col">
      {!open && (
        <div className="fixed left-4 top-[80px]">
          <div className="flex h-[60px] items-center gap-3 bg-white">
            <SidebarTrigger />
            <button
              onClick={() => handleNewChat()}
              aria-label="New chat"
              className="text-token-text-secondary focus-visible:bg-token-surface-hover enabled:hover:bg-token-surface-hover disabled:text-token-text-quaternary h-10 rounded-lg px-2 focus-visible:outline-0"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="icon-xl-heavy"
              >
                <path
                  d="M15.6729 3.91287C16.8918 2.69392 18.8682 2.69392 20.0871 3.91287C21.3061 5.13182 21.3061 7.10813 20.0871 8.32708L14.1499 14.2643C13.3849 15.0293 12.3925 15.5255 11.3215 15.6785L9.14142 15.9899C8.82983 16.0344 8.51546 15.9297 8.29289 15.7071C8.07033 15.4845 7.96554 15.1701 8.01005 14.8586L8.32149 12.6785C8.47449 11.6075 8.97072 10.615 9.7357 9.85006L15.6729 3.91287ZM18.6729 5.32708C18.235 4.88918 17.525 4.88918 17.0871 5.32708L11.1499 11.2643C10.6909 11.7233 10.3932 12.3187 10.3014 12.9613L10.1785 13.8215L11.0386 13.6986C11.6812 13.6068 12.2767 13.3091 12.7357 12.8501L18.6729 6.91287C19.1108 6.47497 19.1108 5.76499 18.6729 5.32708ZM11 3.99929C11.0004 4.55157 10.5531 4.99963 10.0008 5.00007C9.00227 5.00084 8.29769 5.00827 7.74651 5.06064C7.20685 5.11191 6.88488 5.20117 6.63803 5.32695C6.07354 5.61457 5.6146 6.07351 5.32698 6.63799C5.19279 6.90135 5.10062 7.24904 5.05118 7.8542C5.00078 8.47105 5 9.26336 5 10.4V13.6C5 14.7366 5.00078 15.5289 5.05118 16.1457C5.10062 16.7509 5.19279 17.0986 5.32698 17.3619C5.6146 17.9264 6.07354 18.3854 6.63803 18.673C6.90138 18.8072 7.24907 18.8993 7.85424 18.9488C8.47108 18.9992 9.26339 19 10.4 19H13.6C14.7366 19 15.5289 18.9992 16.1458 18.9488C16.7509 18.8993 17.0986 18.8072 17.362 18.673C17.9265 18.3854 18.3854 17.9264 18.673 17.3619C18.7988 17.1151 18.8881 16.7931 18.9393 16.2535C18.9917 15.7023 18.9991 14.9977 18.9999 13.9992C19.0003 13.4469 19.4484 12.9995 20.0007 13C20.553 13.0004 21.0003 13.4485 20.9999 14.0007C20.9991 14.9789 20.9932 15.7808 20.9304 16.4426C20.8664 17.116 20.7385 17.7136 20.455 18.2699C19.9757 19.2107 19.2108 19.9756 18.27 20.455C17.6777 20.7568 17.0375 20.8826 16.3086 20.9421C15.6008 21 14.7266 21 13.6428 21H10.3572C9.27339 21 8.39925 21 7.69138 20.9421C6.96253 20.8826 6.32234 20.7568 5.73005 20.455C4.78924 19.9756 4.02433 19.2107 3.54497 18.2699C3.24318 17.6776 3.11737 17.0374 3.05782 16.3086C2.99998 15.6007 2.99999 14.7266 3 13.6428V10.3572C2.99999 9.27337 2.99998 8.39922 3.05782 7.69134C3.11737 6.96249 3.24318 6.3223 3.54497 5.73001C4.02433 4.7892 4.78924 4.0243 5.73005 3.54493C6.28633 3.26149 6.88399 3.13358 7.55735 3.06961C8.21919 3.00673 9.02103 3.00083 9.99922 3.00007C10.5515 2.99964 10.9996 3.447 11 3.99929Z"
                  fill="#212121"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      <div
        ref={chatContainerRef}
        className="mx-auto w-[95%] flex-1 space-y-4 overflow-y-auto px-14 py-4 pb-6"
      >
        {showEmptyChat && (
          <EmptyChat
            onPrefilledMessage={(message, type) => onSendMessage(message, type)}
          />
        )}
        {chats
          .find((chat) => chat.id === messagesChatId)
          ?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.senderId !== "user" && (
                <div className="mr-3">{renderAvatar(message.senderId)}</div>
              )}
              <div
                className={`flex flex-row-reverse items-${
                  message.senderId === "user" ? "start" : "start"
                } w-full max-w-full gap-1 rounded-lg ${
                  message.senderId === "user"
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {message.senderId === "user" && (
                  <div className="ml-4">{renderAvatar(message.senderId)}</div>
                )}
                <div
                  className={`w-full rounded-lg bg-[#E2E8F0] p-3 ${
                    message.senderId === "user"
                      ? "!w-fit text-right"
                      : "bg-transparent p-0 text-left"
                  }`}
                >
                  <MessageRenderer message={message} />
                  {/* Action Buttons for Bot Messages */}
                  {message.senderId !== "user" && (
                    <div className="mt-1 flex w-fit justify-start space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(message.id)}
                        aria-label="Like"
                      >
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDislike(message.id)}
                        aria-label="Dislike"
                      >
                        <ThumbsDown className="h-5 w-5 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRetry(message.id)}
                        aria-label="Retry"
                      >
                        <RefreshCw className="h-5 w-5 text-gray-500" />
                      </Button>
                    </div>
                  )}
                  {/* Suggestion Buttons for Bot Messages */}
                  {message.senderId !== "user" && message.suggestions && (
                    <SuggestionButtons
                      suggestions={message.suggestions}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        {!showEmptyChat && <div ref={messagesEndRef} />}
      </div>

      {showGradient && (
        <div
          className="pointer-events-none absolute bottom-[80px] left-0 right-0 h-20 px-14"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
          }}
        />
      )}

      <div className="mx-auto mb-7 mt-2 w-[95%] px-14">
        <form onSubmit={handleSubmit} className="flex items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="z-[1000] max-h-[200px] min-h-[45px] flex-1 resize-none overflow-hidden rounded-r-[0px] bg-[#E2E8F0] text-[#0F172A] outline-none ring-0 placeholder:text-[#0F172A]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="">
            <Button
              type="submit"
              size="icon"
              className="h-[45px] w-[50px] bg-[#001B72]"
            >
              <svg
                width="23"
                height="21"
                viewBox="0 0 23 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.8367 2.88297C22.4953 1.50097 21.2433 -0.0238187 19.7595 0.354696L1.62679 4.9688C0.138132 5.34804 -0.228308 7.29259 1.01893 8.18861L6.2908 11.9736L11.7722 7.47204C12.0197 7.27583 12.3345 7.18471 12.6486 7.21831C12.9627 7.2519 13.251 7.40753 13.4515 7.65166C13.6519 7.8958 13.7485 8.20891 13.7204 8.52356C13.6922 8.83821 13.5417 9.12923 13.3011 9.33392L7.81969 13.8355L10.5081 19.7432C11.1432 21.1408 13.1219 21.1583 13.7833 19.773L21.8367 2.88297Z"
                  fill="white"
                />
              </svg>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
