import { TrackerConfig } from '@en/common/tracker';
export declare class Tracker {
    private config;
    private visitorId;
    private initPromise;
    constructor(config: TrackerConfig);
    protected init(): Promise<void>;
    setUserId(userId: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map