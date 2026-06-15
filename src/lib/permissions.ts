import { useAuthStore } from '@/store/authStore';
import { ROLE_MENU_ACCESS } from '@shared/types';
import type { UserRole, PermissionKey } from '@shared/types';

export function hasPermission(perm: PermissionKey): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions.includes(perm);
}

export function hasAnyPermission(perms: PermissionKey[]): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return perms.some(perm => user.permissions.includes(perm));
}

export function hasAllPermissions(perms: PermissionKey[]): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return perms.every(perm => user.permissions.includes(perm));
}

export function canAccessMenu(path: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.role === 'super_admin') return true;

  const allowedPaths = ROLE_MENU_ACCESS[user.role] || [];
  
  return allowedPaths.some(allowedPath => {
    if (allowedPath === path) return true;
    if (path.startsWith(allowedPath + '/')) return true;
    return false;
  });
}

interface MenuItem {
  path: string;
  label: string;
  icon?: React.ElementType;
  children?: { path: string; label: string }[];
}

export function filterMenuByRole<T extends MenuItem>(menuItems: T[]): T[] {
  const user = useAuthStore.getState().user;
  if (!user) return [];
  
  const role = user.role as UserRole;
  const allowedPaths = ROLE_MENU_ACCESS[role] || [];

  const filterChildren = (children: { path: string; label: string }[]) => {
    return children.filter(child => 
      allowedPaths.some(p => p === child.path || child.path.startsWith(p + '/'))
    );
  };

  return menuItems
    .map(item => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterChildren(item.children);
        if (filteredChildren.length === 0) return null;
        
        const hasDirectAccess = allowedPaths.some(p => 
          p === item.path || item.path.startsWith(p + '/')
        );
        
        if (!hasDirectAccess && filteredChildren.length === 0) return null;
        
        return { ...item, children: filteredChildren };
      }
      
      const hasAccess = allowedPaths.some(p => 
        p === item.path || item.path.startsWith(p + '/')
      );
      
      return hasAccess ? item : null;
    })
    .filter((item): item is T => item !== null);
}

export function usePermission(perm: PermissionKey): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions.includes(perm);
}

export function useAnyPermission(perms: PermissionKey[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return perms.some(perm => user.permissions.includes(perm));
}

export function useAllPermissions(perms: PermissionKey[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return perms.every(perm => user.permissions.includes(perm));
}
