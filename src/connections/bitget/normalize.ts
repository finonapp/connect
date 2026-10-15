import type { Asset, Transaction } from "../../core/types";
import { AssetType, TransactionFlow } from "../../core/types";
import type { BitgetAccountAsset, BitgetOrderFeeDetail, BitgetSpotOrder } from "./types";

export function normalizeAsset(asset: BitgetAccountAsset): Asset<BitgetAccountAsset> {
	const symbol = asset.coin.toUpperCase();
	return {
		id: symbol,
		type: AssetType.CRYPTO,
		name: symbol,
		symbol,
		quantity: Number(asset.available ?? 0),
		raw: asset,
	};
}

function parseFeeDetail(raw: string | undefined): BitgetOrderFeeDetail | undefined {
	if (!raw) return undefined;
	try {
		return JSON.parse(raw) as BitgetOrderFeeDetail;
	} catch {
		return undefined;
	}
}

function transactionFees(order: BitgetSpotOrder): number {
	const details = parseFeeDetail(order.feeDetail);
	const newFee = details?.newFees?.t;
	const legacyFee = details?.[order.baseCoin]?.totalFee ?? details?.[order.quoteCoin]?.totalFee;
	const fee = Number(newFee ?? legacyFee ?? 0);
	return Number.isFinite(fee) ? Math.abs(fee) : 0;
}

export function normalizeTransaction(order: BitgetSpotOrder): Transaction<BitgetSpotOrder> {
	const side = order.side.toLowerCase();
	const amount = Math.abs(Number(order.quoteVolume));
	return {
		id: order.orderId,
		flow:
			side === "buy"
				? TransactionFlow.BOUGHT
				: side === "sell"
					? TransactionFlow.SOLD
					: TransactionFlow.OTHER,
		quantity: String(Math.abs(Number(order.baseVolume))),
		assetSymbol: order.baseCoin.toUpperCase(),
		amount: side === "buy" ? -amount : amount,
		currency: order.quoteCoin.toUpperCase(),
		fees: transactionFees(order),
		status: order.status,
		createdAt: Math.floor(Number(order.cTime) / 1000),
		raw: order,
	};
}
