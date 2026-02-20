import { Request, Response, NextFunction } from "express";
import { createPostSchema, updatePostSchema } from "./posts.schema.js";
import { prisma } from "../../config/db.js";
import { generateSlug } from "../../utils/generateSlug.js";
import { Prisma } from "@prisma/client";

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;

  const where = {
    published: true,
    deletedAt: null,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { content: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [posts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.post.count({ where }),
  ]);

  res.status(200).json({
    posts,
    pagination: {
      page,
      limit,
      total: totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: skip + limit < totalPosts,
    },
  });
};

export const getMyPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorId = req.user?.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!authorId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const [myPosts, totalMyPosts] = await Promise.all([
    prisma.post.findMany({
      where: { authorId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.post.count({
      where: { authorId, deletedAt: null },
    }),
  ]);

  res.status(200).json({
    posts: myPosts,
    pagination: {
      page,
      limit,
      total: totalMyPosts,
      totalPages: Math.ceil(totalMyPosts / limit),
      hasMore: skip + limit < totalMyPosts,
    },
  });
};

export const getPostBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const slug = req.params.slug as string;

  const post = await prisma.post.findUnique({
    where: { slug, published: true, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  res.status(200).json({ post });
};

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { title, content, published } = createPostSchema.parse(req.body);
  const authorId = req.user?.userId;

  if (!authorId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const slug = generateSlug(title);

  const newPost = await prisma.post.create({
    data: {
      title,
      content,
      slug,
      authorId,
      published: published ?? false,
      publishedAt: published ? new Date() : null,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  res.status(201).json({ post: newPost });
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = req.params.id as string;
  const { title, content, published } = updatePostSchema.parse(req.body);
  const authorId = req.user?.userId;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  if (post.authorId !== authorId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const data: Prisma.PostUpdateInput = {};

  if (title) {
    data.title = title;
    data.slug = generateSlug(title);
  }

  if (content) {
    data.content = content;
  }

  if (published !== undefined) {
    data.published = published;
    data.publishedAt = published ? post.publishedAt || new Date() : null;
  }

  const updatedPost = await prisma.post.update({
    where: { id, deletedAt: null },
    data,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  res.status(200).json({ post: updatedPost });
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = req.params.id as string;
  const authorId = req.user?.userId;

  const post = await prisma.post.findUnique({
    where: { id, deletedAt: null },
  });

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  if (post.authorId !== authorId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  await prisma.post.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(204).send();
};
