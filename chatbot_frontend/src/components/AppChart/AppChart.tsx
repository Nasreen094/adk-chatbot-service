/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	LabelList,
	Legend,
	Line,
	Pie,
	PieChart,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { ChartTooltip } from "../ChartTooltip";
import ChartWrapper from "../ChartWrapper/ChartWrapper";
import { numeralFormat } from "@/lib/utils";

import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

// import { ChartSkeleton } from "../ChartSkeletons";
// import { ChartTabs } from "../ChartTabs";

interface DataKey {
	name: string;
	dataKey: string;
	color: string;
	gradientStart?: string;
	gradientEnd?: string;
	type?: "bar" | "line" | "area" | "scatter" | "pie";
	showDots?: boolean;
	opacity?: number;
	yAxisId?: "left" | "right";
	format?: "percentage" | "currency" | "number";
}

type ChartType = "bar" | "line" | "area" | "scatter" | "mixed" | "pie";

interface TickFormatter {
	(value: string | number): string;
}

interface AxisConfig {
	label?: string;
	type?: "number" | "category" | "time" | "log";
	domain?: [number | string, number | string];
	tickFormatter?: TickFormatter;
	tickCount?: number;
	allowDecimals?: boolean;
	format?: "percentage" | "currency" | "number";
}

interface TooltipField {
	label: string;
	dataKey: string;
	format?: "percentage" | "currency" | "number";
}

interface TooltipConfig {
	custom?: boolean;
	content?: any;
	fields?: TooltipField[];
}

interface LegendConfig {
	align?: "left" | "center" | "right";
	verticalAlign?: "top" | "middle" | "bottom";
	layout?: "horizontal" | "vertical";
}

interface ReferenceLineConfig {
	value: number | string;
	label?: string;
	stroke?: string;
	strokeDasharray?: string;
}

export interface ChartConfig {
	chartType: ChartType;
	keys: DataKey[];
	xAxis?: AxisConfig;
	yAxis?: AxisConfig;
	rightYAxis?: AxisConfig;
	showTooltip?: boolean;
	tooltipConfig?: TooltipConfig;
	showLegend?: boolean;
	legendConfig?: LegendConfig;
	showGrid?: boolean;
	theme?:
		| "attendance"
		| "financial"
		| "expenditure"
		| "operational"
		| "engagement";

	stacked?: boolean;
	layout?: "horizontal" | "vertical";
	showDataLabels?: boolean;
	referenceLines?: ReferenceLineConfig[];
	legendPosition?: "normal" | "onTop";
}

interface SubtitleDetail {
	title: string;
	value: string;
	targetValue?: string;
}

interface ChartProps {
	data: any[];
	range: string;
	config: ChartConfig;
	subtitle?: string;
	subtitleDetails?: SubtitleDetail[];
	activePeriod?: string;
	targetValue?: string;
	lightSubtitle?: string;
	customRightContent?: React.ReactNode;
	height?: number | string;
	isLoading?: boolean;
	customRightDetails?: {
		label: string;
		value: string;
	}[];
	pieChartInnerRadius?: number;
	pieChartOuterRadius?: string | number;
	showExpandIcon?: boolean;
}

const getPeriodLabel = (range: string): string => {
	switch (range?.toLowerCase()) {
		case "daily":
			return "Day";
		case "weekly":
			return "Week";
		case "monthly":
			return "Month";
		case "quarterly":
			return "Quarter";
		default:
			return "Period";
	}
};

const AppChartComponent: React.FC<ChartProps> = ({
	data,
	config,
	subtitle,
	subtitleDetails,
	activePeriod,
	targetValue,
	lightSubtitle,
	height = 265,
	customRightContent,
	isLoading = false,
	customRightDetails,
	range,
	pieChartInnerRadius = 30,
	pieChartOuterRadius = 70,
	showExpandIcon = true,
}) => {
	const chartRef = useRef<HTMLDivElement>(null);

	// Download functions
	const downloadAsImage = useCallback(
		async (format: "png" | "jpeg" = "png") => {
			if (!chartRef.current) return;

			try {
				const canvas = await html2canvas(chartRef.current, {
					backgroundColor: "#ffffff",
					scale: 2,
					logging: false,
					useCORS: true,
				});

				const link = document.createElement("a");
				link.download = `chart-${Date.now()}.${format}`;
				link.href = canvas.toDataURL(`image/${format}`);
				link.click();
			} catch (error) {
				return error;
			}
		},
		[]
	);

	const downloadAsPDF = useCallback(async () => {
		if (!chartRef.current) return;

		try {
			const canvas = await html2canvas(chartRef.current, {
				backgroundColor: "#ffffff",
				scale: 2,
				logging: false,
				useCORS: true,
			});

			const imgData = canvas.toDataURL("image/png");
			const pdf = new jsPDF({
				orientation: canvas.width > canvas.height ? "landscape" : "portrait",
				unit: "px",
				format: [canvas.width, canvas.height],
			});

			pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
			pdf.save(`chart-${Date.now()}.pdf`);
		} catch (error) {
			return error;
		}
	}, []);
	const {
		chartType,
		keys,
		xAxis,
		yAxis,
		rightYAxis,
		showTooltip = true,
		tooltipConfig = {},
		showLegend = true,
		legendConfig = {},
		showGrid = false,
		theme = "attendance",
		stacked = false,
		layout = "vertical",
		referenceLines,
		showDataLabels = false,
		legendPosition = "normal",
	} = config;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalHeight, setModalHeight] = useState<number>(600);

	useEffect(() => {
		if (isModalOpen && typeof window !== "undefined") {
			// Calculate modal height as 90% of window height minus close button and padding
			setModalHeight(window.innerHeight * 0.9 - 100);
		}
	}, [isModalOpen]);

	const formatValue = useCallback((value: number, format?: string): string => {
		if (format === "percentage") {
			return `${value}%`;
		}
		if (format === "currency") {
			return `$${numeralFormat(value)}`;
		}

		const absValue = Math.abs(value);

		if (absValue >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`;
		}
		if (absValue >= 1000) {
			return `${(value / 1000).toFixed(1)}k`;
		}
		return numeralFormat(value);
	}, []);

	const mergedTooltipConfig: TooltipConfig = useMemo(() => {
		const defaultFields: TooltipField[] = [
			{
				label: "YOY Variance",
				dataKey: "yoy_variance",
				format: "percentage",
			},
			{
				label: "Day to Day Growth",
				dataKey: "variance",
				format: "percentage",
			},
		];

		return {
			...tooltipConfig,
			fields: tooltipConfig.fields
				? [
						...tooltipConfig.fields,
						...defaultFields.filter(
							(defaultField) =>
								!tooltipConfig.fields?.some(
									(field) => field.dataKey === defaultField.dataKey
								)
						),
				  ]
				: defaultFields,
		};
	}, [tooltipConfig]);

	const adjustedLegendConfig: LegendConfig = useMemo(() => {
		if (legendPosition === "onTop") {
			return {
				align: "center",
				verticalAlign: "top",
				layout: "horizontal",
				...legendConfig,
			};
		}
		return legendConfig;
	}, [legendPosition, legendConfig]);

	const finalYAxis: AxisConfig = useMemo(() => {
		const defaultYAxis: AxisConfig = {
			label: "Value",
			type: "number",
			tickFormatter: (value: string | number) =>
				formatValue(Number(value), yAxis?.format),
			allowDecimals: true,
			format: yAxis?.format || undefined,
		};

		if (yAxis) {
			return {
				...defaultYAxis,
				...yAxis,
				tickFormatter: (value: string | number) =>
					formatValue(Number(value), yAxis.format),
			};
		}
		return defaultYAxis;
	}, [yAxis, formatValue]);

	const finalRightYAxis: AxisConfig | undefined = useMemo(() => {
		if (rightYAxis) {
			return {
				label: rightYAxis.label || finalYAxis.label,
				type: rightYAxis.type || finalYAxis.type,
				domain: rightYAxis.domain || finalYAxis.domain,
				tickFormatter: (value: string | number) =>
					formatValue(Number(value), rightYAxis.format),
				tickCount: rightYAxis.tickCount || finalYAxis.tickCount,
				allowDecimals:
					rightYAxis.allowDecimals !== undefined
						? rightYAxis.allowDecimals
						: finalYAxis.allowDecimals,
				format: rightYAxis.format || finalYAxis.format,
			};
		}
		return undefined;
	}, [rightYAxis, finalYAxis]);

	const renderDataLabels = useCallback(
		(dataKey: string, name: string) => {
			if (chartType === "pie") return null;

			if (
				dataKey === "target" ||
				dataKey === "average_length_of_stay" ||
				dataKey === "neutral_percentage"
			) {
				return null;
			}

			const labelPosition = stacked ? "inside" : "top";

			return (
				showDataLabels && (
					<LabelList
						dataKey={dataKey}
						position={labelPosition}
						className="text-xs font-medium text-white"
						formatter={(value: number) => formatValue(value)}
						aria-label={`Label for ${name}`}
					/>
				)
			);
		},
		[chartType, showDataLabels, stacked, formatValue]
	);

	const renderYAxisComponent = useCallback(() => {
		if (chartType === "pie") return null;

		return (
			<>
				<YAxis
					yAxisId="left"
					type={finalYAxis.type as any}
					domain={["auto", "auto"]}
					tickFormatter={finalYAxis.tickFormatter}
					tickCount={finalYAxis.tickCount || 5}
					allowDecimals={finalYAxis.allowDecimals ?? true}
					axisLine={{ stroke: "#ccc" }}
					tickLine={{ stroke: "#ccc" }}
					tick={{ fill: "#000", fontSize: 12 }}
					aria-label={`Y Axis: ${finalYAxis.label}`}
				/>
				{finalRightYAxis && (
					<YAxis
						yAxisId="right"
						orientation="right"
						type={finalRightYAxis.type as any}
						domain={["auto", "auto"]}
						tickFormatter={finalRightYAxis.tickFormatter}
						tickCount={finalRightYAxis.tickCount || 5}
						allowDecimals={finalRightYAxis.allowDecimals ?? true}
						axisLine={{ stroke: "#ccc" }}
						tickLine={{ stroke: "#ccc" }}
						tick={{ fill: "#000", fontSize: 12 }}
						aria-label={`Right Y Axis: ${finalRightYAxis.label}`}
					/>
				)}
			</>
		);
	}, [finalYAxis, finalRightYAxis, chartType]);


	const periodLabel = useMemo(() => getPeriodLabel(range), [range]);

	const renderTooltipComponent = useMemo(() => {
		if (!showTooltip) return null;

		if (mergedTooltipConfig.custom && mergedTooltipConfig.content) {
			return <Tooltip content={mergedTooltipConfig.content} />;
		}

		return (
			<Tooltip
				content={({ active, payload }) => {
					if (active && payload && payload.length) {
						const entry = payload[0];
						if (!entry || !entry.payload) return null;

						return (
							<ChartTooltip
								date={entry.payload.name || entry.payload.date || ""}
							>
								<div className="flex flex-col gap-1">
									{keys.map((key: any) => {
										const value = entry.payload[key.dataKey];
										if (value === undefined || value === null) return null;
										return (
											<div key={key.dataKey} className="text-xs">
												<span className="font-bold">
													{formatValue(value, key.format)}
												</span>{" "}
												{key.name}
											</div>
										);
									})}

									{entry.payload.yoy_variance !== undefined && (
										<div className="flex items-center gap-1 text-xs">
											<div
												className={`flex flex-row items-center justify-center rounded-[5px] ${
													entry.payload.yoy_variance < 0
														? "bg-red-500"
														: "bg-[#3F7F37]"
												} px-1 py-0.5 text-xs font-bold`}
											>
												{entry.payload.yoy_variance > 0
													? `+${entry.payload.yoy_variance.toFixed(0)}`
													: `${entry.payload.yoy_variance?.toFixed(0)}`}
												%
											</div>
											vs. Prev. Year
										</div>
									)}
									{entry.payload.variance !== undefined && (
										<div className="flex items-center gap-1 text-xs">
											<div
												className={`flex flex-row items-center justify-center rounded-[5px] ${
													entry.payload.variance < 0
														? "bg-red-500"
														: "bg-[#3F7F37]"
												} px-1 py-0.5 text-xs font-bold`}
											>
												{entry.payload.variance > 0
													? `+${entry.payload.variance.toFixed(0)}`
													: `${entry.payload.variance?.toFixed(0)}`}
												%
											</div>
											vs. Prev. {periodLabel}
										</div>
									)}
									{entry.payload.cash_out_flow_variance !== undefined && (
										<div className="flex items-center gap-1 text-xs">
											<div
												className={`flex flex-row items-center justify-center rounded-[5px] ${
													entry.payload.cash_out_flow_variance < 0
														? "bg-red-500"
														: "bg-[#3F7F37]"
												} px-1 py-0.5 text-xs font-bold`}
											>
												{entry.payload.cash_out_flow_variance > 0
													? `+${entry.payload.cash_out_flow_variance}`
													: `${entry.payload.cash_out_flow_variance}`}
												%
											</div>
											vs. Forecasted
										</div>
									)}

									{/* Additional tooltip content omitted for brevity */}
								</div>
							</ChartTooltip>
						);
					}
					return null;
				}}
			/>
		);
	}, [showTooltip, mergedTooltipConfig, keys, formatValue, periodLabel]);

	const renderLegendComponent = useMemo(() => {
		if (!showLegend) return null;

		const formatLegend = (value: string) => {
			const cleanValue = value?.replace(/[()%]/g, "");
			return (
				<span className="text-xs font-medium text-black">{cleanValue}</span>
			);
		};

		return (
			<Legend
				{...adjustedLegendConfig}
				formatter={formatLegend}
				wrapperStyle={{
					fontSize: "10px",
					color: "#000",
					opacity: 1,
					paddingTop: legendPosition === "onTop" ? 8 : 16,
					paddingBottom: legendPosition === "onTop" ? 16 : 4,
					height: 45,
					textAlign: "center",
				}}
			/>
		);
	}, [showLegend, adjustedLegendConfig, legendPosition]);

	const renderGridComponent = useMemo(() => {
		if (showGrid && chartType !== "pie") {
			return <CartesianGrid strokeDasharray="3 3" />;
		}
		return null;
	}, [showGrid, chartType]);

	const renderGradients = useMemo(() => {
		if (chartType === "area" || chartType === "mixed" || chartType === "line") {
			const skipKeys = ["target", "variance"];
			return (
				<defs>
					{keys.map(
						(key) =>
							key.color &&
							!skipKeys.includes(key.dataKey) && (
								<linearGradient
									key={key.dataKey}
									id={`gradient-${key.dataKey}`}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor={key.gradientStart || key.color}
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor={key.gradientEnd || "#fff"}
										stopOpacity={0}
									/>
								</linearGradient>
							)
					)}
				</defs>
			);
		}
		return null;
	}, [chartType, keys]);

	const renderReferenceLinesComponent = useMemo(() => {
		return referenceLines?.map((ref, index) => (
			<ReferenceLine
				key={`reference-line-${index}`}
				y={ref.value}
				yAxisId={finalRightYAxis ? "right" : "left"}
				label={ref.label}
				stroke={ref.stroke || "#FF0000"}
				strokeDasharray={ref.strokeDasharray || "3 3"}
				aria-label={`Reference Line: ${ref.label || ref.value}`}
			/>
		));
	}, [referenceLines, finalRightYAxis]);

const renderCustomizedLabel = ({
	cx,
	cy,
	midAngle,
	outerRadius,
	percent,
	name,
	fontSize = 12,
	index,
}: {
	cx: number;
	cy: number;
	midAngle: number;
	outerRadius: number;
	percent: number;
	name: string;
	fontSize: number;
	index: number;
}) => {
	const RADIAN = Math.PI / 180;
	const sin = Math.sin(RADIAN * midAngle);
	const cos = Math.cos(RADIAN * midAngle);

	const startX = cx + outerRadius * cos;
	const startY = cy + outerRadius * -sin;
	const middleY = cy + (outerRadius + 50 * Math.abs(sin)) * -sin;

	let endX = startX + (cos >= 0 ? 1 : -1) * 15;

	// 👇 Explicitly type this as the allowed union
	let textAnchor: "start" | "middle" | "end" | "inherit" =
		cos >= 0 ? "start" : "end"; // ⬅️ typed

	const mirrorNeeded =
		midAngle > -270 && midAngle < -210 && percent < 0.04 && index % 2 === 1;

	if (mirrorNeeded) {
		endX = startX + outerRadius * -cos * 2 + 100;
		textAnchor = "start"; // still valid for that union
	}

	const percentage = percent * 100;

	return (
		<g>
			<path
				d={`M${startX},${startY}L${startX},${middleY}L${endX},${middleY}`}
				fill="none"
				stroke="#000"
				strokeWidth={1}
			/>
			<text
				x={endX + (cos >= 0 || mirrorNeeded ? 1 : -1)}
				y={middleY + fontSize / 2}
				textAnchor={textAnchor} // ⬅️ now correctly typed
				fontSize={fontSize}
				fontFamily="Proxima Nova"
				style={{ fontFamily: "Proxima Nova" }}
			>
				{`${name
					?.replace(/_/g, " ")
					?.replace(/\b\w/g, (char: string) => char?.toUpperCase())} ${percentage.toFixed(
					1
				)}%`}
			</text>
		</g>
	);
};


	const renderChart = useMemo(() => {
		if (!chartType) return null;

		const commonProps: any = {
			data,
			layout: layout === "horizontal" ? "vertical" : "horizontal",
			margin: {
				top: legendPosition === "onTop" ? 40 : 20,
				right: finalRightYAxis ? 50 : 50,
				left: 50,
				bottom: 20,
			},
		};

		const renderXAxisComponent =
			xAxis && chartType !== "pie" ? (
				<XAxis
					dataKey={xAxis.label}
					type={xAxis.type as any}
					domain={xAxis.domain}
					tickFormatter={xAxis.tickFormatter}
					tickCount={xAxis.tickCount}
					allowDecimals={xAxis.allowDecimals}
					aria-label={`X Axis: ${xAxis.label}`}
					className="text-xs font-medium text-gray-500"
				/>
			) : null;

		switch (chartType) {
			case "bar":
				return (
					<BarChart {...commonProps}>
						{renderGridComponent}
						{renderXAxisComponent}
						{renderYAxisComponent()}
						{renderTooltipComponent}
						{renderLegendComponent}
						{renderReferenceLinesComponent}
						{keys.map((key) => (
							<Bar
								key={key.dataKey}
								dataKey={key.dataKey}
								fill={key.color}
								opacity={key.opacity}
								name={key.name}
								stackId={stacked ? "a" : undefined}
								yAxisId={key.yAxisId || "left"}
								aria-label={`Bar: ${key.name}`}
							>
								{renderDataLabels(key.dataKey, key.name)}
							</Bar>
						))}
					</BarChart>
				);
			case "line":
				return (
					<ComposedChart {...commonProps}>
						{renderGradients}
						{renderGridComponent}
						{renderXAxisComponent}
						{renderYAxisComponent()}
						{renderTooltipComponent}
						{renderLegendComponent}
						{renderReferenceLinesComponent}
						{keys.map((key) =>
							key.dataKey !== "target" ? (
								<Area
									key={key.dataKey}
									type="monotone"
									dataKey={key.dataKey}
									stroke={key.color}
									name={key.name}
									fill={
										key.color && "#ffffff"
											? `url(#gradient-${key.dataKey})`
											: key.color
									}
									dot={key.showDots}
									yAxisId={key.yAxisId || "left"}
									aria-label={`Line: ${key.name}`}
								>
									{renderDataLabels(key.dataKey, key.name)}
								</Area>
							) : (
								<Line
									key={key.dataKey}
									dataKey={key.dataKey}
									stroke={key.color}
									yAxisId={key.yAxisId || "left"}
									dot={key.showDots}
									name={key.name}
									type={"monotone"}
									aria-label={`Line: ${key.name}`}
								/>
							)
						)}
					</ComposedChart>
				);
			case "area":
				return (
					<AreaChart {...commonProps}>
						{renderGradients}
						{renderGridComponent}
						{renderXAxisComponent}
						{renderYAxisComponent()}
						{renderTooltipComponent}
						{renderLegendComponent}
						{renderReferenceLinesComponent}
						{keys.map((key) => (
							<Area
								key={key.dataKey}
								type="monotone"
								dataKey={key.dataKey}
								stroke={key.color}
								fill={
									key.gradientStart && key.gradientEnd
										? `url(#gradient-${key.dataKey})`
										: key.color
								}
								name={key.name}
								dot={key.showDots}
								yAxisId={key.yAxisId || "left"}
								aria-label={`Area: ${key.name}`}
							>
								{renderDataLabels(key.dataKey, key.name)}
							</Area>
						))}
					</AreaChart>
				);
			case "scatter":
				return (
					<ScatterChart {...commonProps}>
						{renderGridComponent}
						{renderXAxisComponent}
						{renderYAxisComponent()}
						{renderTooltipComponent}
						{renderLegendComponent}
						{renderReferenceLinesComponent}
						{keys.map((key) => (
							<Scatter
								key={key.dataKey}
								dataKey={key.dataKey}
								fill={key.color}
								name={key.name}
								yAxisId={key.yAxisId || "left"}
								aria-label={`Scatter: ${key.name}`}
							>
								{renderDataLabels(key.dataKey, key.name)}
							</Scatter>
						))}
					</ScatterChart>
				);
			case "mixed":
				return (
					<ComposedChart {...commonProps}>
						{renderGradients}
						{renderGridComponent}
						{renderXAxisComponent}
						{renderYAxisComponent()}
						{renderTooltipComponent}
						{renderLegendComponent}
						{renderReferenceLinesComponent}
						{keys.map((key) => {
							switch (key.type) {
								case "bar":
									return (
										<Bar
											key={key.dataKey}
											dataKey={key.dataKey}
											fill={key.color}
											name={key.name}
											stackId={stacked ? "a" : undefined}
											yAxisId={key.yAxisId || "left"}
											aria-label={`Bar: ${key.name}`}
										>
											{renderDataLabels(key.dataKey, key.name)}
										</Bar>
									);
								case "line":
									return (
										<Line
											key={key.dataKey}
											type="monotone"
											dataKey={key.dataKey}
											stroke={key.color}
											strokeWidth={2}
											name={key.name}
											dot={true}
											yAxisId={key.yAxisId || "left"}
											aria-label={`Line: ${key.name}`}
										>
											{renderDataLabels(key.dataKey, key.name)}
										</Line>
									);
								case "area":
									return (
										<Area
											key={key.dataKey}
											type="monotone"
											dataKey={key.dataKey}
											stroke={key.color}
											fill={
												key.gradientStart && key.gradientEnd
													? `url(#gradient-${key.dataKey})`
													: key.color
											}
											name={key.name}
											dot={key.showDots}
											yAxisId={key.yAxisId || "left"}
											aria-label={`Area: ${key.name}`}
										>
											{renderDataLabels(key.dataKey, key.name)}
										</Area>
									);
								case "scatter":
									return (
										<Scatter
											key={key.dataKey}
											dataKey={key.dataKey}
											fill={key.color}
											name={key.name}
											yAxisId={key.yAxisId || "left"}
											aria-label={`Scatter: ${key.name}`}
										>
											{renderDataLabels(key.dataKey, key.name)}
										</Scatter>
									);
								default:
									return null;
							}
						})}
					</ComposedChart>
				);
			case "pie":
				return (
					<PieChart {...commonProps} aria-label="Pie Chart">
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							dataKey="value"
							nameKey="category"
							innerRadius={pieChartInnerRadius}
							outerRadius={pieChartOuterRadius}
							startAngle={90}
							endAngle={-280}
							paddingAngle={0}
							isAnimationActive={false}
							labelLine={false}
							label={renderCustomizedLabel}
						>
							{data.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.color} />
							))}
						</Pie>

						{renderTooltipComponent}
						{renderLegendComponent}
					</PieChart>
				);
			default:
				return null;
		}
	}, [
		chartType,
		data,
		layout,
		legendPosition,
		xAxis,
		keys,
		renderYAxisComponent,
		stacked,
		renderDataLabels,
		renderGradients,
		renderGridComponent,
		renderTooltipComponent,
		renderLegendComponent,
		renderReferenceLinesComponent,
		pieChartInnerRadius,
		pieChartOuterRadius,
		finalRightYAxis,

		renderCustomizedLabel,
	]);

	return (
		<ChartWrapper
			subtitleDetails={subtitleDetails}
			activePeriod={activePeriod}
			subtitle={subtitle}
			lightSubtitle={lightSubtitle}
			targetValue={targetValue}
			theme={theme}
			customRightContent={customRightContent}
			customRightDetails={customRightDetails}
		>
			<div ref={chartRef}>
				<ResponsiveContainer width="100%" height={height}>
					{!data || data.length === 0 ? (
						<div
							className="flex h-full items-center justify-center text-gray-500"
							aria-label="No data available"
						>
							No data available
						</div>
					) : (
						renderChart!
					)}
				</ResponsiveContainer>
				<div className="relative bottom-5 mb-4 flex w-full items-center justify-end gap-2">
					{/* Download Buttons */}
					<button
						onClick={() => downloadAsImage("png")}
						className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
						aria-label="Download as PNG"
						title="Download as PNG"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7,10 12,15 17,10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
					</button>
					<button
						onClick={downloadAsPDF}
						className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-red-500 text-white transition-colors hover:bg-red-600"
						aria-label="Download as PDF"
						title="Download as PDF"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
						</svg>
					</button>
					{showExpandIcon && (
						<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
							<DialogTrigger asChild>
								<button
									className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-gray-600 text-white transition-colors hover:bg-gray-700"
									aria-label="Expand Chart"
									title="Expand Chart"
								>
									<Image
										src="/expand.png"
										alt="Expand"
										className="h-5 w-5"
										width={20}
										height={20}
									/>
								</button>
							</DialogTrigger>
							<DialogContent className="h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] overflow-hidden p-0">
								<div className="flex h-full flex-col overflow-hidden">
									<div className="flex-1 p-6">
										<AppChart
											data={data}
											config={config}
											subtitle={subtitle}
											subtitleDetails={subtitleDetails}
											activePeriod={activePeriod}
											targetValue={targetValue}
											lightSubtitle={lightSubtitle}
											height={modalHeight}
											customRightContent={customRightContent}
											isLoading={isLoading}
											customRightDetails={customRightDetails}
											range={range}
											pieChartInnerRadius={pieChartInnerRadius}
											pieChartOuterRadius={pieChartOuterRadius}
											showExpandIcon={false}
										/>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					)}
				</div>
			</div>
		</ChartWrapper>
	);
};

const AppChart: React.FC<ChartProps> = React.memo(AppChartComponent);

AppChart.displayName = "AppChart";

export { AppChart };
