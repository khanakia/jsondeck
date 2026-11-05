import type { DateRangeValue } from "../../types";
export type DatePreset = {
    id: string;
    label: string;
    range: () => {
        from: Date;
        to: Date;
    };
};
export declare const datePresets: DatePreset[];
export declare function getPresetById(id: string): DatePreset | undefined;
export declare function rangeToValue(range: {
    from: Date;
    to: Date;
}, presetId: string | null): DateRangeValue;
export declare function valueToRange(value: DateRangeValue | undefined): {
    from: Date | undefined;
    to: Date | undefined;
};
export declare function formatRangeLabel(value: DateRangeValue | undefined): string;
