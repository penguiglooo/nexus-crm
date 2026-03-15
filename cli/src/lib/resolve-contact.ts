import { supabase } from './supabase.js';

/**
 * Fuzzy-match a contact by name. Exits with error if zero or multiple matches.
 * Used by all CLI commands that accept a contact name argument.
 *
 * @param nameQuery  partial name to search for (case-insensitive)
 * @param selectCols columns to return — defaults to 'id, name', pass '*' for full row
 */
export async function resolveContact(
  nameQuery: string,
  selectCols: string = 'id, name',
): Promise<any> {
  const { data, error } = await supabase
    .from('contacts')
    .select(selectCols)
    .ilike('name', `%${nameQuery}%`);

  if (error) {
    console.error('Error searching contacts:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(`No contact found matching "${nameQuery}"`);
    process.exit(1);
  }

  if (data.length > 1) {
    console.error(`Multiple contacts match "${nameQuery}":`);
    for (const c of data) {
      console.error(`  - ${c.name}${c.category ? ` (${c.category})` : ''}`);
    }
    console.error('Please be more specific.');
    process.exit(1);
  }

  return data[0];
}
