'use client';

import { useTranslations } from 'next-intl';
import { WorkoutExercise } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dumbbell, Trophy } from 'lucide-react';

interface WorkoutListProps {
  exercises: WorkoutExercise[];
}

export default function WorkoutList({ exercises }: WorkoutListProps) {
  const t = useTranslations('Dashboard');

  return (
    <Card className="border border-[#e8f4fc] shadow-sm overflow-hidden h-full">
      <CardHeader className="border-b border-[#e8f4fc] bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#54B7F0]/10 flex items-center justify-center text-[#54B7F0]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-800 font-display">
              {t('exercise_list')}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <div 
              key={exercise.id} 
              className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-[#54B7F0]/30 transition-all duration-300 hover:bg-[#54B7F0]/5 group"
            >
              <div>
                <p className="font-bold text-slate-800 text-sm font-sans transition-colors group-hover:text-[#54B7F0]">
                  {exercise.name}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {exercise.sets} sets × {exercise.reps} reps
                </p>
              </div>
              <div className="bg-[#54B7F0]/10 px-3 py-1.5 rounded-lg text-[#54B7F0] text-xs font-extrabold shadow-sm transition-transform group-hover:scale-105 duration-300">
                {exercise.weight} kg
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
