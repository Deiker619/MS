# Microservicio de Logs (`ms-logs`)

Este microservicio se encarga de recibir, procesar y registrar todos los eventos de logs emitidos por los microservicios del sistema a través de **NATS**, almacenándolos en **PostgreSQL**.

---

## 🚀 Requisitos Previos

Asegúrate de contar con Docker y Node.js instalados.

## 🐳 Levantando Infraestructura (NATS & PostgreSQL)

Para iniciar NATS Server y la base de datos PostgreSQL de logs:

```bash
docker compose up -d
```

- **NATS Server**: `localhost:4222` (Monitoreo HTTP en `http://localhost:8222`)
- **PostgreSQL**: `localhost:5433` (Base de datos: `ms_logs_db`)

---

## 🏃 Ejecutar el Microservicio

```bash
# Desarrollo con auto-reload
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## 🗄️ Migraciones de Base de Datos

El servicio ejecuta las migraciones automáticas al arrancar (`migrationsRun: true`), o puedes ejecutarlas manualmente:

```bash
# Ejecutar migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert

# Generar una nueva migración automáticamente tras modificar una entidad
npm run migration:generate -- src/database/migrations/NombreDeLaMigracion

# Crear una migración en blanco
npm run migration:create -- src/database/migrations/NombreDeLaMigracion
```

---

## 📡 Publicación de Eventos desde otros Microservicios

Desde cualquier otro microservicio (por ejemplo `ms-auth`), puedes enviar eventos de log configurando el cliente de NATS:

### 1. Registrar Cliente NATS en NestJS (`AppModule` o `LogsModule` local):

```typescript
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        },
      },
    ]),
  ],
})
export class AppModule {}
```

### 2. Inyectar y Emitir Eventos de Log:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy) {}

  loginUser(user: any) {
    // Emitir log de información
    this.natsClient.emit('log.create', {
      service: 'ms-auth',
      level: 'info',
      message: `Usuario ${user.email} ha iniciado sesión con éxito`,
      context: 'AuthService',
      metadata: { userId: user.id, ip: '127.0.0.1' },
    });
  }

  handleError(error: Error) {
    // Emitir log de error
    this.natsClient.emit('log.create', {
      service: 'ms-auth',
      level: 'error',
      message: error.message,
      context: 'AuthService',
      metadata: { stack: error.stack },
    });
  }
}
```

---

## 🔍 Consulta de Logs vía REST API

El microservicio expone un endpoint HTTP en el puerto `3002`:

```http
GET http://localhost:3002/logs?service=ms-auth&level=error&page=1&limit=50
```

### Respuesta de Ejemplo:

```json
{
  "data": [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "service": "ms-auth",
      "level": "error",
      "message": "Credenciales inválidas",
      "context": "AuthService",
      "metadata": { "email": "user@example.com" },
      "createdAt": "2026-07-24T18:59:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```
