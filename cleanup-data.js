#!/usr/bin/env node
/**
 * Clear all data from Supabase uro_data table
 * Usage: node cleanup-data.js
 */

const SUPABASE_URL = 'https://mwafupfncuzckdfvvjw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9fE5nB4iRc7G6ykVA1UULA_UQnBEJlQ';

(async () => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/uro_data?id=eq.1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        data: { items: [], txns: [], equipment: [], po: [] }
      })
    });

    if (res.ok) {
      console.log('✅ Data cleared successfully!');
    } else {
      console.error('❌ Error:', res.statusText, await res.text());
    }
  } catch (e) {
    console.error('❌ Failed:', e.message);
  }
})();
