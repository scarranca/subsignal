import { Badge } from '@/components/ui/badge';

interface BlogPost {
    title: string;
    excerpt: string;
    category: string;
    date: string;
    author: string;
}

interface BlogPostHeaderProps {
    post: BlogPost;
}

export default function BlogPostHeader({ post }: BlogPostHeaderProps) {
    return (
        <header className="flex flex-col gap-6">
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

                <h1 className="font-dm-sans font-semibold text-3xl md:text-5xl leading-tight">
                    {post.title}
                </h1>

                <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
                    {post.excerpt}
                </p>
            </div>
        </header>
    );
}
