import { NextRequest } from "next/server";

export const runtime = "edge"; // only if you're using Vercel Edge Functions

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const APP_URL = process.env.AGENT_BACKEND_URL || "https://multi-agent-service-1060681624080.us-central1.run.app";
		const AGENT_NAME = "bigquery_agent";
		const TOKEN = process.env.AGENT_BACKEND_TOKEN || "";

		const userId = body.userId || "user_123";
		const sessionId = body.sessionId || "session_abc";

		// OPTIONAL: Create session proactively
		await fetch(`${APP_URL}/apps/${AGENT_NAME}/users/${userId}/sessions/${sessionId}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${TOKEN}`,
			},
			body: JSON.stringify({ state: { preferred_language: "English" } }),
		});

		// Call run_sse
		const adkResponse = await fetch(`${APP_URL}/run_sse`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${TOKEN}`,
			},
			body: JSON.stringify({
				app_name: AGENT_NAME,
				user_id: userId,
				session_id: sessionId,
				new_message: {
					role: "user",
					parts: [{ text: body.content }],
				},
				streaming: true,
			}),
		});

		const transform = new TransformStream({
			async transform(chunk, controller) {
				controller.enqueue(chunk);
			},
		});

		return new Response(adkResponse.body?.pipeThrough(transform), {
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
