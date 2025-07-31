import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  securityControl: z.string().min(1, { message: 'Security control is required' }),
  weakness: z.string().min(1, { message: 'Weakness is required' }),
  weaknessDescription: z.string().optional(),
  sourceOfWeakness: z.string().optional(),
  severityLevel: z.enum(['Critical', 'High', 'Moderate', 'Low']),
  identificationMethod: z.string().optional(),
  pointOfContactId: z.string().uuid({ message: 'Invalid point of contact' }),
  plannedStartDate: z.string().optional(),
  plannedCompletionDate: z.string(),
  systemAssetId: z.string().uuid({ message: 'Invalid system' }).optional(),
  complianceFrameworkId: z.string().uuid({ message: 'Invalid framework' }).optional(),
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PoamFormProps {
  initialData?: Partial<FormValues>;
  users: { id: string; name: string }[];
  systems: { id: string; name: string }[];
  frameworks: { id: string; name: string }[];
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function PoamForm({
  initialData,
  users,
  systems,
  frameworks,
  onSubmit,
  onCancel,
}: PoamFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      securityControl: '',
      weakness: '',
      weaknessDescription: '',
      sourceOfWeakness: '',
      severityLevel: 'Moderate',
      identificationMethod: '',
      plannedStartDate: '',
      plannedCompletionDate: '',
      comments: '',
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit POA&M Item' : 'Create POA&M Item'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="weakness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weakness</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter weakness" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="securityControl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Control</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter security control" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weaknessDescription"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Weakness Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter detailed description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sourceOfWeakness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source of Weakness</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter source" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="severityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pointOfContactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Point of Contact</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select point of contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="plannedStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="plannedCompletionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Completion Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="systemAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System/Asset</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select system" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systems.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            {system.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="complianceFrameworkId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Framework</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select framework" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frameworks.map((framework) => (
                          <SelectItem key={framework.id} value={framework.id}>
                            {framework.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter comments" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="flex justify-between px-0">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? 'Update' : 'Create'} POA&M Item
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
