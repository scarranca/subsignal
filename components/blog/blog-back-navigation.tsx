import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BlogBackNavigationProps {
    href?: string;
    text?: string;
    className?: string;
}

export default function BlogBackNavigation({
    href = '/blog',
    text = 'Back to Blog',
    className = 'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
}: BlogBackNavigationProps) {
    return (
        <div className="flex items-center gap-2">
            <Link href={href} className={className}>
                <ArrowLeft className="h-4 w-4" />
                {text}
            </Link>
        </div>
    );
}
