import React from "react";
import {
	Bar,
	BarChart,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

interface ChartSkeletonProps {
	height: number | string;
	type: "bar" | "line" | "pie";
}

const fakeBarData = [
	{ name: "A", value: 100 },
	{ name: "B", value: 200 },
	{ name: "C", value: 150 },
	{ name: "D", value: 80 },
	{ name: "E", value: 170 },
];

const fakeLineData = [
	{ name: "Jan", value: 30 },
	{ name: "Feb", value: 20 },
	{ name: "Mar", value: 27 },
	{ name: "Apr", value: 23 },
	{ name: "May", value: 34 },
];

const fakePieData = [
	{ name: "Group A", value: 400 },
	{ name: "Group B", value: 300 },
	{ name: "Group C", value: 300 },
	{ name: "Group D", value: 200 },
];

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height, type }) => {
	const renderSkeleton = () => {
		switch (type) {
			case "bar":
				return (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={fakeBarData}>
							<XAxis dataKey="name" hide />
							<YAxis hide />
							<Bar
								dataKey="value"
								animationDuration={1000}
								colorInterpolation="monotone"
								fill="#d1d5db"
								fillRule="evenodd"
								isAnimationActive={false}
							/>
						</BarChart>
					</ResponsiveContainer>
				);
			case "line":
				return (
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={fakeLineData}>
							<XAxis dataKey="name" hide />
							<YAxis hide />

							<Line
								type="monotone"
								dataKey="value"
								stroke="#d1d5db"
								isAnimationActive={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				);
			case "pie":
				return (
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={fakePieData}
								dataKey="value"
								cx="50%"
								cy="50%"
								outerRadius="80%"
								fill="#d1d5db"
								isAnimationActive={false}
							/>
						</PieChart>
					</ResponsiveContainer>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className="flex items-center justify-center bg-white"
			style={{ height }}
			aria-label="Loading chart"
			aria-busy="true"
		>
			{renderSkeleton()}
		</div>
	);
};

export { ChartSkeleton };
