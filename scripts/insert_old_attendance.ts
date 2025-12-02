import { prisma } from "../lib/prisma";

// Usage: node ./scripts/insert_old_attendance.ts <childId> <daysAgo> [status]
// Example: node ./scripts/insert_old_attendance.ts 123 90 present

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node ./scripts/insert_old_attendance.ts <childId> <daysAgo> [status]");
    process.exit(1);
  }
  const childId = Number(args[0]);
  const daysAgo = Number(args[1]);
  const status = args[2] || "present";

  if (!childId || Number.isNaN(childId)) {
    console.error("Invalid childId");
    process.exit(2);
  }
  if (!daysAgo || Number.isNaN(daysAgo) || daysAgo <= 0) {
    console.error("Invalid daysAgo (must be positive integer)");
    process.exit(3);
  }

  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // set to midday to avoid timezone issues
  date.setHours(12, 0, 0, 0);

  try {
    const attendance = await prisma.attendance.create({
      data: {
        childId: childId,
        status: status,
        checkInTime: status === "present" || status === "late" ? date : null,
        checkOutTime: null,
        broughtBy: "Test-script",
        takenBy: null,
        createdAt: date,
      },
    });

    console.log("Inserted attendance:", attendance);
    process.exit(0);
  } catch (err) {
    console.error("Failed to insert attendance:", err);
    process.exit(4);
  }
}

main();
