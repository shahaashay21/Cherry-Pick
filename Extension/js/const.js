const URL = "http://localhost:3000/";
// const URL = "http://www.cherrypickify.com:3000/";

const DEBUG = 1;
// Initalize
const PRODUCT_INIT = {
    recent: new Array(),
    saved: new Array(),
    expired: new Array(),
    pending: new Array()
};

const PRODUCT_STORAGE_CATEGORIES = ["recent", "saved"];

const UNIQUE_ID_LENGTH = 7;

const DAFAULT_OPTIONS = {
    maxDefaultRecentProducts: 10,
    syncTimeLimit: 43200, //12 hours
    addCPProductOnClick: false, // add product to recent tab if it is opened by clicking on the compare product section
    savedProductExpTime: 30, // Saved product expiration time in DAYS 
    ignoreRecentProduct: true
}

const OWNER_ICONS = {
    "amazon": "amazon.png",
    "walmart": "walmart.png",
    "bestbuy": "bestbuy.png",
    "target": "target.png",
}

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ALL_WEBSITES = ["amazon", "walmart", "bestbuy", "target"];

const STORAGE_ITEMS = [
    "products", "lastAccessed", "defaultOptions", "lastWindow", "lastSelectedId", "recentClickedProduct"
];

const ASYNC_PRODUCT_COMPARE = 5;