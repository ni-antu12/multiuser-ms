import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { MultiuserService } from './multiuser.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateFamilyGroupDto } from './dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from './dto/update-family-group.dto';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';

@ApiTags('multiuser')
@Controller('multiuser')
export class MultiuserController {
  constructor(private readonly multiuserService: MultiuserService) {}



  // ===== FAMILY GROUPS =====
  @ApiOperation({ 
    summary: 'Crear grupo familiar',
    description: 'Crea un nuevo grupo familiar con un UUID único, un usuario líder y un token de aplicación. El grupo puede tener hasta 8 miembros máximo. El líder debe ser un UUID válido de un usuario existente. SOLO el usuario líder puede crear el grupo familiar. Este endpoint valida que el líder existe y tiene permisos para crear grupos.'
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
    description: 'Grupo familiar creado exitosamente',
    schema: {
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

  // ===== USUARIOS =====
  @ApiOperation({ 
    summary: 'Crear usuario',
    description: 'Crea un nuevo usuario en el sistema. El usuario debe estar asociado a un grupo familiar existente. La contraseña se encripta automáticamente. Se valida que el grupo familiar tenga espacio disponible (máximo 8 miembros). Este endpoint verifica que el grupo familiar existe y tiene capacidad para nuevos miembros.'
  })
  @ApiBody({
    description: 'Datos del usuario a crear',
    schema: {
      type: 'object',
      required: ['rut', 'familyGroupsUuid', 'email', 'username', 'password'],
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID corto de 8 caracteres. Si no se proporciona, se genera automáticamente',
          example: 'mK8nP2xQ',
          minLength: 8,
          maxLength: 8
        },
        rut: {
          type: 'string',
          description: 'RUT único del usuario (formato: 12345678-9)',
          example: '87654321-5'
        },
        familyGroupsUuid: {
          type: 'string',
          description: 'UUID del grupo familiar al que pertenece',
          example: 'aB3x9K2m',
          minLength: 8,
          maxLength: 8
        },
        email: {
          type: 'string',
          description: 'Email único del usuario',
          example: 'maria@ejemplo.com',
          format: 'email'
        },
        username: {
          type: 'string',
          description: 'Nombre de usuario único (mínimo 3 caracteres)',
          example: 'maria123',
          minLength: 3
        },
        password: {
          type: 'string',
          description: 'Contraseña del usuario (mínimo 6 caracteres)',
          example: 'password123',
          minLength: 6
        },
        firstName: {
          type: 'string',
          description: 'Nombre del usuario',
          example: 'María'
        },
        lastName: {
          type: 'string',
          description: 'Apellido del usuario',
          example: 'González'
        },
        isActive: {
          type: 'boolean',
          description: 'Estado activo del usuario',
          example: true,
          default: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        uuid: { type: 'string', example: 'nP7vQ8rT' },
        rut: { type: 'string', example: '12345678-9' },
        familyGroupsUuid: { type: 'string', example: 'aB3x9K2m' },
        email: { type: 'string', example: 'usuario@ejemplo.com' },
        username: { type: 'string', example: 'usuario1' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Pérez' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        familyGroup: {
          type: 'object',
          properties: {
            uuid: { type: 'string', example: 'aB3x9K2m' },
            leader: { type: 'string', example: 'nP7vQ8rT' },
            tokenApp: { type: 'string', example: 'token123' }
          }
        }
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
  @ApiResponse({ 
    status: 409, 
    description: 'El grupo familiar ya tiene el máximo de miembros permitidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'El grupo familiar ya tiene el máximo de 8 miembros permitidos' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.multiuserService.createUser(createUserDto);
  }

  @ApiOperation({ 
    summary: 'Listar todos los usuarios',
    description: 'Obtiene una lista completa de todos los usuarios en el sistema, incluyendo información de sus grupos familiares. Este endpoint es útil para administración, monitoreo del sistema y auditoría. Retorna información detallada de cada usuario y su grupo asociado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx1234567890abcdef' },
          uuid: { type: 'string', example: 'mK8nP2xQ' },
          rut: { type: 'string', example: '87654321-5' },
          familyGroupsUuid: { type: 'string', example: 'aB3x9K2m' },
          email: { type: 'string', example: 'maria@ejemplo.com' },
          username: { type: 'string', example: 'maria123' },
          firstName: { type: 'string', example: 'María' },
          lastName: { type: 'string', example: 'González' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          familyGroup: {
            type: 'object',
            properties: {
              uuid: { type: 'string', example: 'aB3x9K2m' },
              leader: { type: 'string', example: 'nP7vQ8rT' },
              tokenApp: { type: 'string', example: 'token123' }
            }
          }
        }
      }
    }
  })
  @Get('users')
  findAllUsers() {
    return this.multiuserService.findAllUsers();
  }



  @ApiOperation({ 
    summary: 'Actualizar usuario',
    description: 'Actualiza la información de un usuario existente. Se pueden modificar todos los campos excepto el UUID. Si se proporciona una nueva contraseña, se encripta automáticamente. Se valida que los nuevos datos no conflictúen con otros usuarios.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del usuario a actualizar',
    example: 'mK8nP2xQ'
  })
  @ApiBody({
    description: 'Datos del usuario a actualizar',
    schema: {
      type: 'object',
      properties: {
        rut: {
          type: 'string',
          description: 'Nuevo RUT único del usuario (formato: 12345678-9)',
          example: '87654321-5'
        },
        familyGroupsUuid: {
          type: 'string',
          description: 'Nuevo UUID del grupo familiar',
          example: 'aB3x9K2m',
          minLength: 8,
          maxLength: 8
        },
        email: {
          type: 'string',
          description: 'Nuevo email único del usuario',
          example: 'nuevo@ejemplo.com',
          format: 'email'
        },
        username: {
          type: 'string',
          description: 'Nuevo nombre de usuario único',
          example: 'nuevoUsuario',
          minLength: 3
        },
        password: {
          type: 'string',
          description: 'Nueva contraseña (se encripta automáticamente)',
          example: 'nuevaPassword123',
          minLength: 6
        },
        firstName: {
          type: 'string',
          description: 'Nuevo nombre del usuario',
          example: 'Nuevo Nombre'
        },
        lastName: {
          type: 'string',
          description: 'Nuevo apellido del usuario',
          example: 'Nuevo Apellido'
        },
        isActive: {
          type: 'boolean',
          description: 'Nuevo estado activo del usuario',
          example: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        uuid: { type: 'string', example: 'mK8nP2xQ' },
        rut: { type: 'string', example: '87654321-5' },
        familyGroupsUuid: { type: 'string', example: 'aB3x9K2m' },
        email: { type: 'string', example: 'nuevo@ejemplo.com' },
        username: { type: 'string', example: 'nuevoUsuario' },
        firstName: { type: 'string', example: 'Nuevo Nombre' },
        lastName: { type: 'string', example: 'Nuevo Apellido' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
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
  @Patch('users/:uuid')
  updateUser(
    @Param('uuid') uuid: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Headers('x-user-uuid') requestingUserUuid?: string
  ) {
    return this.multiuserService.updateUser(uuid, updateUserDto, requestingUserUuid);
  }

  @ApiOperation({ 
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario del sistema. Esta operación es irreversible y elimina permanentemente todos los datos del usuario.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del usuario a eliminar',
    example: 'mK8nP2xQ'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuario eliminado exitosamente' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Delete('users/:uuid')
  deleteUser(
    @Param('uuid') uuid: string,
    @Headers('x-user-uuid') requestingUserUuid?: string
  ) {
    return this.multiuserService.deleteUser(uuid, requestingUserUuid);
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



  // ===== GESTIÓN DE MIEMBROS =====
  @ApiOperation({ 
    summary: 'Obtener información detallada de miembros del grupo',
    description: 'Obtiene información completa sobre los miembros de un grupo familiar, incluyendo estadísticas como número actual de miembros, espacios disponibles, si el grupo está lleno, y lista detallada de todos los usuarios. Este endpoint proporciona una vista completa del estado del grupo y sus miembros.'
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del grupo familiar',
    example: 'aB3x9K2m'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Información de miembros obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        uuid: { type: 'string', example: 'aB3x9K2m' },
        leader: { type: 'string', example: 'nP7vQ8rT' },
        maxMembers: { type: 'number', example: 8 },
        currentMembers: { type: 'number', example: 3 },
        availableSlots: { type: 'number', example: 5 },
        isFull: { type: 'boolean', example: false },
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
  @Get('family-groups/:uuid/members-info')
  getFamilyGroupMembersInfo(@Param('uuid') uuid: string) {
    return this.multiuserService.getFamilyGroupMembersInfo(uuid);
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

  // ===== VALIDACIÓN DE LÍDER =====
  @ApiOperation({ 
    summary: 'Validar usuario líder',
    description: 'Valida si un usuario existe como líder en el microservicio de formularios dinámicos'
  })
  @ApiParam({
    name: 'leaderUuid',
    description: 'UUID del usuario líder a validar',
    example: 'nP7vQ8rT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Validación completada',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: true },
        isLeader: { type: 'boolean', example: true },
        userData: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        }
      }
    }
  })


  // ===== CLOUD RUN CONNECTIVITY =====
  @ApiOperation({ 
    summary: 'Verificar conectividad con Cloud Run',
    description: 'Verifica la conectividad con el microservicio de formularios dinámicos en Cloud Run'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conectividad verificada',
    schema: {
      type: 'object',
      properties: {
        cloudRunConfigured: { type: 'boolean', example: true },
        serviceUrl: { type: 'string', example: 'https://forms-microservice.run.app' },
        isAvailable: { type: 'boolean', example: true },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Servicio de formularios no disponible',
    schema: {
      type: 'object',
      properties: {
        cloudRunConfigured: { type: 'boolean', example: true },
        serviceUrl: { type: 'string', example: 'https://forms-microservice.run.app' },
        isAvailable: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Service unavailable' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @Get('cloud-run-status')
  async getCloudRunStatus() {
    const isAvailable = await this.multiuserService.isFormsMicroserviceAvailable();
    const serviceUrl = this.multiuserService.getFormsMicroserviceUrl();
    const cloudRunConfigured = this.multiuserService.isCloudRunConfigured();

    if (isAvailable) {
      return {
        cloudRunConfigured,
        serviceUrl,
        isAvailable,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new HttpException({
        cloudRunConfigured,
        serviceUrl,
        isAvailable,
        error: 'Service unavailable',
        timestamp: new Date().toISOString()
      }, HttpStatus.SERVICE_UNAVAILABLE);
    }
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
    description: 'Obtiene una lista completa de todos los usuarios líderes en el sistema. Los líderes son usuarios que pueden crear grupos familiares.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios líderes obtenida exitosamente',
    schema: {
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
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
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
