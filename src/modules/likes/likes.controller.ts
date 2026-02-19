import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";

export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const postId = req.params.id as string;
  const userId = req.user?.userId as string;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId, published: true, deletedAt: null },
  });

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });

    res.status(200).json({ message: "Post unliked" });
    return;
  }

  await prisma.like.create({
    data: {
      userId,
      postId,
    },
  });

  res.status(201).json({ message: "Post liked" });
};

export const getLikesForPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const postId = req.params.id as string;

  const post = await prisma.post.findUnique({
    where: { id: postId, published: true, deletedAt: null },
  });

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  const likes = await prisma.like.findMany({
    where: { postId },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res
    .status(200)
    .json({ likes: likes.map((like) => like.user), totalLikes: likes.length });
};
