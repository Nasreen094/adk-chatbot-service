import React from "react";

const ChartTooltip = ({
  children,
  date,
}: {
  children: React.ReactNode;
  date: string;
}) => {
  return (
    <div className={`rounded-lg bg-[#233B7C] p-2 pt-1 !text-white shadow-lg`}>
      <div className="text-lg font-bold text-white">{date}</div>
      {children}
    </div>
  );
};

export { ChartTooltip };
