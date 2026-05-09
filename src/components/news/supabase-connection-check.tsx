"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type CheckState =
  | { status: "loading" }
  | { status: "success"; item: { id: string; title: string; source_name: string; published_at: string } }
  | { status: "empty" }
  | { status: "error"; message: string };

const SELECT_POLICY_SQL = `create policy "public_can_read_news_items"
on public.news_items
for select
to anon
using (true);`;

export function SupabaseConnectionCheck() {
  const [state, setState] = useState<CheckState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function runCheck() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (active) {
          setState({ status: "error", message: "前端缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。" });
        }
        return;
      }

      const { data, error } = await supabase
        .from("news_items")
        .select("id,title,source_name,published_at")
        .eq("id", "11")
        .maybeSingle();

      if (!active) {
        return;
      }

      if (error) {
        setState({ status: "error", message: error.message });
        return;
      }

      if (!data) {
        setState({ status: "empty" });
        return;
      }

      setState({
        status: "success",
        item: {
          id: String(data.id),
          title: String(data.title),
          source_name: String(data.source_name),
          published_at: String(data.published_at),
        },
      });
    }

    void runCheck();

    return () => {
      active = false;
    };
  }, []);

  return (
    <article className="glass-panel rounded-[30px] p-6">
      <p className="section-label">Supabase Check</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--charcoal)]">
        前端匿名读取 `news_items.id = 11`
      </h3>

      {state.status === "loading" ? (
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">正在用前端 public key 检查 Supabase 联通状态...</p>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-white/75 p-4">
          <p className="text-sm font-medium text-[var(--foreground)]">联通成功</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            这说明这条数据已经通过
            <span className="font-medium text-[var(--foreground)]"> Vercel 前端 → Supabase anon 权限 → news_items </span>
            被读出来了。
          </p>
          <div className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
            <p>
              <span className="font-medium">id:</span> {state.item.id}
            </p>
            <p>
              <span className="font-medium">title:</span> {state.item.title}
            </p>
            <p>
              <span className="font-medium">source:</span> {state.item.source_name}
            </p>
            <p>
              <span className="font-medium">published_at:</span> {state.item.published_at}
            </p>
          </div>
        </div>
      ) : null}

      {state.status === "empty" ? (
        <div className="mt-4 rounded-[22px] border border-[rgba(202,93,52,0.18)] bg-[var(--accent-soft)] p-4">
          <p className="text-sm font-medium text-[var(--foreground)]">前端已连上 Supabase，但匿名查询没读到这条数据</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            我已经验证过服务端可以查到 `id = 11`，所以这通常不是“数据不存在”，而是
            <span className="font-medium text-[var(--foreground)]"> RLS 没给 anon 只读权限</span>。
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">你可以在 Supabase SQL Editor 里执行下面这条只读 policy：</p>
          <pre className="mt-3 overflow-x-auto rounded-[18px] bg-[rgba(34,37,43,0.92)] p-4 text-xs leading-6 text-white">
            <code>{SELECT_POLICY_SQL}</code>
          </pre>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-4 rounded-[22px] border border-[rgba(202,93,52,0.18)] bg-[var(--accent-soft)] p-4">
          <p className="text-sm font-medium text-[var(--foreground)]">前端匿名读取失败</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{state.message}</p>
        </div>
      ) : null}
    </article>
  );
}
