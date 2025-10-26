import 'jest';

import { findAllData } from '@/utils/pagination';
import { omitField } from '@/utils/common';

// Mock the common utility
jest.mock('@/utils/common', () => ({
  omitField: jest.fn(),
}));

describe('Pagination Utils', () => {
  let mockModel: any;
  let mockOmitField: jest.MockedFunction<typeof omitField>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock model with findAndCountAll method
    mockModel = {
      findAndCountAll: jest.fn(),
    };

    // Get the mocked omitField function
    mockOmitField = omitField as jest.MockedFunction<typeof omitField>;
  });

  describe('findAllData', () => {
    it('Should return formatted data with pagination metadata', async () => {
      const mockRows = [
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' },
      ];
      const mockCount = 2;

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockImplementation((obj: any, field) => {
        if (field === 'email') {
          const { email, ...rest } = obj;
          return rest;
        }
        return obj;
      });

      const result = await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'ASC'],
        fieldOmit: 'email',
      });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
        raw: true,
      });

      expect(result).toEqual({
        data: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
        meta: {
          pagination: {
            limit: 10,
            offset: 0,
            total: 2,
          },
        },
      });

      expect(mockOmitField).toHaveBeenCalledTimes(2);
      expect(mockOmitField).toHaveBeenCalledWith(mockRows[0], 'email');
      expect(mockOmitField).toHaveBeenCalledWith(mockRows[1], 'email');
    });

    it('Should handle empty result set', async () => {
      mockModel.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });

      const result = await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'ASC'],
      });

      expect(result).toEqual({
        data: [],
        meta: {
          pagination: {
            limit: 10,
            offset: 0,
            total: 0,
          },
        },
      });

      expect(mockOmitField).not.toHaveBeenCalled();
    });

    it('Should handle where clause', async () => {
      const mockRows = [{ id: 1, name: 'Active User', status: 'active' }];
      const mockCount = 1;
      const whereClause = { status: 'active' };

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockReturnValue(mockRows[0]);

      const result = await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['name', 'ASC'],
        where: whereClause,
      });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
        where: whereClause,
        limit: 10,
        offset: 0,
        order: [['name', 'ASC']],
        raw: true,
      });

      expect(result.data).toEqual(mockRows);
      expect(result.meta.pagination.total).toBe(1);
    });

    it('Should handle different order formats', async () => {
      const mockRows = [{ id: 1, name: 'User' }];
      const mockCount = 1;

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockReturnValue(mockRows[0]);

      // Test with array order
      await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'DESC'],
      });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 10,
        offset: 0,
        order: [['id', 'DESC']],
        raw: true,
      });
    });

    it('Should handle field omission correctly', async () => {
      const mockRows = [
        {
          id: 1,
          name: 'User 1',
          password: 'hash123',
          email: 'user1@example.com',
        },
        {
          id: 2,
          name: 'User 2',
          password: 'hash456',
          email: 'user2@example.com',
        },
      ];
      const mockCount = 2;

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      // Mock omitField to remove password field
      mockOmitField.mockImplementation((obj: any, field) => {
        if (field === 'password') {
          const { password, ...rest } = obj;
          return rest;
        }
        return obj;
      });

      const result = await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'ASC'],
        fieldOmit: 'password',
      });

      expect(result.data).toEqual([
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' },
      ]);

      expect(mockOmitField).toHaveBeenCalledWith(mockRows[0], 'password');
      expect(mockOmitField).toHaveBeenCalledWith(mockRows[1], 'password');
    });

    it('Should handle no field omission when fieldOmit is empty', async () => {
      const mockRows = [{ id: 1, name: 'User 1', email: 'user1@example.com' }];
      const mockCount = 1;

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockReturnValue(mockRows[0]);

      const result = await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'ASC'],
        fieldOmit: '',
      });

      expect(result.data).toEqual(mockRows);
      expect(mockOmitField).toHaveBeenCalledWith(mockRows[0], '');
    });

    it('Should handle large pagination values', async () => {
      const mockRows = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
      }));
      const mockCount = 1000;

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockImplementation((obj: any) => obj);

      const result = await findAllData({
        model: mockModel,
        offset: 900,
        limit: 100,
        order: ['id', 'ASC'],
      });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 100,
        offset: 900,
        order: [['id', 'ASC']],
        raw: true,
      });

      expect(result.meta.pagination).toEqual({
        limit: 100,
        offset: 900,
        total: 1000,
      });
    });

    it('Should handle model errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      mockModel.findAndCountAll.mockRejectedValue(mockError);

      await expect(
        findAllData({
          model: mockModel,
          offset: 0,
          limit: 10,
          order: ['id', 'ASC'],
        })
      ).rejects.toThrow('Database connection failed');

      expect(mockModel.findAndCountAll).toHaveBeenCalled();
    });

    it('Should handle complex where clauses', async () => {
      const mockRows = [{ id: 1, name: 'Admin User', role: 'admin' }];
      const mockCount = 1;
      const complexWhere = {
        role: 'admin',
        status: 'active',
        createdAt: {
          [Symbol.for('gte')]: new Date('2023-01-01'),
        },
      };

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockReturnValue(mockRows[0]);

      await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'ASC'],
        where: complexWhere,
      });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
        where: complexWhere,
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
        raw: true,
      });
    });

    it('Should preserve raw data when raw is true', async () => {
      const mockRows = [{ id: 1, name: 'User' }];
      const mockCount = 1;

      mockModel.findAndCountAll.mockResolvedValue({
        rows: mockRows,
        count: mockCount,
      });

      mockOmitField.mockReturnValue(mockRows[0]);

      await findAllData({
        model: mockModel,
        offset: 0,
        limit: 10,
        order: ['id', 'ASC'],
      });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
        raw: true,
      });
    });
  });
});
