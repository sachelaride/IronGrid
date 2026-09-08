export function escapeFluxString(value: string | number | boolean): string {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function fluxEqualsAny(fields: string[], values: Array<string | number | boolean>): string {
    const clauses = values
        .filter(value => value !== undefined && value !== null && String(value).length > 0)
        .map(value => {
            const escaped = escapeFluxString(value);
            return fields.map(field => 'r["' + field + '"] == "' + escaped + '"').join(' or ');
        });

    return clauses.length > 0 ? clauses.map(clause => '(' + clause + ')').join(' or ') : 'false';
}
