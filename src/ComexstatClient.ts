import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import https from "https";

interface CustomAxiosError extends AxiosError {
  apiError?: {
    status?: number;
    message?: string;
    endpoint?: string;
  };
}

interface ComexstatErrorResponse {
  message: string;
  [key: string]: any;
}

/**
 * Client for interacting with the Comexstat API
 */
export class ComexstatClient {
  private client: AxiosInstance;
  private baseUrl: string;

  /**
   * Creates a new ComexstatClient
   * @param baseUrl The base URL for the Comexstat API
   */
  constructor(baseUrl: string = "https://api-comexstat.mdic.gov.br") {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      httpsAgent: new https.Agent({
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
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }

      const response = await this.client.get<T>(endpoint, config);
      return response.data;
    } catch (error) {
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
  async post<T>(
    endpoint: string,
    data: any,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }
      const response = await this.client.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handles API errors
   * @param error The error object
   */
  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as CustomAxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as ComexstatErrorResponse;
      const message = data?.message || axiosError.message;

      console.error(`API Error (${status}): ${message}`);

      // Enhance error with additional information
      axiosError.apiError = {
        status,
        message,
        endpoint: axiosError.config?.url,
      };
    } else {
      console.error("Non-Axios error:", error);
    }
  }

  // API-specific methods

  /**
   * Gets the last update date of the Comexstat data
   * @returns The last update date
   */
  async getLastUpdate(): Promise<string> {
    const response = await this.get<{
      data: {
        updated: string;
        year: string;
        monthNumber: string;
      };
      success: boolean;
      message: string | null;
      processo_info: any;
      language: string;
    }>("/general/dates/updated");
    return response.data.updated;
  }

  /**
   * Gets available years for queries
   * @returns Object with min and max years
   */
  async getAvailableYears(): Promise<{ min: string; max: string }> {
    const response = await this.get<{
      data: { min: string; max: string };
      success: boolean;
      message: string | null;
      processo_info: any;
      language: string;
    }>("/general/dates/years");
    return response.data;
  }

  /**
   * Gets available filters for queries
   * @param language Language for the response (default: 'pt')
   * @returns Array of filter objects with filter name and description
   */
  async getAvailableFilters(
    language: string = "pt"
  ): Promise<Array<{ filter: string; text: string }>> {
    const response = await this.get<{
      data: {
        "0": string;
        list: Array<{
          filter: string;
          text: string;
        }>;
      };
      success: boolean;
      message: string | null;
      processo_info: any;
      language: string;
    }>("/general/filters", { language });
    return response.data.list;
  }

  /**
   * Gets values for a specific filter
   * @param filter The filter name (e.g., 'country', 'economicBlock', 'section', 'ncm')
   * @param language Language for the response (default: 'pt')
   * @returns Array of filter values with id and text
   */
  async getFilterValues(
    filter: string,
    language: string = "pt"
  ): Promise<Array<{ id: string; text: string }>> {
    const response = await this.get<{
      data: Array<Array<{ id: string; text: string }>>;
      success: boolean;
      message: string | null;
      processo_info: any;
      language: string;
    }>(`/general/filters/${filter}`, { language });

    // The API returns an array of arrays, but we only need the first array
    return response.data[0];
  }

  /**
   * Gets available fields for detailing/grouping
   * @param language Language for the response (default: 'pt')
   * @returns Array of field objects with filter and text properties
   */
  async getAvailableFields(
    language: string = "pt"
  ): Promise<Array<{ filter: string; text: string }>> {
    const response = await this.get<{
      data: {
        "0": string;
        list: Array<{ filter: string; text: string }>;
      };
      success: boolean;
      message: string | null;
      processo_info: any;
      language: string;
    }>("/general/details", { language });
    return response.data.list;
  }

  /**
   * Gets available metrics for queries
   * @param language Language for the response (default: 'pt')
   * @returns Array of metric objects with id, text, and dependencies
   */
  async getAvailableMetrics(language: string = "pt"): Promise<
    Array<{
      id: string;
      text: string;
      depends: null | { filter?: string; flow?: "import" };
    }>
  > {
    const response = await this.get<{
      data: {
        list: Array<{
          id: string;
          text: string;
          depends: null | { filter?: string; flow?: "import" };
        }>;
      };
      success: boolean;
      message: string | null;
      processo_info: any;
      language: string;
    }>("/general/metrics", { language });
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
  async queryData(
    flow: "export" | "import",
    period: { from: string; to: string }, // Format: YYYY-MM (e.g., "2023-01")
    monthDetail: boolean,
    filters: Array<{
      filter:
        | "country"
        | "state"
        | "economicBlock"
        | "section"
        | "chapter"
        | "position"
        | "subposition"
        | "ncm";
      values: number[];
    }> = [],
    details: Array<
      | "country"
      | "state"
      | "economicBlock"
      | "section"
      | "chapter"
      | "position"
      | "subposition"
      | "ncm"
    >,
    metrics: Array<
      | "metricFOB"
      | "metricKG"
      | "metricStatistic"
      | "metricFreight"
      | "metricInsurance"
      | "metricCIF"
    >,
    language: string = "pt"
  ): Promise<{
    data: {
      list: any[];
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    // Validate date format
    const dateFormatRegex = /^\d{4}-\d{2}$/;
    if (
      !dateFormatRegex.test(period.from) ||
      !dateFormatRegex.test(period.to)
    ) {
      throw new Error(
        'Period dates must be in YYYY-MM format (e.g., "2023-01")'
      );
    }

    return this.post(
      "/general",
      {
        flow,
        monthDetail,
        period,
        filters,
        details,
        metrics,
      },
      { language }
    );
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
  async queryMunicipalitiesData(
    flow: "export" | "import",
    period: { from: string; to: string }, // Format: YYYY-MM (e.g., "2023-01")
    monthDetail: boolean = false,
    filters: Array<{ filter: string; values: number[] }> = [],
    details: string[],
    metrics: string[],
    language: string = "pt"
  ): Promise<{
    data: {
      list: any[];
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    // Validate date format
    const dateFormatRegex = /^\d{4}-\d{2}$/;
    if (
      !dateFormatRegex.test(period.from) ||
      !dateFormatRegex.test(period.to)
    ) {
      throw new Error(
        'Period dates must be in YYYY-MM format (e.g., "2023-01")'
      );
    }

    return this.post(
      "/cities",
      {
        flow,
        monthDetail,
        period,
        filters,
        details,
        metrics,
      },
      { language }
    );
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
  async queryHistoricalData(
    flow: "export" | "import",
    period: { from: string; to: string }, // Format: YYYY-MM (e.g., "2023-01")
    monthDetail: boolean = false,
    filters: Array<{ filter: string; values: number[] | string[] }> = [],
    details: string[],
    metrics: string[],
    language: string = "pt"
  ): Promise<{
    data: Array<{
      year: number;
      monthNumber?: number;
      metricFOB: string;
      metricKG: string;
      [key: string]: any;
    }>;
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    // Validate date format
    const dateFormatRegex = /^\d{4}-\d{2}$/;
    if (
      !dateFormatRegex.test(period.from) ||
      !dateFormatRegex.test(period.to)
    ) {
      throw new Error(
        'Period dates must be in YYYY-MM format (e.g., "2023-01")'
      );
    }

    return this.post(
      "/historical-data",
      {
        flow,
        monthDetail,
        period,
        filters,
        details,
        metrics,
      },
      { language }
    );
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
  async getAuxiliaryTable(
    table: string,
    search?: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      pages: number;
    };
  }> {
    return this.get(`/auxiliary/${table}`, { search, page, pageSize });
  }

  /**
   * Gets list of Brazilian states (UF)
   * @returns Array of states with their codes, names and UF abbreviations
   */
  async getStates(): Promise<{
    data: Array<{
      text: string;
      id: string;
      uf: string;
    }>;
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    return this.get("/tables/uf");
  }

  /**
   * Gets details of a specific Brazilian state
   * @param ufId State ID (e.g., "26" for Pernambuco)
   * @returns State details including code, abbreviation, name and region
   */
  async getStateDetails(ufId: string): Promise<{
    data: {
      coUf: string; // State code
      sgUf: string; // State abbreviation
      noUf: string; // State name
      noRegiao: string; // Region name
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    return this.get(`/tables/uf/${ufId}`);
  }

  /**
   * Gets list of Brazilian cities
   * @returns Array of cities with their codes and names
   */
  async getCities(): Promise<{
    data: Array<{
      id: string;
      text: string;
      noMunMin: string;
    }>;
  }> {
    return this.get("/tables/cities");
  }

  /**
   * Gets details of a specific Brazilian city
   * @param cityId City ID (e.g., "5300050")
   * @returns City details including geographic code, name, short name and state
   */
  async getCityDetails(cityId: string): Promise<{
    data: {
      coMunGeo: string; // Geographic municipality code
      noMun: string; // Municipality name
      noMunMin: string; // Short municipality name
      sgUf: string; // State abbreviation
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    return this.get(`/tables/cities/${cityId}`);
  }

  /**
   * Gets list of countries
   * @param search Optional search term to filter countries
   * @returns Array of countries with their codes and names
   */
  async getCountries(search?: string): Promise<{
    data: {
      list: Array<{
        id: string;
        text: string;
      }>;
    };
  }> {
    return this.get("/tables/countries", search ? { search } : undefined);
  }

  /**
   * Gets details of a specific country
   * @param countryId Country ID (e.g., "105" for Brazil)
   * @returns Country details including ISO codes
   */
  async getCountryDetails(countryId: string): Promise<{
    data: {
      id: string;
      country: string;
      coPaisIson3: string; // ISO numeric code
      coPaisIsoa3: string; // ISO alpha-3 code
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
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
  async getEconomicBlocks(options?: {
    language?: string;
    add?: string;
    search?: string;
  }): Promise<{
    data: {
      list: Array<{
        economicBlock: string;
        country?: string;
        coBlock: string;
        coCountry?: string;
      }>;
      count: number;
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
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
  async getHarmonizedSystem(options?: {
    language?: string;
    page?: number;
    perPage?: number;
    add?: string;
  }): Promise<{
    data: {
      list: Array<{
        noNCM: string; // NCM description
        unit: string; // Measurement unit
        subHeadingCode: string; // HS subheading code
        subHeading: string; // HS subheading description
        headingCode: string; // HS heading code
        heading: string; // HS heading description
        chapterCode: string; // HS chapter code
        chapter: string; // HS chapter description
        coNcm: string; // NCM code
      }>;
      count: number; // Total number of records
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
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
  async getNBM(options?: {
    language?: string;
    page?: number;
    perPage?: number;
    add?: string;
    search?: string;
  }): Promise<{
    data: {
      list: Array<{
        noNCM: string; // NCM description
        unit: string; // Measurement unit
        nbm: string; // NBM description
        coNbm: string; // NBM code
        coNcm: string; // NCM code
      }>;
      count: number; // Total number of records
    };
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    return this.get("/tables/nbm", options);
  }

  /**
   * Gets details of a specific NBM code
   * @param coNbm NBM code (e.g., "2924101100")
   * @returns NBM details including code and description
   */
  async getNBMDetails(coNbm: string): Promise<{
    data: Array<{
      coNBM: string; // NBM code
      noNBM: string; // NBM description
    }>;
    success: boolean;
    message: string | null;
    processo_info: any;
    language: string;
  }> {
    return this.get(`/tables/nbm/${coNbm}`);
  }
}

export default ComexstatClient;
