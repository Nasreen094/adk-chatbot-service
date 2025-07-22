"use client";

import React from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react";

const Navbar: React.FC = () => {
	const router = useRouter();

	const handleLogoClick = (): void => {
		router.push("/");
	};

	const handleLogoKeyDown = (
		event: React.KeyboardEvent<HTMLDivElement>
	): void => {
		if (event.key === "Enter") {
			handleLogoClick();
		}
	};

	return (
		<div className="top-0 z-50 flex w-full flex-col">
			<nav className="navbar-background-image h-20 overflow-hidden ">
				<div className="flex h-full flex-1 items-center justify-between lg:flex-row">
					<div className="flex flex-row items-center gap-4">
						<div className="flex items-center gap-4 lg:flex-row lg:items-center">
							<div className="w-64 flex items-center justify-center">
								<div
									onClick={handleLogoClick}
									onKeyDown={handleLogoKeyDown}
									role="button"
									tabIndex={0}
									aria-label="Navigate to home"
									className="relative h-[70px] w-[125px] cursor-pointer"
								>
									<Image
										src="/qiddiya-logo.png"
										alt="Qiddiya Logo"
										fill
										className="object-contain"
									/>
								</div>
							</div>
							<div className="flex flex-col text-center lg:text-left">
								<div>
									<span className="text-white text-2xl font-bold font-['Proxima Nova']">
										RAWA{" "}
									</span>
									<span className="text-white text-2xl font-normal font-['Proxima Nova']">
										CHATBOT
									</span>
								</div>

								<div className="opacity-60 text-white text-xs italic font-semibold font-['Proxima Nova']">
									Powered by the Data Office
								</div>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1 relative -left-24">
							<CircleUser color="white" size={32} strokeWidth={1} />
							<span className="text-sm font-bold text-white">
								Welcome Abdulla Al Dawoud
							</span>
						</div>
						{/* <ThemeSwitcher /> */}
					</div>
				</div>
			</nav>
		</div>
	);
};

export { Navbar };
