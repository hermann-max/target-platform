import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "director"]);

/** Scaling Up levels below the Foundation (Core Purpose and Core Values). */
export const goalLevelEnum = pgEnum("goal_level", ["bhag", "target", "annual", "rock"]);

export const evidenceKindEnum = pgEnum("evidence_kind", ["url", "file", "image"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: roleEnum("role").notNull().default("director"),
    passwordHash: text("password_hash"),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token stored in the cookie. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Single-row table holding the Core Purpose. */
export const foundation = pgTable("foundation", {
  id: integer("id").primaryKey().default(1),
  corePurpose: text("core_purpose").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coreValues = pgTable("core_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: goalLevelEnum("level").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => goals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    /** BHAG and 3–5 year targets: the year the goal should be reached by. */
    targetYear: integer("target_year"),
    /** Annual goals and Rocks: the year they belong to. */
    year: integer("year"),
    /** Rocks: quarter 1–4. */
    quarter: integer("quarter"),
    /** The #1 Priority for its year (annual goals) or quarter (Rocks). */
    isTopPriority: boolean("is_top_priority").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goals_parent_idx").on(t.parentId)],
);

export const initiatives = pgTable(
  "initiatives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rockId: uuid("rock_id")
      .notNull()
      .references(() => goals.id, { onDelete: "restrict" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("initiatives_rock_idx").on(t.rockId), index("initiatives_owner_idx").on(t.ownerId)],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedById: uuid("completed_by_id").references(() => users.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("milestones_initiative_idx").on(t.initiativeId)],
);

export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    /** Set when the evidence belongs to a milestone rather than the initiative itself. */
    milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "cascade" }),
    kind: evidenceKindEnum("kind").notNull(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    /** Storage key for uploaded files, used to delete them. */
    storageKey: text("storage_key"),
    contentType: text("content_type"),
    size: integer("size"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("evidence_initiative_idx").on(t.initiativeId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_initiative_idx").on(t.initiativeId)],
);

export type User = typeof users.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Initiative = typeof initiatives.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type GoalLevel = (typeof goalLevelEnum.enumValues)[number];
export type Role = (typeof roleEnum.enumValues)[number];
