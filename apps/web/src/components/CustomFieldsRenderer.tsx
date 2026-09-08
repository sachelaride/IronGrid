import { trpc } from '../utils/trpc';

interface CustomFieldsRendererProps {
    category?: string;
    ticketId?: string;
    values: any[]; // { fieldId: string, value: string }
    onChange?: (values: any[]) => void;
    readOnly?: boolean;
}

/**
 * CustomFieldsRenderer - Dinamic Metadata Capture for IT Services.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function CustomFieldsRenderer({ category, values, onChange, readOnly }: CustomFieldsRendererProps) {
    const { data: allFields = [], isLoading } = (trpc as any).customFields.listAll.useQuery({
        category: category as any,
        enabledOnly: true
    });

    const fields = allFields.filter((f: any) => !f.category || f.category === category);

    const handleFieldChange = (fieldId: string, value: string) => {
        if (!onChange) return;
        const newValues = [...values];
        const index = newValues.findIndex(v => v.fieldId === fieldId);
        if (index >= 0) {
            newValues[index] = { fieldId, value };
        } else {
            newValues.push({ fieldId, value });
        }
        onChange(newValues);
    };

    if (isLoading) {
        return (
            <div className="animate-pulse flex items-center gap-2 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em] pt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Synchronizing Service Metadata...
            </div>
        );
    }
    
    if (fields.length === 0) return null;

    return (
        <div className="space-y-6 pt-6 border-t border-white/5">
            <h5 className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-2 italic">
                METADATA_INJECTION_FIELDS
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {fields.map((field: any) => {
                    const val = values.find(v => v.fieldId === field.id)?.value || '';
                    return (
                        <div key={field.id} className="space-y-2">
                            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-1">
                                {field.label}
                                {field.required && <span className="text-error">*</span>}
                            </label>

                            <FieldInput
                                field={field}
                                value={val}
                                onChange={(v) => handleFieldChange(field.id, v)}
                                readOnly={readOnly}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FieldInput({ field, value, onChange, readOnly }: { field: any, value: string, onChange: (v: string) => void, readOnly?: boolean }) {
    if (readOnly) {
        return (
            <div className="bg-surface-container/30 border border-white/5 rounded p-3 font-data-mono text-xs text-on-surface uppercase tracking-tight">
                {field.type === 'SELECT' ? (
                    field.options?.find((o: string) => o === value) || value || 'NULL'
                ) : field.type === 'CHECKBOX' ? (
                    <span className={value === 'true' ? 'text-primary' : 'text-on-surface-variant'}>
                        {value === 'true' ? 'ACTIVE_STATE' : 'INACTIVE_STATE'}
                    </span>
                ) : (
                    value || 'NULL'
                )}
            </div>
        );
    }

    const baseStyles = "w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase focus:border-primary transition-all";

    switch (field.type) {
        case 'TEXTAREA':
            return (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder || 'ENTER_DESCRIPTION...'}
                    className={`${baseStyles} min-h-[100px] resize-none p-4 rounded`}
                />
            );

        case 'NUMBER':
            return (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder || '000'}
                    className={`${baseStyles} h-12 px-4 rounded`}
                />
            );

        case 'DATE':
            return (
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${baseStyles} h-12 px-4 rounded`}
                />
            );

        case 'SELECT':
            return (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${baseStyles} h-12 px-4 rounded`}
                >
                    <option value="">SELECT_OPTION...</option>
                    {(field.options as string[] || []).map(opt => (
                        <option key={opt} value={opt} className="bg-surface-container-high text-on-surface">{opt}</option>
                    ))}
                </select>
            );

        case 'CHECKBOX':
            return (
                <label className="flex items-center gap-4 cursor-pointer group p-4 bg-surface-container-high border border-white/5 rounded hover:border-primary/30 transition-all">
                    <div
                        onClick={() => onChange(value === 'true' ? 'false' : 'true')}
                        className={`w-11 h-6 rounded-full relative transition-all border border-white/10 ${value === 'true' ? 'bg-primary' : 'bg-surface-container'}`}
                    >
                        <div className={`absolute top-1 w-3.5 h-3.5 bg-on-surface rounded-full transition-all ${value === 'true' ? 'left-6 shadow-[0_0_10px_white]' : 'left-1'}`} />
                    </div>
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest group-hover:text-on-surface transition-colors">
                        {value === 'true' ? 'ENABLE_PROTOCOL' : 'DISABLE_PROTOCOL'}
                    </span>
                </label>
            );

        default:
            return (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder || 'ENTER_DATA...'}
                    className={`${baseStyles} h-12 px-4 rounded`}
                />
            );
    }
}
