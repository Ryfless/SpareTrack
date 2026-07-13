const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;
const supabaseServiceKey = config.supabaseServiceRoleKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
