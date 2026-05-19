/**
 * SkeletonProductCard — animated placeholder that mimics
 * the ProductCard layout while products are loading.
 */
export default function SkeletonProductCard() {
    return (
        <div className="card overflow-hidden flex flex-col animate-pulse">
            {/* Image placeholder */}
            <div className="skeleton w-full h-56" />

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 space-y-3">
                {/* Brand */}
                <div className="skeleton h-3 w-16" />
                {/* Name */}
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                {/* Spacer */}
                <div className="mt-auto" />
                {/* Price */}
                <div className="skeleton h-6 w-20" />
                {/* Button */}
                <div className="skeleton h-10 w-full rounded-lg" />
            </div>
        </div>
    );
}
