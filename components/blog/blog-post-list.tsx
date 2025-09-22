import BlogPostCard from './blog-post-card';

interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    author: string;
}

interface BlogPostListProps {
    posts: BlogPost[];
}

export default function BlogPostList({ posts }: BlogPostListProps) {
    return (
        <div className="w-full max-w-4xl">
            <div className="grid gap-8 md:gap-12">
                {posts.map((post) => (
                    <BlogPostCard key={post.slug} post={post} />
                ))}
            </div>
        </div>
    );
}
