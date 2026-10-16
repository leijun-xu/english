import { Injectable } from '@nestjs/common';
import { PrismaService, ResponseService } from '@libs/shared';
import type {
  UvDto,
  PerformanceDto,
  PvDto,
  EventDto,
  ErrorDto,
  UpdateUvDto,
  TrackerAnalytics,
  TrackerAnalyticsQuery,
  TrackerBaseQuery,
  TrackerTrendPoint,
  VisitorQuery,
  PageViewQuery,
  TrackEventQuery,
  PerformanceEntryQuery,
  ErrorEntryQuery,
} from '@en/common/tracker';
import type { Prisma } from '@libs/shared/generated/prisma/client';

type DateRange = {
  startAt: Date
  endAt: Date
  bucket: 'hour' | 'day'
}

type Pagination = {
  page: number
  pageSize: number
  skip: number
}

type TrendItem = TrackerTrendPoint & {
  visitorIds: Set<string>
}

@Injectable()
export class TrackerService {
  constructor(private readonly prismaService: PrismaService, private readonly responseService: ResponseService) { }
  
  //上报独立访客
  //upsert 如果没有值就创建，如果有它就更新
  async uv(body: UvDto) {
    const visitor = await this.prismaService.visitor.upsert({
      where: { anonymousId: body.anonymousId },
      create: {
        anonymousId: body.anonymousId, //匿名ID
        userId: body.userId, //用户ID
        browser: body.browser, //浏览器
        os: body.os, //操作系统
        device: body.device //设备
      },
      update: {
        userId: body.userId, //用户ID
        browser: body.browser, //浏览器
        os: body.os, //操作系统
        device: body.device //设备
      },
      select: {
        id: true
      }
    })
    return this.responseService.success(visitor.id) //前端就会读到这个访客ID 并不是匿名ID
  }
  //更新独立访客
  async updateUv(body: UpdateUvDto) {
    await this.prismaService.visitor.update({
      where: { id: body.visitorId }, //通过访客ID更新Userid
      data: { userId: body.userId }
    })
    return this.responseService.success(true)
  }
  //上报性能指标
  async performance(body: PerformanceDto) {
    await this.prismaService.performanceEntry.create({
      data: {
        visitorId: body.visitorId, //访客ID
        fp: body.fp, //FP
        fcp: body.fcp, //FCP
        lcp: body.lcp, //LCP
        inp: body.inp, //INP
        cls: body.cls //CLS
      }
    })
    return this.responseService.success(true)
  }
  //上报页面访问
  async pv(body: PvDto) {
    await this.prismaService.pageView.create({
      data: {
        visitorId: body.visitorId,//访客ID
        url: body.url, //页面URL
        referrer: body.referrer, //来源URL
        path: body.path //页面路径
      }
    })
    return this.responseService.success(true)
  }
  //上报用户行为
  async event(body: EventDto) {
    await this.prismaService.trackEvent.create({
      data: {
        visitorId: body.visitorId,//访客ID
        event: body.event, //事件类型
        payload: body.payload, //事件数据
        url: body.url //页面URL
      }
    })
    return this.responseService.success(true)
  }
  //上报错误
  async error(body: ErrorDto) {
    await this.prismaService.errorEntry.create({
      data: {
        visitorId: body.visitorId, //访客ID
        error: body.error, //错误类型
        message: body.message, //错误信息
        stack: body.stack, //错误堆栈
        url: body.url //页面URL
      }
    })
    return this.responseService.success(true)
  }

  //埋点看板汇总
  async analytics(query: TrackerAnalyticsQuery = {}) {
    const dateRange = this.getDateRange(query)
    const dateWhere = this.getCreatedAtWhere(dateRange)
    const previousDateRange = this.getPreviousDateRange(dateRange)
    const previousDateWhere = this.getCreatedAtWhere(previousDateRange)

    const [
      visitorIds,
      previousVisitorIds,
      pageViews,
      previousPageViews,
      events,
      previousEvents,
      errors,
      previousErrors,
      performanceCount,
      performanceAverage,
      previousPerformanceAverage,
      trendPageViews,
      trendEvents,
      topPathGroups,
      eventGroups,
      recentErrors,
    ] = await Promise.all([
      this.prismaService.pageView.findMany({
        where: dateWhere,
        distinct: ['visitorId'],
        select: { visitorId: true },
      }),
      this.prismaService.pageView.findMany({
        where: previousDateWhere,
        distinct: ['visitorId'],
        select: { visitorId: true },
      }),
      this.prismaService.pageView.count({ where: dateWhere }),
      this.prismaService.pageView.count({ where: previousDateWhere }),
      this.prismaService.trackEvent.count({ where: dateWhere }),
      this.prismaService.trackEvent.count({ where: previousDateWhere }),
      this.prismaService.errorEntry.count({ where: dateWhere }),
      this.prismaService.errorEntry.count({ where: previousDateWhere }),
      this.prismaService.performanceEntry.count({ where: dateWhere }),
      this.prismaService.performanceEntry.aggregate({
        where: dateWhere,
        _avg: { fp: true, fcp: true, lcp: true, inp: true, cls: true },
      }),
      this.prismaService.performanceEntry.aggregate({
        where: previousDateWhere,
        _avg: { lcp: true },
      }),
      this.prismaService.pageView.findMany({
        where: dateWhere,
        select: { createdAt: true, visitorId: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prismaService.trackEvent.findMany({
        where: dateWhere,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prismaService.pageView.groupBy({
        by: ['path'],
        where: dateWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prismaService.trackEvent.groupBy({
        by: ['event'],
        where: dateWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prismaService.errorEntry.findMany({
        where: dateWhere,
        select: {
          id: true,
          error: true,
          message: true,
          url: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    const topPaths = await Promise.all(topPathGroups.map(async (item) => {
      const pathVisitorIds = await this.prismaService.pageView.findMany({
        where: {
          ...dateWhere,
          path: item.path,
        },
        distinct: ['visitorId'],
        select: { visitorId: true },
      })

      return {
        path: item.path,
        views: item._count.id,
        visitors: pathVisitorIds.length,
      }
    }))

    const averageLcp = this.toSeconds(performanceAverage._avg.lcp)
    const previousAverageLcp = this.toSeconds(previousPerformanceAverage._avg.lcp)
    const analyticsData: TrackerAnalytics = {
      metrics: [
        {
          key: 'visitors',
          value: visitorIds.length,
          trend: this.formatPercentTrend(visitorIds.length, previousVisitorIds.length),
        },
        {
          key: 'pageViews',
          value: pageViews,
          trend: this.formatPercentTrend(pageViews, previousPageViews),
        },
        {
          key: 'events',
          value: events,
          trend: this.formatPercentTrend(events, previousEvents),
        },
        {
          key: 'lcp',
          value: averageLcp,
          trend: this.formatNumberTrend(averageLcp, previousAverageLcp, 's'),
        },
        {
          key: 'errors',
          value: errors,
          trend: this.formatNumberTrend(errors, previousErrors),
        },
      ],
      trendData: this.buildTrendData(dateRange, trendPageViews, trendEvents),
      topPaths,
      eventRanks: eventGroups.map((item) => ({
        event: item.event,
        count: item._count.id,
        conversion: `${events ? ((item._count.id / events) * 100).toFixed(1) : '0.0'}%`,
      })),
      recentErrors,
      moduleCounts: {
        visitors: visitorIds.length,
        pageViews,
        events,
        performance: performanceCount,
        errors,
      },
    }

    return this.responseService.success(analyticsData)
  }

  //访客列表
  async visitors(query: VisitorQuery = {}) {
    const { page, pageSize, skip } = this.getPagination(query)
    const where: Prisma.VisitorWhereInput = {
      ...this.getOptionalCreatedAtWhere(query),
      anonymousId: query.anonymousId ? { contains: query.anonymousId } : undefined,
      userId: query.userId ? { contains: query.userId } : undefined,
    }
    const [total = 0, list = []] = await Promise.all([
      this.prismaService.visitor.count({ where }),
      this.prismaService.visitor.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              pageViews: true,
              trackEvents: true,
              performanceEntries: true,
              errorEntries: true,
            },
          },
        },
      }),
    ])
    return this.responseService.success({ total, page, pageSize, list })
  }

  //页面访问列表
  async pageViews(query: PageViewQuery = {}) {
    const { page, pageSize, skip } = this.getPagination(query)
    const where: Prisma.PageViewWhereInput = {
      ...this.getOptionalCreatedAtWhere(query),
      visitorId: query.visitorId,
      path: query.path ? { contains: query.path } : undefined,
      url: query.url ? { contains: query.url } : undefined,
    }
    const [total = 0, list = []] = await this.findPageData(
      this.prismaService.pageView,
      where,
      pageSize,
      skip,
    )
    return this.responseService.success({ total, page, pageSize, list })
  }

  //用户行为列表
  async events(query: TrackEventQuery = {}) {
    const { page, pageSize, skip } = this.getPagination(query)
    const where: Prisma.TrackEventWhereInput = {
      ...this.getOptionalCreatedAtWhere(query),
      visitorId: query.visitorId,
      event: query.event ? { contains: query.event } : undefined,
      url: query.url ? { contains: query.url } : undefined,
    }
    const [total = 0, list = []] = await this.findPageData(
      this.prismaService.trackEvent,
      where,
      pageSize,
      skip,
    )
    return this.responseService.success({ total, page, pageSize, list })
  }

  //性能指标列表
  async performanceList(query: PerformanceEntryQuery = {}) {
    const { page, pageSize, skip } = this.getPagination(query)
    const where: Prisma.PerformanceEntryWhereInput = {
      ...this.getOptionalCreatedAtWhere(query),
      visitorId: query.visitorId,
    }
    const [total = 0, list = []] = await this.findPageData(
      this.prismaService.performanceEntry,
      where,
      pageSize,
      skip,
    )
    return this.responseService.success({ total, page, pageSize, list })
  }

  //错误列表
  async errors(query: ErrorEntryQuery = {}) {
    const { page, pageSize, skip } = this.getPagination(query)
    const where: Prisma.ErrorEntryWhereInput = {
      ...this.getOptionalCreatedAtWhere(query),
      visitorId: query.visitorId,
      error: query.error ? { contains: query.error } : undefined,
      url: query.url ? { contains: query.url } : undefined,
    }
    const [total = 0, list = []] = await this.findPageData(
      this.prismaService.errorEntry,
      where,
      pageSize,
      skip,
    )
    return this.responseService.success({ total, page, pageSize, list })
  }

  private getPagination(query: TrackerBaseQuery): Pagination {
    const page = Math.max(Number(query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 100)
    return {
      page,
      pageSize,
      skip: (page - 1) * pageSize,
    }
  }

  private getDateRange(query: Pick<TrackerBaseQuery, 'range' | 'startDate' | 'endDate'>): DateRange {
    const now = new Date()
    const endDate = this.parseDate(query.endDate) ?? now
    const startDate = this.parseDate(query.startDate)
    const startAt = startDate ?? this.getRangeStartAt(query.range, endDate)
    return {
      startAt,
      endAt: endDate,
      bucket: endDate.getTime() - startAt.getTime() <= 24 * 60 * 60 * 1000 ? 'hour' : 'day',
    }
  }

  private getRangeStartAt(range: TrackerAnalyticsQuery['range'], now: Date) {
    const startAt = new Date(now)
    startAt.setHours(0, 0, 0, 0)
    if (range === 'today') {
      return startAt
    }
    startAt.setDate(startAt.getDate() - (range === '30d' ? 29 : 6))
    return startAt
  }

  private getPreviousDateRange(dateRange: DateRange): DateRange {
    const rangeMilliseconds = dateRange.endAt.getTime() - dateRange.startAt.getTime()
    return {
      startAt: new Date(dateRange.startAt.getTime() - rangeMilliseconds),
      endAt: new Date(dateRange.startAt.getTime()),
      bucket: dateRange.bucket,
    }
  }

  private getCreatedAtWhere(dateRange: DateRange) {
    return {
      createdAt: {
        gte: dateRange.startAt,
        lte: dateRange.endAt,
      },
    }
  }

  private getOptionalCreatedAtWhere(query: Pick<TrackerBaseQuery, 'range' | 'startDate' | 'endDate'>) {
    if (!query.range && !query.startDate && !query.endDate) {
      return {}
    }
    return this.getCreatedAtWhere(this.getDateRange(query))
  }

  private parseDate(value?: string) {
    if (!value) {
      return undefined
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  private async findPageData(model: any, where: any, pageSize: number, skip: number) {
    return Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          visitor: {
            select: {
              id: true,
              anonymousId: true,
              userId: true,
              browser: true,
              os: true,
              device: true,
            },
          },
        },
      }),
    ])
  }

  private buildTrendData(
    dateRange: DateRange,
    pageViews: { createdAt: Date, visitorId: string }[],
    events: { createdAt: Date }[],
  ) {
    const trendMap = this.createTrendMap(dateRange)

    pageViews.forEach((item) => {
      const trendKey = this.getTrendKey(item.createdAt, dateRange.bucket)
      const trendItem = trendMap.get(trendKey)
      if (!trendItem) {
        return
      }
      trendItem.pageViews += 1
      trendItem.visitorIds.add(item.visitorId)
    })

    events.forEach((item) => {
      const trendKey = this.getTrendKey(item.createdAt, dateRange.bucket)
      const trendItem = trendMap.get(trendKey)
      if (!trendItem) {
        return
      }
      trendItem.events += 1
    })

    return Array.from(trendMap.values()).map(({ visitorIds, ...item }) => ({
      ...item,
      visitors: visitorIds.size,
    }))
  }

  private createTrendMap(dateRange: DateRange) {
    const trendMap = new Map<string, TrendItem>()
    const cursor = new Date(dateRange.startAt)

    while (cursor <= dateRange.endAt) {
      const trendKey = this.getTrendKey(cursor, dateRange.bucket)
      trendMap.set(trendKey, {
        date: this.formatTrendLabel(cursor, dateRange.bucket),
        pageViews: 0,
        visitors: 0,
        events: 0,
        visitorIds: new Set<string>(),
      })
      if (dateRange.bucket === 'hour') {
        cursor.setHours(cursor.getHours() + 1)
      } else {
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    return trendMap
  }

  private getTrendKey(date: Date, bucket: DateRange['bucket']) {
    const year = date.getFullYear()
    const month = this.pad(date.getMonth() + 1)
    const day = this.pad(date.getDate())
    if (bucket === 'hour') {
      return `${year}-${month}-${day} ${this.pad(date.getHours())}`
    }
    return `${year}-${month}-${day}`
  }

  private formatTrendLabel(date: Date, bucket: DateRange['bucket']) {
    if (bucket === 'hour') {
      return `${this.pad(date.getHours())}:00`
    }
    return `${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`
  }

  private pad(value: number) {
    return String(value).padStart(2, '0')
  }

  private toSeconds(value?: number | null) {
    return Number(((value ?? 0) / 1000).toFixed(2))
  }

  private formatPercentTrend(currentValue: number, previousValue: number) {
    if (!previousValue) {
      return currentValue ? '+100.0%' : '0.0%'
    }
    const percent = ((currentValue - previousValue) / previousValue) * 100
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
  }

  private formatNumberTrend(currentValue: number, previousValue: number, suffix = '') {
    const diff = Number((currentValue - previousValue).toFixed(2))
    return `${diff >= 0 ? '+' : ''}${diff}${suffix}`
  }
}
