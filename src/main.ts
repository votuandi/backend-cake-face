import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
// import * as cors from 'cors'
import { NestExpressApplication } from '@nestjs/platform-express'
import path from 'path'
// import * as fs from 'fs'
// import * as https from 'https'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // httpsOptions: {
    //   key: fs.readFileSync('./private.key'),
    //   cert: fs.readFileSync('./bundle.crt'),
    // },
  })
  app.useGlobalPipes(new ValidationPipe())
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })
  // app.use(cors)
  app.useStaticAssets(path.join(__dirname, '..', 'public'), {
    prefix: '/public/',
  })
  await app.listen(8080)

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap()
