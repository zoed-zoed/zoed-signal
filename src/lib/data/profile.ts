import { unstable_noStore as noStore } from "next/cache";

import { getDataSourceMode } from "@/lib/data/source-mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type UserProfileRecord = {
  id: string;
  displayName: string;
  major?: string;
  academicYear?: string;
  careerDirection?: string;
  isBusinessStudent: boolean;
  interests: string[];
  createdAt?: string;
};

export type UserReadRecord = {
  newsId: string;
  readAt: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  major: string | null;
  academic_year: string | null;
  career_direction: string | null;
  is_business_student: boolean;
  interests: string[] | null;
  created_at: string | null;
};

type UserReadRow = {
  news_id: string;
  read_at: string;
};

export async function getCurrentProfile(): Promise<UserProfileRecord> {
  noStore();

  if (getDataSourceMode() !== "supabase") {
    return defaultProfile();
  }

  const supabase = getRequiredSupabaseClient();
  const ownerUserId = process.env.ZOED_BOOKMARK_OWNER_USER_ID?.trim();

  const query = ownerUserId
    ? supabase.from("profiles").select("*").eq("id", ownerUserId).maybeSingle()
    : supabase.from("profiles").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to read profile from Supabase: ${error.message}`);
  }

  if (!data) {
    return defaultProfile();
  }

  return profileFromRow(data as ProfileRow);
}

export async function getCurrentUserReads(): Promise<UserReadRecord[]> {
  noStore();

  if (getDataSourceMode() !== "supabase") {
    return [];
  }

  const supabase = getRequiredSupabaseClient();
  const profile = await getCurrentProfile();

  if (!profile.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_reads")
    .select("news_id,read_at")
    .eq("user_id", profile.id)
    .order("read_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read user reads from Supabase: ${error.message}`);
  }

  return ((data ?? []) as UserReadRow[]).map((row) => ({
    newsId: row.news_id,
    readAt: row.read_at,
  }));
}

function profileFromRow(row: ProfileRow): UserProfileRecord {
  return {
    id: row.id,
    displayName: row.display_name?.trim() || "Zoed 用户",
    major: row.major ?? undefined,
    academicYear: row.academic_year ?? undefined,
    careerDirection: row.career_direction ?? undefined,
    isBusinessStudent: Boolean(row.is_business_student),
    interests: Array.isArray(row.interests) ? row.interests : [],
    createdAt: row.created_at ?? undefined,
  };
}

function defaultProfile(): UserProfileRecord {
  return {
    id: "",
    displayName: "Zoed 用户",
    major: "Business",
    academicYear: "Senior",
    careerDirection: "AI product",
    isBusinessStudent: true,
    interests: ["AI 与机器学习", "企业 SaaS", "风险投资"],
  };
}

function getRequiredSupabaseClient() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }
  return supabase;
}
