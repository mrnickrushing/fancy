import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as menuApi from '../api/menu';
import type { MenuItemInput } from '../api/types';

export function useMenu() {
  return useQuery({ queryKey: ['menu'], queryFn: menuApi.listMenu });
}

export function useMenuActions() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['menu'] });
  return {
    create: useMutation({ mutationFn: (input: MenuItemInput) => menuApi.createMenuItem(input), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: number; patch: Partial<MenuItemInput> }) =>
        menuApi.updateMenuItem(id, patch),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: number) => menuApi.deleteMenuItem(id), onSuccess }),
  };
}
