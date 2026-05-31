import { Link } from 'react-router-dom';


export default function CategoryCard({ category }) {
    return (
        <Link
            to={`/categoria/${category.slug}`}
            className="group relative block overflow-hidden rounded-2xl aspect-square shadow-md hover:shadow-xl transition-all duration-300"
            aria-label={`Ver categoría ${category.name}`}
        >
            {/* Image or gradient placeholder */}
            {category.image ? (
                <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-red-50 group-hover:to-red-100 transition-all duration-300" />
            )}

            {/* Dark gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Category name */}
            <div className="absolute bottom-0 inset-x-0 p-4">
                <h3 className="text-center text-white text-xl font-bold drop-shadow-lg group-hover:text-brand-red transition-colors duration-200">
                    {category.name}
                </h3>
            </div>
        </Link>
    );
}
