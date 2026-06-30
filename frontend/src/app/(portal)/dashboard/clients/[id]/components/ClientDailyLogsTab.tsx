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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);



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
          logs={logs}
          onDayClick={setSelectedDate}
        />
      </div>

      <DayDetailSheet 
        dateStr={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null}
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        existingLog={selectedDate ? logs.find(l => l.log_date === format(selectedDate, 'yyyy-MM-dd')) || null : null}
        clientId={clientId}
      />
    </div>
  );
}
