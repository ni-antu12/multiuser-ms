import { Injectable, NotFoundException, ConflictException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormsMicroserviceService } from './forms-microservice.service';
import { CreateFamilyGroupDto } from './dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from './dto/update-family-group.dto';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { CreateMyFamilyGroupDto } from './dto/create-my-family-group.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MultiuserService {
  constructor(
    private prisma: PrismaService,
    private formsMicroserviceService: FormsMicroserviceService
  ) {}

  /**
   * Genera un UUID corto de 8 caracteres alfanuméricos
   * @returns UUID corto único
   */
  private generateShortUuid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ===== FAMILY GROUPS =====
  async createFamilyGroup(createFamilyGroupDto: CreateFamilyGroupDto, requestingUserUuid?: string) {
    const { uuid = this.generateShortUuid(), leader, tokenApp, maxMembers = 8 } = createFamilyGroupDto;

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

    // Asociar líder al grupo automáticamente
    const leaderUser = await this.prisma.user.update({
      where: { uuid: leader },
      data: { 
        familyGroupsUuid: familyGroup.uuid,
        isLeader: true
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
        isLeader: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Retornar grupo con información completa del líder
    return {
      familyGroup,
      leader: leaderUser,
      message: 'Grupo familiar creado exitosamente'
    };
  }

  /**
   * Crea automáticamente un grupo familiar para el paciente autenticado
   * El paciente debe ser mayor de 18 años y no pertenecer a otro grupo
   * @param userRut RUT del paciente autenticado
   * @param dto Datos opcionales del grupo (tokenApp)
   * @returns Grupo familiar y usuario creados
   */
  async createMyFamilyGroup(userRut: string, dto?: CreateMyFamilyGroupDto) {
    // 1. Obtener datos del paciente desde BD Centro Médico (microservicio forms)
    let patientData;
    try {
      patientData = await this.formsMicroserviceService.getPatientByRut(userRut);
    } catch (error) {
      // Si el microservicio no está disponible, buscar localmente
      console.warn('Microservicio de formularios no disponible, buscando datos locales');
      const localUser = await this.prisma.user.findUnique({ where: { rut: userRut } });
      
      if (!localUser) {
        throw new NotFoundException('Paciente no encontrado en el sistema');
      }
      
      // Simular datos del paciente para desarrollo
      patientData = {
        rut: localUser.rut,
        email: localUser.email,
        firstName: localUser.firstName || 'Paciente',
        lastName: localUser.lastName || 'Sin Apellido',
        username: localUser.username,
        birthDate: '1990-01-01', // Fecha por defecto (mayor de 18)
        isActive: localUser.isActive
      };
    }

    // 2. Validar edad (mayor de 18)
    const age = this.calculateAge(patientData.birthDate);
    if (age < 18) {
      throw new ForbiddenException('Debe ser mayor de 18 años para crear un grupo familiar');
    }

    // 3. Verificar si ya existe el usuario en nuestro sistema
    let user = await this.prisma.user.findUnique({ where: { rut: userRut } });

    if (user) {
      // Validar que no esté en otro grupo
      if (user.familyGroupsUuid) {
        throw new ConflictException('Ya pertenece a un grupo familiar');
      }

      // Validar que no tenga ya un grupo como líder
      const existingGroup = await this.prisma.familyGroup.findFirst({
        where: { leader: user.uuid }
      });

      if (existingGroup) {
        throw new ConflictException('Ya tiene un grupo familiar creado');
      }

      // Actualizar el flag de líder si no lo tiene
      if (!user.isLeader) {
        user = await this.prisma.user.update({
          where: { uuid: user.uuid },
          data: { isLeader: true }
        });
      }
    } else {
      // 4. Crear usuario líder (primera vez en el sistema)
      const hashedPassword = await bcrypt.hash(this.generateRandomPassword(), 10);

      user = await this.prisma.user.create({
        data: {
          uuid: this.generateShortUuid(),
          rut: userRut,
          email: patientData.email,
          username: patientData.username || `patient_${userRut.split('-')[0]}`,
          password: hashedPassword,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          isActive: patientData.isActive ?? true,
          isLeader: true,
          familyGroupsUuid: null
        }
      });
    }

    // 5. Crear grupo familiar
    const familyGroup = await this.prisma.familyGroup.create({
      data: {
        uuid: this.generateShortUuid(),
        leader: user.uuid,
        tokenApp: dto?.tokenApp || this.generateShortUuid(),
        maxMembers: 8
      }
    });

    // 6. Asociar líder al grupo (el líder ES miembro del grupo)
    const updatedUser = await this.prisma.user.update({
      where: { uuid: user.uuid },
      data: { familyGroupsUuid: familyGroup.uuid },
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
        updatedAt: true
      }
    });

    return {
      familyGroup,
      user: updatedUser,
      message: 'Grupo familiar creado exitosamente'
    };
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

    return { message: 'Grupo familiar eliminado exitosamente' };
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
        isLeader: true, // ✅ Establecer explícitamente como líder
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
        isLeader: true, // ✅ Filtrar explícitamente por líderes
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
        isLeader: true, // ✅ Filtrar explícitamente por líderes
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
        isLeader: true, // ✅ Filtrar explícitamente por líderes
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
        isLeader: true, // ✅ Filtrar explícitamente por líderes
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
   * Calcula la edad de una persona basándose en su fecha de nacimiento
   * @param birthDate Fecha de nacimiento en formato ISO (YYYY-MM-DD)
   * @returns Edad en años
   */
  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Genera una contraseña aleatoria segura de 12 caracteres
   * @returns Contraseña aleatoria
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
