/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";

interface StreamingChatOptions {
	onMessage?: (data: any) => void;
	onRawChunk?: (chunk: string) => void;
	onComplete?: (finalData?: any) => void;
	onError?: (error: Error) => void;
}

interface ChatMessage {
	query: string;
	user_id: string;
	conversation_id: string;
}

export const useStreamingChatWithJSON = ({
	onMessage,
	onRawChunk,
	onComplete,
	onError,
}: StreamingChatOptions = {}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sendMessage = useCallback(
		async (message: ChatMessage) => {
			setIsLoading(true);
			setError(null);

			try {
				const backendBaseUrl = "https://rawa-agent1-1060681624080.us-central1.run.app/api/chat/v1";
				if (!backendBaseUrl) {
					throw new Error(
						"Environment variable NEXT_PUBLIC_CHATBOT_BACKEND_URL is not set. Please define it in your environment (e.g., .env.local)."
					);
				}
				const endpointUrl = `${backendBaseUrl}/query_stream`;

				const response = await fetch(endpointUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						query: message.query,
						user_id: message.user_id,
						conversation_id: message.conversation_id,
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();

					throw new Error(
						`HTTP error! status: ${response.status}, message: ${errorText}`
					);
				}

				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error("No response body received");
				}

				const decoder = new TextDecoder();
				let buffer = "";
				let rawBuffer = ""; // Separate buffer for onRawChunk that doesn't get reset

				let finalData: any = null;

				while (true) {
					const { done, value } = await reader.read();

					if (done) {
						// Process any remaining buffer content
						if (rawBuffer.trim()) {
							console.log("📞 Final onRawChunk call with:", rawBuffer);
							onRawChunk?.(rawBuffer);

							// Try to parse final buffer as JSON
							try {
								const jsonData = JSON.parse(rawBuffer.trim());
								finalData = jsonData;
								onMessage?.(jsonData);
							} catch (parseError) {
								return parseError;
							}
						}

						console.log("🏁 Stream done, calling onComplete");
						onComplete?.(finalData);
						break;
					}

					const chunk = decoder.decode(value, { stream: true });
					console.log("📡 Decoded chunk:", chunk);

					buffer += chunk;
					rawBuffer += chunk; // Accumulate in separate buffer for onRawChunk
					console.log("📦 Updated line buffer:", buffer);
					console.log("📦 Updated raw buffer:", rawBuffer);

					// Send raw chunk if callback provided
					console.log("📞 Calling onRawChunk with raw buffer");
					onRawChunk?.(rawBuffer);

					// Split by newlines to handle multiple JSON objects
					const lines = buffer.split("\n");
					buffer = lines.pop() || ""; // Keep incomplete line in buffer

					for (const line of lines) {
						const trimmedLine = line.trim();
						if (trimmedLine) {
							try {
								const jsonData = JSON.parse(trimmedLine);
								finalData = jsonData; // Keep track of the latest valid JSON data
								onMessage?.(jsonData);
							} catch {
								// Still send as raw chunk for non-JSON content
								onRawChunk?.(trimmedLine);
							}
						}
					}
				}
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error("Unknown error occurred");
				setError(error.message);
				onError?.(error);
			} finally {
				setIsLoading(false);
			}
		},
		[onMessage, onRawChunk, onComplete, onError]
	);

	return {
		sendMessage,
		isLoading,
		error,
	};
};
