
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find rooms with "Infant" in the name
    const infantRooms = await prisma.room.findMany({
        where: {
            name: {
                contains: 'Infant',
                mode: 'insensitive',
            },
        },
        include: {
            children: true,
        },
    });

    console.log(`Found ${infantRooms.length} Infant rooms.`);

    for (const room of infantRooms) {
        console.log(`\nRoom: ${room.name} (ID: ${room.id})`);
        if (room.children.length === 0) {
            console.log('  No children.');
            continue;
        }

        for (const child of room.children) {
            const dob = new Date(child.dateOfBirth);
            const now = new Date();
            const ageInMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());

            console.log(`  Child: ${child.fullName} (ID: ${child.id})`);
            console.log(`    DOB: ${child.dateOfBirth.toISOString().split('T')[0]}`);
            console.log(`    Age: ${ageInMonths} months`);

            // Check if toddler (usually > 12 months or > 18 months depending on definition)
            // Assuming Infant is 0-12m, Toddler is 12m+
            if (ageInMonths > 12) {
                console.log(`    [POTENTIAL TODDLER]`);
            }
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
