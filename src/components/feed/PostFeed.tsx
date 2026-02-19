"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FilterBar from "@/components/feed/FilterBar";
import LogEntry from "@/components/feed/LogEntry";
import EssayEntry from "@/components/feed/EssayEntry";
import Button from "@/components/ui/Button";

export interface Post {
  id: string;
  type: "LOG" | "ESSAY";
  title: string;
  url: string | null;
  domain: string | null;
  content: string | null;
  status: string;
  createdAt: string;
  tags: { id: string; name: string }[];
}

type FilterType = "all" | "LOG" | "ESSAY";

const LIMIT = 20;

export default function PostFeed() {
  const [type, setType] = useState<FilterType>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Track whether the current fetch should reset or append
  const isLoadMore = useRef(false);

  const fetchPosts = useCallback(
    async (currentPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(LIMIT),
        });
        if (type !== "all") params.set("type", type);
        if (tag) params.set("tag", tag);
        if (search) params.set("search", search);

        const res = await fetch(`/api/posts?${params}`);
        if (!res.ok) return;
        const data = await res.json();

        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setTotal(data.total);
      } catch {
        // silently ignore network errors
      } finally {
        setLoading(false);
      }
    },
    [type, tag, search],
  );

  // Reset on filter change
  useEffect(() => {
    if (isLoadMore.current) {
      isLoadMore.current = false;
      return;
    }
    setPage(1);
    fetchPosts(1, false);
  }, [type, tag, search, fetchPosts]);

  // Append on Load More
  useEffect(() => {
    if (page === 1) return;
    fetchPosts(page, true);
  }, [page, fetchPosts]);

  const handleLoadMore = () => {
    isLoadMore.current = true;
    setPage((p) => p + 1);
  };

  const hasMore = total > posts.length;

  return (
    <div>
      <FilterBar
        activeType={type}
        activeTag={tag}
        onTypeChange={(t) => {
          setType(t);
          setTag(null);
        }}
        onTagChange={setTag}
        onSearchChange={setSearch}
      />

      <div className="mt-6">
        {posts.map((post) =>
          post.type === "LOG" ? (
            <LogEntry key={post.id} post={post} />
          ) : (
            <EssayEntry key={post.id} post={post} />
          ),
        )}
      </div>

      {loading && posts.length === 0 && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-6 border-b border-edge/50 animate-pulse">
              <div className="h-3 w-20 bg-edge/40 rounded mb-2" />
              <div className="h-5 w-3/4 bg-edge/50 rounded mb-2" />
              <div className="h-3 w-32 bg-edge/30 rounded mb-3" />
              <div className="h-4 w-full bg-edge/30 rounded mb-1.5" />
              <div className="h-4 w-2/3 bg-edge/30 rounded mb-3" />
              <div className="flex gap-1.5">
                <div className="h-5 w-14 bg-edge/30 rounded-full" />
                <div className="h-5 w-10 bg-edge/30 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <p className="font-meta text-sm text-ink-muted py-6 text-center">
          Loading…
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p className="font-meta text-sm text-ink-muted py-12 text-center">
          {search
            ? `No results for "${search}"`
            : "No posts yet — check back soon."}
        </p>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center mt-8">
          <Button variant="ghost" onClick={handleLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
