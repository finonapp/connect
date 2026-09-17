import type { MoneyboxInstrument } from "./types";

export const PROVIDER_ID = "moneybox";
export const PROVIDER_NAME = "Moneybox";

export const WEBSITE = "https://www.moneyboxapp.com";
export const APP_URL = "moneybox://";

/** Currency every Moneybox statement is denominated in. */
export const STATEMENT_CURRENCY = "GBP";

/** Product names as printed on statements; used to tell the statement kinds apart. */
export const PRODUCT_STOCKS_SHARES_ISA = "Stocks & Shares ISA";
export const PRODUCT_CASH_ISA = "Cash ISA";

/** Asset ids for the cash balances (stocks and shares ISA cash, cash ISA savings). */
export const CASH_ASSET_ID = "gbp";
export const CASH_ISA_ASSET_ID = "cash-isa";

/**
 * Funds and stocks Moneybox offers in its Stocks & Shares ISA, keyed by the
 * two names the statement uses for them: `shortName` in the transaction list
 * ("FTSE 100 ETF") and `longName` in the holdings table ("Vanguard FTSE 100
 * UCITS ETF Accumulating"). Moneybox has no API to fetch this from, so the map
 * is static; holdings it does not know are still returned, identified by ISIN
 * when the statement provides one. `currency` is the quote currency of the
 * listing ("GBp" = pence, as on the London Stock Exchange).
 */
export const INSTRUMENTS: MoneyboxInstrument[] = [
	{ shortName: "Adobe", longName: "Adobe", symbol: "ADBE", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Alphabet", longName: "Alphabet", symbol: "GOOGL", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Amazon", longName: "Amazon", symbol: "AMZN", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Apple", longName: "Apple", symbol: "AAPL", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "AT&T", longName: "AT&T", symbol: "T", exchange: "NYSE", currency: "USD" },
	{
		shortName: "Berkshire Hathaway",
		longName: "Berkshire Hathaway",
		symbol: "BRK-B",
		exchange: "NYSE",
		currency: "USD",
	},
	{ shortName: "Coca-Cola", longName: "Coca-Cola", symbol: "KO", exchange: "NYSE", currency: "USD" },
	{ shortName: "Disney", longName: "Disney", symbol: "DIS", exchange: "NYSE", currency: "USD" },
	{
		shortName: "JPMorgan Chase & Co",
		longName: "JPMorgan Chase & Co",
		symbol: "JPM",
		exchange: "NYSE",
		currency: "USD",
	},
	{ shortName: "Mastercard", longName: "Mastercard", symbol: "MA", exchange: "NYSE", currency: "USD" },
	{ shortName: "McDonald's", longName: "McDonald's", symbol: "MCD", exchange: "NYSE", currency: "USD" },
	{ shortName: "Meta", longName: "Meta", symbol: "META", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Microsoft", longName: "Microsoft", symbol: "MSFT", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Nike", longName: "Nike", symbol: "NKE", exchange: "NYSE", currency: "USD" },
	{ shortName: "NVIDIA", longName: "NVIDIA", symbol: "NVDA", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Pfizer", longName: "Pfizer", symbol: "PFE", exchange: "NYSE", currency: "USD" },
	{ shortName: "Procter & Gamble", longName: "Procter & Gamble", symbol: "PG", exchange: "NYSE", currency: "USD" },
	{ shortName: "T-Mobile", longName: "T-Mobile", symbol: "TMUS", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Tesla", longName: "Tesla", symbol: "TSLA", exchange: "NASDAQ", currency: "USD" },
	{ shortName: "Visa", longName: "Visa", symbol: "V", exchange: "NYSE", currency: "USD" },
	{
		shortName: "Artificial Intelligence (Al) ETF",
		longName: "Artificial Intelligence (Al) ETF",
		symbol: "INTL",
		isin: "IE00BDVPNG13",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Automation & Robotics ETF",
		longName: "iShares Automation & Robotics UCITS ETF",
		symbol: "IIVPF",
		isin: "IE00BYZK4552",
		exchange: "OTC",
		currency: "USD",
	},
	{
		shortName: "Cash Trust",
		longName: "Legal & General Cash Trust",
		symbol: "0P00008F5Y",
		isin: "GB00B0CNHB64",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Clean Water ETF",
		longName: "L&G Clean Water UCITS ETF",
		symbol: "GLGG",
		isin: "IE00BK5BC891",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Cyber Security ETF",
		longName: "L&G Cyber Security UCITS ETF",
		symbol: "ISPY",
		isin: "IE00BYPLS672",
		exchange: "Euronext",
		currency: "EUR",
	},
	{
		shortName: "Digitalisation ETF",
		longName: "iShares Digitalisation UCITS ETF",
		symbol: "2B79",
		isin: "IE00BYZK4883",
		exchange: "XETR",
		currency: "EUR",
	},
	{
		shortName: "Emerging Markets Shares",
		longName: "Fidelity Index Emerging Markets P Acc",
		symbol: "0P00011YDA",
		isin: "GB00BHZK8D21",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Emerging Markets Shares ESG",
		longName: "Royal London Emerging Markets Equity Tilt Fund Class ZAcc",
		symbol: "0P0001B4UH",
		isin: "GB00BZ8FWL65",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "European Shares ETF",
		longName: "ishares Core MSCI Europe UCITS ETF EUR",
		symbol: "EUNK",
		isin: "IE00B4K48X80",
		exchange: "XETR",
		currency: "EUR",
	},
	{
		shortName: "European Shares SRI ETF",
		longName: "iShares MSCI Europe SRI UCITS ETF",
		symbol: "IESE",
		isin: "IE00B52VJ196",
		exchange: "Euronext",
		currency: "EUR",
	},
	{
		shortName: "FTSE 100 ETF",
		longName: "Vanguard FTSE 100 UCITS ETF Accumulating",
		symbol: "VUKG",
		isin: "IE00BFMXYP42",
		exchange: "LSE",
		currency: "GBP",
	},
	{
		shortName: "FTSE 250 ETF",
		longName: "Vanguard FTSE 250 UCITS ETF GBP Acc",
		symbol: "VMIG",
		isin: "IE00BFMXVQ44",
		exchange: "LSE",
		currency: "GBP",
	},
	{
		shortName: "Global Ageing Population ETF",
		longName: "iShares Ageing Population UCITS ETF",
		symbol: "2B77",
		isin: "IE00BYZK4669",
		exchange: "XETR",
		currency: "EUR",
	},
	{
		shortName: "Global Aggregate Bonds ETF",
		longName: "Vanguard Global Aggregate Bond UCITS ETF GBP Hedged Acc",
		symbol: "VAG6",
		isin: "IE00BG47K971",
		exchange: "XBER",
		currency: "EUR",
	},
	{
		shortName: "Global Blockchain ETF",
		longName: "Invesco CoinShares Global Blockchain UCITS ETF",
		symbol: "BCHN",
		isin: "IE00BGBN6P67",
		exchange: "LSE",
		currency: "USD",
	},
	{
		shortName: "Global Carbon Transition ETF",
		longName: "JPM Carbon Transition Global Equity UCITS ETF - USD Acc",
		symbol: "JPCT",
		isin: "IE00BMDWYZ92",
		exchange: "LSE",
		currency: "USD",
	},
	{
		shortName: "Global Clean Energy ETF",
		longName: "iShares Global Clean Energy UCITS ETF",
		symbol: "IMSIF",
		isin: "IE00B1XNHC34",
		exchange: "OTC",
		currency: "USD",
	},
	{
		shortName: "Global Gender Equality ETF",
		longName: "UBS ETF plc - Global Gender Equality UCITS ETF USD A Acc",
		symbol: "GENE",
		isin: "IE00BDR5GV14",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Global Health & Pharmaceuticals Shares",
		longName: "Legal & General Global Health & Pharmaceuticals Index Trust | Class Acc",
		symbol: "0P000023U7",
		isin: "GB00B0CNH387",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Global Property Shares ESG",
		longName: "iShares Environment & Low Carbon Tilt Real Estate Index Fund (UK) H Acc",
		isin: "GB00BPFJCF57",
	},
	{
		shortName: "Global Shares",
		longName: "Fidelity Index World Fund P Acc",
		symbol: "0P000125KV",
		isin: "GB00BJS8SJ34",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Global Shares ESG",
		longName: "Old Mutual MSCI World Selection Index H Acc",
		symbol: "0P0001F6CL",
		isin: "IE00BFZQ9335",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Global Shares Low Volatility ETF",
		longName: "Xtrackers MSCI World Minimum Volatility UCITS ETF 1C (GBP)",
		symbol: "XDEB",
		isin: "IE00BL25JN58",
		exchange: "XETR",
		currency: "EUR",
	},
	{
		shortName: "Global Technology Shares",
		longName: "Legal & General Global Technology Index Trust I Class Acc",
		symbol: "0P000023MW",
		isin: "GB00B0CNH163",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "High Dividend Yield ETF",
		longName: "Vanguard FTSE All-World High Dividend Yield UCITS ETF USD Acc",
		symbol: "VGWEF",
		isin: "IE00BK5BR626",
		exchange: "OTC",
		currency: "USD",
	},
	{
		shortName: "Islamic Global Shares",
		longName: "HSBC Islamic Global Equity Index Fund BCGBP",
		symbol: "0P0001IVNL",
		isin: "LU2092165666",
		exchange: "LSE",
		currency: "GBp",
	},
	{
		shortName: "Overseas Corporate Bonds ESG",
		longName: "iShares ESG Screened Overseas Corporate Bond Index Fund (UK) D Acc",
		isin: "GB00B58YKH53",
	},
	{
		shortName: "Overseas Government Bonds",
		longName: "iShares Overseas Government Bond Index Fund (UK) D Acc",
		isin: "GB00B849C803",
	},
	{
		shortName: "Russell 2000 ETF",
		longName: "SPDR Russell 2000 U.S. Small Cap UCITS ETF GBP",
		symbol: "R2SC",
		isin: "IE00BJ38QD84",
		exchange: "LSE",
		currency: "GBP",
	},
	{
		shortName: "S&P 500 ESG ETF",
		longName: "UBS S&P 500 Scored & Screened UCITS (USD) A-dis ETF",
		symbol: "S5SD",
		isin: "IE00BHXMHK04",
		exchange: "XETR",
		currency: "EUR",
	},
	{
		shortName: "S&P 500 ETF",
		longName: "Vanguard S&P 500 UCITS ETF Accumulating",
		symbol: "VUAA",
		isin: "IE00BFMXXD54",
		exchange: "LSE",
		currency: "USD",
	},
	{
		shortName: "Semiconductor ETF",
		longName: "VanEck Semiconductor UCITS ETF GBP",
		symbol: "VVSMF",
		isin: "IE00BMC38736",
		exchange: "OTC",
		currency: "USD",
	},
	{
		shortName: "UK Government Bonds (Gilts) ETF",
		longName: "Vanguard U.K. Gilt UCITS ETF GBP Acc",
		symbol: "VGVA",
		isin: "IE00BH04GW44",
		exchange: "LSE",
		currency: "GBP",
	},
	{
		shortName: "US Government Bonds ETF",
		longName: "Vanguard USD Treasury Bond UCITS ETF USD Acc (GBP)",
		symbol: "VAGT",
		isin: "IE00BGYWFS63",
		exchange: "Munich",
		currency: "EUR",
	},
];
