import { Injectable, NotFoundException, ConflictException, ForbiddenException, HttpException, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormsMicroserviceService } from './forms-microservice.service';
import { CreateFamilyGroupDto } from './dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from './dto/update-family-group.dto';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { CreateMyFamilyGroupDto } from './dto/create-my-family-group.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
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

  private async generateUniqueShortUuid(model: 'familyGroup' | 'user'): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const candidate = this.generateShortUuid();
      const exists =
        model === 'familyGroup'
          ? await this.prisma.familyGroup.findUnique({ where: { uuid: candidate } })
          : await this.prisma.user.findUnique({ where: { uuid: candidate } });
      if (!exists) {
        return candidate;
      }
      attempts++;
    }
    throw new ConflictException('No fue posible generar un identificador único. Intenta nuevamente.');
  }

  private async generateUniqueTokenApp(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const candidate = this.generateShortUuid();
      const exists = await this.prisma.familyGroup.findFirst({
        where: { tokenApp: candidate }
      });
      if (!exists) {
        return candidate;
      }
      attempts++;
    }
    throw new ConflictException('No fue posible generar un token único. Intenta nuevamente.');
  }

  private generateFallbackEmail(rut: string): string {
    const sanitized = rut.replace(/[^0-9a-zA-Z]/g, '');
    return `user_${sanitized}@example.com`;
  }

  private async findPatientByRut(rut: string) {
    const result = await this.prisma.$queryRaw<Array<{
      rut: string;
      nombre: string;
      apellido_paterno: string;
      apellido_materno: string | null;
      correo: string;
      telefono: string | null;
      password: string;
    }>>`
      SELECT rut, nombre, apellido_paterno, apellido_materno, correo, telefono, password
      FROM "patients"
      WHERE rut = ${rut}
      LIMIT 1
    `;

    const patient = result[0];

    if (!patient) {
      return null;
    }

    return {
      rut: patient.rut,
      nombre: patient.nombre,
      apellidoPaterno: patient.apellido_paterno,
      apellidoMaterno: patient.apellido_materno,
      correo: patient.correo,
      telefono: patient.telefono,
      password: patient.password,
    };
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
    const { leader, maxMembers = 8 } = createFamilyGroupDto;

    const leaderUser = await this.prisma.user.findUnique({
      where: { uuid: leader }
    });

    if (!leaderUser) {
      throw new NotFoundException('El líder indicado no existe');
    }

    if (leaderUser.familyGroupsUuid) {
      throw new ConflictException('El líder ya pertenece a un grupo familiar');
    }

    const existingLeaderGroup = await this.prisma.familyGroup.findFirst({
      where: { leader }
    });

    if (existingLeaderGroup) {
      throw new ConflictException('Este líder ya tiene un grupo familiar asociado');
    }

    const groupUuid = createFamilyGroupDto.uuid || (await this.generateUniqueShortUuid('familyGroup'));
    const tokenApp = createFamilyGroupDto.tokenApp || (await this.generateUniqueTokenApp());

    // Verificar si el grupo familiar ya existe
    const existingGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: groupUuid }
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
        uuid: groupUuid,
        leader,
        tokenApp,
        maxMembers
      }
    });

    // Asociar el líder al grupo familiar
    const leaderUserUpdated = await this.prisma.user.update({
      where: { uuid: leader },
      data: { familyGroupsUuid: familyGroup.uuid, isLeader: true }
    });

    return {
      familyGroup,
      leader: leaderUserUpdated,
      message: 'Grupo familiar creado exitosamente'
    };
  }

  /**
   * MÉTODO SIMPLE: Crear grupo familiar sin microservicio de formularios
   */
  async createMyFamilyGroupSimple(userRut: string, dto?: CreateMyFamilyGroupDto) {
    console.log('🚀 MÉTODO SIMPLE: Creando/asegurando grupo familiar para RUT:', userRut);

    const patientRecord = await this.findPatientByRut(userRut);

    if (!patientRecord) {
      throw new NotFoundException('Paciente no encontrado en la base de pacientes');
    }

    const patientData = {
      email: patientRecord.correo || this.generateFallbackEmail(userRut),
      firstName: patientRecord.nombre || 'Paciente',
      lastNamePaterno: patientRecord.apellidoPaterno || undefined,
      lastNameMaterno: patientRecord.apellidoMaterno || undefined
    };

    // 2. Verificar si ya existe el usuario
    let user = await this.prisma.user.findUnique({ where: { rut: userRut } });

    if (user) {
      if (user.familyGroupsUuid) {
        throw new ConflictException('Ya pertenece a un grupo familiar');
      }

      const existingGroup = await this.prisma.familyGroup.findFirst({
        where: { leader: user.uuid }
      });

      if (existingGroup) {
        throw new ConflictException('Ya tiene un grupo familiar creado');
      }

      const updates: Record<string, unknown> = {};
      if (user.email !== patientData.email) updates.email = patientData.email;
      if (patientData.firstName && user.firstName !== patientData.firstName) {
        updates.firstName = patientData.firstName;
      }
      if (patientData.lastNamePaterno && user.lastNamePaterno !== patientData.lastNamePaterno) {
        updates.lastNamePaterno = patientData.lastNamePaterno;
      }
      if (patientData.lastNameMaterno && user.lastNameMaterno !== patientData.lastNameMaterno) {
        updates.lastNameMaterno = patientData.lastNameMaterno;
      }
      if (!user.isLeader) {
        updates.isLeader = true;
      }

      if (Object.keys(updates).length) {
        user = await this.prisma.user.update({
          where: { uuid: user.uuid },
          data: updates
        });
      }
    } else {
      const hashedPassword = await bcrypt.hash(this.generateRandomPassword(), 10);

      user = await this.prisma.user.create({
        data: {
          uuid: await this.generateUniqueShortUuid('user'),
          rut: userRut,
          email: patientData.email,
          username: `patient_${userRut.split('-')[0]}`,
          password: hashedPassword,
          firstName: patientData.firstName,
          lastNamePaterno: patientData.lastNamePaterno,
          lastNameMaterno: patientData.lastNameMaterno,
          isActive: true,
          isLeader: true,
          familyGroupsUuid: null
        }
      });
    }

    const familyGroup = await this.prisma.familyGroup.create({
      data: {
        uuid: await this.generateUniqueShortUuid('familyGroup'),
        leader: user.uuid,
        tokenApp: dto?.tokenApp || (await this.generateUniqueTokenApp()),
        maxMembers: 8
      }
    });

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

    console.log('✅ Grupo familiar creado o confirmado:', familyGroup.uuid);

    return {
      familyGroup,
      user: updatedUser,
      message: 'Grupo familiar creado exitosamente'
    };
  }

  async ensureFamilyGroupForUser(payload: {
    rut: string;
    email?: string;
    firstName?: string;
    lastNamePaterno?: string;
    lastNameMaterno?: string;
  }) {
    const { rut } = payload;

    if (!rut) {
      throw new BadRequestException('El RUT es obligatorio');
    }

    const patientRecord = await this.findPatientByRut(rut);

    if (!patientRecord && !payload.email && !payload.firstName) {
      throw new NotFoundException('Paciente no encontrado en la base de pacientes');
    }

    const resolvedEmail =
      payload.email || patientRecord?.correo || this.generateFallbackEmail(rut);
    const resolvedFirstName = payload.firstName || patientRecord?.nombre || 'Paciente';
    const resolvedLastNamePaterno =
      payload.lastNamePaterno || patientRecord?.apellidoPaterno || undefined;
    const resolvedLastNameMaterno =
      payload.lastNameMaterno || patientRecord?.apellidoMaterno || undefined;

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { rut } });
      let createdUser = false;
      let createdGroup = false;

      if (!user) {
        const userUuid = await this.generateUniqueShortUuid('user');
        const password = await bcrypt.hash(this.generateRandomPassword(), 10);
        user = await tx.user.create({
          data: {
            uuid: userUuid,
            rut,
            email: resolvedEmail,
            username: `leader_${rut.split('-')[0]}`,
            password,
            firstName: resolvedFirstName,
            lastNamePaterno: resolvedLastNamePaterno,
            lastNameMaterno: resolvedLastNameMaterno,
            isActive: true,
            isLeader: true
          }
        });
        createdUser = true;
      } else {
        // Asegurar que tenga información básica actualizada
        const updates: Record<string, unknown> = {};
        if (user.email !== resolvedEmail) {
          updates.email = resolvedEmail;
        }
        if (user.firstName !== resolvedFirstName) {
          updates.firstName = resolvedFirstName;
        }
        if (resolvedLastNamePaterno && user.lastNamePaterno !== resolvedLastNamePaterno) {
          updates.lastNamePaterno = resolvedLastNamePaterno;
        }
        if (resolvedLastNameMaterno && user.lastNameMaterno !== resolvedLastNameMaterno) {
          updates.lastNameMaterno = resolvedLastNameMaterno;
        }
        if (!user.isLeader) {
          updates.isLeader = true;
        }

        if (Object.keys(updates).length) {
          user = await tx.user.update({
            where: { uuid: user.uuid },
            data: updates
          });
        }
      }

      let familyGroup =
        user.familyGroupsUuid &&
        (await tx.familyGroup.findUnique({ where: { uuid: user.familyGroupsUuid } }));

      if (familyGroup && familyGroup.leader !== user.uuid) {
        // El usuario era parte de otro grupo; lo removemos antes de crear el suyo.
        await tx.user.update({
          where: { uuid: user.uuid },
          data: { familyGroupsUuid: null }
        });
        familyGroup = null;
      }

      if (!familyGroup) {
        const groupUuid = await this.generateUniqueShortUuid('familyGroup');
        const tokenApp = await this.generateUniqueTokenApp();
        familyGroup = await tx.familyGroup.create({
          data: {
            uuid: groupUuid,
            leader: user.uuid,
            tokenApp,
            maxMembers: 8
          }
        });
        await tx.user.update({
          where: { uuid: user.uuid },
          data: { familyGroupsUuid: familyGroup.uuid, isLeader: true }
        });
        createdGroup = true;
      }

      return {
        user: {
          ...user,
          familyGroupsUuid: familyGroup.uuid,
          isLeader: true
        },
        familyGroup,
        createdUser,
        createdGroup,
        message: createdGroup
          ? 'Grupo familiar creado y asociado al usuario'
          : 'El usuario ya contaba con un grupo familiar'
      };
    });
  }

  async loginPatient(dto: PatientLoginDto) {
    const { rut, password } = dto;

    const patient = await this.findPatientByRut(rut);

    if (!patient || patient.password !== password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ensureResult = await this.ensureFamilyGroupForUser({
      rut,
      email: patient.correo,
      firstName: patient.nombre,
      lastNamePaterno: patient.apellidoPaterno ?? undefined,
      lastNameMaterno: patient.apellidoMaterno ?? undefined
    });

    return {
      patient: {
        rut: patient.rut,
        nombre: patient.nombre,
        apellidoPaterno: patient.apellidoPaterno,
        apellidoMaterno: patient.apellidoMaterno,
        correo: patient.correo,
        telefono: patient.telefono
      },
      ...ensureResult
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
  async addMemberToFamilyGroup(
    familyGroupUuid: string,
    addMemberDto: any,
    requestingLeaderUuid?: string
  ) {
    const { rut, email, firstName, lastNamePaterno, lastNameMaterno } = addMemberDto;

    // Verificar que el grupo familiar existe
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    if (requestingLeaderUuid && familyGroup.leader !== requestingLeaderUuid) {
      throw new ForbiddenException('Solo el líder del grupo puede agregar miembros');
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

  async removeMemberFromFamilyGroup(
    familyGroupUuid: string,
    memberUuid: string,
    leaderUuid: string
  ) {
    const familyGroup = await this.prisma.familyGroup.findUnique({
      where: { uuid: familyGroupUuid }
    });

    if (!familyGroup) {
      throw new NotFoundException('Grupo familiar no encontrado');
    }

    if (familyGroup.leader !== leaderUuid) {
      throw new ForbiddenException('Solo el líder del grupo puede eliminar miembros');
    }

    if (memberUuid === leaderUuid) {
      throw new ConflictException('El líder no puede eliminarse a sí mismo. Debe eliminar el grupo.');
    }

    const member = await this.prisma.user.findUnique({
      where: { uuid: memberUuid }
    });

    if (!member || member.familyGroupsUuid !== familyGroupUuid) {
      throw new NotFoundException('El usuario indicado no pertenece a este grupo');
    }

    await this.prisma.user.update({
      where: { uuid: memberUuid },
      data: { familyGroupsUuid: null }
    });

    return { message: 'Miembro eliminado del grupo familiar' };
  }

  async leaveFamilyGroup(userUuid: string) {
    const user = await this.prisma.user.findUnique({ where: { uuid: userUuid } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.familyGroupsUuid) {
      throw new ConflictException('El usuario no está asociado a ningún grupo familiar');
    }

    if (user.isLeader) {
      throw new ForbiddenException('El líder del grupo debe eliminar el grupo o transferir el liderazgo');
    }

    await this.prisma.user.update({
      where: { uuid: userUuid },
      data: { familyGroupsUuid: null }
    });

    return { message: 'Has abandonado el grupo familiar' };
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