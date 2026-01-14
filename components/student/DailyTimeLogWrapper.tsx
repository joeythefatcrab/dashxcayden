"use client";

import { useState, useEffect } from "react";
import { DailyTimeLogModal } from "./DailyTimeLogModal";

export function DailyTimeLogWrapper() {
  const [showModal, setShowModal] = useState(false);
  const [timeLogData, setTimeLogData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkTimeLog();
  }, []);

  const checkTimeLog = async () => {
    try {
      const response = await fetch("/api/student/daily-time-log");
      if (!response.ok) {
        // If error, don't show modal
        setIsChecking(false);
        return;
      }

      const data = await response.json();

      if (data.needsTimeLog) {
        setTimeLogData(data);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error checking time log:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleComplete = () => {
    setShowModal(false);
    setTimeLogData(null);
  };

  if (!showModal || !timeLogData) {
    return null;
  }

  return (
    <DailyTimeLogModal
      curricula={timeLogData.curricula}
      date={timeLogData.date}
      onComplete={handleComplete}
    />
  );
}
