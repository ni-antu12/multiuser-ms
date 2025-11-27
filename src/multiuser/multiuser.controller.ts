import { Controller, Get, Post, Body, Param, Delete, Headers, HttpException, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { MultiuserService } from './multiuser.service';
import { CreateMyFamilyGroupDto } from './dto/create-my-family-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { EnsureFamilyGroupDto } from './dto/ensure-family-group.dto';
import { RutAuthGuard } from '../auth/guards/rut-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { EnsureFamilyGroupFromRutInterceptor } from '../auth/interceptors/ensure-family-group-from-rut.interceptor';

@ApiTags('multiuser')
@Controller('multiuser')
@UseGuards(RutAuthGuard)
@UseInterceptors(EnsureFamilyGroupFromRutInterceptor)
export class MultiuserController {
  constructor(private readonly multiuserService: MultiuserService) {}

  // ===== FAMILY GROUPS =====
  @ApiOperation({ 
    summary: '🏥 Crear/obtener mi grupo familiar',
    description: 'Garantiza que el usuario autenticado tenga un grupo familiar. Si no existe, lo crea automáticamente y lo asigna como líder. El usuario se obtiene del token JWT enviado en el header Authorization. El grupo familiar se asegura automáticamente en cada petición autenticada.'
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
  @ApiHeader({
    name: 'X-User-RUT',
    required: true,
    description: 'RUT del usuario autenticado (obtenido de la sesión local de la app móvil)',
    example: '12345678-9'
  })
  createMyFamilyGroup(
    @CurrentUser() user: any,
    @Body() createMyFamilyGroupDto?: CreateMyFamilyGroupDto
  ) {
    if (!user?.rut) {
      throw new HttpException(
        'No se pudo obtener el RUT del usuario',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // El grupo familiar ya se aseguró automáticamente por el interceptor
    // Este endpoint ahora solo retorna la información del grupo existente o recién creado
    return this.multiuserService.createMyFamilyGroupSimple(user.rut);
  }

  @ApiOperation({
    summary: '🔐 Inicializar sesión y garantizar grupo familiar',
    description: 'Endpoint principal para el login de la app móvil. Garantiza que el usuario tenga un grupo familiar propio. Si no existe, crea el usuario y su grupo familiar automáticamente. Este endpoint debe llamarse después del login exitoso en el servicio de autenticación para asociar al usuario con su grupo familiar.'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario y grupo familiar garantizados. Retorna información completa del usuario y su grupo familiar.',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            uuid: { type: 'string', example: 'nP7vQ8rT' },
            rut: { type: 'string', example: '12345678-9' },
            email: { type: 'string', example: 'usuario@ejemplo.com' },
            firstName: { type: 'string', example: 'Juan' },
            lastNamePaterno: { type: 'string', example: 'Pérez' },
            isLeader: { type: 'boolean', example: true },
            familyGroupsUuid: { type: 'string', example: 'aB3x9K2m' }
          }
        },
        familyGroup: {
          type: 'object',
          properties: {
            uuid: { type: 'string', example: 'aB3x9K2m' },
            leader: { type: 'string', example: 'nP7vQ8rT' },
            tokenApp: { type: 'string', example: 'token123' },
            maxMembers: { type: 'number', example: 8 }
          }
        },
        createdUser: { type: 'boolean', example: false },
        createdGroup: { type: 'boolean', example: false },
        message: { type: 'string', example: 'El usuario ya contaba con un grupo familiar' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'RUT inválido o faltante'
  })
  @Post('session/init')
  initSession(
    @CurrentUser() user: any,
    @Body() ensureFamilyGroupDto?: EnsureFamilyGroupDto
  ) {
    // Si el usuario viene del guard, usar su RUT
    const rut = user?.rut || ensureFamilyGroupDto?.rut;
    
    if (!rut) {
      throw new HttpException(
        'RUT es requerido. Envíalo en el header X-User-RUT o en el body',
        HttpStatus.BAD_REQUEST
      );
    }

    // Usar los datos del usuario del guard si están disponibles, o los del body
    return this.multiuserService.ensureFamilyGroupForUser({
      rut,
      email: user?.email || ensureFamilyGroupDto?.email,
      firstName: user?.firstName || ensureFamilyGroupDto?.firstName,
      lastNamePaterno: user?.lastNamePaterno || ensureFamilyGroupDto?.lastNamePaterno,
      lastNameMaterno: user?.lastNameMaterno || ensureFamilyGroupDto?.lastNameMaterno,
    });
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
    return this.multiuserService.getFamilyGroupMembers(uuid);
  }

  @ApiOperation({
    summary: 'Agregar miembro a grupo familiar',
    description: 'Agrega un nuevo miembro a un grupo familiar existente. Si el usuario ya existe en el sistema pero no está en un grupo, lo agrega al grupo. Si no existe, crea un nuevo usuario.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del grupo familiar',
    example: 'Y9juNwPL'
  })
  @ApiBody({
    type: AddMemberDto,
    description: 'Datos del nuevo miembro'
  })
  @ApiResponse({
    status: 201,
    description: 'Miembro agregado exitosamente',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            uuid: { type: 'string' },
            rut: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            isLeader: { type: 'boolean' },
            familyGroupsUuid: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        message: { type: 'string', example: 'Miembro agregado al grupo familiar exitosamente' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo familiar no encontrado',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Grupo familiar no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto. El grupo está lleno o el usuario ya pertenece a otro grupo.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'El grupo familiar ha alcanzado el máximo de miembros' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Post('family-groups/:uuid/members')
  @ApiHeader({
    name: 'X-User-RUT',
    required: true,
    description: 'RUT del líder del grupo familiar',
    example: '12345678-9'
  })
  addMemberToFamilyGroup(
    @Param('uuid') uuid: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: any
  ) {
    return this.multiuserService.addMemberToFamilyGroup(uuid, addMemberDto, user?.uuid);
  }

  @ApiOperation({
    summary: 'Eliminar miembro de un grupo familiar',
    description: 'El líder del grupo puede eliminar a un miembro específico.'
  })
  @Delete('family-groups/:uuid/members/:memberUuid')
  @ApiHeader({
    name: 'X-User-RUT',
    required: true,
    description: 'RUT del líder del grupo familiar',
    example: '12345678-9'
  })
  removeMemberFromFamilyGroup(
    @Param('uuid') uuid: string,
    @Param('memberUuid') memberUuid: string,
    @CurrentUser() user: any
  ) {
    if (!user?.uuid) {
      throw new HttpException('No se pudo obtener el UUID del usuario', HttpStatus.BAD_REQUEST);
    }
    return this.multiuserService.removeMemberFromFamilyGroup(uuid, memberUuid, user.uuid);
  }

  @ApiOperation({
    summary: 'Abandonar grupo familiar',
    description: 'Permite que un miembro abandone el grupo al que pertenece.'
  })
  @Post('family-groups/members/leave')
  @ApiHeader({
    name: 'X-User-RUT',
    required: true,
    description: 'RUT del usuario que abandona el grupo',
    example: '12345678-9'
  })
  leaveFamilyGroup(@CurrentUser() user: any) {
    if (!user?.uuid) {
      throw new HttpException('No se pudo obtener el UUID del usuario', HttpStatus.BAD_REQUEST);
    }
    return this.multiuserService.leaveFamilyGroup(user.uuid);
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
  @Public()
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
  @Get('leaders/:uuid')
  findOneLeader(@Param('uuid') uuid: string) {
    console.log('🔍 GET /multiuser/leaders/:uuid llamado con UUID:', uuid);
    return this.multiuserService.findLeaderByUuid(uuid);
  }

  @Get('leaders')
  findAllLeaders() {
    return this.multiuserService.findAllLeaders();
  }

}
