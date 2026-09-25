export type CountryOption = { code: string; ar: string; en: string; flag: string };

const COUNTRY_CODES = [
  'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','KP','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','YE','ZM','ZW'
];

function flagFromCode(code: string) {
  if (code === 'ALL') return '🌐';
  return [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
}

function displayName(code: string, locale: 'ar' | 'en') {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

export function getCountries(): CountryOption[] {
  const preferred = ['EG', 'SA', 'AE', 'US', 'GB'];
  const ordered = [...preferred, ...COUNTRY_CODES.filter((code) => !preferred.includes(code))];
  return [
    { code: 'ALL', ar: 'كل الدول', en: 'All countries', flag: '🌐' },
    ...ordered.map((code) => ({
      code,
      ar: displayName(code, 'ar'),
      en: displayName(code, 'en'),
      flag: flagFromCode(code),
    })),
  ];
}

export function getCountry(code: string | null | undefined): CountryOption {
  const normalized = String(code || 'ALL').toUpperCase();
  return getCountries().find((item) => item.code === normalized) || getCountries()[0];
}
