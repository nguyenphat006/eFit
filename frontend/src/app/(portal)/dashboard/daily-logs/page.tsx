"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useDailyLogs, useCreateDailyLog, useUpdateDailyLog, useDeleteDailyLog } from "@/hooks/useDailyLogs";
import { DailyLogCreate, DailyLogUpdate, DailyLog } from "@/services/api/dailyLogService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function DailyLogsPage() {
  const { data: logs, isLoading, error } = useDailyLogs();
  const createMutation = useCreateDailyLog();
  const updateMutation = useUpdateDailyLog();
  const deleteMutation = useDeleteDailyLog();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);

  const form = useForm<DailyLogCreate>({
    defaultValues: {
      user_id: 1, // default mock user
      log_date: format(new Date(), 'yyyy-MM-dd'),
      weight: undefined,
      sleep_hours: undefined,
      calories_in: undefined,
      compliance_score: 0,
      compliance_notes: "",
    },
  });

  const onSubmit = (data: DailyLogCreate) => {
    // Convert string inputs to numbers if they exist
    const payload = {
      ...data,
      weight: data.weight ? Number(data.weight) : undefined,
      sleep_hours: data.sleep_hours ? Number(data.sleep_hours) : undefined,
      calories_in: data.calories_in ? Number(data.calories_in) : undefined,
      compliance_score: data.compliance_score ? Number(data.compliance_score) : 0,
    };

    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, data: payload as DailyLogUpdate }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        }
      });
    }
  };

  const openCreateDialog = () => {
    setEditingLog(null);
    form.reset({
      user_id: 1,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      weight: undefined,
      sleep_hours: undefined,
      calories_in: undefined,
      compliance_score: 0,
      compliance_notes: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (log: DailyLog) => {
    setEditingLog(log);
    form.reset({
      user_id: log.user_id,
      log_date: String(log.log_date),
      weight: log.weight || undefined,
      sleep_hours: log.sleep_hours || undefined,
      calories_in: log.calories_in || undefined,
      compliance_score: log.compliance_score || 0,
      compliance_notes: log.compliance_notes || "",
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = (id: number) => {
    setLogToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (logToDelete !== null) {
      deleteMutation.mutate(logToDelete, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setLogToDelete(null);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Daily Logs</h2>
          <p className="text-sm text-muted-foreground">
            Manage your daily health and compliance records.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Log
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Sleep (hrs)</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Loading logs...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-red-500">Error loading logs</TableCell>
              </TableRow>
            ) : !logs || logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">No logs found.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{String(log.log_date)}</TableCell>
                  <TableCell>{log.weight || '-'}</TableCell>
                  <TableCell>{log.sleep_hours || '-'}</TableCell>
                  <TableCell>{log.calories_in || '-'}</TableCell>
                  <TableCell>{log.compliance_score ? `${log.compliance_score}%` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(log)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => confirmDelete(log.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLog ? 'Edit Daily Log' : 'Add Daily Log'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="log_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date (YYYY-MM-DD)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sleep_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sleep (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calories_in"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compliance_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance Score (0-100)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="compliance_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional notes..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingLog ? 'Save Changes' : 'Add Log'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the daily log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
