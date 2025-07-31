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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  role: z.enum(['admin', 'manager', 'member', 'viewer']),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserRoleFormProps {
  user: {
    id: string;
    role: string;
    user: {
      firstName?: string;
      lastName?: string;
      email: string;
    };
  };
  onSubmit: (userId: string, data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditUserRoleForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditUserRoleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role as 'admin' | 'manager' | 'member' | 'viewer',
    },
  });

  const getUserName = () => {
    if (user.user.firstName && user.user.lastName) {
      return `${user.user.firstName} ${user.user.lastName}`;
    }
    return user.user.email;
  };

  const handleSubmit = (data: FormValues) => {
    onSubmit(user.id, data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Edit User Role</CardTitle>
        <p className="text-sm text-gray-600">
          Change role for {getUserName()}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-gray-500">Full access to all features</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div>
                          <div className="font-medium">Manager</div>
                          <div className="text-xs text-gray-500">Can manage POA&M items and users</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-gray-500">Can create and edit POA&M items</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-gray-500">Read-only access</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="flex justify-between px-0">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Role'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
