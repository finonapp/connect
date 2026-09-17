import { moneybox } from "./moneybox";
import { trading212 } from "./trading212";

const providers = {
	trading212,
	moneybox,
} as const;

export * from "./trading212";
export * from "./moneybox";
export default providers;
