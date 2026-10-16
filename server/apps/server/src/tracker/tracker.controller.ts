import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { AuthGuard } from '@libs/shared/auth/auth.guard';
import type {
  UvDto,
  PerformanceDto,
  PvDto,
  EventDto,
  ErrorDto,
  UpdateUvDto,
  TrackerAnalyticsQuery,
  VisitorQuery,
  PageViewQuery,
  TrackEventQuery,
  PerformanceEntryQuery,
  ErrorEntryQuery,
} from '@en/common/tracker';

@Controller('tracker')
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  //上报独立访客
  @Post('uv')
  async uv(@Body() body: UvDto) {
    return this.trackerService.uv(body)
  }
  //更新独立访客
  @Post('update-uv')
  async updateUv(@Body() body: UpdateUvDto) {
    return this.trackerService.updateUv(body)
  }
  //上报性能指标
  @Post('performance')
  async performance(@Body() body: PerformanceDto) {
    return this.trackerService.performance(body)
  }
  //上报页面访问
  @Post('pv')
  async pv(@Body() body: PvDto) {
    return this.trackerService.pv(body)
  }
  //上报用户行为
  @Post('event')
  async event(@Body() body: EventDto) {
    return this.trackerService.event(body)
  }
  //上报错误
  @Post('error')
  async error(@Body() body: ErrorDto) {
    return this.trackerService.error(body)
  }

  //埋点看板汇总
  @UseGuards(AuthGuard)
  @Get('analytics')
  async analytics(@Query() query: TrackerAnalyticsQuery) {
    return this.trackerService.analytics(query)
  }

  //访客列表
  @UseGuards(AuthGuard)
  @Get('visitors')
  async visitors(@Query() query: VisitorQuery) {
    return this.trackerService.visitors(query)
  }

  //页面访问列表
  @UseGuards(AuthGuard)
  @Get('page-views')
  async pageViews(@Query() query: PageViewQuery) {
    return this.trackerService.pageViews(query)
  }

  //用户行为列表
  @UseGuards(AuthGuard)
  @Get('events')
  async events(@Query() query: TrackEventQuery) {
    return this.trackerService.events(query)
  }

  //性能指标列表
  @UseGuards(AuthGuard)
  @Get('performance')
  async performanceList(@Query() query: PerformanceEntryQuery) {
    return this.trackerService.performanceList(query)
  }

  //错误列表
  @UseGuards(AuthGuard)
  @Get('errors')
  async errors(@Query() query: ErrorEntryQuery) {
    return this.trackerService.errors(query)
  }
}
