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
  name: z.string().min(1, { message: 'System name is required' }),
  description: z.string().optional(),
  systemType: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

type FormValues = z.infer<typeof formSchema>;

interface SystemFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SystemForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SystemFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      systemType: '',
      owner: '',
      status: 'active',
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit System' : 'Create System'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter system name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="systemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Application, Database, Network Device" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter system owner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter system description" {...field} />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')} System
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
