const { Router } = require('express');
const { supabaseAdmin: supabase } = require('../config/supabase');
const { success } = require('../utils/response');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    return success(res, data || [], 'OK');
  } catch (err) { next(err); }
});

router.get('/suppliers', authenticate, async (req, res, next) => {
  try {
    const { data } = await supabase.from('suppliers').select('id, name').eq('is_active', true).order('name');
    return success(res, data || [], 'OK');
  } catch (err) { next(err); }
});

module.exports = router;
