import { bitget } from "./bitget/index";
import { moneybox } from "./moneybox";
import { trading212 } from "./trading212";

const providers = {
	trading212,
	bitget,
	moneybox,
} as const;

export * from "./bitget/index";
export * from "./trading212";
export * from "./moneybox";
export default providers;
