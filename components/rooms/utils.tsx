import { Baby, Flower2, Rainbow } from "lucide-react";

export const getRoomIcon = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes('infants') || name.includes('room 1')) {
    return <Baby className="h-8 w-8 text-white" />;
  } else if (name.includes('toddlers') || name.includes('room 2')) {
    return <Flower2 className="h-8 w-8 text-white" />;
  } else if (name.includes('growing stars') || name.includes('room 3')) {
    return <Rainbow className="h-8 w-8 text-white" />;
  }
  return <Baby className="h-8 w-8 text-white" />;
};

export const getRoomIconColors = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes('infants') || name.includes('room 1')) {
    return 'from-pink-500 to-rose-500';
  } else if (name.includes('toddlers') || name.includes('room 2')) {
    return 'from-blue-500 to-cyan-500';
  } else if (name.includes('growing stars') || name.includes('room 3')) {
    return 'from-purple-500 to-violet-500';
  }
  return 'from-blue-500 to-indigo-500';
};

export const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  let ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
  if (now.getDate() < birthDate.getDate()) {
    ageInMonths--;
  }
  return ageInMonths;
};

export const categorizeChildrenByAge = (children: any[]) => {
  const uniqueChildrenMap = new Map(children.map((c: any) => [c.id, c]));
  const uniqueChildren = Array.from(uniqueChildrenMap.values());

  const infants = uniqueChildren.filter(child => {
    const age = calculateAgeInMonths(child.dateOfBirth);
    return age >= 3 && age <= 12;
  });

  const toddlers = uniqueChildren.filter(child => {
    const age = calculateAgeInMonths(child.dateOfBirth);
    return age >= 13 && age <= 24;
  });

  const growingStars = uniqueChildren.filter(child => {
    const age = calculateAgeInMonths(child.dateOfBirth);
    return age >= 25 && age <= 48;
  });

  return { infant: infants, toddler: toddlers, growingStar: growingStars };
};


