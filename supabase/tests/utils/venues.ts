import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { TestUserT } from "./testClients.ts";
import { createTestUser, deleteTestUser, runSql } from "./testClients.ts";

/** Postgres "insufficient privilege": no grant for the role, or a row RLS refuses. */
export const PERMISSION_DENIED = "42501";
/** The daily cap trigger's own SQLSTATE. */
export const CREATION_CAP = "PR001";
/** The link host check's own SQLSTATE. */
export const LINK_HOST = "PR002";

/** GeoNames IDs of the cities the tests use. */
export const BERLIN = 2950159;
export const KOLN = 2886242;

export type RoleT = "moderator" | "admin";
export type VenueIdsT = { id: string; short_id: string };
export type EditT = {
  field: string;
  old_value: unknown;
  new_value: unknown;
  edited_by: string | null;
};
export type VenueArgsT = {
  name?: string;
  city_id?: number;
  links?: Record<string, string>;
  sound_system_ids?: string[];
};

/**
 * 8 random characters no other test run uses. Never "b2b", which DJ names refuse.
 */
export const newSuffix = (): string =>
  randomUUID().replaceAll("-", "").slice(0, 8).replaceAll("b2b", "b3b");

/** A name no other test run uses, so searches find only this run's entries. */
export const newName = (prefix: string): string => `${prefix} ${newSuffix()}`;

/** Gives a test user a profile, as the user would after first sign-in. */
export const createProfile = async (user: TestUserT): Promise<void> => {
  const handle = `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const { error } = await user.client.from("profiles").insert({ handle });
  if (error) {
    throw error;
  }
};

/**
 * Test users with profiles, each made new, with a role when given. Call `deleteAll` in
 * `afterAll`.
 */
export const createUserPool = (): {
  newUser: (role?: RoleT) => Promise<TestUserT>;
  track: (user: TestUserT) => void;
  deleteAll: () => Promise<void>;
} => {
  const users: TestUserT[] = [];
  return {
    newUser: async (role) => {
      const user = await createTestUser();
      users.push(user);
      await createProfile(user);
      if (role) {
        await runSql(
          `update public.profiles set role = '${role}' where id = '${user.userId}'`
        );
      }
      return user;
    },
    track: (user) => {
      users.push(user);
    },
    deleteAll: async () => {
      await Promise.all(users.map((user) => deleteTestUser(user.userId)));
    }
  };
};

/** Creates a venue through `create_venue` as the client's user. */
export const createVenue = async (
  client: SupabaseClient,
  args: VenueArgsT = {}
): Promise<VenueIdsT> => {
  const result = await client
    .rpc("create_venue", {
      name: args.name ?? newName("Venue"),
      city_id: args.city_id ?? BERLIN,
      links: args.links ?? {},
      sound_system_ids: args.sound_system_ids ?? []
    })
    .single<VenueIdsT>();
  if (result.error) {
    throw result.error;
  }
  return result.data;
};

/** A venue's catalog edits, read as `postgres` so the policies under test do not apply. */
export const readEdits = async (venueId: string): Promise<EditT[]> =>
  runSql<EditT>(`
    select field, old_value, new_value, edited_by from public.catalog_edits
    where entity_type = 'venue' and entity_id = '${venueId}'
    order by created_at, field`);

/** A venue's name and city, read as `postgres`. */
export const readVenue = async (venueId: string): Promise<Record<string, unknown>> => {
  const [row] = await runSql<Record<string, unknown>>(
    `select name, city_id from public.venues where id = '${venueId}'`
  );
  return row;
};

/** How many links a venue has, read as `postgres`. */
export const countLinks = async (venueId: string): Promise<number> => {
  const [row] = await runSql<{ count: number }>(
    `select count(*)::int as count from public.links where venue_id = '${venueId}'`
  );
  return row.count;
};
