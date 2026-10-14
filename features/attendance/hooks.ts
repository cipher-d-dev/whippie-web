import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listAttendance, getAttendanceRecord, correctAttendance } from "./api";
import type { AttendanceStatus, AttendanceCheckType } from "@/types";

export const attendanceKeys = {
  all:    () => ["attendance"] as const,
  list:   (p?: object) => ["attendance", "list", p ?? {}] as const,
  detail: (id: string) => ["attendance", "detail", id] as const,
};

export function useAttendance(params?: {
  page?: number; limit?: number;
  intern?: string; status?: AttendanceStatus;
  checkType?: AttendanceCheckType; date?: string;
}) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn:  () => listAttendance(params),
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn:  () => getAttendanceRecord(id),
    enabled:  Boolean(id),
  });
}

export function useCorrectAttendance(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { status: AttendanceStatus; correctionNote: string }) =>
      correctAttendance(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.all() });
      qc.invalidateQueries({ queryKey: attendanceKeys.detail(id) });
      toast.success("Attendance record corrected.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to correct record."),
  });
}
