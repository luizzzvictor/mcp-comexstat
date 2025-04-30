import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import ComexstatClient from "./ComexstatClient";

/**
 * MCP Server for Comexstat API
 * Provides tools for accessing Brazilian foreign trade statistics
 */
export class ComexstatMCP {
  private server: McpServer;
  private client: ComexstatClient;

  constructor(options: { version: string; description?: string }) {
    this.server = new McpServer({
      name: "comexstat",
      version: options.version,
      description: options.description || "MCP server for Comexstat API",
    });

    this.client = new ComexstatClient();
    this.setupTools();
  }

  private setupTools() {
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
    this.server.tool(
      "getFilterValues",
      {
        filter: z.string(),
        language: z.string().optional(),
      },
      async ({ filter, language }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.getFilterValues(filter, language)
            ),
          },
        ],
      })
    );

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
    this.server.tool(
      "queryData",
      {
        flow: z.enum(["export", "import"]),
        monthDetail: z.boolean(),
        period: z.object({
          from: z
            .string()
            .regex(
              /^\d{4}-\d{2}$/,
              "Must be in YYYY-MM format (e.g., '2023-01')"
            ),
          to: z
            .string()
            .regex(
              /^\d{4}-\d{2}$/,
              "Must be in YYYY-MM format (e.g., '2023-01')"
            ),
        }),
        filters: z
          .array(
            z.object({
              filter: z.enum([
                "country",
                "state",
                "economicBlock",
                "section",
                "chapter",
                "position",
                "subposition",
                "ncm",
              ]),
              values: z.array(z.number()),
            })
          )
          .optional(),
        details: z.array(
          z.enum([
            "country",
            "state",
            "economicBlock",
            "section",
            "chapter",
            "position",
            "subposition",
            "ncm",
          ])
        ),
        metrics: z.array(
          z.enum([
            "metricFOB",
            "metricKG",
            "metricStatistic",
            "metricFreight",
            "metricInsurance",
            "metricCIF",
          ])
        ),
        language: z.string().optional().default("pt"),
      },
      async ({
        flow,
        period,
        monthDetail,
        filters,
        details,
        metrics,
        language,
      }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.queryData(
                flow,
                period,
                monthDetail,
                filters || [],
                details,
                metrics,
                language
              )
            ),
          },
        ],
      })
    );

    // Query municipalities data
    this.server.tool(
      "queryMunicipalitiesData",
      {
        flow: z.enum(["export", "import"]),
        period: z.object({
          from: z
            .string()
            .regex(
              /^\d{4}-\d{2}$/,
              "Must be in YYYY-MM format (e.g., '2023-01')"
            ),
          to: z
            .string()
            .regex(
              /^\d{4}-\d{2}$/,
              "Must be in YYYY-MM format (e.g., '2023-01')"
            ),
        }),
        monthDetail: z.boolean().optional().default(false),
        filters: z
          .array(
            z.object({
              filter: z.string(),
              values: z.array(z.number()),
            })
          )
          .optional(),
        details: z.array(z.string()),
        metrics: z.array(z.string()),
        language: z.string().optional().default("pt"),
      },
      async ({
        flow,
        period,
        monthDetail,
        filters,
        details,
        metrics,
        language,
      }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.queryMunicipalitiesData(
                flow,
                period,
                monthDetail,
                filters || [],
                details,
                metrics,
                language
              )
            ),
          },
        ],
      })
    );

    // Query historical data
    this.server.tool(
      "queryHistoricalData",
      {
        flow: z.enum(["export", "import"]),
        period: z.object({
          from: z
            .string()
            .regex(
              /^\d{4}-\d{2}$/,
              "Must be in YYYY-MM format (e.g., '2023-01')"
            ),
          to: z
            .string()
            .regex(
              /^\d{4}-\d{2}$/,
              "Must be in YYYY-MM format (e.g., '2023-01')"
            ),
        }),
        monthDetail: z.boolean().optional().default(false),
        filters: z
          .array(
            z.object({
              filter: z.string(),
              values: z.array(z.number()).or(z.array(z.string())),
            })
          )
          .optional(),
        details: z.array(z.string()),
        metrics: z.array(z.string()),
        language: z.string().optional().default("pt"),
      },
      async ({
        flow,
        period,
        monthDetail,
        filters,
        details,
        metrics,
        language,
      }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.queryHistoricalData(
                flow,
                period,
                monthDetail,
                filters || [],
                details,
                metrics,
                language
              )
            ),
          },
        ],
      })
    );

    // Get auxiliary table data
    this.server.tool(
      "getAuxiliaryTable",
      {
        table: z.string(),
        search: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      },
      async ({ table, search, page, pageSize }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.getAuxiliaryTable(table, search, page, pageSize)
            ),
          },
        ],
      })
    );

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
    this.server.tool(
      "getStateDetails",
      {
        ufId: z.string(),
      },
      async ({ ufId }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(await this.client.getStateDetails(ufId)),
          },
        ],
      })
    );

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
    this.server.tool(
      "getCityDetails",
      {
        cityId: z.string(),
      },
      async ({ cityId }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(await this.client.getCityDetails(cityId)),
          },
        ],
      })
    );

    // Get countries list
    this.server.tool(
      "getCountries",
      {
        search: z.string().optional(),
      },
      async ({ search }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(await this.client.getCountries(search)),
          },
        ],
      })
    );

    // Get country details
    this.server.tool(
      "getCountryDetails",
      {
        countryId: z.string(),
      },
      async ({ countryId }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.getCountryDetails(countryId)
            ),
          },
        ],
      })
    );

    // Get economic blocks
    this.server.tool(
      "getEconomicBlocks",
      {
        language: z.string().optional().default("pt"),
        add: z.string().optional(),
        search: z.string().optional(),
      },
      async ({ language, add, search }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.getEconomicBlocks({ language, add, search })
            ),
          },
        ],
      })
    );

    // Get Harmonized System classifications
    this.server.tool(
      "getHarmonizedSystem",
      {
        language: z.string().optional().default("pt"),
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(10),
        add: z.string().optional(),
      },
      async ({ language, page, perPage, add }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.getHarmonizedSystem({
                language,
                page,
                perPage,
                add,
              })
            ),
          },
        ],
      })
    );

    // Get NBM (Nomenclatura Brasileira de Mercadorias) data
    this.server.tool(
      "getNBM",
      {
        language: z.string().optional().default("pt"),
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(5),
        add: z.string().optional(),
        search: z.string().optional(),
      },
      async ({ language, page, perPage, add, search }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await this.client.getNBM({ language, page, perPage, add, search })
            ),
          },
        ],
      })
    );

    // Get NBM details
    this.server.tool(
      "getNBMDetails",
      {
        coNbm: z.string(),
      },
      async ({ coNbm }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(await this.client.getNBMDetails(coNbm)),
          },
        ],
      })
    );
  }

  /**
   * Starts the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
