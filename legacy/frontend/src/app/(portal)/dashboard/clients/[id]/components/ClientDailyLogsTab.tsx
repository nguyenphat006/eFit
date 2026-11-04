import { useState } from 'react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { CalendarHeatmap } from '@/components/shared/calendar-heatmap';
import { DayDetailSheet } from '@/components/shared/day-detail-sheet';
import { Loader2, CalendarX2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ClientDailyLogsTabProps {
  clientId: number;
}

export default function ClientDailyLogsTab({ clientId }: ClientDailyLogsTabProps) {
  const { data: logsData, isLoading } = useDailyLogs(clientId);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(new Date());



  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#54B7F0]" />
      </div>
    );
  }

  const logs = logsData?.data || [];
  
  // Mocks phase lookup function for DayDetailSheet (required prop)
  const getPhaseForDate = (date: Date) => null;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border shadow-sm p-4">
        <CalendarHeatmap 
          month={month}
          onMonthChange={setMonth}
          logs={logs}
          selectedDate={selectedDateStr || undefined}
          onSelectDate={setSelectedDateStr}
        />
      </div>

      <DayDetailSheet 
        dateStr={selectedDateStr}
        open={!!selectedDateStr}
        onClose={() => setSelectedDateStr(null)}
        existingLog={selectedDateStr ? logs.find(l => l.log_date === selectedDateStr) || null : null}
        clientId={clientId}
      />
    </div>
  );
}
