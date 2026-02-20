"use client";

import Giscus from "@giscus/react";

interface GiscusCommentsProps {
  postId: string;
}

export default function GiscusComments({ postId }: GiscusCommentsProps) {
  return (
    <div className="mt-12 pt-8 border-t border-edge/50">
      <Giscus
        repo="tpcmurray/tmdotcom"
        repoId="R_kgDORT988A"
        category="Comments"
        categoryId="DIC_kwDORT988M4C21AL"
        mapping="specific"
        term={postId}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme="light"
        lang="en"
      />
    </div>
  );
}
