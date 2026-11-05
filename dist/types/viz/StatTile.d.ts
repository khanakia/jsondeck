import { type Measure, type Row, type TimeBucket, type Where } from "../core/aggregate";
export type StatSpec = {
    label: string;
    measure?: Measure | undefined;
    where?: Where | undefined;
    /** Compare against the same measure over rows matching this `where` (e.g. last period). */
    compare?: Where | undefined;
    /** Text after the delta, e.g. "vs last week". */
    compareLabel?: string | undefined;
    /** Is a rise good (green) or bad (red)? Default true. Set false for counts of problems. */
    upIsGood?: boolean | undefined;
    /** Trend line: the measure per time bucket of a date field. */
    trend?: {
        field: string;
        bucket?: TimeBucket;
        points?: number;
    } | undefined;
    /** Shown under the value. */
    hint?: string | undefined;
};
export type StatTileProps = {
    rows: Row[];
    spec: StatSpec;
    /** Click on the tile (e.g. apply its `where` to the table). */
    onSelect?: (where: Where | undefined) => void | undefined;
    className?: string | undefined;
};
export declare function StatTile({ rows, spec, onSelect, className }: StatTileProps): import("react").JSX.Element;
