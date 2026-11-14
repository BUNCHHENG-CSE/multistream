"use server";

import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/auth";
import {
  prisma,
  type GridPreset,
  type SavedLayout,
  type SavedStreamItem,
} from "@/db";
import { isValidYouTubeVideoId } from "@/lib/youtube";

const gridPresetSchema = z.enum(["1x1", "1x2", "2x2", "1+3", "3x3"]);

const streamItemSchema = z.object({
  videoId: z
    .string()
    .trim()
    .refine(isValidYouTubeVideoId, "Invalid 11-character YouTube Video ID"),
  label: z
    .string()
    .trim()
    .min(1, "Stream label is required")
    .max(100, "Stream label must be 100 characters or fewer"),
});

const saveLayoutSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Layout title is required")
    .max(80, "Layout title must be 80 characters or fewer"),
  gridPreset: gridPresetSchema,
  streams: z
    .array(streamItemSchema)
    .min(1, "Add at least one stream before saving a layout")
    .max(9, "A layout can contain at most 9 streams"),
  isPublic: z.boolean().default(false),
});

const uuidSchema = z.string().uuid("Invalid layout ID format");

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PublicLayoutDetail extends SavedLayout {
  authorName: string | null;
}

function normalizePrismaLayout(record: {
  id: string;
  userId: string;
  title: string;
  gridPreset: string;
  streams: unknown;
  isPublic: boolean;
  createdAt: Date;
}): SavedLayout {
  const rawStreams = Array.isArray(record.streams) ? record.streams : [];
  const streams: SavedStreamItem[] = rawStreams
    .filter(
      (item): item is { videoId: string; label: string } =>
        Boolean(
          item &&
            typeof item === "object" &&
            "videoId" in item &&
            typeof (item as { videoId: unknown }).videoId === "string"
        )
    )
    .map((item) => ({
      videoId: item.videoId,
      label:
        typeof item.label === "string" && item.label.trim()
          ? item.label
          : item.videoId,
    }));

  const validPreset = gridPresetSchema.safeParse(record.gridPreset);

  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    gridPreset: (validPreset.success ? validPreset.data : "2x2") as GridPreset,
    streams,
    isPublic: record.isPublic,
    createdAt: record.createdAt,
  };
}

/**
 * Saves the current grid preset and stream array to Neon PostgreSQL via Prisma ORM.
 */
export async function saveLayout(
  input: z.input<typeof saveLayoutSchema>
): Promise<ActionResult<SavedLayout>> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      success: false,
      error:
        "Guests cannot save to the database. Create an account or sign in to save layouts to the cloud.",
    };
  }

  const parsed = saveLayoutSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Invalid layout configuration.",
    };
  }

  const { title, gridPreset, streams, isPublic } = parsed.data;

  try {
    const created = await prisma.savedLayout.create({
      data: {
        userId: session.user.id,
        title,
        gridPreset,
        streams,
        isPublic,
      },
    });

    revalidatePath("/");

    return {
      success: true,
      data: normalizePrismaLayout(created),
    };
  } catch (error) {
    console.error("[saveLayout] Error:", error);
    return {
      success: false,
      error: "Failed to save layout to database. Please try again.",
    };
  }
}

/**
 * Fetches all saved layouts for the currently logged-in user via Prisma ORM.
 */
export async function getUserLayouts(): Promise<ActionResult<SavedLayout[]>> {
  await connection();
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      success: true,
      data: [],
    };
  }

  try {
    const layouts = await prisma.savedLayout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: layouts.map(normalizePrismaLayout),
    };
  } catch (error) {
    console.error("[getUserLayouts] Error:", error);
    return {
      success: false,
      error: "Failed to fetch saved layouts.",
    };
  }
}

/**
 * Deletes a saved layout owned by the logged-in user via Prisma ORM.
 */
export async function deleteLayout(
  layoutId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Create an account or sign in to delete cloud layouts.",
    };
  }

  const parsedId = uuidSchema.safeParse(layoutId);
  if (!parsedId.success) {
    return {
      success: false,
      error: "Invalid layout ID.",
    };
  }

  try {
    const deleted = await prisma.savedLayout.deleteMany({
      where: {
        id: parsedId.data,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Layout not found or you do not have permission to delete it.",
      };
    }

    revalidatePath("/");
    revalidatePath(`/watch/${parsedId.data}`);

    return {
      success: true,
      data: { id: parsedId.data },
    };
  } catch (error) {
    console.error("[deleteLayout] Error:", error);
    return {
      success: false,
      error: "Failed to delete layout. Please try again.",
    };
  }
}

/**
 * Toggles the public/private share status of a user's saved layout via Prisma ORM.
 */
export async function toggleLayoutPublic(
  layoutId: string,
  isPublic: boolean
): Promise<ActionResult<SavedLayout>> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Create an account or sign in to update cloud sharing settings.",
    };
  }

  const parsedId = uuidSchema.safeParse(layoutId);
  if (!parsedId.success) {
    return {
      success: false,
      error: "Invalid layout ID.",
    };
  }

  try {
    const existing = await prisma.savedLayout.findFirst({
      where: {
        id: parsedId.data,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Layout not found.",
      };
    }

    const updated = await prisma.savedLayout.update({
      where: { id: parsedId.data },
      data: { isPublic },
    });

    revalidatePath("/");
    revalidatePath(`/watch/${parsedId.data}`);

    return {
      success: true,
      data: normalizePrismaLayout(updated),
    };
  } catch (error) {
    console.error("[toggleLayoutPublic] Error:", error);
    return {
      success: false,
      error: "Failed to update sharing status.",
    };
  }
}

/**
 * Fetches a shared layout by ID for `/watch/[layoutId]` via Prisma ORM.
 * Accessible if `isPublic` is true or if the requester is the layout owner.
 */
export async function getPublicLayout(
  layoutId: string
): Promise<ActionResult<PublicLayoutDetail>> {
  await connection();
  const parsedId = uuidSchema.safeParse(layoutId);
  if (!parsedId.success) {
    return {
      success: false,
      error: "Invalid layout identifier.",
    };
  }

  const session = await getServerSession();

  try {
    const record = await prisma.savedLayout.findUnique({
      where: { id: parsedId.data },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!record) {
      return {
        success: false,
        error: "Layout not found.",
      };
    }

    if (!record.isPublic) {
      if (!session?.user?.id || session.user.id !== record.userId) {
        return {
          success: false,
          error: "This layout is private and can only be viewed by its creator.",
        };
      }
    }

    return {
      success: true,
      data: {
        ...normalizePrismaLayout(record),
        authorName: record.user?.name ?? "Anonymous Director",
      },
    };
  } catch (error) {
    console.error("[getPublicLayout] Error:", error);
    return {
      success: false,
      error: "Failed to load shared layout.",
    };
  }
}

/**
 * Fetches public community layouts for `/explore` via Prisma ORM.
 */
export async function getPublicCommunityLayouts(): Promise<
  ActionResult<PublicLayoutDetail[]>
> {
  await connection();
  try {
    const records = await prisma.savedLayout.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: records.map((record) => ({
        ...normalizePrismaLayout(record),
        authorName: record.user?.name ?? "Studio Director",
      })),
    };
  } catch (error) {
    console.error("[getPublicCommunityLayouts] Error:", error);
    return {
      success: true,
      data: [],
    };
  }
}

/**
 * Reads the currently authenticated Better Auth user from session cookies.
 */
export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  await connection();
  const session = await getServerSession();
  if (!session?.user?.id || !session.user.email) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name || session.user.email.split("@")[0],
    email: session.user.email,
  };
}
