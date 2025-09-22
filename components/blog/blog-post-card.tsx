import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    author: string;
}

interface BlogPostCardProps {
    post: BlogPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
    return (
        <article className="text-left border-b border-border/30 pb-8 last:border-b-0">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                        {post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}{' '}
                        • {post.author}
                    </span>
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="font-dm-sans font-semibold text-2xl md:text-3xl leading-tight hover:text-primary transition-colors">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-muted-foreground leading-relaxed md:text-lg">
                        {post.excerpt}
                    </p>

                    <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm font-medium text-primary hover:underline inline-flex w-fit"
                    >
                        Read more →
                    </Link>
                </div>
            </div>
        </article>
    );
}
