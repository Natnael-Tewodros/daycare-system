
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get all rooms with their organization, children, and caregivers
    const rooms = await prisma.room.findMany({
        include: {
            organization: true,
            children: true,
            caregivers: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    assignedRoomId: true
                }
            }
        },
        orderBy: {
            name: "asc"
        }
    });

    // Get all children to process room assignments
    const allChildren = await prisma.child.findMany({
        include: {
            room: true
        }
    });

    // Group rooms by name ONLY (simulating the fix)
    const roomGroups = new Map();

    for (const room of rooms) {
        // CHANGED: Group by name only, ignoring organizationId
        const key = `${room.name.toLowerCase()}`;

        if (!roomGroups.has(key)) {
            const roomChildren = allChildren.filter(child => child.roomId === room.id);
            roomGroups.set(key, {
                ...room,
                childrenCount: roomChildren.length,
                children: roomChildren,
                servants: room.caregivers,
                // Store original IDs for reference
                originalIds: [room.id]
            });
        } else {
            // Merge duplicate rooms
            const existingRoom = roomGroups.get(key);
            const roomChildren = allChildren.filter(child => child.roomId === room.id);

            // Merge children
            existingRoom.children = [...existingRoom.children, ...roomChildren];
            existingRoom.childrenCount += roomChildren.length;

            // Merge caregivers, avoiding duplicates
            const caregiverIds = new Set(existingRoom.caregivers.map((c: any) => c.id));
            const newCaregivers = room.caregivers.filter((c: any) => !caregiverIds.has(c.id));
            existingRoom.caregivers = [...existingRoom.caregivers, ...newCaregivers];
            existingRoom.servants = existingRoom.caregivers;

            // Track original IDs
            existingRoom.originalIds = [...(existingRoom.originalIds || []), room.id];
        }
    }

    // Convert map values to array
    const processedRooms = Array.from(roomGroups.values());

    console.log('Total merged rooms:', processedRooms.length);
    processedRooms.forEach(r => {
        console.log(`Room: "${r.name}" (Original IDs: ${r.originalIds.join(', ')})`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
