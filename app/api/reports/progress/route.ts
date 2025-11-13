import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateProgressReport, convertToCSV } from "@/lib/reporting/csv-generator";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore - role exists in our session
    const userRole = session.user.role;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const studentIds = searchParams.get("studentIds")?.split(",") || undefined;
    const curriculumIds = searchParams.get("curriculumIds")?.split(",") || undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const format = searchParams.get("format") || "csv"; // csv or json

    // Parse dates
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Build filters based on role
    let filters: any = {
      studentIds,
      curriculumIds,
      startDate,
      endDate,
    };

    // Parents can only see their own children's data
    if (userRole === "PARENT") {
      filters.parentId = session.user.id;
    }

    // Teachers and admins can see all data (no additional filtering)

    // Generate report
    const reportData = await generateProgressReport(filters);

    // Return CSV or JSON based on format
    if (format === "csv") {
      const csv = convertToCSV(reportData);
      const filename = `progress-report-${new Date().toISOString().split("T")[0]}.csv`;

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json({
        data: reportData,
        count: reportData.length,
      });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
