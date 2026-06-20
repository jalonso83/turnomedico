import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InsurancesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    const insurances = await this.prisma.insurance.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        shortName: true,
        logoUrl: true,
      },
    });
    return { data: insurances, message: 'Catálogo de seguros' };
  }
}
