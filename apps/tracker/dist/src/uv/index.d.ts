import { TrackerConfig } from '@en/common/tracker';
export declare const getBrowserInfo: () => {
    browser: string;
    os: string;
    device: import('ua-parser-js').DeviceTypes;
};
export declare const getFingerprint: (config: TrackerConfig) => Promise<any>;
//# sourceMappingURL=index.d.ts.map