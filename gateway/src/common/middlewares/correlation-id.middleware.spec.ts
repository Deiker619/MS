import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { Request, Response, NextFunction } from 'express';
import { HTTP_HEADERS } from '../constants/headers.constants';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('should generate new correlation-id and request-id if not provided', () => {
    const req: any = { headers: {} };
    const setHeaderMock = jest.fn();
    const res: any = { setHeader: setHeaderMock };
    const nextMock: NextFunction = jest.fn();

    middleware.use(req as Request, res as Response, nextMock);

    expect(req.headers[HTTP_HEADERS.CORRELATION_ID]).toBeDefined();
    expect(req.headers[HTTP_HEADERS.REQUEST_ID]).toBeDefined();
    expect(setHeaderMock).toHaveBeenCalledWith(
      HTTP_HEADERS.CORRELATION_ID,
      req.headers[HTTP_HEADERS.CORRELATION_ID],
    );
    expect(setHeaderMock).toHaveBeenCalledWith(
      HTTP_HEADERS.REQUEST_ID,
      req.headers[HTTP_HEADERS.REQUEST_ID],
    );
    expect(nextMock).toHaveBeenCalled();
  });

  it('should preserve existing correlation-id if passed in request header', () => {
    const existingCorrelationId = 'test-correlation-123';
    const req: any = { headers: { [HTTP_HEADERS.CORRELATION_ID]: existingCorrelationId } };
    const setHeaderMock = jest.fn();
    const res: any = { setHeader: setHeaderMock };
    const nextMock: NextFunction = jest.fn();

    middleware.use(req as Request, res as Response, nextMock);

    expect(req.headers[HTTP_HEADERS.CORRELATION_ID]).toBe(existingCorrelationId);
    expect(setHeaderMock).toHaveBeenCalledWith(
      HTTP_HEADERS.CORRELATION_ID,
      existingCorrelationId,
    );
  });
});
