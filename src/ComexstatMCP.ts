import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { z } from "zod";
import ComexstatClient from "./ComexstatClient";

export interface ComexstatMCPOptions {
  version: string;
  description?: string;
  client?: ComexstatClient;
}

/**
 * MCP Server for Comexstat API
 * Provides tools for accessing Brazilian foreign trade statistics
 */
export class ComexstatMCP {
  private server: McpServer;
  private client: ComexstatClient;

  constructor(options: ComexstatMCPOptions) {
    this.server = new McpServer({
      name: "comexstat",
      version: options.version,
      description: options.description || "MCP server for Comexstat API",
    });

    this.client = options.client || new ComexstatClient();
    this.setupTools();
  }

  private setupTools() {
    const tool = this.server.tool.bind(this.server) as unknown as (
      name: string,
      schema: Record<string, z.ZodTypeAny>,
      handler: (arguments_: any) => any
    ) => void;

    tool("healthCheck", {}, async () => {
      const [lastUpdate, availableYears] = await Promise.all([
        this.client.getLastUpdate(),
        this.client.getAvailableYears(),
      ]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "ok",
              lastUpdate,
              availableYears,
            }),
          },
        ],
      };
    });

    // Get last update date
    tool("getLastUpdate", {}, async () => ({
      content: [{ type: "text", text: await this.client.getLastUpdate() }],
    }));

    // Get available years
    tool("getAvailableYears", {}, async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await this.client.getAvailableYears()),
        },
      ],
    }));

    // Get available filters
    tool("getAvailableFilters", {}, async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await this.client.getAvailableFilters()),
        },
      ],
    }));

    // Get filter values
    tool(
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
    tool("getAvailableFields", {}, async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await this.client.getAvailableFields()),
        },
      ],
    }));

    // Get available metrics
    tool("getAvailableMetrics", {}, async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await this.client.getAvailableMetrics()),
        },
      ],
    }));

    // Query data
    tool(
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
    tool(
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
    tool(
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
    tool(
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
    tool("getStates", {}, async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await this.client.getStates()),
        },
      ],
    }));

    // Get state details
    tool(
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
    tool("getCities", {}, async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await this.client.getCities()),
        },
      ],
    }));

    // Get city details
    tool(
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
    tool(
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
    tool(
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
    tool(
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
    tool(
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
    tool(
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
    tool(
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
    await this.connect(new StdioServerTransport());
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
