import axios, { AxiosInstance } from "axios";
import ComexstatClient from "../src/ComexstatClient";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ComexstatClient", () => {
  const httpClient = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(httpClient as unknown as AxiosInstance);
    mockedAxios.isAxiosError.mockImplementation(
      (error: unknown) =>
        Boolean((error as { isAxiosError?: boolean })?.isAxiosError)
    );
  });

  test("uses certificate validation and identifies itself", () => {
    new ComexstatClient();

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "https://api-comexstat.mdic.gov.br",
        headers: expect.objectContaining({
          "User-Agent": "mcp-comexstat/1.1.0",
        }),
      })
    );
    expect(mockedAxios.create.mock.calls[0][0]).not.toHaveProperty(
      "httpsAgent"
    );
  });

  test("reads the current update date from the official endpoint", async () => {
    httpClient.get.mockResolvedValueOnce({
      data: {
        data: {
          updated: "2026-07-03",
          year: "2026",
          monthNumber: "6",
        },
        success: true,
      },
    });
    const client = new ComexstatClient({ minRequestIntervalMs: 0 });

    await expect(client.getLastUpdate()).resolves.toBe("2026-07-03");
    expect(httpClient.get).toHaveBeenCalledWith(
      "/general/dates/updated",
      {}
    );
  });

  test("retries throttled requests using Retry-After", async () => {
    const sleep = jest.fn(async () => undefined);
    const throttledError = {
      isAxiosError: true,
      message: "Too Many Requests",
      response: {
        status: 429,
        headers: { "retry-after": "0.01" },
        data: { message: "Rate limited" },
      },
      config: { url: "/general/dates/years" },
    };
    httpClient.get
      .mockRejectedValueOnce(throttledError)
      .mockResolvedValueOnce({
        data: {
          data: { min: "1997", max: "2026" },
          success: true,
        },
      });
    const client = new ComexstatClient({
      maxRetries: 2,
      minRequestIntervalMs: 0,
      retryBaseDelayMs: 1,
      sleep,
    });

    await expect(client.getAvailableYears()).resolves.toEqual({
      min: "1997",
      max: "2026",
    });
    expect(httpClient.get).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(10);
  });

  test("uses the wait suggested in a 429 response body", async () => {
    const sleep = jest.fn(async () => undefined);
    httpClient.get
      .mockRejectedValueOnce({
        isAxiosError: true,
        message: "Too Many Requests",
        response: {
          status: 429,
          headers: {},
          data: {
            message:
              "Você excedeu o limite de solicitações. Tente novamente em 10 segundos.",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { min: "1997", max: "2026" },
          success: true,
        },
      });
    const client = new ComexstatClient({
      maxRetries: 1,
      minRequestIntervalMs: 0,
      retryBaseDelayMs: 1,
      sleep,
    });

    await client.getAvailableYears();

    expect(sleep).toHaveBeenCalledWith(10000);
  });

  test("caches successful GET responses", async () => {
    httpClient.get.mockResolvedValue({
      data: {
        data: { list: [{ id: "676", text: "Rússia" }] },
        success: true,
      },
    });
    const client = new ComexstatClient({
      minRequestIntervalMs: 0,
      cacheTtlMs: 60000,
    });

    const first = await client.getCountries("Rússia");
    const second = await client.getCountries("Rússia");

    expect(first).toEqual(second);
    expect(httpClient.get).toHaveBeenCalledTimes(1);
  });

  test("posts a valid general trade query", async () => {
    httpClient.post.mockResolvedValueOnce({
      data: {
        data: { list: [{ country: "Rússia", metricFOB: 1000 }] },
        success: true,
      },
    });
    const client = new ComexstatClient({ minRequestIntervalMs: 0 });

    const result = await client.queryData(
      "export",
      { from: "2026-01", to: "2026-06" },
      false,
      [{ filter: "country", values: [676] }],
      ["country"],
      ["metricFOB"]
    );
    await client.queryData(
      "export",
      { from: "2026-01", to: "2026-06" },
      false,
      [{ filter: "country", values: [676] }],
      ["country"],
      ["metricFOB"]
    );

    expect(result.data.list).toHaveLength(1);
    expect(httpClient.post).toHaveBeenCalledWith(
      "/general",
      {
        flow: "export",
        monthDetail: false,
        period: { from: "2026-01", to: "2026-06" },
        filters: [{ filter: "country", values: [676] }],
        details: ["country"],
        metrics: ["metricFOB"],
      },
      { params: { language: "pt" } }
    );
    expect(httpClient.post).toHaveBeenCalledTimes(1);
  });

  test("rejects malformed periods before making a request", async () => {
    const client = new ComexstatClient({ minRequestIntervalMs: 0 });

    await expect(
      client.queryData(
        "export",
        { from: "2026", to: "2026-06" },
        false,
        [],
        ["country"],
        ["metricFOB"]
      )
    ).rejects.toThrow("YYYY-MM");
    expect(httpClient.post).not.toHaveBeenCalled();
  });
});
