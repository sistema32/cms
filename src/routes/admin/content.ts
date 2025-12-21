import { Hono } from "hono";
import { contentController } from "@/controllers/admin/contentController.ts";

export const contentRouter = new Hono();

/**
 * GET /content - Content list
 */
contentRouter.get("/content", contentController.list);

/**
 * GET /content/new - New content form
 */
contentRouter.get("/content/new", contentController.createForm);
contentRouter.post("/content/new", contentController.create);

/**
 * GET /content/edit/:id - Show content edit form
 */
contentRouter.get("/content/edit/:id", contentController.editForm);
contentRouter.post("/content/edit/:id", contentController.update);

/**
 * POST /content/delete/:id - Delete content
 */
contentRouter.post("/content/delete/:id", contentController.delete);

/**
 * GET /posts - Posts list
 */
contentRouter.get("/posts", contentController.listPosts);

/**
 * POST /posts/autosave - Autosave post draft
 */
contentRouter.post("/posts/autosave", contentController.autosavePost);

/**
 * GET /posts/new - New post form
 */
contentRouter.get("/posts/new", contentController.createPostForm);
contentRouter.post("/posts/new", contentController.createPost);

/**
 * GET /posts/edit/:id - Edit post form
 */
contentRouter.get("/posts/edit/:id", contentController.editPostForm);
contentRouter.post("/posts/edit/:id", contentController.updatePost);

/**
 * POST /posts/delete/:id - Delete post
 */
contentRouter.post("/posts/delete/:id", contentController.deletePost);

/**
 * GET /pages - Pages list
 */
contentRouter.get("/pages", contentController.listPages);

/**
 * GET /pages/new - New page form
 */
contentRouter.get("/pages/new", contentController.createPageForm);
contentRouter.post("/pages/new", contentController.createPage);

/**
 * GET /pages/edit/:id - Edit page form
 */
contentRouter.get("/pages/edit/:id", contentController.editPageForm);
contentRouter.post("/pages/edit/:id", contentController.updatePage);

/**
 * POST /pages/delete/:id - Delete page
 */
contentRouter.post("/pages/delete/:id", contentController.deletePage);
