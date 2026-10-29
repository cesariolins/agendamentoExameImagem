import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

const app = configurarApp(await NestFactory.create(AppModule));

const documento = new DocumentBuilder()
  .setTitle('Agendamento de Exames de Imagem')
  .setDescription(
    'Busca de exames, horários livres por médico e agendamento. ' +
      'Datas no fuso da clínica (America/Sao_Paulo); erros no formato `{ statusCode, codigo, mensagem, detalhes? }`.',
  )
  .setVersion('1.0')
  .build();
SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, documento));

const porta = Number(process.env.PORT ?? 3000);
await app.listen(porta);
Logger.log(`API em http://localhost:${porta}/api · Swagger em http://localhost:${porta}/api/docs`);
