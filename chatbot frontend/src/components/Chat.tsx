/* eslint-disable react/display-name */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

import { User, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { EmptyChat } from "./EmptyChat";
import { addChat, addMessage, Message, updateMessageChunk } from "@/redux";
import { AppChart, ChartConfig } from "./AppChart/AppChart";
import { v4 as uuidv4 } from "uuid";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Input } from "./ui/input";
import rehypeRaw from "rehype-raw";

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

export const Chat: React.FC = () => {
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

	function isBufferComplete(str: string): boolean {
		const openBraces = (str.match(/{/g) || []).length;
		const closeBraces = (str.match(/}/g) || []).length;
		return openBraces > 0 && openBraces === closeBraces;
	}

	const onSendMessage = async (message: string, type: string = "text") => {
		if (!chatId && chats.findIndex((chat) => chat.id === tempChatId) === -1) {
			dispatch(
				addChat({
					id: tempChatId,
					messages: [],
				})
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
					type: type as any,
				},
			})
		);

		const botMessageId = `${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		dispatch(
			addMessage({
				chatId: chatId ?? tempChatId,
				messageId: botMessageId,
				message: {
					content: "",
					senderId: "bot",
					type: "text",
				},
			})
		);

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: message }),
				cache: "no-cache",
			});
			if (!response.body) throw new Error("No response body");

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				console.log("Chunk received:", chunk);
				buffer += chunk;

				if (isBufferComplete(buffer)) {
					try {
						const parsed = JSON.parse(buffer);
						dispatch(
							updateMessageChunk({
								chatId: chatId ?? tempChatId,
								messageId: botMessageId,
								newChunk: parsed.content,
							})
						);
						buffer = "";
					} catch (error) {
						console.log("Error parsing buffer:", error);
						const partialMatch = buffer.match(/"content":\s*"([^"]*)/);
						if (partialMatch) {
							dispatch(
								updateMessageChunk({
									chatId: chatId ?? tempChatId,
									messageId: botMessageId,
									newChunk: partialMatch[1],
								})
							);
						}
					}
				} else {
					const partialMatch = buffer.match(/"content":\s*"([^"]*)/);
					if (partialMatch) {
						dispatch(
							updateMessageChunk({
								chatId: chatId ?? tempChatId,
								messageId: botMessageId,
								newChunk: partialMatch[1],
							})
						);
					}
				}
			}
		} catch (error) {
			console.error("Streaming error:", error);
		}
	};

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
				console.log(content);

				const markdownText =
					"# Heading 1\n\n## Heading 2\n\nThis is a paragraph with a line break.\n\n- List item 1\n- List item 2\n\nBold Text and Italic Text.";
				return type === "user" ? (
					<div className="text-base text-[#2D2D2D]">{content}</div>
				) : (
					<ReactMarkdown
						remarkPlugins={[remarkGfm, remarkBreaks]}
						rehypePlugins={[rehypeRaw]}
						components={{
							h1: ({ node, ...props }) => (
								<h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
							),
							h2: ({ node, ...props }) => (
								<h2 className="text-xl font-semibold mt-6 mb-4" {...props} />
							),
							strong: ({ node, ...props }) => (
								<strong className="font-bold" {...props} />
							),
							em: ({ node, ...props }) => <em className="italic" {...props} />,
							// Customize how list items render
							li: ({ node, ...props }) => <li className="my-1" {...props} />,
							// Ensure proper spacing for unordered lists
							ul: ({ node, ...props }) => (
								<ul className="list-disc pl-5 mb-4" {...props} />
							),
							// Ensure proper spacing for ordered lists
							ol: ({ node, ...props }) => (
								<ol className="list-decimal pl-5 mb-2" {...props} />
							),

							p: ({ node, ...props }) => (
								<p className="mb-2 whitespace-pre-wrap" {...props} />
							),

							table: ({ node, ...props }) => (
								<div className="table-wrapper">
									<table className="ride-data-table" {...props} />
								</div>
							),
							th: ({ node, ...props }) => (
								<th className="table-header" {...props} />
							),
							td: ({ node, ...props }) => (
								<td className="table-cell" {...props} />
							),
						}}
					>
						{content}
					</ReactMarkdown>
				);
			}),
		[]
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
		if (
			message?.type === "text" &&
			message?.senderId !== "user" &&
			message.content?.trim() === ""
		) {
			return <LoaderDots />;
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
		// Implement like functionality
		console.log(`Liked message with ID: ${messageId}`);
	}, []);

	const handleDislike = React.useCallback((messageId: string) => {
		// Implement dislike functionality
		console.log(`Disliked message with ID: ${messageId}`);
	}, []);

	const handleRetry = React.useCallback((messageId: string) => {
		// Implement retry functionality
		console.log(`Retrying message with ID: ${messageId}`);
	}, []);

	// Memoize avatar renderer
	const renderAvatar = React.useCallback((senderId: string) => {
		return (
			<div className="bg-[#001B72] w-10 h-10 rounded-full flex items-center justify-center">
				{senderId === "user" ? (
					<User color="white" className="h-5 w-5 text-primary" />
				) : (
					<div className="text-white text-xl font-bold font-['Proxima Nova']">
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
			})
		);
		router.replace(`/c/${chatId}`);
	}, [dispatch, router]);

	return (
		<div className="flex flex-col h-full w-full mx-auto relative">
			{!open && (
				<div className="fixed top-[80px] left-4">
					<div className="h-[60px] bg-white flex items-center gap-3">
						<SidebarTrigger />
						<button
							onClick={() => handleNewChat()}
							aria-label="New chat"
							className="h-10 rounded-lg px-2 text-token-text-secondary focus-visible:bg-token-surface-hover focus-visible:outline-0 enabled:hover:bg-token-surface-hover disabled:text-token-text-quaternary"
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
				className="flex-1 overflow-y-auto px-14 py-4 space-y-4 pb-6 w-[95%] mx-auto"
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
							className={`flex  ${
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
									className={`bg-[#E2E8F0] rounded-lg p-3 w-full ${
										message.senderId === "user"
											? "text-right !w-fit"
											: "text-left bg-transparent p-0"
									}`}
								>
									<MessageRenderer message={message} />
									{/* Action Buttons for Bot Messages */}
									{message.senderId !== "user" && (
										<div className="flex justify-start w-fit space-x-1 mt-1">
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
								</div>
							</div>
						</div>
					))}
				{!showEmptyChat && <div ref={messagesEndRef} />}
			</div>

			{showGradient && (
				<div
					className="absolute px-14 bottom-[80px] left-0 right-0 h-20 pointer-events-none"
					style={{
						background:
							"linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
					}}
				/>
			)}

			<div className="mt-2 mb-7 px-14 w-[95%] mx-auto">
				<form onSubmit={handleSubmit} className="flex items-end">
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message here..."
						className="flex-1 min-h-[45px] resize-none max-h-[200px] z-[1000] rounded-r-[0px] overflow-hidden outline-none ring-0 bg-[#E2E8F0] placeholder:text-[#0F172A] text-[#0F172A]"
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
							className="bg-[#001B72]  h-[45px] w-[50px]"
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
