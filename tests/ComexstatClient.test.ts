import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import ComexstatClient from '../src/ComexstatClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ComexstatClient', () => {
  let client: ComexstatClient;
  
  beforeEach(() => {
    client = new ComexstatClient();
    mockedAxios.create.mockReturnValue(mockedAxios as any);
    jest.clearAllMocks();
  });

  test('getLastUpdate should return the last update date', async () => {
    const mockResponse = { data: { lastUpdate: '2023-04-15' } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await client.getLastUpdate();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/general/last-update', expect.any(Object));
    expect(result).toBe('2023-04-15');
  });

  test('getAvailableYears should return array of years', async () => {
    const mockResponse = { data: { years: [2020, 2021, 2022, 2023] } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await client.getAvailableYears();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/general/available-years', expect.any(Object));
    expect(result).toEqual([2020, 2021, 2022, 2023]);
  });

  test('queryData should make a POST request with correct parameters', async () => {
    const mockResponse = { 
      data: { 
        data: [{ country: 'USA', value: 1000 }],
        pagination: { total: 1, page: 1, pageSize: 10, pages: 1 }
      } 
    };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const params = {
      flow: 'export' as const,
      period: { from: '2023-01', to: '2023-12' },
      filters: [{ filter: 'country', values: [105] }],
      details: ['country'],
      metrics: ['metricFOB']
    };

    const result = await client.queryData(
      params.flow,
      params.period,
      params.filters,
      params.details,
      params.metrics
    );
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/general/query', {
      flow: 'export',
      period: { from: '2023-01', to: '2023-12' },
      filters: [{ filter: 'country', values: [105] }],
      details: ['country'],
      metrics: ['metricFOB']
    });
    
    expect(result.data).toEqual([{ country: 'USA', value: 1000 }]);
    expect(result.pagination).toEqual({ total: 1, page: 1, pageSize: 10, pages: 1 });
  });

  test('should handle API errors properly', async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: { message: 'Invalid parameters' }
      },
      config: { url: '/general/query' },
      message: 'Request failed with status code 400'
    };
    
    mockedAxios.post.mockRejectedValueOnce(errorResponse);
    
    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await expect(client.queryData(
      'export',
      { from: '2023-01', to: '2023-12' },
      [{ filter: 'invalid', values: [999] }],
      ['country'],
      ['metricFOB']
    )).rejects.toThrow();
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
