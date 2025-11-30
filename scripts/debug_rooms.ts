
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const rooms = await prisma.room.findMany({
        include: {
            organization: true,
        },
        orderBy: {
            id: 'asc',
        },
    });

    console.log('Total rooms:', rooms.length);
    console.log(JSON.stringify(rooms, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
