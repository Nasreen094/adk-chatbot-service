"use client";

import React from "react";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

type Tab = {
	label: string;
	value: string;
};

type ChartTabsProps = {
	activeTab: string;
	tabs: Tab[];
	onTabChange: (value: string) => void;
};

const ChartTabs: React.FC<ChartTabsProps> = ({
	activeTab,
	tabs,
	onTabChange,
}) => {
	return (
		<div className="flex flex-col items-center justify-center px-2 py-1">
			<Tabs defaultValue={activeTab} onValueChange={onTabChange}>
				<TabsList>
					{tabs.map((tab) => (
						<TabsTrigger
							value={tab.value}
							key={tab.value}
							aria-current={activeTab === tab.value ? "page" : undefined}
							aria-label={`Tab for ${tab.label}`}
						>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
};

export { ChartTabs };
