import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "RAWA Chatbot",
	description: "RAWA Chatbot",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				suppressHydrationWarning
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<SidebarProvider>
						<div className="flex flex-col h-screen flex-1">
							<Navbar />
							<div className="flex flex-1 overflow-hidden">
								<Sidebar />
								<main className="flex-1 p-4 overflow-hidden">{children}</main>
							</div>
						</div>
					</SidebarProvider>
				</Providers>
			</body>
		</html>
	);
}
