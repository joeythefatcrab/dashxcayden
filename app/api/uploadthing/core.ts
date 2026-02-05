import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  curriculumUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "text/csv": { maxFileSize: "4MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      // Only parents and admins can upload curricula
      if (!["PARENT", "ADMIN"].includes(session.user.role)) {
        throw new Error("Only parents and admins can upload curricula");
      }

      return { userId: session.user.id, role: session.user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  lessonAttachment: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      if (!["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
        throw new Error("Only admins can attach files");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
