const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const signup = async ({ email, password, name }) => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'PATIENT',
      },
    });

    const token = generateToken(user);

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

const login = async ({ email, password, twoFAToken }) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    if (user.is2FAEnabled && user.twoFASecret) {
      if (!twoFAToken) {
        throw new Error('2FA token required');
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: 'base32',
        token: twoFAToken,
      });
      if (!verified) {
        throw new Error('Invalid 2FA token');
      }
    }

    await prisma.log.create({
      data: {
        action: 'LOGIN',
        userId: user.id,
        ipAddress: '0.0.0.0',
        details: 'Successful login',
      },
    });

    const token = generateToken(user);

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

const enable2FA = async (userId) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Secure Health:${userId}`,
      issuer: 'Secure Health',
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFASecret: secret.base32,
        is2FAEnabled: true,
      },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCodeUrl };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

const verify2FA = async (userId, twoFAToken) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.is2FAEnabled || !user.twoFASecret) {
      throw new Error('2FA not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: twoFAToken,
    });

    if (!verified) {
      throw new Error('Invalid 2FA token');
    }

    return { message: '2FA verified successfully' };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

const check2FA = async (email) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { is2FAEnabled: false };
    }
    return { is2FAEnabled: user.is2FAEnabled };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { signup, login, enable2FA, verify2FA, check2FA };
