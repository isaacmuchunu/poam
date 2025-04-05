import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PoamTable } from '@/components/poam/poam-table';
import { PoamForm } from '@/components/poam/poam-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PoamPageProps {
  items: any[];
  users: any[];
  systems: any[];
  frameworks: any[];
}

export default function PoamPage({ items, users, systems, frameworks }: PoamPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">POA&M Management</h1>
        <Button>Create POA&M Item</Button>
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">POA&M List</TabsTrigger>
          <TabsTrigger value="create">Create POA&M</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>POA&M Items</CardTitle>
            </CardHeader>
            <CardContent>
              <PoamTable 
                data={items} 
                onEdit={(id) => console.log('Edit', id)} 
                onDelete={(id) => console.log('Delete', id)} 
                onView={(id) => console.log('View', id)} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <PoamForm 
            users={users}
            systems={systems}
            frameworks={frameworks}
            onSubmit={(data) => console.log('Submit', data)}
            onCancel={() => console.log('Cancel')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
