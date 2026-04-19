import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockFindByUser = jest.fn();
const mockCountUnread = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockDelete = jest.fn();

jest.unstable_mockModule('../../../src/models/Notification.js', () => ({
  __esModule: true,
  default: {
    findByUser: mockFindByUser,
    countUnread: mockCountUnread,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    delete: mockDelete,
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const controller = await import('../../../src/controllers/notificationController.js');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = controller;

const createMockReq = ({ user, query, params } = {}) => ({
  user: user || { userId: 10 },
  query: query || {},
  params: params || {},
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const callHandler = async (handler, req, res, next = jest.fn()) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
  return next;
};

describe('notificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getNotifications obtiene notificaciones paginadas usando req.user.userId', async () => {
    const req = createMockReq({
      query: { page: '2', limit: '5', read: 'false' },
    });
    const res = createMockRes();

    const payload = {
      notifications: [{ notification_id: 1 }],
      pagination: { total: 1 },
    };
    mockFindByUser.mockResolvedValue(payload);

    await callHandler(getNotifications, req, res);

    expect(mockFindByUser).toHaveBeenCalledWith(10, {
      page: 2,
      limit: 5,
      read: 'false',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notificaciones obtenidas',
      data: payload,
    });
  });

  test('getUnreadCount usa fallback req.user.user_id', async () => {
    const req = createMockReq({
      user: { user_id: 44 },
    });
    const res = createMockRes();
    mockCountUnread.mockResolvedValue(7);

    await callHandler(getUnreadCount, req, res);

    expect(mockCountUnread).toHaveBeenCalledWith(44);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Conteo de notificaciones no leídas',
      data: { count: 7 },
    });
  });

  test('markAsRead responde 404 cuando la notificación no pertenece al usuario', async () => {
    const req = createMockReq({
      params: { id: '99' },
      user: { user_id: 11 },
    });
    const res = createMockRes();
    mockMarkAsRead.mockResolvedValue(null);

    await callHandler(markAsRead, req, res);

    expect(mockMarkAsRead).toHaveBeenCalledWith('99', 11);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'NOT_FOUND',
      message: 'Notificación no encontrada o no pertenece al usuario',
    });
  });

  test('markAsRead responde éxito cuando encuentra la notificación', async () => {
    const req = createMockReq({
      params: { id: '5' },
    });
    const res = createMockRes();
    const notification = { notification_id: 5, read: true };
    mockMarkAsRead.mockResolvedValue(notification);

    await callHandler(markAsRead, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notificación marcada como leída',
      data: notification,
    });
  });

  test('markAllAsRead marca todas las notificaciones', async () => {
    const req = createMockReq({
      user: { user_id: 15 },
    });
    const res = createMockRes();
    const updated = { updatedCount: 3 };
    mockMarkAllAsRead.mockResolvedValue(updated);

    await callHandler(markAllAsRead, req, res);

    expect(mockMarkAllAsRead).toHaveBeenCalledWith(15);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
      data: updated,
    });
  });

  test('deleteNotification responde 404 cuando no existe', async () => {
    const req = createMockReq({
      params: { id: '41' },
    });
    const res = createMockRes();
    mockDelete.mockResolvedValue(null);

    await callHandler(deleteNotification, req, res);

    expect(mockDelete).toHaveBeenCalledWith('41', 10);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'NOT_FOUND',
      message: 'Notificación no encontrada o no pertenece al usuario',
    });
  });

  test('deleteNotification elimina notificación existente', async () => {
    const req = createMockReq({
      params: { id: '7' },
      user: { user_id: 3 },
    });
    const res = createMockRes();
    const deleted = { notification_id: 7 };
    mockDelete.mockResolvedValue(deleted);

    await callHandler(deleteNotification, req, res);

    expect(mockDelete).toHaveBeenCalledWith('7', 3);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notificación eliminada',
      data: deleted,
    });
  });
});
