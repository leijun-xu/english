import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  constructor() {}
  getHello() {
    return '访问成功'
  }
}
