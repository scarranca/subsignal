import { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import Footer from '@/components/home/footer';
import BlogHeader from '@/components/blog/blog-header';
import BlogPostList from '@/components/blog/blog-post-list';

export const metadata: Metadata = {
    title: 'Blog | Subsignal - Never Miss a Market Move',
    description:
        'Be the investor founders turn to. Stay ahead with market intelligence, competitive insights, and sector analysis from the Subsignal team.',
    keywords:
        'market intelligence, competitive intelligence, deal intelligence, relationship intelligence, market moves, portfolio monitoring, investment tracking, sector thesis, blog',
    openGraph: {
        title: 'Blog | Subsignal - Never Miss a Market Move',
        description:
            'Be the investor founders turn to. Stay ahead with market intelligence, competitive insights, and sector analysis from the Subsignal team.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog | Subsignal - Never Miss a Market Move',
        description:
            'Be the investor founders turn to. Stay ahead with market intelligence, competitive insights, and sector analysis from the Subsignal team.',
    },
};

export default async function Blog() {
    const { posts } = await getAllPosts();
    return (
        <>
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-start px-12 text-center">
                <BlogHeader />
                <BlogPostList posts={posts} />
            </div>
            <Footer />
        </>
    );
}
