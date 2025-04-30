"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComexstatClient = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
/**
 * Client for interacting with the Comexstat API
 */
class ComexstatClient {
    /**
     * Creates a new ComexstatClient
     * @param baseUrl The base URL for the Comexstat API
     */
    constructor(baseUrl = "https://api-comexstat.mdic.gov.br") {
        this.baseUrl = baseUrl;
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000, // 30 seconds timeout
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            httpsAgent: new https_1.default.Agent({
                rejectUnauthorized: false, // WARNING: This is not recommended for production use
            }),
            maxRedirects: 5, // Allow up to 5 redirects
            validateStatus: (status) => status < 400, // Accept all successful responses
        });
    }
    /**
     * Makes a GET request to the Comexstat API
     * @param endpoint The API endpoint
     * @param params Query parameters
     * @returns The response data
     */
    async get(endpoint, params) {
        try {
            const config = {};
            if (params) {
                config.params = params;
            }
            const response = await this.client.get(endpoint, config);
            return response.data;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    /**
     * Makes a POST request to the Comexstat API
     * @param endpoint The API endpoint
     * @param data Request body data
     * @param params Optional query parameters
     * @returns The response data
     */
    async post(endpoint, data, params) {
        try {
            const config = {};
            if (params) {
                config.params = params;
            }
            const response = await this.client.post(endpoint, data, config);
            return response.data;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    /**
     * Handles API errors
     * @param error The error object
     */
    handleError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const status = axiosError.response?.status;
            const data = axiosError.response?.data;
            const message = data?.message || axiosError.message;
            console.error(`API Error (${status}): ${message}`);
            // Enhance error with additional information
            axiosError.apiError = {
                status,
                message,
                endpoint: axiosError.config?.url,
            };
        }
        else {
            console.error("Non-Axios error:", error);
        }
    }
    // API-specific methods
    /**
     * Gets the last update date of the Comexstat data
     * @returns The last update date
     */
    async getLastUpdate() {
        const response = await this.get("/general/dates/updated");
        return response.data.updated;
    }
    /**
     * Gets available years for queries
     * @returns Object with min and max years
     */
    async getAvailableYears() {
        const response = await this.get("/general/dates/years");
        return response.data;
    }
    /**
     * Gets available filters for queries
     * @param language Language for the response (default: 'pt')
     * @returns Array of filter objects with filter name and description
     */
    async getAvailableFilters(language = "pt") {
        const response = await this.get("/general/filters", { language });
        return response.data.list;
    }
    /**
     * Gets values for a specific filter
     * @param filter The filter name (e.g., 'country', 'economicBlock', 'section', 'ncm')
     * @param language Language for the response (default: 'pt')
     * @returns Array of filter values with id and text
     */
    async getFilterValues(filter, language = "pt") {
        const response = await this.get(`/general/filters/${filter}`, { language });
        // The API returns an array of arrays, but we only need the first array
        return response.data[0];
    }
    /**
     * Gets available fields for detailing/grouping
     * @param language Language for the response (default: 'pt')
     * @returns Array of field objects with filter and text properties
     */
    async getAvailableFields(language = "pt") {
        const response = await this.get("/general/details", { language });
        return response.data.list;
    }
    /**
     * Gets available metrics for queries
     * @param language Language for the response (default: 'pt')
     * @returns Array of metric objects with id, text, and dependencies
     */
    async getAvailableMetrics(language = "pt") {
        const response = await this.get("/general/metrics", { language });
        return response.data.list;
    }
    /**
     * Queries general export/import data
     * @param flow 'export' or 'import'
     * @param period Period object with from and to dates in YYYY-MM format (e.g., "2023-01")
     * @param monthDetail Whether to include month details in the response
     * @param filters Optional array of filters (country, state, economicBlock, section, chapter, position, subposition, ncm). For country filters, you must first get the country codes using getCountries(). (no need to search the Brazil code)
     * @param details Array of detail fields (country, state, economicBlock, section, chapter, position, subposition, ncm)
     * @param metrics Array of metrics (metricFOB, metricKG, metricStatistic, metricFreight, metricInsurance, metricCIF)
     * @param language Language for the response (default: 'pt')
     * @returns Query results
     * @example
     * // Example request:
     * queryData(
     *   "import",
     *   { from: "2022-01", to: "2022-12" },
     *   true,
     *   [
     *     { filter: "country", values: [105, 107] },
     *     { filter: "state", values: [26, 13] }
     *   ],
     *   ["country", "state", "ncm"],
     *   ["metricFOB", "metricKG"]
     * )
     */
    async queryData(flow, period, // Format: YYYY-MM (e.g., "2023-01")
    monthDetail, filters = [], details, metrics, language = "pt") {
        // Validate date format
        const dateFormatRegex = /^\d{4}-\d{2}$/;
        if (!dateFormatRegex.test(period.from) ||
            !dateFormatRegex.test(period.to)) {
            throw new Error('Period dates must be in YYYY-MM format (e.g., "2023-01")');
        }
        return this.post("/general", {
            flow,
            monthDetail,
            period,
            filters,
            details,
            metrics,
        }, { language });
    }
    /**
     * Queries municipality data
     * @param flow 'export' or 'import'
     * @param period Period object with from and to dates in YYYY-MM format (e.g., "2023-01")
     * @param monthDetail Whether to include month details in the response
     * @param filters Optional array of filters
     * @param details Array of detail fields
     * @param metrics Array of metrics to include
     * @param language Language for the response (default: 'pt')
     * @returns Query results
     */
    async queryMunicipalitiesData(flow, period, // Format: YYYY-MM (e.g., "2023-01")
    monthDetail = false, filters = [], details, metrics, language = "pt") {
        // Validate date format
        const dateFormatRegex = /^\d{4}-\d{2}$/;
        if (!dateFormatRegex.test(period.from) ||
            !dateFormatRegex.test(period.to)) {
            throw new Error('Period dates must be in YYYY-MM format (e.g., "2023-01")');
        }
        return this.post("/cities", {
            flow,
            monthDetail,
            period,
            filters,
            details,
            metrics,
        }, { language });
    }
    /**
     * Queries historical data (1989-1996)
     * @param flow 'export' or 'import'
     * @param period Period object with from and to dates in YYYY-MM format (e.g., "2023-01")
     * @param monthDetail Whether to include month details in the response
     * @param filters Optional array of filters
     * @param details Array of detail fields
     * @param metrics Array of metrics to include
     * @param language Language for the response (default: 'pt')
     * @returns Query results
     */
    async queryHistoricalData(flow, period, // Format: YYYY-MM (e.g., "2023-01")
    monthDetail = false, filters = [], details, metrics, language = "pt") {
        // Validate date format
        const dateFormatRegex = /^\d{4}-\d{2}$/;
        if (!dateFormatRegex.test(period.from) ||
            !dateFormatRegex.test(period.to)) {
            throw new Error('Period dates must be in YYYY-MM format (e.g., "2023-01")');
        }
        return this.post("/historical-data", {
            flow,
            monthDetail,
            period,
            filters,
            details,
            metrics,
        }, { language });
    }
    /**
     * Gets data from an auxiliary table
     * @param table The table name
     * @param search Optional search term
     * @param page Optional page number
     * @param pageSize Optional page size
     * @returns Table data and pagination info
     * @deprecated Use specific table methods instead
     */
    async getAuxiliaryTable(table, search, page = 1, pageSize = 100) {
        return this.get(`/auxiliary/${table}`, { search, page, pageSize });
    }
    /**
     * Gets list of Brazilian states (UF)
     * @returns Array of states with their codes, names and UF abbreviations
     */
    async getStates() {
        return this.get("/tables/uf");
    }
    /**
     * Gets details of a specific Brazilian state
     * @param ufId State ID (e.g., "26" for Pernambuco)
     * @returns State details including code, abbreviation, name and region
     */
    async getStateDetails(ufId) {
        return this.get(`/tables/uf/${ufId}`);
    }
    /**
     * Gets list of Brazilian cities
     * @returns Array of cities with their codes and names
     */
    async getCities() {
        return this.get("/tables/cities");
    }
    /**
     * Gets details of a specific Brazilian city
     * @param cityId City ID (e.g., "5300050")
     * @returns City details including geographic code, name, short name and state
     */
    async getCityDetails(cityId) {
        return this.get(`/tables/cities/${cityId}`);
    }
    /**
     * Gets list of countries
     * @param search Optional search term to filter countries
     * @returns Array of countries with their codes and names
     */
    async getCountries(search) {
        return this.get("/tables/countries", search ? { search } : undefined);
    }
    /**
     * Gets details of a specific country
     * @param countryId Country ID (e.g., "105" for Brazil)
     * @returns Country details including ISO codes
     */
    async getCountryDetails(countryId) {
        return this.get(`/tables/countries/${countryId}`);
    }
    /**
     * Gets list of economic blocks
     * @param options Query options
     * @param options.language Language for the response (default: 'pt')
     * @param options.add Additional data to include (e.g., 'country')
     * @param options.search Search term to filter results
     * @returns List of economic blocks with optional country information
     */
    async getEconomicBlocks(options) {
        return this.get("/tables/economic-blocks", options);
    }
    /**
     * Gets Harmonized System (HS) classifications
     * @param options Query options
     * @param options.language Language for the response (default: 'pt')
     * @param options.page Page number (default: 1)
     * @param options.perPage Items per page (default: 10)
     * @param options.add Additional data to include (e.g., 'ncm')
     * @returns List of HS classifications with pagination
     */
    async getHarmonizedSystem(options) {
        return this.get("/tables/hs", options);
    }
    /**
     * Gets NBM (Nomenclatura Brasileira de Mercadorias) data
     * @param options Query options
     * @param options.language Language for the response (default: 'pt')
     * @param options.page Page number (default: 1)
     * @param options.perPage Items per page (default: 5)
     * @param options.add Additional data to include (e.g., 'ncm')
     * @param options.search Search term to filter results
     * @returns List of NBM items with pagination
     */
    async getNBM(options) {
        return this.get("/tables/nbm", options);
    }
    /**
     * Gets details of a specific NBM code
     * @param coNbm NBM code (e.g., "2924101100")
     * @returns NBM details including code and description
     */
    async getNBMDetails(coNbm) {
        return this.get(`/tables/nbm/${coNbm}`);
    }
}
exports.ComexstatClient = ComexstatClient;
exports.default = ComexstatClient;
