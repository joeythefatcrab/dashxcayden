"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import Link from "next/link";

type PendingCounts = {
  totalPending: number;
  unverifiedTimeLogs: number;
  unverifiedActivities: number;
};

export function PendingVerificationsCard() {
  const [counts, setCounts] = useState<PendingCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await fetch("/api/parent/pending-verifications");
      if (response.ok) {
        const data = await response.json();
        setCounts(data);
      }
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // or a loading skeleton
  }

  if (!counts || counts.totalPending === 0) {
    return null; // Don't show card if no pending items
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle className="text-yellow-900">Hours Tracking Needs Verification</CardTitle>
              <CardDescription className="text-yellow-700">
                Your student has submitted {counts.totalPending} {counts.totalPending === 1 ? "entry" : "entries"} for review
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            {counts.totalPending}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-6 text-sm">
          {counts.unverifiedTimeLogs > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>
                {counts.unverifiedTimeLogs} time {counts.unverifiedTimeLogs === 1 ? "log" : "logs"}
              </span>
            </div>
          )}
          {counts.unverifiedActivities > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span>
                {counts.unverifiedActivities} external {counts.unverifiedActivities === 1 ? "activity" : "activities"}
              </span>
            </div>
          )}
        </div>
        <Link href="/verify-hours">
          <Button className="w-full">
            Review and Verify Entries
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
