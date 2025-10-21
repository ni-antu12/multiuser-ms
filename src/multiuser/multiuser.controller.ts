import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { MultiuserService } from './multiuser.service';
import { CreateFamilyGroupDto } from './dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from './dto/update-family-group.dto';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { CreateMyFamilyGroupDto } from './dto/create-my-family-group.dto';

@ApiTags('multiuser')
@Controller('multiuser')
export class MultiuserController {
  constructor(private readonly multiuserService: MultiuserService) {}

  // ===== FAMILY GROUPS =====
  @ApiOperation({ 
    summary: 'Crear grupo familiar (Manual/Administración)',
    description: 'Crea un nuevo grupo familiar de forma manual proporcionando el UUID de un líder existente. El grupo puede tener hasta 8 miembros máximo. El líder se asocia automáticamente como miembro #1 del grupo. Este endpoint retorna información completa del grupo Y del líder (nombre, apellido, email, etc.). Ideal para administración o cuando no tienes acceso a la BD del centro médico.'
  })
  @ApiBody({
    description: 'Datos del grupo familiar a crear',
    schema: {
      type: 'object',
      required: ['leader', 'tokenApp'],
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID corto de 8 caracteres. Si no se proporciona, se genera automáticamente',
          example: 'aB3x9K2m',
          minLength: 8,
          maxLength: 8
        },
        leader: {
          type: 'string',
          description: 'UUID del usuario líder (debe existir en el sistema)',
          example: 'nP7vQ8rT',
          minLength: 8,
          maxLength: 8
        },
        tokenApp: {
          type: 'string',
          description: 'Token único de la aplicación',
          example: 'token123'
        },
        maxMembers: {
          type: 'number',
          description: 'Número máximo de miembros (1-8)',
          example: 8,
          minimum: 1,
          maximum: 8,
          default: 8
        }
      }
    }
  })
  @ApiHeader({
    name: 'X-User-UUID',
    description: 'UUID del usuario que está haciendo la petición (opcional, para validación de líder)',
    required: false
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Grupo familiar creado exitosamente. El líder se asocia automáticamente como miembro #1 del grupo.',
    schema: {
      type: 'object',
      properties: {
        familyGroup: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            uuid: { type: 'string', example: 'aB3x9K2m' },
            leader: { type: 'string', example: 'nP7vQ8rT' },
            tokenApp: { type: 'string', example: 'token123' },
            maxMembers: { type: 'number', example: 8 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        leader: {
          type: 'object',
          description: 'Información completa del líder del grupo',
          properties: {
            id: { type: 'string', example: 'clx9876543210zyxwvu' },
            uuid: { type: 'string', example: 'nP7vQ8rT' },
            rut: { type: 'string', example: '12345678-9' },
            email: { type: 'string', example: 'lider@ejemplo.com' },
            username: { type: 'string', example: 'lider1' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            isActive: { type: 'boolean', example: true },
            isLeader: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        message: { type: 'string', example: 'Grupo familiar creado exitosamente' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo el usuario líder puede crear el grupo familiar',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Solo el usuario líder puede crear el grupo familiar' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Grupo familiar con este UUID ya existe',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Grupo familiar con este UUID ya existe' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Post('family-groups')
  createFamilyGroup(
    @Body() createFamilyGroupDto: CreateFamilyGroupDto,
    @Headers('x-user-uuid') requestingUserUuid?: string
  ) {
    return this.multiuserService.createFamilyGroup(createFamilyGroupDto, requestingUserUuid);
  }

  @ApiOperation({ 
    summary: '🏥 Crear mi grupo familiar (Centro Médico)',
    description: 'Crea automáticamente un grupo familiar para el paciente autenticado. Este endpoint está diseñado específicamente para centros médicos donde los datos del paciente se obtienen desde la BD del centro. El sistema valida automáticamente que el paciente sea mayor de 18 años, no pertenezca a otro grupo y no tenga ya un grupo como líder. El líder se asocia automáticamente como el primer miembro del grupo.'
  })
  @ApiHeader({
    name: 'X-User-RUT',
    required: true,
    description: 'RUT del paciente autenticado (obtenido del token de sesión)',
    example: '12345678-9'
  })
  @ApiBody({
    description: 'Datos opcionales del grupo (el tokenApp se genera automáticamente si no se proporciona)',
    schema: {
      type: 'object',
      properties: {
        tokenApp: {
          type: 'string',
          description: 'Token personalizado de la aplicación (opcional)',
          example: 'mi_token_personalizado'
        }
      }
    },
    required: false
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Grupo familiar creado exitosamente. El paciente ahora es líder y miembro #1 del grupo.',
    schema: {
      type: 'object',
      properties: {
        familyGroup: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            uuid: { type: 'string', example: 'aB3x9K2m' },
            leader: { type: 'string', example: 'nP7vQ8rT' },
            tokenApp: { type: 'string', example: 'token123' },
            maxMembers: { type: 'number', example: 8 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            uuid: { type: 'string', example: 'nP7vQ8rT' },
            rut: { type: 'string', example: '12345678-9' },
            familyGroupsUuid: { type: 'string', example: 'aB3x9K2m' },
            email: { type: 'string', example: 'paciente@email.com' },
            username: { type: 'string', example: 'patient_12345678' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            isActive: { type: 'boolean', example: true },
            isLeader: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        message: { type: 'string', example: 'Grupo familiar creado exitosamente' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'El paciente es menor de 18 años',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Debe ser mayor de 18 años para crear un grupo familiar' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Paciente no encontrado en la BD del centro médico',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Paciente no encontrado en el sistema' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'El paciente ya pertenece a un grupo o ya tiene un grupo como líder',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { 
          type: 'string', 
          example: 'Ya pertenece a un grupo familiar',
          enum: ['Ya pertenece a un grupo familiar', 'Ya tiene un grupo familiar creado']
        },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Post('my-family-group')
  createMyFamilyGroup(
    @Headers('x-user-rut') userRut: string,
    @Body() createMyFamilyGroupDto?: CreateMyFamilyGroupDto
  ) {
    if (!userRut) {
      throw new HttpException(
        'El header X-User-RUT es requerido',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.multiuserService.createMyFamilyGroup(userRut, createMyFamilyGroupDto);
  }

  @ApiOperation({ 
    summary: 'Listar todos los grupos familiares',
    description: 'Obtiene una lista completa de todos los grupos familiares en el sistema, incluyendo información detallada de sus miembros. Este endpoint es útil para administración, monitoreo del sistema y auditoría. Retorna información completa de cada grupo y sus usuarios asociados.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de grupos familiares obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx1234567890abcdef' },
          uuid: { type: 'string', example: 'aB3x9K2m' },
          leader: { type: 'string', example: 'nP7vQ8rT' },
          tokenApp: { type: 'string', example: 'token123' },
          maxMembers: { type: 'number', example: 8 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                uuid: { type: 'string' },
                rut: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  })
  @Get('family-groups')
  findAllFamilyGroups() {
    return this.multiuserService.findAllFamilyGroups();
  }

  @ApiOperation({ 
    summary: 'Obtener grupo familiar por UUID',
    description: 'Obtiene información detallada de un grupo familiar específico por su UUID, incluyendo todos sus miembros. Este endpoint es útil para obtener información completa de un grupo específico, incluyendo datos de todos los usuarios asociados.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del grupo familiar (8 caracteres)',
    example: 'aB3x9K2m'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupo familiar obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        uuid: { type: 'string', example: 'aB3x9K2m' },
        leader: { type: 'string', example: 'nP7vQ8rT' },
        tokenApp: { type: 'string', example: 'token123' },
        maxMembers: { type: 'number', example: 8 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        users: {
          type: 'array',
          description: 'Lista de usuarios miembros del grupo',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              uuid: { type: 'string' },
              rut: { type: 'string' },
              email: { type: 'string' },
              username: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Grupo familiar no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Grupo familiar no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Get('family-groups/:uuid')
  findFamilyGroupByUuid(@Param('uuid') uuid: string) {
    return this.multiuserService.findFamilyGroupByUuid(uuid);
  }

  @ApiOperation({ 
    summary: 'Buscar grupo familiar por token',
    description: 'Busca un grupo familiar específico usando su token de aplicación. Este endpoint es útil para aplicaciones que necesitan identificar un grupo por su token único, como en procesos de autenticación o configuración de aplicaciones.'
  })
  @ApiParam({
    name: 'tokenApp',
    description: 'Token único de la aplicación del grupo familiar',
    example: 'token123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupo familiar encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        uuid: { type: 'string', example: 'aB3x9K2m' },
        leader: { type: 'string', example: 'nP7vQ8rT' },
        tokenApp: { type: 'string', example: 'token123' },
        maxMembers: { type: 'number', example: 8 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        users: {
          type: 'array',
          description: 'Lista de usuarios miembros del grupo',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              uuid: { type: 'string' },
              rut: { type: 'string' },
              email: { type: 'string' },
              username: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Grupo familiar no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Grupo familiar no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Get('family-groups/token/:tokenApp')
  getFamilyGroupByToken(@Param('tokenApp') tokenApp: string) {
    return this.multiuserService.getFamilyGroupByToken(tokenApp);
  }

  @ApiOperation({ 
    summary: 'Actualizar grupo familiar',
    description: 'Actualiza la información de un grupo familiar existente. Solo el líder del grupo puede realizar actualizaciones. Se pueden modificar el token de aplicación, el número máximo de miembros y el líder (con validaciones).'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del grupo familiar a actualizar',
    example: 'aB3x9K2m'
  })
  @ApiBody({
    description: 'Datos del grupo familiar a actualizar',
    schema: {
      type: 'object',
      properties: {
        leader: {
          type: 'string',
          description: 'Nuevo UUID del usuario líder (debe existir y ser válido)',
          example: 'nP7vQ8rT',
          minLength: 8,
          maxLength: 8
        },
        tokenApp: {
          type: 'string',
          description: 'Nuevo token de la aplicación',
          example: 'newToken456'
        },
        maxMembers: {
          type: 'number',
          description: 'Nuevo número máximo de miembros (1-8)',
          example: 6,
          minimum: 1,
          maximum: 8
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupo familiar actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        uuid: { type: 'string', example: 'aB3x9K2m' },
        leader: { type: 'string', example: 'nP7vQ8rT' },
        tokenApp: { type: 'string', example: 'newToken456' },
        maxMembers: { type: 'number', example: 6 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo el líder del grupo puede actualizar el grupo',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Solo el líder del grupo puede actualizar el grupo' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Grupo familiar no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Grupo familiar no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Patch('family-groups/:uuid')
  updateFamilyGroup(
    @Param('uuid') uuid: string, 
    @Body() updateFamilyGroupDto: UpdateFamilyGroupDto,
    @Headers('x-user-uuid') leaderUuid?: string
  ) {
    return this.multiuserService.updateFamilyGroup(uuid, updateFamilyGroupDto, leaderUuid);
  }

  @ApiOperation({ 
    summary: 'Eliminar grupo familiar',
    description: 'Elimina un grupo familiar del sistema. Esta operación también elimina todos los usuarios asociados al grupo (cascade delete). Esta es una operación irreversible.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del grupo familiar a eliminar',
    example: 'aB3x9K2m'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupo familiar eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Grupo familiar eliminado exitosamente' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Grupo familiar no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Grupo familiar no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Delete('family-groups/:uuid')
  deleteFamilyGroup(
    @Param('uuid') uuid: string,
    @Headers('x-user-uuid') leaderUuid?: string
  ) {
    return this.multiuserService.deleteFamilyGroup(uuid, leaderUuid);
  }

  // ===== UTILIDADES =====
  @ApiOperation({ 
    summary: 'Obtener usuarios de un grupo familiar',
    description: 'Obtiene la lista de todos los usuarios que pertenecen a un grupo familiar específico. Este endpoint es útil para ver los miembros de un grupo particular.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del grupo familiar',
    example: 'aB3x9K2m'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios del grupo obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx1234567890abcdef' },
          uuid: { type: 'string', example: 'mK8nP2xQ' },
          rut: { type: 'string', example: '87654321-5' },
          email: { type: 'string', example: 'maria@ejemplo.com' },
          username: { type: 'string', example: 'maria123' },
          firstName: { type: 'string', example: 'María' },
          lastName: { type: 'string', example: 'González' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Grupo familiar no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Grupo familiar no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Get('family-groups/:uuid/users')
  getUsersByFamilyGroup(@Param('uuid') uuid: string) {
    return this.multiuserService.getUsersByFamilyGroup(uuid);
  }




  // ===== HEALTH CHECK =====
  @ApiOperation({ 
    summary: 'Health check del microservicio',
    description: 'Verifica que el microservicio esté funcionando correctamente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Microservicio funcionando correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'multiuser-microservice' }
      }
    }
  })
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'multiuser-microservice'
    };
  }

  // ===== LÍDERES =====
  @ApiOperation({ 
    summary: 'Crear usuario líder',
    description: 'Crea un nuevo usuario líder en el sistema. Los líderes pueden crear grupos familiares. El usuario se registra tanto en este microservicio como en el sistema de formularios dinámicos. Los líderes no están asociados a grupos familiares inicialmente.'
  })
  @ApiBody({
    description: 'Datos del líder a crear',
    schema: {
      type: 'object',
      required: ['rut', 'email', 'username', 'password'],
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID corto de 8 caracteres. Si no se proporciona, se genera automáticamente',
          example: 'nP7vQ8rT',
          minLength: 8,
          maxLength: 8
        },
        rut: {
          type: 'string',
          description: 'RUT único del líder (formato: 12345678-9)',
          example: '20392017-2'
        },
        email: {
          type: 'string',
          description: 'Email único del líder',
          example: 'lider@ejemplo.com',
          format: 'email'
        },
        username: {
          type: 'string',
          description: 'Nombre de usuario único del líder (mínimo 3 caracteres)',
          example: 'lider1',
          minLength: 3
        },
        password: {
          type: 'string',
          description: 'Contraseña del líder (mínimo 6 caracteres)',
          example: 'password123',
          minLength: 6
        },
        firstName: {
          type: 'string',
          description: 'Nombre del líder',
          example: 'Juan'
        },
        lastName: {
          type: 'string',
          description: 'Apellido del líder',
          example: 'Pérez'
        },
        isActive: {
          type: 'boolean',
          description: 'Estado activo del líder',
          example: true,
          default: true
        },
        isLeader: {
          type: 'boolean',
          description: 'Indica si el usuario es líder (siempre true para este endpoint)',
          example: true,
          default: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario líder creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        uuid: { type: 'string', example: 'nP7vQ8rT' },
        rut: { type: 'string', example: '12345678-9' },
        email: { type: 'string', example: 'lider@ejemplo.com' },
        username: { type: 'string', example: 'lider1' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Pérez' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Usuario con este email, username, RUT o UUID ya existe',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Usuario con este email, username, RUT o UUID ya existe' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Post('leaders')
  createLeader(@Body() createLeaderDto: CreateLeaderDto) {
    return this.multiuserService.createLeader(createLeaderDto);
  }

  @ApiOperation({ 
    summary: 'Listar todos los usuarios líderes',
    description: 'Obtiene una lista completa de todos los usuarios líderes en el sistema. Los líderes son usuarios que pueden crear grupos familiares y no están asociados a grupos familiares específicos.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de líderes obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx1234567890abcdef' },
          uuid: { type: 'string', example: 'nP7vQ8rT' },
          rut: { type: 'string', example: '20392017-2' },
          email: { type: 'string', example: 'lider@ejemplo.com' },
          username: { type: 'string', example: 'lider1' },
          firstName: { type: 'string', example: 'Juan' },
          lastName: { type: 'string', example: 'Pérez' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @Get('leaders')
  findAllLeaders() {
    return this.multiuserService.findAllLeaders();
  }

  @ApiOperation({ 
    summary: 'Obtener usuario líder por UUID',
    description: 'Obtiene la información detallada de un usuario líder específico por su UUID.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del usuario líder',
    example: 'nP7vQ8rT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario líder encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string' },
        rut: { type: 'string' },
        email: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario líder no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario líder no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })


  @ApiOperation({ 
    summary: 'Actualizar usuario líder',
    description: 'Actualiza la información de un usuario líder existente. Se pueden modificar todos los campos excepto el UUID. Si se proporciona una nueva contraseña, se encripta automáticamente. Se valida que los nuevos datos no conflictúen con otros usuarios.'
  })
  @ApiBody({
    description: 'Datos del líder a actualizar',
    schema: {
      type: 'object',
      properties: {
        rut: {
          type: 'string',
          description: 'Nuevo RUT único del líder (formato: 12345678-9)',
          example: '20392017-2'
        },
        email: {
          type: 'string',
          description: 'Nuevo email único del líder',
          example: 'nuevo@ejemplo.com',
          format: 'email'
        },
        username: {
          type: 'string',
          description: 'Nuevo nombre de usuario único del líder',
          example: 'nuevoLider',
          minLength: 3
        },
        password: {
          type: 'string',
          description: 'Nueva contraseña del líder (se encripta automáticamente)',
          example: 'nuevaPassword123',
          minLength: 6
        },
        firstName: {
          type: 'string',
          description: 'Nuevo nombre del líder',
          example: 'Nuevo Nombre'
        },
        lastName: {
          type: 'string',
          description: 'Nuevo apellido del líder',
          example: 'Nuevo Apellido'
        },
        isActive: {
          type: 'boolean',
          description: 'Nuevo estado activo del líder',
          example: true
        }
      }
    }
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del usuario líder a actualizar',
    example: 'nP7vQ8rT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario líder actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string' },
        rut: { type: 'string' },
        email: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario líder no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario líder no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Usuario con este email, username o RUT ya existe',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Usuario con este email, username o RUT ya existe' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Patch('leaders/:uuid')
  updateLeader(
    @Param('uuid') uuid: string,
    @Body() updateLeaderDto: UpdateLeaderDto
  ) {
    return this.multiuserService.updateLeader(uuid, updateLeaderDto);
  }

  @ApiOperation({ 
    summary: 'Eliminar usuario líder',
    description: 'Elimina un usuario líder del sistema. No se puede eliminar un líder que esté asociado a grupos familiares. Esta operación es irreversible y elimina permanentemente todos los datos del líder.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del usuario líder a eliminar',
    example: 'nP7vQ8rT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario líder eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuario líder eliminado exitosamente' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario líder no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario líder no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'No se puede eliminar un líder asociado a grupos familiares',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'No se puede eliminar un líder que está asociado a grupos familiares' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Delete('leaders/:uuid')
  deleteLeader(@Param('uuid') uuid: string) {
    return this.multiuserService.deleteLeader(uuid);
  }
}
