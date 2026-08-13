import type { ProviderMetadata } from "../core/metadata";
import { coinbaseMetadata } from "./coinbase/metadata";
import { trading212Metadata } from "./trading212/metadata";

export const providers: ProviderMetadata[] = [coinbaseMetadata, trading212Metadata];
