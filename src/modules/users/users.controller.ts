import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";
import { updateUserSchema } from "./users.schemas.js";
import { Prisma } from "@prisma/client";

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const username = req.params.username as string;

  const user = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      profileImage: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const [totalPosts, totalComments, posts] = await Promise.all([
    prisma.post.count({
      where: { authorId: user.id, published: true, deletedAt: null },
    }),
    prisma.comment.count({
      where: { authorId: user.id, deletedAt: null },
    }),
    prisma.post.findMany({
      where: { authorId: user.id, published: true, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const totalLikesReceived = posts.reduce(
    (sum, post) => sum + post._count.likes,
    0,
  );

  res.status(200).json({
    user,
    stats: {
      totalPosts,
      totalComments,
      totalLikesReceived,
    },
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    })),
  });
};

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      emailVerified: true,
      bio: true,
      profileImage: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const [totalPosts, draftsCount, totalComments, posts] = await Promise.all([
    prisma.post.count({
      where: { authorId: userId, deletedAt: null },
    }),
    prisma.post.count({
      where: { authorId: userId, published: false, deletedAt: null },
    }),
    prisma.comment.count({
      where: { authorId: userId, deletedAt: null },
    }),

    prisma.post.findMany({
      where: { authorId: userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalLikesReceived = posts.reduce(
    (sum, post) => sum + post._count.likes,
    0,
  );

  res.status(200).json({
    user,
    stats: {
      totalPosts,
      draftsCount,
      totalComments,
      totalLikesReceived,
    },
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      published: post.published,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    })),
  });
};

export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId as string;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { name, bio, profileImage } = updateUserSchema.parse(req.body);

  const data: Prisma.UserUpdateInput = {};

  if (name !== undefined) data.name = name;
  if (bio !== undefined) data.bio = bio;
  if (profileImage !== undefined) data.profileImage = profileImage;

  const updatedUser = await prisma.user.update({
    where: { id: userId, deletedAt: null },
    data,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      emailVerified: true,
      bio: true,
      profileImage: true,
      createdAt: true,
    },
  });

  res.status(200).json({ user: updatedUser });
};
