import React from "react";

import { KeyValueDisplay } from "../KeyValueDisplay/KeyValueDisplay";

export interface SubtitleDetail {
  title: string;
  value: string;
  targetValue?: string;
}

interface ChartWrapperProps {
  subtitle?: string;
  activePeriod?: string;
  onPeriodChange?: () => void;
  children?: React.ReactNode;
  subtitleDetails?: SubtitleDetail[];
  compact?: boolean;
  targetValue?: string;
  lightSubtitle?: string;
  theme?:
    | "attendance"
    | "financial"
    | "expenditure"
    | "operational"
    | "engagement";

  customRightContent?: React.ReactNode;
  customRightDetails?: {
    label: string;
    value: string;
  }[];
}

const ChartWrapper = ({
  subtitle,
  activePeriod,
  onPeriodChange,
  children,
  subtitleDetails,

  lightSubtitle,
  theme,
  customRightContent,
  customRightDetails,
}: ChartWrapperProps) => {
  return (
    <div className="flex flex-1 flex-col justify-start">
      {(subtitle || activePeriod || onPeriodChange) && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-1 flex-col gap-2 py-3">
            <div className="flex flex-1 flex-row items-center justify-between">
              <div className="flex flex-row gap-[3px]">
                {subtitle && (
                  <p className="text-sm font-semibold text-black">{subtitle}</p>
                )}
                {lightSubtitle && (
                  <p className="text-sm font-normal text-black">
                    {lightSubtitle}
                  </p>
                )}
              </div>
              {customRightContent}
            </div>

            <KeyValueDisplay
              subtitleDetails={subtitleDetails ?? []}
              theme={theme!}
              customRightDetails={customRightDetails}
            />
          </div>
          <div className="flex items-center gap-4">
            {!!activePeriod && (
              <span className="rounded-md bg-blue-100 px-3 py-1 text-sm">
                {activePeriod}
              </span>
            )}
            {onPeriodChange && (
              <button
                className="p-1"
                onClick={onPeriodChange}
                aria-label="Change Period"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default ChartWrapper;
