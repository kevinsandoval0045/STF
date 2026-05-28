/**
 * Auth Controller — handles HTTP requests for authentication.
 */
export class AuthController {
    constructor(authService) {
        this.authService = authService;

        this.register     = this.register.bind(this);
        this.login        = this.login.bind(this);
        this.getProfile   = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
    }

    /**
     * POST /api/v1/auth/register
     */
    async register(req, res) {
        const { email, password, firstName, lastName, phone, address, city, state, zipCode } = req.body;

        // Basic validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: { message: 'Email, contraseña, nombre y apellido son requeridos.' },
            });
        }

        // Email format validation (M-3)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: { message: 'Formato de email inválido.' },
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: { message: 'La contraseña debe tener al menos 6 caracteres.' },
            });
        }

        const result = await this.authService.register({
            email, password, firstName, lastName, phone, address, city, state, zipCode,
        });

        res.status(201).json(result);
    }

    /**
     * POST /api/v1/auth/login
     */
    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: { message: 'Email y contraseña son requeridos.' },
            });
        }

        const result = await this.authService.login({ email, password });
        res.json(result);
    }

    /**
     * GET /api/v1/auth/profile
     * Requires authentication (req.user set by authMiddleware)
     */
    async getProfile(req, res) {
        const user = await this.authService.getProfile(req.user.userId);
        res.json(user);
    }

    /**
     * PUT /api/v1/auth/profile
     * Update address and contact info for the authenticated user.
     */
    async updateProfile(req, res) {
        const { address, city, state, zipCode, phone } = req.body;
        const updated = await this.authService.updateProfile(req.user.userId, {
            address, city, state, zipCode, phone,
        });
        res.json(updated);
    }
}
