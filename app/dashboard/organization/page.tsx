"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

const organizationTypes = ["INSA", "AI", "MINISTRY_OF_PEACE", "FINANCE_SECURITY"];

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState(organizationTypes[0]);

  const fetchOrgs = async () => {
    const res = await axios.get("/api/organization");
    setOrgs(res.data);
  };

  const addOrg = async () => {
    await axios.post("/api/organization", { name, type });
    setName("");
    fetchOrgs();
  };

  useEffect(() => { fetchOrgs(); }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Organization Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select onValueChange={setType}>
          <SelectTrigger>{type}</SelectTrigger>
          <SelectContent>
            {organizationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={addOrg}>Add Organization</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {orgs.map((org: any) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
            </CardHeader>
            <CardContent>
              Type: {org.type} <br/>
              Rooms: {org.rooms.length} <br/>
              Children: {org.children.length}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
