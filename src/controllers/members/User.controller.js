import * as UserService from "../../services/members/User.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

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

    const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res
    .status(200)
    .json({ success: true, message: "Sesión cerrada exitosamente" });
};

export const me = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

export const verifyToken = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

export const findAll = async (req, res, next) => {
  try {
    const result = await UserService.findAllUsers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

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
