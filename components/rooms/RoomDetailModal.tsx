"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Baby, CheckCircle, AlertCircle, Mail, Phone, UserCheck, Calendar, Star, Gamepad2 } from "lucide-react";
import { getRoomIcon, getRoomIconColors, categorizeChildrenByAge, calculateAgeInMonths, getRoomDisplayName } from "./utils";

type Props = {
  selectedRoom: any;
  onClose: () => void;
  caregiverChildren: { [key: number]: any[] };
  allChildren: any[];
  onRefresh: () => void;
};

export default function RoomDetailModal({ selectedRoom, onClose, caregiverChildren, allChildren, onRefresh }: Props) {
  const [showAssignChildDialog, setShowAssignChildDialog] = useState(false);
  const [assignChildData, setAssignChildData] = useState({ childId: '', caregiverId: '' });
  const [isAssigning, setIsAssigning] = useState(false);

  const assignChildToCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignChildData.childId || !assignChildData.caregiverId) return;
    try {
      setIsAssigning(true);
      const formData = new FormData();
      formData.append('assignedServantId', assignChildData.caregiverId);
      formData.append('childIds', JSON.stringify([parseInt(assignChildData.childId)]));
      const response = await fetch('/api/children/assign-caregiver', { method: 'POST', body: formData });
      if (response.ok) {
        setShowAssignChildDialog(false);
        setAssignChildData({ childId: '', caregiverId: '' });
        onRefresh();
        alert('Child assigned to caregiver successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to assign child'}`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-gradient-to-r ${getRoomIconColors(selectedRoom.name)} rounded-xl shadow-sm`}>
                {getRoomIcon(selectedRoom.name)}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">{getRoomDisplayName(selectedRoom.name)}</CardTitle>
                <p className="text-lg text-gray-600 font-medium mt-1">{selectedRoom.ageRange}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose} className="h-10 px-4 border-gray-200 hover:border-gray-300 rounded-xl font-semibold">✕ Close</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><CheckCircle className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Assigned Children</p>
                  <p className="text-2xl font-bold text-blue-800">{selectedRoom.assignedChildren?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Available Children</p>
                  <p className="text-2xl font-bold text-orange-800">{selectedRoom.unassignedChildren?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Users className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Caregivers</p>
                  <p className="text-2xl font-bold text-purple-800">{selectedRoom.servants?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><UserCheck className="h-6 w-6 text-purple-600" /></div>
                <h3 className="text-xl font-bold text-gray-800">Caregivers</h3>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{selectedRoom.servants?.length || 0}</Badge>
              </div>
              <Dialog open={showAssignChildDialog} onOpenChange={setShowAssignChildDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setAssignChildData({ childId: '', caregiverId: '' })}>
                    Assign Child
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Assign Child to Caregiver</DialogTitle>
                    <DialogDescription> Select a child and assign them to a caregiver in this room. </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={assignChildToCaregiver} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="child">Select Child *</Label>
                      <Select value={assignChildData.childId} onValueChange={(value) => setAssignChildData(prev => ({ ...prev, childId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select child" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const roomChildren = allChildren.filter((child: any) => (child.room?.id === selectedRoom.id) || (child.roomId === selectedRoom.id));
                            const unassignedChildren = roomChildren.filter((child: any) => !child.servant || child.servant === null || child.servant.id === null);
                            const { infant, toddler, growingStar } = categorizeChildrenByAge(unassignedChildren);
                            return (
                              <>
                                {infant.length > 0 && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-semibold text-pink-600 bg-pink-50">👶 Infants (3-12 months)</div>
                                    {infant.map((child: any) => (
                                      <SelectItem key={child.id} value={child.id.toString()}>
                                        {child.fullName} ({child.gender}) - {calculateAgeInMonths(child.dateOfBirth)} months
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                                {toddler.length > 0 && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-50">🧒 Toddlers (1-2 years)</div>
                                    {toddler.map((child: any) => (
                                      <SelectItem key={child.id} value={child.id.toString()}>
                                        {child.fullName} ({child.gender}) - {Math.floor(calculateAgeInMonths(child.dateOfBirth) / 12)}y {calculateAgeInMonths(child.dateOfBirth) % 12}m
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                                {growingStar.length > 0 && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-semibold text-purple-600 bg-purple-50">⭐ Growing Stars (2-4 years)</div>
                                    {growingStar.map((child: any) => (
                                      <SelectItem key={child.id} value={child.id.toString()}>
                                        {child.fullName} ({child.gender}) - {Math.floor(calculateAgeInMonths(child.dateOfBirth) / 12)}y {calculateAgeInMonths(child.dateOfBirth) % 12}m
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                                {unassignedChildren.length === 0 && (
                                  <div className="px-2 py-1 text-xs text-gray-500">
                                    {roomChildren.length === 0 ? 'No children in this room yet' : 'All children in this room are already assigned to caregivers'}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caregiver">Select Caregiver *</Label>
                      <Select value={assignChildData.caregiverId} onValueChange={(value) => setAssignChildData(prev => ({ ...prev, caregiverId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select caregiver" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedRoom.servants?.map((caregiver: any) => (
                            <SelectItem key={caregiver.id} value={caregiver.id.toString()}>
                              {caregiver.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isAssigning}>{isAssigning ? 'Assigning...' : 'Assign Child'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {selectedRoom.servants && selectedRoom.servants.length > 0 ? (
              <div className="space-y-4">
                {selectedRoom.servants.map((caregiver: any) => {
                  const assignedChildren = caregiverChildren[caregiver.id] || [];
                  return (
                    <div key={caregiver.id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 overflow-hidden">
                      <div className="flex items-center gap-4 p-4">
                        <div className="p-2 bg-white rounded-full shadow-sm"><Users className="h-5 w-5 text-purple-600" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg text-gray-800">{caregiver.fullName}</p>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{assignedChildren.length} children</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            {caregiver.email && (<div className="flex items-center gap-1"><Mail className="h-4 w-4" /><span>{caregiver.email}</span></div>)}
                            {caregiver.phone && (<div className="flex items-center gap-1"><Phone className="h-4 w-4" /><span>{caregiver.phone}</span></div>)}
                          </div>
                        </div>
                      </div>
                      {assignedChildren.length > 0 ? (
                        <div className="px-4 pb-4">
                          <div className="border-t border-purple-200 pt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Baby className="h-4 w-4" />Assigned Children</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {assignedChildren.map((child: any) => (
                                <div key={child.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{child.fullName}</p>
                                    <p className="text-xs text-gray-500">{child.gender} • {calculateAgeInMonths(child.dateOfBirth)} months</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 pb-4"><div className="border-t border-purple-200 pt-3"><p className="text-sm text-gray-500 text-center py-2">No children assigned yet</p></div></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200"><UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500 font-medium">No caregivers assigned to this room</p></div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-green-100 rounded-lg"><Baby className="h-6 w-6 text-green-600" /></div><h3 className="text-xl font-bold text-gray-800">Children</h3><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{selectedRoom.children?.length || 0}</Badge></div>
            {selectedRoom.children && selectedRoom.children.length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  const { infant, toddler, growingStar } = categorizeChildrenByAge(selectedRoom.children || []);
                  return (
                    <>
                      {infant.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-pink-100 rounded-lg"><CheckCircle className="h-5 w-5 text-pink-600" /></div><h4 className="text-lg font-semibold text-pink-700">Infants (3-12 months)</h4><Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">{infant.length}</Badge></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {infant.map((child: any) => {
                              const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                              const isAssigned = child.servant && child.servant.id;
                              return (
                                <div key={child.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isAssigned ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-100'}`}>
                                  <div className="p-2 bg-white rounded-full shadow-sm">{isAssigned ? (<CheckCircle className="h-5 w-5 text-blue-600" />) : (<CheckCircle className="h-5 w-5 text-pink-600" />)}</div>
                                  <div className="flex-1"><p className="font-semibold text-lg text-gray-800">{child.fullName}</p><div className="flex items-center gap-3 text-sm text-gray-500 mt-1"><Calendar className="h-4 w-4" /><span>{ageInMonths} months</span><span className="text-gray-300">•</span><span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">Infants</span><span className="text-xs text-gray-400">(Age: {ageInMonths}m)</span>{isAssigned && (<><span className="text-gray-300">•</span><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Assigned</span></>)}</div></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {toddler.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-yellow-100 rounded-lg"><Gamepad2 className="h-5 w-5 text-yellow-600" /></div><h4 className="text-lg font-semibold text-yellow-700">Toddlers (1-2 years)</h4><Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{toddler.length}</Badge></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {toddler.map((child: any) => {
                              const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                              const isAssigned = child.servant && child.servant.id;
                              return (
                                <div key={child.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isAssigned ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-100'}`}>
                                  <div className="p-2 bg-white rounded-full shadow-sm">{isAssigned ? (<CheckCircle className="h-5 w-5 text-blue-600" />) : (<Gamepad2 className="h-5 w-5 text-yellow-600" />)}</div>
                                  <div className="flex-1"><p className="font-semibold text-lg text-gray-800">{child.fullName}</p><div className="flex items-center gap-3 text-sm text-gray-500 mt-1"><Calendar className="h-4 w-4" /><span>{Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m</span><span className="text-gray-300">•</span><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Toddlers</span><span className="text-xs text-gray-400">(Age: {ageInMonths}m)</span>{isAssigned && (<><span className="text-gray-300">•</span><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Assigned</span></>)}</div></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {growingStar.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-purple-100 rounded-lg"><Star className="h-5 w-5 text-purple-600" /></div><h4 className="text-lg font-semibold text-purple-700">Growing Stars (2-4 years)</h4><Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{growingStar.length}</Badge></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {growingStar.map((child: any) => {
                              const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                              const isAssigned = child.servant && child.servant.id;
                              return (
                                <div key={child.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isAssigned ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'}`}>
                                  <div className="p-2 bg-white rounded-full shadow-sm">{isAssigned ? (<CheckCircle className="h-5 w-5 text-blue-600" />) : (<Star className="h-5 w-5 text-purple-600" />)}</div>
                                  <div className="flex-1"><p className="font-semibold text-lg text-gray-800">{child.fullName}</p><div className="flex items-center gap-3 text-sm text-gray-500 mt-1"><Calendar className="h-4 w-4" /><span>{Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m</span><span className="text-gray-300">•</span><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Growing Stars</span><span className="text-xs text-gray-400">(Age: {ageInMonths}m)</span>{isAssigned && (<><span className="text-gray-300">•</span><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Assigned</span></>)}</div></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200"><Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-500 font-medium text-lg">No children in this room</p></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


