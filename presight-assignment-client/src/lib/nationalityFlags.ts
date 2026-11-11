const NATIONALITY_COUNTRY_CODES: Record<string, string> = {
  American: 'US',
  British: 'GB',
  Canadian: 'CA',
  German: 'DE',
  French: 'FR',
  Spanish: 'ES',
  Italian: 'IT',
  Dutch: 'NL',
  Swedish: 'SE',
  Norwegian: 'NO',
  Danish: 'DK',
  Polish: 'PL',
  Portuguese: 'PT',
  Irish: 'IE',
  Australian: 'AU',
  Japanese: 'JP',
  'South Korean': 'KR',
  Indian: 'IN',
  Brazilian: 'BR',
  Mexican: 'MX',
  Argentine: 'AR',
  'South African': 'ZA',
  Nigerian: 'NG',
  Egyptian: 'EG',
  Turkish: 'TR',
  Greek: 'GR',
  Swiss: 'CH',
  Belgian: 'BE',
  Austrian: 'AT',
  Finnish: 'FI',
}

function countryCodeToFlag(countryCode: string): string {
  return [...countryCode.toUpperCase()]
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('')
}

export function getNationalityFlag(nationality: string): string | null {
  const countryCode = NATIONALITY_COUNTRY_CODES[nationality]
  if (!countryCode) {
    return null
  }

  return countryCodeToFlag(countryCode)
}
