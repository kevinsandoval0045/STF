import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const SALT_ROUNDS = 10;

/**
 * Auth Service — handles registration, login, and profile retrieval.
 */
export class AuthService {
    constructor(authRepository, emailService) {
        this.authRepository = authRepository;
        this.emailService = emailService;
    }

    /**
     * Register a new user.
     * @returns {{ user, token }}
     */
    async register({ email, password, firstName, lastName, phone, address, city, state, zipCode }) {
        // Check if email already exists
        const existing = await this.authRepository.findByEmail(email);
        if (existing) {
            const error = new Error('Ya existe una cuenta con este correo electrónico.');
            error.statusCode = 409;
            throw error;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await this.authRepository.create({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone?.trim() || '',
            address: address?.trim() || '',
            city: city?.trim() || '',
            state: state?.trim() || '',
            zipCode: zipCode?.trim() || '',
        });

        // Generate JWT
        const token = this._generateToken(user);

        // Send welcome email (fire-and-forget — never blocks registration)
        this.emailService.sendWelcome({ email: user.email, firstName: user.firstName });

        return {
            user: this._sanitizeUser(user),
            token,
        };
    }

    /**
     * Login with email and password.
     * @returns {{ user, token }}
     */
    async login({ email, password }) {
        const user = await this.authRepository.findByEmail(email.toLowerCase().trim());
        if (!user) {
            const error = new Error('Correo electrónico o contraseña incorrectos.');
            error.statusCode = 401;
            throw error;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            const error = new Error('Correo electrónico o contraseña incorrectos.');
            error.statusCode = 401;
            throw error;
        }

        const token = this._generateToken(user);

        return {
            user: this._sanitizeUser(user),
            token,
        };
    }

    /**
     * Get user profile by ID.
     */
    async getProfile(userId) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            const error = new Error('Usuario no encontrado.');
            error.statusCode = 404;
            throw error;
        }
        return this._sanitizeUser(user);
    }

    /**
     * Update user profile (address, phone).
     * @returns {Object} updated sanitized user
     */
    async updateProfile(userId, { address, city, state, zipCode, phone }) {
        const updated = await this.authRepository.updateProfile(userId, {
            ...(address  !== undefined && { address:  address.trim()  }),
            ...(city     !== undefined && { city:     city.trim()     }),
            ...(state    !== undefined && { state:    state.trim()    }),
            ...(zipCode  !== undefined && { zipCode:  zipCode.trim()  }),
            ...(phone    !== undefined && { phone:    phone.trim()    }),
        });
        return updated;
    }

    /**
     * Generate a JWT token for the user.
     */
    _generateToken(user) {
        return jwt.sign(
            { userId: user.id, email: user.email },
            config.jwtSecret,
            { expiresIn: '7d' }
        );
    }

    /**
     * Remove sensitive fields from user object.
     */
    _sanitizeUser(user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }
}
