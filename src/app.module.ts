import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService, ConfigModule } from '@nestjs/config'
import { UserModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { JwtService } from '@nestjs/jwt'
import { CakeFaceCategoryModule } from './cake-face-category/cake-face-category.module'
import { CakeFaceModule } from './cake-face/cake-face.module'
import { CakeFaceOptionModule } from './cake-face-option/cake-face-option.module'
import { BannerModule } from './banner/banner.module'
import { SampleBackgroundModule } from './sample-background/sample-background.module'
import { SamplePatternModule } from './sample-pattern/sample-pattern.module'
import { SettingModule } from './setting/setting.module'

@Module({
  imports: [
    UserModule,
    AuthModule,
    CakeFaceCategoryModule,
    CakeFaceModule,
    CakeFaceOptionModule,
    BannerModule,
    SampleBackgroundModule,
    SamplePatternModule,
    SettingModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configServer: ConfigService) => ({
        type: 'mysql',
        host: configServer.getOrThrow<string>('DATABASE_HOST'),
        port: configServer.getOrThrow<number>('DATABASE_PORT'),
        username: configServer.getOrThrow<string>('DATABASE_USERNAME'),
        password: configServer.getOrThrow<string>('DATABASE_PASSWORD'),
        database: configServer.getOrThrow<string>('DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
        migrations: ['/src/migrations/*.ts'],
        cli: {
          migrationsDir: 'src/migration',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule {}
