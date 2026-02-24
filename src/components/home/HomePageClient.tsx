"use client";

import { useEffect, useState } from "react";
import PostFeed from "@/components/feed/PostFeed";
import Sidebar from "@/components/home/Sidebar";
import MobileBioBar from "@/components/home/MobileBioBar";

interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

export default function HomePageClient() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data: TagWithCount[]) => setTags(data.filter((t) => t.count > 0)))
      .catch(() => {});
  }, []);

  return (
    <div className="main-layout">
      <div className="feed-column">
        {/* Mobile-only bio bar */}
        <MobileBioBar
          tags={tags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
        />

        {/* Feed with filters */}
        <PostFeed activeTag={activeTag} onTagChange={setActiveTag} />
      </div>

      {/* Desktop sidebar */}
      <Sidebar tags={tags} activeTag={activeTag} onTagChange={setActiveTag} />
    </div>
  );
}
