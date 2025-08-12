import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const userId = body.userId || "user_123";
		const sessionId = body.sessionId || "session_abc";
		const response = await fetch("https://rawa-agent-1060681624080.us-central1.run.app/query_stream", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: body.content,
				user_id: userId,
				session_id: sessionId
			}),
		});

		const transform = new TransformStream({
			async transform(chunk, controller) {
				controller.enqueue(chunk);
			},
		});

		return new Response(response.body?.pipeThrough(transform), {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Stream error:", error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
