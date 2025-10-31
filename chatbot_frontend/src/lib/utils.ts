import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import numeral from "numeral";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const numeralFormat = (num: number | string) => {
	if (typeof num === "string" && /^\d{2}:\d{2}$/.test(num)) {
		return num;
	}
	return numeral(Number(num)).format("0,0.0");
};
