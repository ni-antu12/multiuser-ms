import { Injectable, NotFoundException, ConflictException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormsMicroserviceService } from './forms-microservice.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateFamilyGroupDto } from './dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from './dto/update-family-group.dto';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MultiuserService {
  constructor(
    private prisma: PrismaService,
    private formsMicroserviceService: FormsMicroserviceService
  ) {}

  // ===== FAMILY GROUPS =====
  async createFamilyGroup(createFamilyGroupDto: CreateFamilyGroupDto, requestingUserUuid?: string) {
    const { uuid, leader, tokenApp, maxMembers = 8 } = createFamilyGroupDto;

    // Verificar si el grupo familiar ya existe
    const existingGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid }
    });

    if (existingGroup) {
      throw new ConflictException('Grupo familiar con este UUID ya existe');
    }

    // Validar que el líder existe en el microservicio de formularios dinámicos
    try {
      const leaderValidation = await this.formsMicroserviceService.validateLeader(leader);
      
      if (!leaderValidation.exists) {
        throw new NotFoundException('El usuario líder no existe en el sistema de formularios dinámicos');
      }

      if (!leaderValidation.isLeader) {
        throw new ForbiddenException('El usuario especificado no tiene permisos de líder');
      }
    } catch (error) {
      // En desarrollo, verificar que el líder existe localmente si el microservicio no está disponible
      console.warn('Microservicio de formularios no disponible, validando líder localmente:', error.message);
      
      const localLeader = await this.prisma.user.findFirst({
        where: {
          uuid: leader,
          familyGroupsUuid: null // Solo líderes
        }
      });

      if (!localLeader) {
        throw new NotFoundException('El usuario líder no existe en el sistema local');
      }
    }

    // Validar que solo el usuario líder puede crear el grupo familiar
    if (requestingUserUuid && requestingUserUuid !== leader) {
      throw new ForbiddenException('Solo el usuario líder puede crear el grupo familiar');
    }

    // Crear grupo familiar
    const familyGroup = await this.prisma.familyGroup.create({
      data: {
        uuid,
        leader,
        tokenApp,
        maxMembers,
      }
    });

    return familyGroup;
  }

  async findAllFamilyGroups() {
    return this.prisma.familyGroup.findMany({
      include: {
        users: {
          select: {
            id: true,
            uuid: true,
            rut: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });
  }

  async findFamilyGroupByUuid(uuid: string) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid },
      include: {
        users: {
          select: {
            id: true,
            uuid: true,
            rut: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup;
  }

  async updateFamilyGroup(uuid: string, updateFamilyGroupDto: UpdateFamilyGroupDto, leaderUuid?: string) {
    // Verificar si el grupo familiar existe
    const existingGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid }
    });

    if (!existingGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    // Validar permisos de líder si se proporciona leaderUuid
    if (leaderUuid) {
      const hasPermissions = await this.validateFamilyGroupPermissions(leaderUuid, uuid);
      if (!hasPermissions) {
        throw new ForbiddenException('Solo líderes del mismo grupo familiar pueden modificar el grupo');
      }
    }

    // Si se está actualizando el líder, validar que existe en el microservicio de formularios
    if (updateFamilyGroupDto.leader && updateFamilyGroupDto.leader !== existingGroup.leader) {
      const leaderValidation = await this.formsMicroserviceService.validateLeader(updateFamilyGroupDto.leader);
      
      if (!leaderValidation.exists) {
        throw new NotFoundException('El nuevo usuario líder no existe en el sistema de formularios dinámicos');
      }

      if (!leaderValidation.isLeader) {
        throw new ForbiddenException('El usuario especificado no tiene permisos de líder');
      }
    }

    // Actualizar grupo familiar
    const familyGroup = await this.prisma.familyGroup.update({
      where: { uuid },
      data: updateFamilyGroupDto
    });

    return familyGroup;
  }

  async deleteFamilyGroup(uuid: string, leaderUuid?: string) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    // Validar permisos de líder si se proporciona leaderUuid
    if (leaderUuid) {
      const hasPermissions = await this.validateFamilyGroupPermissions(leaderUuid, uuid);
      if (!hasPermissions) {
        throw new ForbiddenException('Solo líderes del mismo grupo familiar pueden eliminar el grupo');
      }
    }

    await this.prisma.familyGroup.delete({
      where: { uuid }
    });

    return { message: 'Grupo familiar eliminado correctamente' };
  }

  // ===== USUARIOS =====
  async createUser(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username },
          { rut: userData.rut },
          { uuid: userData.uuid }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException('Usuario con este email, username, RUT o UUID ya existe');
    }

    // Verificar que el grupo familiar existe
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: userData.familyGroupsUuid },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    // Verificar si el grupo familiar tiene espacio disponible
    if (familyGroup._count.users >= familyGroup.maxMembers) {
      throw new ConflictException(`El grupo familiar ya tiene el máximo de ${familyGroup.maxMembers} miembros permitidos`);
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        uuid: userData.uuid,
        rut: userData.rut,
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive,
        isLeader: userData.isLeader || false,
        familyGroup: {
          connect: {
            uuid: userData.familyGroupsUuid
          }
        }
      },
      select: {
        id: true,
        uuid: true,
        rut: true,
        familyGroupsUuid: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true,
        familyGroup: {
          select: {
            uuid: true,
            leader: true,
            tokenApp: true
          }
        }
      }
    });

    return user;
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        uuid: true,
        rut: true,
        familyGroupsUuid: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true,
        familyGroup: {
          select: {
            uuid: true,
            leader: true,
            tokenApp: true
          }
        }
      }
    });
  }

  async findUserByUuid(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      select: {
        id: true,
        uuid: true,
        rut: true,
        familyGroupsUuid: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true,
        familyGroup: {
          select: {
            uuid: true,
            leader: true,
            tokenApp: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si el usuario NO es líder, solo retornar información del grupo familiar
    if (!user.isLeader) {
      return {
        id: user.id,
        uuid: user.uuid,
        rut: user.rut,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isLeader: user.isLeader,
        familyGroup: user.familyGroup
      };
    }

    return user;
  }

  async findUserByRut(rut: string) {
    const user = await this.prisma.user.findUnique({
      where: { rut },
      select: {
        id: true,
        uuid: true,
        rut: true,
        familyGroupsUuid: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true,
        familyGroup: {
          select: {
            uuid: true,
            leader: true,
            tokenApp: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si el usuario NO es líder, solo retornar información del grupo familiar
    if (!user.isLeader) {
      return {
        id: user.id,
        uuid: user.uuid,
        rut: user.rut,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isLeader: user.isLeader,
        familyGroup: user.familyGroup
      };
    }

    return user;
  }

  async updateUser(uuid: string, updateUserDto: UpdateUserDto, requestingUserUuid?: string) {
    const { password, ...userData } = updateUserDto;

    // Verificar si el usuario existe
    const existingUser = await this.prisma.user.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        familyGroupsUuid: true,
        isLeader: true
      }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos: solo líderes pueden actualizar otros usuarios
    // Los usuarios pueden actualizarse a sí mismos
    if (requestingUserUuid && requestingUserUuid !== uuid) {
      const hasLeaderPermissions = await this.validateLeaderPermissions(requestingUserUuid);
      if (!hasLeaderPermissions) {
        throw new ForbiddenException('Solo líderes pueden actualizar otros usuarios');
      }

      // Si es líder, debe pertenecer al mismo grupo familiar que el usuario a actualizar
      if (existingUser.familyGroupsUuid) {
        const hasGroupPermissions = await this.validateFamilyGroupPermissions(requestingUserUuid, existingUser.familyGroupsUuid);
        if (!hasGroupPermissions) {
          throw new ForbiddenException('Solo líderes del mismo grupo familiar pueden actualizar este usuario');
        }
      }
    }

    // Si se está actualizando la contraseña, encriptarla
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Actualizar usuario
    const user = await this.prisma.user.update({
      where: { uuid },
      data: {
        ...userData,
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        uuid: true,
        rut: true,
        familyGroupsUuid: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true,
        familyGroup: {
          select: {
            uuid: true,
            leader: true,
            tokenApp: true
          }
        }
      }
    });

    return user;
  }

  async deleteUser(uuid: string, requestingUserUuid?: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        familyGroupsUuid: true,
        isLeader: true
      }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos: solo líderes pueden eliminar otros usuarios
    // Los usuarios pueden eliminarse a sí mismos
    if (requestingUserUuid && requestingUserUuid !== uuid) {
      const hasLeaderPermissions = await this.validateLeaderPermissions(requestingUserUuid);
      if (!hasLeaderPermissions) {
        throw new ForbiddenException('Solo líderes pueden eliminar otros usuarios');
      }

      // Si es líder, debe pertenecer al mismo grupo familiar que el usuario a eliminar
      if (user.familyGroupsUuid) {
        const hasGroupPermissions = await this.validateFamilyGroupPermissions(requestingUserUuid, user.familyGroupsUuid);
        if (!hasGroupPermissions) {
          throw new ForbiddenException('Solo líderes del mismo grupo familiar pueden eliminar este usuario');
        }
      }
    }

    await this.prisma.user.delete({
      where: { uuid }
    });

    return { message: 'Usuario eliminado correctamente' };
  }

  // ===== UTILIDADES =====
  async getUsersByFamilyGroup(familyGroupUuid: string) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid },
      include: {
        users: {
          select: {
            id: true,
            uuid: true,
            rut: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup.users;
  }

  async isUserLeader(userUuid: string, familyGroupUuid: string): Promise<boolean> {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup.leader === userUuid;
  }

  async getFamilyGroupByToken(tokenApp: string) {
    const familyGroup = await this.prisma.familyGroup.findFirst({
      where: { tokenApp },
      include: {
        users: {
          select: {
            id: true,
            uuid: true,
            rut: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup;
  }

  // ===== MÉTODOS PARA GESTIÓN DE MIEMBROS =====
  async getFamilyGroupMembersInfo(familyGroupUuid: string) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid },
      include: {
        users: {
          select: {
            id: true,
            uuid: true,
            rut: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return {
      uuid: familyGroup.uuid,
      leader: familyGroup.leader,
      maxMembers: familyGroup.maxMembers,
      currentMembers: familyGroup._count.users,
      availableSlots: familyGroup.maxMembers - familyGroup._count.users,
      isFull: familyGroup._count.users >= familyGroup.maxMembers,
      users: familyGroup.users
    };
  }

  async canAddMemberToFamilyGroup(familyGroupUuid: string): Promise<boolean> {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup._count.users < familyGroup.maxMembers;
  }

  // ===== VALIDACIÓN DE LÍDER =====
  async validateLeader(leaderUuid: string) {
    return this.formsMicroserviceService.validateLeader(leaderUuid);
  }

  // ===== MÉTODOS PARA CLOUD RUN =====
  /**
   * Verifica si el microservicio de formularios está disponible
   * @returns true si está disponible, false en caso contrario
   */
  async isFormsMicroserviceAvailable(): Promise<boolean> {
    return this.formsMicroserviceService.isServiceAvailable();
  }

  /**
   * Obtiene la URL del microservicio de formularios
   * @returns URL del microservicio
   */
  getFormsMicroserviceUrl(): string {
    return this.formsMicroserviceService.getServiceUrl();
  }

  /**
   * Verifica si está configurado para Cloud Run
   * @returns true si es una URL de Cloud Run
   */
  isCloudRunConfigured(): boolean {
    return this.formsMicroserviceService.isCloudRunConfigured();
  }

  // ===== LÍDERES =====
  /**
   * Crea un nuevo usuario líder
   * @param createLeaderDto Datos del líder a crear
   * @returns Usuario líder creado
   */
  async createLeader(createLeaderDto: CreateLeaderDto) {
    const { uuid, rut, email, username, password, firstName, lastName, isActive = true } = createLeaderDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { rut },
          ...(uuid ? [{ uuid }] : [])
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException('Usuario con este email, username, RUT o UUID ya existe');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario líder
    const leader = await this.prisma.user.create({
      data: {
        uuid: uuid || this.generateShortUuid(),
        rut,
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        isActive,
        // Los líderes no están asociados a un grupo familiar inicialmente
        familyGroupsUuid: null
      }
    });

    // Registrar al líder en el microservicio de formularios dinámicos
    try {
      await this.formsMicroserviceService.registerLeader(leader.uuid, {
        email: leader.email,
        firstName: leader.firstName,
        lastName: leader.lastName,
        isActive: leader.isActive
      });
    } catch (error) {
      // En desarrollo, solo log el error pero no fallar
      console.warn('Microservicio de formularios no disponible, continuando sin registro:', error.message);
      // En producción, descomentar las siguientes líneas:
      // await this.prisma.user.delete({
      //   where: { uuid: leader.uuid }
      // });
      // throw new HttpException(
      //   'Error al registrar el líder en el sistema de formularios dinámicos',
      //   HttpStatus.SERVICE_UNAVAILABLE
      // );
    }

    return leader;
  }

  /**
   * Obtiene todos los usuarios líderes
   * @returns Lista de usuarios líderes
   */
  async findAllLeaders() {
    return this.prisma.user.findMany({
      where: {
        familyGroupsUuid: null // Los líderes no están asociados a grupos familiares
      },
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Obtiene un usuario líder por UUID
   * @param uuid UUID del líder
   * @returns Usuario líder
   */
  async findLeaderByUuid(uuid: string) {
    const leader = await this.prisma.user.findFirst({
      where: {
        uuid,
        familyGroupsUuid: null
      },
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!leader) {
      throw new NotFoundException('Usuario líder no encontrado');
    }

    return leader;
  }

  /**
   * Actualiza un usuario líder
   * @param uuid UUID del líder
   * @param updateLeaderDto Datos a actualizar
   * @returns Usuario líder actualizado
   */
  async updateLeader(uuid: string, updateLeaderDto: UpdateLeaderDto) {
    // Verificar si el líder existe
    const existingLeader = await this.prisma.user.findFirst({
      where: {
        uuid,
        familyGroupsUuid: null
      }
    });

    if (!existingLeader) {
      throw new NotFoundException('Usuario líder no encontrado');
    }

    // Verificar si los nuevos datos no conflictúan con otros usuarios
    if (updateLeaderDto.email || updateLeaderDto.username || updateLeaderDto.rut) {
      const conflictingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(updateLeaderDto.email ? [{ email: updateLeaderDto.email }] : []),
            ...(updateLeaderDto.username ? [{ username: updateLeaderDto.username }] : []),
            ...(updateLeaderDto.rut ? [{ rut: updateLeaderDto.rut }] : [])
          ],
          NOT: { uuid }
        }
      });

      if (conflictingUser) {
        throw new ConflictException('Usuario con este email, username o RUT ya existe');
      }
    }

    // Preparar datos de actualización
    const updateData: any = { ...updateLeaderDto };
    
    // Encriptar contraseña si se proporciona
    if (updateLeaderDto.password) {
      updateData.password = await bcrypt.hash(updateLeaderDto.password, 10);
    }

    // Actualizar líder
    const updatedLeader = await this.prisma.user.update({
      where: { uuid },
      data: updateData,
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Actualizar en el microservicio de formularios dinámicos
    try {
      await this.formsMicroserviceService.updateLeader(uuid, {
        email: updatedLeader.email,
        firstName: updatedLeader.firstName,
        lastName: updatedLeader.lastName,
        isActive: updatedLeader.isActive
      });
    } catch (error) {
      console.error('Error al actualizar líder en microservicio de formularios:', error);
    }

    return updatedLeader;
  }

  /**
   * Elimina un usuario líder
   * @param uuid UUID del líder
   * @returns Confirmación de eliminación
   */
  async deleteLeader(uuid: string) {
    // Verificar si el líder existe
    const existingLeader = await this.prisma.user.findFirst({
      where: {
        uuid,
        familyGroupsUuid: null
      }
    });

    if (!existingLeader) {
      throw new NotFoundException('Usuario líder no encontrado');
    }

    // Verificar si el líder está asociado a algún grupo familiar
    const associatedGroups = await this.prisma.familyGroup.findMany({
      where: { leader: uuid }
    });

    if (associatedGroups.length > 0) {
      throw new ConflictException('No se puede eliminar un líder que está asociado a grupos familiares');
    }

    // Eliminar del microservicio de formularios dinámicos
    try {
      await this.formsMicroserviceService.deleteLeader(uuid);
    } catch (error) {
      console.error('Error al eliminar líder del microservicio de formularios:', error);
    }

    // Eliminar líder
    await this.prisma.user.delete({
      where: { uuid }
    });

    return { message: 'Usuario líder eliminado exitosamente' };
  }

  /**
   * Valida si un usuario tiene permisos de líder
   * @param userUuid UUID del usuario a validar
   * @returns true si es líder, false si no
   */
  private async validateLeaderPermissions(userUuid: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userUuid },
      select: { isLeader: true }
    });

    return user?.isLeader || false;
  }

  /**
   * Valida si un usuario puede realizar operaciones en un grupo familiar
   * @param userUuid UUID del usuario
   * @param familyGroupUuid UUID del grupo familiar
   * @returns true si tiene permisos, false si no
   */
  private async validateFamilyGroupPermissions(userUuid: string, familyGroupUuid: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userUuid },
      select: { 
        isLeader: true,
        familyGroupsUuid: true
      }
    });

    if (!user) return false;

    // Solo líderes pueden realizar operaciones en grupos familiares
    if (!user.isLeader) return false;

    // El líder debe pertenecer al mismo grupo familiar
    return user.familyGroupsUuid === familyGroupUuid;
  }

  /**
   * Genera un UUID corto de 8 caracteres
   * @returns UUID corto
   */
  private generateShortUuid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
