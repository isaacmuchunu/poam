import React, { useState } from 'react';
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
import { Upload, File, X } from 'lucide-react';

const formSchema = z.object({
  fileName: z.string().min(1, { message: 'File name is required' }),
  description: z.string().optional(),
  poamItemId: z.string().min(1, { message: 'POA&M item is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface EvidenceFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues & { file?: File }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  poamItems: { id: string; weakness: string }[];
}

export function EvidenceForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  poamItems
}: EvidenceFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      fileName: '',
      description: '',
      poamItemId: '',
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('fileName', file.name);
    }
  };

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      file: selectedFile || undefined
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    form.setValue('fileName', '');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Evidence File' : 'Upload Evidence File'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="poamItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>POA&M Item</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select POA&M Item</option>
                        {poamItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.weakness}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!initialData && (
                <div className="space-y-4">
                  <FormLabel>File Upload</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <File className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Click to upload or drag and drop
                            </span>
                            <span className="text-xs text-gray-500">
                              PDF, Word, Excel, Images up to 10MB
                            </span>
                          </label>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter file name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter file description" {...field} />
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
                {isSubmitting ? 'Uploading...' : (initialData ? 'Update' : 'Upload')} Evidence
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
