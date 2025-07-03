const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = new PrismaClient();

const signup = async ({ email, password, name, role = 'PATIENT' }) => {
  try {
    console.log('Creating user:', { email, name, role });
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'SIGNUP',
        ipAddress: '0.0.0.0',
        details: `User ${email} signed up as ${role}`,
      },
    });
    return { user, token };
  } catch (error) {
    console.error('Signup service error:', error.message);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      throw new Error('Email already exists');
    }
    throw new Error(error.message || 'Failed to signup');
  } finally {
    await prisma.$disconnect();
  }
};

const login = async ({ email, password, twoFAToken }) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }
    if (user.is2FAEnabled && twoFAToken) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: 'base32',
        token: twoFAToken,
      });
      if (!verified) {
        throw new Error('Invalid 2FA token');
      }
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
  } catch (error) {
    console.error('Login service error:', error.message);
    throw new Error(error.message || 'Failed to login');
  } finally {
    await prisma.$disconnect();
  }
};

const setup2FA = async (userId) => {
  try {
    const secret = speakeasy.generateSecret({ name: `SecureHealth:${userId}` });
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    await prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: secret.base32 },
    });
    return { secret: secret.base32, qrCode };
  } catch (error) {
    console.error('2FA setup service error:', error.message);
    throw new Error('Failed to setup 2FA');
  } finally {
    await prisma.$disconnect();
  }
};

const verify2FA = async (userId, token) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFASecret) {
      throw new Error('2FA not setup');
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
    });
    if (!verified) {
      throw new Error('Invalid 2FA token');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { is2FAEnabled: true },
    });
    return { message: '2FA enabled successfully' };
  } catch (error) {
    console.error('2FA verify service error:', error.message);
    throw new Error(error.message || 'Failed to verify 2FA');
  } finally {
    await prisma.$disconnect();
  }
};

const updateProfile = async (userId, { name }) => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
    });
    return user;
  } catch (error) {
    console.error('Profile update service error:', error.message);
    throw new Error('Failed to update profile');
  } finally {
    await prisma.$disconnect();
  }
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid current password');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  } catch (error) {
    console.error('Password change service error:', error.message);
    throw new Error(error.message || 'Failed to change password');
  } finally {
    await prisma.$disconnect();
  }
};

const getDoctors = async () => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true },
    });
    return doctors;
  } catch (error) {
    console.error('Get doctors service error:', error.message);
    throw new Error('Failed to fetch doctors');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { signup, login, setup2FA, verify2FA, updateProfile, changePassword, getDoctors };