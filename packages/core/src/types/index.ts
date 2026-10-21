// Core types for Akur ERP

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

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a < b ? -1 : a > b ? 1 : 0;
  if (a instanceof Date && b instanceof Date) {
    const diff = a.getTime() - b.getTime();
    return diff < 0 ? -1 : diff > 0 ? 1 : 0;
  }
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

export function sortBy<T>(data: T[], params: SortParams): T[] {
  return [...data].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[params.field];
    const bVal = (b as unknown as Record<string, unknown>)[params.field];
    return params.direction === "asc" ? compareValues(aVal, bVal) : -compareValues(aVal, bVal);
  });
}

export type FilterOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "notIn";

export type FilterValue = string | number | boolean | Date | null | undefined;

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: FilterValue | FilterValue[];
}

export function applyFilters<T>(data: T[], filters: FilterCondition[]): T[] {
  return data.filter((item) => {
    return filters.every((filter) => {
      const value = (item as unknown as Record<string, unknown>)[filter.field] as FilterValue;
      switch (filter.operator) {
        case "eq":
          return value === filter.value;
        case "ne":
          return value !== filter.value;
        case "gt":
          return compareValues(value, filter.value) > 0;
        case "gte":
          return compareValues(value, filter.value) >= 0;
        case "lt":
          return compareValues(value, filter.value) < 0;
        case "lte":
          return compareValues(value, filter.value) <= 0;
        case "contains":
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case "startsWith":
          return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
        case "endsWith":
          return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
        case "in":
          return Array.isArray(filter.value) && filter.value.includes(value);
        case "notIn":
          return Array.isArray(filter.value) && !filter.value.includes(value);
        default:
          return true;
      }
    });
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
