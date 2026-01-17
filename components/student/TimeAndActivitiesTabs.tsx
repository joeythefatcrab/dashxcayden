"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeTrackingInterface } from "./TimeTrackingInterface";
import { ExternalActivitiesForm } from "./ExternalActivitiesForm";
import { Clock, Calendar } from "lucide-react";

type Curriculum = {
  id: string;
  name: string;
  subject: string | null;
};

type TimeLog = {
  id: string;
  date: Date;
  minutesSpent: number;
  verifiedByParent: boolean;
  curriculum: {
    name: string;
    subject: string | null;
  };
};

type ExternalActivity = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  hoursSpent: number | null;
  category: string | null;
  verifiedByParent: boolean;
};

type Props = {
  student: {
    id: string;
    name: string;
  };
  curricula: Curriculum[];
  initialTimeLogs: TimeLog[];
  initialActivities: ExternalActivity[];
};

export function TimeAndActivitiesTabs({ student, curricula, initialTimeLogs, initialActivities }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Time Tracking</h1>
        <p className="text-muted-foreground">
          Log your daily study time and educational activities
        </p>
      </div>

      <Tabs defaultValue="time" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Daily Time
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            External Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-6">
          <TimeTrackingInterface
            student={student}
            curricula={curricula}
            initialTimeLogs={initialTimeLogs}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <ExternalActivitiesForm
            studentId={student.id}
            initialActivities={initialActivities}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
