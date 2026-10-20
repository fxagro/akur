export type UUID = string & { readonly __brand: unique symbol };

export function uuid(): UUID {
  return crypto.randomUUID() as UUID;
}

export type ISODateString = string & { readonly __brand: unique symbol };

export function toISODate(date: Date): ISODateString {
  return date.toISOString().slice(0, 10) as ISODateString;
}

export type Currency = "IDR" | "USD" | "SGD" | "EUR" | "JPY";

export interface Money {
  amount: number;
  currency: Currency;
}

export function money(amount: number, currency: Currency = "IDR"): Money {
  return { amount, currency };
}

export function formatMoney(money: Money, locale = "id-ID"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(money.amount);
}

export type Locale = "id-ID" | "en-US";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(data: T[], params: PaginationParams): PaginatedResult<T> {
  const { page, limit } = params;
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: data.slice(start, end),
    meta: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
    },
  };
}

export type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export function sortBy<T>(data: T[], params: SortParams): T[] {
  return [...data].sort((a, b) => {
    const aVal = (a as any)[params.field];
    const bVal = (b as any)[params.field];
    if (aVal < bVal) return params.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return params.direction === "asc" ? 1 : -1;
    return 0;
  });
}

export type FilterOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "notIn";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export function applyFilters<T>(data: T[], filters: FilterCondition[]): T[] {
  return data.filter((item) =>
    filters.every((filter) => {
      const value = (item as any)[filter.field];
      switch (filter.operator) {
        case "eq": return value === filter.value;
        case "ne": return value !== filter.value;
        case "gt": return value > filter.value;
        case "gte": return value >= filter.value;
        case "lt": return value < filter.value;
        case "lte": return value <= filter.value;
        case "contains": return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case "startsWith": return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
        case "endsWith": return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
        case "in": return Array.isArray(filter.value) && filter.value.includes(value);
        case "notIn": return Array.isArray(filter.value) && !filter.value.includes(value);
        default: return true;
      }
    });
}

export interface AuditFields {
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
}

export interface SoftDeleteFields {
  deletedAt: Date | null;
  deletedById: string | null;
}

export type EntityStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DRAFT" | "POSTED" | "VOID";