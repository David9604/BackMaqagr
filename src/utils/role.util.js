/**
 * Utilidades de roles para mantener contrato estable entre backend y frontend.
 */

export const ROLE_ID_TO_NAME = Object.freeze({
  1: 'admin',
  2: 'user',
  3: 'operator'
});

export const ROLE_NAME_TO_ID = Object.freeze({
  admin: 1,
  user: 2,
  operator: 3
});

/**
 * Convierte role_id numérico a su etiqueta string.
 * @param {number|string} roleId
 * @returns {'admin'|'user'|'operator'|'user'}
 */
export const mapRoleIdToName = (roleId) => {
  const normalized = Number(roleId);
  return ROLE_ID_TO_NAME[normalized] || 'user';
};

/**
 * Construye el payload de autenticación esperado por frontend.
 * @param {{ token: string, user: { user_id?: number, id?: number, name: string, email: string, role_id: number } }} params
 */
export const buildAuthPayload = ({ token, user }) => {
  const id = user.user_id ?? user.id;
  const role_id = Number(user.role_id);

  return {
    token,
    user: {
      id,
      name: user.name,
      email: user.email,
    },
    role: mapRoleIdToName(role_id),
    role_id,
  };
};

export default {
  ROLE_ID_TO_NAME,
  ROLE_NAME_TO_ID,
  mapRoleIdToName,
  buildAuthPayload,
};
