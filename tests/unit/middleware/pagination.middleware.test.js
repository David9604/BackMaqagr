import { jest } from '@jest/globals';
import { paginationMiddleware } from '../../../src/middleware/pagination.middleware.js';

describe('Pagination Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            query: {},
        };
        mockRes = {};
        mockNext = jest.fn();
    });

    it('should use default values when no query params are provided', () => {
        const middleware = paginationMiddleware();
        middleware(mockReq, mockRes, mockNext);

        expect(mockReq.pagination).toBeDefined();
        expect(mockReq.pagination.page).toBe(1);
        expect(mockReq.pagination.limit).toBe(10);
        expect(mockReq.pagination.sort).toBe('id');
        expect(mockReq.pagination.order).toBe('asc');
        expect(mockReq.pagination.offset).toBe(0);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should parse valid query params correctly', () => {
        mockReq.query = {
            page: '3',
            limit: '20',
            sort: 'name',
            order: 'DESC'
        };

        const middleware = paginationMiddleware();
        middleware(mockReq, mockRes, mockNext);

        expect(mockReq.pagination.page).toBe(3);
        expect(mockReq.pagination.limit).toBe(20);
        expect(mockReq.pagination.sort).toBe('name');
        expect(mockReq.pagination.order).toBe('desc');
        expect(mockReq.pagination.offset).toBe(40); // (3 - 1) * 20
        expect(mockNext).toHaveBeenCalled();
    });

    it('should cap limit at 100', () => {
        mockReq.query = {
            limit: '150',
        };

        const middleware = paginationMiddleware();
        middleware(mockReq, mockRes, mockNext);

        expect(mockReq.pagination.limit).toBe(100);
        expect(mockReq.pagination.offset).toBe(0); // page 1, limit 100 => 0
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle invalid string input for page and limit', () => {
        mockReq.query = {
            page: 'invalid',
            limit: 'invalid'
        };

        const middleware = paginationMiddleware();
        middleware(mockReq, mockRes, mockNext);

        expect(mockReq.pagination.page).toBe(1);
        expect(mockReq.pagination.limit).toBe(10);
        expect(mockReq.pagination.offset).toBe(0);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle negative values for page and limit', () => {
        mockReq.query = {
            page: '-5',
            limit: '-10'
        };

        const middleware = paginationMiddleware();
        middleware(mockReq, mockRes, mockNext);

        expect(mockReq.pagination.page).toBe(1);
        expect(mockReq.pagination.limit).toBe(10);
        expect(mockReq.pagination.offset).toBe(0);
        expect(mockNext).toHaveBeenCalled();
    });
});
