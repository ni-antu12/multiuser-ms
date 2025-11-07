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

  /**
   * Genera una contraseña aleatoria
   */
  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  /**
   * Calcula la edad basada en la fecha de nacimiento
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

  // ===== DASHBOARD =====
  async getDashboardStats() {
    const totalFamilyGroups = await this.prisma.familyGroup.count();
    const totalLeaders = await this.prisma.user.count({ where: { isLeader: true } });
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({ where: { isActive: true } });

    return {
      totalFamilyGroups,
      totalLeaders,
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    };
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
    } catch (error) {
      console.warn('No se pudo validar el líder con el microservicio de formularios:', error.message);
    }

    // Crear el grupo familiar
    const familyGroup = await this.prisma.familyGroup.create({
      data: {
        uuid,
        leader,
        tokenApp,
        maxMembers
      }
    });

    // Asociar el líder al grupo familiar
    const leaderUser = await this.prisma.user.update({
      where: { uuid: leader },
      data: { familyGroupsUuid: familyGroup.uuid }
    });

    return {
      familyGroup,
      leader: leaderUser,
      message: 'Grupo familiar creado exitosamente'
    };
  }

  /**
   * MÉTODO SIMPLE: Crear grupo familiar sin microservicio de formularios
   */
  async createMyFamilyGroupSimple(userRut: string, dto?: CreateMyFamilyGroupDto) {
    console.log('🚀 MÉTODO SIMPLE: Creando grupo familiar para RUT:', userRut);
    
    // 1. Crear datos básicos del paciente
    const patientData = {
      rut: userRut,
      email: `paciente_${userRut.split('-')[0]}@centromedico.cl`,
      firstName: 'Paciente',
      lastNamePaterno: 'Desarrollo',
      lastNameMaterno: 'Test',
      username: `patient_${userRut.split('-')[0]}`,
      birthDate: '1990-01-01', // Fecha por defecto (mayor de 18)
      isActive: true
    };
    
    console.log('🔧 Datos básicos creados:', patientData);

    // 2. Verificar si ya existe el usuario
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
      // 3. Crear usuario líder (primera vez en el sistema)
      const hashedPassword = await bcrypt.hash(this.generateRandomPassword(), 10);

      user = await this.prisma.user.create({
        data: {
          uuid: this.generateShortUuid(),
          rut: userRut,
          email: patientData.email,
          username: patientData.username,
          password: hashedPassword,
          firstName: patientData.firstName,
          lastNamePaterno: patientData.lastNamePaterno,
          lastNameMaterno: patientData.lastNameMaterno,
          isActive: patientData.isActive,
          isLeader: true,
          familyGroupsUuid: null
        }
      });
    }

    // 4. Crear grupo familiar
    const familyGroup = await this.prisma.familyGroup.create({
      data: {
        uuid: this.generateShortUuid(),
        leader: user.uuid,
        tokenApp: dto?.tokenApp || this.generateShortUuid(),
        maxMembers: 8
      }
    });

    // 5. Asociar líder al grupo
    const updatedUser = await this.prisma.user.update({
      where: { uuid: user.uuid },
      data: { familyGroupsUuid: familyGroup.uuid },
      select: {
        id: true,
        uuid: true,
        rut: true,
        familyGroupsUuid: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ Grupo familiar creado exitosamente:', familyGroup.uuid);

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
            firstName: true,
            lastNamePaterno: true,
            lastNameMaterno: true,
            isActive: true,
            isLeader: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: { users: true }
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
            firstName: true,
            lastNamePaterno: true,
            lastNameMaterno: true,
            isActive: true,
            isLeader: true,
            createdAt: true,
            updatedAt: true
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
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    // Si se proporciona leaderUuid, validar permisos
    if (leaderUuid) {
      if (familyGroup.leader !== leaderUuid) {
        throw new ForbiddenException('No tienes permisos para modificar este grupo familiar');
      }
    }

    // Si se está cambiando el líder, validar que el nuevo líder existe
    if (updateFamilyGroupDto.leader && updateFamilyGroupDto.leader !== familyGroup.leader) {
      const newLeader = await this.prisma.user.findUnique({
        where: { uuid: updateFamilyGroupDto.leader }
      });

      if (!newLeader) {
        throw new NotFoundException('El nuevo líder no existe');
      }

      if (newLeader.familyGroupsUuid) {
        throw new ConflictException('El nuevo líder ya pertenece a otro grupo familiar');
      }
    }

    const updatedFamilyGroup = await this.prisma.familyGroup.update({
      where: { uuid },
      data: updateFamilyGroupDto
    });

    return updatedFamilyGroup;
  }

  async deleteFamilyGroup(uuid: string, leaderUuid?: string) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    // Si se proporciona leaderUuid, validar permisos
    if (leaderUuid) {
      if (familyGroup.leader !== leaderUuid) {
        throw new ForbiddenException('No tienes permisos para eliminar este grupo familiar');
      }
    }

    await this.prisma.familyGroup.delete({
      where: { uuid }
    });

    return { message: 'Grupo familiar eliminado exitosamente' };
  }

  async getFamilyGroupMembers(uuid: string) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid },
      include: {
        users: {
          select: {
            id: true,
            uuid: true,
            rut: true,
            email: true,
            firstName: true,
            lastNamePaterno: true,
            lastNameMaterno: true,
            isActive: true,
            isLeader: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup.users;
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
            firstName: true,
            lastNamePaterno: true,
            lastNameMaterno: true,
            isActive: true,
            isLeader: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    return familyGroup;
  }

  async getUsersByFamilyGroup(familyGroupUuid: string) {
    const users = await this.prisma.user.findMany({
      where: { familyGroupsUuid: familyGroupUuid },
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return users;
  }

  // ===== LEADERS =====
  async createLeader(createLeaderDto: CreateLeaderDto) {
    const { uuid = this.generateShortUuid(), rut, email, password, firstName, lastNamePaterno, lastNameMaterno } = createLeaderDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { rut },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException('Usuario con este RUT o email ya existe');
    }

    // Generar contraseña automáticamente si no se proporciona
    const finalPassword = password || this.generateRandomPassword();
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Generar username automáticamente basado en el RUT
    const username = `user_${rut.split('-')[0]}`;

    // Crear usuario líder
    const leader = await this.prisma.user.create({
      data: {
        uuid,
        rut,
        email,
        username,
        password: hashedPassword,
        firstName,
        lastNamePaterno,
        lastNameMaterno,
        isActive: true,
        isLeader: true,
        familyGroupsUuid: null
      },
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      leader,
      message: 'Líder creado exitosamente'
    };
  }

  async findAllLeaders(query?: string) {
    const whereClause = {
      isLeader: true
    };

    if (query) {
      return this.prisma.user.findMany({
        where: {
          ...whereClause,
          OR: [
            { rut: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastNamePaterno: { contains: query, mode: 'insensitive' } },
            { lastNameMaterno: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          uuid: true,
          rut: true,
          email: true,
          firstName: true,
          lastNamePaterno: true,
          lastNameMaterno: true,
          isActive: true,
          isLeader: true,
          familyGroupsUuid: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        familyGroupsUuid: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  // ===== MEMBERS =====
  async addMemberToFamilyGroup(familyGroupUuid: string, addMemberDto: any) {
    const { rut, email, firstName, lastNamePaterno, lastNameMaterno } = addMemberDto;

    // Verificar que el grupo familiar existe
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    // Verificar que el grupo no esté lleno
    const currentMembers = await this.prisma.user.count({
      where: { familyGroupsUuid: familyGroupUuid }
    });

    if (currentMembers >= familyGroup.maxMembers) {
      throw new ConflictException('El grupo familiar ha alcanzado el máximo de miembros');
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { rut }
    });

    if (existingUser) {
      if (existingUser.familyGroupsUuid) {
        throw new ConflictException('El usuario ya pertenece a otro grupo familiar');
      }
      // Si existe pero no está en un grupo, agregarlo al grupo
      const updatedUser = await this.prisma.user.update({
        where: { uuid: existingUser.uuid },
        data: { familyGroupsUuid: familyGroupUuid }
      });

      return {
        user: updatedUser,
        message: 'Usuario agregado al grupo familiar exitosamente'
      };
    }

    // Crear nuevo usuario con credenciales generadas automáticamente
    const generatedUsername = `member_${rut.split('-')[0]}`;
    const generatedPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
    const newUser = await this.prisma.user.create({
      data: {
        uuid: this.generateShortUuid(),
        rut,
        email,
        username: generatedUsername,
        password: hashedPassword,
        firstName: firstName || 'Miembro',
        lastNamePaterno: lastNamePaterno || 'Familia',
        lastNameMaterno: lastNameMaterno || '',
        isActive: true,
        isLeader: false,
        familyGroupsUuid: familyGroupUuid
      }
    });

    return {
      user: newUser,
      message: 'Miembro agregado al grupo familiar exitosamente'
    };
  }

  async findLeaderByUuid(uuid: string) {
    const leader = await this.prisma.user.findUnique({
      where: {
        uuid
      },
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        familyGroupsUuid: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!leader) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!leader.isLeader) {
      throw new NotFoundException('El usuario encontrado no es un líder');
    }

    return leader;
  }

  async updateLeader(uuid: string, updateLeaderDto: UpdateLeaderDto) {
    const leader = await this.prisma.user.findFirst({
      where: {
        uuid,
        isLeader: true,
        familyGroupsUuid: null
      }
    });

    if (!leader) {
      throw new NotFoundException('Líder no encontrado');
    }

    // Si se está actualizando el email, verificar que no exista
    if (updateLeaderDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { uuid: { not: uuid } },
            { email: updateLeaderDto.email }
          ]
        }
      });

      if (existingUser) {
        throw new ConflictException('Usuario con este email ya existe');
      }
    }

    // Si se está actualizando la contraseña, encriptarla
    if (updateLeaderDto.password) {
      updateLeaderDto.password = await bcrypt.hash(updateLeaderDto.password, 10);
    }

    const updatedLeader = await this.prisma.user.update({
      where: { uuid },
      data: updateLeaderDto,
      select: {
        id: true,
        uuid: true,
        rut: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      leader: updatedLeader,
      message: 'Líder actualizado exitosamente'
    };
  }

  async deleteLeader(uuid: string) {
    const leader = await this.prisma.user.findFirst({
      where: {
        uuid,
        isLeader: true,
        familyGroupsUuid: null
      }
    });

    if (!leader) {
      throw new NotFoundException('Líder no encontrado');
    }

    await this.prisma.user.delete({
      where: { uuid }
    });

    return { message: 'Líder eliminado exitosamente' };
  }
}