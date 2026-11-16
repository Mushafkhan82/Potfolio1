import React from 'react';
import {
  AdminStudio,
  type AdminStudioProps,
  type AdminTabId,
  type AdminWorkspaceMode,
} from './AdminStudio';

export { AdminStudio, type AdminStudioProps, type AdminTabId, type AdminWorkspaceMode };

export const ShopifyAdminApp: React.FC<AdminStudioProps> = (props) => (
  <AdminStudio {...props} />
);

export default AdminStudio;
