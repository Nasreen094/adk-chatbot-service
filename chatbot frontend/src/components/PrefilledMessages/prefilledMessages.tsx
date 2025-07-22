import React, { useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { MessageType } from "@/redux";

interface PrefilledMessagesProps {
	onPrefilledMessage: (message: string, type: MessageType) => void;
}

const PrefilledMessages = ({ onPrefilledMessage }: PrefilledMessagesProps) => {
	const prefilledMessages: { question: string; type: MessageType }[] = useMemo(
		() => [
			{
				question:
					"Give me a financial report on revenue breakdown of Six Flags for Q4 2024?",
				type: "text",
			},
			{
				question:
					"Which ride in Six Flags has the highest average monthly attendance in 2024?",
				type: "text",
			},
			{
				question: "How much is the %change in payroll cost from 2023 to 2024?",
				type: "text",
			},
			{
				question:
					"Which event has brought the highest revenue in Six Flags and Aquarabia?",
				type: "text",
			},
			{
				question: "How many safety incidents were reported in Six Flags in 2024, October?",
				type: "text",
			},
			{
				question:
					"Provide a tabular report on total labour hours for Six Flags and Aquarabia in dec, 2024?",
				type: "text",
			},
		],
		[]
	);

	return (
		<div className="grid grid-cols-3 gap-7 mb-8">
			{prefilledMessages.map((message) => (
				<Card
					onClick={() => onPrefilledMessage(message.question, message.type)}
					key={message.question}
					className="shadow-none cursor-pointer hover:bg-gray-100 rounded-[12px] transition-all duration-300"
				>
					<CardContent className="p-2">
						<div className="text-[#001b72] text-sm font-semibold font-['Proxima Nova']">
							{message.question}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export { PrefilledMessages };
