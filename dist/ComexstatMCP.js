"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComexstatMCP = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const ComexstatClient_1 = __importDefault(require("./ComexstatClient"));
/**
 * MCP Server for Comexstat API
 * Provides tools for accessing Brazilian foreign trade statistics
 */
class ComexstatMCP {
    constructor(options) {
        this.server = new mcp_js_1.McpServer({
            name: "comexstat",
            version: options.version,
            description: options.description || "MCP server for Comexstat API",
        });
        this.client = new ComexstatClient_1.default();
        this.setupTools();
    }
    setupTools() {
        // Get last update date
        this.server.tool("getLastUpdate", {}, async () => ({
            content: [{ type: "text", text: await this.client.getLastUpdate() }],
        }));
        // Get available years
        this.server.tool("getAvailableYears", {}, async () => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getAvailableYears()),
                },
            ],
        }));
        // Get available filters
        this.server.tool("getAvailableFilters", {}, async () => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getAvailableFilters()),
                },
            ],
        }));
        // Get filter values
        this.server.tool("getFilterValues", {
            filter: zod_1.z.string(),
            language: zod_1.z.string().optional(),
        }, async ({ filter, language }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getFilterValues(filter, language)),
                },
            ],
        }));
        // Get available fields
        this.server.tool("getAvailableFields", {}, async () => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getAvailableFields()),
                },
            ],
        }));
        // Get available metrics
        this.server.tool("getAvailableMetrics", {}, async () => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getAvailableMetrics()),
                },
            ],
        }));
        // Query data
        this.server.tool("queryData", {
            flow: zod_1.z.enum(["export", "import"]),
            monthDetail: zod_1.z.boolean(),
            period: zod_1.z.object({
                from: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format (e.g., '2023-01')"),
                to: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format (e.g., '2023-01')"),
            }),
            filters: zod_1.z
                .array(zod_1.z.object({
                filter: zod_1.z.enum([
                    "country",
                    "state",
                    "economicBlock",
                    "section",
                    "chapter",
                    "position",
                    "subposition",
                    "ncm",
                ]),
                values: zod_1.z.array(zod_1.z.number()),
            }))
                .optional(),
            details: zod_1.z.array(zod_1.z.enum([
                "country",
                "state",
                "economicBlock",
                "section",
                "chapter",
                "position",
                "subposition",
                "ncm",
            ])),
            metrics: zod_1.z.array(zod_1.z.enum([
                "metricFOB",
                "metricKG",
                "metricStatistic",
                "metricFreight",
                "metricInsurance",
                "metricCIF",
            ])),
            language: zod_1.z.string().optional().default("pt"),
        }, async ({ flow, period, monthDetail, filters, details, metrics, language, }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.queryData(flow, period, monthDetail, filters || [], details, metrics, language)),
                },
            ],
        }));
        // Query municipalities data
        this.server.tool("queryMunicipalitiesData", {
            flow: zod_1.z.enum(["export", "import"]),
            period: zod_1.z.object({
                from: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format (e.g., '2023-01')"),
                to: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format (e.g., '2023-01')"),
            }),
            monthDetail: zod_1.z.boolean().optional().default(false),
            filters: zod_1.z
                .array(zod_1.z.object({
                filter: zod_1.z.string(),
                values: zod_1.z.array(zod_1.z.number()),
            }))
                .optional(),
            details: zod_1.z.array(zod_1.z.string()),
            metrics: zod_1.z.array(zod_1.z.string()),
            language: zod_1.z.string().optional().default("pt"),
        }, async ({ flow, period, monthDetail, filters, details, metrics, language, }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.queryMunicipalitiesData(flow, period, monthDetail, filters || [], details, metrics, language)),
                },
            ],
        }));
        // Query historical data
        this.server.tool("queryHistoricalData", {
            flow: zod_1.z.enum(["export", "import"]),
            period: zod_1.z.object({
                from: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format (e.g., '2023-01')"),
                to: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format (e.g., '2023-01')"),
            }),
            monthDetail: zod_1.z.boolean().optional().default(false),
            filters: zod_1.z
                .array(zod_1.z.object({
                filter: zod_1.z.string(),
                values: zod_1.z.array(zod_1.z.number()).or(zod_1.z.array(zod_1.z.string())),
            }))
                .optional(),
            details: zod_1.z.array(zod_1.z.string()),
            metrics: zod_1.z.array(zod_1.z.string()),
            language: zod_1.z.string().optional().default("pt"),
        }, async ({ flow, period, monthDetail, filters, details, metrics, language, }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.queryHistoricalData(flow, period, monthDetail, filters || [], details, metrics, language)),
                },
            ],
        }));
        // Get auxiliary table data
        this.server.tool("getAuxiliaryTable", {
            table: zod_1.z.string(),
            search: zod_1.z.string().optional(),
            page: zod_1.z.number().optional(),
            pageSize: zod_1.z.number().optional(),
        }, async ({ table, search, page, pageSize }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getAuxiliaryTable(table, search, page, pageSize)),
                },
            ],
        }));
        // Get states (UF) list
        this.server.tool("getStates", {}, async () => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getStates()),
                },
            ],
        }));
        // Get state details
        this.server.tool("getStateDetails", {
            ufId: zod_1.z.string(),
        }, async ({ ufId }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getStateDetails(ufId)),
                },
            ],
        }));
        // Get cities list
        this.server.tool("getCities", {}, async () => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getCities()),
                },
            ],
        }));
        // Get city details
        this.server.tool("getCityDetails", {
            cityId: zod_1.z.string(),
        }, async ({ cityId }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getCityDetails(cityId)),
                },
            ],
        }));
        // Get countries list
        this.server.tool("getCountries", {
            search: zod_1.z.string().optional(),
        }, async ({ search }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getCountries(search)),
                },
            ],
        }));
        // Get country details
        this.server.tool("getCountryDetails", {
            countryId: zod_1.z.string(),
        }, async ({ countryId }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getCountryDetails(countryId)),
                },
            ],
        }));
        // Get economic blocks
        this.server.tool("getEconomicBlocks", {
            language: zod_1.z.string().optional().default("pt"),
            add: zod_1.z.string().optional(),
            search: zod_1.z.string().optional(),
        }, async ({ language, add, search }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getEconomicBlocks({ language, add, search })),
                },
            ],
        }));
        // Get Harmonized System classifications
        this.server.tool("getHarmonizedSystem", {
            language: zod_1.z.string().optional().default("pt"),
            page: zod_1.z.number().optional().default(1),
            perPage: zod_1.z.number().optional().default(10),
            add: zod_1.z.string().optional(),
        }, async ({ language, page, perPage, add }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getHarmonizedSystem({
                        language,
                        page,
                        perPage,
                        add,
                    })),
                },
            ],
        }));
        // Get NBM (Nomenclatura Brasileira de Mercadorias) data
        this.server.tool("getNBM", {
            language: zod_1.z.string().optional().default("pt"),
            page: zod_1.z.number().optional().default(1),
            perPage: zod_1.z.number().optional().default(5),
            add: zod_1.z.string().optional(),
            search: zod_1.z.string().optional(),
        }, async ({ language, page, perPage, add, search }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getNBM({ language, page, perPage, add, search })),
                },
            ],
        }));
        // Get NBM details
        this.server.tool("getNBMDetails", {
            coNbm: zod_1.z.string(),
        }, async ({ coNbm }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await this.client.getNBMDetails(coNbm)),
                },
            ],
        }));
    }
    /**
     * Starts the MCP server
     */
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
    }
}
exports.ComexstatMCP = ComexstatMCP;
