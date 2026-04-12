import * as UserService from "../../services/members/User.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET, TOKEN_EXPIRES_IN } from "../../../config.js";

/**
 * @description System Login: Validates credentials and sets HTTP-only cookie.
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1. Find user and check password
    const user = await UserService.findUserByUsername(username);
    if (
      !user ||
      !(await UserService.comparePassword(password, user.password))
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Cuenta de usuario desactivada" });
    }

    // 2. Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, TOKEN_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    // 3. Set HTTP-only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

/**
 * @description System Logout: Clears the auth cookie.
 */
export const logout = (req, res) => {
  res.clearCookie("token");
  res
    .status(200)
    .json({ success: true, message: "Sesión cerrada exitosamente" });
};

/**
 * @description Get current authenticated user profile (Check Auth).
 */
export const me = async (req, res) => {
  // req.user comes from the 'auth' middleware
  res.status(200).json({ success: true, data: req.user });
};

/**
 * @description Verify token validity using auth middleware.
 */
export const verifyToken = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Standard User CRUD (findAll, create, etc.)
 * used primarily by Admins to manage staff.
 */
export const create = async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
