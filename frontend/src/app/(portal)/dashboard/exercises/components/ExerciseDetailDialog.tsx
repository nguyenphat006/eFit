import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Exercise } from '@/types/exercise';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ExerciseDetailDialogProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExerciseDetailDialog({ exercise, isOpen, onClose }: ExerciseDetailDialogProps) {
  if (!exercise) return null;

  // Extrair 'en' instructions safely
  const instructionsObj = exercise.instructions || {};
  let instructionText = '-';
  if (typeof instructionsObj === 'string') {
    instructionText = instructionsObj;
  } else if (typeof instructionsObj === 'object') {
    instructionText = (instructionsObj as Record<string, string>)['en'] || '-';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[85vh] custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{exercise.name}</DialogTitle>
          <DialogDescription>Chi tiết bài tập</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2">
            {exercise.category && <Badge variant="secondary" className="capitalize">{exercise.category}</Badge>}
            {exercise.equipment && <Badge variant="outline" className="capitalize">Dụng cụ: {exercise.equipment}</Badge>}
            {exercise.target && <Badge className="bg-[#54B7F0]/10 text-[#54B7F0] capitalize">Mục tiêu: {exercise.target}</Badge>}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Cơ chính (Muscle Group)</p>
              <p className="capitalize">{exercise.muscle_group || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Phần thân (Body Part)</p>
              <p className="capitalize">{exercise.body_part || '-'}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-muted-foreground mb-1 text-sm">Cơ phụ (Secondary Muscles)</p>
            {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {exercise.secondary_muscles.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal bg-card capitalize">{m}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm">-</p>
            )}
          </div>

          <Separator />

          <div>
            <p className="font-semibold text-muted-foreground mb-2 text-sm">Hướng dẫn (Instructions - EN)</p>
            <div className="bg-muted/30 p-3 rounded-lg border text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {instructionText}
            </div>
          </div>

          {exercise.media_id && (
            <div>
               <p className="font-semibold text-muted-foreground mb-2 text-sm">Mã Media (Media ID)</p>
               <p className="text-sm">{exercise.media_id}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
