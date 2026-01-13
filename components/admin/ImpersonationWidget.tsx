"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, X, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface ImpersonationWidgetProps {
  isImpersonating?: boolean;
  impersonatedUserEmail?: string;
}

export function ImpersonationWidget({
  isImpersonating,
  impersonatedUserEmail
}: ImpersonationWidgetProps) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  if (!isImpersonating) {
    return null;
  }

  const handleEndImpersonation = async () => {
    setIsEnding(true);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
        router.push("/dashboard");
      } else {
        console.error("Failed to end impersonation");
      }
    } catch (error) {
      console.error("Error ending impersonation:", error);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="border-orange-500 bg-orange-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <Badge variant="destructive" className="mb-1">
                  IMPERSONATING
                </Badge>
                <p className="text-sm font-medium text-orange-900">
                  Viewing as: {impersonatedUserEmail}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndImpersonation}
              disabled={isEnding}
              className="ml-4"
            >
              <X className="mr-1 h-4 w-4" />
              {isEnding ? "Ending..." : "End"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
