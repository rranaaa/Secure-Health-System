const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true },
      orderBy: { id: 'asc' }
    });
    return users;
  } catch (error) {
    throw new Error('Failed to fetch users');
  }
};

const updateUserRole = async (userId, role) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { role },
    });
    return user;
  } catch (error) {
    throw new Error('Failed to update user role');
  }
};

const getAuditLogs = async () => {
  try {
    const logs = await prisma.log.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { timestamp: 'desc' },
    });
    return logs;
  } catch (error) {
    throw new Error('Failed to fetch audit logs');
  }
};

const getAllAppointments = async () => {
  return prisma.appointment.findMany({
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });
};

const getAllPrescriptions = async () => {
  return prisma.prescription.findMany({
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
      encryptedData: true,
    },
  });
};


const toggleUserActiveStatus = async (userId, enable) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { isActive: enable },
    });
    return user;
  } catch (error) {
    console.error(`Error updating user active status for userId=${userId}:`, error);
    throw new Error('Failed to update user active status');
  }
};

module.exports = { getUsers, updateUserRole, getAuditLogs, getAllAppointments, getAllPrescriptions, toggleUserActiveStatus };
