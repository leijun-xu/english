import type { TrackerConfig } from '@en/common/tracker';
import { getFingerprint } from './src/uv';
import { reportEvent } from './src/event';
import { reportError } from './src/error';
import { reportPv } from './src/pv';
import { reportPerformance } from './src/performance';
import { reportFetch } from './src/report';
export class Tracker {
    private config: TrackerConfig
    private visitorId: string | null = null
    private initPromise: Promise<void> | null = null
    constructor(config: TrackerConfig) {
        this.config = config
        void this.init().catch(() => undefined) //埋点不可用时不阻断业务应用
    }
    //protected 允许子类和内部使用
    protected async init() {
        if (this.initPromise) return this.initPromise //确保他是同一个promise
        //IIFE立即执行函数
        this.initPromise = (async () => {
            let config = this.config
            const visitorId = await getFingerprint(config)
            this.visitorId = visitorId
            reportEvent(visitorId, config) //事件上报目前没有visitorId先随便写一个
            reportError(visitorId, config) //错误上报目前没有visitorId先随便写一个
            reportPv(visitorId, config) //页面上报目前没有visitorId先随便写一个
            reportPerformance(visitorId, config) //性能上报目前没有visitorId先随便写一个
        })()
        return this.initPromise
    }

    public async setUserId(userId: string) {
        await this.init()
        let url = this.config.baseUrl + this.config.uv.updateApi
        await reportFetch(url, {
            visitorId: this.visitorId,
            userId: userId
        })
    }
}
