import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
	},
	experimental: {
		reactCompiler: {
			compilationMode: "annotation",
		},
	},
};

export default nextConfig;
