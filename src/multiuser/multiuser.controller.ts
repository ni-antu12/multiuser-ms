import { Controller, Get, Post, Body, Param, Delete, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { MultiuserService } from './multiuser.service';
import { CreateMyFamilyGroupDto } from './dto/create-my-family-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { EnsureFamilyGroupDto } from './dto/ensure-family-group.dto';
import { PatientLoginDto } from './dto/patient-login.dto';

@ApiTags('multiuser')
@Controller('multiuser')
export class MultiuserController {
  constructor(private readonly multiuserService: MultiuserService) {}

  // ===== FAMILY GROUPS =====
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
    console.log('🎯 Controller: createMyFamilyGroup llamado con RUT:', userRut);
    if (!userRut) {
      console.log('❌ Controller: Header X-User-RUT faltante');
      throw new HttpException(
        'El header X-User-RUT es requerido',
        HttpStatus.BAD_REQUEST
      );
    }
    console.log('✅ Controller: Llamando al servicio SIMPLE...');
    
    // MÉTODO SIMPLE: Crear datos básicos directamente
    return this.multiuserService.createMyFamilyGroupSimple(userRut, createMyFamilyGroupDto);
  }

  @ApiOperation({
    summary: 'Asegurar grupo familiar para usuario autenticado',
    description: 'Garantiza que el usuario tenga un grupo familiar propio. Si no existe, lo crea y lo asigna como líder.'
  })
  @ApiResponse({
    status: 200,
    description: 'Información del grupo y usuario retornada'
  })
  @Post('session/ensure-group')
  ensureFamilyGroup(@Body() ensureFamilyGroupDto: EnsureFamilyGroupDto) {
    return this.multiuserService.ensureFamilyGroupForUser(ensureFamilyGroupDto);
  }

  @ApiOperation({
    summary: 'Login básico (simulación centro médico)',
    description: 'Autentica al paciente contra la base local de pacientes usando rut y contraseña y garantiza su grupo familiar.'
  })
  @Post('session/login')
  loginPatient(@Body() patientLoginDto: PatientLoginDto) {
    return this.multiuserService.loginPatient(patientLoginDto);
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
  addMemberToFamilyGroup(
    @Param('uuid') uuid: string,
    @Body() addMemberDto: AddMemberDto,
    @Headers('x-user-uuid') leaderUuid?: string
  ) {
    return this.multiuserService.addMemberToFamilyGroup(uuid, addMemberDto, leaderUuid);
  }

  @ApiOperation({
    summary: 'Eliminar miembro de un grupo familiar',
    description: 'El líder del grupo puede eliminar a un miembro específico.'
  })
  @Delete('family-groups/:uuid/members/:memberUuid')
  removeMemberFromFamilyGroup(
    @Param('uuid') uuid: string,
    @Param('memberUuid') memberUuid: string,
    @Headers('x-user-uuid') leaderUuid: string
  ) {
    return this.multiuserService.removeMemberFromFamilyGroup(uuid, memberUuid, leaderUuid);
  }

  @ApiOperation({
    summary: 'Abandonar grupo familiar',
    description: 'Permite que un miembro abandone el grupo al que pertenece.'
  })
  @Post('family-groups/members/leave')
  leaveFamilyGroup(@Headers('x-user-uuid') userUuid: string) {
    if (!userUuid) {
      throw new HttpException('El header X-User-UUID es requerido', HttpStatus.BAD_REQUEST);
    }
    return this.multiuserService.leaveFamilyGroup(userUuid);
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
