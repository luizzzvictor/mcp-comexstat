import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import mcp from '../src/ComexstatMCP';
import ComexstatClient from '../src/ComexstatClient';

// Mock the ComexstatClient
jest.mock('../src/ComexstatClient');
const MockedComexstatClient = ComexstatClient as jest.MockedClass<typeof ComexstatClient>;

describe('ComexstatMCP', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the mock implementation
    MockedComexstatClient.mockClear();
  });

  test('getLastUpdate should call client.getLastUpdate', async () => {
    // Setup mock implementation
    const mockLastUpdate = '2023-04-15';
    const mockInstance = MockedComexstatClient.mock.instances[0];
    const mockGetLastUpdate = jest.fn().mockResolvedValue(mockLastUpdate);
    
    // @ts-ignore - TypeScript doesn't know about our mock
    mockInstance.getLastUpdate = mockGetLastUpdate;

    // Call the MCP method
    const result = await mcp.getLastUpdate();
    
    // Verify the client method was called
    expect(mockGetLastUpdate).toHaveBeenCalled();
    expect(result).toBe(mockLastUpdate);
  });

  test('queryData should call client.queryData with correct parameters', async () => {
    // Setup mock implementation
    const mockResult = {
      data: [{ country: 'USA', value: 1000 }],
      pagination: { total: 1, page: 1, pageSize: 10, pages: 1 }
    };
    
    const mockInstance = MockedComexstatClient.mock.instances[0];
    const mockQueryData = jest.fn().mockResolvedValue(mockResult);
    
    // @ts-ignore - TypeScript doesn't know about our mock
    mockInstance.queryData = mockQueryData;

    // Setup parameters
    const flow = 'export' as const;
    const period = { from: '2023-01', to: '2023-12' };
    const filters = [{ filter: 'country', values: [105] }];
    const details = ['country'];
    const metrics = ['metricFOB'];

    // Create a mock context
    const mockContext = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      reportProgress: jest.fn().mockResolvedValue(undefined)
    };

    // Call the MCP method
    const result = await mcp.queryData(flow, period, filters, details, metrics, mockContext);
    
    // Verify the client method was called with correct parameters
    expect(mockQueryData).toHaveBeenCalledWith(flow, period, filters, details, metrics);
    
    // Verify context methods were called
    expect(mockContext.info).toHaveBeenCalled();
    
    // Verify the result
    expect(result).toEqual(mockResult);
  });

  test('queryData should handle errors properly', async () => {
    // Setup mock implementation to throw an error
    const mockError = new Error('API Error');
    
    const mockInstance = MockedComexstatClient.mock.instances[0];
    const mockQueryData = jest.fn().mockRejectedValue(mockError);
    
    // @ts-ignore - TypeScript doesn't know about our mock
    mockInstance.queryData = mockQueryData;

    // Setup parameters
    const flow = 'export' as const;
    const period = { from: '2023-01', to: '2023-12' };
    const filters = [{ filter: 'country', values: [105] }];
    const details = ['country'];
    const metrics = ['metricFOB'];

    // Create a mock context
    const mockContext = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      reportProgress: jest.fn().mockResolvedValue(undefined)
    };

    // Call the MCP method and expect it to throw
    await expect(mcp.queryData(flow, period, filters, details, metrics, mockContext))
      .rejects.toThrow('API Error');
    
    // Verify error was logged
    expect(mockContext.error).toHaveBeenCalledWith('Error querying data: API Error');
  });

  test('exportDataPrompt should return a properly formatted prompt', async () => {
    const period = { from: '2023-01', to: '2023-12' };
    const product = 'Coffee';
    const country = 'USA';

    const result = await mcp.exportDataPrompt(period, product, country);
    
    expect(result).toContain('Query Brazilian export data for period from 2023-01 to 2023-12');
    expect(result).toContain('focusing on product: Coffee');
    expect(result).toContain('for exports to: USA');
    expect(result).toContain('Use the queryData tool with flow=\'export\'');
  });
});
