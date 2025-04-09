import { UserTypes } from '@prisma/client';
import { prisma } from '../src/prisma/prisma';


async function main() {
  await prisma.role.createMany({
    data: [
      { name: UserTypes.DOCTOR },
      { name: UserTypes.PATIENT },
      { name: UserTypes.ADMIN },
    ],
    skipDuplicates: true, // Avoid duplicate entries on re-run
  });

  console.log('✅ Roles seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
