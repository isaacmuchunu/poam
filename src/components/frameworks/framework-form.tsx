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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Framework name is required' }),
  description: z.string().optional(),
  version: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FrameworkFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FrameworkForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FrameworkFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      version: '',
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Framework' : 'Create Framework'}</CardTitle>
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
                    <FormLabel>Framework Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NIST 800-53, ISO 27001, SOC 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rev 5, 2022 Edition" {...field} />
                    </FormControl>
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
                      <Textarea placeholder="Enter framework description" {...field} />
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
                {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')} Framework
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
