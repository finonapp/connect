import { trading212 } from "./trading212";

const providers = {
	trading212,
} as const;

export type ProviderId = keyof typeof providers;

export { trading212 };
export default providers;
