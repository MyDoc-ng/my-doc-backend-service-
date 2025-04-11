import { UserTypes } from '@prisma/client';
import { prisma } from '../src/prisma/prisma';

async function main() {
  // 1. Create base user roles
  await prisma.role.createMany({
    data: [
      { name: UserTypes.DOCTOR },
      { name: UserTypes.PATIENT },
      { name: UserTypes.ADMIN },
    ],
    skipDuplicates: true,
  });

  // 2. Create doctor specializations
  const specializations = [
    'Optician',
    'Cardiologist',
    'Neurologist',
    'Pediatrician',
    'Dermatologist',
    'Orthopedic Surgeon',
    'Gynecologist',
    'Psychiatrist',
    'Endocrinologist',
    'Gastroenterologist',
    'General Practitioner',
    'Ophthalmologist',
  ];

  await prisma.specialty.createMany({
    data: specializations.map(name => ({ name })),
    skipDuplicates: true,
  });

  console.log('✅ Seeded:');
  console.log('- 3 User Roles');
  console.log(`- ${specializations.length} Doctor Specializations`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });