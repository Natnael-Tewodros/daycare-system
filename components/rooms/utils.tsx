import React from "react";
import { Baby, BabyIcon, Star, Heart } from "lucide-react";

// Function to normalize room display names
export const getRoomDisplayName = (roomName: string): string => {
  if (roomName.toLowerCase().includes('growing start')) {
    return roomName.replace(/growing start/gi, 'Growing Star');
  }
  return roomName;
};

export const getRoomIcon = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes('infant')) {
    // Baby icon for infants - pink theme
    return <Baby className="h-8 w-8 text-white" />;
  } else if (name.includes('toddler')) {
    // BabyIcon for toddlers - blue theme  
    return <BabyIcon className="h-8 w-8 text-white" />;
  } else if (name.includes('growing star') || name.includes('growing start')) {
    // Star icon for growing stars - purple theme (matches the name!)
    return <Star className="h-8 w-8 text-white" />;
  }
  // Default fallback for other rooms
  return <Heart className="h-8 w-8 text-white" />;
};

export const getRoomIconColors = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes('infant')) {
    return 'from-pink-500 to-rose-500';
  } else if (name.includes('toddler')) {
    return 'from-blue-500 to-cyan-500';
  } else if (name.includes('growing star') || name.includes('growing start')) {
    return 'from-purple-500 to-violet-500';
  }
  return 'from-gray-500 to-gray-600';
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


