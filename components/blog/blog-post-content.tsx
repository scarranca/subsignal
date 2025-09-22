import { MDXRemote } from 'next-mdx-remote/rsc';

interface BlogPostContentProps {
    content: string;
    className?: string;
}

export default function BlogPostContent({
    content,
    className = 'blog-content',
}: BlogPostContentProps) {
    return (
        <div className={className}>
            <MDXRemote source={content} />
        </div>
    );
}
