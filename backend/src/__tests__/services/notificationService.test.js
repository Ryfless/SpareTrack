jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const notificationService = require('../../services/notificationService');

function cloneChain() {
  const methods = ['select', 'eq', 'order', 'range', 'single', 'insert', 'update', 'is'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => { jest.clearAllMocks(); supabase.from.mockImplementation(() => cloneChain()); });

describe('sendNotification', () => {
  it('inserts notification and returns data', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: { id: 'n-1' }, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await notificationService.sendNotification('u-1', 'Title', 'Message', 'info', '/link');

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(chain.insert).toHaveBeenCalledWith({ user_id: 'u-1', title: 'Title', message: 'Message', type: 'info', link: '/link' });
    expect(result).toEqual({ id: 'n-1' });
  });
});

describe('sendNotificationToRole', () => {
  it('inserts notifications for all users with role', async () => {
    const usersChain = cloneChain();
    usersChain._mockResolve = { data: [{ id: 'u-1' }, { id: 'u-2' }], error: null };

    const notifChain = cloneChain();
    notifChain._mockResolve = { data: [{ id: 'n-1' }], error: null };

    supabase.from.mockReturnValueOnce(usersChain).mockReturnValueOnce(notifChain);

    const result = await notificationService.sendNotificationToRole('branch_admin', 'Title', 'Msg');

    expect(result).toHaveLength(1);
    expect(notifChain.insert).toHaveBeenCalledWith([
      { user_id: 'u-1', title: 'Title', message: 'Msg', type: 'info', link: '' },
      { user_id: 'u-2', title: 'Title', message: 'Msg', type: 'info', link: '' },
    ]);
  });

  it('returns empty when no users match role', async () => {
    supabase.from.mockReturnValueOnce(cloneChain());
    const result = await notificationService.sendNotificationToRole('nonexistent', 'Title', 'Msg');
    expect(result).toEqual([]);
  });
});

describe('listNotifications', () => {
  it('returns paginated notifications', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'n-1' }], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await notificationService.listNotifications('u-1', 1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

describe('markAsRead', () => {
  it('updates notification to read', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: { id: 'n-1', is_read: true }, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await notificationService.markAsRead('n-1', 'u-1');

    expect(chain.update).toHaveBeenCalledWith({ is_read: true });
    expect(result.is_read).toBe(true);
  });
});
