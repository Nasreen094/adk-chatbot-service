import React from "react";

import { numeralFormat } from "@/lib/utils";

interface KeyValueDisplayProps {
	subtitleDetails: {
		title: string;
		value: string;
		targetValue?: string;
	}[];

	customRightDetails?: {
		label: string;
		value: string;
	}[];
	theme?:
		| "attendance"
		| "financial"
		| "expenditure"
		| "operational"
		| "engagement"
		| undefined;
}

const arrowUp = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="11"
		height="10"
		viewBox="0 0 11 10"
		fill="none"
	>
		<path
			d="M5.37484 0.460937L0.400072 9.50597H10.3496L5.37484 0.460937Z"
			fill="#66D403"
		/>
	</svg>
);

const arrowDown = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="11"
		height="10"
		viewBox="0 0 11 10"
		fill="none"
	>
		<path
			d="M5.21336 9.54395L10.3271 0.246211H0.0996094L5.21336 9.54395Z"
			fill="#DC2626"
		/>
	</svg>
);

const KeyValueDisplay = ({
	subtitleDetails,
	theme = "attendance",
	customRightDetails,
}: KeyValueDisplayProps) => {
	const themeColors: Record<string, string> = {
		attendance: "bg-[#795F9D]",
		financial: "bg-[#5A9912]",
		expenditure: "bg-[#B91C1C]",
		operational: "bg-[#FABB00]",
		engagement: "bg-[#C7540E]",
	};

	const targetValueColors: Record<string, string> = {
		attendance: "bg-[#f2eff5]",
		financial: "bg-[#eef1ea]",
		expenditure: "bg-[#f9e8e9]",
		operational: "bg-[#fcf7eb]",
		engagement: "bg-[#f9eee7]",
	};

	const targetVarTextColors: Record<string, string> = {
		attendance: "text-[#5B4B7A]",
		financial: "text-[#66D403]",
		expenditure: "text-[#B91C1C]",
		operational: "text-[#FABB00]",
		engagement: "text-[#DC2626]",
	};

	const bgColorClass = themeColors[theme] || "bg-gray-500";
	const targetBgColorClass = targetValueColors[theme] || "bg-[#f2eff5]";
	const targetVarTextColorClass =
		targetVarTextColors[theme] || "text-[#795F9D]";

	if (subtitleDetails.length === 0) return null;

	return (
		<div className="flex flex-1 flex-row gap-3">
			{subtitleDetails.map((detail, index) => {
				const value = detail.value ?? "0";
				const targetValue = !detail.targetValue?.includes("undefined")
					? detail.targetValue
					: "0%";
				const isNegative = targetValue?.startsWith("-");

				const targetValueColorClass = isNegative
					? "text-[#DC2626]"
					: "text-[#66D403]";

				const hasTargetValue = detail.targetValue !== undefined;

				return (
					<div key={index} className="flex flex-row">
						<div
							className={`flex h-[62px] w-fit min-w-[100px] flex-col justify-center rounded-[6px] ${
								hasTargetValue ? "rounded-r-[0px]" : "rounded-r-[6px]"
							} ${bgColorClass} whitespace-nowrap px-[10px] py-[5px]`}
						>
							<p className="mr-2 text-xs font-semibold text-white">
								{detail.title}
							</p>
							<p className="text-lg font-bold text-white">
								{!value ? "0" : numeralFormat(value)}
							</p>
						</div>

						{hasTargetValue && (
							<div
								className={`flex h-auto max-w-[100px] flex-1 flex-col items-center justify-center rounded-r-[6px] text-center ${targetBgColorClass} whitespace-nowrap px-[10px]`}
							>
								<div className="flex items-center justify-center">
									<div className="flex flex-row items-center justify-center gap-1">
										{isNegative ? arrowDown : arrowUp}

										<p
											className={`mr-2 text-lg font-bold ${targetValueColorClass}`}
										>
											{targetValue !== "undefined" ? targetValue : "0"}
										</p>
									</div>
								</div>
								<span className={`text-xs ${targetVarTextColorClass}`}>
									Target Var.
								</span>
							</div>
						)}
					</div>
				);
			})}
			{customRightDetails && (
				<div className="flex flex-row gap-3">
					{customRightDetails.map((content, index) => (
						<div
							className={`flex h-auto flex-1 flex-col gap-1 rounded-[6px] text-left ${targetBgColorClass} ${targetVarTextColorClass} whitespace-nowrap px-[10px] py-[7px] text-left`}
							key={index}
						>
							<span className="text-lg font-bold">
								{content.value !== "undefined"
									? numeralFormat(Number(content.value))
									: "0"}
							</span>
							<span className="text-left text-xs">{content.label}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export { KeyValueDisplay };
