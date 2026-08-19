export const PROVIDER_ID = "trading212";
export const PROVIDER_NAME = "Trading 212";

export const LIVE_BASE_URL = "https://live.trading212.com";

/** Page size used when listing history endpoints (the API max is 50). */
export const TRANSACTIONS_PAGE_SIZE = 50;

// API paths.
export const ACCOUNT_SUMMARY_PATH = "/api/v0/equity/account/summary";
export const POSITIONS_PATH = "/api/v0/equity/positions";
export const INSTRUMENTS_PATH = "/api/v0/equity/metadata/instruments";
export const EXCHANGES_PATH = "/api/v0/equity/metadata/exchanges";
export const ORDERS_PATH = "/api/v0/equity/history/orders";
export const CASH_TRANSACTIONS_PATH = "/api/v0/equity/history/transactions";
export const DIVIDENDS_PATH = "/api/v0/equity/history/dividends";

/**
 * Exchange display name (lowercase) -> short exchange code used in asset
 */
export const EXCHANGE_SYMBOLS: Record<string, string> = {
	"bolsa de madrid": "BME",
	"borsa italiana": "MTA",
	"deutsche börse xetra": "XETR",
	"euronext amsterdam": "Euronext",
	"euronext brussels": "Euronext",
	"euronext lisbon": "Euronext",
	"euronext paris": "Euronext",
	gettex: "",
	"london stock exchange": "LSE",
	"london stock exchange aim": "LSE",
	nasdaq: "NASDAQ",
	nyse: "NYSE",
	"otc markets": "OTC",
	"six swiss exchange": "SIX",
	"toronto stock exchange": "TSX",
	"wiener börse": "VSE",
};

// API permission scopes.
export const PERMISSION_ACCOUNT = "Account Data";
export const PERMISSION_HISTORY_DIVIDENDS = "History - Dividends";
export const PERMISSION_HISTORY_ORDERS = "History - Orders";
export const PERMISSION_HISTORY_TRANSACTIONS = "History - Transactions";
export const PERMISSION_METADATA = "Metadata";
export const PERMISSION_PORTFOLIO = "Portfolio";
