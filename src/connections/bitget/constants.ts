export const PROVIDER_ID = "bitget";
export const PROVIDER_NAME = "Bitget";

export const BASE_URL = "https://api.bitget.com";
export const API_PASSPHRASE = "freemyfinances";

export const ACCOUNT_INFO_PATH = "/api/v2/spot/account/info";
export const ACCOUNT_ASSETS_PATH = "/api/v2/spot/account/assets";
export const HISTORY_ORDERS_PATH = "/api/v2/spot/trade/history-orders";

export const HISTORY_ORDERS_PAGE_SIZE = 100;

// "stor"/"stow" = spot trading read / read-write, which covers assets and order history.
export const SPOT_READ_AUTHORITIES = ["stor", "stow"];
