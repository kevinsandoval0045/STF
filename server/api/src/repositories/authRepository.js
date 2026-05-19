/**
 * Auth Repository — database operations for User entity.
 */
export class AuthRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Find a user by email.
     */
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    /**
     * Find a user by ID.
     */
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                createdAt: true,
            },
        });
    }

    /**
     * Create a new user.
     */
    async create(data) {
        return this.prisma.user.create({ data });
    }

    /**
     * Update user profile fields (address, phone, etc.).
     * Returns the updated sanitized user.
     */
    async updateProfile(id, data) {
        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                createdAt: true,
            },
        });
    }
}
