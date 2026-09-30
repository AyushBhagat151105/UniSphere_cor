import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createClubBodySchema = z.object({
  name: z.string().min(3).max(80).openapi({
    example: "Developer Club",
    description: "The name of the campus club",
  }),
  category: z.enum(["CULTURAL", "ARTS", "TECHNICAL", "SPORTS", "LITERARY", "SOCIAL"]).openapi({
    example: "TECHNICAL",
  }),
  description: z.string().min(10).max(2000).openapi({
    example: "We build things.",
  }),
  departmentId: z.string().nullable().optional(),
  facultyAdminIds: z.array(z.string()).min(1),
  studentRepAdminIds: z.array(z.string()).default([]),
});

export const createClubResponseSchema = z.object({
  id: z.string().uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  name: z.string(),
  createdAt: z.string().datetime(),
});
