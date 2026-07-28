const { supabaseAdmin: supabase } = require('../config/supabase');

async function sendNotification(userId, title, message, type = 'info', link = '') {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type, link })
    .select()
    .single();

  if (error) console.error('[Notification] insert error:', error.message);
  return data;
}

async function sendNotificationToRole(role, title, message, type = 'info', link = '') {
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', role);

  if (!users || users.length === 0) return [];

  const notifications = users.map(u => ({
    user_id: u.id, title, message, type, link,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) console.error('[Notification] bulk insert error:', error.message);
  return data || [];
}

async function listNotifications(userId, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data || [], meta: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) } };
}

async function markAsRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .is('is_read', false);

  if (error) throw error;
  return { success: true };
}

async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('is_read', false);

  if (error) throw error;
  return { count: count || 0 };
}

async function sendNotificationToBranch(branchId, title, message, type = 'info', link = '') {
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('branch_id', branchId);

  if (!users || users.length === 0) return [];

  const notifications = users.map(u => ({
    user_id: u.id, title, message, type, link,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) console.error('[Notification] branch insert error:', error.message);
  return data || [];
}

module.exports = {
  sendNotification,
  sendNotificationToRole,
  sendNotificationToBranch,
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
