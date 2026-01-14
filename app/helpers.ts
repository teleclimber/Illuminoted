const date_format = [{year: 'numeric'}, {month: 'short'}, {day: 'numeric'} ];
export function dateStr(d:Date) {
	return date_format.map((m) => {
		const f = new Intl.DateTimeFormat('en', <Intl.DateTimeFormatOptions>m);
		return f.format(d);
	}).join('-');
}

/**
 * Escape single quotes for SQL injection prevention
 * Replaces ' with '' (SQL standard escaping)
 */
export function escapeSingleQuotes(input: string): string {
  return input.replace(/'/g, "''");
}