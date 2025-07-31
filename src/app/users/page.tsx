'use client';

import React, { useState, useEffect } from 'react';
import { UsersTable } from '@/components/users/users-table';
import { EditUserRoleForm } from '@/components/users/edit-user-role-form';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface User {
  id: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations/members');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateRole = async (userId: string, roleData: { role: string }) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/organizations/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
      } else {
        console.error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the organization?')) {
      try {
        const response = await fetch(`/api/organizations/members/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchUsers();
        } else {
          console.error('Failed to remove user');
        }
      } catch (error) {
        console.error('Error removing user:', error);
      }
    }
  };

  const handleInvite = () => {
    // In a real implementation, this would open an invite dialog or form
    alert('User invitation feature would be implemented here. This typically involves sending invitation emails through your authentication provider (like Clerk).');
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  if (editingUser) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        
        <div className="flex justify-center">
          <EditUserRoleForm
            user={editingUser}
            onSubmit={handleUpdateRole}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      
      <UsersTable
        users={users}
        onEditRole={handleEditRole}
        onRemove={handleRemove}
        onInvite={handleInvite}
        isLoading={isLoading}
      />
    </div>
  );
}
