import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { Config } from '@en/config';
import { InterceptorInterceptor } from '@libs/shared/interceptor/interceptor';
import { InterceptorExceptionFilter } from '@libs/shared/interceptor/exceptionFilter';
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule,DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalInterceptors(new InterceptorInterceptor());
  app.useGlobalFilters(new InterceptorExceptionFilter());
  app.setGlobalPrefix('api'); //设置全局前缀
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); //设置版本号v1
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('English Feat').setDescription('English Feat API').setVersion('1').setVersion('0.0.1').build());
  SwaggerModule.setup('api/swagger', app, document);
  await app.listen(Config.ports.server);
}
bootstrap();

