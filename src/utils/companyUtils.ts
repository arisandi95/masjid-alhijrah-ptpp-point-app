import { DEFAULT_COMPANIES, DEFAULT_UNITS } from '../services/mockStorage';

/**
 * Returns human-readable company name from ID or name.
 * Example: '1' -> 'PP Holding', '2' -> 'AP', 'PP Holding' -> 'PP Holding'
 */
export function getCompanyDisplayName(companyIdOrName?: string): string {
  if (!companyIdOrName) return '';
  const trimmed = String(companyIdOrName).trim();
  const match = DEFAULT_COMPANIES.find(
    (c) => String(c.company_id) === trimmed || c.company_name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? match.company_name : trimmed;
}

/**
 * Returns human-readable unit/division name from ID or name.
 * Example: '1' -> 'UKP', '4' -> 'Gedung', 'UKP' -> 'UKP'
 */
export function getUnitDisplayName(unitIdOrName?: string): string {
  if (!unitIdOrName) return '';
  const trimmed = String(unitIdOrName).trim();
  const match = DEFAULT_UNITS.find(
    (u) => String(u.unit_id) === trimmed || u.unit_name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? match.unit_name : trimmed;
}
