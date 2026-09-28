import { Injectable } from '@nestjs/common';
const Business = {
    SUCCESS: {
        code: 200,
        message: 'success',
    },
    ERROR: {
        code: 500,
        message: 'error',
    },
    LOGIN:{
        code: 1,
        message: '手机号一已经存在',
    },
    EMAIL:{
        code: 2,
        message: '邮箱已经存在',
    },
}
@Injectable()
export class ResponseService {
    success(data: any) {
        return {
            data,
            code: Business.SUCCESS.code,
            message: Business.SUCCESS.message,
        }
    }
    error(data = null, message: string, code: number = Business.ERROR.code) {
        return {
            data,
            code,
            message: message || Business.ERROR.message,
        }
    }
}
