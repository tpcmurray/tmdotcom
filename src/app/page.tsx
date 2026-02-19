import PostFeed from "@/components/feed/PostFeed";

export default function HomePage() {
  return (
    <>
      {/* Bio */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-12">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
          Terry Murray
        </h1>
        <div className="font-body text-base text-ink-soft leading-relaxed space-y-3">
          <p>
            Hi, I'm Terry. I&apos;ve been building with large language models since 
            ChatGPT launched in November 2022, and I haven&apos;t shut up about them since.
            So much so that at the company I work for I'm now Senior Director of AI in Development.
          </p>
          <p>
            This space is where I share what I&apos;m reading, watching, and thinking
            about in the AI space. I consume a lot of content — articles,
            whitepapers, videos — and I log it all here with my notes. Sometimes
            I write longer pieces when an idea won&apos;t leave me alone.
          </p>
        </div>
        <p className="font-body italic text-ink-muted text-sm mt-4">
          If you work with me, this might be the answer to &ldquo;what should I be
          reading?&rdquo;
        </p>
      </section>

      {/* Feed */}
      <PostFeed />
    </>
  );
}
