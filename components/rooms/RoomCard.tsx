"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Baby, CheckCircle, AlertCircle } from "lucide-react";
import { getRoomIcon, getRoomIconColors, getRoomDisplayName } from "./utils";

type Props = {
  room: any;
  caregiverChildren: { [key: number]: any[] };
  onClick: (room: any) => void;
};

export default function RoomCard({ room, caregiverChildren, onClick }: Props) {
  return (
    <Card 
      onClick={() => onClick(room)}
      className="group bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl overflow-hidden cursor-pointer min-h-[280px] flex flex-col"
    >
      <CardHeader className="pb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`p-4 bg-gradient-to-r ${getRoomIconColors(room.name)} rounded-2xl shadow-lg`}>
              {getRoomIcon(room.name)}
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {getRoomDisplayName(room.name)}
            </CardTitle>
            <p className="text-lg text-gray-600 font-medium">
              {room.ageRange}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              {room.assignedChildren?.length || 0} Assigned
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-sm font-medium px-3 py-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              {room.unassignedChildren?.length || 0} Available
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">{room.servants?.length || 0} Caregivers</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Baby className="h-5 w-5" />
              <span className="text-sm font-medium">{room.childrenCount || 0} Children</span>
            </div>
            {room.servants && room.servants.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {room.servants.reduce((sum: number, servant: any) => 
                    sum + (caregiverChildren[servant.id]?.length || 0), 0
                  )} Assigned to Caregivers
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


