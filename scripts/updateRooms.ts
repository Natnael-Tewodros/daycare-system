import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRooms() {
  try {
    // First, get all rooms
    const rooms = await prisma.room.findMany();
    
    // Delete the fourth room if it exists
    if (rooms.length >= 4) {
      await prisma.room.delete({
        where: { id: rooms[3].id }
      });
      console.log('Removed fourth room');
    }

    // Update the first three rooms
    const updates = [
      { id: 1, name: 'Infant Room', ageRange: '0-12 months' },
      { id: 2, name: 'Toddler Room', ageRange: '1-2 years' },
      { id: 3, name: 'Growing Star', ageRange: '2-3 years' }
    ];

    for (const update of updates) {
      await prisma.room.update({
        where: { id: update.id },
        data: {
          name: update.name,
          ageRange: update.ageRange
        }
      });
      console.log(`Updated room ${update.id} to ${update.name}`);
    }

    console.log('Rooms updated successfully!');
  } catch (error) {
    console.error('Error updating rooms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRooms();
