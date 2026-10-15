export interface BitgetResponse<T> {
	code: string;
	msg: string;
	requestTime: number;
	data: T;
}

export interface BitgetAccountAsset {
	coin: string;
	available: string;
	limitAvailable?: string;
	frozen?: string;
	locked?: string;
	uTime?: string;
}

export interface BitgetOrderFeeDetail {
	newFees?: {
		t?: number | string;
	};
	[currency: string]: { totalFee?: number | string; t?: number | string } | undefined;
}

export interface BitgetSpotOrder {
	userId: string;
	symbol: string;
	orderId: string;
	clientOid: string;
	price: string;
	size: string;
	orderType: string;
	side: string;
	status: string;
	priceAvg: string;
	baseVolume: string;
	quoteVolume: string;
	feeDetail?: string;
	quoteCoin: string;
	baseCoin: string;
	cTime: string;
	uTime: string;
}
